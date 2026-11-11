"use client";
import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";

interface Client { discord_id: string; discord_name: string; nom_rp: string; tel_rp: string; id_perso: string; created_at: string; updated_at?: string; }

export default function ComptesClients() {
  const { user, loading } = useCurrentUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user || !hasPermission(user, "avocat_clients")) { window.location.href = "/avocat"; return; }
    fetch("/api/avocat/clients").then(r => r.json()).then(d => {
      if (d.error) setErreur(d.error); else setClients(d.clients || []);
      setChargement(false);
    });
  }, [loading, user]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c => [c.discord_name, c.nom_rp, c.tel_rp, c.id_perso, c.discord_id].some(v => (v || "").toLowerCase().includes(q)));
  }, [clients, recherche]);

  if (loading || !user) return null;

  return (
    <div className="page-container">
      <a className="back-link" href="/avocat">Retour à l'espace avocat</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Comptes clients</h1>
          <p className="page-subtitle">{clients.length} compte(s) enregistré(s)</p>
          <div className="gold-line" />
        </div>
      </div>

      <div className="form-group">
        <input placeholder="Rechercher : pseudo, nom RP, téléphone, ID perso, ID Discord..." value={recherche} onChange={e => setRecherche(e.target.value)} />
      </div>

      {erreur && <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>{erreur}</div>}
      {chargement ? <div style={{ color: "var(--text-dim)" }}>Chargement...</div> : (
        <div className="cab-card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-dim)" }}>
                <th style={{ padding: "0.5rem" }}>Pseudo Discord</th>
                <th style={{ padding: "0.5rem" }}>Nom RP</th>
                <th style={{ padding: "0.5rem" }}>Téléphone RP</th>
                <th style={{ padding: "0.5rem" }}>ID perso</th>
                <th style={{ padding: "0.5rem" }}>ID Discord</th>
                <th style={{ padding: "0.5rem" }}>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map(c => (
                <tr key={c.discord_id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.5rem", fontWeight: 600 }}>{c.discord_name}</td>
                  <td style={{ padding: "0.5rem" }}>{c.nom_rp}</td>
                  <td style={{ padding: "0.5rem" }}>{c.tel_rp}</td>
                  <td style={{ padding: "0.5rem" }}>{c.id_perso}</td>
                  <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{c.discord_id}</td>
                  <td style={{ padding: "0.5rem" }}>{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
              {filtres.length === 0 && <tr><td colSpan={6} style={{ padding: "1rem", color: "var(--text-dim)" }}>Aucun compte.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
