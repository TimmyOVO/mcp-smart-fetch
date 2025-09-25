use mcp_smart_fetch::{AppConfig, DocumentProcessor, CleaningPatterns};
use std::io::{Read, Write};
use std::path::PathBuf;
use tempfile::NamedTempFile;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化日志
    tracing_subscriber::fmt().init();

    // 解析命令行参数
    let args: Vec<String> = std::env::args().collect();

    // 显示帮助信息
    if args.contains(&"-h".to_string()) || args.contains(&"--help".to_string()) {
        println!("🧹 mcp-smart-fetch 文档清理工具");
        println!("{}", "=".repeat(50));
        println!("\n使用方法：");
        println!("  cargo run --example cleaning_demo [选项] [输入文件] [输出文件]");
        println!("\n选项：");
        println!("  -h, --help     显示帮助信息");
        println!("\n参数：");
        println!("  输入文件        要清理的文档文件路径（可选，不提供时使用演示内容）");
        println!("  输出文件        清理后的内容保存路径（可选，不提供时输出到控制台）");
        println!("\n示例：");
        println!("  cargo run --example cleaning_demo");
        println!("  cargo run --example cleaning_demo input.txt");
        println!("  cargo run --example cleaning_demo input.txt output.txt");
        println!("\n支持的文件格式：.txt, .md, .json, .yaml, .yml, .toml, .xml, .csv");
        return Ok(());
    }

    println!("🧹 mcp-smart-fetch 文档清理工具");
    println!("{}", "=".repeat(50));

    let (input_content, _input_source) = if args.len() > 1 && !args[1].starts_with('-') {
        // 从文件读取
        let file_path = PathBuf::from(&args[1]);
        if !file_path.exists() {
            return Err(anyhow::anyhow!("文件不存在: {}", file_path.display()));
        }

        let mut file = std::fs::File::open(&file_path)?;
        let mut content = String::new();
        file.read_to_string(&mut content)?;

        (content, format!("文件: {}", file_path.display()))
    } else {
        // 使用默认演示内容
        let demo_content = r#"# 智能文档清理演示

## 1. 正常文本内容
这是一段正常的文本内容，用于对比清理效果。

## 2. 包含base64编码图片的内容
这里有一个base64编码的PNG图片：
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==

这里还有一个JPEG图片：
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=

## 3. 包含HTML标签的内容
<div class="content">
    <h2>标题</h2>
    <p>这是一个段落，包含<a href="https://example.com">链接</a>和<strong>粗体文本</strong>。</p>
    <ul>
        <li>列表项1</li>
        <li>列表项2</li>
    </ul>
</div>

## 4. 包含二进制数据的内容
正常文本内容\x00\x01\x02\x03\x04\x05更多文本内容

## 5. 包含编程相关噪音的内容
CSS颜色: #FF5733 和 #00FF00
类名: .button-primary 和 .container
属性: id="main" class="content" data-value="123"

## 6. 包含日志信息的文本
2024-01-15 10:30:45 INFO: 应用程序启动
2024-01-15 10:30:46 ERROR: 连接数据库失败
访问日志: 192.168.1.100 - - [15/Jan/2024:10:30:45 +0000] "GET /api HTTP/1.1" 200 1234

## 7. 包含噪音模式的内容
这是正常的文本...
这里有很多省略号................
还有多个感叹号！！！！
以及多个问号？？？？

长数字序列: 12345678901234567890
长字母序列: abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz

## 8. 包含不规范空白的内容
    这里有很多    空格    和      制表符

换行符也很	不规范


## 9. 总结
清理功能应该能够智能地识别和移除以上各种类型的噪音内容，同时保留有意义的文本信息。

演示结束！
"#;
        (demo_content.to_string(), "内置演示内容".to_string())
    };

      // 限制显示的原始内容长度，避免输出过多
    let _display_content = if input_content.len() > 500 {
        format!("{}...\n[内容过长，已截断显示，完整内容长度: {} 字符]",
                &input_content[..500], input_content.len())
    } else {
        input_content.clone()
    };

      // 创建配置文件，启用清理功能
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
max_string_length = 1000
remove_html_tags = true
normalize_whitespace = true
custom_patterns = [
    # 移除连续的标点符号
    "[.]{3,}",
    "[!]{2,}",
    "[?]{2,}",
    # 移除长数字序列
    "\\b\\d{10,}\\b",
    # 移除长字母序列
    "\\b[a-zA-Z]{20,}\\b"
]
"#;

    let mut config_file = NamedTempFile::new()?;
    config_file.write_all(config_content.as_bytes())?;

    // 加载配置
    let config = AppConfig::load(&config_file.path().to_path_buf())?;

    // 创建文档处理器
    let processor = DocumentProcessor::new(config.processing)?;

    println!("\n🧹 开始清理文档内容...");

    // 执行清理
    let cleaned_content = processor.preprocess_content(&input_content)?;

    // 确定输出文件路径
    let output_file_path = if args.len() > 2 && !args[2].starts_with('-') {
        Some(PathBuf::from(&args[2]))
    } else {
        None
    };

    // 如果有输出文件路径，保存到文件
    if let Some(output_path) = &output_file_path {
        let mut output_file = std::fs::File::create(output_path)?;
        output_file.write_all(cleaned_content.as_bytes())?;
        println!("\n✅ 清理完成！清理后的内容已保存到: {}", output_path.display());
    } else {
        // 否则输出到控制台
        println!("\n✅ 清理完成！清理后的文档内容：");
        println!("{}", "-".repeat(50));
        println!("{}", cleaned_content);
        println!("{}", "-".repeat(50));
    }

    // 显示统计信息
    let original_len = input_content.len();
    let cleaned_len = cleaned_content.len();
    let removed_chars = original_len - cleaned_len;
    let removal_ratio = removed_chars as f64 / original_len as f64 * 100.0;

    println!("\n📊 清理统计信息：");
    println!("   原始长度: {} 字符", original_len);
    println!("   清理后长度: {} 字符", cleaned_len);
    println!("   移除字符: {} 字符", removed_chars);
    println!("   清理比例: {:.1}%", removal_ratio);

    // 如果用户没有提供文件参数，显示使用说明
    if args.len() == 1 {
        println!("\n💡 使用方法：");
        println!("   cargo run --example cleaning_demo -- <输入文件> [输出文件]");
        println!("   例如: cargo run --example cleaning_demo -- my_document.txt");
        println!("         cargo run --example cleaning_demo -- input.txt output.txt");
        println!("   不提供文件参数时将使用内置演示内容");
    }

    // 演示预定义清理模式
    println!("\n🔧 预定义清理模式演示：");
    println!("   噪音模式: {} 种", CleaningPatterns::noise_patterns().len());
    println!("   代码模式: {} 种", CleaningPatterns::code_patterns().len());
    println!("   日志模式: {} 种", CleaningPatterns::log_patterns().len());

    println!("\n🎉 演示完成！");
    println!("\n💡 功能特点：");
    println!("   ✅ 自动移除base64编码图片");
    println!("   ✅ 清理二进制数据和无用字符");
    println!("   ✅ 移除HTML标签");
    println!("   ✅ 规范化空白字符");
    println!("   ✅ 支持自定义清理规则");
    println!("   ✅ 提供预定义清理模式");
    println!("   ✅ 显示清理进度和统计信息");

    Ok(())
}