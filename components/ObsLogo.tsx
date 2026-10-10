"use client";
import { useEffect, useState } from "react";
import { DEFAULT_LOGO_URL, getCachedIdentity } from "@/lib/theme";

// Logo Obsidian (celui des réglages d'identité), pour fiches / avis de recherche.
export function ObsLogo({ size = 34, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  const [src, setSrc] = useState(DEFAULT_LOGO_URL);
  useEffect(() => { try { const u = getCachedIdentity()?.logoUrl; if (u) setSrc(u); } catch {} }, []);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Obsidian" className={className} referrerPolicy="no-referrer" style={{ width: size, height: size, objectFit: "contain", ...style }} />;
}
