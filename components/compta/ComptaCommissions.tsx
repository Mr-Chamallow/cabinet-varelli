"use client";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";
import { champ, dateFr } from "@/components/compta/commun";
import { semaineCourante } from "@/lib/compta";
import { weekStartOf } from "@/lib/weekStart";
import { dateISO } from "@/lib/dates";

const MOYENS = ["Virement", "Espèces", "Autre"];

// Salaires à la prestation : relevé par employé, commissions dues, versements
export default function ComptaCommissions() {
  const [semaine, setSemaine] = useState(() => semaineCourante());
  const [resume, setResume] = useState<any>(null);
  const [versements, setVersements] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [form, setForm] = useState({ employe_discord_id: "", montant: "", moyen: "Virement", date_versement: dateISO() });

  const charger = () => {
    fetch(`/api/cabinet/compta/resume?semaine=${semaine}`).then(r => r.json()).then(d => d.error ? setErreur(d.error) : setResume(d));
    fetch("/api/cabinet/compta/versements").then(r => r.json()).then(d => setVersements(d.rows || []));
  };
  useEffect(() => { charger(); }, [semaine]);
  useEffect(() => { fetch("/api/cabinet/staff").then(r => r.json()).then(d => setStaff(d.rows || [])); }, []);

  async function verser() {
    setErreur("");
    const r = await fetch("/api/cabinet/compta/versements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    setForm({ ...form, montant: "" });
    charger();
  }

  async function supprimer(id: string) {
    const r = await fetch(`/api/cabinet/compta/versements?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    charger();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {erreur && <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{erreur}</div>}

      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        <input type="date" style={{ ...champ, width: "auto" }} value={semaine} onChange={e => e.target.value && setSemaine(weekStartOf(e.target.value))} />
        <a className="btn btn-gold btn-sm" href={`/api/cabinet/compta/resume?semaine=${semaine}&format=csv`}>Relevé CSV</a>
        <span className="cab-muted" style={{ fontSize: "0.85rem" }}>Semaine du lundi {dateFr(semaine)} au dimanche</span>
      </div>

      {resume && resume.releves.length === 0 && <div className="cab-muted">Aucune commission ni versement pour cette semaine.</div>}

      {resume?.releves.map((rel: any) => (
        <div key={rel.employe_discord_id} className="cab-card">
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>{rel.employe_nom}</div>
            <button className="btn btn-outline btn-sm" onClick={() => setOuvert(ouvert === rel.employe_discord_id ? null : rel.employe_discord_id)}>
              {ouvert === rel.employe_discord_id ? "Masquer" : `Prestations (${rel.prestations.length})`}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.6rem", marginTop: "0.6rem" }}>
            <div><div className="cab-muted" style={{ fontSize: "0.75rem" }}>Commissions de la semaine</div><strong>{montant(rel.commissionSemaine)}</strong></div>
            <div><div className="cab-muted" style={{ fontSize: "0.75rem" }}>Versé cette semaine</div><strong>{montant(rel.versementsSemaine)}</strong></div>
            <div><div className="cab-muted" style={{ fontSize: "0.75rem" }}>Comparutions : part (semaine)</div><strong>{montant(rel.ciSemaine)}</strong></div>
            <div><div className="cab-muted" style={{ fontSize: "0.75rem" }}>Comparutions : part (total)</div><strong>{montant(rel.ciCumul)}</strong></div>
            <div><div className="cab-muted" style={{ fontSize: "0.75rem" }}>Solde dû (total)</div><strong style={{ color: rel.solde > 0 ? "#e0b050" : "#5fb878" }}>{montant(rel.solde)}</strong></div>
          </div>
          {ouvert === rel.employe_discord_id && (
            <table style={{ width: "100%", marginTop: "0.8rem", fontSize: "0.82rem", borderCollapse: "collapse" }}>
              <thead><tr className="cab-muted" style={{ textAlign: "left" }}><th>Facture</th><th>Client</th><th>Prestation</th><th>Total</th><th>%</th><th>Commission</th></tr></thead>
              <tbody>
                {rel.prestations.map((p: any, i: number) => (
                  <tr key={i}><td>{p.facture}</td><td>{p.client}</td><td>{p.description}</td><td>{montant(p.total)}</td><td>{p.pct}</td><td>{montant(p.commission)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      <div className="cab-card">
        <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Verser une commission</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.6rem", alignItems: "end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Employé</label>
            <select value={form.employe_discord_id} onChange={e => setForm({ ...form, employe_discord_id: e.target.value })}>
              <option value="">Choisir</option>
              {staff.map((s: any) => <option key={s.discord_id} value={s.discord_id}>{s.nom}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Montant ($)</label><input inputMode="numeric" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Moyen</label>
            <select value={form.moyen} onChange={e => setForm({ ...form, moyen: e.target.value })}>{MOYENS.map(m => <option key={m} value={m}>{m}</option>)}</select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Date</label><input type="date" value={form.date_versement} onChange={e => setForm({ ...form, date_versement: e.target.value })} /></div>
          <button className="btn btn-sm" onClick={verser}>Enregistrer le versement</button>
        </div>
      </div>

      <div className="cab-card">
        <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Derniers versements</div>
        {versements.length === 0 && <div className="cab-muted">Aucun versement.</div>}
        {versements.map(v => (
          <div key={v.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border, #333)", fontSize: "0.85rem", flexWrap: "wrap" }}>
            <span>{dateFr(v.date_versement)} · {v.employe_nom} · {v.moyen}</span>
            <span style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <strong>{montant(Number(v.montant))}</strong>
              <button className="btn btn-outline btn-sm" onClick={() => supprimer(v.id)}>Supprimer</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
