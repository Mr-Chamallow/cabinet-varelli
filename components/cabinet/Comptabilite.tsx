"use client";
import { montant } from "@/lib/montant";
import Link from "next/link";
import { useEffect, useState } from "react";
import { prixDepuisTexte } from "@/lib/montant";

interface Ligne { description: string; quantite: string; prix: string; }

const LIGNE_VIDE: Ligne = { description: "", quantite: "1", prix: "" };
const STATUTS: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "#e0b050" },
  payee: { label: "Payée", color: "#5fb878" },
  annulee: { label: "Annulée", color: "#9ca3af" },
};
const dateFr = (s?: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "-");
const champ: React.CSSProperties = { width: "100%", padding: "0.55rem", borderRadius: 6, border: "1px solid var(--border, #333)", background: "transparent", color: "inherit" };

// Comptabilité : factures liées à un dossier, TVA, échéance, statut, PDF, historique
export default function Comptabilite() {
  const [factures, setFactures] = useState<any[]>([]);
  const [totaux, setTotaux] = useState<any>({ encaisse: 0, attente: 0, retard: 0 });
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [filtre, setFiltre] = useState("tous");
  const [erreur, setErreur] = useState("");
  const [ouverts, setOuverts] = useState<Record<string, any[]>>({});
  const [dossierId, setDossierId] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([{ ...LIGNE_VIDE }]);
  const [tva, setTva] = useState("0");
  const [echeance, setEcheance] = useState("");
  const [note, setNote] = useState("");
  const [moisExport, setMoisExport] = useState(new Date().toISOString().slice(0, 7));
  const [envoi, setEnvoi] = useState(false);

  const charger = () => fetch("/api/cabinet/factures").then(r => r.json()).then(d => {
    if (d.error) return setErreur(d.error);
    setFactures(d.rows || []);
    setTotaux(d.totaux || { encaisse: 0, attente: 0, retard: 0 });
  });

  useEffect(() => {
    // Ouverture depuis un dossier : le dossier est déjà choisi
    const preselection = new URLSearchParams(window.location.search).get("dossier");
    if (preselection) setDossierId(preselection);
    charger();
    fetch("/api/cabinet/dossiers").then(r => r.json()).then(d => setDossiers((d.rows || []).filter((x: any) => x.statut !== "archive")));
    fetch("/api/cabinet/cabinet_tarifs").then(r => r.json()).then(d => setTarifs(d.rows || []));
  }, []);

  const sousTotal = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix) || 0), 0);
  const total = sousTotal * (1 + (Number(tva) || 0) / 100);

  // Ajoute une prestation du cabinet : désignation et prix remplis automatiquement
  const ajouterPrestation = (id: string) => {
    const t = tarifs.find((x: any) => x.id === id);
    if (!t) return;
    const prix = prixDepuisTexte(t.prix);
    setLignes(ls => {
      const vide = ls.length === 1 && !ls[0].description && !ls[0].prix;
      const nouvelle = { description: t.nom, quantite: "1", prix: prix !== null ? String(prix) : "" };
      return vide ? [nouvelle] : [...ls, nouvelle];
    });
  };

  const majLigne = (i: number, c: keyof Ligne, val: string) => setLignes(ls => ls.map((l, k) => (k === i ? { ...l, [c]: val } : l)));
  const retirerLigne = (i: number) => setLignes(ls => (ls.length > 1 ? ls.filter((_, k) => k !== i) : ls));

  async function creer() {
    setErreur("");
    if (!dossierId) return setErreur("Choisis un dossier.");
    setEnvoi(true);
    const r = await fetch("/api/cabinet/factures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dossier_id: dossierId,
        lignes: lignes.map(l => ({ description: l.description, quantite: Number(l.quantite), prix: Number(l.prix) })),
        tva_taux: Number(tva),
        date_echeance: echeance || null,
        note,
      }),
    });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok) return setErreur(d.error || "Erreur");
    setLignes([{ ...LIGNE_VIDE }]); setTva("0"); setEcheance(""); setNote(""); setDossierId("");
    charger();
  }

  async function changerStatut(id: string, statut: string) {
    const r = await fetch(`/api/cabinet/factures/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut }) });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    setOuverts(o => { const c = { ...o }; delete c[id]; return c; });
    charger();
  }

  async function basculerHistorique(id: string) {
    if (ouverts[id]) return setOuverts(o => { const c = { ...o }; delete c[id]; return c; });
    const d = await fetch(`/api/cabinet/factures/${id}`).then(r => r.json());
    setOuverts(o => ({ ...o, [id]: d.historique || [] }));
  }

  const liste = factures.filter(f => filtre === "tous" || f.statut === filtre);

  return (
    <div>
      {erreur && <div style={{ color: "#f87171", marginBottom: "0.8rem", fontSize: "0.85rem" }}>{erreur}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.7rem", marginBottom: "1rem" }}>
        <div className="cab-card"><div className="cab-muted" style={{ fontSize: "0.75rem" }}>Encaissé</div><div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#5fb878" }}>{montant(totaux.encaisse)}</div></div>
        <div className="cab-card"><div className="cab-muted" style={{ fontSize: "0.75rem" }}>En attente</div><div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#e0b050" }}>{montant(totaux.attente)}</div></div>
        <div className="cab-card"><div className="cab-muted" style={{ fontSize: "0.75rem" }}>En retard</div><div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#f87171" }}>{totaux.retard} facture(s)</div></div>
      </div>

      <div className="cab-card" style={{ marginBottom: "1.2rem" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.7rem" }}>Nouvelle facture</div>
        <select value={dossierId} onChange={e => setDossierId(e.target.value)} style={{ ...champ, marginBottom: "0.6rem" }}>
          <option value="">Choisir le dossier (le client est repris automatiquement)</option>
          {dossiers.map(d => <option key={d.id} value={d.id}>{d.titre} : {d.client_nom}</option>)}
        </select>

        <select value="" onChange={e => { ajouterPrestation(e.target.value); e.target.value = ""; }} style={{ ...champ, marginBottom: "0.6rem" }}>
          <option value="">+ Ajouter une prestation du cabinet</option>
          {tarifs.map((t: any) => <option key={t.id} value={t.id}>{t.categorie} : {t.nom} ({t.prix || "sur devis"})</option>)}
        </select>

        {lignes.map((l, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 34px", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <input style={champ} placeholder="Désignation" value={l.description} onChange={e => majLigne(i, "description", e.target.value)} />
            <input style={champ} placeholder="Qté" inputMode="numeric" value={l.quantite} onChange={e => majLigne(i, "quantite", e.target.value)} />
            <input style={champ} placeholder="Prix unitaire ($)" inputMode="numeric" value={l.prix} onChange={e => majLigne(i, "prix", e.target.value)} />
            <button className="btn btn-outline btn-sm" onClick={() => retirerLigne(i)} title="Retirer la ligne">×</button>
          </div>
        ))}
        <button className="btn btn-outline btn-sm" style={{ marginBottom: "0.7rem" }} onClick={() => setLignes(ls => [...ls, { ...LIGNE_VIDE }])}>+ Ajouter une ligne</button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <input style={champ} placeholder="TVA en %" inputMode="decimal" value={tva} onChange={e => setTva(e.target.value)} />
          <input style={champ} type="date" value={echeance} onChange={e => setEcheance(e.target.value)} />
        </div>
        <textarea style={{ ...champ, marginBottom: "0.6rem" }} rows={2} placeholder="Note (facultatif)" value={note} onChange={e => setNote(e.target.value)} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontWeight: 700 }}>Total : {montant(total)}</div>
          <button className="btn btn-gold btn-sm" onClick={creer} disabled={envoi}>{envoi ? "Création..." : "Créer la facture"}</button>
        </div>
      </div>

      <div className="cab-card" style={{ marginBottom: "1rem", display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 600 }}>Export comptable</div>
        <input type="month" value={moisExport} onChange={e => setMoisExport(e.target.value)} style={{ ...champ, width: "auto" }} />
        <a className="btn btn-gold btn-sm" href={`/api/cabinet/factures/export?mois=${moisExport}`}>Télécharger le CSV</a>
      </div>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
        {["tous", "en_attente", "payee", "annulee"].map(f => (
          <button key={f} className={filtre === f ? "btn btn-gold btn-sm" : "btn btn-outline btn-sm"} onClick={() => setFiltre(f)}>
            {f === "tous" ? "Toutes" : STATUTS[f].label}
          </button>
        ))}
      </div>

      {liste.length === 0 && <div className="cab-muted">Aucune facture.</div>}

      {liste.map(f => {
        const st = STATUTS[f.statut] || { label: f.statut, color: "#9ca3af" };
        const enRetard = f.statut === "en_attente" && f.date_echeance && f.date_echeance < new Date().toISOString().slice(0, 10);
        return (
          <div key={f.id} className="cab-card" style={{ marginBottom: "0.6rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{f.numero || "Facture"} · {montant(f.montant)}</div>
                <div className="cab-muted" style={{ fontSize: "0.78rem" }}>
                  {f.client_nom || "-"} · Échéance {dateFr(f.date_echeance)}{enRetard ? " · EN RETARD" : ""}
                </div>
                {f.cree_par && <div className="cab-muted" style={{ fontSize: "0.72rem" }}>Créée par {f.cree_par} le {dateFr(f.created_at)}</div>}
              </div>
              <span style={{ alignSelf: "flex-start", color: st.color, fontWeight: 700, fontSize: "0.8rem" }}>{st.label}</span>
            </div>

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem", alignItems: "center" }}>
              <select value={f.statut} onChange={e => changerStatut(f.id, e.target.value)} style={{ ...champ, width: "auto" }}>
                <option value="en_attente">En attente</option>
                <option value="payee">Payée</option>
                <option value="annulee">Annulée</option>
              </select>
              <a className="btn btn-outline btn-sm" href={`/api/cabinet/factures/${f.id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
              {f.dossier_id && <Link className="btn btn-outline btn-sm" href={`/avocat/dossiers/${f.dossier_id}`}>Dossier</Link>}
              <button className="btn btn-outline btn-sm" onClick={() => basculerHistorique(f.id)}>{ouverts[f.id] ? "Masquer l'historique" : "Historique"}</button>
            </div>

            {ouverts[f.id] && (
              <div style={{ marginTop: "0.6rem", fontSize: "0.8rem", borderTop: "1px solid var(--border, #333)", paddingTop: "0.5rem" }}>
                {ouverts[f.id].length === 0 && <div className="cab-muted">Aucun événement.</div>}
                {ouverts[f.id].map((h: any) => (
                  <div key={h.id} style={{ marginBottom: "0.3rem" }}>
                    <span className="cab-muted">{new Date(h.created_at).toLocaleString("fr-FR")}</span> · {h.auteur_nom || "-"} · {h.action} {h.details ? `(${h.details})` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
