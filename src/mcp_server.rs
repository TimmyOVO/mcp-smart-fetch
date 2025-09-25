use crate::SmartFetchService;
use rmcp::{
    handler::server::{router::tool::ToolRouter},
    model::{ErrorData as McpError, *},
    schemars, tool, tool_handler, tool_router, ServerHandler, ServiceExt,
    transport::stdio,
    handler::server::wrapper::Parameters,
};
use serde::Deserialize;
use std::{path::PathBuf, sync::Arc};

type McpResult<T> = std::result::Result<T, McpError>;

#[derive(Debug, Clone)]
pub struct McpSmartFetchServer {
    service: Arc<SmartFetchService>,
    tool_router: ToolRouter<McpSmartFetchServer>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ExtractFromFileRequest {
    #[schemars(description = "文件路径")]
    pub file_path: String,
    #[schemars(description = "自定义提示词")]
    pub prompt: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ExtractFromTextRequest {
    #[schemars(description = "输入文本")]
    pub text: String,
    #[schemars(description = "自定义提示词")]
    pub prompt: Option<String>,
}

#[tool_router]
impl McpSmartFetchServer {
    pub fn new(service: SmartFetchService) -> Self {
        Self {
            service: Arc::new(service),
            tool_router: Self::tool_router(),
        }
    }

    #[tool(description = "从文件提取智能内容")]
    async fn extract_from_file(
        &self,
        Parameters(request): Parameters<ExtractFromFileRequest>,
    ) -> McpResult<CallToolResult> {
        let path = PathBuf::from(request.file_path);

        match self.service.extract_content(&path, request.prompt).await {
            Ok(result) => {
                let content = Content::text(result);
                Ok(CallToolResult::success(vec![content]))
            }
            Err(e) => {
                let error_content = Content::text(format!("提取失败: {}", e));
                Ok(CallToolResult::error(vec![error_content]))
            }
        }
    }

    #[tool(description = "从文本提取智能内容")]
    async fn extract_from_text(
        &self,
        Parameters(request): Parameters<ExtractFromTextRequest>,
    ) -> McpResult<CallToolResult> {
        match self.service.extract_from_text(&request.text, request.prompt).await {
            Ok(result) => {
                let content = Content::text(result);
                Ok(CallToolResult::success(vec![content]))
            }
            Err(e) => {
                let error_content = Content::text(format!("提取失败: {}", e));
                Ok(CallToolResult::error(vec![error_content]))
            }
        }
    }

    #[tool(description = "获取服务器配置信息")]
    async fn get_config(&self) -> McpResult<CallToolResult> {
        let config = self.service.config();
        let config_json = serde_json::json!({
            "llm": {
                "model": config.llm.model,
                "api_endpoint": config.llm.api_endpoint,
                "max_tokens": config.llm.max_tokens,
                "temperature": config.llm.temperature,
            },
            "processing": {
                "max_document_size_mb": config.processing.max_document_size_mb,
                "chunk_size": config.processing.chunk_size,
                "supported_formats": config.processing.supported_formats,
                "enable_preprocessing": config.processing.enable_preprocessing,
            },
            "templates_dir": config.templates_dir.to_string_lossy().to_string(),
            "default_template": config.default_template,
        });

        let content = Content::text(config_json.to_string());
        Ok(CallToolResult::success(vec![content]))
    }

    #[tool(description = "列出支持的文档格式")]
    async fn list_supported_formats(&self) -> McpResult<CallToolResult> {
        let formats = self.service.config().processing.supported_formats.clone();
        let formats_json = serde_json::json!({
            "supported_formats": formats
        });

        let content = Content::text(formats_json.to_string());
        Ok(CallToolResult::success(vec![content]))
    }
}

#[tool_handler]
impl ServerHandler for McpSmartFetchServer {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: ProtocolVersion::V_2024_11_05,
            capabilities: ServerCapabilities::builder().enable_tools().build(),
            server_info: Implementation {
                name: "mcp-smart-fetch".to_string(),
                version: "0.1.0".to_string(),
                title: Some("Smart Fetch MCP Server".to_string()),
                website_url: None,
                icons: None,
            },
            instructions: Some("智能文档内容提取服务，支持多种文档格式的智能内容提取。使用 extract_from_file 工具从文件提取内容，或使用 extract_from_text 工具从文本提取内容。".to_string()),
        }
    }
}

impl McpSmartFetchServer {
    pub async fn run_stdio(self) -> crate::error::Result<()> {
        let service = self.serve(stdio()).await.map_err(|e| crate::error::SmartFetchError::Unknown(format!("服务器初始化失败: {}", e)))?;
        service.waiting().await.map_err(|e| crate::error::SmartFetchError::Unknown(format!("服务器运行失败: {}", e)))?;
        Ok(())
    }
}