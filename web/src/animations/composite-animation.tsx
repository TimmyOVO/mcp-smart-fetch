import { useRef, useEffect, useState } from 'react'
import { useAdvancedParticles } from './advanced-particles'
import { useBackgroundGradient } from './background-gradient'
import { useFloatingElements } from './floating-elements'

interface CompositeAnimationProps {
  className?: string
  enableParticles?: boolean
  enableGradient?: boolean
  enableFloating?: boolean
  particleConfig?: any
  gradientConfig?: any
  floatingConfig?: any
}

export const CompositeAnimation: React.FC<CompositeAnimationProps> = ({
  className = '',
  enableParticles = true,
  enableGradient = true,
  enableFloating = true,
  particleConfig = {},
  gradientConfig = {},
  floatingConfig = {}
}) => {
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null)
  const gradientCanvasRef = useRef<HTMLCanvasElement>(null)
  const floatingCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isReady, setIsReady] = useState(false)

  // 使用高级粒子系统
  useAdvancedParticles(enableParticles ? particlesCanvasRef : { current: null }, {
    count: 120,
    colors: ['#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9', '#c084fc', '#d8b4fe'],
    types: ['circle', 'star', 'glow'],
    maxSize: 3.5,
    minSize: 0.3,
    maxSpeed: 1.0,
    minSpeed: 0.08,
    enableInteraction: true,
    enableTrails: true,
    enableConnections: true,
    trailFadeSpeed: 0.02,
    interactionRadius: 200,
    interactionStrength: 0.8,
    enablePulseEffect: true,
    pulseInterval: 2000,
    ...particleConfig
  })

  // 使用背景渐变
  useBackgroundGradient(enableGradient ? gradientCanvasRef : { current: null }, {
    colors: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b'],
    speed: 0.0005,
    angle: 45,
    intensity: 0.3,
    ...gradientConfig
  })

  // 使用浮动元素
  useFloatingElements(enableFloating ? floatingCanvasRef : { current: null }, {
    count: 15,
    shapes: ['circle', 'triangle', 'square', 'hexagon'],
    colors: [
      'rgba(168, 85, 247, 0.08)',
      'rgba(139, 92, 246, 0.08)',
      'rgba(124, 58, 237, 0.08)',
      'rgba(109, 40, 217, 0.08)'
    ],
    maxSize: 60,
    minSize: 15,
    speed: 0.3,
    ...floatingConfig
  })

  useEffect(() => {
    setIsReady(true)
  }, [])

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* 背景渐变层 - 最底层 */}
      {enableGradient && (
        <canvas
          ref={gradientCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        />
      )}

      {/* 浮动元素层 - 中间层 */}
      {enableFloating && (
        <canvas
          ref={floatingCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 2 }}
        />
      )}

      {/* 粒子层 - 最上层 */}
      {enableParticles && (
        <canvas
          ref={particlesCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 3 }}
        />
      )}

      {/* 加载状态指示器 */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

export default CompositeAnimation