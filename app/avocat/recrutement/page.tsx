"use client";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import { CABINET_STAFF_ROLES } from "@/lib/cabinetRoles";
import { CabinetStyles } from "@/components/cabinet/CabinetStyles";
import EcranChargement from "@/components/cabinet/EcranChargement";

const STATUT_LIBELLE: Record<string, string> = {
  recue: "Reçue", entretien: "Entretien", acceptee: "Acceptée", refusee: "Refusée", retiree: "Retirée",
};
const STATUT_COULEUR: Record<string, string> = {
  recue: "#b08a3e", entretien: "#60a5fa", acceptee: "#4ade80", refusee: "#f87171", retiree: "#8a8a8a",
};

const champ: React.CSSProperties = { width: "100%", padding: "0.55rem 0.7rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "inherit", fontSize: "0.9rem", marginBottom: "0.7rem" };
const bouton: React.CSSProperties = { padding: "0.5rem 0.9rem", borderRadius: 8, border: "1px solid var(--gold)", background: "rgba(176,138,62,0.12)", color: "var(--gold)", cursor: "pointer", fontSize: "0.85rem" };
const carte: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 12, padding: "1rem", marginBottom: "0.8rem" };
const label: React.CSSProperties = { fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)", fontWeight: 600, margin: "1.6rem 0 0.8rem" };

async function appel(url: string, methode: string, corps?: any) {
  const r = await fetch(url, {
    method: methode,
    headers: corps ? { "Content-Type": "application/json" } : undefined,
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Erreur");
  return d;
}

export default function Recrutement() {
  const { user, loading } = useCurrentUser();
  const direction = !!user && hasPermission(user, "cabinet_attribution");
  const [postes, setPostes] = useState<any[]>([]);
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [membres, setMembres] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [form, setForm] = useState({ poste_id: "", nom: "", telephone: "", email: "", experience: "", motivation: "", disponibilite: "" });
  const [nouveauPoste, setNouveauPoste] = useState({ nom: "", description: "", role_acces: "" });
  const [promo, setPromo] = useState({ membre_id: "", poste_id: "", role: "", motif: "" });

  const charger = async () => {
    const [p, c, m, pr] = await Promise.all([
      fetch("/api/cabinet/recrutement/postes").then(r => r.json()),
      fetch("/api/cabinet/recrutement/candidatures").then(r => r.json()),
      fetch("/api/cabinet/cabinet_membres").then(r => r.json()),
      fetch("/api/cabinet/recrutement/promotions").then(r => r.json()),
    ]);
    setPostes(p.rows || []);
    setCandidatures(c.rows || []);
    setMembres(m.rows || []);
    setPromotions(pr.rows || []);
  };

  useEffect(() => { if (user) charger(); }, [user]); // eslint-disable-line react-hooks/set-state-in-effect

  if (loading || !user) return <EcranChargement />;

  const action = async (fn: () => Promise<any>, ok: string) => {
    setMsg("");
    try { await fn(); setMsg(ok); await charger(); }
    catch (e: any) { setMsg(e.message); }
  };

  const postuler = () => action(() => appel("/api/cabinet/recrutement/candidatures", "POST", form), "Candidature envoyée ✔");
  const creerPoste = () => action(() => appel("/api/cabinet/recrutement/postes", "POST", nouveauPoste), "Poste créé ✔");
  const supprimerPoste = (id: string) => action(() => appel(`/api/cabinet/recrutement/postes?id=${id}`, "DELETE"), "Poste supprimé ✔");
  const majCandidature = (id: string, corps: any, ok: string) => action(() => appel("/api/cabinet/recrutement/candidatures", "PATCH", { id, ...corps }), ok);
  const promouvoir = () => action(() => appel("/api/cabinet/recrutement/promotions", "POST", promo), "Promotion enregistrée ✔");

  const mesCandidatures = candidatures.filter(c => c.discord_id === user.discord_id);
  const pipeline = candidatures.filter(c => filtre === "tous" || c.statut === filtre);

  return (
    <div className="page-container cab-enter">
      <CabinetStyles />
      <div className="page-header">
        <div>
          <h1 className="page-title">Recrutement</h1>
          <p className="page-subtitle">Rejoindre le cabinet Varelli & Associés</p>
          <div className="gold-line" />
        </div>
      </div>

      {msg && <div style={{ ...carte, borderColor: msg.includes("✔") ? "#4ade80" : "#f87171" }}>{msg}</div>}

      {/* Postes ouverts et candidature */}
      <div style={label}>Postes ouverts</div>
      {postes.length === 0 && <div style={{ color: "var(--text-dim)" }}>Aucun poste ouvert pour le moment.</div>}
      {postes.map(p => (
        <div key={p.id} style={carte}>
          <b>{p.nom}</b>
          {p.description && <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: 4 }}>{p.description}</div>}
          {direction && <button style={{ ...bouton, marginTop: 8, borderColor: "#f87171", color: "#f87171", background: "transparent" }} onClick={() => supprimerPoste(p.id)}>Supprimer le poste</button>}
        </div>
      ))}

      <div style={label}>Postuler</div>
      <div style={carte}>
        <select style={champ} value={form.poste_id} onChange={e => setForm({ ...form, poste_id: e.target.value })}>
          <option value="">Choisir un poste…</option>
          {postes.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
        <input style={champ} placeholder="Nom et prénom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
        <input style={champ} placeholder="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
        <input style={champ} placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <textarea style={{ ...champ, minHeight: 80 }} placeholder="Expérience (juridique, autre…)" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
        <textarea style={{ ...champ, minHeight: 100 }} placeholder="Motivation (pourquoi toi, pourquoi le cabinet)" value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })} />
        <input style={champ} placeholder="Disponibilité (ex : immédiate, 2 semaines)" value={form.disponibilite} onChange={e => setForm({ ...form, disponibilite: e.target.value })} />
        <button style={bouton} onClick={postuler}>Envoyer ma candidature</button>
      </div>

      {mesCandidatures.length > 0 && (
        <>
          <div style={label}>Mes candidatures</div>
          {mesCandidatures.map(c => (
            <div key={c.id} style={carte}>
              <b>{c.poste_nom}</b>
              <span style={{ marginLeft: 8, color: STATUT_COULEUR[c.statut], fontSize: "0.8rem" }}>{STATUT_LIBELLE[c.statut]}</span>
              {c.entretien_at && c.statut === "entretien" && <div style={{ fontSize: "0.85rem", marginTop: 4 }}>Entretien : {new Date(c.entretien_at).toLocaleString("fr-FR")}</div>}
              {["recue", "entretien"].includes(c.statut) && (
                <button style={{ ...bouton, marginTop: 8, borderColor: "var(--border)", color: "var(--text-dim)", background: "transparent" }}
                  onClick={() => majCandidature(c.id, { statut: "retiree" }, "Candidature retirée")}>Retirer</button>
              )}
            </div>
          ))}
        </>
      )}

      {/* Direction : pipeline des candidatures */}
      {direction && (
        <>
          <div style={label}>Pipeline des candidatures</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {["tous", ...Object.keys(STATUT_LIBELLE)].map(s => (
              <button key={s} onClick={() => setFiltre(s)} style={{ ...bouton, background: filtre === s ? "rgba(176,138,62,0.2)" : "transparent", color: filtre === s ? "var(--gold)" : "inherit", borderColor: filtre === s ? "var(--gold)" : "var(--border)" }}>
                {s === "tous" ? "Tous" : STATUT_LIBELLE[s]} {s !== "tous" && `(${candidatures.filter(c => c.statut === s).length})`}
              </button>
            ))}
          </div>
          {pipeline.length === 0 && <div style={{ color: "var(--text-dim)" }}>Aucune candidature.</div>}
          {pipeline.map(c => (
            <div key={c.id} style={carte}>
              <div><b>{c.nom}</b> · {c.poste_nom} <span style={{ color: STATUT_COULEUR[c.statut], fontSize: "0.8rem" }}>{STATUT_LIBELLE[c.statut]}</span></div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginTop: 4 }}>
                {c.telephone && <>Tél : {c.telephone} · </>}{c.email && <>Email : {c.email} · </>}Dispo : {c.disponibilite || "-"}
              </div>
              {c.experience && <p style={{ fontSize: "0.85rem", margin: "0.5rem 0 0" }}><b>Expérience :</b> {c.experience}</p>}
              <p style={{ fontSize: "0.85rem", margin: "0.4rem 0 0" }}><b>Motivation :</b> {c.motivation}</p>
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer", fontSize: "0.85rem" }}>Gérer</summary>
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: "0.8rem" }}>Date d&apos;entretien</label>
                  <input type="datetime-local" style={champ} defaultValue={c.entretien_at ? c.entretien_at.slice(0, 16) : ""}
                    onBlur={e => e.target.value && majCandidature(c.id, { entretien_at: new Date(e.target.value).toISOString(), statut: "entretien" }, "Entretien planifié ✔")} />
                  <textarea style={{ ...champ, minHeight: 60 }} placeholder="Notes internes" defaultValue={c.notes || ""}
                    onBlur={e => majCandidature(c.id, { notes: e.target.value }, "Notes enregistrées ✔")} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button style={bouton} onClick={() => majCandidature(c.id, { statut: "entretien" }, "Mise en entretien ✔")}>Entretien</button>
                    <button style={{ ...bouton, borderColor: "#4ade80", color: "#4ade80" }} onClick={() => majCandidature(c.id, { statut: "acceptee" }, "Candidature acceptée, membre créé ✔")}>Accepter</button>
                    <button style={{ ...bouton, borderColor: "#f87171", color: "#f87171" }} onClick={() => majCandidature(c.id, { statut: "refusee" }, "Candidature refusée ✔")}>Refuser</button>
                  </div>
                  {c.decide_par && <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: 6 }}>Décidé par {c.decide_par}</div>}
                </div>
              </details>
            </div>
          ))}

          {/* Équipe & promotions */}
          <div style={label}>Promotion d&apos;un membre</div>
          <div style={carte}>
            <select style={champ} value={promo.membre_id} onChange={e => setPromo({ ...promo, membre_id: e.target.value })}>
              <option value="">Membre…</option>
              {membres.map(m => <option key={m.id} value={m.id}>{m.nom_rp} ({m.poste || "sans poste"})</option>)}
            </select>
            <select style={champ} value={promo.poste_id} onChange={e => setPromo({ ...promo, poste_id: e.target.value })}>
              <option value="">Nouveau poste…</option>
              {postes.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            <select style={champ} value={promo.role} onChange={e => setPromo({ ...promo, role: e.target.value })}>
              <option value="">Droits : ceux prévus par le poste</option>
              {CABINET_STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input style={champ} placeholder="Motif (facultatif)" value={promo.motif} onChange={e => setPromo({ ...promo, motif: e.target.value })} />
            <button style={bouton} onClick={promouvoir}>Valider la promotion</button>
          </div>

          <div style={label}>Historique des promotions</div>
          {promotions.length === 0 && <div style={{ color: "var(--text-dim)" }}>Aucune promotion.</div>}
          {promotions.map(p => (
            <div key={p.id} style={{ fontSize: "0.85rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <b>{p.nom_rp}</b> : {p.ancien_poste || "-"} → {p.nouveau_poste}
              {p.nouveau_role && <> · accès : {p.nouveau_role}</>}
              {p.motif && <> · {p.motif}</>}
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{new Date(p.created_at).toLocaleDateString("fr-FR")} · {p.auteur_nom}</div>
            </div>
          ))}

          <div style={label}>Créer un poste</div>
          <div style={carte}>
            <input style={champ} placeholder="Nom du poste (ex : Avocat collaborateur)" value={nouveauPoste.nom} onChange={e => setNouveauPoste({ ...nouveauPoste, nom: e.target.value })} />
            <textarea style={{ ...champ, minHeight: 60 }} placeholder="Description" value={nouveauPoste.description} onChange={e => setNouveauPoste({ ...nouveauPoste, description: e.target.value })} />
            <select style={champ} value={nouveauPoste.role_acces} onChange={e => setNouveauPoste({ ...nouveauPoste, role_acces: e.target.value })}>
              <option value="">Aucun droit particulier</option>
              {CABINET_STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button style={bouton} onClick={creerPoste}>Créer le poste</button>
          </div>
        </>
      )}
    </div>
  );
}
