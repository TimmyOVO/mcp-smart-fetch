use mcp_smart_fetch::config::{AppConfig, LLMConfig};
use mcp_smart_fetch::document::{Document, DocumentProcessor};
use mcp_smart_fetch::prompt_template::{TemplateData, TemplateManager};
use std::collections::HashMap;
use std::path::PathBuf;

#[test]
fn test_app_config_default() {
    let config = AppConfig::default();
    assert!(config.llm.api_endpoint.contains("openai.com"));
    assert_eq!(config.llm.model, "gpt-4");
    assert_eq!(config.server.port, 8080);
}

#[test]
fn test_llm_config_validation() {
    let mut config = LLMConfig::default();
    assert!(AppConfig::validate_llm_config(&config).is_ok());

    config.model = "".to_string();
    assert!(AppConfig::validate_llm_config(&config).is_err());

    config.model = "gpt-4".to_string();
    config.temperature = Some(3.0);
    assert!(AppConfig::validate_llm_config(&config).is_err());
}

#[test]
fn test_document_processor_creation() {
    let processing_config = AppConfig::default().processing;
    assert!(processing_config
        .supported_formats
        .contains(&"txt".to_string()));
}

#[tokio::test]
async fn test_document_loading() {
    let test_content = "这是一个测试文档\n包含多行内容\n用于测试文档加载功能";

    let test_file = "test_document.txt";
    tokio::fs::write(test_file, test_content).await.unwrap();

    let processing_config = AppConfig::default().processing;
    let document_processor = DocumentProcessor::new(processing_config).unwrap();
    let result = document_processor.load_document(&PathBuf::from(test_file)).await;
    assert!(result.is_ok());

    let document = result.unwrap();
    assert_eq!(document.content, test_content);
    assert_eq!(document.metadata.line_count, 3);

    // 清理测试文件
    tokio::fs::remove_file(test_file).await.unwrap();
}

#[test]
fn test_template_manager_creation() {
    let templates_dir = PathBuf::from("templates");
    let result = TemplateManager::new(&templates_dir);
    assert!(result.is_ok());
}

#[test]
fn test_template_data_creation() {
    let mut metadata = HashMap::new();
    metadata.insert("test_key".to_string(), "test_value".to_string());

    let template_data = TemplateData {
        content: "测试内容".to_string(),
        custom_prompt: Some("自定义提示词".to_string()),
        metadata,
    };

    assert_eq!(template_data.content, "测试内容");
    assert!(template_data.custom_prompt.is_some());
    assert!(template_data.metadata.contains_key("test_key"));
}

#[test]
fn test_content_detection() {
    let txt_path = PathBuf::from("test.txt");
    let md_path = PathBuf::from("test.md");
    let unknown_path = PathBuf::from("test.unknown");

    assert_eq!(
        DocumentProcessor::detect_content_type(&txt_path).unwrap(),
        "text/plain"
    );
    assert_eq!(
        DocumentProcessor::detect_content_type(&md_path).unwrap(),
        "text/markdown"
    );
    assert_eq!(
        DocumentProcessor::detect_content_type(&unknown_path).unwrap(),
        "text/plain"
    );
}

#[test]
fn test_document_metadata_extraction() {
    let content = "# 标题\n\n这是一篇测试文档。\n包含多个段落。\n\n## 第二标题\n更多内容。";

    let metadata = DocumentProcessor::extract_metadata(content);

    assert_eq!(metadata.title, Some("标题".to_string()));
    assert_eq!(metadata.line_count, 7);
}

#[test]
fn test_content_preprocessing() {
    let processor = DocumentProcessor::new(AppConfig::default().processing).unwrap();

    let raw_content = "第一行\n\n\n第二行\r\n第三行\t制表符";
    let processed = processor.preprocess_content(raw_content).unwrap();

    // 应该移除多余空行，标准化换行符和制表符
    assert!(!processed.contains("\r\n"));
    assert!(!processed.contains("\t"));
}

#[test]
fn test_content_chunking() {
    let processor = DocumentProcessor::new(AppConfig::default().processing).unwrap();

    // 创建一个长文本
    let long_text = "A".repeat(5000);
    let chunks = processor.chunk_content(&long_text).unwrap();

    assert!(!chunks.is_empty());
    assert!(chunks.len() > 1);

    // 检查总长度保持不变
    let total_length: usize = chunks.iter().map(|c| c.len()).sum();
    assert_eq!(total_length, long_text.len());
}

#[test]
fn test_document_validation() {
    let processor = DocumentProcessor::new(AppConfig::default().processing).unwrap();

    // 测试空文档
    let empty_document = Document {
        path: PathBuf::new(),
        content: "".to_string(),
        content_type: "text/plain".to_string(),
        size_bytes: 0,
        metadata: Default::default(),
    };

    assert!(processor.validate_document(&empty_document).is_err());

    // 测试有效文档
    let valid_document = Document {
        path: PathBuf::from("test.txt"),
        content: "有效内容".to_string(),
        content_type: "text/plain".to_string(),
        size_bytes: 100,
        metadata: Default::default(),
    };

    assert!(processor.validate_document(&valid_document).is_ok());
}

#[test]
fn test_token_estimation() {
    let processor = DocumentProcessor::new(AppConfig::default().processing).unwrap();

    let english_text = "This is a test sentence with multiple words.";
    let chinese_text = "这是一个包含多个汉字的测试句子。";

    let english_tokens = processor.estimate_tokens(english_text);
    let chinese_tokens = processor.estimate_tokens(chinese_text);

    assert!(english_tokens > 0);
    assert!(chinese_tokens > 0);
}
