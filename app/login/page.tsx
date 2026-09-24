"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { getCachedIdentity, cacheIdentity, applyCachedThemeIfAny, applyThemeToDocument, DEFAULT_LOGO_URL, DEFAULT_APP_NOM, DEFAULT_GOLD, isValidHex, Identity } from "@/lib/theme";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const discordError = params?.get("error");
  const [identity, setIdentity] = useState<Identity>({ logoUrl: DEFAULT_LOGO_URL, appNom: DEFAULT_APP_NOM });

  useEffect(() => {
    if (status === "authenticated") router.push("/");
  }, [status, router]);

  // Même identité (logo, nom, couleur) que la Sidebar — avant, /login gardait un cœur
  // noir et un nom figés, seule page du site à ne pas suivre la Personnalisation.
  useEffect(() => {
    applyCachedThemeIfAny();
    setIdentity(getCachedIdentity());
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from("app_settings").select("cle,valeur").in("cle", ["logo_url", "app_nom", "couleur_gold"]);
      if (!data) return;
      const m: Record<string, string> = {};
      data.forEach((r: any) => { m[r.cle] = r.valeur; });
      const next: Identity = { logoUrl: m["logo_url"] || DEFAULT_LOGO_URL, appNom: m["app_nom"] || DEFAULT_APP_NOM };
      setIdentity(next);
      cacheIdentity(next);
      if (m["couleur_gold"] && isValidHex(m["couleur_gold"])) applyThemeToDocument(m["couleur_gold"]);
      else applyThemeToDocument(DEFAULT_GOLD);
    })();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div className="ambient-glow" style={{ top: "20%", left: "50%", transform: "translateX(-50%)" }} />
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <img
          src={identity.logoUrl}
          alt=""
          style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 12, marginBottom: "1rem", boxShadow: "var(--shadow-gold)" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: "1.6rem", fontWeight: 700,
          color: "var(--gold)", letterSpacing: "0.1em", marginBottom: "0.5rem"
        }}>{identity.appNom}</div>
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