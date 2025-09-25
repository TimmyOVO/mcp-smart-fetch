use std::io::Write;
use tempfile::NamedTempFile;

#[tokio::test]
async fn test_document_cleaning_integration() {
    // 创建测试配置
    let config_content = r#"
templates_dir = "templates"
default_template = "default"

[server]
host = "127.0.0.1"
port = 8080

[llm]
model = "test-model"
api_endpoint = "https://api.test.com/v1/chat/completions"
api_key = "test-key"
max_tokens = 1000
temperature = 0.7
timeout_seconds = 30

[processing]
chunk_size = 1000
enable_preprocessing = true
max_document_size_mb = 10
supported_formats = ["txt", "md", "json"]

[processing.cleaning]
enable_cleaning = true
remove_base64_images = true
remove_binary_data = true
max_string_length = 500
remove_html_tags = true
normalize_whitespace = true
"#;

    let mut config_file = NamedTempFile::new().unwrap();
    config_file.write_all(config_content.as_bytes()).unwrap();

    // 创建包含各种噪音的测试文档
    let test_content = r#"# 测试文档清理功能

这是正常的文本内容。

## 包含base64图片的内容
这里有一张图片：data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==

## 包含HTML标签的内容
<p>这是一个<a href="https://example.com">链接</a>和<strong>粗体文本</strong></p>

## 包含二进制数据的内容
正常文本\x00\x01\x02更多内容

## 包含过长字符串的内容
这是一个非常非常长的字符串：" + &"a".repeat(600).as_str() + r#"

## 包含多余空格的内容
    多个    空格      和       制表符

文档结束。
"#;

    let mut doc_file = NamedTempFile::new().unwrap();
    doc_file.write_all(test_content.as_bytes()).unwrap();

    // 测试服务初始化
    let config = mcp_smart_fetch::AppConfig::load(&config_file.path().to_path_buf()).unwrap();
    let service = mcp_smart_fetch::SmartFetchService::new(config).unwrap();

    // 测试文档处理（包含清理）
    let processing_config = mcp_smart_fetch::AppConfig::default().processing;
    let document_processor = mcp_smart_fetch::DocumentProcessor::new(processing_config).unwrap();
    let document = document_processor.load_document(&doc_file.path()).await.unwrap();

    // 测试预处理（包含清理）
    let processor = mcp_smart_fetch::DocumentProcessor::new(service.config().processing.clone()).unwrap();
    let cleaned_content = processor.preprocess_content(&document.content).unwrap();

    // 验证清理效果
    assert!(!cleaned_content.contains("data:image/png;base64,"), "应该移除base64图片");
    assert!(!cleaned_content.contains("<p>"), "应该移除HTML标签");
    assert!(!cleaned_content.contains("<a href="), "应该移除HTML标签");
    assert!(!cleaned_content.contains("\x00"), "应该移除二进制数据");
    assert!(!cleaned_content.contains("\x01"), "应该移除二进制数据");
    assert!(!cleaned_content.contains("\x02"), "应该移除二进制数据");

    // 验证正常内容保留
    assert!(cleaned_content.contains("测试文档清理功能"), "应该保留正常文本");
    assert!(cleaned_content.contains("这是正常的文本内容"), "应该保留正常文本");
    assert!(cleaned_content.contains("链接"), "应该保留链接文本");
    assert!(cleaned_content.contains("粗体文本"), "应该保留粗体文本");

    // 验证空格规范化
    let lines: Vec<&str> = cleaned_content.lines().collect();
    let spaces_lines: Vec<&str> = lines.iter()
        .filter(|line| line.contains("多个") && line.contains("空格"))
        .cloned()
        .collect();
    assert!(!spaces_lines.is_empty(), "应该有空格规范化的行");

    println!("✅ 文档清理集成测试通过！");
}

#[tokio::test]
async fn test_cleaning_with_custom_patterns() {
    let mut config = mcp_smart_fetch::AppConfig::default();

    // 设置自定义清理模式
    if let Some(cleaning) = &mut config.processing.cleaning {
        cleaning.custom_patterns = Some(vec![
            r"\b\d{10,}\b".to_string(), // 移除长数字序列
            r"\b[a-zA-Z]{20,}\b".to_string(), // 移除长字母序列
        ]);
    }

    let processor = mcp_smart_fetch::DocumentProcessor::new(config.processing).unwrap();

    let test_content = r#"正常文本
12345678901234567890 # 长数字序列
abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz # 长字母序列
更多正常文本"#;

    let cleaned = processor.preprocess_content(test_content).unwrap();

    assert!(!cleaned.contains("12345678901234567890"), "应该移除长数字序列");
    assert!(!cleaned.contains("abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"), "应该移除长字母序列");
    assert!(cleaned.contains("正常文本"), "应该保留正常文本");

    println!("✅ 自定义清理模式测试通过！");
}

#[tokio::test]
async fn test_cleaning_disabled() {
    let mut config = mcp_smart_fetch::AppConfig::default();

    // 禁用清理功能
    if let Some(cleaning) = &mut config.processing.cleaning {
        cleaning.enable_cleaning = Some(false);
    }

    let processor = mcp_smart_fetch::DocumentProcessor::new(config.processing).unwrap();

    let test_content = r#"这是正常文本
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==
<p>HTML标签</p>"#;

    let cleaned = processor.preprocess_content(test_content).unwrap();

    // 当清理被禁用时，应该保留base64图片和HTML标签
    assert!(cleaned.contains("data:image/png;base64,"), "禁用清理时应保留base64图片");
    assert!(cleaned.contains("<p>"), "禁用清理时应保留HTML标签");
    assert!(cleaned.contains("这是正常文本"), "应该保留正常文本");

    println!("✅ 清理功能禁用测试通过！");
}

#[tokio::test]
async fn test_cleaning_stats() {
    let config = mcp_smart_fetch::AppConfig::default();
    let processor = mcp_smart_fetch::DocumentProcessor::new(config.processing).unwrap();

    let original = r#"这是一些文本
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==
更多文本"#;

    let cleaned = processor.preprocess_content(original).unwrap();

    // 验证清理后内容变短
    assert!(cleaned.len() < original.len(), "清理后内容应该变短");

    println!("✅ 清理统计测试通过！原始长度: {}, 清理后长度: {}", original.len(), cleaned.len());
}

#[tokio::test]
async fn test_predefined_cleaning_patterns() {
    // 测试预定义的清理模式
    let noise_patterns = mcp_smart_fetch::CleaningPatterns::noise_patterns();
    let code_patterns = mcp_smart_fetch::CleaningPatterns::code_patterns();
    let log_patterns = mcp_smart_fetch::CleaningPatterns::log_patterns();

    assert!(!noise_patterns.is_empty(), "噪音模式不应该为空");
    assert!(!code_patterns.is_empty(), "代码模式不应该为空");
    assert!(!log_patterns.is_empty(), "日志模式不应该为空");

    // 验证具体模式
    assert!(noise_patterns.iter().any(|p| p.contains(r"\d{10,}")), "应该包含长数字模式");
    assert!(code_patterns.iter().any(|p| p.contains(r"#[0-9a-fA-F]{6}")), "应该包含颜色码模式");
    assert!(log_patterns.iter().any(|p| p.contains(r"\b(DEBUG|INFO|WARN|ERROR|TRACE)\b")), "应该包含日志级别模式");

    println!("✅ 预定义清理模式测试通过！");
}