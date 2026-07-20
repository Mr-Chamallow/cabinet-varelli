"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const discordError = params?.get("error");
  const [nom, setNom] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !password.trim()) return;
    setLoading(true); setError(null);
    try {
      if (!supabase) { setError("Base de données non disponible"); setLoading(false); return; }
      const { data, error: err } = await supabase
        .from("membres").select("*")
        .eq("nom", nom.trim()).eq("actif", true).single();
      if (err || !data) { setError("Membre non trouvé ou inactif"); setLoading(false); return; }
      if (data.password && data.password !== password) { setError("Mot de passe incorrect"); setLoading(false); return; }
      setUser({ id: data.id, nom: data.nom, role: data.role, couleur: data.couleur });
      router.push("/");
    } catch { setError("Erreur de connexion"); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <div style={{ width:"100%", maxWidth:420, padding:"0 1rem" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.3rem", fontWeight:900, color:"var(--gold)", letterSpacing:"0.1em" }}>CABINET BULLHEAD</div>
          <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginTop:"0.25rem" }}>Obsidian Logistics · Los Santos</div>
        </div>
        <div className="card" style={{ padding:"2rem" }}>
          {error && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"var(--radius)", padding:"0.625rem 0.875rem", fontSize:"0.78rem", color:"var(--danger)", marginBottom:"1rem" }}>❌ {error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group"><label>Nom de membre</label><input autoFocus value={nom} onChange={e=>setNom(e.target.value)} placeholder="Marco Varelli"/></div>
            <div className="form-group"><label>Mot de passe</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div>
            <button type="submit" className="btn btn-gold" disabled={loading||!nom.trim()||!password.trim()} style={{ width:"100%", justifyContent:"center", padding:"0.875rem" }}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", margin:"1rem 0" }}>
            <div style={{ flex:1, height:1, background:"var(--border)" }}/><span style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>ou</span><div style={{ flex:1, height:1, background:"var(--border)" }}/>
          </div>
          {discordError && (
            <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"var(--radius)", padding:"0.625rem 0.875rem", fontSize:"0.78rem", color:"var(--danger)", marginBottom:"0.75rem", textAlign:"center" }}>
              {discordError==="not_member" ? "⛔ Tu n'es pas membre du serveur Obsidian Logistics." : "❌ Erreur Discord. Réessaie."}
            </div>
          )}
          <a href="/api/auth/signin/discord" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.75rem", width:"100%", padding:"0.875rem", borderRadius:"var(--radius)", background:"#5865F2", color:"#fff", fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:"0.9rem", textDecoration:"none" }}>
            <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="white"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07Z"/></svg>
            Se connecter avec Discord
          </a>
        </div>
      </div>
    </div>
  );
}