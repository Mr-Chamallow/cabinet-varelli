"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", icon: "🏠", label: "Accueil" },
  { href: "/obsidian/fiches", icon: "🗂️", label: "Fiches" },
  { href: "/obsidian/arrestations", icon: "🚔", label: "Arrests" },
  { href: "/cahier-vente", icon: "🧮", label: "Transaction" },
];
// Barre du bas (mobile) : 4 raccourcis + menu.
export function BottomBar({ onMenu }: { onMenu: () => void }) {
  const path = usePathname() || "/";
  return (
    <nav className="bottombar" aria-label="Raccourcis">
      {ITEMS.map(i => { const on = i.href === "/" ? path === "/" : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} className={on ? "on" : ""}><span>{i.icon}</span><small>{i.label}</small></Link>; })}
      <button type="button" onClick={onMenu}><span>☰</span><small>Menu</small></button>
    </nav>
  );
}
