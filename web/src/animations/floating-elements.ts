import { useEffect, useRef } from 'react'

export interface FloatingElement {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  rotation: number
  rotationSpeed: number
  opacity: number
  shape: 'circle' | 'triangle' | 'square' | 'hexagon'
  color: string
}

export interface FloatingConfig {
  count?: number
  shapes?: ('circle' | 'triangle' | 'square' | 'hexagon')[]
  colors?: string[]
  maxSize?: number
  minSize?: number
  speed?: number
}

export const useFloatingElements = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: FloatingConfig = {}
) => {
  const {
    count = 20,
    shapes = ['circle', 'triangle', 'square', 'hexagon'],
    colors = ['rgba(168, 85, 247, 0.1)', 'rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.1)'],
    maxSize = 40,
    minSize = 10,
    speed = 0.5
  } = config

  const elementsRef = useRef<FloatingElement[]>([])
  const animationRef = useRef<number | undefined>(undefined)

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

    const createElement = (): FloatingElement => {
      const shape = shapes[Math.floor(Math.random() * shapes.length)]
      const color = colors[Math.floor(Math.random() * colors.length)]

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * (maxSize - minSize) + minSize,
        speedX: (Math.random() - 0.5) * speed,
        speedY: (Math.random() - 0.5) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.3 + 0.1,
        shape,
        color
      }
    }

    const createElements = () => {
      elementsRef.current = []
      for (let i = 0; i < count; i++) {
        elementsRef.current.push(createElement())
      }
    }

    const drawShape = (element: FloatingElement, ctx: CanvasRenderingContext2D) => {
      ctx.save()
      ctx.translate(element.x, element.y)
      ctx.rotate(element.rotation)
      ctx.globalAlpha = element.opacity

      ctx.fillStyle = element.color

      switch (element.shape) {
        case 'circle':
          ctx.beginPath()
          ctx.arc(0, 0, element.size / 2, 0, Math.PI * 2)
          ctx.fill()
          break

        case 'triangle':
          ctx.beginPath()
          ctx.moveTo(0, -element.size / 2)
          ctx.lineTo(element.size / 2, element.size / 2)
          ctx.lineTo(-element.size / 2, element.size / 2)
          ctx.closePath()
          ctx.fill()
          break

        case 'square':
          ctx.fillRect(-element.size / 2, -element.size / 2, element.size, element.size)
          break

        case 'hexagon':
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI) / 6
            const x = Math.cos(angle) * element.size / 2
            const y = Math.sin(angle) * element.size / 2
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.closePath()
          ctx.fill()
          break
      }

      ctx.restore()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      elementsRef.current.forEach((element) => {
        // 更新位置和旋转
        element.x += element.speedX
        element.y += element.speedY
        element.rotation += element.rotationSpeed

        // 边界检测和反弹
        if (element.x > canvas.width || element.x < 0) {
          element.speedX *= -1
        }
        if (element.y > canvas.height || element.y < 0) {
          element.speedY *= -1
        }

        // 确保元素在画布内
        element.x = Math.max(0, Math.min(canvas.width, element.x))
        element.y = Math.max(0, Math.min(canvas.height, element.y))

        drawShape(element, ctx)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    createElements()
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [canvasRef, config])
}