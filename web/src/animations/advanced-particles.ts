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
    interactionRadius = 200,
    interactionStrength = 0.8,
    enablePulseEffect = true,
    pulseInterval = 2000,
  } = config;

  const particlesRef = useRef<AdvancedParticle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: 0, y: 0, isActive: false, isClicking: false });
  const [isAnimating, setIsAnimating] = useState(false);
  const trailOpacityRef = useRef(0);
  const pulseEffectRef = useRef({ active: false, startTime: 0, duration: 500 });
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);
  const trailHistoryRef = useRef<number[]>([]);
  const mouseTrailRef = useRef<{x: number, y: number, time: number}[]>([]);
  const lastMouseMoveRef = useRef(0);
  const rippleEffectsRef = useRef<{x: number, y: number, radius: number, startTime: number, duration: number}[]>([]);

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
      const now = Date.now();
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.isActive = true;

      // 记录鼠标轨迹点（每50ms记录一次）
      if (now - lastMouseMoveRef.current > 50) {
        mouseTrailRef.current.push({
          x: e.clientX,
          y: e.clientY,
          time: now
        });
        lastMouseMoveRef.current = now;

        // 保持最近20个轨迹点
        if (mouseTrailRef.current.length > 20) {
          mouseTrailRef.current.shift();
        }

        // 创建涟漪效果（快速移动时）
        if (mouseTrailRef.current.length >= 2) {
          const lastPoint = mouseTrailRef.current[mouseTrailRef.current.length - 2];
          const currentPoint = mouseTrailRef.current[mouseTrailRef.current.length - 1];

          const moveDistance = Math.sqrt(
            Math.pow(currentPoint.x - lastPoint.x, 2) +
            Math.pow(currentPoint.y - lastPoint.y, 2)
          );

          // 如果移动距离较大，创建涟漪效果
          if (moveDistance > 10) {
            rippleEffectsRef.current.push({
              x: e.clientX,
              y: e.clientY,
              radius: 0,
              startTime: now,
              duration: 1000 // 1秒持续时间
            });

            // 保持最多5个涟漪效果
            if (rippleEffectsRef.current.length > 5) {
              rippleEffectsRef.current.shift();
            }
          }
        }
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.isActive = false;
      mouseRef.current.isClicking = false;
    };

    const handleMouseDown = () => {
      mouseRef.current.isClicking = true;
      // 点击时触发更强的脉冲效果
      pulseEffectRef.current.active = true;
      pulseEffectRef.current.startTime = Date.now();
      pulseEffectRef.current.duration = 300; // 更短的持续时间
    };

    const handleMouseUp = () => {
      mouseRef.current.isClicking = false;
    };

    // 页面可见性检测
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    if (enableInteraction) {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mouseup", handleMouseUp);
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
        // 智能拖尾效果 - 动态调整淡出速度和时间限制
        trailHistoryRef.current.push(timestamp);

        // 动态时间限制：根据粒子活跃度调整
        const particleActivity = particlesRef.current.filter(p =>
          Math.abs(p.speedX) + Math.abs(p.speedY) > 0.5
        ).length / particlesRef.current.length;

        const dynamicCutoffTime = timestamp - (800 + particleActivity * 400); // 0.8-1.2秒
        trailHistoryRef.current = trailHistoryRef.current.filter(t => t > dynamicCutoffTime);

        // 基于历史记录和粒子活跃度计算透明度
        const historyCount = trailHistoryRef.current.length;
        const maxHistory = Math.max(20, Math.min(40, particleActivity * 60)); // 20-40之间的动态最大值
        const baseOpacity = Math.min(historyCount / maxHistory, 0.015);
        const activityBoost = particleActivity * 0.005;
        const targetOpacity = baseOpacity + activityBoost;

        // 智能淡出：根据拖尾强度调整淡出速度
        const fadeSpeed = Math.max(0.05, Math.min(0.2, targetOpacity * 10));
        trailOpacityRef.current += (targetOpacity - trailOpacityRef.current) * fadeSpeed;

        // 使用优化的混合模式组合
        ctx.globalCompositeOperation = "source-over";

        ctx.fillStyle = `rgba(15, 23, 42, ${trailOpacityRef.current})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 使用更适合粒子效果的混合模式
        ctx.globalCompositeOperation = "lighter";
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

      // 处理涟漪效果
      const now = Date.now();
      rippleEffectsRef.current = rippleEffectsRef.current.filter(ripple => {
        const elapsed = now - ripple.startTime;
        const progress = elapsed / ripple.duration;

        if (progress < 1) {
          // 更新涟漪半径
          ripple.radius = progress * interactionRadius * 2;
          return true;
        }
        return false;
      });

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

            // 智能交互模式：根据距离切换引力和排斥力
            const isClose = distance < interactionRadius * 0.4;
            const interactionMode = isClose ? -1 : 1; // 近距离排斥，远距离吸引

            // 更平滑的力计算，增强响应性
            const smoothForce = Math.pow(force, 1.5);
            const finalStrength = strength * smoothForce * interactionMode * 1.5;

            // 应用力到粒子速度，增强响应速度
            particle.speedX += (dx / distance) * finalStrength * 1.5;
            particle.speedY += (dy / distance) * finalStrength * 1.5;

            // 增强鼠标附近粒子的视觉效果
            if (distance < interactionRadius * 0.6) {
              // 动态调整透明度和大小，增强视觉效果
              const visualBoost = Math.pow(1 - distance / (interactionRadius * 0.6), 3);
              particle.opacity = Math.min(particle.opacity + visualBoost * 0.3, 1);
              particle.size = Math.min(particle.size + visualBoost * 1.5, maxSize * 2.5);

              // 鼠标附近的粒子发光和变色效果
              if (distance < interactionRadius * 0.3) {
                // 更频繁的颜色变化
                if (Math.random() < 0.1) {
                  particle.color = colors[Math.floor(Math.random() * colors.length)];
                }

                // 增强发光效果
                particle.opacity = Math.min(particle.opacity + 0.1, 1);
              }
            }

            // 脉冲效果影响
            if (pulseRadius > 0 && distance < pulseRadius) {
              const pulseForce = (1 - distance / pulseRadius) * pulseOpacity;
              particle.speedX += (dx / distance) * pulseForce * 3;
              particle.speedY += (dy / distance) * pulseForce * 3;
            }

            // 点击时的特殊效果
            if (mouseRef.current.isClicking && distance < interactionRadius * 0.4) {
              // 点击时粒子获得更强的能量
              const clickForce = Math.pow(1 - distance / (interactionRadius * 0.4), 3);
              particle.speedX += (Math.random() - 0.5) * clickForce * 5;
              particle.speedY += (Math.random() - 0.5) * clickForce * 5;

              // 点击时粒子变色和发光
              particle.opacity = Math.min(particle.opacity + clickForce * 0.3, 1);
              particle.size = Math.min(particle.size + clickForce * 2, maxSize * 3);
            }

            // 鼠标轨迹效果 - 增强移动时的视觉反馈
            if (mouseTrailRef.current.length > 1) {
              // 检查粒子是否靠近鼠标轨迹
              for (let i = 0; i < mouseTrailRef.current.length - 1; i++) {
                const point = mouseTrailRef.current[i];
                const nextPoint = mouseTrailRef.current[i + 1];

                // 计算粒子到轨迹线段的距离
                const trailDx = particle.x - point.x;
                const trailDy = particle.y - point.y;
                const trailDistance = Math.sqrt(trailDx * trailDx + trailDy * trailDy);

                if (trailDistance < interactionRadius * 0.8) {
                  // 根据轨迹年龄调整效果强度（越新的轨迹效果越强）
                  const age = (Date.now() - point.time) / 1000;
                  const ageFactor = Math.max(0, 1 - age);

                  if (ageFactor > 0) {
                    const trailForce = (1 - trailDistance / (interactionRadius * 0.8)) * ageFactor * 0.3;

                    // 让粒子轻微跟随轨迹方向
                    const dirX = nextPoint.x - point.x;
                    const dirY = nextPoint.y - point.y;
                    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);

                    if (dirLength > 0) {
                      particle.speedX += (dirX / dirLength) * trailForce * 0.5;
                      particle.speedY += (dirY / dirLength) * trailForce * 0.5;
                    }

                    // 轨迹附近的粒子发光效果
                    particle.opacity = Math.min(particle.opacity + trailForce * 0.1, 1);
                    particle.size = Math.min(particle.size + trailForce * 0.5, maxSize * 1.2);
                  }
                }
              }
            }
          }
        }

        // 涟漪效果对粒子的影响
        rippleEffectsRef.current.forEach(ripple => {
          const dx = particle.x - ripple.x;
          const dy = particle.y - ripple.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < ripple.radius) {
            const rippleForce = (1 - distance / ripple.radius) * 0.5;

            // 涟漪向外推粒子
            if (distance > 0) {
              particle.speedX += (dx / distance) * rippleForce * 2;
              particle.speedY += (dy / distance) * rippleForce * 2;
            }

            // 涟漪中心的粒子发光效果
            if (distance < ripple.radius * 0.3) {
              particle.opacity = Math.min(particle.opacity + rippleForce * 0.2, 1);
              particle.size = Math.min(particle.size + rippleForce * 1, maxSize * 1.5);
            }
          }
        });

        // 粒子自然衰减 - 减缓衰减速度让效果更持久
        particle.opacity = Math.max(particle.opacity * 0.998, 0.1);
        particle.size = Math.max(particle.size * 0.999, minSize);

        // 粒子生命周期
        if (particle.life > particle.maxLife) {
          particlesRef.current[index] = createParticle();
        }

        drawParticle(particle, ctx);

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
      ctx.globalCompositeOperation = "source-over";

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
