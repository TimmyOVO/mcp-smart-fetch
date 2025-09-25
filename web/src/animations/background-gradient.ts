import { useEffect, useRef } from 'react'

export interface GradientConfig {
  colors?: string[]
  speed?: number
  angle?: number
  intensity?: number
}

export const useBackgroundGradient = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: GradientConfig = {}
) => {
  const {
    colors = ['#0f172a', '#1e293b', '#334155', '#475569'],
    speed = 0.001,
    angle = 45,
    intensity = 0.5
  } = config

  const animationRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(0)

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

    const animate = () => {
      timeRef.current += speed

      const gradient = ctx.createLinearGradient(
        0, 0,
        canvas.width * Math.cos(angle * Math.PI / 180),
        canvas.height * Math.sin(angle * Math.PI / 180)
      )

      // 动态颜色偏移
      const timeOffset = timeRef.current
      const colorCount = colors.length

      colors.forEach((color, index) => {
        const position = (index / colorCount + timeOffset) % 1
        gradient.addColorStop(position, color)
      })

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 添加一些微妙的噪点效果
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < intensity * 0.01) {
          const noise = Math.random() * 20 - 10
          data[i] = Math.min(255, Math.max(0, data[i] + noise))     // R
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)) // G
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)) // B
        }
      }

      ctx.putImageData(imageData, 0, 0)

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [canvasRef, config])
}