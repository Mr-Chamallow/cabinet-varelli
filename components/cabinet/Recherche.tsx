"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";

// Recherche globale : clients, dossiers, factures
export default function Recherche() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<any>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); setErreur(""); return; }
    const t = setTimeout(() => {
      fetch(`/api/cabinet/recherche?q=${encodeURIComponent(q.trim())}`).then(r => r.json()).then(d => {
        if (d.error) { setErreur(d.error); return; }
        setErreur(""); setRes(d);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const vide = res && !res.clients.length && !res.dossiers.length && !res.factures.length;
  const carte: React.CSSProperties = { display: "block", marginBottom: "0.5rem", color: "inherit", textDecoration: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Nom, dossier, numéro de facture, identifiant..."
        autoFocus
        style={{ width: "100%", padding: "0.8rem", borderRadius: 8, border: "1px solid var(--border, #333)", background: "transparent", color: "inherit", fontSize: "1rem" }}
      />
      {erreur && <div style={{ color: "var(--danger)" }}>{erreur}</div>}
      {vide && <div className="cab-muted">Aucun résultat.</div>}

      {res?.clients?.length > 0 && (
        <div>
          <h2 className="cab-section-titre">Clients</h2>
          {res.clients.map((c: any) => (
            <Link key={c.discord_id} href={`/avocat/clients/${c.discord_id}`} className="cab-card" style={carte}>
              <b>{c.nom_rp || c.discord_name}</b>{c.id_perso ? <span className="cab-muted"> · {c.id_perso}</span> : null}
            </Link>
          ))}
        </div>
      )}

      {res?.dossiers?.length > 0 && (
        <div>
          <h2 className="cab-section-titre">Dossiers</h2>
          {res.dossiers.map((d: any) => (
            <Link key={d.id} href={`/avocat/dossiers/${d.id}`} className="cab-card" style={carte}>
              <b>{d.titre}</b><span className="cab-muted"> · {d.client_nom} · {d.statut}</span>
            </Link>
          ))}
        </div>
      )}

      {res?.factures?.length > 0 && (
        <div>
          <h2 className="cab-section-titre">Factures</h2>
          {res.factures.map((f: any) => (
            <a key={f.id} href={`/api/cabinet/factures/${f.id}/pdf`} target="_blank" rel="noreferrer" className="cab-card" style={carte}>
              <b>{f.numero}</b><span className="cab-muted"> · {f.client_nom} · {montant(Number(f.montant))} · {f.statut === "payee" ? "payée" : f.statut === "annulee" ? "annulée" : "en attente"}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
