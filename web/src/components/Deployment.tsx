import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { fadeInUp, staggerChildren } from '../animations/transitions'
import {
  Server,
  Cloud,
  Copy,
  Check,
  GitBranch,
  Settings
} from 'lucide-react'

const Deployment = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const deploymentMethods = [
    {
      icon: Server,
      title: "Docker部署",
      description: "使用Docker容器快速部署",
      steps: [
        "构建Docker镜像",
        "配置环境变量",
        "运行容器",
        "验证服务"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Server,
      title: "MCP服务器",
      description: "作为标准MCP服务器运行",
      steps: [
        "配置客户端",
        "设置环境变量",
        "启动服务器",
        "集成测试"
      ],
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Cloud,
      title: "云部署",
      description: "部署到云平台",
      steps: [
        "准备构建环境",
        "配置CI/CD",
        "部署到云服务",
        "监控和日志"
      ],
      color: "from-purple-500 to-pink-500"
    }
  ]

  const dockerConfigs = [
    {
      title: "Dockerfile",
      language: "dockerfile",
      code: `FROM rust:1.75-slim as builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/mcp-smart-fetch /usr/local/bin/
COPY --from=builder /app/templates /app/templates

WORKDIR /app
EXPOSE 8080

CMD ["mcp-smart-fetch", "serve"]`
    },
    {
      title: "docker-compose.yml",
      language: "yaml",
      code: `version: '3.8'
services:
  mcp-server:
    build: .
    command: ["serve"]
    environment:
      - LLM_API_KEY=\${LLM_API_KEY}
      - LLM_MODEL=\${LLM_MODEL}
    volumes:
      - ./templates:/app/templates
    restart: unless-stopped`
    },
    {
      title: "MCP客户端配置",
      language: "json",
      code: `{
  "mcpServers": {
    "smart-fetch": {
      "command": "cargo",
      "args": ["run", "--", "serve"],
      "env": {
        "LLM_API_KEY": "your-api-key"
      }
    }
  }
}`
    },
    {
      title: "环境变量配置",
      language: "bash",
      code: `# LLM配置
LLM_API_KEY="your-api-key-here"
LLM_MODEL="gpt-4"
LLM_API_ENDPOINT="https://api.openai.com/v1/chat/completions"

# 服务器配置
SERVER_HOST="127.0.0.1"
SERVER_PORT=8080

# 处理配置
TEMPLATES_DIR="./templates"
DEFAULT_TEMPLATE="default"`
    }
  ]

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <section id="deployment" className="py-20 bg-dark-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-dark-900" />

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          ref={ref}
          variants={staggerChildren}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
          >
            部署指南
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            多种部署方式，满足不同场景的需求，从开发到生产环境
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerChildren}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {deploymentMethods.map((method, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              className="glass-effect rounded-xl p-6 group"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${method.color} mb-4`}>
                <method.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {method.title}
              </h3>

              <p className="text-gray-400 mb-4">
                {method.description}
              </p>

              <div className="space-y-2">
                {method.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    {step}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-gray-500">
                  点击查看详细配置
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeInUp}>
          <h3 className="text-2xl font-bold text-white mb-6 text-center">配置示例</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dockerConfigs.map((config, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="relative"
              >
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => copyToClipboard(config.code, index)}
                    className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="bg-dark-900 rounded-lg border border-dark-600 overflow-hidden">
                  <div className="px-4 py-3 bg-dark-800 border-b border-dark-600 pr-12">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-primary-400" />
                      <span className="text-white font-medium">{config.title}</span>
                      <span className="text-gray-500 text-sm ml-auto">{config.language}</span>
                    </div>
                  </div>
                  <SyntaxHighlighter
                    language={config.language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      maxHeight: '16rem',
                      background: 'transparent'
                    }}
                    showLineNumbers
                  >
                    {config.code}
                  </SyntaxHighlighter>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="mt-12 text-center"
        >
          <div className="inline-flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-4 px-6 py-3 rounded-full glass-effect">
              <Server className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300">Docker部署</span>
            </div>
            <div className="flex items-center gap-4 px-6 py-3 rounded-full glass-effect">
              <GitBranch className="w-5 h-5 text-green-400" />
              <span className="text-gray-300">CI/CD集成</span>
            </div>
            <div className="flex items-center gap-4 px-6 py-3 rounded-full glass-effect">
              <Cloud className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300">云原生支持</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Deployment