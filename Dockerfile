# 多阶段构建
FROM rust:1.75-alpine AS builder

# 安装必要的依赖
RUN apk add --no-cache musl-dev openssl-dev pkgconfig

# 设置工作目录
WORKDIR /app

# 复制 Cargo 文件
COPY Cargo.toml Cargo.lock ./

# 创建空的 src 目录以满足 Rust 项目结构
RUN mkdir src && echo "fn main() {}" > src/main.rs

# 构建依赖 (利用 Docker 缓存)
RUN cargo build --release && rm -rf src

# 复制源代码
COPY src ./src
COPY config ./config
COPY templates ./templates

# 构建应用
RUN cargo build --release

# 运行阶段
FROM alpine:latest

# 安装 ca-certificates (用于 HTTPS 请求)
RUN apk add --no-cache ca-certificates

# 创建非 root 用户
RUN addgroup -g 1000 -S app && \
    adduser -u 1000 -S app -G app

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/target/release/mcp-smart-fetch /usr/local/bin/

# 复制配置文件和模板
COPY --from=builder /app/config ./config
COPY --from=builder /app/templates ./templates

# 更改文件所有权
RUN chown -R app:app /app

# 切换到非 root 用户
USER app

# 暴露端口 (用于 HTTP 模式，MCP 模式不需要)
EXPOSE 8080

# 默认命令
CMD ["mcp-smart-fetch"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pgrep mcp-smart-fetch || exit 1

# 标签
LABEL maintainer="mcp-smart-fetch"
LABEL description="智能文档内容提取服务 - MCP 服务器"
LABEL version="0.1.0"