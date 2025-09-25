# mcp-smart-fetch

[![Rust](https://img.shields.io/badge/rust-1.75%2B-blue.svg)](https://rustlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-2024--11--05-orange.svg)](https://modelcontextprotocol.io)

基于 Rust 官方 MCP SDK 构建的智能文档内容提取服务，支持多种文档格式，集成了 LLM API 进行智能内容提取，可作为标准 MCP 服务器运行。

## ✨ 特性

- 🚀 **高性能异步架构** - 基于 Tokio 异步运行时
- 🧠 **智能内容提取** - 集成多种 LLM API
- 📄 **多格式支持** - TXT, MD, JSON, YAML, TOML, XML, CSV
- 🔧 **MCP 服务器** - 标准 Model Context Protocol 服务器
- ⚙️ **灵活配置** - 支持配置文件和环境变量
- 🐳 **容器化支持** - Docker 部署就绪
- 🧪 **完整测试** - 单元测试和集成测试覆盖

## 🚀 快速开始

### 环境要求

- Rust 1.75+
- LLM API 密钥（OpenAI、Claude、阿里云等）

### 安装

```bash
git clone https://github.com/yourusername/mcp-smart-fetch.git
cd mcp-smart-fetch
cargo build --release
```

### 配置

1. 复制环境变量示例：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的 API 密钥：
```bash
LLM_API_KEY="your-api-key-here"
LLM_MODEL="gpt-4"
LLM_API_ENDPOINT="https://api.openai.com/v1/chat/completions"
```

### 基本使用

#### 从文件提取内容

```bash
cargo run -- extract input.txt
cargo run -- extract --input document.pdf --prompt "总结文档要点"
cargo run -- extract -i data.json -o result.txt
```

#### 从文本提取内容

```bash
cargo run -- extract-text --text "这是一段需要分析的文本..."
cargo run -- extract-text -t "文本内容" -p "提取关键信息"
```

#### 启动 MCP 服务器

```bash
# 启动 MCP 服务器（stdio 模式）
cargo run -- serve

# 查看详细配置信息
cargo run --verbose serve
```

## 🔧 MCP 服务器

mcp-smart-fetch 可作为标准 MCP 服务器运行，提供以下工具：

### 可用工具

1. **extract_from_file** - 从文件提取智能内容
2. **extract_from_text** - 从文本提取智能内容
3. **get_config** - 获取服务器配置信息
4. **list_supported_formats** - 列出支持的文档格式

### 客户端配置

#### Claude Desktop

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "smart-fetch": {
      "command": "cargo",
      "args": ["run", "--", "serve"],
      "env": {
        "LLM_API_KEY": "your-api-key"
      }
    }
  }
}
```

#### Docker 部署

```bash
# 使用环境变量
docker run --env-file .env -v $(pwd)/templates:/app/templates mcp-smart-fetch serve

# 使用 docker-compose
docker-compose up mcp-server
```

## ⚙️ 配置

### 环境变量

项目支持通过环境变量进行完整配置，环境变量优先级高于配置文件。

#### LLM 配置
- `LLM_API_KEY` - LLM API 密钥（必需）
- `LLM_API_ENDPOINT` - API 端点 URL
- `LLM_MODEL` - 使用的模型名称
- `LLM_MAX_TOKENS` - 最大 token 数 (u32)
- `LLM_TEMPERATURE` - 温度参数 (f64, 0.0-2.0)
- `LLM_TIMEOUT_SECONDS` - 请求超时时间 (u64, 秒)

#### 服务器配置
- `SERVER_HOST` - 服务器监听地址
- `SERVER_PORT` - 服务器端口 (u16)
- `SERVER_MAX_CONNECTIONS` - 最大连接数 (u32)
- `SERVER_REQUEST_TIMEOUT_SECONDS` - 请求超时时间 (u64, 秒)

#### 处理配置
- `TEMPLATES_DIR` - 模板目录路径
- `DEFAULT_TEMPLATE` - 默认模板名称
- `MAX_DOCUMENT_SIZE_MB` - 最大文档大小 (f64, MB)
- `CHUNK_SIZE` - 分块大小 (usize)
- `ENABLE_PREPROCESSING` - 是否启用预处理 (bool)

#### 清理配置
- `ENABLE_CLEANING` - 是否启用清理功能 (bool)
- `REMOVE_BASE64_IMAGES` - 是否移除 base64 图片 (bool)
- `REMOVE_BINARY_DATA` - 是否移除二进制数据 (bool)
- `REMOVE_HTML_TAGS` - 是否移除 HTML 标签 (bool)
- `NORMALIZE_WHITESPACE` - 是否规范化空白字符 (bool)
- `MAX_STRING_LENGTH` - 最大字符串长度 (usize)

### 配置文件

配置文件位于 `config/config.toml`，支持分层配置：

```toml
[llm]
api_endpoint = "https://api.openai.com/v1/chat/completions"
model = "gpt-4"
max_tokens = 32768
temperature = 0.7

[server]
host = "127.0.0.1"
port = 8080

[processing]
max_document_size_mb = 10.0
chunk_size = 4000
supported_formats = ["txt", "md", "json", "yaml", "yml", "toml", "xml", "csv"]
```

### 查看配置信息

```bash
# 查看所有支持的环境变量
cargo run -- env-vars

# 查看详细配置信息
cargo run --verbose extract-text --text "test"
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
cargo test

# 运行单元测试
cargo test --lib

# 运行集成测试（MCP 服务器）
cargo test --test mcp_server_test

# 运行特定测试
cargo test test_extract_from_text
```

### 测试覆盖

- 单元测试：各个模块的独立功能
- MCP 服务器测试：完整的 MCP 协议测试
- 集成测试：端到端的内容提取流程

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t mcp-smart-fetch .
```

### 运行容器

```bash
# 使用环境变量
docker run --env-file .env -v $(pwd)/templates:/app/templates mcp-smart-fetch

# 作为 MCP 服务器运行
docker run --env-file .env mcp-smart-fetch serve
```

### Docker Compose

```yaml
version: '3.8'
services:
  mcp-server:
    build: .
    command: ["serve"]
    environment:
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_MODEL=${LLM_MODEL}
    volumes:
      - ./templates:/app/templates
```

## 📁 项目结构

```
mcp-smart-fetch/
├── src/
│   ├── main.rs              # 主程序入口
│   ├── lib.rs               # 库入口
│   ├── config.rs            # 配置管理
│   ├── mcp_server.rs        # MCP 服务器实现
│   ├── llm_client.rs        # LLM 客户端
│   ├── document.rs          # 文档处理
│   ├── prompt_template.rs   # 提示词模板
│   ├── cleaner.rs           # 内容清理
│   ├── progress.rs          # 进度显示
│   └── error.rs             # 错误处理
├── tests/
│   ├── unit_test.rs         # 单元测试
│   ├── integration_test.rs  # 集成测试
│   ├── cleaning_test.rs     # 清理测试
│   └── mcp_server_test.rs   # MCP 服务器测试
├── config/
│   └── config.toml          # 配置文件
├── templates/               # 模板目录
├── examples/                # 示例文件
├── .env.example            # 环境变量示例
├── docker-compose.yml       # Docker Compose 配置
├── Dockerfile              # Docker 镜像配置
└── README.md               # 项目文档
```

## 🔧 开发

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/yourusername/mcp-smart-fetch.git
cd mcp-smart-fetch

# 安装 Rust 工具链
rustup install stable
rustup component add clippy rustfmt

# 安装预提交钩子（可选）
cargo install pre-commit
pre-commit install
```

### 开发命令

```bash
# 构建项目
cargo build

# 运行开发版本
cargo run

# 运行测试
cargo test

# 代码格式化
cargo fmt

# 代码检查
cargo clippy

# 生成文档
cargo doc --open
```

### 添加新的 LLM 提供商

1. 在 `src/llm_client.rs` 中添加新的请求格式
2. 在 `config/config.toml` 中添加新的配置示例
3. 更新文档中的环境变量说明
4. 添加相应的测试用例

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📞 支持

- 📧 邮件：your-email@example.com
- 🐛 问题反馈：[GitHub Issues](https://github.com/yourusername/mcp-smart-fetch/issues)
- 📖 文档：[Wiki](https://github.com/yourusername/mcp-smart-fetch/wiki)

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 协议
- [rmcp](https://github.com/modelcontextprotocol/rust-sdk) - Rust MCP SDK
- [Tokio](https://tokio.rs/) - 异步运行时
- [Handlebars](https://handlebarsjs.com/) - 模板引擎

---

⭐ 如果这个项目对你有帮助，请给它一个 star！