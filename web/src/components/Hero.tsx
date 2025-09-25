import { motion } from 'framer-motion'
import { useRef } from 'react'
import CompositeAnimation from '../animations/composite-animation'
import { fadeInUp, staggerChildren, typewriter, letter } from '../animations/transitions'
import { Zap, Github, Download } from 'lucide-react'

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  const title = "MCP Smart Fetch"
  const subtitle = "基于Rust MCP SDK的智能文档内容提取服务"

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 增强的背景动画 */}
      <CompositeAnimation
        className="min-h-screen"
        enableParticles={true}
        enableGradient={true}
        enableFloating={true}
        particleConfig={{
          count: 180,
          colors: ['#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9', '#c084fc', '#d8b4fe'],
          types: ['circle', 'star', 'glow'],
          maxSize: 4,
          minSize: 0.3,
          enableInteraction: true,
          enableTrails: true,
          enableConnections: true,
          trailFadeSpeed: 0.015,
          interactionRadius: 220,
          interactionStrength: 1.0,
          enablePulseEffect: true,
          pulseInterval: 1800
        }}
        gradientConfig={{
          colors: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b'],
          speed: 0.0003,
          angle: 135,
          intensity: 0.2
        }}
        floatingConfig={{
          count: 12,
          shapes: ['circle', 'triangle', 'hexagon'],
          colors: ['rgba(168, 85, 247, 0.12)', 'rgba(139, 92, 246, 0.12)', 'rgba(124, 58, 237, 0.12)'],
          maxSize: 80,
          minSize: 20,
          speed: 0.2
        }}
      />

      {/* 原有的渐变覆盖层 */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 via-dark-900/80 to-dark-900" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          variants={staggerChildren}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto"
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 mb-6">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.h1
            variants={typewriter}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            {title.split('').map((char, index) => (
              <motion.span
                key={index}
                variants={letter}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto"
          >
            高性能异步架构，支持多种文档格式，集成LLM API进行智能内容提取，
            作为标准MCP服务器运行，提供灵活的配置和完整的测试覆盖。
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              快速开始
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary flex items-center gap-2"
            >
              <Github className="w-5 h-5" />
              GitHub
            </motion.button>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
          >
            {[
              { label: "高性能", value: "🚀" },
              { label: "多格式", value: "📄" },
              { label: "智能提取", value: "🧠" },
              { label: "MCP协议", value: "🔧" }
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="text-center"
              >
                <div className="text-3xl mb-2">{item.value}</div>
                <div className="text-gray-400 text-sm">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-400"
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero