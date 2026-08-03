"use client";

import { useEffect, useRef, useState } from "react";

export function SplashAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(1);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    let animId: number;
    let time = 0;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    // ── 水波纹点阵 ──
    const cols = 70;
    const rows = 50;
    const points: { x: number; y: number; baseX: number; baseY: number; phase: number }[] = [];

    const initPoints = () => {
      points.length = 0;
      const spacingX = W / cols;
      const spacingY = H / rows;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacingX + spacingX / 2;
          const y = j * spacingY + spacingY / 2;
          points.push({
            x,
            y,
            baseX: x,
            baseY: y,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    // ── ins风白色毛玻璃背景 ──
    const drawGlass = () => {
      // 主背景：纯净白
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
      grad.addColorStop(0.5, "rgba(250, 250, 252, 0.95)");
      grad.addColorStop(1, "rgba(245, 245, 248, 0.92)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 毛玻璃效果
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, 0, W, H);

      // 柔和光晕
      const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.5);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.30)");
      glow.addColorStop(0.5, "rgba(250, 250, 255, 0.15)");
      glow.addColorStop(1, "rgba(240, 240, 245, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    };

    // ── 水波纹 ──
    const drawRipples = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      drawGlass();

      // 点阵波纹（极淡灰）
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const wave1 = Math.sin(p.baseX * 0.02 + t * 0.008 + p.phase) * 6;
        const wave2 = Math.sin(p.baseY * 0.025 + t * 0.006 + p.phase * 1.3) * 4;
        const wave3 = Math.sin((p.baseX + p.baseY) * 0.015 + t * 0.01) * 3;
        const offset = wave1 + wave2 + wave3;

        const x = p.baseX + offset * 0.4;
        const y = p.baseY + Math.sin(p.baseX * 0.03 + t * 0.007 + p.phase) * 5;

        const alpha = 0.06 + 0.04 * Math.sin(p.baseX * 0.04 + p.baseY * 0.04 + t * 0.005);
        ctx.beginPath();
        ctx.arc(x, y, 1.0 + 0.5 * Math.sin(p.baseX * 0.05 + t * 0.01), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 180, 190, ${alpha})`;
        ctx.fill();
      }

      // 主波纹（大圈）- 极淡灰
      for (let ring = 0; ring < 3; ring++) {
        const radius = 80 + ring * 70 + Math.sin(t * 0.015 + ring * 2) * 20;
        const cx = W / 2 + Math.sin(t * 0.01 + ring * 1.5) * 60;
        const cy = H / 2 + Math.cos(t * 0.012 + ring * 1.8) * 40;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 200, 210, ${0.05 + 0.03 * Math.sin(t * 0.02 + ring)})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // 飘动光点（极淡灰）
      for (let i = 0; i < 14; i++) {
        const angle = t * 0.005 + i * 0.5;
        const dist = 120 + Math.sin(t * 0.01 + i) * 40;
        const x = W / 2 + Math.cos(angle) * dist;
        const y = H / 2 + Math.sin(angle * 0.7 + t * 0.008) * dist * 0.6;
        const size = 1.5 + Math.sin(t * 0.02 + i * 0.7) * 1;
        const a = 0.06 + 0.05 * Math.sin(t * 0.015 + i);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 210, ${a})`;
        ctx.fill();
      }
    };

    // ── 艺术字 ──
    const drawText = (t: number) => {
      const progress = Math.min(t / 800, 1);
      const textOpacity = progress * 0.95;

      ctx.save();
      ctx.globalAlpha = textOpacity;

      const lines = ["Welcome to", "Serein"];
      const fontSize = Math.min(W * 0.085, 72);
      const lineHeight = fontSize * 1.3;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 极淡阴影
      ctx.shadowColor = "rgba(0, 0, 0, 0.04)";
      ctx.shadowBlur = 30;

      for (let i = 0; i < lines.length; i++) {
        const y = H / 2 - lineHeight * 0.3 + i * lineHeight;
        const letterSpacing = fontSize * 0.12;

        const chars = lines[i].split("");
        let totalWidth = 0;
        const charWidths: number[] = [];
        ctx.font = `italic ${fontSize}px "Georgia", "Times New Roman", serif`;

        for (const ch of chars) {
          const w = ctx.measureText(ch).width;
          charWidths.push(w);
          totalWidth += w + letterSpacing;
        }
        totalWidth -= letterSpacing;

        let cx = W / 2 - totalWidth / 2;
        for (let j = 0; j < chars.length; j++) {
          const ch = chars[j];
          const w = charWidths[j];

          const angle = (Math.sin(t * 0.008 + j * 0.3 + i * 0.5) * 0.015) + (j - chars.length / 2) * 0.008;
          const yOff = Math.sin(t * 0.01 + j * 0.4 + i) * 2;

          ctx.save();
          ctx.translate(cx + w / 2, y + yOff);
          ctx.rotate(angle);

          // 深灰渐变文字（ins风）
          const grad = ctx.createLinearGradient(-w / 2, -fontSize / 2, w / 2, fontSize / 2);
          grad.addColorStop(0, "rgba(80, 80, 90, 0.85)");
          grad.addColorStop(0.3, "rgba(40, 40, 50, 0.92)");
          grad.addColorStop(0.6, "rgba(60, 60, 70, 0.88)");
          grad.addColorStop(1, "rgba(90, 90, 100, 0.80)");
          ctx.fillStyle = grad;

          ctx.font = `italic 300 ${fontSize}px "Georgia", "Times New Roman", serif`;
          ctx.shadowColor = "rgba(0, 0, 0, 0.04)";
          ctx.shadowBlur = 20;

          ctx.fillText(ch, 0, 0);

          // 装饰点（极淡灰）
          if (ch === "W" || ch === "S" || ch === "e" || ch === "i") {
            ctx.shadowBlur = 0;
            const dotSize = 1.5 + Math.sin(t * 0.01 + j) * 1;
            ctx.fillStyle = `rgba(180, 180, 190, ${0.10 + 0.05 * Math.sin(t * 0.015 + j)})`;
            ctx.beginPath();
            ctx.arc(w / 2 + 2, fontSize * 0.2, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
          cx += w + letterSpacing;
        }
      }

      // 底部装饰线（极淡灰）
      const lineY = H / 2 + lineHeight * 0.8;
      ctx.shadowBlur = 0;
      ctx.globalAlpha = textOpacity * 0.25;
      ctx.strokeStyle = "rgba(180, 180, 190, 0.15)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      const startX = W / 2 - 80 - Math.sin(t * 0.01) * 20;
      const endX = W / 2 + 80 + Math.sin(t * 0.012 + 0.5) * 20;
      ctx.moveTo(startX, lineY);
      for (let x = startX; x < endX; x += 2) {
        const wave = Math.sin(x * 0.03 + t * 0.015) * 3 + Math.sin(x * 0.05 + t * 0.02) * 1.5;
        ctx.lineTo(x, lineY + wave);
      }
      ctx.stroke();

      ctx.restore();
    };

    const animate = (timestamp: number) => {
      time = timestamp;
      drawRipples(timestamp);
      drawText(timestamp);

      if (timestamp > 3500) {
        const fadeProgress = (timestamp - 3500) / 1200;
        const newOpacity = Math.max(0, 1 - fadeProgress);
        setOpacity(newOpacity);
        if (newOpacity <= 0) {
          setShow(false);
          return;
        }
      }

      animId = requestAnimationFrame(animate);
    };

    resize();
    initPoints();
    window.addEventListener("resize", () => {
      resize();
      initPoints();
    });

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        opacity: opacity,
        transition: "opacity 0.8s ease-out",
        pointerEvents: "none",
        background: "linear-gradient(160deg, rgba(255, 255, 255, 0.92), rgba(248, 248, 250, 0.95))",
        backdropFilter: "blur(20px) saturate(1.1)",
        WebkitBackdropFilter: "blur(20px) saturate(1.1)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100vw",
          height: "100vh",
          display: "block",
        }}
      />
    </div>
  );
}
