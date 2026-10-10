"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";

const HIDDEN = ["/login", "/carte-enqueteur", "/banni", "/no-access"];

// Bouton flottant « + » : saisie rapide vers les formulaires ouverts directement.
export function QuickEntry() {
  const pathname = usePathname() || "";
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  if (!user || HIDDEN.some(h => pathname.startsWith(h))) return null;

  const items = [
    { perm: "obsidian_actions", icon: "🕶️", label: "Action illégale", href: "/obsidian/actions-illegales?new=1" },
    { perm: "obsidian_arrestations", icon: "🚔", label: "Arrestation", href: "/obsidian/arrestations?new=1" },
    { perm: "obsidian_comptabilite", icon: "💳", label: "Opération compta", href: "/obsidian/comptabilite?new=1" },
    { perm: "obsidian_stocks", icon: "📦", label: "Stocks", href: "/obsidian/stocks" },
  ].filter(i => hasPermission(user, i.perm as any));
  if (items.length === 0) return null;

  return (
    <div style={{ position: "fixed", right: "1.5rem", bottom: "5rem", zIndex: 900, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
      {open && items.map((i, idx) => (
        <a key={i.href} href={i.href} onClick={() => setOpen(false)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.9rem", borderRadius: 999, background: "var(--card)", border: "1px solid rgba(var(--gold-rgb),0.4)", color: "var(--text)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.35)", animation: `slideUp .25s ease backwards`, animationDelay: `${idx * 40}ms` }}>
          <span>{i.icon}</span>{i.label}
        </a>
      ))}
      <button onClick={() => setOpen(o => !o)} aria-label="Saisie rapide"
        style={{ width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer", background: "var(--gold)", color: "#000", fontSize: "1.6rem", fontWeight: 700, boxShadow: "0 6px 20px rgba(0,0,0,0.4)", transform: open ? "rotate(45deg)" : "none", transition: "transform .2s var(--ease, ease)" }}>+</button>
    </div>
  );
}
