# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于Rust官方MCP SDK构建的智能文档内容提取服务。项目使用异步架构，支持多种文档格式，集成了LLM API进行智能内容提取。

## 开发命令

### 构建和运行
```bash
# 开发构建
cargo build

# 发布构建
cargo build --release

# 运行主程序
cargo run -- [command]

# 运行单元测试
cargo test

# 运行集成测试
cargo test --test integration_test

# 运行特定测试
cargo test test_name

# 代码格式化
cargo fmt

# 代码检查
cargo clippy
```

### 测试和基准测试
- 单元测试在 `tests/unit_test.rs` 中
- 集成测试在 `tests/integration_test.rs` 中
- 基准测试配置已存在但被注释（见 Cargo.toml 第63-65行）

## 核心架构

### 模块结构
项目采用模块化设计，核心模块包括：

- **config.rs**: 配置管理，处理TOML配置文件和环境变量
- **document.rs**: 文档处理，支持多种格式（TXT, MD, JSON, YAML, TOML, XML, CSV）
- **llm_client.rs**: LLM客户端，与OpenAI兼容API通信
- **prompt_template.rs**: 提示词模板系统，使用Handlebars引擎
- **cleaner.rs**: 内容清理和格式化
- **progress.rs**: 进度显示和用户界面
- **error.rs**: 统一错误处理

### 主要服务
`SmartFetchService` 是核心服务类，在 `src/lib.rs` 中定义，负责：
- 协调各个模块
- 提供文件和文本内容提取接口
- 管理配置和模板

### 配置系统
- 主配置文件：`config/config.toml`
- 支持环境变量覆盖（LLM_API_KEY, LLM_API_ENDPOINT等）
- 分层配置：LLM配置、服务器配置、处理配置

### 模板系统
- 使用Handlebars模板引擎
- 默认模板：`templates/default.hbs`, `templates/summary.hbs`, `templates/qa.hbs`
- 支持自定义模板创建

### 命令行接口
支持三种主要命令：
- `extract`: 从文件提取内容
- `extract-text`: 从文本提取内容
- `serve`: 服务器模式（待实现）

## 开发注意事项

### 依赖管理
- 使用 `rmcp` 作为MCP SDK（来自GitHub）
- 异步运行时：Tokio
- HTTP客户端：reqwest
- 配置管理：config + toml
- 模板引擎：handlebars
- 错误处理：anyhow + thiserror

### 错误处理
项目使用统一的错误类型 `Result<T>`，定义在 `error.rs` 中。

### 测试策略
- 单元测试：测试各个模块的独立功能
- 集成测试：测试完整的提取流程（需要API密钥）
- 测试文件会自动创建和清理

### 进度显示
使用 `indicatif` 库提供命令行进度条，在长时间操作时提供用户反馈。

## 环境变量

### LLM 配置
- `LLM_API_KEY`: LLM API密钥（必需）
- `LLM_API_ENDPOINT`: API端点URL
- `LLM_MODEL`: 使用的模型名称
- `LLM_MAX_TOKENS`: 最大token数 (u32)
- `LLM_TEMPERATURE`: 温度参数 (f64, 0.0-2.0)
- `LLM_TIMEOUT_SECONDS`: 请求超时时间 (u64, 秒)

### 服务器配置
- `SERVER_HOST`: 服务器监听地址
- `SERVER_PORT`: 服务器端口 (u16)
- `SERVER_MAX_CONNECTIONS`: 最大连接数 (u32)
- `SERVER_REQUEST_TIMEOUT_SECONDS`: 请求超时时间 (u64, 秒)

### 处理配置
- `TEMPLATES_DIR`: 模板目录路径
- `DEFAULT_TEMPLATE`: 默认模板名称
- `MAX_DOCUMENT_SIZE_MB`: 最大文档大小 (f64, MB)
- `CHUNK_SIZE`: 分块大小 (usize)
- `ENABLE_PREPROCESSING`: 是否启用预处理 (bool)

### 清理配置
- `ENABLE_CLEANING`: 是否启用清理功能 (bool)
- `REMOVE_BASE64_IMAGES`: 是否移除base64图片 (bool)
- `REMOVE_BINARY_DATA`: 是否移除二进制数据 (bool)
- `REMOVE_HTML_TAGS`: 是否移除HTML标签 (bool)
- `NORMALIZE_WHITESPACE`: 是否规范化空白字符 (bool)
- `MAX_STRING_LENGTH`: 最大字符串长度 (usize)

### 布尔值格式
所有布尔值环境变量支持以下格式：
- true: "true", "1", "yes", "on"
- false: "false", "0", "no", "off"