import { useEffect, useRef } from 'react'

interface FeatureParticlesProps {
  className?: string
  featureCount?: number
}

export const FeatureParticles: React.FC<FeatureParticlesProps> = ({
  className = '',
  featureCount = 6
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

    // 为每个特性创建一个粒子群
    const featureParticles = Array.from({ length: featureCount }, () => {
      const particles = []
      const particleCount = 8

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.4 + 0.2,
          baseX: Math.random() * canvas.width,
          baseY: Math.random() * canvas.height,
          orbitRadius: Math.random() * 30 + 20,
          orbitSpeed: Math.random() * 0.02 + 0.01,
          orbitAngle: Math.random() * Math.PI * 2
        })
      }
      return particles
    })

    const colors = ['#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9', '#c084fc', '#d8b4fe']

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      featureParticles.forEach((particles, featureIndex) => {
        const color = colors[featureIndex % colors.length]

        particles.forEach((particle) => {
          // 轨道运动
          particle.orbitAngle += particle.orbitSpeed
          particle.baseX += particle.speedX
          particle.baseY += particle.speedY

          // 边界检测
          if (particle.baseX > canvas.width) particle.baseX = 0
          if (particle.baseX < 0) particle.baseX = canvas.width
          if (particle.baseY > canvas.height) particle.baseY = 0
          if (particle.baseY < 0) particle.baseY = canvas.height

          // 计算最终位置
          particle.x = particle.baseX + Math.cos(particle.orbitAngle) * particle.orbitRadius
          particle.y = particle.baseY + Math.sin(particle.orbitAngle) * particle.orbitRadius

          // 绘制粒子
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${particle.opacity})`
          ctx.fill()

          // 绘制连接线
          particles.forEach((otherParticle) => {
            if (particle !== otherParticle) {
              const dx = particle.x - otherParticle.x
              const dy = particle.y - otherParticle.y
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance < 80) {
                ctx.beginPath()
                ctx.strokeStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${0.1 * (1 - distance / 80)})`
                ctx.lineWidth = 0.5
                ctx.moveTo(particle.x, particle.y)
                ctx.lineTo(otherParticle.x, otherParticle.y)
                ctx.stroke()
              }
            }
          })
        })
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
  }, [featureCount])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  )
}

export default FeatureParticles