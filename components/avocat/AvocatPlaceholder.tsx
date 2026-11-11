"use client";
import { useEffect } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";

interface Props { title: string; icon: React.ReactNode; desc: string; }

export default function AvocatPlaceholder({ title, icon, desc }: Props) {
  const { user, loading } = useCurrentUser();
  useEffect(() => {
    if (!loading && (!user || !hasPermission(user, "avocat"))) window.location.href = "/login";
  }, [user, loading]);
  if (loading || !user) return null;
  return (
    <div className="page-container">
      <a className="back-link" href="/avocat">← Espace avocat</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">{icon} {title}</h1>
          <p className="page-subtitle">{desc}</p>
          <div className="gold-line" />
        </div>
      </div>
      <div className="empty-state">
        <div className="empty-icon">{icon}</div>
        <div className="empty-title">Bientôt disponible</div>
      </div>
    </div>
  );
}