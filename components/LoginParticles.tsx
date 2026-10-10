"use client";
import { useEffect, useRef } from "react";

// Particules « cendres d'obsidienne » qui dérivent lentement derrière la page de connexion.
export function LoginParticles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d")!; let w = 0, h = 0, raf = 0;
    const gold = getComputedStyle(document.documentElement).getPropertyValue("--gold-rgb").trim() || "201,162,77";
    const size = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; }; size(); window.addEventListener("resize", size);
    const P = Array.from({ length: 70 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + .4, v: Math.random() * .25 + .05, a: Math.random() * Math.PI * 2, o: Math.random() * .5 + .15 }));
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        p.y -= p.v; p.x += Math.sin(p.a += .008) * .3; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = `rgba(${gold},${p.o})`; ctx.shadowColor = `rgba(${gold},.8)`; ctx.shadowBlur = 8; ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick(); return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
}
