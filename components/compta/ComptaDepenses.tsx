"use client";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";
import { Stat, dateFr } from "@/components/compta/commun";

const CATEGORIES = ["Fournitures", "Loyer", "Abonnements", "Transport", "Frais bancaires", "Matériel", "Autre"];

// Dépenses du cabinet : pour calculer le bénéfice réel
export default function ComptaDepenses() {
  const [rows, setRows] = useState<any[]>([]);
  const [erreur, setErreur] = useState("");
  const [form, setForm] = useState({ date_depense: new Date().toISOString().slice(0, 10), categorie: "Fournitures", libelle: "", montant: "" });

  const charger = () => fetch("/api/cabinet/compta/depenses").then(r => r.json()).then(d => d.error ? setErreur(d.error) : setRows(d.rows || []));
  useEffect(() => { charger(); }, []);

  async function ajouter() {
    setErreur("");
    const r = await fetch("/api/cabinet/compta/depenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    setForm({ ...form, libelle: "", montant: "" });
    charger();
  }

  async function supprimer(id: string) {
    const r = await fetch(`/api/cabinet/compta/depenses?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    charger();
  }

  const total = rows.reduce((s, x) => s + (Number(x.montant) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {erreur && <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{erreur}</div>}
      <Stat label="Total des dépenses listées" valeur={montant(total)} couleur="#f87171" />

      <div className="cab-card">
        <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Nouvelle dépense</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.6rem", alignItems: "end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Date</label><input type="date" value={form.date_depense} onChange={e => setForm({ ...form, date_depense: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Catégorie</label>
            <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Libellé</label><input value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Montant ($)</label><input inputMode="numeric" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} /></div>
          <button className="btn btn-sm" onClick={ajouter}>Ajouter</button>
        </div>
      </div>

      {rows.length === 0 && <div className="cab-muted">Aucune dépense.</div>}
      {rows.map(x => (
        <div key={x.id} className="cab-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{x.libelle}</div>
            <div className="cab-muted" style={{ fontSize: "0.8rem" }}>{dateFr(x.date_depense)} · {x.categorie} · {x.auteur_nom || ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <strong>{montant(Number(x.montant))}</strong>
            <button className="btn btn-outline btn-sm" onClick={() => supprimer(x.id)}>Supprimer</button>
          </div>
        </div>
      ))}
    </div>
  );
}
