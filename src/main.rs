use clap::{Parser, Subcommand};
use mcp_smart_fetch::{AppConfig, McpSmartFetchServer, SmartFetchService};
use std::path::PathBuf;
use tracing::info;
use tracing_indicatif::{IndicatifLayer, indicatif_println};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Parser)]
#[command(name = "mcp-smart-fetch")]
#[command(about = "智能文档内容提取服务")]
struct Args {
    #[command(subcommand)]
    command: Commands,

    /// 配置文件路径
    #[arg(short, long, default_value = "config/config.toml")]
    config: PathBuf,

    /// 详细输出
    #[arg(short, long)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// 从文件提取内容
    Extract {
        /// 输入文件路径
        input: PathBuf,
        /// 自定义提示词
        #[arg(short, long)]
        prompt: Option<String>,
        /// 输出文件路径
        #[arg(short, long)]
        output: Option<PathBuf>,
    },
    /// 从文本提取内容
    ExtractText {
        /// 输入文本
        #[arg(short, long)]
        text: String,
        /// 自定义提示词
        #[arg(short, long)]
        prompt: Option<String>,
        /// 输出文件路径
        #[arg(short, long)]
        output: Option<PathBuf>,
    },
    /// 启动服务器模式
    Serve {
        /// 监听端口
        #[arg(short, long, default_value = "8080")]
        port: u16,
    },
    /// 显示支持的环境变量
    EnvVars,
}

#[tokio::main]
#[tracing::instrument(level = "info")]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    // 初始化日志，集成 tracing-indicatif
    let indicatif_layer = IndicatifLayer::new();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| if args.verbose {
                    "mcp_smart_fetch=debug,tower_http=debug".into()
                } else {
                    "mcp_smart_fetch=info,tower_http=info".into()
                })
        )
        .with(tracing_subscriber::fmt::layer().compact().without_time())
        .with(indicatif_layer)
        .init();

    // 加载配置
    let config = AppConfig::load(&args.config)?;
    info!("配置加载成功");

    // 显示配置信息 (在 verbose 模式下)
    if args.verbose {
        info!("{}", config.display_info());
    }

    // 创建服务实例
    let service = SmartFetchService::new(config)?;
    info!("服务初始化成功");

    match args.command {
        Commands::Extract {
            input,
            prompt,
            output,
        } => {
            info!("开始提取文件内容: {:?}", input);

            // 直接调用服务，tracing会自动显示进度条
            let result = service.extract_content(&input, prompt).await;

            match result {
                Ok(result) => {
                    indicatif_println!("✅ 内容提取成功");
                    if let Some(output_path) = output {
                        tokio::fs::write(&output_path, result).await?;
                        indicatif_println!("✅ 结果已保存到: {:?}", output_path);
                    } else {
                        indicatif_println!("📋 提取结果:\n{}", result);
                    }
                }
                Err(e) => {
                    indicatif_println!("❌ 内容提取失败: {}", e);
                    return Err(e.into());
                }
            }
        }
        Commands::ExtractText {
            text,
            prompt,
            output,
        } => {
            info!("开始提取文本内容");

            // 直接调用服务，tracing会自动显示进度条
            let result = service.extract_from_text(&text, prompt).await;

            match result {
                Ok(result) => {
                    indicatif_println!("✅ 内容提取成功");
                    if let Some(output_path) = output {
                        tokio::fs::write(&output_path, result).await?;
                        indicatif_println!("✅ 结果已保存到: {:?}", output_path);
                    } else {
                        indicatif_println!("📋 提取结果:\n{}", result);
                    }
                }
                Err(e) => {
                    indicatif_println!("❌ 内容提取失败: {}", e);
                    return Err(e.into());
                }
            }
        }
        Commands::Serve { port: _ } => {
            info!("启动 MCP 服务器模式");
            run_mcp_server(service).await?;
        }
        Commands::EnvVars => {
            show_env_variables();
        }
    }

    Ok(())
}

fn show_env_variables() {
    use mcp_smart_fetch::AppConfig;

    println!("📋 mcp-smart-fetch 支持的环境变量");
    println!("{}", "=".repeat(60));

    let env_vars = AppConfig::get_env_variables_info();

    println!("\n🔧 LLM 配置:");
    for (var, desc) in env_vars.iter().take(6) {
        println!("   {:<30} - {}", var, desc);
    }

    println!("\n🌐 服务器配置:");
    for (var, desc) in env_vars.iter().skip(6).take(4) {
        println!("   {:<30} - {}", var, desc);
    }

    println!("\n📄 处理配置:");
    for (var, desc) in env_vars.iter().skip(10).take(5) {
        println!("   {:<30} - {}", var, desc);
    }

    println!("\n🧹 清理配置:");
    for (var, desc) in env_vars.iter().skip(15) {
        println!("   {:<30} - {}", var, desc);
    }

    println!("\n💡 使用说明:");
    println!("   • 所有环境变量都是可选的");
    println!("   • 环境变量优先级高于配置文件");
    println!("   • 布尔值支持: true/false, 1/0, yes/no, on/off");
    println!("   • 使用 .env 文件或直接设置环境变量");

    println!("\n📝 示例:");
    println!("   export LLM_API_KEY='your-api-key'");
    println!("   export LLM_MODEL='gpt-4'");
    println!("   export MAX_DOCUMENT_SIZE_MB='20'");
    println!("   export ENABLE_PREPROCESSING='true'");

    println!("\n📖 更多信息请参考 .env.example 文件");
}

async fn run_mcp_server(service: SmartFetchService) -> anyhow::Result<()> {
    info!("初始化 MCP 服务器...");

    let mcp_server = McpSmartFetchServer::new(service);

    info!("启动 MCP 服务器 (stdio 模式)...");
    indicatif_println!("✅ MCP 服务器启动成功");
    indicatif_println!("📋 可用工具:");
    indicatif_println!("   - extract_from_file: 从文件提取智能内容");
    indicatif_println!("   - extract_from_text: 从文本提取智能内容");
    indicatif_println!("   - get_config: 获取服务器配置信息");
    indicatif_println!("   - list_supported_formats: 列出支持的文档格式");
    indicatif_println!("🔌 使用标准输入/输出通信，等待客户端连接...");

    mcp_server.run_stdio().await?;

    Ok(())
}
