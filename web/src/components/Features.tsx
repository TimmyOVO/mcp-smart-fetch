import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import FeatureParticles from '../animations/features-particles'
import { fadeInUp, staggerChildren, slideInLeft, slideInRight } from '../animations/transitions'
import {
  Zap,
  FileText,
  Cpu,
  Settings,
  Container,
  TestTube,
  Shield,
  GitBranch
} from 'lucide-react'

const Features = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const features = [
    {
      icon: Zap,
      title: "高性能异步架构",
      description: "基于Tokio异步运行时构建，提供卓越的性能和并发处理能力",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: FileText,
      title: "多格式文档支持",
      description: "支持TXT、MD、JSON、YAML、TOML、XML、CSV等多种文档格式",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Cpu,
      title: "智能内容提取",
      description: "集成多个LLM API，实现智能化的文档内容分析和提取",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Settings,
      title: "灵活配置系统",
      description: "支持配置文件和环境变量，提供完整的配置管理方案",
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Container,
      title: "容器化部署",
      description: "提供Docker镜像和Docker Compose配置，简化部署流程",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: TestTube,
      title: "完整测试覆盖",
      description: "包含单元测试、集成测试和MCP服务器测试，确保代码质量",
      color: "from-red-500 to-pink-500"
    }
  ]

  return (
    <section id="features" className="py-20 bg-dark-800/50 relative overflow-hidden">
      {/* 特性粒子装饰 */}
      <FeatureParticles featureCount={features.length} />

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
            核心特性
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            MCP Smart Fetch 提供了一系列强大的功能，满足现代文档处理的需求
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerChildren}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={index % 2 === 0 ? slideInLeft : slideInRight}
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-effect rounded-xl p-6 group cursor-pointer"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>

              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>了解更多</span>
                  <div className="transform group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full glass-effect">
            <Shield className="w-5 h-5 text-primary-400" />
            <span className="text-gray-300">支持MCP协议标准，与Claude Desktop等客户端无缝集成</span>
            <GitBranch className="w-5 h-5 text-primary-400" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Features