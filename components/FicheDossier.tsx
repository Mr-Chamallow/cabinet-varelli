"use client";
import { ObsLogo } from "@/components/ObsLogo";
import { metierInfo } from "@/lib/fichesMetiers";

// Fiche sous forme de dossier papier (chemise kraft, photos agrafées, tampon de priorité, texte à la machine).
const PCOL: Record<string, string> = { Basse: "#5b6b7a", Normale: "#2f6fb0", Haute: "#c7761a", Critique: "#b3121c", "Neutralisé": "#2e7d4f" };
const ref = (id: string) => "OBS-F-" + (parseInt((id || "0").replace(/[^0-9a-f]/gi, "").slice(0, 6) || "0", 16) % 100000).toString().padStart(5, "0");

export function FicheDossier({ f, showPrivate = true }: { f: any; showPrivate?: boolean }) {
  const m = metierInfo(f.metier); const col = PCOL[f.priorite] || PCOL.Normale;
  const rows: [string, any][] = [["Âge", f.age ? `${f.age} ans` : ""], ["Origine", f.origine], ["Occupation", f.occupation], ["Téléphone", f.telephone], ["Groupe", f.organisation], ["Statut", f.statut], ["Type", f.type]];
  const blocks: [string, string][] = [["Adresses connues", f.adresses], ["Véhicules", f.vehicules], ["Comptes bancaires", f.comptes_bancaires], ["Relations", f.relations], ["Observations", f.notes_publiques]];
  return (
    <div className="fd">
      <div className="fd-tab">DOSSIER N° {ref(f.id)}</div>
      <div className="fd-paper">
        <div className="fd-head"><span style={{ display: "flex", alignItems: "center", gap: 8 }}><ObsLogo size={26} />OBSIDIAN LOGISTICS — SERVICE RENSEIGNEMENT</span><span>{m.icon} {m.label}{(f.sous_tags || []).length ? " · " + f.sous_tags.join(", ") : ""}</span></div>
        <div className="fd-grid">
          <div className="fd-photos">
            <div className="fd-polaroid">
              <i className="fd-clip" />
              {f.photo_url ? <img src={f.photo_url} alt="" referrerPolicy="no-referrer" /> : <div className="fd-nophoto">PHOTO<br />MANQUANTE</div>}
              <small>SUJET</small>
            </div>
            <div className="fd-idc">
              {f.photo_id ? <img src={f.photo_id} alt="" referrerPolicy="no-referrer" /> : <div className="fd-nophoto">CARTE D'IDENTITÉ<br />MANQUANTE</div>}
              <small>PIÈCE D'IDENTITÉ</small>
            </div>
          </div>
          <div className="fd-body">
            <div className="fd-name">{f.nom}</div>
            <span className="fd-stamp" style={{ color: col, borderColor: col }}>{(f.priorite || "Normale").toUpperCase()}</span>
            <div className="fd-rows">{rows.filter(r => r[1]).map(([k, v]) => <div key={k}><b>{k}</b><i /><span>{v}</span></div>)}</div>
            {(f.tags || []).length > 0 && <div className="fd-tags">{f.tags.map((t: string) => <span key={t}>{t}</span>)}</div>}
            {Number(f.prime) > 0 && <div className="fd-prime">PRIME : {Number(f.prime).toLocaleString("fr-FR")} $</div>}
          </div>
        </div>
        {blocks.filter(b => b[1]).map(([k, v]) => <div className="fd-block" key={k}><b>{k}</b><p>{v}</p></div>)}
        {showPrivate && f.notes_privees && <div className="fd-block fd-secret"><b>🔒 Notes privées — ne pas diffuser</b><p>{f.notes_privees}</p></div>}
        <div className="fd-foot">Document interne — Consortium Obsidian · Mis à jour le {f.updated_at ? new Date(f.updated_at).toLocaleDateString("fr-FR") : "—"}</div>
      </div>
    </div>
  );
}
