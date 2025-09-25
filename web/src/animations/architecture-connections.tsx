import { useEffect, useRef } from 'react'

interface ArchitectureConnectionsProps {
  className?: string
  moduleCount?: number
}

export const ArchitectureConnections: React.FC<ArchitectureConnectionsProps> = ({
  className = '',
  moduleCount = 6
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 创建模块节点
    const modules = Array.from({ length: moduleCount }, (_, index) => {
      const angle = (index * 2 * Math.PI) / moduleCount
      const radius = Math.min(canvas.width, canvas.height) * 0.3
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        radius: 20,
        color: ['#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9', '#c084fc', '#d8b4fe'][index],
        connections: [] as number[],
        pulsePhase: Math.random() * Math.PI * 2
      }
    })

    // 创建连接关系
    modules.forEach((module, index) => {
      // 每个模块连接到下一个模块，形成环形结构
      const nextIndex = (index + 1) % moduleCount
      module.connections.push(nextIndex)

      // 随机添加一些额外的连接
      if (Math.random() > 0.7) {
        const randomIndex = Math.floor(Math.random() * moduleCount)
        if (randomIndex !== index && randomIndex !== nextIndex) {
          module.connections.push(randomIndex)
        }
      }
    })

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 更新时间
      const time = Date.now() * 0.001

      // 绘制连接线
      modules.forEach((module) => {
        module.connections.forEach((targetIndex) => {
          const targetModule = modules[targetIndex]

          // 计算连接线的动画效果
          const pulse = Math.sin(time * 2 + module.pulsePhase) * 0.5 + 0.5
          const alpha = 0.2 + pulse * 0.3

          ctx.beginPath()
          ctx.moveTo(module.x, module.y)
          ctx.lineTo(targetModule.x, targetModule.y)
          ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`
          ctx.lineWidth = 1 + pulse
          ctx.stroke()

          // 添加流动效果
          const progress = (Math.sin(time * 3) * 0.5 + 0.5) % 1
          const flowX = module.x + (targetModule.x - module.x) * progress
          const flowY = module.y + (targetModule.y - module.y) * progress

          ctx.beginPath()
          ctx.arc(flowX, flowY, 2 + pulse, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(168, 85, 247, ${0.8 + pulse * 0.2})`
          ctx.fill()
        })
      })

      // 绘制模块节点
      modules.forEach((module) => {
        const pulse = Math.sin(time * 2 + module.pulsePhase) * 0.3 + 0.7

        // 外发光效果
        const gradient = ctx.createRadialGradient(
          module.x, module.y, 0,
          module.x, module.y, module.radius * 2
        )
        gradient.addColorStop(0, `${module.color}${Math.round(pulse * 0.4 * 255).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.arc(module.x, module.y, module.radius * 2, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // 模块主体
        ctx.beginPath()
        ctx.arc(module.x, module.y, module.radius, 0, Math.PI * 2)
        ctx.fillStyle = module.color
        ctx.fill()

        // 内发光效果
        const innerGradient = ctx.createRadialGradient(
          module.x, module.y, 0,
          module.x, module.y, module.radius
        )
        innerGradient.addColorStop(0, '#ffffff')
        innerGradient.addColorStop(1, module.color)

        ctx.beginPath()
        ctx.arc(module.x, module.y, module.radius * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = innerGradient
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [moduleCount])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  )
}

export default ArchitectureConnections