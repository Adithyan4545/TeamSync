'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  rotation: number;
  vRot: number;
  alpha: number;
  life: number;
  maxLife: number;
  isSpecial: boolean;
}

export function StarCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const countRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Disable on touch devices, mobile, or if reduced motion preferred
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasFinePointer || prefersReducedMotion) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Draw a 4-point star on 2D Canvas Context
    const drawFourPointStar = (
      x: number,
      y: number,
      outerRadius: number,
      innerRadius: number,
      rotation: number,
      alpha: number,
      isSpecial: boolean
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      // Red Glow
      ctx.shadowColor = isSpecial ? 'rgba(255, 50, 50, 0.9)' : 'rgba(220, 40, 40, 0.7)';
      ctx.shadowBlur = isSpecial ? outerRadius * 2 : outerRadius * 1.2;

      ctx.beginPath();
      const spikes = 4;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.moveTo(0, -outerRadius);
      for (let i = 0; i < spikes; i++) {
        let px = Math.cos(rot) * outerRadius;
        let py = Math.sin(rot) * outerRadius;
        ctx.lineTo(px, py);
        rot += step;

        px = Math.cos(rot) * innerRadius;
        py = Math.sin(rot) * innerRadius;
        ctx.lineTo(px, py);
        rot += step;
      }
      ctx.lineTo(0, -outerRadius);
      ctx.closePath();

      // Red Radial Gradient
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
      if (isSpecial) {
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, '#FFB8B8');
        grad.addColorStop(0.7, '#FF3333');
        grad.addColorStop(1, '#CC0000');
      } else {
        grad.addColorStop(0, '#FFB8B8');
        grad.addColorStop(0.4, '#FF4D4D');
        grad.addColorStop(0.85, '#CC0000');
        grad.addColorStop(1, '#990000');
      }

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };

    // Spawn Particles
    const spawnParticles = (mx: number, my: number) => {
      countRef.current++;
      const isSpecial = countRef.current % 9 === 0;

      const numParticles = isSpecial ? 2 : 1;
      const particles = particlesRef.current;

      for (let i = 0; i < numParticles; i++) {
        if (particles.length >= 5) {
          particles.shift(); // Cap active particles at 5
        }

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.2 + Math.random() * 0.8;
        const baseSize = isSpecial ? 6 + Math.random() * 4 : 3 + Math.random() * 3; // Much smaller stars

        particles.push({
          x: mx + (Math.random() - 0.5) * 6,
          y: my + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.2, // slight upward float
          size: baseSize,
          maxSize: baseSize * (isSpecial ? 1.4 : 1.2),
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.08,
          alpha: 1,
          life: 0,
          maxLife: isSpecial ? 25 + Math.random() * 10 : 15 + Math.random() * 5, // Fades out extremely fast
          isSpecial,
        });
      }
    };

    // Track Mouse
    const handleMouseMove = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;
      const last = lastPosRef.current;

      const dx = mx - last.x;
      const dy = my - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Distance threshold: spawn particles when moved at least 75px
      if (dist >= 75 || last.x === -9999) {
        lastPosRef.current = { x: mx, y: my };
        spawnParticles(mx, my);
      }
    };

    // Animation Loop
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        const progress = p.life / p.maxLife;
        p.alpha = 1 - progress;

        const currentSize = p.size + (p.maxSize - p.size) * Math.sin(progress * Math.PI);
        const innerRadius = currentSize * 0.25;

        drawFourPointStar(p.x, p.y, currentSize, innerRadius, p.rotation, p.alpha, p.isSpecial);

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[99999] block"
    />
  );
}

export default StarCursor;
