use thiserror::Error;

pub type Result<T> = std::result::Result<T, SmartFetchError>;

#[derive(Error, Debug)]
pub enum SmartFetchError {
    #[error("配置错误: {0}")]
    ConfigError(String),

    #[error("IO错误: {0}")]
    IoError(#[from] std::io::Error),

    #[error("模板错误: {0}")]
    TemplateError(String),

    #[error("LLM API错误: {0}")]
    LlmApiError(String),

    #[error("网络错误: {0}")]
    NetworkError(String),

    #[error("序列化错误: {0}")]
    SerializationError(String),

    #[error("文档处理错误: {0}")]
    DocumentError(String),

    #[error("验证错误: {0}")]
    ValidationError(String),

    #[error("超时错误: {0}")]
    TimeoutError(String),

    #[error("未知错误: {0}")]
    Unknown(String),

    #[error("正则表达式错误: {0}")]
    RegexError(String),
}

impl From<serde_json::Error> for SmartFetchError {
    fn from(err: serde_json::Error) -> Self {
        SmartFetchError::SerializationError(err.to_string())
    }
}

impl From<reqwest::Error> for SmartFetchError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_timeout() {
            SmartFetchError::TimeoutError(format!("请求超时: {}", err))
        } else if err.is_request() {
            SmartFetchError::NetworkError(format!("请求错误: {}", err))
        } else {
            SmartFetchError::NetworkError(format!("网络错误: {}", err))
        }
    }
}

impl From<handlebars::TemplateError> for SmartFetchError {
    fn from(err: handlebars::TemplateError) -> Self {
        SmartFetchError::TemplateError(err.to_string())
    }
}

impl From<handlebars::RenderError> for SmartFetchError {
    fn from(err: handlebars::RenderError) -> Self {
        SmartFetchError::TemplateError(err.to_string())
    }
}

impl From<toml::de::Error> for SmartFetchError {
    fn from(err: toml::de::Error) -> Self {
        SmartFetchError::ConfigError(err.to_string())
    }
}

impl From<tokio::time::error::Elapsed> for SmartFetchError {
    fn from(err: tokio::time::error::Elapsed) -> Self {
        SmartFetchError::TimeoutError(format!("操作超时: {}", err))
    }
}

impl From<regex::Error> for SmartFetchError {
    fn from(err: regex::Error) -> Self {
        SmartFetchError::RegexError(format!("正则表达式错误: {}", err))
    }
}
