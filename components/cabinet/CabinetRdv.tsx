"use client";
import { useEffect, useState } from "react";

const STATUT_LABEL: Record<string, { txt: string; color: string }> = {
  demande: { txt: "En attente", color: "#e0b050" },
  confirme: { txt: "Confirmé", color: "#5fb878" },
  annule: { txt: "Annulé", color: "#d9534f" },
};

export default function CabinetRdv({ staff }: { staff: boolean }) {
  const [rows, setRows] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [ajout, setAjout] = useState(false);
  const [form, setForm] = useState({ date_rdv: "", motif: "", discord_id: "", client_nom: "" });

  const charger = () => fetch("/api/cabinet/rdv").then(r => r.json()).then(d => {
    if (d.error) setErreur(d.error); else setRows(d.rows || []);
    setChargement(false);
  });
  useEffect(() => { charger(); }, []);

  const creer = async () => {
    setErreur("");
    const r = await fetch("/api/cabinet/rdv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    setAjout(false);
    setForm({ date_rdv: "", motif: "", discord_id: "", client_nom: "" });
    charger();
  };

  const statut = async (id: string, s: string) => {
    const r = await fetch("/api/cabinet/rdv", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, statut: s }) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    charger();
  };

  const quand = (s: string) => new Date(s).toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <button className="btn btn-sm" style={{ marginBottom: "1rem" }} onClick={() => setAjout(!ajout)}>
        {ajout ? "Fermer" : staff ? "+ Ajouter un RDV" : "+ Demander un RDV"}
      </button>

      {ajout && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="form-group"><label>Date et heure</label><input type="datetime-local" value={form.date_rdv} onChange={e => setForm({ ...form, date_rdv: e.target.value })} /></div>
          <div className="form-group"><label>Motif</label><input value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Ex : divorce, changement de nom..." /></div>
          {staff && <>
            <div className="form-group"><label>ID Discord du client (optionnel)</label><input value={form.discord_id} onChange={e => setForm({ ...form, discord_id: e.target.value })} /></div>
            <div className="form-group"><label>Nom du client</label><input value={form.client_nom} onChange={e => setForm({ ...form, client_nom: e.target.value })} /></div>
          </>}
          <button className="btn btn-sm" onClick={creer}>Enregistrer</button>
        </div>
      )}

      {erreur && <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>{erreur}</div>}
      {chargement ? <div style={{ color: "var(--text-dim)" }}>Chargement...</div>
        : rows.length === 0 ? <div className="empty-state"><div className="empty-title">Aucun rendez-vous</div></div>
        : rows.map(r => {
          const s = STATUT_LABEL[r.statut] || { txt: r.statut, color: "var(--text-dim)" };
          return (
            <div key={r.id} className="card" style={{ marginBottom: "0.6rem", display: "flex", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{quand(r.date_rdv)}</div>
                <div style={{ fontSize: "0.85rem" }}>{r.client_nom || "Non renseigné"}{r.motif ? `, ${r.motif}` : ""}</div>
                <div style={{ fontSize: "0.72rem", color: s.color, marginTop: "0.2rem" }}>{s.txt}</div>
              </div>
              {staff && r.statut !== "confirme" && <button className="btn btn-outline btn-sm" onClick={() => statut(r.id, "confirme")}>Confirmer</button>}
              {staff && r.statut !== "annule" && <button className="btn btn-outline btn-sm" onClick={() => statut(r.id, "annule")}>Annuler</button>}
            </div>
          );
        })}
    </div>
  );
}
