import { useRef, useCallback } from "react";

/**
 * Fait légèrement incliner un élément (carte, modal) en 3D pour suivre la souris,
 * façon "carte à collectionner". Purement visuel, aucun état React (tout passe par
 * ref.style pour rester fluide à 60fps sans re-render).
 *
 * Utilisation : <div ref={tiltRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
 */
export function use3DTilt<T extends HTMLElement>(maxDeg = 6) {
  const ref = useRef<T | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;  // 0 → 1
    const py = (e.clientY - rect.top) / rect.height;   // 0 → 1
    const rotateY = (px - 0.5) * (maxDeg * 2);
    const rotateX = -(py - 0.5) * (maxDeg * 2);
    el.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
  }, [maxDeg]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "rotateY(0deg) rotateX(0deg)";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
