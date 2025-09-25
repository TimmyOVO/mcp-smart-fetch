import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import ArchitectureConnections from '../animations/architecture-connections'
import { fadeInUp, staggerChildren, scaleIn } from '../animations/transitions'
import {
  Server,
  Database,
  Cpu,
  FileText,
  Settings,
  Network,
  Code
} from 'lucide-react'

const Architecture = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const architecture = [
    {
      icon: Server,
      title: "MCP服务器",
      description: "标准Model Context Protocol服务器实现",
      features: ["stdio模式", "工具注册", "协议处理"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Cpu,
      title: "LLM客户端",
      description: "多LLM提供商集成",
      features: ["OpenAI兼容", "异步请求", "错误处理"],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: FileText,
      title: "文档处理器",
      description: "多格式文档解析",
      features: ["预处理", "格式检测", "内容清理"],
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Settings,
      title: "配置管理",
      description: "分层配置系统",
      features: ["环境变量", "配置文件", "类型安全"],
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Database,
      title: "模板引擎",
      description: "Handlebars模板系统",
      features: ["自定义模板", "变量替换", "条件渲染"],
      color: "from-red-500 to-pink-500"
    },
    {
      icon: Network,
      title: "错误处理",
      description: "统一错误处理机制",
      features: ["类型安全", "详细日志", "优雅降级"],
      color: "from-indigo-500 to-blue-500"
    }
  ]

  return (
    <section id="architecture" className="py-20 bg-dark-900 relative overflow-hidden">
      {/* 架构动态连接线 */}
      <ArchitectureConnections moduleCount={architecture.length} />

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
            技术架构
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            模块化设计，清晰的职责分离，确保系统的可维护性和扩展性
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerChildren}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={fadeInUp}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-2xl blur-xl" />
              <div className="relative glass-effect rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">架构概览</h3>

                <div className="space-y-4">
                  {[
                    "基于Rust官方MCP SDK构建",
                    "异步Tokio运行时",
                    "模块化组件设计",
                    "类型安全的配置系统",
                    "完整的错误处理链",
                    "可扩展的LLM集成"
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 10 }}
                      className="flex items-center gap-3 text-gray-300"
                    >
                      <div className="w-2 h-2 bg-primary-500 rounded-full" />
                      {item}
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="mt-6 p-4 bg-dark-700/50 rounded-lg border border-primary-500/20"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Code className="w-5 h-5 text-primary-400" />
                    <span className="text-primary-400 font-medium">核心依赖</span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>• rmcp (MCP SDK)</div>
                    <div>• tokio (异步运行时)</div>
                    <div>• reqwest (HTTP客户端)</div>
                    <div>• handlebars (模板引擎)</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={staggerChildren} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {architecture.map((module, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -5 }}
                className="glass-effect rounded-xl p-6 group"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r ${module.color} mb-3`}>
                  <module.icon className="w-5 h-5 text-white" />
                </div>

                <h4 className="font-semibold text-white mb-2">{module.title}</h4>
                <p className="text-sm text-gray-400 mb-3">{module.description}</p>

                <div className="space-y-1">
                  {module.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1 h-1 bg-primary-500 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-wrap gap-4 justify-center">
            {["Rust", "MCP协议", "异步", "类型安全", "模块化", "可扩展"].map((tech, index) => (
              <motion.span
                key={index}
                whileHover={{ scale: 1.1 }}
                className="px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Architecture