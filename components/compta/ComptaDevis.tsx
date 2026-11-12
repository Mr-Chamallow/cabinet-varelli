"use client";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";
import { LignesEditor, LigneForm, LIGNE_VIDE, dateFr, totalLignes, versPayload, champ } from "@/components/compta/commun";

const STATUT_DEVIS: Record<string, { label: string; color: string }> = {
  envoye: { label: "Envoyé", color: "#e0b050" },
  accepte: { label: "Accepté", color: "#5fb878" },
  refuse: { label: "Refusé", color: "#f87171" },
  facture: { label: "Facturé", color: "#9ca3af" },
};

// Devis : créés ici, acceptés ou refusés, puis transformés en facture en un clic
export default function ComptaDevis() {
  const [devis, setDevis] = useState<any[]>([]);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [erreur, setErreur] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [lignes, setLignes] = useState<LigneForm[]>([{ ...LIGNE_VIDE }]);
  const [tva, setTva] = useState("0");
  const [note, setNote] = useState("");

  const charger = () => fetch("/api/cabinet/compta/devis").then(r => r.json()).then(d => d.error ? setErreur(d.error) : setDevis(d.rows || []));

  useEffect(() => {
    charger();
    fetch("/api/cabinet/dossiers").then(r => r.json()).then(d => setDossiers((d.rows || []).filter((x: any) => x.statut !== "archive")));
    fetch("/api/cabinet/cabinet_tarifs").then(r => r.json()).then(d => setTarifs(d.rows || []));
    fetch("/api/cabinet/staff").then(r => r.json()).then(d => setStaff(d.rows || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function creer() {
    setErreur("");
    if (!dossierId) return setErreur("Choisis un dossier.");
    const r = await fetch("/api/cabinet/compta/devis", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dossier_id: dossierId, lignes: versPayload(lignes, staff), tva_taux: Number(tva), note }),
    });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    setLignes([{ ...LIGNE_VIDE }]); setTva("0"); setNote(""); setDossierId("");
    charger();
  }

  async function action(id: string, a: string) {
    setErreur("");
    const r = await fetch("/api/cabinet/compta/devis", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: a }) });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    charger();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {erreur && <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{erreur}</div>}

      <div className="cab-card">
        <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Nouveau devis</div>
        <div className="form-group"><label>Dossier</label>
          <select value={dossierId} onChange={e => setDossierId(e.target.value)}>
            <option value="">Choisir un dossier</option>
            {dossiers.map((d: any) => <option key={d.id} value={d.id}>{d.titre} ({d.client_nom || "client"})</option>)}
          </select>
        </div>
        <LignesEditor lignes={lignes} setLignes={setLignes} staff={staff} tarifs={tarifs} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.6rem", marginTop: "0.8rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}><label>TVA (%)</label><input inputMode="decimal" value={tva} onChange={e => setTva(e.target.value)} /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Note</label><input value={note} onChange={e => setNote(e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontWeight: 700 }}>Total : {montant(totalLignes(lignes, tva))}</div>
          <button className="btn btn-sm" onClick={creer}>Créer le devis</button>
        </div>
      </div>

      {devis.length === 0 && <div className="cab-muted">Aucun devis.</div>}

      {devis.map(d => {
        const st = STATUT_DEVIS[d.statut] || { label: d.statut, color: "#999" };
        return (
          <div key={d.id} className="cab-card" style={{ borderLeft: `3px solid ${st.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{d.numero} · {d.client_nom || "-"} · {montant(Number(d.montant))}</div>
                <div className="cab-muted" style={{ fontSize: "0.82rem" }}>Créé le {dateFr(d.created_at)}{d.note ? ` · ${d.note}` : ""}</div>
              </div>
              <span style={{ alignSelf: "flex-start", color: st.color, border: `1px solid ${st.color}`, borderRadius: 999, padding: "0.15rem 0.6rem", fontSize: "0.72rem" }}>{st.label}</span>
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.82rem" }}>
              {(d.signatures || []).map((s: any, i: number) => <div key={i}>✍️ {s.role === "avocat" ? "Avocat" : "Client"} : <b>{s.nom}</b> · {dateFr(s.at)}</div>)}
              {d.statut === "envoye" && !(d.signatures || []).some((s: any) => s.role === "client") && <div className="cab-muted">En attente de la signature du client</div>}
            </div>
            {d.statut !== "facture" && (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
                <a className="btn btn-outline btn-sm" href={`/api/cabinet/compta/devis/${d.id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
                {d.statut !== "accepte" &&<button className="btn btn-outline btn-sm" onClick={() => action(d.id, "accepter")}>Accepté</button>}
                {d.statut !== "refuse" && <button className="btn btn-outline btn-sm" onClick={() => action(d.id, "refuser")}>Refusé</button>}
                {d.statut === "accepte" && <button className="btn btn-sm" onClick={() => action(d.id, "transformer")}>Transformer en facture</button>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
