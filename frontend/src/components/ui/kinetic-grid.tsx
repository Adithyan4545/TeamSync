"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useUI } from "@/context/UIContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  born: number;
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

// ─── TeamSync Specific Concepts ────────────────────────────────────────────────

const TEAMSYNC_TYPOGRAPHY: ConceptTypography[] = [
  { text: "TEAMSYNC", xRatio: 0.12, yRatio: 0.18, fontSize: 56, rotation: -0.05, baseAlpha: 0.08, driftSpeedX: 0.0002, driftSpeedY: 0.0003 },
  { text: "FIND YOUR TEAM", xRatio: 0.72, yRatio: 0.14, fontSize: 32, rotation: 0.04, baseAlpha: 0.06, driftSpeedX: -0.0003, driftSpeedY: 0.0002 },
  { text: "BUILD YOUR IDEA", xRatio: 0.78, yRatio: 0.42, fontSize: 36, rotation: -0.03, baseAlpha: 0.07, driftSpeedX: 0.0002, driftSpeedY: -0.0003 },
  { text: "WIN TOGETHER", xRatio: 0.15, yRatio: 0.72, fontSize: 42, rotation: 0.05, baseAlpha: 0.08, driftSpeedX: -0.0002, driftSpeedY: 0.0004 },
  { text: "HACKATHON DISCOVERY", xRatio: 0.52, yRatio: 0.82, fontSize: 28, rotation: -0.02, baseAlpha: 0.05, driftSpeedX: 0.0003, driftSpeedY: -0.0002 },
  { text: "AI TEAM MATCHING", xRatio: 0.35, yRatio: 0.32, fontSize: 30, rotation: 0.03, baseAlpha: 0.07, driftSpeedX: -0.0004, driftSpeedY: 0.0003 },
  { text: "SMART TEAMMATES", xRatio: 0.62, yRatio: 0.62, fontSize: 26, rotation: -0.04, baseAlpha: 0.05, driftSpeedX: 0.0003, driftSpeedY: 0.0002 },
  { text: "INDIA-WIDE HACKATHONS", xRatio: 0.22, yRatio: 0.52, fontSize: 24, rotation: 0.02, baseAlpha: 0.05, driftSpeedX: -0.0002, driftSpeedY: -0.0003 },
  { text: "TEAM COLLABORATION", xRatio: 0.75, yRatio: 0.28, fontSize: 24, rotation: -0.05, baseAlpha: 0.05, driftSpeedX: 0.0003, driftSpeedY: 0.0002 },
  { text: "SKILL MATCHING", xRatio: 0.42, yRatio: 0.16, fontSize: 22, rotation: 0.03, baseAlpha: 0.05, driftSpeedX: -0.0003, driftSpeedY: 0.0003 },
  { text: "BUILD • COLLABORATE • COMPETE", xRatio: 0.38, yRatio: 0.91, fontSize: 20, rotation: -0.02, baseAlpha: 0.04, driftSpeedX: 0.0002, driftSpeedY: -0.0002 },
  { text: "DISCOVER • CONNECT • CREATE", xRatio: 0.08, yRatio: 0.38, fontSize: 20, rotation: 0.04, baseAlpha: 0.05, driftSpeedX: -0.0002, driftSpeedY: 0.0003 },
  { text: "YOUR SKILLS. YOUR TEAM. YOUR HACKATHON.", xRatio: 0.58, yRatio: 0.08, fontSize: 18, rotation: -0.03, baseAlpha: 0.04, driftSpeedX: 0.0003, driftSpeedY: 0.0002 },
  { text: "HACKATHONS", xRatio: 0.88, yRatio: 0.78, fontSize: 28, rotation: 0.04, baseAlpha: 0.05, driftSpeedX: -0.0003, driftSpeedY: -0.0002 },
  { text: "AI MATCH", xRatio: 0.05, yRatio: 0.88, fontSize: 26, rotation: -0.03, baseAlpha: 0.06, driftSpeedX: 0.0002, driftSpeedY: 0.0004 },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL_SIZE = 90;
const INFLUENCE_RADIUS = 260;
const MAX_WARP = 15;
const DOT_SPACING = 40;
const LERP_SPEED = 0.04;

const LINE_BASE = { r: 245, g: 184, b: 61, a: 0.03 };
const NODE_BASE_RADIUS = 1.2;
const NODE_ACTIVE_RADIUS = 2.0;

function lerpN(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(
  base: { r: number; g: number; b: number; a: number },
  active: { r: number; g: number; b: number; a: number },
  t: number,
): string {
  const r = Math.round(lerpN(base.r, active.r, t));
  const g = Math.round(lerpN(base.g, active.g, t));
  const b = Math.round(lerpN(base.b, active.b, t));
  const a = lerpN(base.a, active.a, t);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

export default function KineticGrid({
  className,
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme: uiTheme } = useUI();

  const mouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const targetMouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const isMobileRef = useRef<boolean>(false);

  const getWarpedPoint = useCallback(
    (
      gx: number,
      gy: number,
      col: number,
      row: number,
      mouse: Point,
      ripples: Ripple[],
      cols: number,
      rows: number,
    ): { pt: Point; proximity: number } => {
      const edgeMargin = 1.5;
      const colPin = Math.min(col / edgeMargin, (cols - 1 - col) / edgeMargin, 1);
      const rowPin = Math.min(row / edgeMargin, (rows - 1 - row) / edgeMargin, 1);
      const pinFactor = colPin * colPin * rowPin * rowPin;

      const dx = gx - mouse.x;
      const dy = gy - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const proximity = Math.max(0, 1 - dist / INFLUENCE_RADIUS) * pinFactor;

      let rx = 0, ry = 0;
      for (const r of ripples) {
        const rdx = gx - r.x;
        const rdy = gy - r.y;
        const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
        const waveWidth = 55;
        const diff = rdist - r.radius;
        if (Math.abs(diff) < waveWidth) {
          const strength = (1 - Math.abs(diff) / waveWidth) * r.opacity * 10 * pinFactor;
          const angle = Math.atan2(rdy, rdx);
          const sign = diff < 0 ? -1 : 1;
          rx += Math.cos(angle) * strength * sign * -1;
          ry += Math.sin(angle) * strength * sign * -1;
        }
      }

      if (dist < INFLUENCE_RADIUS && dist > 0 && pinFactor > 0 && !isMobileRef.current) {
        const t = dist / INFLUENCE_RADIUS;
        const eased = t < 0.01 ? 0 : (1 - t) * (1 - t) * Math.min(1, dist / 60);
        const warpAmt = eased * MAX_WARP * pinFactor;
        const angle = Math.atan2(dy, dx);
        return {
          pt: {
            x: gx - Math.cos(angle) * warpAmt + rx,
            y: gy - Math.sin(angle) * warpAmt + ry,
          },
          proximity,
        };
      }

      return { pt: { x: gx + rx, y: gy + ry }, proximity };
    },
    [],
  );

  const draw = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { w: W, h: H } = sizeRef.current;
      const mouse = mouseRef.current;
      const ripples = ripplesRef.current;
      const isDark = uiTheme !== 'light';

      const theme = {
        lineActive: { r: 245, g: 184, b: 61, a: 0.12 },
        nodeActive: { r: 255, g: 215, b: 106, a: 0.3 },
        glow: "245,184,61",
        ripple: "255,215,106",
        dot: isDark ? "rgba(245,184,61,0.025)" : "rgba(0,0,0,0.03)",
      };

      ctx.clearRect(0, 0, W, H);

      // ── 1. Draw TeamSync Atmospheric Typography (Layer 0) ─────────────────
      if (isDark && !isMobileRef.current) {
        TEAMSYNC_TYPOGRAPHY.forEach((item, idx) => {
          const driftX = Math.sin(now * item.driftSpeedX + idx) * 14;
          const driftY = Math.cos(now * item.driftSpeedY + idx * 1.5) * 10;
          const posX = W * item.xRatio + driftX;
          const posY = H * item.yRatio + driftY;

          // Mouse Proximity Activation
          const dx = posX - mouse.x;
          const dy = posY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const prox = Math.max(0, 1 - dist / 320);

          const finalAlpha = Math.min(0.14, item.baseAlpha + prox * 0.08);

          ctx.save();
          ctx.translate(posX, posY);
          ctx.rotate(item.rotation);
          ctx.font = `900 ${item.fontSize}px 'Inter', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (prox > 0.1) {
            ctx.shadowColor = 'rgba(245, 184, 61, 0.4)';
            ctx.shadowBlur = 18;
          }

          // Dark Gold Ambient Fill
          ctx.fillStyle = `rgba(245, 184, 61, ${finalAlpha.toFixed(3)})`;
          ctx.fillText(item.text, 0, 0);
          ctx.restore();
        });
      }

      // Mobile check fallback
      if (isMobileRef.current) {
        ctx.fillStyle = theme.dot;
        for (let x = DOT_SPACING / 2; x < W; x += DOT_SPACING * 2) {
          for (let y = DOT_SPACING / 2; y < H; y += DOT_SPACING * 2) {
            ctx.beginPath();
            ctx.arc(x, y, 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        return;
      }

      // ── 2. Background Grid Dots ───────────────────────────────────────────
      ctx.fillStyle = theme.dot;
      for (let x = DOT_SPACING / 2; x < W; x += DOT_SPACING) {
        for (let y = DOT_SPACING / 2; y < H; y += DOT_SPACING) {
          ctx.beginPath();
          ctx.arc(x, y, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 3. Ripples ────────────────────────────────────────────────────────
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = (now - r.born) / 1000;
        r.radius = Math.max(0, age * 300);
        r.opacity = Math.max(0, 1 - age * 1.5);
        if (r.opacity <= 0) ripples.splice(i, 1);
      }

      // ── 4. Kinetic Grid Mesh ──────────────────────────────────────────────
      const cols = Math.max(2, Math.ceil(W / CELL_SIZE)) + 1;
      const rows = Math.max(2, Math.ceil(H / CELL_SIZE)) + 1;
      const cellW = W / (cols - 1);
      const cellH = H / (rows - 1);

      const pts: Point[][] = [];
      const prox: number[][] = [];

      for (let row = 0; row < rows; row++) {
        pts[row] = [];
        prox[row] = [];
        for (let col = 0; col < cols; col++) {
          const { pt, proximity } = getWarpedPoint(
            col * cellW,
            row * cellH,
            col,
            row,
            mouse,
            ripples,
            cols,
            rows,
          );
          pts[row][col] = pt;
          prox[row][col] = proximity;
        }
      }

      const drawSeg = (p1: Point, p2: Point, pr1: number, pr2: number) => {
        const avg = (pr1 + pr2) / 2;
        const t = avg * avg * (3 - 2 * avg);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = lerpColor(LINE_BASE, theme.lineActive, t);
        ctx.lineWidth = lerpN(0.5, 1.0, t);
        ctx.stroke();
      };

      ctx.lineCap = "butt";

      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols - 1; col++)
          drawSeg(pts[row][col], pts[row][col + 1], prox[row][col], prox[row][col + 1]);

      for (let col = 0; col < cols; col++)
        for (let row = 0; row < rows - 1; row++)
          drawSeg(pts[row][col], pts[row + 1][col], prox[row][col], prox[row + 1][col]);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const p = pts[row][col];
          const pr = prox[row][col];
          const t = pr * pr * (3 - 2 * pr);
          const r = lerpN(NODE_BASE_RADIUS, NODE_ACTIVE_RADIUS, t);

          if (t > 0.3) {
            const glowR = r + lerpN(0, 4, (t - 0.3) / 0.7);
            const grd = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, glowR);
            grd.addColorStop(0, `rgba(${theme.glow},${(t * 0.1).toFixed(3)})`);
            grd.addColorStop(1, `rgba(${theme.glow},0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = lerpColor(
            { r: 245, g: 184, b: 61, a: isDark ? 0.05 : 0.1 },
            theme.nodeActive,
            t,
          );
          ctx.fill();
        }
      }

      for (const r of ripples) {
        const safeRadius = Math.max(0, r.radius);
        ctx.beginPath();
        ctx.arc(r.x, r.y, safeRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${theme.ripple},${(r.opacity * 0.15).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
    [getWarpedPoint, uiTheme],
  );

  const animate = useCallback(
    function animateFn(now: number) {
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(animateFn);
        return;
      }

      const m = mouseRef.current;
      const t = targetMouseRef.current;

      m.x = lerpN(m.x, t.x, LERP_SPEED);
      m.y = lerpN(m.y, t.y, LERP_SPEED);

      draw(now);
      rafRef.current = requestAnimationFrame(animateFn);
    },
    [draw],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      sizeRef.current = { w, h };
      isMobileRef.current = w < 768;
      if (mouseRef.current.x === -9999) {
        mouseRef.current = { x: -9999, y: -9999 };
        targetMouseRef.current = { x: -9999, y: -9999 };
      }
    };

    setSize();
    window.addEventListener("resize", setSize);

    const onMouseMove = (e: MouseEvent) => {
      if (isMobileRef.current) return;
      targetMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onClick = (e: MouseEvent) => {
      if (isMobileRef.current) return;
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        opacity: 1,
        born: performance.now(),
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animate]);

  return (
    <div
      className={cn(
        "fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden bg-[#030303]",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full opacity-90"
      />
    </div>
  );
}
