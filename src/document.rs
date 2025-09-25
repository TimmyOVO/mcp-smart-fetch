use crate::cleaner::DocumentCleaner;
use crate::config::ProcessingConfig;
use crate::error::{Result, SmartFetchError};
use std::fs;
use std::path::{Path, PathBuf};
use tracing_indicatif::indicatif_println;

#[derive(Debug, Clone)]
pub struct Document {
    pub path: PathBuf,
    pub content: String,
    pub content_type: String,
    pub size_bytes: usize,
    pub metadata: DocumentMetadata,
}

#[derive(Debug, Clone, Default)]
pub struct DocumentMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub created_at: Option<String>,
    pub modified_at: Option<String>,
    pub word_count: usize,
    pub line_count: usize,
}

pub struct DocumentProcessor {
    config: ProcessingConfig,
    cleaner: Option<DocumentCleaner>,
}

impl DocumentProcessor {
    #[tracing::instrument(level = "debug", skip(config), name = "初始化文档处理器")]
    pub fn new(config: ProcessingConfig) -> Result<Self> {
        let cleaner = if let Some(cleaning_config) = &config.cleaning {
            if cleaning_config.enable_cleaning.unwrap_or(false) {
                Some(DocumentCleaner::new(cleaning_config.clone())?)
            } else {
                None
            }
        } else {
            None
        };

        Ok(Self {
            config,
            cleaner,
        })
    }

    #[tracing::instrument(level = "info", skip(self), name = "加载文档文件")]
    pub async fn load_document(&self, path: &Path) -> Result<Document> {
        if !path.exists() {
            return Err(SmartFetchError::DocumentError(format!(
                "文件不存在: {:?}",
                path
            )));
        }

        let _file_name = path.file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("未知文件");

        let metadata = fs::metadata(path)
            .map_err(|e| SmartFetchError::DocumentError(format!("无法读取文件元数据: {}", e)))?;

        if metadata.len() > (10 * 1024 * 1024) {
            return Err(SmartFetchError::DocumentError(
                "文件大小超过10MB限制".to_string(),
            ));
        }

        let content = fs::read_to_string(path)
            .map_err(|e| SmartFetchError::DocumentError(format!("无法读取文件内容: {}", e)))?;

        let content_type = Self::detect_content_type(path)?;
        let document_metadata = Self::extract_metadata(&content);

        // 添加文档加载完成提示
        indicatif_println!("✅ 文档加载成功: {} ({} 字符)",
            path.file_name().and_then(|name| name.to_str()).unwrap_or("未知文件"),
            content.len());

        Ok(Document {
            path: path.to_path_buf(),
            content,
            content_type,
            size_bytes: metadata.len() as usize,
            metadata: document_metadata,
        })
    }

    pub fn detect_content_type(path: &Path) -> Result<String> {
        let extension = path.extension().and_then(|ext| ext.to_str()).unwrap_or("");

        match extension.to_lowercase().as_str() {
            "txt" => Ok("text/plain".to_string()),
            "md" => Ok("text/markdown".to_string()),
            "json" => Ok("application/json".to_string()),
            "yaml" | "yml" => Ok("text/yaml".to_string()),
            "toml" => Ok("text/toml".to_string()),
            "xml" => Ok("application/xml".to_string()),
            "csv" => Ok("text/csv".to_string()),
            _ => Ok("text/plain".to_string()),
        }
    }

    pub fn extract_metadata(content: &str) -> DocumentMetadata {
        let word_count = content.split_whitespace().count();
        let line_count = content.lines().count();

        // 尝试从Markdown文件中提取标题
        let title = content
            .lines()
            .find(|line| line.starts_with('#'))
            .map(|line| line.trim_start_matches('#').trim().to_string());

        DocumentMetadata {
            title,
            author: None,
            created_at: None,
            modified_at: None,
            word_count,
            line_count,
        }
    }

    #[tracing::instrument(level = "debug", skip(self, content), name = "预处理文档内容")]
    pub fn preprocess_content(&self, content: &str) -> Result<String> {
        if !self.config.enable_preprocessing.unwrap_or(true) {
            return Ok(content.to_string());
        }

        // 预处理文档内容

        let mut processed = content.to_string();

        // 第一步：文档清理
        if let Some(cleaner) = &self.cleaner {
            // pb.set_message("🧹 清理文档内容...");
            processed = cleaner.clean_content(&processed)?;
            // pb.set_position((content.len() / 4) as u64);
        }

        // 第二步：移除多余的空行
        // pb.set_message("🔧 移除多余空行...");
        processed = processed
            .lines()
            .filter(|line| !line.trim().is_empty())
            .collect::<Vec<_>>()
            .join("\n\n");
        // pb.set_position((content.len() / 2) as u64);

        // 第三步：清理特殊字符
        // pb.set_message("🔧 清理特殊字符...");
        processed = processed.replace("\r\n", "\n");
        processed = processed.replace('\t', "    ");
        // pb.set_position((content.len() * 3 / 4) as u64);

        // 第四步：移除BOM标记
        if processed.starts_with('\u{FEFF}') {
            // pb.set_message("🔧 移除BOM标记...");
            processed = processed[3..].to_string();
        }

        // 添加预处理完成提示
        let size_reduction = if content.len() > processed.len() {
            format!(" (压缩了{}字符)", content.len() - processed.len())
        } else {
            String::new()
        };
        indicatif_println!("✅ 预处理完成{}", size_reduction);

        Ok(processed)
    }

    #[tracing::instrument(level = "debug", skip(self, content), name = "分块处理文档")]
    pub fn chunk_content(&self, content: &str) -> Result<Vec<String>> {
        let chunk_size = self.config.chunk_size.unwrap_or(4000);

        if content.len() <= chunk_size {
            return Ok(vec![content.to_string()]);
        }

        // 分块处理长文档

        let mut chunks = Vec::new();
        let mut start = 0;

        while start < content.len() {
            let end = (start + chunk_size).min(content.len());

            // 尝试在句子边界处分割
            let chunk_end = if end < content.len() {
                content[start..end]
                    .rfind(|c| ['.', '!', '?', '\n'].contains(&c))
                    .map(|pos| start + pos + 1)
                    .unwrap_or(end)
            } else {
                end
            };

            let chunk = content[start..chunk_end].trim().to_string();
            if !chunk.is_empty() {
                chunks.push(chunk);
            }

            start = chunk_end;
            // pb.set_position(start as u64);
        }

        // 添加分块处理完成提示
        if chunks.len() > 1 {
            indicatif_println!("✅ 分块完成，共{}个块 (平均{}字符/块)",
                chunks.len(),
                content.len() / chunks.len());
        }

        Ok(chunks)
    }

    pub fn validate_document(&self, document: &Document) -> Result<()> {
        if document.content.is_empty() {
            return Err(SmartFetchError::ValidationError("文档内容为空".to_string()));
        }

        if let Some(max_size_mb) = self.config.max_document_size_mb {
            let max_size_bytes = (max_size_mb * 1024.0 * 1024.0) as usize;
            if document.size_bytes > max_size_bytes {
                return Err(SmartFetchError::ValidationError(format!(
                    "文档大小超过限制: {}MB > {}MB",
                    document.size_bytes as f64 / (1024.0 * 1024.0),
                    max_size_mb
                )));
            }
        }

        let extension = document.path.extension().and_then(|ext| ext.to_str());
        if let Some(ext) = extension {
            if !self.config.supported_formats.contains(&ext.to_lowercase()) {
                return Err(SmartFetchError::ValidationError(format!(
                    "不支持的文件格式: {}",
                    ext
                )));
            }
        }

        Ok(())
    }

    pub fn get_document_stats(&self, document: &Document) -> DocumentStats {
        DocumentStats {
            size_bytes: document.size_bytes,
            word_count: document.metadata.word_count,
            line_count: document.metadata.line_count,
            content_type: document.content_type.clone(),
            estimated_tokens: self.estimate_tokens(&document.content),
        }
    }

    pub fn estimate_tokens(&self, content: &str) -> usize {
        // 简单的token估算：通常1个token ≈ 4个字符（英文）或 1-2个汉字
        let char_count = content.chars().count();
        char_count / 4
    }
}

#[derive(Debug)]
pub struct DocumentStats {
    pub size_bytes: usize,
    pub word_count: usize,
    pub line_count: usize,
    pub content_type: String,
    pub estimated_tokens: usize,
}
