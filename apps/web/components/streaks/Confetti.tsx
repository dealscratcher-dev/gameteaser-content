// apps/web/components/streaks/Confetti.tsx
import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

export interface ConfettiHandle {
  fire: (options?: { duration?: number; intensity?: number }) => void;
}

interface ConfettiCanvasProps {
  className?: string;
}

export const ConfettiCanvas = forwardRef<ConfettiHandle, ConfettiCanvasProps>(
  ({ className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    let animationId: number | null = null;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const fire = (options?: { duration?: number; intensity?: number }) => {
      const intensity = options?.intensity ?? 100;
      const duration = options?.duration ?? 2000;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const resize = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        } else {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
      };
      resize();
      window.addEventListener("resize", resize);

      particles = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      for (let i = 0; i < intensity; i++) {
        particles.push({
          x: centerX,
          y: centerY,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12 - 5,
          size: Math.random() * 6 + 2,
          color: `hsl(${Math.random() * 360}, 80%, 60%)`,
          alpha: 1,
        });
      }

      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        if (elapsed >= duration) {
          if (animationId) cancelAnimationFrame(animationId);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles = [];
          window.removeEventListener("resize", resize);
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2;
          p.alpha = 1 - elapsed / duration;
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    };

    useImperativeHandle(ref, () => ({ fire }));

    useEffect(() => {
      return () => {
        if (animationId) cancelAnimationFrame(animationId);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
    );
  }
);

ConfettiCanvas.displayName = "ConfettiCanvas";
