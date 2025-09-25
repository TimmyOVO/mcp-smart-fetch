use crate::error::{Result, SmartFetchError};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub llm: LLMConfig,
    pub templates_dir: PathBuf,
    pub default_template: Option<String>,
    pub server: ServerConfig,
    pub processing: ProcessingConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMConfig {
    pub api_endpoint: String,
    pub api_key: Option<String>,
    pub model: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f64>,
    pub timeout_seconds: Option<u64>,
    pub headers: Option<Vec<HeaderConfig>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeaderConfig {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub max_connections: Option<u32>,
    pub request_timeout_seconds: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingConfig {
    pub max_document_size_mb: Option<f64>,
    pub chunk_size: Option<usize>,
    pub supported_formats: Vec<String>,
    pub enable_preprocessing: Option<bool>,
    pub cleaning: Option<CleaningConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleaningConfig {
    pub enable_cleaning: Option<bool>,
    pub remove_base64_images: Option<bool>,
    pub remove_binary_data: Option<bool>,
    pub max_string_length: Option<usize>,
    pub remove_html_tags: Option<bool>,
    pub normalize_whitespace: Option<bool>,
    pub custom_patterns: Option<Vec<String>>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            llm: LLMConfig::default(),
            templates_dir: PathBuf::from("templates"),
            default_template: Some("default".to_string()),
            server: ServerConfig::default(),
            processing: ProcessingConfig::default(),
        }
    }
}

impl Default for LLMConfig {
    fn default() -> Self {
        Self {
            api_endpoint: "https://api.openai.com/v1/chat/completions".to_string(),
            api_key: None,
            model: "gpt-4".to_string(),
            max_tokens: Some(4000),
            temperature: Some(0.7),
            timeout_seconds: Some(30),
            headers: None,
        }
    }
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8080,
            max_connections: Some(100),
            request_timeout_seconds: Some(60),
        }
    }
}

impl Default for ProcessingConfig {
    fn default() -> Self {
        Self {
            max_document_size_mb: Some(10.0),
            chunk_size: Some(4000),
            supported_formats: vec!["txt".to_string(), "md".to_string()],
            enable_preprocessing: Some(true),
            cleaning: Some(CleaningConfig::default()),
        }
    }
}

impl Default for CleaningConfig {
    fn default() -> Self {
        Self {
            enable_cleaning: Some(true),
            remove_base64_images: Some(true),
            remove_binary_data: Some(true),
            max_string_length: Some(1000),
            remove_html_tags: Some(false),
            normalize_whitespace: Some(true),
            custom_patterns: None,
        }
    }
}

impl AppConfig {
    pub fn load(path: &PathBuf) -> Result<Self> {
        if !path.exists() {
            return Err(SmartFetchError::ConfigError(format!(
                "配置文件不存在: {:?}",
                path
            )));
        }

        let config_content = std::fs::read_to_string(path)
            .map_err(|e| SmartFetchError::ConfigError(format!("读取配置文件失败: {}", e)))?;

        let mut config: AppConfig = toml::from_str(&config_content)
            .map_err(|e| SmartFetchError::ConfigError(format!("解析配置文件失败: {}", e)))?;

        // 环境变量覆盖
        config = Self::apply_env_overrides(config);

        // 验证配置
        config.validate()?;

        Ok(config)
    }

    /// 解析 u32 类型的环境变量
    fn parse_env_u32(env_var: &str, default: Option<u32>) -> Option<u32> {
        std::env::var(env_var)
            .ok()
            .and_then(|s| s.parse().ok())
            .or(default)
    }

    /// 解析 f64 类型的环境变量
    fn parse_env_f64(env_var: &str, default: Option<f64>) -> Option<f64> {
        std::env::var(env_var)
            .ok()
            .and_then(|s| s.parse().ok())
            .or(default)
    }

    /// 解析 u64 类型的环境变量
    fn parse_env_u64(env_var: &str, default: Option<u64>) -> Option<u64> {
        std::env::var(env_var)
            .ok()
            .and_then(|s| s.parse().ok())
            .or(default)
    }

    /// 解析 usize 类型的环境变量
    fn parse_env_usize(env_var: &str, default: Option<usize>) -> Option<usize> {
        std::env::var(env_var)
            .ok()
            .and_then(|s| s.parse().ok())
            .or(default)
    }

    /// 解析布尔值的环境变量
    fn parse_env_bool(env_var: &str, default: Option<bool>) -> Option<bool> {
        std::env::var(env_var)
            .ok()
            .map(|s| {
                match s.to_lowercase().as_str() {
                    "true" | "1" | "yes" | "on" => true,
                    "false" | "0" | "no" | "off" => false,
                    _ => default.unwrap_or(false),
                }
            })
            .or(default)
    }

    /// 解析路径的环境变量
    fn parse_env_path(env_var: &str, default: &Path) -> PathBuf {
        std::env::var(env_var)
            .ok()
            .map(PathBuf::from)
            .unwrap_or_else(|| default.to_path_buf())
    }

    fn apply_env_overrides(mut config: AppConfig) -> AppConfig {
        // LLM 配置的环境变量覆盖
        if let Ok(api_endpoint) = std::env::var("LLM_API_ENDPOINT") {
            config.llm.api_endpoint = api_endpoint;
        }

        if let Ok(api_key) = std::env::var("LLM_API_KEY") {
            config.llm.api_key = Some(api_key);
        }

        if let Ok(model) = std::env::var("LLM_MODEL") {
            config.llm.model = model;
        }

        config.llm.max_tokens = Self::parse_env_u32("LLM_MAX_TOKENS", config.llm.max_tokens);
        config.llm.temperature = Self::parse_env_f64("LLM_TEMPERATURE", config.llm.temperature);
        config.llm.timeout_seconds = Self::parse_env_u64("LLM_TIMEOUT_SECONDS", config.llm.timeout_seconds);

        // 服务器配置的环境变量覆盖
        if let Ok(host) = std::env::var("SERVER_HOST") {
            config.server.host = host;
        }

        if let Ok(port) = std::env::var("SERVER_PORT") {
            if let Ok(port_num) = port.parse() {
                config.server.port = port_num;
            }
        }

        config.server.max_connections = Self::parse_env_u32("SERVER_MAX_CONNECTIONS", config.server.max_connections);
        config.server.request_timeout_seconds = Self::parse_env_u64("SERVER_REQUEST_TIMEOUT_SECONDS", config.server.request_timeout_seconds);

        // 处理配置的环境变量覆盖
        config.templates_dir = Self::parse_env_path("TEMPLATES_DIR", &config.templates_dir);

        if let Ok(default_template) = std::env::var("DEFAULT_TEMPLATE") {
            config.default_template = Some(default_template);
        }

        config.processing.max_document_size_mb = Self::parse_env_f64("MAX_DOCUMENT_SIZE_MB", config.processing.max_document_size_mb);
        config.processing.chunk_size = Self::parse_env_usize("CHUNK_SIZE", config.processing.chunk_size);
        config.processing.enable_preprocessing = Self::parse_env_bool("ENABLE_PREPROCESSING", config.processing.enable_preprocessing);

        // 清理配置的环境变量覆盖
        if let Some(cleaning) = &mut config.processing.cleaning {
            cleaning.enable_cleaning = Self::parse_env_bool("ENABLE_CLEANING", cleaning.enable_cleaning);
            cleaning.remove_base64_images = Self::parse_env_bool("REMOVE_BASE64_IMAGES", cleaning.remove_base64_images);
            cleaning.remove_binary_data = Self::parse_env_bool("REMOVE_BINARY_DATA", cleaning.remove_binary_data);
            cleaning.max_string_length = Self::parse_env_usize("MAX_STRING_LENGTH", cleaning.max_string_length);
            cleaning.remove_html_tags = Self::parse_env_bool("REMOVE_HTML_TAGS", cleaning.remove_html_tags);
            cleaning.normalize_whitespace = Self::parse_env_bool("NORMALIZE_WHITESPACE", cleaning.normalize_whitespace);
        }

        config
    }

    pub fn validate(&self) -> Result<()> {
        Self::validate_llm_config(&self.llm)
    }

    pub fn validate_llm_config(config: &LLMConfig) -> Result<()> {
        if config.api_endpoint.is_empty() {
            return Err(SmartFetchError::ConfigError(
                "LLM API端点不能为空".to_string(),
            ));
        }

        if config.model.is_empty() {
            return Err(SmartFetchError::ConfigError(
                "LLM模型名称不能为空".to_string(),
            ));
        }

        if let Some(max_tokens) = config.max_tokens {
            if max_tokens == 0 {
                return Err(SmartFetchError::ConfigError(
                    "最大token数必须大于0".to_string(),
                ));
            }
        }

        if let Some(temperature) = config.temperature {
            if !(0.0..=2.0).contains(&temperature) {
                return Err(SmartFetchError::ConfigError(
                    "温度参数必须在0.0到2.0之间".to_string(),
                ));
            }
        }

        Ok(())
    }

    pub fn get_templates_dir(&self) -> &PathBuf {
        &self.templates_dir
    }

    pub fn get_llm_config(&self) -> &LLMConfig {
        &self.llm
    }

    pub fn get_server_config(&self) -> &ServerConfig {
        &self.server
    }

    pub fn get_processing_config(&self) -> &ProcessingConfig {
        &self.processing
    }

    /// 显示配置信息（用于调试）
    pub fn display_info(&self) -> String {
        format!(
            "配置信息:\n  LLM: {} ({} tokens, {:.1}°C)\n  服务器: {}:{}\n  模板目录: {:?}\n  文档大小限制: {:.1}MB\n  分块大小: {}",
            self.llm.model,
            self.llm.max_tokens.unwrap_or(0),
            self.llm.temperature.unwrap_or(0.0),
            self.server.host,
            self.server.port,
            self.templates_dir,
            self.processing.max_document_size_mb.unwrap_or(0.0),
            self.processing.chunk_size.unwrap_or(0)
        )
    }

    /// 获取所有支持的环境变量及其说明
    pub fn get_env_variables_info() -> Vec<(&'static str, &'static str)> {
        vec![
            ("LLM_API_ENDPOINT", "LLM API 端点 URL"),
            ("LLM_API_KEY", "LLM API 密钥"),
            ("LLM_MODEL", "LLM 模型名称"),
            ("LLM_MAX_TOKENS", "最大 token 数 (u32)"),
            ("LLM_TEMPERATURE", "温度参数 (f64, 0.0-2.0)"),
            ("LLM_TIMEOUT_SECONDS", "请求超时时间 (u64, 秒)"),
            ("SERVER_HOST", "服务器监听地址"),
            ("SERVER_PORT", "服务器端口 (u16)"),
            ("SERVER_MAX_CONNECTIONS", "最大连接数 (u32)"),
            ("SERVER_REQUEST_TIMEOUT_SECONDS", "请求超时时间 (u64, 秒)"),
            ("TEMPLATES_DIR", "模板目录路径"),
            ("DEFAULT_TEMPLATE", "默认模板名称"),
            ("MAX_DOCUMENT_SIZE_MB", "最大文档大小 (f64, MB)"),
            ("CHUNK_SIZE", "分块大小 (usize)"),
            ("ENABLE_PREPROCESSING", "是否启用预处理 (bool)"),
            ("ENABLE_CLEANING", "是否启用清理功能 (bool)"),
            ("REMOVE_BASE64_IMAGES", "是否移除 base64 图片 (bool)"),
            ("REMOVE_BINARY_DATA", "是否移除二进制数据 (bool)"),
            ("REMOVE_HTML_TAGS", "是否移除 HTML 标签 (bool)"),
            ("NORMALIZE_WHITESPACE", "是否规范化空白字符 (bool)"),
            ("MAX_STRING_LENGTH", "最大字符串长度 (usize)"),
        ]
    }
}
