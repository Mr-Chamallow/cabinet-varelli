// Fiches (obsidian_fiches) ↔ Base de données (bdd_personnes) : recherche, pré-remplissage et synchronisation.
type Db = any;

export const splitNom = (full: string) => { const t = (full || "").trim().split(/\s+/); return t.length < 2 ? { prenom: "", nom: t[0] || "" } : { prenom: t[0], nom: t.slice(1).join(" ") }; };
export const fullNom = (p: any) => `${p.prenom || ""} ${p.nom || ""}`.trim();

export function ficheToPersonne(f: any, groupes: { id: string; nom: string }[]) {
  const { prenom, nom } = splitNom(f.nom);
  const g = groupes.find(x => x.nom === f.organisation);
  const o: any = {
    nom, prenom, telephone: f.telephone || "", age: f.age || null, origine: f.origine || "", occupation: f.occupation || "",
    organisation: g?.nom || f.organisation || "", groupe_id: g?.id ?? null, statut: f.statut || "", priorite: f.priorite || "Normale",
    tags: f.tags || [], adresses: f.adresses || "", comptes_bancaires: f.comptes_bancaires || "", relations: f.relations || "",
    notes_publiques: f.notes_publiques || "", notes_privees: f.notes_privees || "", prime: Number(f.prime) || 0, fiche_id: f.id,
  };
  if (f.photo_url) o.photo_identite = f.photo_url;
  return o;
}

export function personneToFiche(p: any) {
  return {
    nom: fullNom(p), telephone: p.telephone || "", age: p.age || 0, origine: p.origine || "", occupation: p.occupation || "",
    organisation: p.organisation || "", groupe_id: p.groupe_id ?? null, statut: p.statut || "Actif", priorite: p.priorite || "Normale",
    tags: p.tags || [], adresses: p.adresses || "", comptes_bancaires: p.comptes_bancaires || "", relations: p.relations || "",
    notes_publiques: p.notes_publiques || "", notes_privees: p.notes_privees || "", prime: Number(p.prime) || 0,
    photo_url: p.photo_identite || p.photo_police || "", personne_id: p.id,
  };
}

// Crée / met à jour le profil de la Base de données lié à une fiche. Retourne l'id du profil.
export async function syncFicheToBdd(db: Db, fiche: any, groupes: { id: string; nom: string }[], by: string): Promise<string | null> {
  if (!["personne", "inconnu"].includes(fiche.type || "personne")) return null;
  const body = ficheToPersonne(fiche, groupes);
  let pid: string | null = fiche.personne_id || null;
  if (!pid) {
    // Doublon ? (même nom + prénom) → on relie au lieu de recréer.
    const { data: dup } = await db.from("bdd_personnes").select("id").ilike("nom", body.nom).ilike("prenom", body.prenom || "").limit(1).maybeSingle();
    if (dup) pid = dup.id;
  }
  if (pid) {
    const { error } = await db.from("bdd_personnes").update({ ...body, updated_at: new Date().toISOString() }).eq("id", pid);
    if (error) return null;
  } else {
    const { data, error } = await db.from("bdd_personnes").insert([{ ...body, created_by: by }]).select("id").single();
    if (error || !data) return null;
    pid = data.id;
    await db.from("bdd_activites").insert([{ personne_id: pid, type: "creation", description: "Profil créé automatiquement depuis une fiche", created_by: by }]);
  }
  if (pid && fiche.personne_id !== pid) await db.from("obsidian_fiches").update({ personne_id: pid }).eq("id", fiche.id);
  return pid;
}

// Pousse les modifications du profil (Base de données) vers la fiche liée.
export async function syncBddToFiche(db: Db, personne: any) {
  if (!personne?.fiche_id) return;
  await db.from("obsidian_fiches").update({ ...personneToFiche(personne), updated_at: new Date().toISOString() }).eq("id", personne.fiche_id);
}

export interface Candidate { key: string; source: string; label: string; detail: string; personne?: any; vehicules: any[]; plaque?: string }

// Recherche par nom, prénom, téléphone ou plaque dans la Base de données, les véhicules, la carte enquêteur et les fiches existantes.
export async function lookupPeople(db: Db, query: string): Promise<{ candidates: Candidate[]; fiches: any[] }> {
  const q = query.trim().replace(/[%,()]/g, " ").trim();
  if (q.length < 2) return { candidates: [], fiches: [] };
  const tokens = q.split(/\s+/).filter(Boolean);
  const like = `%${tokens[0]}%`;
  const [pers, veh, pla, cpers, fiches] = await Promise.all([
    db.from("bdd_personnes").select("*").or(`nom.ilike.${like},prenom.ilike.${like},surnom.ilike.${like},telephone.ilike.${like}`).limit(25),
    db.from("bdd_vehicules").select("*").ilike("plaque", `%${q}%`).limit(10),
    db.from("carte_plaques").select("*").ilike("plaque", `%${q}%`).limit(10),
    db.from("carte_personnes").select("*").or(`nom.ilike.${like},prenom.ilike.${like}`).limit(10),
    db.from("obsidian_fiches").select("id,nom,organisation,telephone,personne_id").ilike("nom", `%${q}%`).limit(5),
  ]);
  const match = (p: any) => tokens.every(t => `${p.nom} ${p.prenom || ""} ${p.surnom || ""} ${p.telephone || ""}`.toLowerCase().includes(t.toLowerCase()));
  const out: Candidate[] = [];
  const byId: Record<string, Candidate> = {};
  const add = async (p: any, extraVeh: any[] = [], plaque?: string) => {
    if (byId[p.id]) { byId[p.id].vehicules.push(...extraVeh.filter(v => !byId[p.id].vehicules.some(x => x.id === v.id))); if (plaque) byId[p.id].plaque = plaque; return; }
    const { data: vs } = await db.from("bdd_vehicules").select("*").eq("proprietaire_id", p.id);
    const c: Candidate = { key: "p" + p.id, source: "Base de données", label: fullNom(p) + (p.surnom ? ` « ${p.surnom} »` : ""), detail: [p.telephone, p.organisation, p.priorite].filter(Boolean).join(" · "), personne: p, vehicules: vs || [], plaque };
    byId[p.id] = c; out.push(c);
  };
  for (const p of (pers.data || []).filter(match)) await add(p);
  // Plaque → véhicule → propriétaire
  for (const v of veh.data || []) {
    if (v.proprietaire_id) { const { data: p } = await db.from("bdd_personnes").select("*").eq("id", v.proprietaire_id).maybeSingle(); if (p) await add(p, [v], v.plaque); }
    else out.push({ key: "v" + v.id, source: "Véhicule", label: `Plaque ${v.plaque}`, detail: [v.marque_modele, v.couleur, "propriétaire inconnu"].filter(Boolean).join(" · "), vehicules: [v], plaque: v.plaque });
  }
  // Carte enquêteur : plaque → personne ; personnes du registre
  for (const pl of pla.data || []) {
    const { data: cp } = pl.personne_id ? await db.from("carte_personnes").select("*").eq("id", pl.personne_id).maybeSingle() : { data: null };
    out.push({ key: "pl" + pl.id, source: "Carte enquêteur", label: cp ? `${fullNom(cp)} (plaque ${pl.plaque})` : `Plaque ${pl.plaque}`, detail: pl.notes || "", personne: cp ? { nom: cp.nom, prenom: cp.prenom, notes_publiques: cp.notes || "" } : undefined, vehicules: [{ plaque: pl.plaque }], plaque: pl.plaque });
  }
  for (const cp of cpers.data || []) if (match(cp) && !out.some(c => c.key === "cp" + cp.id)) out.push({ key: "cp" + cp.id, source: "Carte enquêteur", label: fullNom(cp), detail: cp.notes || "", personne: { nom: cp.nom, prenom: cp.prenom, notes_publiques: cp.notes || "" }, vehicules: [] });
  return { candidates: out.slice(0, 12), fiches: fiches.data || [] };
}

// Valeurs du formulaire de fiche à partir d'un résultat de recherche.
export function candidateToForm(c: Candidate) {
  const p = c.personne || {}; const f = personneToFiche({ ...p, nom: p.nom || "", prenom: p.prenom || "" });
  const veh = c.vehicules.map((v: any) => [v.plaque, v.marque_modele, v.couleur].filter(Boolean).join(" ")).join("\n");
  return { ...f, nom: fullNom(p) || "", vehicules: veh, personne_id: p.id || null, type: "personne" };
}
