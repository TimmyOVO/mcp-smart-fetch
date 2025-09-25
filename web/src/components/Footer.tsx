import { motion } from 'framer-motion'
import { fadeInUp } from '../animations/transitions'
import {
  Github,
  Mail,
  ExternalLink,
  Heart,
  Code
} from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const links = {
    project: [
      { name: "文档", href: "#" },
      { name: "示例", href: "#" },
      { name: "更新日志", href: "#" },
      { name: "贡献指南", href: "#" }
    ],
    community: [
      { name: "GitHub", href: "https://github.com" },
      { name: "问题反馈", href: "#" },
      { name: "讨论区", href: "#" },
      { name: "Twitter", href: "#" }
    ],
    resources: [
      { name: "MCP协议", href: "https://modelcontextprotocol.io" },
      { name: "Rust", href: "https://rust-lang.org" },
      { name: "Tokio", href: "https://tokio.rs" },
      { name: "Handlebars", href: "https://handlebarsjs.com" }
    ]
  }

  return (
    <footer className="bg-dark-900 border-t border-dark-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-800/50 to-dark-900" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"
        >
          <div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">MCP Smart Fetch</span>
            </motion.div>
            <p className="text-gray-400 text-sm leading-relaxed">
              基于Rust MCP SDK构建的智能文档内容提取服务，
              提供高性能、多格式支持的文档处理能力。
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">项目</h4>
            <ul className="space-y-2">
              {links.project.map((link, index) => (
                <li key={index}>
                  <motion.a
                    whileHover={{ x: 5 }}
                    href={link.href}
                    className="text-gray-400 hover:text-primary-400 text-sm transition-colors flex items-center gap-1"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3" />
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">社区</h4>
            <ul className="space-y-2">
              {links.community.map((link, index) => (
                <li key={index}>
                  <motion.a
                    whileHover={{ x: 5 }}
                    href={link.href}
                    className="text-gray-400 hover:text-primary-400 text-sm transition-colors flex items-center gap-1"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3" />
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">资源</h4>
            <ul className="space-y-2">
              {links.resources.map((link, index) => (
                <li key={index}>
                  <motion.a
                    whileHover={{ x: 5 }}
                    href={link.href}
                    className="text-gray-400 hover:text-primary-400 text-sm transition-colors flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3" />
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="pt-8 border-t border-dark-700"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>© {currentYear} MCP Smart Fetch. MIT License.</span>
              <span className="flex items-center gap-1">
                Made with <Heart className="w-3 h-3 text-red-400" />
              </span>
            </div>

            <div className="flex items-center gap-4">
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="https://github.com"
                className="text-gray-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.1 }}
                href="mailto:contact@example.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          <div className="mt-4 text-center md:text-left">
            <p className="text-xs text-gray-500">
              基于 <a href="https://modelcontextprotocol.io" className="hover:text-primary-400">MCP协议</a> 构建，
              使用 <a href="https://rust-lang.org" className="hover:text-primary-400">Rust</a> 和 <a href="https://tokio.rs" className="hover:text-primary-400">Tokio</a>
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <div className="inline-flex flex-wrap gap-4 justify-center text-xs text-gray-500">
            <span>版本: v1.0.0</span>
            <span>•</span>
            <span>最后更新: {new Date().toLocaleDateString('zh-CN')}</span>
            <span>•</span>
            <span>构建: production</span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer