import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLoadingParticles } from '../animations/loading-particles'
import { useLoadingState } from '../hooks/useLoadingState'

interface LoadingScreenProps {
  onLoadingComplete?: () => void
  minLoadingTime?: number
}

const LoadingScreen = ({ onLoadingComplete, minLoadingTime = 2000 }: LoadingScreenProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isLoading, progress, message, simulateLoading } = useLoadingState(minLoadingTime)

  // 初始化粒子效果
  useLoadingParticles(canvasRef)

  // 根据设备性能调整粒子数量
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时暂停动画
        return
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    simulateLoading()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [simulateLoading])

  useEffect(() => {
    if (!isLoading && onLoadingComplete) {
      onLoadingComplete()
    }
  }, [isLoading, onLoadingComplete])

  if (!isLoading) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900"
      >
        {/* 粒子背景 */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* 中心加载内容 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-8">
            {/* 主标题 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                MCP Smart Fetch
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-300">
                智能文档内容提取服务
              </p>
            </motion.div>

            {/* 脉冲动画圆圈 */}
            <motion.div
              className="relative w-24 h-24 mx-auto"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-50" />
              <div className="absolute inset-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-lg opacity-70" />
              <div className="absolute inset-4 bg-gradient-to-r from-purple-700 to-blue-700 rounded-full" />
            </motion.div>

            {/* 加载消息 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="space-y-4"
            >
              <p className="text-xl text-gray-200 font-medium">
                {message}
              </p>

              {/* 进度条 */}
              <div className="w-64 mx-auto">
                <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {Math.round(progress)}%
                </p>
              </div>

              {/* 装饰性粒子 */}
              <div className="flex justify-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* 底部装饰 */}
        <motion.div
          className="absolute bottom-8 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <p className="text-sm text-gray-400">
            基于 Rust MCP SDK 构建
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default LoadingScreen