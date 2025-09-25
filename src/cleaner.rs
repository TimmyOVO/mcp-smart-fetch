use crate::config::CleaningConfig;
use crate::error::Result;
use regex::Regex;
use tracing_indicatif::indicatif_println;

/// 文档清理器
pub struct DocumentCleaner {
    config: CleaningConfig,
    base64_image_regex: Regex,
    binary_data_regex: Regex,
    html_tag_regex: Regex,
}

impl DocumentCleaner {
    /// 创建新的文档清理器
    #[tracing::instrument(level = "debug", skip(config), name = "初始化文档清理器")]
    pub fn new(config: CleaningConfig) -> Result<Self> {
        let base64_image_regex = Regex::new(r"data:image/[^;]+;base64,[A-Za-z0-9+/=]+")?;
        let binary_data_regex = Regex::new(r"[^\x20-\x7E\r\n\t\u4E00-\u9FFF]")?;
        let html_tag_regex = Regex::new(r"<[^>]*>")?;

        Ok(Self {
            config,
            base64_image_regex,
            binary_data_regex,
            html_tag_regex,
        })
    }

    /// 清理文档内容
    #[tracing::instrument(level = "debug", skip(self, content), name = "清理文档内容")]
    pub fn clean_content(&self, content: &str) -> Result<String> {
        if !self.config.enable_cleaning.unwrap_or(false) {
            return Ok(content.to_string());
        }

        let mut cleaned = content.to_string();

        // 1. 移除base64图片
        if self.config.remove_base64_images.unwrap_or(false) {
            cleaned = self.remove_base64_images(&cleaned);
        }

        // 2. 移除二进制数据
        if self.config.remove_binary_data.unwrap_or(false) {
            cleaned = self.remove_binary_data(&cleaned);
        }

        // 3. 移除HTML标签
        if self.config.remove_html_tags.unwrap_or(false) {
            cleaned = self.remove_html_tags(&cleaned);
        }

        // 4. 截断过长的字符串
        if let Some(max_length) = self.config.max_string_length {
            cleaned = self.truncate_long_strings(&cleaned, max_length);
        }

        // 5. 规范化空白字符
        if self.config.normalize_whitespace.unwrap_or(false) {
            cleaned = self.normalize_whitespace(&cleaned);
        }

        // 6. 应用自定义清理模式
        if let Some(custom_patterns) = &self.config.custom_patterns {
            cleaned = self.apply_custom_patterns(&cleaned, custom_patterns);
        }

        // 添加内容清理完成提示
        let stats = self.get_cleaning_stats(content, &cleaned);
        if stats.removed_chars > 0 {
            indicatif_println!("✅ 内容清理完成 (移除{}字符，清理率{:.1}%)",
                stats.removed_chars,
                stats.removal_ratio * 100.0);
        }

        Ok(cleaned)
    }

    /// 移除base64编码的图片
    fn remove_base64_images(&self, content: &str) -> String {
        let cleaned = self.base64_image_regex.replace_all(content, "");
        cleaned.to_string()
    }

    /// 移除二进制数据
    fn remove_binary_data(&self, content: &str) -> String {
        let cleaned = self.binary_data_regex.replace_all(content, " ");
        cleaned.to_string()
    }

    /// 移除HTML标签
    fn remove_html_tags(&self, content: &str) -> String {
        let cleaned = self.html_tag_regex.replace_all(content, "");
        cleaned.to_string()
    }

    /// 截断过长的字符串
    fn truncate_long_strings(&self, content: &str, max_length: usize) -> String {
        content
            .chars()
            .collect::<Vec<_>>()
            .chunks(max_length)
            .map(|chunk| chunk.iter().collect::<String>())
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// 规范化空白字符
    fn normalize_whitespace(&self, content: &str) -> String {
        let lines: Vec<&str> = content.lines().collect();
        let mut result = Vec::new();
        let mut in_code_block = false;

        for line in lines {
            // 检查是否在代码块中
            if line.trim().starts_with("```") {
                in_code_block = !in_code_block;
                result.push(line.to_string());
                continue;
            }

            if in_code_block {
                // 在代码块中，保留原始格式
                result.push(line.to_string());
            } else {
                // 不在代码块中，规范化空白字符
                let normalized_line = line.split_whitespace().collect::<Vec<_>>().join(" ");
                result.push(normalized_line);
            }
        }

        result.join("\n")
    }

    /// 应用自定义清理模式
    fn apply_custom_patterns(&self, content: &str, patterns: &[String]) -> String {
        let mut cleaned = content.to_string();

        for pattern in patterns {
            if let Ok(regex) = Regex::new(pattern) {
                cleaned = regex.replace_all(&cleaned, "").to_string();
            }
        }

        cleaned
    }

    /// 获取清理统计信息
    pub fn get_cleaning_stats(&self, original: &str, cleaned: &str) -> CleaningStats {
        CleaningStats {
            original_length: original.len(),
            cleaned_length: cleaned.len(),
            removed_chars: original.len() - cleaned.len(),
            removal_ratio: (original.len() - cleaned.len()) as f64 / original.len() as f64,
        }
    }
}

/// 清理统计信息
#[derive(Debug, Clone)]
pub struct CleaningStats {
    pub original_length: usize,
    pub cleaned_length: usize,
    pub removed_chars: usize,
    pub removal_ratio: f64,
}

/// 预定义的清理模式
pub struct CleaningPatterns;

impl CleaningPatterns {
    /// 移除常见的噪音模式
    pub fn noise_patterns() -> Vec<String> {
        vec![
            // 移除连续的标点符号
            r"[.]{3,}".to_string(),
            r"[!]{2,}".to_string(),
            r"[?]{2,}".to_string(),
            // 移除URL中的参数
            r"\?[^&]*&[^&]*".to_string(),
            // 移除无意义的数字序列
            r"\b\d{10,}\b".to_string(),
            // 移除过长的字母序列（可能是乱码）
            r"\b[a-zA-Z]{20,}\b".to_string(),
        ]
    }

    /// 移除编程相关的噪音
    pub fn code_patterns() -> Vec<String> {
        vec![
            // 移除十六进制颜色码
            r"#[0-9a-fA-F]{6}".to_string(),
            // 移除CSS类名
            r"\.[a-zA-Z][a-zA-Z0-9_-]*".to_string(),
        ]
    }

    /// 移除日志相关的噪音
    pub fn log_patterns() -> Vec<String> {
        vec![
            // 移除时间戳
            r"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}".to_string(),
            // 移除日志级别
            r"\b(DEBUG|INFO|WARN|ERROR|TRACE)\b".to_string(),
            // 移除IP地址
            r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b".to_string(),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_remove_base64_images() {
        let config = CleaningConfig::default();
        let cleaner = DocumentCleaner::new(config).unwrap();

        let content = r#"这是一些文本
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==
更多文本"#;

        let cleaned = cleaner.remove_base64_images(content);
        assert!(!cleaned.contains("data:image/png;base64,"));
        assert!(cleaned.contains("这是一些文本"));
        assert!(cleaned.contains("更多文本"));
    }

    #[test]
    fn test_remove_binary_data() {
        let config = CleaningConfig::default();
        let cleaner = DocumentCleaner::new(config).unwrap();

        let content = "正常文本\x00\x01\x02更多文本";
        let cleaned = cleaner.remove_binary_data(content);
        assert!(!cleaned.contains("\x00"));
        assert!(!cleaned.contains("\x01"));
        assert!(!cleaned.contains("\x02"));
    }

    #[test]
    fn test_remove_html_tags() {
        let config = CleaningConfig {
            remove_html_tags: Some(true),
            ..Default::default()
        };
        let cleaner = DocumentCleaner::new(config).unwrap();

        let content = r#"<p>这是一个<a href="test">链接</a></p>"#;
        let cleaned = cleaner.remove_html_tags(content);
        assert!(!cleaned.contains("<"));
        assert!(!cleaned.contains(">"));
        assert!(cleaned.contains("这是一个链接"));
    }

    #[test]
    fn test_truncate_long_strings() {
        let config = CleaningConfig::default();
        let cleaner = DocumentCleaner::new(config).unwrap();

        let long_string = "a".repeat(1500);
        let cleaned = cleaner.truncate_long_strings(&long_string, 1000);
        assert!(cleaned.contains('\n'));
    }

    #[test]
    fn test_normalize_whitespace() {
        let config = CleaningConfig::default();
        let cleaner = DocumentCleaner::new(config).unwrap();

        let content = "  多个    空格\n\n换行符  ";
        let cleaned = cleaner.normalize_whitespace(content);
        assert_eq!(cleaned, "多个 空格\n\n换行符");
    }

    #[test]
    fn test_cleaning_stats() {
        let config = CleaningConfig::default();
        let cleaner = DocumentCleaner::new(config).unwrap();

        let original = "data:image/png;base64,abc123正常文本";
        let cleaned = cleaner.remove_base64_images(original);

        let stats = cleaner.get_cleaning_stats(original, &cleaned);
        assert_eq!(stats.original_length, original.len());
        assert_eq!(stats.cleaned_length, cleaned.len());
        assert!(stats.removed_chars > 0);
        assert!(stats.removal_ratio > 0.0);
    }
}