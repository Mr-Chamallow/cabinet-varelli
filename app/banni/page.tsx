"use client";

import { useSession, signOut } from "next-auth/react";

export default function BanniPage() {
  const { data: session } = useSession();
  const reason = (session?.user as any)?.ban_reason as string | undefined;

  return (
    <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div className="empty-state">
        <div className="empty-icon">🚫</div>
        <div className="empty-title">Accès suspendu</div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginTop: "0.75rem", maxWidth: 420 }}>
          Ton accès au site a été suspendu par un administrateur.
        </p>
        {reason && (
          <p style={{ fontSize: "0.85rem", color: "var(--text)", marginTop: "0.5rem", padding: "0.75rem 1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius)" }}>
            Motif : {reason}
          </p>
        )}
        <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.75rem" }}>
          Si tu penses qu'il s'agit d'une erreur, contacte un administrateur.
        </p>
        <button className="btn btn-outline" style={{ marginTop: "1.25rem" }} onClick={() => signOut({ callbackUrl: "/login" })}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
