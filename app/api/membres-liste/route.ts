import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/serverAuth";

// Liste minimale des membres (nom, rôle) pour l'organigramme et le RDV.
// Réservée aux personnes connectées au site. Pas de date, pas de session, pas de ban.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("site_logins")
    .select("discord_id,discord_name,nom_perso,site_role");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ membres: data || [] });
}
