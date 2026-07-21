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
        <div className="logo-text" style={{ marginBottom: "1.5rem" }}>CABINET BULLHEAD</div>
        {discordError && <p style={{ color: "#ef4444", marginBottom: "1rem" }}>Connexion refusée. Réessaie.</p>}
        <button className="btn btn-primary" onClick={() => signIn("discord")}>
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
