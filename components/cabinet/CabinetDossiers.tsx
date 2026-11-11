"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUT_LABEL: Record<string, { txt: string; color: string }> = {
  ouvert: { txt: "Ouvert", color: "#5fb878" },
  ferme: { txt: "Fermé", color: "#e0b050" },
  archive: { txt: "Archivé", color: "#8a8a8a" },
};

interface Props { staff: boolean; }

// Liste des dossiers + ouverture d'un nouveau dossier (client pour lui-même, staff pour un client)
export default function CabinetDossiers({ staff }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [ajout, setAjout] = useState(false);
  const [titre, setTitre] = useState("");
  const [typeId, setTypeId] = useState("");
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<any[]>([]);
  const [client, setClient] = useState<any | null>(null);

  const charger = () => fetch("/api/cabinet/dossiers").then(r => r.json()).then(d => {
    if (d.error) setErreur(d.error); else setRows(d.rows || []);
    setChargement(false);
  });
  useEffect(() => {
    charger();
    fetch("/api/cabinet/cabinet_dossier_types").then(r => r.json()).then(d => setTypes(d.rows || []));
  }, []);

  // Recherche de client (staff) par pseudo, nom RP ou ID Discord
  useEffect(() => {
    if (!staff || recherche.trim().length < 2) { setResultats([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/cabinet/clients?q=${encodeURIComponent(recherche.trim())}`).then(r => r.json()).then(d => setResultats(d.rows || []));
    }, 300);
    return () => clearTimeout(t);
  }, [recherche, staff]);

  const creer = async () => {
    setErreur("");
    const body: any = { titre, type_id: typeId || null };
    if (staff) {
      if (!client) return setErreur("Choisis un client (recherche ou ID Discord)");
      body.client_discord_id = client.discord_id;
    }
    const r = await fetch("/api/cabinet/dossiers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    setAjout(false); setTitre(""); setTypeId(""); setClient(null); setRecherche("");
    charger();
  };

  return (
    <div>
      <button className="btn btn-sm" style={{ marginBottom: "1rem" }} onClick={() => setAjout(!ajout)}>
        {ajout ? "Fermer" : "+ Nouveau dossier"}
      </button>

      {ajout && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="form-group"><label>Type de dossier</label>
            <select value={typeId} onChange={e => setTypeId(e.target.value)}>
              <option value="">Choisir</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Titre du dossier</label><input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex : Changement de nom de Jean Dupont" /></div>

          {staff && (
            <div className="form-group">
              <label>Client</label>
              {client ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                  <span>{client.nom_rp || client.discord_name} <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>({client.discord_id})</span></span>
                  <button className="btn btn-outline btn-sm" onClick={() => setClient(null)}>Changer</button>
                </div>
              ) : (
                <>
                  <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Pseudo, nom RP ou ID Discord..." />
                  {resultats.map(c => (
                    <div key={c.discord_id} className="card" style={{ marginTop: "0.4rem", cursor: "pointer", padding: "0.5rem 0.7rem" }} onClick={() => setClient(c)}>
                      {c.nom_rp}, {c.discord_name} <span style={{ color: "var(--text-dim)", fontSize: "0.72rem" }}>{c.discord_id}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          <button className="btn btn-sm" onClick={creer}>Ouvrir le dossier</button>
        </div>
      )}

      {erreur && <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>{erreur}</div>}
      {chargement ? <div style={{ color: "var(--text-dim)" }}>Chargement...</div>
        : rows.length === 0 ? <div className="empty-state"><div className="empty-title">Aucun dossier</div></div>
        : rows.map(d => {
          const s = STATUT_LABEL[d.statut] || { txt: d.statut, color: "var(--text-dim)" };
          return (
            <Link key={d.id} href={`/avocat/dossiers/${d.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div className="card" style={{ marginBottom: "0.6rem" }}>
                <div style={{ fontWeight: 700 }}>{d.titre}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  {d.cabinet_dossier_types?.nom ? `${d.cabinet_dossier_types.nom}, ` : ""}{staff ? `${d.client_nom || "?"}, ` : ""}{new Date(d.created_at).toLocaleDateString("fr-FR")}
                </div>
                <div style={{ fontSize: "0.72rem", color: s.color, marginTop: "0.2rem" }}>{s.txt}</div>
              </div>
            </Link>
          );
        })}
    </div>
  );
}
