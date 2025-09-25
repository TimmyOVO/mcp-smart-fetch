import { useEffect, useRef } from 'react'

export interface LoadingParticle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  angle: number
  radius: number
  color: string
  life: number
  maxLife: number
}

export const useLoadingParticles = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const particlesRef = useRef<LoadingParticle[]>([])
  const animationRef = useRef<number | undefined>(undefined)
  const timeRef = useRef<number>(0)

  useEffect(() => {
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

    const createParticle = (centerX: number, centerY: number): LoadingParticle => {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 100 + 50
      const hue = Math.random() * 60 + 240 // 紫色到蓝色范围

      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        size: Math.random() * 3 + 1,
        speedX: Math.cos(angle) * 0.5,
        speedY: Math.sin(angle) * 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        angle: angle,
        radius: radius,
        color: `hsl(${hue}, 70%, 60%)`,
        life: 0,
        maxLife: Math.random() * 100 + 100
      }
    }

    const createParticles = (count: number) => {
      particlesRef.current = []
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      for (let i = 0; i < count; i++) {
        particlesRef.current.push(createParticle(centerX, centerY))
      }
    }

    const animate = (timestamp: number) => {
      if (!timeRef.current) timeRef.current = timestamp
      const deltaTime = timestamp - timeRef.current
      timeRef.current = timestamp

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // 绘制中心光晕效果
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150)
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)')
      gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.2)')
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle, index) => {
        // 更新粒子生命周期
        particle.life += deltaTime * 0.01

        // 螺旋运动
        const spiralFactor = particle.life * 0.02
        const currentRadius = particle.radius * (1 + spiralFactor * 0.1)
        const currentAngle = particle.angle + spiralFactor

        particle.x = centerX + Math.cos(currentAngle) * currentRadius
        particle.y = centerY + Math.sin(currentAngle) * currentRadius

        // 更新透明度
        particle.opacity = Math.max(0, 1 - particle.life / particle.maxLife)

        // 更新大小
        particle.size = Math.max(0.5, particle.size * (1 - spiralFactor * 0.01))

        // 绘制粒子
        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()

        // 添加发光效果
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.fill()
        ctx.restore()

        // 绘制粒子之间的连线
        particlesRef.current.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x
            const dy = particle.y - otherParticle.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 80) {
              ctx.save()
              ctx.globalAlpha = (particle.opacity * otherParticle.opacity) * 0.2 * (1 - distance / 80)
              ctx.beginPath()
              ctx.strokeStyle = particle.color
              ctx.lineWidth = 0.5
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(otherParticle.x, otherParticle.y)
              ctx.stroke()
              ctx.restore()
            }
          }
        })

        // 移除生命周期结束的粒子
        if (particle.life > particle.maxLife) {
          particlesRef.current[index] = createParticle(centerX, centerY)
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    createParticles(25)
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [canvasRef])

  return particlesRef.current
}