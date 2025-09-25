import { useEffect, useRef, useState } from 'react'

interface PageTransitionProps {
  isActive?: boolean
  duration?: number
  onComplete?: () => void
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  isActive = false,
  duration = 1000,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!isActive && !isAnimating) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let startTime: number | null = null
    let progress = 0

    const createTransitionParticles = () => {
      const particles = []
      const particleCount = 50

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 4 + 1,
          speedX: (Math.random() - 0.5) * 10,
          speedY: (Math.random() - 0.5) * 10,
          opacity: Math.random() * 0.8 + 0.2,
          color: ['#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9'][Math.floor(Math.random() * 4)],
          life: 0,
          maxLife: Math.random() * 60 + 30
        })
      }
      return particles
    }

    let particles = createTransitionParticles()

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp

      const elapsed = timestamp - startTime
      progress = Math.min(elapsed / duration, 1)

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (isActive) {
        // 进入动画：粒子从中心向外扩散
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const radius = Math.max(canvas.width, canvas.height) * progress

        // 绘制圆形遮罩
        ctx.fillStyle = 'rgba(17, 24, 39, 0.9)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'

        // 绘制粒子
        particles.forEach((particle) => {
          const angle = Math.atan2(particle.y - centerY, particle.x - centerX)
          const distance = Math.sqrt(
            Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2)
          )

          if (distance < radius) {
            particle.x += Math.cos(angle) * 8
            particle.y += Math.sin(angle) * 8
            particle.life += 1

            if (particle.life > particle.maxLife) {
              particle.x = centerX + (Math.random() - 0.5) * 100
              particle.y = centerY + (Math.random() - 0.5) * 100
              particle.life = 0
            }

            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
            ctx.fillStyle = particle.color
            ctx.globalAlpha = particle.opacity * (1 - progress)
            ctx.fill()
          }
        })

        ctx.globalAlpha = 1
      } else {
        // 退出动画：粒子向内收缩
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const radius = Math.max(canvas.width, canvas.height) * (1 - progress)

        // 绘制圆形遮罩
        ctx.fillStyle = 'rgba(17, 24, 39, 0.9)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'

        // 绘制粒子
        particles.forEach((particle) => {
          const angle = Math.atan2(particle.y - centerY, particle.x - centerX)
          const targetX = centerX + Math.cos(angle) * radius * 0.8
          const targetY = centerY + Math.sin(angle) * radius * 0.8

          particle.x += (targetX - particle.x) * 0.1
          particle.y += (targetY - particle.y) * 0.1
          particle.life += 1

          if (particle.life > particle.maxLife) {
            particle.x = Math.random() * canvas.width
            particle.y = Math.random() * canvas.height
            particle.life = 0
          }

          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = particle.color
          ctx.globalAlpha = particle.opacity * progress
          ctx.fill()
        })

        ctx.globalAlpha = 1
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
        setIsAnimating(true)
      } else {
        setIsAnimating(false)
        if (!isActive && onComplete) {
          onComplete()
        }
      }
    }

    if (isActive || isAnimating) {
      particles = createTransitionParticles()
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, duration, onComplete, isAnimating])

  if (!isActive && !isAnimating) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50"
    />
  )
}

export default PageTransition