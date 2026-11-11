"use client";
import { useEffect, useState } from "react";
import CalendrierRdv, { CreneauRdv } from "@/components/cabinet/CalendrierRdv";

const STATUT: Record<string, { txt: string; color: string }> = {
  demande: { txt: "En attente de prise en charge", color: "#e0b050" },
  attribue: { txt: "Attribué, en attente de validation", color: "#e0b050" },
  confirme: { txt: "Confirmé", color: "#5fb878" },
  termine: { txt: "Terminé", color: "#8a8a8a" },
  annule: { txt: "Annulé", color: "#d9534f" },
};

interface Props {
  employe: boolean;    // peut demander la prise en charge et valider (cabinet_rdv en écriture)
  direction: boolean;  // peut attribuer un RDV à un avocat (cabinet_attribution)
  moiId: string;       // ID Discord de l'utilisateur connecté
}

export default function CabinetRdv({ employe, direction, moiId }: Props) {
  const [data, setData] = useState<{ rows: any[]; occupes: any[]; staff: boolean }>({ rows: [], occupes: [], staff: false });
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [staffListe, setStaffListe] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [form, setForm] = useState({ date_rdv: "", motif: "", prestation: "", discord_id: "", client_nom: "" });
  const [ouvrirForm, setOuvrirForm] = useState(false);
  const [choixAvocat, setChoixAvocat] = useState<Record<string, string>>({});

  const charger = () => fetch("/api/cabinet/rdv").then(r => r.json()).then(d => {
    if (d.error) setErreur(d.error); else setData({ rows: d.rows || [], occupes: d.occupes || [], staff: !!d.staff });
    setChargement(false);
  });

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
    const ok = await appel("POST", form);
    if (ok) { setOuvrirForm(false); setForm({ date_rdv: "", motif: "", prestation: "", discord_id: "", client_nom: "" }); }
  };

  // Clic sur une case verte du calendrier : pré-remplit la date et ouvre le formulaire
  const choisirCreneau = (iso: string) => {
    setForm({ ...form, date_rdv: iso.slice(0, 16) });
    setOuvrirForm(true);
  };

  const nomCreneau = (r: any) => `${r.client_nom || "Client"}${r.motif ? `, ${r.motif}` : ""}${r.avocat_nom ? ` (${r.avocat_nom})` : ""}`;

  const creneaux: CreneauRdv[] = data.staff
    ? data.rows.map(r => ({ date_rdv: r.date_rdv, statut: r.statut, libelle: nomCreneau(r) }))
    : data.occupes.map(o => ({ date_rdv: o.date_rdv, statut: o.statut }));

  const quand = (s: string) => new Date(s).toLocaleString("fr-FR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });

  if (chargement) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;

  return (
    <div>
      <CalendrierRdv rdvs={creneaux} staff={data.staff} onPick={choisirCreneau} />

      {(
        <div style={{ marginBottom: "1.2rem" }}>
          <button className="btn btn-sm" onClick={() => setOuvrirForm(!ouvrirForm)}>{ouvrirForm ? "Fermer" : (data.staff ? "Ajouter un RDV" : "Demander un RDV")}</button>
          {ouvrirForm && (
            <div className="card" style={{ marginTop: "0.8rem" }}>
              <div className="form-group"><label>Date et heure (créneau d'une heure)</label><input type="datetime-local" value={form.date_rdv} onChange={e => setForm({ ...form, date_rdv: e.target.value })} /></div>
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
              <button className="btn btn-sm" onClick={demander}>Envoyer la demande</button>
            </div>
          )}
        </div>
      )}

      {erreur && <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>{erreur}</div>}

      {data.staff && (
        <div style={{ marginBottom: "1rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>Tous les rendez-vous du cabinet</div>
      )}

      {data.rows.length === 0 && <div className="empty-state"><div className="empty-title">Aucun rendez-vous</div></div>}

      {data.rows.map(r => {
        const s = STATUT[r.statut] || { txt: r.statut, color: "var(--text-dim)" };
        const candidats: any[] = r.cabinet_rdv_candidats || [];
        const estAvocat = r.avocat_discord_id === moiId;
        const dejaCandidat = candidats.some(c => c.avocat_discord_id === moiId);
        const monRdv = !data.staff && r.discord_id === moiId;
        const peutValider = (estAvocat || direction) && r.statut === "attribue";
        const peutTerminer = (estAvocat || direction) && r.statut === "confirme";
        const peutAnnuler = r.statut !== "termine" && r.statut !== "annule" && (monRdv || estAvocat || direction);

        return (
          <div key={r.id} className="card" style={{ marginBottom: "0.7rem" }}>
            <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{quand(r.date_rdv)}</div>
            <div style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
              {data.staff && <>Client : {r.client_nom || "Non renseigné"}<br /></>}
              {r.prestation && <>Prestation : {r.prestation}<br /></>}
              {r.motif && (data.staff ? <>Motif : {r.motif}<br /></> : <>Motif : {r.motif}<br /></>)}
              {r.avocat_nom ? <>Avocat : {r.avocat_nom}<br /></> : (r.aucune_preference ? <>Avocat : aucune préférence, en attente de la direction<br /></> : null)}
            </div>
            <div style={{ fontSize: "0.75rem", color: s.color, marginTop: "0.3rem" }}>{s.txt}</div>

            {/* Client : choisir l'avocat parmi les candidats */}
            {monRdv && r.statut === "demande" && (
              <div style={{ marginTop: "0.6rem" }}>
                <div style={{ fontSize: "0.8rem", marginBottom: "0.3rem" }}>Choisis un avocat parmi ceux qui demandent ce RDV :</div>
                {candidats.length === 0 && <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Aucune demande de prise en charge pour l'instant.</div>}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {candidats.map(c => <button key={c.avocat_discord_id} className="btn btn-outline btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "choisir", avocat_discord_id: c.avocat_discord_id })}>{c.avocat_nom}</button>)}
                  <button className="btn btn-outline btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "choisir", aucune_preference: true })}>Aucune préférence</button>
                </div>
              </div>
            )}

            {/* Employé : demander la prise en charge */}
            {!data.staff ? null : employe && r.statut === "demande" && !dejaCandidat && (
              <button className="btn btn-outline btn-sm" style={{ marginTop: "0.6rem" }} onClick={() => appel("PATCH", { id: r.id, action: "candidature" })}>Demander la prise en charge</button>
            )}
            {data.staff && employe && r.statut === "demande" && dejaCandidat && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>Ta demande de prise en charge est enregistrée.</div>
            )}
            {data.staff && candidats.length > 0 && r.statut === "demande" && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.4rem" }}>Demandes : {candidats.map(c => c.avocat_nom).join(", ")}</div>
            )}

            {/* Direction : attribuer */}
            {direction && (r.statut === "demande" || r.statut === "attribue") && (
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                <select value={choixAvocat[r.id] || ""} onChange={e => setChoixAvocat({ ...choixAvocat, [r.id]: e.target.value })} style={{ flex: 1, minWidth: 160 }}>
                  <option value="">Attribuer à</option>
                  {staffListe.map(s => <option key={s.discord_id} value={s.discord_id}>{s.nom} ({s.role})</option>)}
                </select>
                <button className="btn btn-outline btn-sm" onClick={() => choixAvocat[r.id] && appel("PATCH", { id: r.id, action: "attribuer", avocat_discord_id: choixAvocat[r.id] })}>Attribuer</button>
              </div>
            )}

            {(peutValider || peutTerminer || peutAnnuler) && (
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                {peutValider && <button className="btn btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "valider" })}>Valider le RDV</button>}
                {peutTerminer && <button className="btn btn-outline btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "terminer" })}>Marquer terminé</button>}
                {peutAnnuler && <button className="btn btn-outline btn-sm" onClick={() => appel("PATCH", { id: r.id, action: "annuler" })}>Annuler</button>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
