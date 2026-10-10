"use client";
import { useEffect } from "react";

// L'armurerie est désormais intégrée à la page Stocks (même stock, filtre « Armurerie »).
export default function ArmurerieRedirect() {
  useEffect(() => { window.location.replace("/obsidian/stocks?cat=armurerie"); }, []);
  return <div className="page-container" style={{ color: "var(--text-dim)" }}>Redirection vers Stocks...</div>;
}
