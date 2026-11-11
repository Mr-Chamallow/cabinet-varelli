"use client";
import { useEffect, useState } from "react";

export interface CrudField { key: string; label: string; type?: "text" | "textarea" | "number"; placeholder?: string; }

interface Props {
  table: string;              // nom de la table (route /api/cabinet/[table])
  fields: CrudField[];
  canWrite: boolean;
  titleKey: string;           // champ affiché en titre
  subKey?: string;            // champ affiché sous le titre
  groupKey?: string;          // champ de regroupement (ex : catégorie)
  libelle: string;            // ex : "tarif", "membre"
}

const vide = (fields: CrudField[]) => Object.fromEntries(fields.map(f => [f.key, ""]));

export default function CabinetCrud({ table, fields, canWrite, titleKey, subKey, groupKey, libelle }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [edition, setEdition] = useState<any | null>(null); // null = fermé, {} = nouveau
  const [form, setForm] = useState<any>({});

  const charger = () => fetch(`/api/cabinet/${table}`).then(r => r.json()).then(d => {
    if (d.error) setErreur(d.error); else setRows(d.rows || []);
    setChargement(false);
  });
  useEffect(() => { charger(); }, [table]);

  const ouvrir = (row: any | null) => {
    setErreur("");
    setEdition(row ?? {});
    setForm(row ? Object.fromEntries(fields.map(f => [f.key, row[f.key] ?? ""])) : vide(fields));
  };

  const enregistrer = async () => {
    setErreur("");
    const id = edition?.id;
    const r = await fetch(`/api/cabinet/${table}`, {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { ...form, id } : form),
    });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    setEdition(null);
    charger();
  };

  const supprimer = async (row: any) => {
    if (!confirm(`Supprimer ce ${libelle} ?`)) return;
    const r = await fetch(`/api/cabinet/${table}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id }) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    charger();
  };

  // Regroupement par catégorie si demandé
  const groupes: [string, any[]][] = [];
  for (const row of rows) {
    const g = groupKey ? (row[groupKey] || "Autres") : "";
    const existant = groupes.find(([nom]) => nom === g);
    if (existant) existant[1].push(row); else groupes.push([g, [row]]);
  }

  const ligne = (row: any) => (
    <div key={row.id} className="cab-card" style={{ marginBottom: "0.6rem", display: "flex", gap: "0.8rem", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>{row[titleKey]}</div>
        {subKey && row[subKey] && <div style={{ fontSize: "0.82rem", color: "var(--gold)" }}>{row[subKey]}</div>}
        {fields.filter(f => ![titleKey, subKey, groupKey, "ordre"].includes(f.key) && row[f.key] && f.key !== "id").map(f => (
          <div key={f.key} style={{ fontSize: "0.82rem", color: "var(--text-dim)", whiteSpace: "pre-wrap", marginTop: "0.2rem" }}>{row[f.key]}</div>
        ))}
      </div>
      {canWrite && (
        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
          <button className="btn btn-outline btn-sm" onClick={() => ouvrir(row)}>Modifier</button>
          <button className="btn btn-outline btn-sm" onClick={() => supprimer(row)}>Supprimer</button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {canWrite && !edition && <button className="btn btn-sm" style={{ marginBottom: "1rem" }} onClick={() => ouvrir(null)}>+ Ajouter</button>}

      {edition && (
        <div className="cab-card" style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, marginBottom: "0.6rem" }}>{edition.id ? `Modifier le ${libelle}` : `Nouveau ${libelle}`}</div>
          {fields.map(f => (
            <div key={f.key} className="form-group">
              <label>{f.label}</label>
              {f.type === "textarea"
                ? <textarea rows={4} placeholder={f.placeholder} value={form[f.key] ?? ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                : <input type={f.type === "number" ? "number" : "text"} placeholder={f.placeholder} value={form[f.key] ?? ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />}
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-sm" onClick={enregistrer}>Enregistrer</button>
            <button className="btn btn-outline btn-sm" onClick={() => setEdition(null)}>Annuler</button>
          </div>
        </div>
      )}

      {erreur && <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>{erreur}</div>}
      {chargement ? <div style={{ color: "var(--text-dim)" }}>Chargement...</div>
        : rows.length === 0 ? <div className="empty-state"><div className="empty-title">Rien pour l'instant</div></div>
        : groupKey
          ? groupes.map(([nom, items]) => (
              <div key={nom} style={{ marginBottom: "1.2rem" }}>
                <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", marginBottom: "0.5rem" }}>{nom}</div>
                {items.map(ligne)}
              </div>
            ))
          : rows.map(ligne)}
    </div>
  );
}
