# mcp-smart-fetch

[![Rust](https://img.shields.io/badge/rust-1.75%2B-blue.svg)](https://rustlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-2024--11--05-orange.svg)](https://modelcontextprotocol.io)

**English** | [中文](README-CN.md)

An intelligent document content extraction service built with Rust's official MCP SDK, supporting multiple document formats and integrated with LLM APIs for smart content extraction, running as a standard MCP server.

## ✨ Features

- 🚀 **High-Performance Async Architecture** - Built on Tokio async runtime
- 🧠 **Smart Content Extraction** - Integrated with multiple LLM APIs
- 📄 **Multi-Format Support** - TXT, MD, JSON, YAML, TOML, XML, CSV
- 🔧 **MCP Server** - Standard Model Context Protocol server
- ⚙️ **Flexible Configuration** - Support for config files and environment variables
- 🐳 **Container Support** - Docker deployment ready
- 🧪 **Complete Testing** - Unit and integration test coverage

## 🚀 Quick Start

### Requirements

- Rust 1.75+
- LLM API key (OpenAI, Claude, Alibaba Cloud, etc.)

### Installation

```bash
git clone https://github.com/yourusername/mcp-smart-fetch.git
cd mcp-smart-fetch
cargo build --release
```

### Configuration

1. Copy environment variable example:
```bash
cp .env.example .env
```

2. Edit `.env` file with your API key:
```bash
LLM_API_KEY="your-api-key-here"
LLM_MODEL="gpt-4"
LLM_API_ENDPOINT="https://api.openai.com/v1/chat/completions"
```

### Basic Usage

#### Extract from File

```bash
cargo run -- extract input.txt
cargo run -- extract --input document.pdf --prompt "Summarize key points"
cargo run -- extract -i data.json -o result.txt
```

#### Extract from Text

```bash
cargo run -- extract-text --text "This is text that needs analysis..."
cargo run -- extract-text -t "text content" -p "Extract key information"
```

#### Start MCP Server

```bash
# Start MCP server (stdio mode)
cargo run -- serve

# View detailed configuration
cargo run --verbose serve
```

## 🔧 MCP Server

mcp-smart-fetch can run as a standard MCP server, providing the following tools:

### Available Tools

1. **extract_from_file** - Extract intelligent content from files
2. **extract_from_text** - Extract intelligent content from text
3. **get_config** - Get server configuration information
4. **list_supported_formats** - List supported document formats

### Client Configuration

#### Claude Desktop

Add to `claude_desktop_config.json`:

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

#### Docker Deployment

```bash
# Use environment variables
docker run --env-file .env -v $(pwd)/templates:/app/templates mcp-smart-fetch serve

# Use docker-compose
docker-compose up mcp-server
```

## ⚙️ Configuration

### Environment Variables

The project supports complete configuration through environment variables, with environment variables taking precedence over configuration files.

#### LLM Configuration
- `LLM_API_KEY` - LLM API key (required)
- `LLM_API_ENDPOINT` - API endpoint URL
- `LLM_MODEL` - Model name to use
- `LLM_MAX_TOKENS` - Maximum tokens (u32)
- `LLM_TEMPERATURE` - Temperature parameter (f64, 0.0-2.0)
- `LLM_TIMEOUT_SECONDS` - Request timeout (u64, seconds)

#### Server Configuration
- `SERVER_HOST` - Server listen address
- `SERVER_PORT` - Server port (u16)
- `SERVER_MAX_CONNECTIONS` - Maximum connections (u32)
- `SERVER_REQUEST_TIMEOUT_SECONDS` - Request timeout (u64, seconds)

#### Processing Configuration
- `TEMPLATES_DIR` - Template directory path
- `DEFAULT_TEMPLATE` - Default template name
- `MAX_DOCUMENT_SIZE_MB` - Maximum document size (f64, MB)
- `CHUNK_SIZE` - Chunk size (usize)
- `ENABLE_PREPROCESSING` - Enable preprocessing (bool)

#### Cleaning Configuration
- `ENABLE_CLEANING` - Enable cleaning functionality (bool)
- `REMOVE_BASE64_IMAGES` - Remove base64 images (bool)
- `REMOVE_BINARY_DATA` - Remove binary data (bool)
- `REMOVE_HTML_TAGS` - Remove HTML tags (bool)
- `NORMALIZE_WHITESPACE` - Normalize whitespace (bool)
- `MAX_STRING_LENGTH` - Maximum string length (usize)

### Configuration File

Configuration file located at `config/config.toml`, supporting layered configuration:

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

### View Configuration

```bash
# View all supported environment variables
cargo run -- env-vars

# View detailed configuration
cargo run --verbose extract-text --text "test"
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
cargo test

# Run unit tests
cargo test --lib

# Run integration tests (MCP server)
cargo test --test mcp_server_test

# Run specific tests
cargo test test_extract_from_text
```

### Test Coverage

- Unit tests: Independent functionality of each module
- MCP server tests: Complete MCP protocol testing
- Integration tests: End-to-end content extraction workflow

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t mcp-smart-fetch .
```

### Run Container

```bash
# Use environment variables
docker run --env-file .env -v $(pwd)/templates:/app/templates mcp-smart-fetch

# Run as MCP server
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

## 📁 Project Structure

```
mcp-smart-fetch/
├── src/
│   ├── main.rs              # Main program entry
│   ├── lib.rs               # Library entry
│   ├── config.rs            # Configuration management
│   ├── mcp_server.rs        # MCP server implementation
│   ├── llm_client.rs        # LLM client
│   ├── document.rs          # Document processing
│   ├── prompt_template.rs   # Prompt template system
│   ├── cleaner.rs           # Content cleaning
│   ├── progress.rs          # Progress display
│   └── error.rs             # Error handling
├── tests/
│   ├── unit_test.rs         # Unit tests
│   ├── integration_test.rs  # Integration tests
│   ├── cleaning_test.rs     # Cleaning tests
│   └── mcp_server_test.rs   # MCP server tests
├── config/
│   └── config.toml          # Configuration file
├── templates/               # Template directory
├── examples/                # Example files
├── .env.example            # Environment variable example
├── docker-compose.yml       # Docker Compose config
├── Dockerfile              # Docker image config
└── README.md               # Project documentation
```

## 🔧 Development

### Development Environment Setup

```bash
# Clone project
git clone https://github.com/yourusername/mcp-smart-fetch.git
cd mcp-smart-fetch

# Install Rust toolchain
rustup install stable
rustup component add clippy rustfmt

# Install pre-commit hooks (optional)
cargo install pre-commit
pre-commit install
```

### Development Commands

```bash
# Build project
cargo build

# Run development version
cargo run

# Run tests
cargo test

# Format code
cargo fmt

# Check code
cargo clippy

# Generate documentation
cargo doc --open
```

### Adding New LLM Providers

1. Add new request format in `src/llm_client.rs`
2. Add new configuration example in `config/config.toml`
3. Update environment variable documentation
4. Add corresponding test cases

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

- 📧 Email: your-email@example.com
- 🐛 Bug Reports: [GitHub Issues](https://github.com/yourusername/mcp-smart-fetch/issues)
- 📖 Documentation: [Wiki](https://github.com/yourusername/mcp-smart-fetch/wiki)

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP Protocol
- [rmcp](https://github.com/modelcontextprotocol/rust-sdk) - Rust MCP SDK
- [Tokio](https://tokio.rs/) - Async Runtime
- [Handlebars](https://handlebarsjs.com/) - Template Engine

---

⭐ If this project helps you, please give it a star!