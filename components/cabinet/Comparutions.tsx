"use client";
import { useEffect, useMemo, useState } from "react";
import { montant } from "@/lib/montant";
import { champ, dateFr } from "@/components/compta/commun";

// Comparutions immédiates : suivi séparé de la compta client (payées par le gouvernement).
type Ligne = {
  id: string; date_audience: string; heure: string | null; tribunal: string | null; client_nom: string; chefs: string | null;
  juge_proc: string | null; matricules_officiers: string | null; avocat_nom: string | null; statut: string; montant: number; part_avocat?: number; taux_pct?: number; notes: string | null;
};

const STATUTS: { k: string; label: string; couleur: string }[] = [
  { k: "prise_en_charge", label: "Prise en charge", couleur: "#5fb878" },
  { k: "en_attente", label: "En attente", couleur: "#e0b050" },
  { k: "refusee", label: "Refusée", couleur: "#f87171" },
];
const statutDe = (k: string) => STATUTS.find(s => s.k === k) || STATUTS[1];
const VIDE = { date_audience: new Date().toISOString().slice(0, 10), heure: "09:00", tribunal: "", client_nom: "", chefs: "", juge_proc: "", matricules_officiers: "", montant: "0", statut: "prise_en_charge", notes: "" };

export default function Comparutions() {
  const [rows, setRows] = useState<Ligne[] | null>(null);
  const [infractions, setInfractions] = useState<string[]>([]);
  const [form, setForm] = useState<any>(VIDE);
  const [editId, setEditId] = useState<string | null>(null);
  const [filtre, setFiltre] = useState("tous");
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState(false);

  const charger = () =>
    fetch("/api/cabinet/comparutions").then(r => r.json()).then(d => d.error ? setErreur(d.error) : setRows(d.rows));

  useEffect(() => {
    charger();
    fetch("/api/cabinet/cabinet_codes_livret").then(r => r.json()).then(d => setInfractions((d.rows || []).map((x: any) => x.titre).filter(Boolean)));
  }, []);

  const liste = useMemo(() => (rows || []).filter(r => filtre === "tous" || r.statut === filtre), [rows, filtre]);
  const totalPec = (rows || []).filter(r => r.statut === "prise_en_charge").reduce((s, r) => s + (r.montant || 0), 0);

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");
    const corps = { ...form, montant: Number(form.montant) || 0 };
    const res = await fetch(editId ? `/api/cabinet/comparutions?id=${editId}` : "/api/cabinet/comparutions", {
      method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps),
    });
    const d = await res.json();
    if (d.error) return setErreur(d.error);
    setForm(VIDE); setEditId(null); setOuvert(false); charger();
  };

  const changerStatut = async (id: string, statut: string) => {
    const res = await fetch(`/api/cabinet/comparutions?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut }) });
    const d = await res.json();
    if (d.error) setErreur(d.error); else charger();
  };

  const modifier = (r: Ligne) => {
    setEditId(r.id);
    setForm({ date_audience: r.date_audience, heure: r.heure || "09:00", tribunal: r.tribunal || "", client_nom: r.client_nom, chefs: r.chefs || "",
      juge_proc: r.juge_proc || "", matricules_officiers: r.matricules_officiers || "", montant: String(r.montant || 0), statut: r.statut, notes: r.notes || "" });
    setOuvert(true);
  };

  const champFormulaire = (label: string, cle: string, type = "text", extra: any = {}) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label style={{ fontSize: "0.75rem" }}>{label}</label>
      <input type={type} style={champ} value={form[cle]} onChange={e => setForm({ ...form, [cle]: e.target.value })} {...extra} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn btn-gold btn-sm" onClick={() => { setForm(VIDE); setEditId(null); setOuvert(!ouvert || editId !== null); }}>
          {ouvert && !editId ? "Fermer" : "+ Nouvelle comparution"}
        </button>
        <span className="cab-muted" style={{ fontSize: "0.85rem" }}>Total pris en charge : <strong style={{ color: "#5fb878" }}>{montant(totalPec)}</strong></span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[{ k: "tous", label: "Toutes" }, ...STATUTS].map(s => (
            <button key={s.k} className={`btn btn-sm ${filtre === s.k ? "btn-gold" : "btn-outline"}`} onClick={() => setFiltre(s.k)}>{s.label}</button>
          ))}
        </div>
      </div>

      {erreur && <div style={{ color: "#f87171" }}>{erreur}</div>}

      {ouvert && (
        <form onSubmit={enregistrer} className="cab-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "0.7rem" }}>
          <div className="cab-section-titre" style={{ gridColumn: "1 / -1", fontSize: "0.9rem" }}>{editId ? "Modifier la comparution" : "Nouvelle comparution immédiate"}</div>
          {champFormulaire("Date", "date_audience", "date", { required: true })}
          {champFormulaire("Heure", "heure", "time")}
          {champFormulaire("Tribunal", "tribunal")}
          {champFormulaire("Client", "client_nom", "text", { required: true })}
          <div className="form-group" style={{ marginBottom: 0, gridColumn: "span 2" }}>
            <label style={{ fontSize: "0.75rem" }}>Chef(s) d&apos;accusation (tape pour chercher dans le Livret)</label>
            <input list="liste-infractions" style={champ} value={form.chefs} onChange={e => setForm({ ...form, chefs: e.target.value })} />
            <datalist id="liste-infractions">{infractions.map(t => <option key={t} value={t} />)}</datalist>
          </div>
          {champFormulaire("Juge / procureur", "juge_proc")}
          {champFormulaire("Matricule(s) des officiers prenant", "matricules_officiers")}
          {champFormulaire("Montant (gouvernement, $)", "montant", "number", { min: 0 })}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: "0.75rem" }}>Statut</label>
            <select style={champ} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
              {STATUTS.map(s => <option key={s.k} value={s.k}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "0.75rem" }}>Notes</label>
            <input style={champ} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-gold btn-sm" type="submit">{editId ? "Enregistrer" : "Ajouter"}</button>
            <button className="btn btn-outline btn-sm" type="button" onClick={() => { setForm(VIDE); setEditId(null); setOuvert(false); }}>Annuler</button>
          </div>
        </form>
      )}

      {rows === null ? <div className="cab-muted">Chargement...</div> : liste.length === 0 ? <div className="cab-muted">Aucune comparution.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {liste.map(r => {
            const s = statutDe(r.statut);
            return (
              <div key={r.id} className="cab-card" style={{ borderLeft: `3px solid ${s.couleur}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                  <strong>{r.client_nom}</strong>
                  <span style={{ color: s.couleur, fontSize: "0.8rem" }}>{s.label}</span>
                </div>
                <div className="cab-muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  {dateFr(r.date_audience)} · {r.heure || "—"} · {r.tribunal || "Tribunal non précisé"} · par {r.avocat_nom || "—"}
                </div>
                {r.chefs && <div style={{ fontSize: "0.85rem", marginTop: "0.3rem" }}>⚖️ {r.chefs}</div>}
                <div className="cab-muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  {r.juge_proc && <>Juge/proc : {r.juge_proc} · </>}
                  {r.matricules_officiers && <>Officiers : {r.matricules_officiers} · </>}
                  Montant gouvernement : <strong>{montant(r.montant)}</strong> · Part avocat : <strong style={{ color: "#5fb878" }}>{montant(r.part_avocat || 0)}</strong> ({Number(r.taux_pct || 0)} %)
                </div>
                {r.notes && <div className="cab-muted" style={{ fontSize: "0.8rem" }}>Notes : {r.notes}</div>}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {STATUTS.filter(x => x.k !== r.statut).map(x => (
                    <button key={x.k} className="btn btn-outline btn-sm" onClick={() => changerStatut(r.id, x.k)}>→ {x.label}</button>
                  ))}
                  <button className="btn btn-ghost btn-sm" onClick={() => modifier(r)}>Modifier</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
