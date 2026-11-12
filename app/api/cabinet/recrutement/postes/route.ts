import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estDirection } from "@/lib/cabinetAcces";
import { roleAccesValide } from "@/lib/cabinetRecrutement";
import { nomAffiche } from "@/lib/cabinetServer";
import { journaliser } from "@/lib/journal";

// Postes libres : tout le monde les lit, la direction les crée / modifie / supprime
export async function GET() {
  try {
    // Lecture ouverte à tout compte connecté (rôle client par défaut inclus)
    const r = await requireAnyPermission([]);
    if (!r.user) return NextResponse.json({ error: "Connecte-toi pour voir les postes" }, { status: 401 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_postes").select("*").order("ordre", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

function propre(b: any) {
  const role = b.role_acces ? String(b.role_acces) : null;
  return {
    nom: String(b.nom || "").trim().slice(0, 80),
    description: String(b.description || "").trim().slice(0, 600) || null,
    role_acces: role && roleAccesValide(role) ? role : null,
    ordre: Number(b.ordre) || 0,
  };
}

export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers", "cabinet_rdv", "cabinet_attribution"]);
    if (!r.authorized || !estDirection(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const v = propre(await req.json());
    if (v.nom.length < 2) return NextResponse.json({ error: "Nom du poste trop court" }, { status: 400 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_postes").insert([v]).select().single();
    if (error) return NextResponse.json({ error: error.code === "23505" ? "Ce poste existe déjà" : error.message }, { status: 400 });
    await journaliser(r.supabaseAdmin, nomAffiche(r.user), "Poste créé", v.nom, v.role_acces || "sans accès particulier");
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers", "cabinet_rdv", "cabinet_attribution"]);
    if (!r.authorized || !estDirection(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const b = await req.json();
    const v = propre(b);
    const { data, error } = await r.supabaseAdmin.from("cabinet_postes").update(v).eq("id", b.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers", "cabinet_rdv", "cabinet_attribution"]);
    if (!r.authorized || !estDirection(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const id = new URL(req.url).searchParams.get("id") || "";
    const { error } = await r.supabaseAdmin.from("cabinet_postes").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
