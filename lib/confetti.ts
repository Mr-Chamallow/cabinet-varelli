// Confettis dorés légers (DOM + CSS, aucune dépendance).
export function fireConfetti(x = window.innerWidth / 2, y = window.innerHeight / 3, n = 36) {
  if (typeof document === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const cols = ["#e8c766", "#c9a24d", "#f4efe2", "#e5484d", "#4cc2ff"];
  const host = document.createElement("div"); host.className = "confetti-host"; document.body.appendChild(host);
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i"); const a = Math.random() * Math.PI * 2, v = 90 + Math.random() * 220;
    p.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % cols.length]};--dx:${Math.cos(a) * v}px;--dy:${Math.sin(a) * v - 120}px;--r:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 0.1}s`;
    host.appendChild(p);
  }
  setTimeout(() => host.remove(), 2200);
}
