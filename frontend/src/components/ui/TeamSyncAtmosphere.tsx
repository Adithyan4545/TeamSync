'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useUI } from '@/context/UIContext';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

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

interface BackgroundFloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

interface ConceptTypography {
  text: string;
  xRatio: number;
  yRatio: number;
  fontSize: number;
  rotation: number;
  baseAlpha: number;
  driftSpeedX: number;
  driftSpeedY: number;
}

// ─── Page-Specific Typography Maps ───────────────────────────────────────────

const PAGE_TYPOGRAPHY_MAP: Record<string, ConceptTypography[]> = {
  '/dashboard': [
    { text: "TEAMSYNC", xRatio: 0.12, yRatio: 0.18, fontSize: 58, rotation: -0.05, baseAlpha: 0.08, driftSpeedX: 0.0002, driftSpeedY: 0.0003 },
    { text: "BUILD YOUR IDEA", xRatio: 0.78, yRatio: 0.22, fontSize: 36, rotation: -0.03, baseAlpha: 0.07, driftSpeedX: 0.0002, driftSpeedY: -0.0003 },
    { text: "WIN TOGETHER", xRatio: 0.15, yRatio: 0.75, fontSize: 44, rotation: 0.05, baseAlpha: 0.08, driftSpeedX: -0.0002, driftSpeedY: 0.0004 },
    { text: "YOUR SKILLS. YOUR TEAM. YOUR HACKATHON.", xRatio: 0.55, yRatio: 0.88, fontSize: 20, rotation: -0.02, baseAlpha: 0.05, driftSpeedX: 0.0003, driftSpeedY: -0.0002 },
    { text: "DISCOVER • CONNECT • CREATE", xRatio: 0.82, yRatio: 0.65, fontSize: 22, rotation: 0.04, baseAlpha: 0.05, driftSpeedX: -0.0002, driftSpeedY: 0.0003 },
  ],
  '/hackathons': [
    { text: "HACKATHON DISCOVERY", xRatio: 0.18, yRatio: 0.2, fontSize: 48, rotation: -0.04, baseAlpha: 0.08, driftSpeedX: 0.0003, driftSpeedY: 0.0002 },
    { text: "INDIA-WIDE HACKATHONS", xRatio: 0.72, yRatio: 0.32, fontSize: 32, rotation: 0.03, baseAlpha: 0.06, driftSpeedX: -0.0002, driftSpeedY: -0.0003 },
    { text: "DISCOVER • CONNECT • CREATE", xRatio: 0.25, yRatio: 0.78, fontSize: 26, rotation: -0.02, baseAlpha: 0.06, driftSpeedX: 0.0002, driftSpeedY: 0.0003 },
    { text: "BUILD • COLLABORATE • COMPETE", xRatio: 0.78, yRatio: 0.75, fontSize: 22, rotation: 0.04, baseAlpha: 0.05, driftSpeedX: -0.0003, driftSpeedY: 0.0002 },
    { text: "COMPETE", xRatio: 0.08, yRatio: 0.5, fontSize: 60, rotation: 0.05, baseAlpha: 0.07, driftSpeedX: 0.0002, driftSpeedY: -0.0002 },
  ],
  '/teams': [
    { text: "FIND YOUR TEAM", xRatio: 0.15, yRatio: 0.22, fontSize: 50, rotation: -0.05, baseAlpha: 0.08, driftSpeedX: 0.0002, driftSpeedY: 0.0003 },
    { text: "TEAM COLLABORATION", xRatio: 0.75, yRatio: 0.28, fontSize: 34, rotation: 0.04, baseAlpha: 0.07, driftSpeedX: -0.0003, driftSpeedY: 0.0002 },
    { text: "SMART TEAMMATES", xRatio: 0.22, yRatio: 0.75, fontSize: 30, rotation: -0.03, baseAlpha: 0.06, driftSpeedX: 0.0003, driftSpeedY: -0.0002 },
    { text: "TEAM BUILDING", xRatio: 0.8, yRatio: 0.72, fontSize: 36, rotation: 0.03, baseAlpha: 0.07, driftSpeedX: -0.0002, driftSpeedY: 0.0004 },
  ],
  '/ai-match': [
    { text: "AI TEAM MATCHING", xRatio: 0.2, yRatio: 0.22, fontSize: 52, rotation: -0.04, baseAlpha: 0.09, driftSpeedX: 0.0003, driftSpeedY: 0.0002 },
    { text: "SKILL MATCHING", xRatio: 0.75, yRatio: 0.35, fontSize: 36, rotation: 0.03, baseAlpha: 0.07, driftSpeedX: -0.0002, driftSpeedY: -0.0003 },
    { text: "AI MATCH", xRatio: 0.12, yRatio: 0.78, fontSize: 58, rotation: 0.05, baseAlpha: 0.08, driftSpeedX: 0.0002, driftSpeedY: 0.0003 },
    { text: "SMART TEAMMATES", xRatio: 0.78, yRatio: 0.75, fontSize: 28, rotation: -0.03, baseAlpha: 0.06, driftSpeedX: -0.0003, driftSpeedY: 0.0002 },
  ],
  '/assignments': [
    { text: "BUILD • SUBMIT • EVALUATE", xRatio: 0.2, yRatio: 0.25, fontSize: 44, rotation: -0.04, baseAlpha: 0.08, driftSpeedX: 0.0002, driftSpeedY: 0.0003 },
    { text: "TEAM COLLABORATION", xRatio: 0.75, yRatio: 0.35, fontSize: 32, rotation: 0.03, baseAlpha: 0.06, driftSpeedX: -0.0003, driftSpeedY: 0.0002 },
    { text: "COLLABORATE", xRatio: 0.15, yRatio: 0.75, fontSize: 54, rotation: 0.05, baseAlpha: 0.08, driftSpeedX: 0.0002, driftSpeedY: -0.0002 },
  ],
};

const DEFAULT_TYPOGRAPHY: ConceptTypography[] = [
  { text: "TEAMSYNC", xRatio: 0.15, yRatio: 0.2, fontSize: 54, rotation: -0.05, baseAlpha: 0.08, driftSpeedX: 0.0002, driftSpeedY: 0.0003 },
  { text: "BUILD • COLLABORATE • COMPETE", xRatio: 0.72, yRatio: 0.28, fontSize: 28, rotation: 0.03, baseAlpha: 0.06, driftSpeedX: -0.0003, driftSpeedY: 0.0002 },
  { text: "DISCOVER • CONNECT • CREATE", xRatio: 0.25, yRatio: 0.75, fontSize: 26, rotation: -0.03, baseAlpha: 0.06, driftSpeedX: 0.0003, driftSpeedY: -0.0002 },
  { text: "YOUR SKILLS. YOUR TEAM. YOUR HACKATHON.", xRatio: 0.78, yRatio: 0.75, fontSize: 20, rotation: 0.04, baseAlpha: 0.05, driftSpeedX: -0.0002, driftSpeedY: 0.0003 },
];

export function TeamSyncAtmosphere() {
  const pathname = usePathname();
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);

  const { theme: uiTheme } = useUI();
  const mouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const targetMouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const lastCursorPosRef = useRef<Point>({ x: -9999, y: -9999 });
  const cursorParticlesRef = useRef<Particle[]>([]);
  const bgParticlesRef = useRef<BackgroundFloatingParticle[]>([]);

  const cursorCountRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const isMobileRef = useRef<boolean>(false);
  const prefersReducedMotionRef = useRef<boolean>(false);

  // Get matching typography list for current page route
  const getTypography = useCallback(() => {
    if (!pathname) return DEFAULT_TYPOGRAPHY;
    for (const route of Object.keys(PAGE_TYPOGRAPHY_MAP)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        return PAGE_TYPOGRAPHY_MAP[route];
      }
    }
    return DEFAULT_TYPOGRAPHY;
  }, [pathname]);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const cursorCanvas = cursorCanvasRef.current;
    if (!bgCanvas || !cursorCanvas) return;

    const bgCtx = bgCanvas.getContext('2d');
    const cursorCtx = cursorCanvas.getContext('2d');
    if (!bgCtx || !cursorCtx) return;

    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    prefersReducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      bgCanvas.width = w;
      bgCanvas.height = h;
      cursorCanvas.width = w;
      cursorCanvas.height = h;
      isMobileRef.current = w < 768;

      // Seed 25 background floating ambient gold particles
      if (bgParticlesRef.current.length === 0) {
        for (let i = 0; i < 25; i++) {
          bgParticlesRef.current.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            radius: 1 + Math.random() * 2,
            alpha: 0.15 + Math.random() * 0.3,
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      if (isMobileRef.current) return;
      targetMouseRef.current = { x: e.clientX, y: e.clientY };

      if (!hasFinePointer || prefersReducedMotionRef.current) return;

      const mx = e.clientX;
      const my = e.clientY;
      const last = lastCursorPosRef.current;
      const dx = mx - last.x;
      const dy = my - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Spawn star cursor particles when moved >= 8px
      if (dist >= 8 || last.x === -9999) {
        lastCursorPosRef.current = { x: mx, y: my };
        cursorCountRef.current++;
        const isSpecial = cursorCountRef.current % 9 === 0;
        const numToSpawn = isSpecial ? 2 : 1;
        const particles = cursorParticlesRef.current;

        for (let i = 0; i < numToSpawn; i++) {
          if (particles.length >= 40) particles.shift();

          const angle = Math.random() * Math.PI * 2;
          const speed = 0.2 + Math.random() * 0.7;
          const baseSize = isSpecial ? 11 + Math.random() * 5 : 5 + Math.random() * 3.5;

          particles.push({
            x: mx + (Math.random() - 0.5) * 6,
            y: my + (Math.random() - 0.5) * 6,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.15,
            size: baseSize,
            maxSize: baseSize * (isSpecial ? 1.4 : 1.2),
            rotation: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 0.08,
            alpha: 1,
            life: 0,
            maxLife: isSpecial ? 48 + Math.random() * 18 : 34 + Math.random() * 14,
            isSpecial,
          });
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Render 4-point gold star cursor
    const drawFourPointStar = (
      ctx: CanvasRenderingContext2D,
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

      ctx.shadowColor = isSpecial ? 'rgba(255, 215, 106, 0.95)' : 'rgba(245, 184, 61, 0.75)';
      ctx.shadowBlur = isSpecial ? outerRadius * 2.2 : outerRadius * 1.3;

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

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
      if (isSpecial) {
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, '#FFF1B8');
        grad.addColorStop(0.7, '#FFD76A');
        grad.addColorStop(1, '#F5B83D');
      } else {
        grad.addColorStop(0, '#FFF1B8');
        grad.addColorStop(0.4, '#FFD76A');
        grad.addColorStop(0.85, '#F5B83D');
        grad.addColorStop(1, '#C88A16');
      }

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };

    // Main 60 FPS Render Loop
    const loop = (now: number) => {
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const W = bgCanvas.width;
      const H = bgCanvas.height;

      // Lerp mouse
      const m = mouseRef.current;
      const t = targetMouseRef.current;
      m.x += (t.x - m.x) * 0.04;
      m.y += (t.y - m.y) * 0.04;

      const isDark = uiTheme !== 'light';

      // ── A. Render Background Canvas (z-0) ──────────────────────────────────
      bgCtx.clearRect(0, 0, W, H);

      // Pitch Black Base
      bgCtx.fillStyle = isDark ? '#030303' : '#F4F6FB';
      bgCtx.fillRect(0, 0, W, H);

      if (isDark && !prefersReducedMotionRef.current) {
        // Slow Moving Ambient Glows (Gold & Purple)
        const goldGlowX = W * 0.3 + Math.sin(now * 0.0002) * 120;
        const goldGlowY = H * 0.4 + Math.cos(now * 0.0003) * 100;
        const goldGrad = bgCtx.createRadialGradient(goldGlowX, goldGlowY, 0, goldGlowX, goldGlowY, 500);
        goldGrad.addColorStop(0, 'rgba(245, 184, 61, 0.12)');
        goldGrad.addColorStop(1, 'rgba(245, 184, 61, 0)');
        bgCtx.fillStyle = goldGrad;
        bgCtx.fillRect(0, 0, W, H);

        const purpleGlowX = W * 0.75 + Math.cos(now * 0.00025) * 140;
        const purpleGlowY = H * 0.65 + Math.sin(now * 0.0002) * 110;
        const purpleGrad = bgCtx.createRadialGradient(purpleGlowX, purpleGlowY, 0, purpleGlowX, purpleGlowY, 550);
        purpleGrad.addColorStop(0, 'rgba(139, 92, 246, 0.10)');
        purpleGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
        bgCtx.fillStyle = purpleGrad;
        bgCtx.fillRect(0, 0, W, H);

        // Render Atmospheric Kinetic Typography
        const currentTypography = getTypography();
        currentTypography.forEach((item, idx) => {
          const driftX = Math.sin(now * item.driftSpeedX + idx) * 16;
          const driftY = Math.cos(now * item.driftSpeedY + idx * 1.5) * 12;
          const posX = W * item.xRatio + driftX;
          const posY = H * item.yRatio + driftY;

          const dx = posX - m.x;
          const dy = posY - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const prox = Math.max(0, 1 - dist / 340);

          const finalAlpha = Math.min(0.14, item.baseAlpha + prox * 0.08);

          bgCtx.save();
          bgCtx.translate(posX, posY);
          bgCtx.rotate(item.rotation);
          bgCtx.font = `900 ${item.fontSize}px 'Inter', sans-serif`;
          bgCtx.textAlign = 'center';
          bgCtx.textBaseline = 'middle';

          if (prox > 0.1) {
            bgCtx.shadowColor = 'rgba(245, 184, 61, 0.45)';
            bgCtx.shadowBlur = 20;
          }

          bgCtx.fillStyle = `rgba(245, 184, 61, ${finalAlpha.toFixed(3)})`;
          bgCtx.fillText(item.text, 0, 0);
          bgCtx.restore();
        });

        // Render Floating Gold Ambient Particles
        bgParticlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = W;
          if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H;
          if (p.y > H) p.y = 0;

          bgCtx.beginPath();
          bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          bgCtx.fillStyle = `rgba(245, 184, 61, ${p.alpha})`;
          bgCtx.fill();
        });
      }

      // ── B. Render Cursor Star Trail Canvas (z-[99999]) ───────────────────────
      cursorCtx.clearRect(0, 0, W, H);
      if (hasFinePointer && !prefersReducedMotionRef.current) {
        const particles = cursorParticlesRef.current;
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

          drawFourPointStar(cursorCtx, p.x, p.y, currentSize, innerRadius, p.rotation, p.alpha, p.isSpecial);

          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [getTypography, uiTheme]);

  return (
    <>
      {/* Background Atmosphere Canvas (z-0, behind content) */}
      <canvas
        ref={bgCanvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0 block"
      />

      {/* Gold Star Trail Cursor Canvas (z-[99999], top overlay) */}
      <canvas
        ref={cursorCanvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-[99999] block"
      />
    </>
  );
}

export default TeamSyncAtmosphere;
