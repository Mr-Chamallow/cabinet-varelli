import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/lib/serverAuth";

async function moi(req: Request) {
  const t: any = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!t?.discord_id) return null;
  return { discord_id: String(t.discord_id), discord_name: String(t.discord_name || "Membre") };
}

function champs(body: any) {
  return {
    nom_rp: String(body.nom_rp || "").trim(),
    tel_rp: String(body.tel_rp || "").trim(),
    id_perso: String(body.id_perso || "").trim(),
  };
}

export async function GET(req: Request) {
  const me = await moi(req);
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data } = await supabaseAdmin.from("avocat_clients").select("*").eq("discord_id", me.discord_id).maybeSingle();
  return NextResponse.json({ profil: data, discord: me });
}

export async function POST(req: Request) {
  const me = await moi(req);
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const c = champs(await req.json());
  if (!c.nom_rp || !c.tel_rp || !c.id_perso) return NextResponse.json({ error: "Remplis tous les champs" }, { status: 400 });
  const { data: existe } = await supabaseAdmin.from("avocat_clients").select("discord_id").eq("discord_id", me.discord_id).maybeSingle();
  if (existe) return NextResponse.json({ error: "Tu as déjà un compte. Modifie tes informations.", existe: true }, { status: 409 });
  const { error } = await supabaseAdmin.from("avocat_clients").insert({ ...c, discord_id: me.discord_id, discord_name: me.discord_name });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const me = await moi(req);
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const c = champs(await req.json());
  if (!c.nom_rp || !c.tel_rp || !c.id_perso) return NextResponse.json({ error: "Remplis tous les champs" }, { status: 400 });
  const { error } = await supabaseAdmin.from("avocat_clients").update({ ...c, updated_at: new Date().toISOString() }).eq("discord_id", me.discord_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}