import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { fadeInUp, staggerChildren } from '../animations/transitions'
import {
  Terminal,
  Copy,
  Check,
  Download,
  Settings,
  FileText
} from 'lucide-react'

const QuickStart = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const codeSnippets = [
    {
      title: "安装项目",
      language: "bash",
      code: `git clone https://github.com/yourusername/mcp-smart-fetch.git
cd mcp-smart-fetch
cargo build --release`
    },
    {
      title: "配置环境",
      language: "bash",
      code: `cp .env.example .env
# 编辑 .env 文件
LLM_API_KEY="your-api-key-here"
LLM_MODEL="gpt-4"
LLM_API_ENDPOINT="https://api.openai.com/v1/chat/completions"`
    },
    {
      title: "从文件提取",
      language: "bash",
      code: `# 基本使用
cargo run -- extract input.txt

# 自定义提示词
cargo run -- extract --input document.pdf --prompt "Summarize key points"

# 指定输出
cargo run -- extract -i data.json -o result.txt`
    },
    {
      title: "从文本提取",
      language: "bash",
      code: `# 直接处理文本
cargo run -- extract-text --text "This is text that needs analysis..."

# 自定义提示词
cargo run -- extract-text -t "text content" -p "Extract key information"`
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

  const steps = [
    {
      icon: Download,
      title: "安装依赖",
      description: "确保安装Rust 1.75+和必要的构建工具"
    },
    {
      icon: Settings,
      title: "配置API",
      description: "设置LLM API密钥和端点配置"
    },
    {
      icon: FileText,
      title: "准备文档",
      description: "准备需要处理的文档文件或文本内容"
    },
    {
      icon: Terminal,
      title: "运行命令",
      description: "使用提供的命令行工具开始提取内容"
    }
  ]

  return (
    <section id="quickstart" className="py-20 bg-dark-800/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 to-dark-900/50" />

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
            快速开始
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            几分钟内启动并运行MCP Smart Fetch，开始智能文档处理
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerChildren}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16"
        >
          <motion.div variants={fadeInUp}>
            <h3 className="text-2xl font-bold text-white mb-6">安装步骤</h3>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 10 }}
                  className="flex items-start gap-4 p-4 rounded-lg glass-effect"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      {index + 1}. {step.title}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <h3 className="text-2xl font-bold text-white mb-6">系统要求</h3>
            <div className="space-y-4">
              {[
                "Rust 1.75+ (推荐使用rustup安装)",
                "LLM API密钥 (OpenAI、Claude等)",
                "至少2GB可用内存",
                "稳定的网络连接",
                "支持的操作系统: Linux, macOS, Windows"
              ].map((requirement, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 border border-dark-600"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-300">{requirement}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <h3 className="text-2xl font-bold text-white mb-6 text-center">代码示例</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {codeSnippets.map((snippet, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="relative"
              >
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => copyToClipboard(snippet.code, index)}
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
                      <Terminal className="w-4 h-4 text-primary-400" />
                      <span className="text-white font-medium">{snippet.title}</span>
                      <span className="text-gray-500 text-sm ml-auto">{snippet.language}</span>
                    </div>
                  </div>
                  <SyntaxHighlighter
                    language={snippet.language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      background: 'transparent'
                    }}
                    showLineNumbers
                  >
                    {snippet.code}
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
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full glass-effect">
            <Terminal className="w-5 h-5 text-primary-400" />
            <span className="text-gray-300">查看完整文档获取更多使用示例和高级配置</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default QuickStart