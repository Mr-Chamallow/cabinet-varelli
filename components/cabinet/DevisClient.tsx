"use client";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";

const dateFr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// Devis du client : il peut signer (nom complet) ou refuser un devis envoyé. Rien n'apparaît s'il n'y en a pas.
export default function DevisClient() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [noms, setNoms] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState("");

  const charger = () => fetch("/api/cabinet/mon-espace/devis").then(r => r.json()).then(d => d.error ? setErreur(d.error) : setRows(d.rows || []));
  useEffect(() => { charger(); }, []);

  async function agir(id: string, action: "accepter" | "refuser") {
    setErreur("");
    const r = await fetch("/api/cabinet/mon-espace/devis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, nom: noms[id] || "" }) });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    charger();
  }

  if (!rows || rows.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
      <div className="cab-section-titre" style={{ fontSize: "0.95rem" }}>Mes devis</div>
      {erreur && <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{erreur}</div>}
      {rows.map(d => {
        const enAttente = d.statut === "envoye";
        const sigAvocat = (d.signatures || []).find((s: any) => s.role === "avocat");
        const sigsClient = (d.signatures || []).filter((s: any) => s.role === "client");
        return (
          <div key={d.id} className="cab-card">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <strong>{d.numero} · {montant(Number(d.montant))}</strong>
              <span className="cab-muted" style={{ fontSize: "0.8rem" }}>{d.statut === "envoye" ? "À signer" : d.statut === "accepte" ? "Signé" : "Refusé"}</span>
            </div>
            <div className="cab-muted" style={{ fontSize: "0.8rem", margin: "0.3rem 0" }}>Émis le {dateFr(d.created_at)}</div>
            {(d.lignes || []).map((l: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", padding: "0.2rem 0", borderBottom: "1px solid var(--border, #333)" }}>
                <span>{l.description} × {l.quantite}</span>
                <span>{montant(Math.round((Number(l.quantite) || 0) * (Number(l.prix) || 0)))}</span>
              </div>
            ))}
            {d.note && <div className="cab-muted" style={{ fontSize: "0.82rem", marginTop: "0.4rem" }}>{d.note}</div>}

            <div style={{ marginTop: "0.6rem", fontSize: "0.85rem" }}>
              {sigAvocat && <div>✍️ Avocat : <b>{sigAvocat.nom}</b> · {dateFr(sigAvocat.at)}</div>}
              {sigsClient.map((s: any, i: number) => <div key={i}>✍️ Client : <b>{s.nom}</b> · {dateFr(s.at)}</div>)}
            </div>

            {enAttente && (
              <div style={{ marginTop: "0.7rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <input placeholder="Ton nom complet pour signer" value={noms[d.id] || ""} onChange={e => setNoms({ ...noms, [d.id]: e.target.value })} style={{ flex: "1 1 220px" }} />
                <button className="btn btn-sm" onClick={() => agir(d.id, "accepter")}>Signer et accepter</button>
                <button className="btn btn-outline btn-sm" onClick={() => agir(d.id, "refuser")}>Refuser</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
