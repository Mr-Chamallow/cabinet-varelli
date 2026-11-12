"use client";
import { prixDepuisTexte } from "@/lib/montant";

export const champ: React.CSSProperties = { width: "100%", padding: "0.55rem", borderRadius: 6, border: "1px solid var(--border, #333)", background: "transparent", color: "inherit" };
export const dateFr = (s?: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "-");
export const MODES = ["Virement", "Espèces", "Carte", "Chèque", "Autre"];
export const STATUTS: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "#e0b050" },
  payee: { label: "Payée", color: "#5fb878" },
  annulee: { label: "Annulée", color: "#9ca3af" },
};

export interface LigneForm { description: string; quantite: string; prix: string; employe: string; pct: string; }
export const LIGNE_VIDE: LigneForm = { description: "", quantite: "1", prix: "", employe: "", pct: "0" };

// Payload envoyé au serveur à partir des lignes saisies
export function versPayload(lignes: LigneForm[], staff: any[]) {
  return lignes.map(l => {
    const e = staff.find((s: any) => s.discord_id === l.employe);
    return {
      description: l.description, quantite: Number(l.quantite), prix: Number(l.prix),
      employe_discord_id: l.employe || null, employe_nom: e?.nom || null, commission_pct: Number(l.pct) || 0,
    };
  });
}

export function totalLignes(lignes: LigneForm[], tva: string) {
  const sous = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix) || 0), 0);
  return Math.round(sous * (1 + (Number(tva) || 0) / 100));
}

// Tableau de saisie : prestation (remplit désignation, prix, commission), employé, commission
export function LignesEditor({ lignes, setLignes, staff, tarifs }: { lignes: LigneForm[]; setLignes: (f: (ls: LigneForm[]) => LigneForm[]) => void; staff: any[]; tarifs: any[] }) {
  const maj = (i: number, c: keyof LigneForm, v: string) => setLignes(ls => ls.map((l, k) => (k === i ? { ...l, [c]: v } : l)));
  const prestation = (i: number, id: string) => {
    const t = tarifs.find((x: any) => x.id === id);
    if (!t) return;
    const prix = t.prix_montant != null ? Number(t.prix_montant) : prixDepuisTexte(t.prix);
    setLignes(ls => ls.map((l, k) => (k === i ? { ...l, description: t.nom, prix: prix !== null ? String(prix) : "", pct: String(Number(t.commission_pct) || 0) } : l)));
  };
  const retirer = (i: number) => setLignes(ls => (ls.length > 1 ? ls.filter((_, k) => k !== i) : ls));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {lignes.map((l, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) 70px 110px minmax(0,1fr) 90px 32px", gap: "0.4rem", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <input style={champ} placeholder="Désignation" value={l.description} onChange={e => maj(i, "description", e.target.value)} />
            <select style={{ ...champ, fontSize: "0.75rem" }} value="" onChange={e => prestation(i, e.target.value)}>
              <option value="">Prendre une prestation du cabinet…</option>
              {tarifs.map((t: any) => <option key={t.id} value={t.id}>{t.categorie} : {t.nom}</option>)}
            </select>
          </div>
          <input style={champ} placeholder="Qté" inputMode="numeric" value={l.quantite} onChange={e => maj(i, "quantite", e.target.value)} />
          <input style={champ} placeholder="Prix $" inputMode="numeric" value={l.prix} onChange={e => maj(i, "prix", e.target.value)} />
          <select style={champ} value={l.employe} onChange={e => maj(i, "employe", e.target.value)}>
            <option value="">Réalisé par…</option>
            {staff.map((s: any) => <option key={s.discord_id} value={s.discord_id}>{s.nom}</option>)}
          </select>
          <input style={champ} placeholder="Comm. %" inputMode="decimal" value={l.pct} onChange={e => maj(i, "pct", e.target.value)} title="Commission de l'employé sur cette ligne (%)" />
          <button className="btn btn-outline btn-sm" onClick={() => retirer(i)} title="Retirer la ligne">✕</button>
        </div>
      ))}
      <div><button className="btn btn-outline btn-sm" onClick={() => setLignes(ls => [...ls, { ...LIGNE_VIDE }])}>+ Ajouter une ligne</button></div>
    </div>
  );
}

export const Stat = ({ label, valeur, couleur }: { label: string; valeur: string; couleur?: string }) => (
  <div className="cab-card">
    <div className="cab-muted" style={{ fontSize: "0.75rem" }}>{label}</div>
    <div style={{ fontWeight: 700, fontSize: "1.2rem", color: couleur }}>{valeur}</div>
  </div>
);
