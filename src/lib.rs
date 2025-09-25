pub mod cleaner;
pub mod config;
pub mod document;
pub mod error;
pub mod llm_client;
pub mod mcp_server;
pub mod prompt_template;

pub use cleaner::*;
pub use config::*;
pub use document::*;
pub use error::*;
pub use llm_client::*;
pub use mcp_server::*;
pub use prompt_template::*;

use std::path::PathBuf;

#[derive(Debug)]
pub struct SmartFetchService {
    config: AppConfig,
    llm_client: LLMClient,
    template_manager: TemplateManager,
}

impl SmartFetchService {
    pub fn new(config: AppConfig) -> Result<Self> {
        let llm_client = LLMClient::new(config.llm.clone())?;
        let template_manager = TemplateManager::new(&config.templates_dir)?;

        Ok(Self {
            config,
            llm_client,
            template_manager,
        })
    }

    #[tracing::instrument(level = "info", skip(self), name = "智能提取文档内容")]
    pub async fn extract_content(
        &self,
        document_path: &PathBuf,
        custom_prompt: Option<String>,
    ) -> Result<String> {
        let document_processor = DocumentProcessor::new(self.config.processing.clone())?;
        let document = document_processor.load_document(document_path).await?;
        let template_name = self.config.default_template.as_deref().unwrap_or("default");
        let prompt = self.template_manager.render_template(
            template_name,
            &document.content,
            custom_prompt,
        )?;

        let response = self.llm_client.generate_response(&prompt).await?;
        Ok(response)
    }

    #[tracing::instrument(level = "info", skip(self, text), name = "智能提取文本内容")]
    pub async fn extract_from_text(
        &self,
        text: &str,
        custom_prompt: Option<String>,
    ) -> Result<String> {
        // 使用文档处理器对文本进行预处理和清理
        let document_processor = DocumentProcessor::new(self.config.processing.clone())?;

        // 预处理文本内容
        let processed_text = document_processor.preprocess_content(text)?;

        let template_name = self.config.default_template.as_deref().unwrap_or("default");
        let prompt = self
            .template_manager
            .render_template(template_name, &processed_text, custom_prompt)?;

        let response = self.llm_client.generate_response(&prompt).await?;
        Ok(response)
    }

    pub fn config(&self) -> &AppConfig {
        &self.config
    }
}
