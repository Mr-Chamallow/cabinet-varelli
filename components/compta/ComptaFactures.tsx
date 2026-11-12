"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";
import { supprimerDefinitivement } from "@/lib/suppression";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import { LignesEditor, LigneForm, LIGNE_VIDE, MODES, STATUTS, Stat, champ, dateFr, totalLignes, versPayload } from "@/components/compta/commun";

// Factures : création, encaissements (partiels ou totaux), avoirs, historique, export
export default function ComptaFactures() {
  const { user } = useCurrentUser();
  const direction = !!user && hasPermission(user, "cabinet_attribution");
  const [factures, setFactures] = useState<any[]>([]);
  const [totaux, setTotaux] = useState<any>({ encaisse: 0, attente: 0, retard: 0 });
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [erreur, setErreur] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [dossierId, setDossierId] = useState("");
  const [lignes, setLignes] = useState<LigneForm[]>([{ ...LIGNE_VIDE }]);
  const [tva, setTva] = useState("0");
  const [echeance, setEcheance] = useState("");
  const [note, setNote] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [encaissement, setEncaissement] = useState<{ id: string; montant: string; mode: string } | null>(null);
  const [avoir, setAvoir] = useState<{ id: string; motif: string } | null>(null);
  const [historique, setHistorique] = useState<Record<string, any>>({});
  const [du, setDu] = useState(() => new Date(Date.now() - 6 * 86400_000).toISOString().slice(0, 10));
  const [au, setAu] = useState(() => new Date().toISOString().slice(0, 10));

  const charger = () => fetch("/api/cabinet/factures").then(r => r.json()).then(d => {
    if (d.error) return setErreur(d.error);
    setFactures(d.rows || []);
    setTotaux(d.totaux || { encaisse: 0, attente: 0, retard: 0 });
  });

  useEffect(() => {
    const pre = new URLSearchParams(window.location.search).get("dossier");
    if (pre) setDossierId(pre);
    charger();
    fetch("/api/cabinet/dossiers").then(r => r.json()).then(d => setDossiers((d.rows || []).filter((x: any) => x.statut !== "archive")));
    fetch("/api/cabinet/cabinet_tarifs").then(r => r.json()).then(d => setTarifs(d.rows || []));
    fetch("/api/cabinet/staff").then(r => r.json()).then(d => setStaff(d.rows || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const action = async (id: string, corps: any) => {
    setErreur("");
    const r = await fetch(`/api/cabinet/factures/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const d = await r.json();
    if (!r.ok) { setErreur(d.error || "Erreur"); return false; }
    charger();
    setHistorique(h => { const c = { ...h }; delete c[id]; return c; });
    return true;
  };

  async function creer() {
    setErreur("");
    if (!dossierId) return setErreur("Choisis un dossier.");
    setEnvoi(true);
    const r = await fetch("/api/cabinet/factures", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dossier_id: dossierId, lignes: versPayload(lignes, staff), tva_taux: Number(tva), date_echeance: echeance || null, note }),
    });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok) return setErreur(d.error || "Erreur");
    setLignes([{ ...LIGNE_VIDE }]); setTva("0"); setEcheance(""); setNote(""); setDossierId("");
    charger();
  }

  async function voirHistorique(id: string) {
    if (historique[id]) return setHistorique(h => { const c = { ...h }; delete c[id]; return c; });
    const d = await fetch(`/api/cabinet/factures/${id}`).then(r => r.json());
    setHistorique(h => ({ ...h, [id]: d }));
  }

  async function supprimer(id: string, numero: string) {
    const res = await supprimerDefinitivement({ type: "facture", id }, `la facture ${numero}`);
    if (!res.ok) return setErreur(res.message);
    charger();
  }

  const liste = factures.filter(f => filtre === "tous" || f.statut === filtre);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {erreur && <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{erreur}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.7rem" }}>
        <Stat label="Encaissé" valeur={montant(totaux.encaisse)} couleur="#5fb878" />
        <Stat label="En attente" valeur={montant(totaux.attente)} couleur="#e0b050" />
        <Stat label="En retard" valeur={`${totaux.retard} facture(s)`} couleur="#f87171" />
      </div>

      <div className="cab-card">
        <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Nouvelle facture</div>
        <div className="form-group"><label>Dossier</label>
          <select value={dossierId} onChange={e => setDossierId(e.target.value)}>
            <option value="">Choisir un dossier</option>
            {dossiers.map((d: any) => <option key={d.id} value={d.id}>{d.titre} ({d.client_nom || "client"})</option>)}
          </select>
        </div>
        <LignesEditor lignes={lignes} setLignes={setLignes} staff={staff} tarifs={tarifs} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.6rem", marginTop: "0.8rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}><label>TVA (%)</label><input inputMode="decimal" value={tva} onChange={e => setTva(e.target.value)} /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Échéance (vide = 7 jours)</label><input type="date" value={echeance} onChange={e => setEcheance(e.target.value)} /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Note</label><input value={note} onChange={e => setNote(e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontWeight: 700 }}>Total : {montant(totalLignes(lignes, tva))}</div>
          <button className="btn btn-sm" disabled={envoi} onClick={creer}>{envoi ? "Création..." : "Créer la facture"}</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {[["tous", "Toutes"], ["en_attente", "En attente"], ["payee", "Payées"], ["annulee", "Annulées"]].map(([k, l]) => (
          <button key={k} className={`btn btn-sm ${filtre === k ? "" : "btn-outline"}`} onClick={() => setFiltre(k)}>{l}</button>
        ))}
      </div>

      {liste.length === 0 && <div className="cab-muted">Aucune facture.</div>}

      {liste.map(f => {
        const st = STATUTS[f.statut] || { label: f.statut, color: "#999" };
        const paye = Math.round(Number(f.montant_paye) || 0);
        const reste = Math.round(Number(f.montant) || 0) - paye;
        const dossierLie = dossiers.find((d: any) => d.id === f.dossier_id);
        const h = historique[f.id];
        return (
          <div key={f.id} className="cab-card" style={{ borderLeft: `3px solid ${st.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{f.numero || "Facture"} · {f.client_nom || "-"}</div>
                <div className="cab-muted" style={{ fontSize: "0.82rem" }}>
                  Émise le {dateFr(f.created_at)} · échéance {dateFr(f.date_echeance)} · payé {montant(paye)} / {montant(Number(f.montant))}{reste > 0 && f.statut !== "annulee" ? ` · reste ${montant(reste)}` : ""}
                </div>
              </div>
              <span style={{ alignSelf: "flex-start", color: st.color, border: `1px solid ${st.color}`, borderRadius: 999, padding: "0.15rem 0.6rem", fontSize: "0.72rem" }}>{st.label}</span>
            </div>

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
              <a className="btn btn-outline btn-sm" href={`/api/cabinet/factures/${f.id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
              {dossierLie && <Link className="btn btn-outline btn-sm" href={`/avocat/dossiers/${f.dossier_id}`}>Dossier</Link>}
              {f.statut !== "annulee" && reste > 0 && (
                <button className="btn btn-sm" onClick={() => setEncaissement({ id: f.id, montant: String(reste), mode: "Virement" })}>Encaisser</button>
              )}
              {f.statut === "en_attente" && <button className="btn btn-outline btn-sm" onClick={() => action(f.id, { statut: "payee", mode: "Virement" })}>Marquer réglée</button>}
              {f.statut !== "annulee" && <button className="btn btn-outline btn-sm" onClick={() => setAvoir({ id: f.id, motif: "" })}>Faire un avoir</button>}
              <button className="btn btn-outline btn-sm" onClick={() => voirHistorique(f.id)}>{h ? "Masquer" : "Détails"}</button>
              {direction && <button className="btn btn-outline btn-sm" style={{ color: "#f87171", borderColor: "#f87171" }} onClick={() => supprimer(f.id, f.numero || "")}>Supprimer</button>}
            </div>

            {encaissement?.id === f.id && (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem", alignItems: "center" }}>
                <input style={{ ...champ, width: 140 }} inputMode="numeric" value={encaissement.montant} onChange={e => setEncaissement({ ...encaissement, montant: e.target.value })} />
                <select style={{ ...champ, width: 150 }} value={encaissement.mode} onChange={e => setEncaissement({ ...encaissement, mode: e.target.value })}>
                  {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button className="btn btn-sm" onClick={async () => { if (await action(f.id, { action: "paiement", montant: Number(encaissement.montant), mode: encaissement.mode })) setEncaissement(null); }}>Valider le paiement</button>
                <button className="btn btn-outline btn-sm" onClick={() => setEncaissement(null)}>Annuler</button>
              </div>
            )}

            {avoir?.id === f.id && (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem", alignItems: "center" }}>
                <input style={{ ...champ, flex: 1, minWidth: 200 }} placeholder="Motif de l'avoir (obligatoire)" value={avoir.motif} onChange={e => setAvoir({ ...avoir, motif: e.target.value })} />
                <button className="btn btn-sm" onClick={async () => { if (await action(f.id, { action: "avoir", motif: avoir.motif })) setAvoir(null); }}>Émettre l&apos;avoir</button>
                <button className="btn btn-outline btn-sm" onClick={() => setAvoir(null)}>Annuler</button>
              </div>
            )}

            {h && (
              <div style={{ marginTop: "0.7rem", fontSize: "0.8rem" }}>
                <div className="cab-muted" style={{ marginBottom: "0.3rem" }}>Paiements</div>
                {(h.paiements || []).length === 0 && <div className="cab-muted">Aucun paiement.</div>}
                {(h.paiements || []).map((p: any) => <div key={p.id}>{dateFr(p.created_at)} · {montant(Number(p.montant))} · {p.mode} · {p.auteur_nom || ""}</div>)}
                <div className="cab-muted" style={{ margin: "0.5rem 0 0.3rem" }}>Historique</div>
                {(h.historique || []).map((x: any) => <div key={x.id}>{dateFr(x.created_at)} · {x.action} · {x.details || ""} · {x.auteur_nom || ""}</div>)}
              </div>
            )}
          </div>
        );
      })}

      <div className="cab-card">
        <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Export des factures (CSV)</div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <input type="date" style={{ ...champ, width: "auto" }} value={du} onChange={e => setDu(e.target.value)} />
          <span className="cab-muted">au</span>
          <input type="date" style={{ ...champ, width: "auto" }} value={au} onChange={e => setAu(e.target.value)} />
          <a className="btn btn-gold btn-sm" href={`/api/cabinet/factures/export?du=${du}&au=${au}`}>Télécharger</a>
        </div>
      </div>
    </div>
  );
}
