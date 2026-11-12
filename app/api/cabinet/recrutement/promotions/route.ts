import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estDirection } from "@/lib/cabinetAcces";
import { nomAffiche } from "@/lib/cabinetServer";
import { journaliser } from "@/lib/journal";
import { appliquerRole, roleAccesValide } from "@/lib/cabinetRecrutement";

// Promotions : changer le poste d'un membre et, si le poste le prévoit, son rôle d'accès
export async function GET() {
  try {
    const r = await requireAnyPermission([]);
    if (!r.user) return NextResponse.json({ error: "Connecte-toi" }, { status: 401 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_promotions").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers", "cabinet_rdv", "cabinet_attribution"]);
    if (!r.authorized || !estDirection(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const db = r.supabaseAdmin;
    const b = await req.json();
    const { data: membre } = await db.from("cabinet_membres").select("*").eq("id", b.membre_id).maybeSingle();
    if (!membre) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    const { data: poste } = await db.from("cabinet_postes").select("*").eq("id", b.poste_id).maybeSingle();
    if (!poste) return NextResponse.json({ error: "Poste introuvable" }, { status: 404 });

    // Rôle d'accès : celui choisi, sinon celui prévu par le poste
    const role = b.role ? String(b.role) : poste.role_acces;
    const changeRole = !!role && roleAccesValide(role);
    let ancienRole: string | null = null;
    if (changeRole) {
      if (!membre.discord_id) return NextResponse.json({ error: "Ce membre n'est pas lié à un compte Discord : seul le poste peut changer" }, { status: 400 });
      const { data: compte } = await db.from("site_logins").select("site_role").eq("discord_id", membre.discord_id).maybeSingle();
      ancienRole = compte?.site_role || null;
      await appliquerRole(db, membre.discord_id, role);
    }

    await db.from("cabinet_membres").update({ poste: poste.nom, poste_id: poste.id }).eq("id", membre.id);
    const { data, error } = await db.from("cabinet_promotions").insert([{
      membre_id: membre.id, nom_rp: membre.nom_rp, ancien_poste: membre.poste || null, nouveau_poste: poste.nom,
      ancien_role: ancienRole, nouveau_role: changeRole ? role : null,
      motif: String(b.motif || "").trim().slice(0, 500) || null, auteur_nom: nomAffiche(r.user),
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await journaliser(db, nomAffiche(r.user), "Promotion", membre.nom_rp, `${membre.poste || "-"} → ${poste.nom}${changeRole ? ` (accès : ${role})` : ""}`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
