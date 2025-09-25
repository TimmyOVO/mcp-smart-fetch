import { useEffect, useRef, useState } from "react";

export interface AdvancedParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  type: "circle" | "star" | "line" | "glow";
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
}

export interface ParticleConfig {
  count?: number;
  colors?: string[];
  types?: ("circle" | "star" | "line" | "glow")[];
  maxSize?: number;
  minSize?: number;
  maxSpeed?: number;
  minSpeed?: number;
  enableInteraction?: boolean;
  enableTrails?: boolean;
  enableConnections?: boolean;
  trailFadeSpeed?: number;
  interactionRadius?: number;
  interactionStrength?: number;
  enablePulseEffect?: boolean;
  pulseInterval?: number;
}

export const useAdvancedParticles = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: ParticleConfig = {},
) => {
  const {
    count = 100,
    colors = ["#a855f7", "#8b5cf6", "#7c3aed", "#6d28d9"],
    types = ["circle", "star", "glow"],
    maxSize = 3,
    minSize = 0.5,
    maxSpeed = 1,
    minSpeed = 0.1,
    enableInteraction = true,
    enableTrails = true,
    enableConnections = true,
    trailFadeSpeed = 0.02,
    interactionRadius = 200,
    interactionStrength = 0.8,
    enablePulseEffect = true,
    pulseInterval = 2000,
  } = config;

  const particlesRef = useRef<AdvancedParticle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: 0, y: 0, isActive: false });
  const [isAnimating, setIsAnimating] = useState(false);
  const trailOpacityRef = useRef(0);
  const pulseEffectRef = useRef({ active: false, startTime: 0, duration: 500 });
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.isActive = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.isActive = false;
    };

    // 页面可见性检测
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    if (enableInteraction) {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const createParticle = (): AdvancedParticle => {
      const type = types[Math.floor(Math.random() * types.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * (maxSize - minSize) + minSize,
        speedX: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
        speedY: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
        opacity: Math.random() * 0.8 + 0.2,
        color,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 200,
      };
    };

    const createParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(createParticle());
      }
    };

    const drawParticle = (
      particle: AdvancedParticle,
      ctx: CanvasRenderingContext2D,
    ) => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      ctx.globalAlpha = particle.opacity;

      switch (particle.type) {
        case "circle":
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
          break;

        case "star":
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * particle.size;
            const y = Math.sin(angle) * particle.size;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.fillStyle = particle.color;
          ctx.fill();
          break;

        case "line":
          ctx.beginPath();
          ctx.moveTo(-particle.size * 2, 0);
          ctx.lineTo(particle.size * 2, 0);
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = particle.size / 2;
          ctx.stroke();
          break;

        case "glow":
          const gradient = ctx.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            particle.size * 3,
          );
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, "transparent");

          ctx.beginPath();
          ctx.arc(0, 0, particle.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          break;
      }

      ctx.restore();
    };

    const animate = (timestamp: number) => {
      // 性能优化 - 页面不可见时暂停动画
      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // 帧率控制 - 限制为60fps
      if (timestamp - lastFrameTimeRef.current < 16) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = timestamp;

      if (!enableTrails) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        // 改进的拖尾效果 - 使用更低的透明度和颜色混合
        trailOpacityRef.current = Math.min(
          trailOpacityRef.current + trailFadeSpeed,
          0.03,
        );

        // 使用混合模式避免累积变黑
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(15, 23, 42, ${trailOpacityRef.current})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'lighter';
      }

      // 处理脉冲效果
      let pulseRadius = 0;
      let pulseOpacity = 0;
      if (enablePulseEffect && mouseRef.current.isActive) {
        const now = Date.now();
        if (
          !pulseEffectRef.current.active &&
          now - pulseEffectRef.current.startTime > pulseInterval
        ) {
          pulseEffectRef.current.active = true;
          pulseEffectRef.current.startTime = now;
        }

        if (pulseEffectRef.current.active) {
          const elapsed = now - pulseEffectRef.current.startTime;
          const progress = elapsed / pulseEffectRef.current.duration;

          if (progress < 1) {
            pulseRadius = progress * interactionRadius * 1.5;
            pulseOpacity = (1 - progress) * 0.3;
          } else {
            pulseEffectRef.current.active = false;
          }
        }
      }

      particlesRef.current.forEach((particle, index) => {
        // 更新粒子位置
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;
        particle.life += 1;

        // 边界检测
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        // 鼠标交互 - 增强效果
        if (mouseRef.current.isActive) {
          const dx = particle.x - mouseRef.current.x;
          const dy = particle.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < interactionRadius) {
            const force = 1 - distance / interactionRadius;
            const strength = interactionStrength * force;

            // 排斥力
            particle.speedX += (dx / distance) * strength * 0.8;
            particle.speedY += (dy / distance) * strength * 0.8;

            // 增强鼠标附近粒子的视觉效果
            if (distance < interactionRadius * 0.5) {
              particle.opacity = Math.min(particle.opacity * 1.02, 1);
              particle.size = Math.min(particle.size * 1.01, maxSize * 1.5);
            }

            // 脉冲效果影响
            if (pulseRadius > 0 && distance < pulseRadius) {
              const pulseForce = (1 - distance / pulseRadius) * pulseOpacity;
              particle.speedX += (dx / distance) * pulseForce * 2;
              particle.speedY += (dy / distance) * pulseForce * 2;
            }
          }
        }

        // 粒子自然衰减
        particle.opacity = Math.max(particle.opacity * 0.999, 0.2);
        particle.size = Math.max(particle.size * 0.9995, minSize);

        // 粒子生命周期
        if (particle.life > particle.maxLife) {
          particlesRef.current[index] = createParticle();
        }

        drawParticle(particle, ctx);

        // 绘制脉冲效果
        if (pulseRadius > 0 && pulseOpacity > 0) {
          ctx.save();
          ctx.globalAlpha = pulseOpacity;
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(
            mouseRef.current.x,
            mouseRef.current.y,
            pulseRadius,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          ctx.restore();
        }

        // 粒子连接 - 增强效果
        if (enableConnections) {
          particlesRef.current.forEach((otherParticle, otherIndex) => {
            if (index !== otherIndex) {
              const dx = particle.x - otherParticle.x;
              const dy = particle.y - otherParticle.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // 增加连接距离
              if (distance < 150) {
                let alpha = 0.15 * (1 - distance / 150);

                // 鼠标附近的连接线更明显
                if (mouseRef.current.isActive) {
                  const mouseDistance = Math.sqrt(
                    Math.pow(particle.x - mouseRef.current.x, 2) +
                      Math.pow(particle.y - mouseRef.current.y, 2),
                  );
                  if (mouseDistance < interactionRadius) {
                    alpha *= 1.5;
                  }
                }

                ctx.beginPath();
                ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.stroke();
              }
            }
          });
        }
      });

      // 恢复默认混合模式
      ctx.globalCompositeOperation = 'source-over';

      animationRef.current = requestAnimationFrame(animate);
    };

    createParticles();
    setIsAnimating(true);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (enableInteraction) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsAnimating(false);
    };
  }, [canvasRef, config]);

  return { isAnimating };
};
