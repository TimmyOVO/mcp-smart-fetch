use crate::config::LLMConfig;
use crate::error::{Result, SmartFetchError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use tracing_indicatif::indicatif_println;

#[derive(Debug, Serialize)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f64>,
    pub stream: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatCompletionResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<Choice>,
    pub usage: Option<Usage>,
}

#[derive(Debug, Deserialize)]
pub struct Choice {
    pub index: u32,
    pub message: ChatMessage,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug)]
pub struct LLMClient {
    config: LLMConfig,
    http_client: reqwest::Client,
}

impl LLMClient {
    pub fn new(config: LLMConfig) -> Result<Self> {
        let timeout = Duration::from_secs(config.timeout_seconds.unwrap_or(30));

        let mut builder = reqwest::Client::builder()
            .timeout(timeout)
            .user_agent("mcp-smart-fetch/0.1.0");

        // 添加自定义头部
        let mut headers = reqwest::header::HeaderMap::new();
        if let Some(config_headers) = &config.headers {
            for header in config_headers {
                let header_name = reqwest::header::HeaderName::from_bytes(header.name.as_bytes())
                    .map_err(|e| {
                    SmartFetchError::NetworkError(format!("无效的头部名称: {}", e))
                })?;
                let header_value = reqwest::header::HeaderValue::from_str(&header.value)
                    .map_err(|e| SmartFetchError::NetworkError(format!("无效的头部值: {}", e)))?;
                headers.insert(header_name, header_value);
            }
        }
        builder = builder.default_headers(headers);

        let http_client = builder
            .build()
            .map_err(|e| SmartFetchError::NetworkError(format!("创建HTTP客户端失败: {}", e)))?;

        Ok(Self {
            config,
            http_client,
        })
    }

    #[tracing::instrument(level = "info", skip(self, prompt), name = "调用LLM API")]
    pub async fn generate_response(&self, prompt: &str) -> Result<String> {
        let request = ChatCompletionRequest {
            model: self.config.model.clone(),
            messages: vec![ChatMessage {
                role: "user".to_string(),
                content: prompt.to_string(),
            }],
            max_tokens: self.config.max_tokens,
            temperature: self.config.temperature,
            stream: Some(false),
        };

        // 直接发送请求，不显示进度条（由调用者控制）
        let response = self.send_request(request).await?;

        if response.choices.is_empty() {
            return Err(SmartFetchError::LlmApiError(
                "API返回了空的选择列表".to_string(),
            ));
        }

        let choice = &response.choices[0];
        if choice.message.content.is_empty() {
            return Err(SmartFetchError::LlmApiError(
                "API返回了空的内容".to_string(),
            ));
        }

        // 添加LLM API调用完成提示
        if let Some(usage) = &response.usage {
            indicatif_println!("✅ LLM API调用成功 (输入{}token，输出{}token)",
                usage.prompt_tokens,
                usage.completion_tokens);
        } else {
            indicatif_println!("✅ LLM API调用成功");
        }

        Ok(choice.message.content.clone())
    }

    #[tracing::instrument(level = "debug", skip(self, request), name = "发送HTTP请求")]
    pub async fn send_request(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<ChatCompletionResponse> {
        let mut request_builder = self
            .http_client
            .post(&self.config.api_endpoint)
            .header("Content-Type", "application/json");

        // 添加API密钥头部
        if let Some(api_key) = &self.config.api_key {
            request_builder =
                request_builder.header("Authorization", format!("Bearer {}", api_key));
        }

        let response = request_builder.json(&request).send().await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(SmartFetchError::LlmApiError(format!(
                "API请求失败: {} - {}",
                status, error_text
            )));
        }

        let completion_response: ChatCompletionResponse = response
            .json()
            .await
            .map_err(|e| SmartFetchError::SerializationError(format!("解析API响应失败: {}", e)))?;

        Ok(completion_response)
    }

    #[tracing::instrument(level = "debug", skip(self, system_prompt, user_prompt), name = "生成带上下文的响应")]
    pub async fn generate_response_with_context(
        &self,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<String> {
        let request = ChatCompletionRequest {
            model: self.config.model.clone(),
            messages: vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: system_prompt.to_string(),
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: user_prompt.to_string(),
                },
            ],
            max_tokens: self.config.max_tokens,
            temperature: self.config.temperature,
            stream: Some(false),
        };

        // 直接发送请求，不显示进度条（由调用者控制）
        let response = self.send_request(request).await?;

        if response.choices.is_empty() {
            return Err(SmartFetchError::LlmApiError(
                "API返回了空的选择列表".to_string(),
            ));
        }

        let choice = &response.choices[0];
        Ok(choice.message.content.clone())
    }

    #[tracing::instrument(level = "debug", skip(self), name = "LLM健康检查")]
    pub async fn health_check(&self) -> Result<bool> {
        let test_request = ChatCompletionRequest {
            model: self.config.model.clone(),
            messages: vec![ChatMessage {
                role: "user".to_string(),
                content: "test".to_string(),
            }],
            max_tokens: Some(1),
            temperature: Some(0.0),
            stream: Some(false),
        };

        match self.send_request(test_request).await
        {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    #[tracing::instrument(level = "debug", skip(self), name = "获取模型信息")]
    pub async fn get_model_info(&self) -> Result<HashMap<String, String>> {
        let mut info = HashMap::new();
        info.insert("model".to_string(), self.config.model.clone());
        info.insert("api_endpoint".to_string(), self.config.api_endpoint.clone());
        info.insert(
            "max_tokens".to_string(),
            self.config.max_tokens.unwrap_or(0).to_string(),
        );
        info.insert(
            "temperature".to_string(),
            self.config.temperature.unwrap_or(0.0).to_string(),
        );

        Ok(info)
    }

    pub fn get_config(&self) -> &LLMConfig {
        &self.config
    }
}
