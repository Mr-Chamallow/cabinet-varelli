// Gestes tactiles : balayage depuis le bord (ouvre le menu) et tirer-pour-rafraîchir.
export function installGestures(opts: { openMenu: () => void; closeMenu: () => void; isOpen: () => boolean }) {
  if (typeof window === "undefined" || !window.matchMedia("(max-width: 768px)").matches) return () => {};
  let x0 = 0, y0 = 0, t0 = 0, pulling = false, ind: HTMLDivElement | null = null;
  const start = (e: TouchEvent) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); pulling = window.scrollY <= 0 && !(e.target as HTMLElement)?.closest?.(".modal, .modal-overlay, input, textarea, select, [data-noswipe]"); };
  const move = (e: TouchEvent) => {
    if (!pulling || opts.isOpen()) return; const dy = e.touches[0].clientY - y0; const dx = Math.abs(e.touches[0].clientX - x0);
    if (dy > 12 && dx < 40) { if (!ind) { ind = document.createElement("div"); ind.className = "ptr"; ind.textContent = "↓"; document.body.appendChild(ind); }
      ind.style.transform = `translate(-50%, ${Math.min(dy, 110) - 40}px) rotate(${Math.min(dy, 110) * 3}deg)`; ind.classList.toggle("ready", dy > 90); }
  };
  const end = (e: TouchEvent) => {
    const t = e.changedTouches[0]; const dx = t.clientX - x0, dy = t.clientY - y0; const fast = Date.now() - t0 < 600;
    if (ind) { const ready = ind.classList.contains("ready"); ind.remove(); ind = null; if (ready) { location.reload(); return; } }
    if (fast && Math.abs(dy) < 50) {
      if (!opts.isOpen() && x0 < 24 && dx > 70) opts.openMenu();
      else if (opts.isOpen() && dx < -70) opts.closeMenu();
    }
  };
  window.addEventListener("touchstart", start, { passive: true }); window.addEventListener("touchmove", move, { passive: true }); window.addEventListener("touchend", end, { passive: true });
  return () => { window.removeEventListener("touchstart", start); window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); ind?.remove(); };
}
