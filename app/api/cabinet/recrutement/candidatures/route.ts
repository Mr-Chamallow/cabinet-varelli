import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estDirection } from "@/lib/cabinetAcces";
import { nomAffiche } from "@/lib/cabinetServer";
import { journaliser } from "@/lib/journal";
import { appliquerRole, roleAccesValide } from "@/lib/cabinetRecrutement";

const STATUTS = ["recue", "entretien", "acceptee", "refusee", "retiree"];
const uuidOk = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
const erreur = (msg: string, code = 400) => NextResponse.json({ error: msg }, { status: code });

// Lecture : la direction voit tout, les autres seulement leurs propres candidatures
export async function GET() {
  try {
    const r = await requireAnyPermission([]);
    const user = r.user;
    if (!user) return erreur("Connecte-toi pour voir les candidatures", 401);
    const db = r.supabaseAdmin;
    let q = db.from("cabinet_candidatures").select("*").order("created_at", { ascending: false });
    if (!estDirection(user)) q = q.eq("discord_id", user.discord_id);
    const { data, error } = await q;
    if (error) return erreur(error.message);
    return NextResponse.json({ rows: data || [], direction: estDirection(user) });
  } catch (e: any) {
    return erreur(`Erreur serveur : ${e?.message || e}`, 500);
  }
}

// Candidature : tout visiteur connecté peut postuler
export async function POST(req: Request) {
  try {
    // Tout compte connecté peut postuler (pas de permission requise)
    const r = await requireAnyPermission([]);
    const user = r.user;
    if (!user?.discord_id) return erreur("Connecte-toi avec Discord pour postuler", 401);
    const db = r.supabaseAdmin;
    const b = await req.json();

    const nom = String(b.nom || "").trim().slice(0, 100);
    const telephone = String(b.telephone || "").trim().slice(0, 30);
    const email = String(b.email || "").trim().slice(0, 120);
    const experience = String(b.experience || "").trim().slice(0, 1500);
    const motivation = String(b.motivation || "").trim().slice(0, 1500);
    const disponibilite = String(b.disponibilite || "").trim().slice(0, 120);
    if (nom.length < 2) return erreur("Indique ton nom");
    if (!telephone && !email) return erreur("Indique un téléphone ou un email");
    if (motivation.length < 20) return erreur("Explique ta motivation (20 caractères minimum)");
    if (!uuidOk(b.poste_id)) return erreur("Choisis un poste");

    const { data: poste } = await db.from("cabinet_postes").select("id, nom").eq("id", b.poste_id).maybeSingle();
    if (!poste) return erreur("Poste introuvable");

    // Pas deux candidatures en cours pour le même poste
    const { data: deja } = await db.from("cabinet_candidatures").select("id")
      .eq("discord_id", user.discord_id).eq("poste_id", poste.id).in("statut", ["recue", "entretien"]).maybeSingle();
    if (deja) return erreur("Tu as déjà une candidature en cours pour ce poste");

    const { data, error } = await db.from("cabinet_candidatures").insert([{
      discord_id: user.discord_id, discord_name: user.discord_name || null, nom, telephone: telephone || null,
      email: email || null, poste_id: poste.id, poste_nom: poste.nom, experience: experience || null,
      motivation, disponibilite: disponibilite || null, statut: "recue",
    }]).select().single();
    if (error) return erreur(error.message);
    return NextResponse.json(data);
  } catch (e: any) {
    return erreur(`Erreur serveur : ${e?.message || e}`, 500);
  }
}

// Direction : changer le statut, noter, planifier l'entretien, décider
// Candidat : peut seulement retirer sa propre candidature
export async function PATCH(req: Request) {
  try {
    const r = await requireAnyPermission([]);
    const user = r.user;
    if (!user?.discord_id) return erreur("Non autorisé", 401);
    const db = r.supabaseAdmin;
    const b = await req.json();
    if (!uuidOk(b.id)) return erreur("Candidature invalide");

    const { data: cand } = await db.from("cabinet_candidatures").select("*").eq("id", b.id).maybeSingle();
    if (!cand) return erreur("Candidature introuvable", 404);
    const dir = estDirection(user);
    const soi = cand.discord_id === user.discord_id;
    if (!dir && !(soi && b.statut === "retiree")) return erreur("Réservé à la direction", 403);
    if (b.statut && !STATUTS.includes(b.statut)) return erreur("Statut inconnu");

    const maj: any = {};
    if (b.statut) maj.statut = b.statut;
    if (dir && "notes" in b) maj.notes = String(b.notes || "").slice(0, 2000) || null;
    if (dir && "entretien_at" in b) maj.entretien_at = b.entretien_at || null;
    if (dir && ["acceptee", "refusee"].includes(b.statut)) {
      maj.decide_par = nomAffiche(user);
      maj.decide_at = new Date().toISOString();
    }

    const { data, error } = await db.from("cabinet_candidatures").update(maj).eq("id", cand.id).select().single();
    if (error) return erreur(error.message);

    // Embauche : création du membre et application du rôle prévu par le poste
    if (dir && b.statut === "acceptee" && cand.statut !== "acceptee") {
      const { data: poste } = await db.from("cabinet_postes").select("*").eq("id", cand.poste_id).maybeSingle();
      const { data: membre, error: errM } = await db.from("cabinet_membres").insert([{
        nom_rp: cand.nom, poste: cand.poste_nom, poste_id: cand.poste_id, discord_id: cand.discord_id,
        telephone: cand.telephone, email: cand.email, ordre: 99,
      }]).select().single();
      if (errM) return erreur(`Candidature acceptée, mais membre non créé : ${errM.message}`);
      if (poste?.role_acces && roleAccesValide(poste.role_acces)) {
        await appliquerRole(db, cand.discord_id, poste.role_acces);
      }
      await journaliser(db, nomAffiche(user), "Recrutement : embauche", cand.nom, `Poste : ${cand.poste_nom}`);
      return NextResponse.json({ ...data, membre_id: membre?.id });
    }
    if (dir && b.statut) await journaliser(db, nomAffiche(user), "Recrutement : statut", cand.nom, `${cand.statut} → ${b.statut}`);
    return NextResponse.json(data);
  } catch (e: any) {
    return erreur(`Erreur serveur : ${e?.message || e}`, 500);
  }
}
