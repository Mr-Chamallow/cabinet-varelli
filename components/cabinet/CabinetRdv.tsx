"use client";
import { useEffect, useState } from "react";
import CalendrierRdv, { CreneauRdv } from "@/components/cabinet/CalendrierRdv";
import { RDV_STATUT } from "@/lib/rdvStatuts";
import { useCabinetTemps } from "@/lib/useCabinetTemps";

interface Props {
  employe: boolean;    // peut demander la prise en charge et valider (cabinet_rdv en écriture)
  direction: boolean;  // peut attribuer un RDV à un avocat (cabinet_attribution)
  moiId: string;       // ID Discord de l'utilisateur connecté
}

const indicateur = (label: string, valeur: number, couleur: string) => (
  <div key={label} className="cab-card" style={{ borderTop: `2px solid ${couleur}` }}>
    <div className="cab-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: couleur, marginTop: "0.2rem" }}>{valeur}</div>
  </div>
);

const DATE_FR = (iso: string) => new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default function CabinetRdv({ employe, direction, moiId }: Props) {
  const [data, setData] = useState<{ rows: any[]; occupes: any[]; staff: boolean }>({ rows: [], occupes: [], staff: false });
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [staffListe, setStaffListe] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [form, setForm] = useState({ date_rdv: "", motif: "", prestation: "", discord_id: "", client_nom: "" });
  const [ouvrirForm, setOuvrirForm] = useState(false);
  const [choixAvocat, setChoixAvocat] = useState<Record<string, string>>({});
  const [nouvelleDate, setNouvelleDate] = useState<Record<string, string>>({});

  const charger = () => fetch("/api/cabinet/rdv").then(r => r.json()).then(d => {
    if (d.error) setErreur(d.error); else setData({ rows: d.rows || [], occupes: d.occupes || [], staff: !!d.staff });
    setChargement(false);
  }).catch(() => setChargement(false));

  // Temps réel : la liste se met à jour dès qu'un RDV change
  useCabinetTemps(["cabinet_rdv"], charger);

  useEffect(() => {
    charger();
    fetch("/api/cabinet/cabinet_tarifs").then(r => r.json()).then(d => setTarifs(d.rows || []));
    if (direction || employe) fetch("/api/cabinet/staff").then(r => r.json()).then(d => setStaffListe(d.rows || []));
  }, []);

  const appel = async (method: string, corps: any) => {
    setErreur("");
    const r = await fetch("/api/cabinet/rdv", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const d = await r.json();
    if (!r.ok || d.error) { setErreur(d.error || "Erreur"); return false; }
    charger();
    return true;
  };

  const demander = async () => {
    const corps = data.staff ? form : { date_rdv: form.date_rdv, motif: form.motif, prestation: form.prestation };
    const ok = await appel("POST", corps);
    if (ok) { setOuvrirForm(false); setForm({ date_rdv: "", motif: "", prestation: "", discord_id: "", client_nom: "" }); }
  };

  // Clic sur un créneau libre du calendrier : le créneau est fixé, le client précise la prestation
  const choisirCreneau = (iso: string) => {
    setForm({ ...form, date_rdv: iso.slice(0, 16) });
    setOuvrirForm(true);
  };

  const nomCreneau = (r: any) => `${r.client_nom || "Client"}${r.motif ? `, ${r.motif}` : ""}${r.avocat_nom ? ` (${r.avocat_nom})` : ""}`;

  const creneaux: CreneauRdv[] = data.staff
    ? data.rows.map(r => ({ date_rdv: r.date_rdv, statut: r.statut, libelle: nomCreneau(r) }))
    : data.occupes.map(o => ({ date_rdv: o.date_rdv, statut: o.statut }));

  const compte = (...statuts: string[]) => data.rows.filter(r => statuts.includes(r.statut)).length;

  if (chargement) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
      {/* Indicateurs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "0.8rem" }}>
        {data.staff ? (
          <>
            {indicateur("En attente de prise en charge", compte("demande"), "#e0b050")}
            {indicateur("À confirmer", compte("attribue", "reporte"), "#e0b050")}
            {indicateur("Confirmés", compte("confirme"), "#5fb878")}
            {indicateur("En cours", compte("en_cours"), "#4a9eff")}
          </>
        ) : (
          <>
            {indicateur("Demandes en cours", compte("demande", "attribue"), "#e0b050")}
            {indicateur("À confirmer", compte("reporte"), "#e08a3c")}
            {indicateur("RDV confirmés", compte("confirme", "en_cours"), "#5fb878")}
          </>
        )}
      </div>

      {/* Titre et bouton d'action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
        <h2 className="cab-section-titre" style={{ margin: 0 }}>{data.staff ? "Agenda du cabinet" : "Mes rendez-vous"}</h2>
        {data.staff ? (
          <button className="btn btn-sm" onClick={() => setOuvrirForm(!ouvrirForm)}>{ouvrirForm ? "Fermer" : "+ Ajouter un RDV"}</button>
        ) : (
          <span className="cab-muted" style={{ fontSize: "0.85rem" }}>Clique sur une case verte du calendrier pour réserver</span>
        )}
      </div>

      {ouvrirForm && (
        <div className="cab-card">
          <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>{data.staff ? "Nouveau RDV" : "Ta demande de RDV"}</div>
          {data.staff ? (
            <div className="form-group"><label>Date et heure (créneau d&apos;une heure)</label><input type="datetime-local" value={form.date_rdv} onChange={e => setForm({ ...form, date_rdv: e.target.value })} /></div>
          ) : (
            <div style={{ marginBottom: "0.8rem" }}>Créneau choisi : <strong>{form.date_rdv && DATE_FR(form.date_rdv)}</strong></div>
          )}
          {data.staff && (
            <>
              <div className="form-group"><label>ID Discord du client (laisse vide si le RDV est pour toi)</label><input value={form.discord_id} onChange={e => setForm({ ...form, discord_id: e.target.value })} /></div>
              <div className="form-group"><label>Nom RP du client</label><input value={form.client_nom} onChange={e => setForm({ ...form, client_nom: e.target.value })} /></div>
            </>
          )}
          <div className="form-group">
            <label>Prestation</label>
            <select value={form.prestation} onChange={e => setForm({ ...form, prestation: e.target.value })}>
              <option value="">Choisir une prestation</option>
              {tarifs.map(t => <option key={t.id} value={`${t.nom}${t.prix ? ` (${t.prix})` : ""}`}>{t.categorie} : {t.nom}{t.prix ? ` (${t.prix})` : ""}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Motif</label><input value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Ex : divorce, changement de nom" /></div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-sm" onClick={demander}>{data.staff ? "Enregistrer" : "Envoyer la demande"}</button>
            <button className="btn btn-outline btn-sm" onClick={() => setOuvrirForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      <CalendrierRdv rdvs={creneaux} staff={data.staff} onPick={data.staff ? undefined : choisirCreneau} />

      {erreur && <div style={{ color: "var(--danger)" }}>{erreur}</div>}

      {data.rows.length === 0 && <div className="empty-state"><div className="empty-title">Aucun rendez-vous</div></div>}

      {data.rows.map(r => {
        const s = RDV_STATUT[r.statut] || { txt: r.statut, color: "var(--text-dim)" };
        const candidats: any[] = r.cabinet_rdv_candidats || [];
        const estAvocat = r.avocat_discord_id === moiId;
        const dejaCandidat = candidats.some(c => c.avocat_discord_id === moiId);
        const monRdv = !data.staff && r.discord_id === moiId;
        const peutGerer = (estAvocat || direction) && data.staff;
        const peutValider = peutGerer && r.statut === "attribue";
        const peutDemarrer = peutGerer && r.statut === "confirme";
        const peutTerminer = peutGerer && (r.statut === "confirme" || r.statut === "en_cours");
        const peutReporter = peutGerer && ["attribue", "confirme", "en_cours", "reporte"].includes(r.statut);
        const peutConfirmerReport = monRdv && r.statut === "reporte";
        const peutAnnuler = r.statut !== "termine" && r.statut !== "annule" && (monRdv || estAvocat || direction);
        const jour = new Date(r.date_rdv);

        return (
          <div key={r.id} className="cab-card" style={{ display: "grid", gridTemplateColumns: "84px minmax(0,1fr)", gap: "1rem", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ textAlign: "center", borderRight: "1px solid var(--border)", paddingRight: "0.8rem" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", color: "var(--gold)", lineHeight: 1 }}>{jour.toLocaleDateString("fr-FR", { day: "2-digit" })}</div>
              <div className="cab-muted" style={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.1em" }}>{jour.toLocaleDateString("fr-FR", { month: "short" })}</div>
              <div style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>{jour.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>{data.staff ? (r.client_nom || "Client non renseigné") : "Rendez-vous avec le cabinet"}</div>
                <span style={{ background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}`, borderRadius: 999, padding: "0.15rem 0.6rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{s.txt}</span>
              </div>

              <div className="cab-muted" style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
                {r.prestation && <div>Prestation : {r.prestation}</div>}
                {r.motif && <div>Motif : {r.motif}</div>}
                {r.avocat_nom
                  ? <div>Avocat : {r.avocat_nom}</div>
                  : (r.aucune_preference ? <div>Avocat : aucune préférence, en attente de la direction</div> : null)}
                {r.statut === "reporte" && r.date_precedente && <div>Ancien créneau : {DATE_FR(r.date_precedente)} (reporté{r.reporte_par ? ` par ${r.reporte_par}` : ""})</div>}
              </div>

              {/* Client : choisir l'avocat parmi les candidats */}
              {monRdv && r.statut === "demande" && (
                <div style={{ marginTop: "0.7rem" }}>
                  <div style={{ fontSize: "0.82rem", marginBottom: "0.3rem" }}>Choisis un avocat parmi ceux qui demandent ce RDV :</div>
                  {candidats.length === 0 && <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Aucune demande de prise en charge pour l&apos;instant.</div>}
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {candidats.map(c => <button key={c.avocat_discord_id} className="btn btn-outline btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "choisir", avocat_discord_id: c.avocat_discord_id })}>{c.avocat_nom}</button>)}
                    <button className="btn btn-outline btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "choisir", aucune_preference: true })}>Aucune préférence</button>
                  </div>
                </div>
              )}

              {/* Employé : demander la prise en charge */}
              {data.staff && employe && r.statut === "demande" && !dejaCandidat && (
                <button className="btn btn-outline btn-sm" style={{ marginTop: "0.7rem" }} onClick={() => appel("PATCH", { id: r.id, action: "candidature" })}>Demander la prise en charge</button>
              )}
              {data.staff && employe && r.statut === "demande" && dejaCandidat && (
                <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.6rem" }}>Ta demande de prise en charge est enregistrée.</div>
              )}
              {data.staff && candidats.length > 0 && r.statut === "demande" && (
                <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.4rem" }}>Demandes : {candidats.map(c => c.avocat_nom).join(", ")}</div>
              )}

              {/* Direction : attribuer */}
              {direction && data.staff && (r.statut === "demande" || r.statut === "attribue") && (
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
                  <select value={choixAvocat[r.id] || ""} onChange={e => setChoixAvocat({ ...choixAvocat, [r.id]: e.target.value })} style={{ flex: 1, minWidth: 160 }}>
                    <option value="">Attribuer à</option>
                    {staffListe.map(s => <option key={s.discord_id} value={s.discord_id}>{s.nom} ({s.role})</option>)}
                  </select>
                  <button className="btn btn-outline btn-sm" onClick={() => choixAvocat[r.id] && appel("PATCH", { id: r.id, action: "attribuer", avocat_discord_id: choixAvocat[r.id] })}>Attribuer</button>
                </div>
              )}

              {/* Client : confirmer le nouveau créneau après un report */}
              {peutConfirmerReport && (
                <div style={{ marginTop: "0.7rem", padding: "0.6rem", border: "1px solid #e08a3c", borderRadius: "var(--radius)" }}>
                  <div style={{ fontSize: "0.85rem", marginBottom: "0.4rem" }}>Ton rendez-vous a été reporté à <strong>{DATE_FR(r.date_rdv)}</strong>. Tu confirmes ce nouveau créneau ?</div>
                  <button className="btn btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "confirmer_report" })}>Confirmer le nouveau créneau</button>
                </div>
              )}

              {/* Avocat / direction : actions de suivi */}
              {(peutValider || peutDemarrer || peutTerminer || peutAnnuler) && (
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
                  {peutValider && <button className="btn btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "valider" })}>Confirmer le RDV</button>}
                  {peutDemarrer && <button className="btn btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "demarrer" })}>Démarrer (en cours)</button>}
                  {peutTerminer && <button className="btn btn-outline btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "terminer" })}>Marquer terminé</button>}
                  {peutAnnuler && <button className="btn btn-outline btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "annuler" })}>Annuler</button>}
                </div>
              )}

              {/* Avocat / direction : reporter à un nouveau créneau */}
              {peutReporter && (
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                  <input type="datetime-local" value={nouvelleDate[r.id] || ""} onChange={e => setNouvelleDate({ ...nouvelleDate, [r.id]: e.target.value })} style={{ flex: 1, minWidth: 180 }} />
                  <button className="btn btn-outline btn-sm" onClick={() => nouvelleDate[r.id] && appel("PATCH", { id: r.id, action: "reporter", nouvelle_date: nouvelleDate[r.id] })}>Reporter</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
