"use client";

/**
 * Confetti.tsx
 * Canvas-based particle confetti burst for TheGameBit celebration moments
 * (achievement unlocked, new release drops, wishlist adds, etc.)
 *
 * Usage:
 *   const { fire } = useConfetti();
 *   <ConfettiCanvas ref={confettiRef} />
 *   <button onClick={() => fire()}>Celebrate</button>
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConfettiOptions {
  /** Origin X as fraction of canvas width  (0–1, default 0.5) */
  originX?: number;
  /** Origin Y as fraction of canvas height (0–1, default 0.5) */
  originY?: number;
  /** Number of particles (default 120) */
  count?: number;
  /** Particle colour palette — defaults to TheGameBit brand palette */
  colors?: string[];
  /** Gravity multiplier (default 1) */
  gravity?: number;
  /** How long the animation runs in ms (default 3000) */
  duration?: number;
  /** Spread angle in degrees (default 360) */
  spread?: number;
  /** Initial velocity scalar (default 14) */
  velocity?: number;
}

export interface ConfettiHandle {
  /** Fire a confetti burst at the given options */
  fire(opts?: ConfettiOptions): void;
  /** Hard-stop and clear the canvas */
  reset(): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  width: number;
  height: number;
  tilt: number;
  tiltSpeed: number;
  opacity: number;
  drag: number;
}

// ─── Default Palette ─────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  "#7C3AED", // violet
  "#06B6D4", // cyan
  "#F59E0B", // amber
  "#EC4899", // pink
  "#10B981", // emerald
  "#F97316", // orange
  "#FFFFFF", // white
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Mount this canvas once (e.g. in your root layout) and call `fire()` via the ref.
 * The canvas is pointer-events-none and fixed to cover the full viewport.
 */
export const ConfettiCanvas = forwardRef<ConfettiHandle, { className?: string }>(
  function ConfettiCanvas({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const endTimeRef = useRef<number>(0);

    const resize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }, []);

    useEffect(() => {
      resize();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }, [resize]);

    const spawnParticles = useCallback(
      (opts: ConfettiOptions, canvas: HTMLCanvasElement) => {
        const {
          originX = 0.5,
          originY = 0.5,
          count = 120,
          colors = DEFAULT_COLORS,
          gravity = 1,
          spread = 360,
          velocity = 14,
        } = opts;

        const ox = originX * canvas.width;
        const oy = originY * canvas.height;
        const spreadRad = (spread / 2) * (Math.PI / 180);

        const fresh: Particle[] = Array.from({ length: count }, () => {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2 * spreadRad;
          const speed = velocity * (0.5 + Math.random() * 0.5);
          return {
            x: ox,
            y: oy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: colors[Math.floor(Math.random() * colors.length)],
            width: 6 + Math.random() * 6,
            height: 3 + Math.random() * 4,
            tilt: Math.random() * Math.PI * 2,
            tiltSpeed: (Math.random() - 0.5) * 0.15,
            opacity: 1,
            drag: 0.97 + Math.random() * 0.02,
          };
        });

        particlesRef.current.push(...fresh);
        // store gravity on each particle so mixed bursts work
        fresh.forEach((p) => {
          // @ts-expect-error — attaching extra field
          p._gravity = 0.35 * gravity;
        });
      },
      []
    );

    const tick = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();
      const alive = particlesRef.current.filter((p) => p.opacity > 0.02);
      particlesRef.current = alive;

      for (const p of alive) {
        // @ts-expect-error
        const g: number = p._gravity ?? 0.35;
        p.vy += g;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.tilt += p.tiltSpeed;

        // Fade out toward the end
        if (now > endTimeRef.current - 800) {
          p.opacity -= 0.02;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.tilt);
        ctx.fillRect(
          -p.width / 2,
          -p.height / 2,
          p.width,
          p.height
        );
        ctx.restore();
      }

      if (alive.length > 0) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        fire(opts: ConfettiOptions = {}) {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const duration = opts.duration ?? 3000;
          endTimeRef.current = Date.now() + duration;
          spawnParticles(opts, canvas);
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = requestAnimationFrame(tick);
        },
        reset() {
          cancelAnimationFrame(animFrameRef.current);
          particlesRef.current = [];
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        },
      }),
      [spawnParticles, tick]
    );

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={[
          "pointer-events-none fixed inset-0 z-[9999]",
          className ?? "",
        ].join(" ")}
      />
    );
  }
);

ConfettiCanvas.displayName = "ConfettiCanvas";

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Convenience hook — returns a stable `fire` callback and the ref to attach
 * to <ConfettiCanvas>.
 *
 * @example
 * const { canvasRef, fire } = useConfetti();
 * return (
 *   <>
 *     <ConfettiCanvas ref={canvasRef} />
 *     <button onClick={() => fire({ originY: 0.8 })}>🎉</button>
 *   </>
 * );
 */
export function useConfetti() {
  const canvasRef = useRef<ConfettiHandle>(null);

  const fire = useCallback(
    (opts?: ConfettiOptions) => canvasRef.current?.fire(opts),
    []
  );

  const reset = useCallback(() => canvasRef.current?.reset(), []);

  return { canvasRef, fire, reset };
}
