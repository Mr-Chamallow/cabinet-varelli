import { useCallback } from "react";

/**
 * Fait légèrement incliner un élément (carte, modal) en 3D pour suivre la souris,
 * façon "carte à collectionner". Purement visuel : le style est écrit directement
 * sur l'élément survolé (e.currentTarget), sans re-rendu et sans ref.
 *
 * Utilisation : <div onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
 */
export function use3DTilt<T extends HTMLElement>(maxDeg = 6) {
  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;  // 0 -> 1
    const py = (e.clientY - rect.top) / rect.height;   // 0 -> 1
    const rotateY = (px - 0.5) * (maxDeg * 2);
    const rotateX = -(py - 0.5) * (maxDeg * 2);
    el.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
  }, [maxDeg]);

  const onMouseLeave = useCallback((e: React.MouseEvent<T>) => {
    e.currentTarget.style.transform = "rotateY(0deg) rotateX(0deg)";
  }, []);

  return { onMouseMove, onMouseLeave };
}
