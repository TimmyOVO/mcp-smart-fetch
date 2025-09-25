use mcp_smart_fetch::{AppConfig, SmartFetchService};
use std::path::PathBuf;
use tokio::fs;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 创建示例文档
    let sample_content = r#"# 人工智能技术发展报告

## 概述

人工智能（AI）技术在过去几年中取得了突飞猛进的发展。从机器学习到深度学习，从自然语言处理到计算机视觉，AI技术正在改变我们的生活和工作方式。

## 主要技术进展

### 机器学习
机器学习作为AI的核心技术，已经在各个领域得到广泛应用。通过算法让计算机从数据中学习模式，无需明确编程即可做出决策。

### 深度学习
深度学习是机器学习的一个子集，使用多层神经网络来模拟人脑的工作方式。在图像识别、语音识别等领域取得了突破性进展。

### 自然语言处理
NLP技术让计算机能够理解和生成人类语言。从简单的文本分类到复杂的对话系统，NLP技术不断进步。

## 应用领域

### 医疗健康
AI在医疗诊断、药物研发、个性化治疗等方面发挥着重要作用，提高了医疗效率和准确性。

### 金融服务
在风险评估、欺诈检测、算法交易等领域，AI技术帮助金融机构做出更好的决策。

### 智能制造
AI技术正在改变制造业，通过预测性维护、质量控制和供应链优化来提高生产效率。

## 未来展望

随着技术的不断进步，AI将在更多领域发挥作用，但同时也需要关注伦理问题和监管框架的建立。

## 结论

人工智能技术正在深刻改变我们的世界，正确理解和应用这些技术对于未来发展至关重要。
"#;

    let sample_file = "sample_document.md";
    fs::write(sample_file, sample_content).await?;

    // 加载配置
    let config_path = PathBuf::from("config/config.toml");
    let config = AppConfig::load(&config_path)?;

    // 创建服务实例
    let service = SmartFetchService::new(config)?;

    println!("🚀 智能文档内容提取服务演示");
    println!("{}", "=".repeat(50));

    // 示例1：从文件提取内容
    println!("\n📄 示例1：从文件提取内容");
    println!("{}", "-".repeat(30));

    match service
        .extract_content(&PathBuf::from(sample_file), None)
        .await
    {
        Ok(result) => {
            println!("✅ 提取成功：\n");
            println!("{}", result);
        }
        Err(e) => {
            println!("⚠️  提取失败（可能需要配置API密钥）：{}", e);
        }
    }

    // 示例2：从文本提取内容
    println!("\n📝 示例2：从文本提取内容");
    println!("{}", "-".repeat(30));

    let text_content = "Rust是一种系统编程语言，注重安全、速度和并发性。它由Mozilla研究院开发，旨在提供C++的性能，同时保证内存安全。";
    let custom_prompt = "请总结这段关于Rust编程语言的描述";

    match service
        .extract_from_text(text_content, Some(custom_prompt.to_string()))
        .await
    {
        Ok(result) => {
            println!("✅ 提取成功：\n");
            println!("{}", result);
        }
        Err(e) => {
            println!("⚠️  提取失败（可能需要配置API密钥）：{}", e);
        }
    }

    // 示例3：使用不同的模板
    println!("\n🎨 示例3：使用总结模板");
    println!("{}", "-".repeat(30));

    let _summary_prompt = "请为这篇关于AI的文章生成一个简短的总结";

    // 这里我们直接使用模板名称，具体实现中可以通过参数指定
    println!("📝 使用总结模板的功能需要进一步实现");

    // 清理示例文件
    fs::remove_file(sample_file).await?;

    println!("\n🎉 演示完成！");
    println!("\n💡 提示：");
    println!("- 请在 config/config.toml 中配置您的API密钥");
    println!("- 支持的环境变量：LLM_API_KEY, LLM_API_ENDPOINT, LLM_MODEL");
    println!("- 查看更多帮助：cargo run -- --help");

    Ok(())
}
