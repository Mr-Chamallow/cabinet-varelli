"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

interface Modele {
  id: string;
  titre: string;
  type: string;
  contenu: string;
  created_by: string;
  created_at: string;
}

const TYPES = ["Plaidoirie","Conclusions","Demande de nullité","Requête","Lettre au client","Autre"];

const TEMPLATES_DEFAUT = [
  {
    titre: "Demande de nullité — Vice Miranda",
    type: "Demande de nullité",
    contenu: `Maître [Nom de l'avocat], au nom de [Nom du client],

DEMANDE DE NULLITÉ DE PROCÉDURE

Fondement : Violation des droits Miranda — Articles 41 & 42 du Code de Procédure Pénale

Faits :
Mon client a été arrêté le [date] à [heure] par [matricule des agents]. Les droits Miranda ont été [non lus / lus tardivement / incomplets].

Moyens soulevés :
• Dépassement du délai de 15 minutes pour la lecture des droits (Art. 41 CPP)
• [Omission du droit à un avocat / EMS / nourriture]
• [Fouille effectuée avant la lecture des droits]
• [Autre vice de procédure constaté]

Sur le fondement de l'article 42 du Code de Procédure Pénale, tout vice substantiel affectant les droits de la défense entraîne la nullité de l'ensemble des actes subséquents.

En conséquence, je sollicite respectueusement de cette cour :
1. La nullité de l'ensemble de la procédure d'arrestation
2. La mise en liberté immédiate de mon client
3. Le retrait de toutes charges fondées sur les éléments obtenus irrégulièrement

Fait à Los Santos, le [date]
Cabinet BullHead — Maître [Nom]`,
  },
  {
    titre: "Plaidoirie — Défense pénale standard",
    type: "Plaidoirie",
    contenu: `Mesdames et Messieurs les membres de cette cour,

Mon client, [Nom du client], comparaît aujourd'hui devant vous accusé de [chefs d'inculpation].

Je souhaite, avant toute chose, rappeler un principe fondamental de notre droit : la présomption d'innocence. Mon client est innocent jusqu'à preuve du contraire, et il appartient à l'accusation — et à elle seule — d'apporter cette preuve au-delà de tout doute raisonnable.

Sur les faits :
[Exposé des faits tels que vus par la défense]

Sur le droit :
[Argumentation juridique — qualification contestée, éléments constitutifs manquants, etc.]

Sur les circonstances atténuantes :
[Absence d'antécédents / contexte particulier / coopération avec les autorités / regret sincère]

En conclusion, je vous demande de bien vouloir [relaxer / requalifier les faits / prononcer une peine clémente] envers mon client.

La justice, dans sa sagesse, saura distinguer la vérité des apparences.

Maître [Nom]
Cabinet BullHead — Los Santos`,
  },
  {
    titre: "Requête d'expungement (effacement de casier)",
    type: "Requête",
    contenu: `REQUÊTE EN EFFACEMENT DE CASIER JUDICIAIRE

Demandeur : [Nom du client]
Représenté par : Maître [Nom], Cabinet BullHead

À l'attention du Tribunal de Los Santos,

Par la présente, je sollicite l'effacement du casier judiciaire de mon client pour les motifs suivants :

1. [Chef à effacer — code et infraction] — condamnation datant du [date]
2. Bonne conduite irréprochable depuis cette date
3. [Réinsertion professionnelle / sociale constatée]
4. [Absence de récidive]

Fondement légal : [Article applicable du Code Fédéral de Conformité Économique ou Code Pénal]

Documents joints :
□ Extrait de casier judiciaire actuel
□ Justificatifs de bonne conduite
□ Attestation employeur (le cas échéant)
□ [Autres pièces pertinentes]

Je me tiens à la disposition du Tribunal pour tout renseignement complémentaire et reste convaincu que la présente requête s'inscrit dans une démarche de réinsertion légitime.

Maître [Nom]
Cabinet BullHead`,
  },
  {
    titre: "Conclusions en défense — Requalification des faits",
    type: "Conclusions",
    contenu: `CONCLUSIONS EN DÉFENSE

Pour : [Nom du client]
Contre : Le Ministère Public
Représenté par : Maître [Nom], Cabinet BullHead

PLAISE AU TRIBUNAL,

I. RAPPEL DES FAITS
[Exposé factuel neutre des événements]

II. SUR LA QUALIFICATION JURIDIQUE RETENUE
L'accusation retient le chef de [infraction visée, code]. La défense conteste cette qualification pour les motifs suivants :
• [Élément constitutif manquant]
• [Absence d'intention caractérisée]
• [Circonstance excluant la qualification retenue]

III. SUR LA REQUALIFICATION SOLLICITÉE
En conséquence, la défense sollicite la requalification des faits en [infraction de moindre gravité, code], dont les éléments constitutifs sont seuls réunis en l'espèce.

IV. SUR LA PEINE
À titre subsidiaire, et si le Tribunal ne retenait pas la requalification sollicitée, la défense demande que soient prises en compte les circonstances atténuantes suivantes : [liste].

PAR CES MOTIFS,
Il est demandé au Tribunal de :
• Requalifier les faits reprochés en [infraction]
• Statuer en conséquence sur la peine applicable

Maître [Nom] — Cabinet BullHead`,
  },
  {
    titre: "Plaidoirie — Légitime défense",
    type: "Plaidoirie",
    contenu: `Mesdames et Messieurs,

Mon client ne nie pas les faits matériels qui lui sont reprochés. Mais nier la légitime défense reviendrait à nier le droit fondamental de toute personne à protéger sa vie et son intégrité physique.

I. LE CONTEXTE DE L'AGRESSION
[Description de la situation : qui a initié l'altercation, nature de la menace subie par le client]

II. LES CONDITIONS DE LA LÉGITIME DÉFENSE
La légitime défense suppose :
1. Une atteinte injustifiée envers la personne — [démontré par...]
2. Une riposte immédiate et nécessaire — [le client n'avait pas d'autre choix car...]
3. Une proportionnalité entre l'attaque et la défense — [la riposte était proportionnée car...]

III. L'ABSENCE D'ALTERNATIVE
Mon client ne disposait d'aucune autre option pour préserver son intégrité physique. [Fuite impossible / absence de tiers pour intervenir / urgence de la situation]

En conséquence, je vous demande de reconnaître que mon client a agi en état de légitime défense, et de prononcer son acquittement.

Nul ne saurait être condamné pour avoir simplement voulu survivre.

Maître [Nom] — Cabinet BullHead`,
  },
  {
    titre: "Requête en divorce",
    type: "Requête",
    contenu: `REQUÊTE EN DIVORCE

Demandeur : [Nom du client]
Défendeur : [Nom du conjoint]
Représenté par : Maître [Nom], Cabinet BullHead

À l'attention du Tribunal Civil de Los Santos,

Par la présente requête, [Nom du client] sollicite le prononcé du divorce d'avec [Nom du conjoint], mariés le [date].

I. MOTIF DE LA DEMANDE
☐ Consentement mutuel
☐ Rupture du lien conjugal
☐ Faute (préciser : [motif])

II. SITUATION PATRIMONIALE
[Répartition des biens communs souhaitée, le cas échéant]

III. SITUATION DES ENFANTS (le cas échéant)
[Garde, droit de visite, pension le cas échéant]

IV. DEMANDES ANNEXES
[Reprise du nom de naissance / autres demandes]

Le demandeur sollicite que le Tribunal prononce le divorce et statue sur l'ensemble des conséquences qui en découlent.

Maître [Nom]
Cabinet BullHead`,
  },
  {
    titre: "Requête en adoption",
    type: "Requête",
    contenu: `REQUÊTE EN ADOPTION

Demandeur(s) : [Nom(s) du/des adoptant(s)]
Concernant : [Nom de la personne à adopter]
Représenté par : Maître [Nom], Cabinet BullHead

À l'attention du Tribunal Civil de Los Santos,

[Nom du/des demandeur(s)] sollicite(nt) l'adoption de [Nom de l'adopté], dans les conditions suivantes :

I. SITUATION DU DEMANDEUR
[Stabilité financière, logement adapté, capacité à accueillir]

II. SITUATION DE LA PERSONNE À ADOPTER
[Âge, situation actuelle, consentement le cas échéant]

III. MOTIFS DE LA DEMANDE
[Lien affectif préexistant / volonté de fonder une famille / autre motif légitime]

IV. CONSENTEMENTS RECUEILLIS
☐ Consentement de l'adopté (si majeur ou âge requis)
☐ Consentement du représentant légal actuel (le cas échéant)

Le demandeur sollicite que le Tribunal fasse droit à la présente requête et prononce l'adoption sollicitée.

Maître [Nom]
Cabinet BullHead`,
  },
  {
    titre: "Lettre au client — Compte rendu d'audience",
    type: "Lettre au client",
    contenu: `Cabinet BullHead
Los Santos

[Date]

Cher/Chère [Nom du client],

Je fais suite à l'audience qui s'est tenue le [date] devant le Tribunal de Los Santos concernant votre dossier [référence].

RÉSUMÉ DE L'AUDIENCE
[Déroulement synthétique : ce qui a été dit, par qui, les points clés]

DÉCISION RENDUE
[Verdict, peine, ou prochaine étape de la procédure]

PROCHAINES ÉTAPES
[Délai d'appel, démarches à effectuer, prochaine audience le cas échéant]

MES RECOMMANDATIONS
[Conseils pratiques pour la suite]

Je reste à votre entière disposition pour toute question concernant ce courrier ou la suite de votre dossier. N'hésitez pas à me contacter.

Cordialement,

Maître [Nom]
Cabinet BullHead — Law · Finance · Property`,
  },
  {
    titre: "Conclusions — Vice de procédure (entrave / fouille illégale)",
    type: "Conclusions",
    contenu: `CONCLUSIONS EN NULLITÉ — VICE DE PROCÉDURE

Pour : [Nom du client]
Représenté par : Maître [Nom], Cabinet BullHead

PLAISE AU TRIBUNAL,

I. RAPPEL DE LA PROCÉDURE D'ARRESTATION
Le [date], mon client a fait l'objet d'un contrôle puis d'une fouille par les agents [matricules].

II. SUR L'ILLÉGALITÉ DE LA FOUILLE
La fouille pratiquée ne remplissait aucune des conditions légalement requises, à savoir :
☐ Absence de délit mineur constaté préalablement
☐ Absence de mandat
☐ Absence d'accord du conducteur/possesseur
☐ Absence de circonstance d'urgence ou de danger immédiat

III. CONSÉQUENCES JURIDIQUES
Conformément aux principes de loyauté de la preuve, tout élément obtenu en violation des conditions légales de fouille doit être écarté de la procédure.

IV. DEMANDE
En conséquence, la défense sollicite :
1. L'annulation du procès-verbal de fouille du [date]
2. L'écartement de l'ensemble des éléments de preuve qui en découlent
3. Le non-lieu ou l'acquittement, à défaut d'éléments de preuve recevables

PAR CES MOTIFS,
Il est demandé au Tribunal de faire droit à la présente requête en nullité.

Maître [Nom] — Cabinet BullHead`,
  },
  {
    titre: "Plaidoirie — Crime grave (meurtre / homicide)",
    type: "Plaidoirie",
    contenu: `Mesdames et Messieurs les membres de cette cour,

L'accusation porte aujourd'hui contre mon client une charge de la plus grande gravité. C'est précisément pour cette raison que la rigueur de l'examen des preuves doit être absolue, et que le doute, s'il existe, doit nécessairement profiter à l'accusé.

I. SUR L'ÉLÉMENT INTENTIONNEL
L'accusation doit démontrer, au-delà de tout doute raisonnable, l'intention de mon client de causer la mort. [Contester la préméditation / l'intention / la qualification retenue]

II. SUR LES CIRCONSTANCES DE L'ACTE
[Contexte : provocation, état de stress, absence de préméditation, légitime défense partielle]

III. SUR LA CHAÎNE DE PREUVES
[Contester la fiabilité des témoignages, la continuité des preuves matérielles, les éventuels vices de procédure dans leur collecte]

IV. SUR LA REQUALIFICATION POSSIBLE
À titre subsidiaire, la défense fait valoir que les faits, s'ils sont établis, relèveraient davantage de [homicide involontaire / meurtre non prémédité] que du chef retenu par l'accusation.

En conclusion, je vous demande de mesurer la gravité de la sanction à l'aune de la solidité réelle des preuves apportées, et non à l'émotion légitime que suscitent de tels faits.

Maître [Nom] — Cabinet BullHead`,
  },
  {
    titre: "Conclusions — Contestation d'un chef de blanchiment",
    type: "Conclusions",
    contenu: `CONCLUSIONS EN DÉFENSE — BLANCHIMENT

Pour : [Nom du client]
Représenté par : Maître [Nom], Cabinet BullHead

PLAISE AU TRIBUNAL,

I. RAPPEL DES FAITS
L'accusation reproche à mon client d'avoir dissimulé l'origine de fonds afin qu'ils soient perçus comme légaux, pour un montant de [montant].

II. SUR L'ABSENCE D'ÉLÉMENT INTENTIONNEL
Le blanchiment suppose la connaissance de l'origine illicite des fonds. La défense soutient que :
• Mon client ignorait l'origine réelle des sommes en cause
• [Aucune dissimulation active n'a été opérée]
• [Les fonds proviennent d'une activité légale démontrable : pièces jointes]

III. SUR LA TRAÇABILITÉ DES FONDS
[Contester la méthode de calcul du montant retenu / produire des justificatifs de provenance légale pour partie ou totalité des sommes]

IV. SUR LA PROPORTIONNALITÉ DE LA SANCTION
À titre subsidiaire, la défense demande que soit prise en compte l'absence d'antécédents et la coopération de mon client dans la présente procédure.

PAR CES MOTIFS,
Il est demandé au Tribunal de prononcer la relaxe, ou à tout le moins une sanction proportionnée aux éléments objectivement établis.

Maître [Nom] — Cabinet BullHead`,
  },
  {
    titre: "Acte d'appel",
    type: "Requête",
    contenu: `ACTE D'APPEL

Appelant : [Nom du client]
Représenté par : Maître [Nom], Cabinet BullHead
Décision attaquée : Jugement du [date] — Tribunal de Los Santos

À l'attention de la Cour d'Appel,

[Nom du client], par l'intermédiaire de son conseil, interjette appel du jugement rendu le [date] le condamnant à [peine prononcée].

I. MOTIFS DE L'APPEL
☐ Erreur de qualification juridique des faits
☐ Vice de procédure non sanctionné en première instance
☐ Peine manifestement disproportionnée
☐ Éléments de preuve nouveaux ou mal appréciés

II. EXPOSÉ DES MOYENS
[Développer chaque moyen retenu ci-dessus avec les arguments correspondants]

III. DEMANDES
L'appelant demande à la Cour de :
1. [Infirmer le jugement et prononcer la relaxe]
2. [À titre subsidiaire, réformer la peine prononcée]
3. [Toute autre mesure que la Cour jugera appropriée]

Le présent acte est déposé dans le délai légal d'appel suivant le prononcé du jugement.

Maître [Nom]
Cabinet BullHead`,
  },
  {
    titre: "Contrat type — Prestation de services entre particuliers",
    type: "Autre",
    contenu: `CONTRAT DE PRESTATION DE SERVICES

Entre les soussignés :
[Nom du Prestataire], ci-après désigné "le Prestataire"
ET
[Nom du Client], ci-après désigné "le Client"

Il est convenu ce qui suit :

ARTICLE 1 — OBJET
Le Prestataire s'engage à réaliser pour le Client la prestation suivante : [description précise de la prestation].

ARTICLE 2 — DURÉE
La présente prestation débute le [date] et se termine le [date], ou à l'achèvement de la mission décrite à l'article 1.

ARTICLE 3 — RÉMUNÉRATION
Le Client s'engage à verser au Prestataire la somme de [montant] selon les modalités suivantes : [paiement intégral à la signature / acompte de X% puis solde à la livraison].

ARTICLE 4 — OBLIGATIONS DES PARTIES
Le Prestataire s'engage à exécuter la prestation avec diligence et selon les règles de l'art.
Le Client s'engage à fournir les informations et moyens nécessaires à la bonne exécution de la prestation.

ARTICLE 5 — RÉSILIATION
En cas de manquement grave de l'une des parties à ses obligations, l'autre partie pourra résilier le présent contrat après mise en demeure restée infructueuse pendant [délai].

ARTICLE 6 — LITIGES
Tout litige relatif à l'exécution du présent contrat sera soumis aux juridictions compétentes de Los Santos.

Fait à Los Santos, le [date], en deux exemplaires originaux.

Signature du Prestataire                    Signature du Client

Document rédigé par Maître [Nom] — Cabinet BullHead`,
  },
  {
    titre: "Préparation de témoignage — Trame d'audition",
    type: "Autre",
    contenu: `TRAME DE PRÉPARATION — AUDITION DE TÉMOIN

Dossier : [Référence du dossier]
Témoin : [Nom du témoin]
Qualité : [Témoin direct / témoin de moralité / expert]

I. RAPPEL DES RÈGLES
• Le témoin doit répondre avec exactitude, sans extrapoler au-delà de ce qu'il a personnellement constaté
• Toute fausse déclaration sous serment expose à des poursuites pour parjure
• Le témoin peut indiquer ne pas se souvenir plutôt que d'inventer une réponse

II. POINTS CLÉS À ABORDER
1. [Présentation : lien avec le client / les faits]
2. [Récit chronologique des faits observés]
3. [Précisions sur les circonstances : lieu, heure, conditions de visibilité]
4. [Confirmation ou infirmation d'éléments contestés par l'accusation]

III. QUESTIONS ANTICIPÉES DE LA PARTIE ADVERSE
• [Question probable 1] → Réponse à privilégier : [axe de réponse]
• [Question probable 2] → Réponse à privilégier : [axe de réponse]

IV. POINTS DE VIGILANCE
[Éléments sur lesquels le témoin doit rester prudent ou factuel, sans dépasser ce qu'il sait réellement]

Préparé par Maître [Nom] — Cabinet BullHead`,
  },
];

export default function ModelesPage() {
  const user = getUser();
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Modele|null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titre:"", type:"Plaidoirie", contenu:"" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase || !user) { setLoading(false); return; }
    const { data } = await supabase.from("modeles").select("*")
      .eq("created_by", user.nom).order("created_at", { ascending: false });
    setModeles(data || []);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !user || !form.titre.trim()) return;
    setSaving(true);
    if (editMode && selected) {
      await supabase.from("modeles").update(form).eq("id", selected.id);
      setModeles(m => m.map(x => x.id===selected.id ? {...x,...form} : x));
      setSelected(prev => prev ? {...prev,...form} : null);
    } else {
      const { data } = await supabase.from("modeles").insert([{...form, created_by:user.nom}]).select().single();
      if (data) { setModeles(m => [data,...m]); setSelected(data); }
    }
    setSaving(false);
    setShowForm(false);
    setEditMode(false);
    showT("Modèle sauvegardé");
  }

  async function saveDefault(t: typeof TEMPLATES_DEFAUT[0]) {
    if (!supabase || !user) return;
    const { data } = await supabase.from("modeles").insert([{...t, created_by:user.nom}]).select().single();
    if (data) { setModeles(m => [data,...m]); setSelected(data); }
    showT("Template importé");
  }

  async function deleteModele(id:string) {
    if (!supabase) return;
    await supabase.from("modeles").delete().eq("id", id);
    setModeles(m => m.filter(x=>x.id!==id));
    if (selected?.id===id) setSelected(null);
    showT("Modèle supprimé");
  }

  function copyContent() {
    if (!selected) return;
    navigator.clipboard.writeText(selected.contenu);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function showT(msg:string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = modeles.filter(m =>
    (!search || m.titre.toLowerCase().includes(search.toLowerCase()) || m.contenu.toLowerCase().includes(search.toLowerCase())) &&
    (!filterType || m.type === filterType)
  );

  const TYPE_COLORS: Record<string,string> = {
    "Plaidoirie":"var(--gold)", "Conclusions":"var(--info)", "Demande de nullité":"var(--danger)",
    "Requête":"#a855f7", "Lettre au client":"var(--success)", "Autre":"var(--text-dim)",
  };

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Modèles de plaidoirie</h1>
          <p className="page-subtitle">Bibliothèque de templates juridiques</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={() => { setForm({titre:"",type:"Plaidoirie",contenu:""}); setEditMode(false); setShowForm(true); }}>
          + Nouveau modèle
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:"1.5rem" }}>

        {/* ─── LISTE ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>

          {/* Templates par défaut si aucun modèle */}
          {modeles.length === 0 && !loading && (
            <div className="card" style={{ borderColor:"rgba(201,168,76,0.2)" }}>
              <div className="section-title" style={{ marginBottom:"0.75rem" }}>Templates de démarrage</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                {TEMPLATES_DEFAUT.map((t,i) => (
                  <button key={i} onClick={() => saveDefault(t)} style={{
                    textAlign:"left", padding:"0.6rem 0.75rem", borderRadius:"var(--radius)",
                    background:"var(--surface)", border:"1px solid var(--border)",
                    cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"border-color 0.1s",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                    <div style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text)", marginBottom:"0.15rem" }}>{t.titre}</div>
                    <div style={{ fontSize:"0.7rem", color:TYPE_COLORS[t.type]||"var(--text-dim)" }}>{t.type}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtres */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            <input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} />
            <select value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="">Tous les types</option>
              {TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Liste modèles */}
          {loading ? (
            <div style={{ color:"var(--text-dim)", fontSize:"0.8rem" }}>Chargement…</div>
          ) : filtered.length === 0 && modeles.length > 0 ? (
            <div style={{ color:"var(--text-dim)", fontSize:"0.8rem", textAlign:"center", padding:"1rem" }}>Aucun résultat</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
              {filtered.map(m => (
                <div key={m.id} onClick={() => setSelected(m)} style={{
                  padding:"0.75rem",
                  borderRadius:"var(--radius)",
                  background: selected?.id===m.id ? "var(--gold-muted)" : "var(--card)",
                  border:`1px solid ${selected?.id===m.id ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
                  cursor:"pointer", transition:"all 0.12s",
                  borderLeft:`3px solid ${TYPE_COLORS[m.type]||"var(--border)"}`,
                }}>
                  <div style={{ fontWeight:600, fontSize:"0.825rem", marginBottom:"0.2rem",
                    color:selected?.id===m.id?"var(--gold)":"var(--text)",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.titre}</div>
                  <div style={{ fontSize:"0.7rem", color:TYPE_COLORS[m.type]||"var(--text-dim)" }}>{m.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── APERÇU ─── */}
        <div>
          {!selected ? (
            <div className="card" style={{ textAlign:"center", padding:"4rem 2rem" }}>
              <div style={{ fontSize:"2rem", marginBottom:"1rem", opacity:0.3 }}>📄</div>
              <div style={{ color:"var(--text-dim)", fontSize:"0.875rem" }}>
                Sélectionnez un modèle pour le consulter
              </div>
            </div>
          ) : (
            <div className="card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1rem" }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", fontWeight:700, marginBottom:"0.25rem" }}>
                    {selected.titre}
                  </div>
                  <span style={{ fontSize:"0.72rem", padding:"0.15rem 0.5rem", borderRadius:999,
                    background:(TYPE_COLORS[selected.type]||"var(--text-dim)")+"18",
                    color:TYPE_COLORS[selected.type]||"var(--text-dim)",
                    border:`1px solid ${(TYPE_COLORS[selected.type]||"var(--text-dim)")}30` }}>
                    {selected.type}
                  </span>
                </div>
                <div style={{ display:"flex", gap:"0.4rem", flexShrink:0 }}>
                  <button className="btn btn-outline btn-sm" onClick={copyContent}>
                    {copied ? "✅ Copié !" : "📋 Copier"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setForm({titre:selected.titre,type:selected.type,contenu:selected.contenu}); setEditMode(true); setShowForm(true); }}>
                    ✏️
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteModele(selected.id)}>🗑️</button>
                </div>
              </div>

              <div style={{ height:1, background:"var(--border)", marginBottom:"1rem" }} />

              <pre style={{
                whiteSpace:"pre-wrap", wordBreak:"break-word",
                fontFamily:"'Inter',sans-serif", fontSize:"0.825rem",
                color:"var(--text-muted)", lineHeight:1.75,
                background:"var(--surface)", borderRadius:"var(--radius)",
                padding:"1.25rem", maxHeight:"60vh", overflowY:"auto",
              }}>{selected.contenu}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{editMode?"Modifier le modèle":"Nouveau modèle"}</h2>
              <button className="modal-close" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Titre *</label>
                  <input placeholder="Ex : Plaidoirie de défense" value={form.titre} onChange={e=>setForm(f=>({...f,titre:e.target.value}))} autoFocus />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Contenu</label>
                <textarea rows={16} value={form.contenu}
                  onChange={e=>setForm(f=>({...f,contenu:e.target.value}))}
                  placeholder="Rédigez votre modèle… Utilisez [crochets] pour les zones à remplir."
                  style={{ fontFamily:"'Inter',sans-serif", lineHeight:1.7 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving||!form.titre.trim()} style={{opacity:saving?0.7:1}}>
                {saving?"Sauvegarde…":"Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className="toast toast-success">✅ {toast}</div>
        </div>
      )}
    </div>
  );
}
