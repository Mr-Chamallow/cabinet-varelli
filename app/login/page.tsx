"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const discordError = params?.get("error");

  useEffect(() => {
    if (status === "authenticated") router.push("/");
  }, [status, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: "1.6rem", fontWeight: 700,
          color: "var(--gold)", letterSpacing: "0.1em", marginBottom: "0.5rem"
        }}>🖤 OBSIDIAN LOGISTIQUE</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "2rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Accès réservé
        </div>
        {discordError && <p style={{ color: "#ef4444", marginBottom: "1rem" }}>Connexion refusée. Réessaie.</p>}
        <button className="btn btn-gold" onClick={() => signIn("discord")}>
          Se connecter avec Discord
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}