import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estStaff } from "@/lib/cabinetAcces";

// Recherche globale : clients, dossiers et factures (employés uniquement)
export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const q = (new URL(req.url).searchParams.get("q") || "").replace(/[,()%*]/g, "").trim();
    if (q.length < 2) return NextResponse.json({ clients: [], dossiers: [], factures: [], devis: [] });
    const db = r.supabaseAdmin;
    const [clients, dossiers, factures, devis] = await Promise.all([
      db.from("avocat_clients").select("discord_id,discord_name,nom_rp,id_perso")
        .or(`discord_name.ilike.%${q}%,nom_rp.ilike.%${q}%,id_perso.ilike.%${q}%,discord_id.eq.${q}`).limit(10),
      db.from("cabinet_dossiers").select("id,titre,statut,client_nom").or(`titre.ilike.%${q}%,client_nom.ilike.%${q}%`).limit(10),
      db.from("cabinet_factures").select("id,numero,montant,statut,client_nom").or(`numero.ilike.%${q}%,client_nom.ilike.%${q}%`).limit(10),
      db.from("cabinet_devis").select("id,numero,montant,statut,client_nom").or(`numero.ilike.%${q}%,client_nom.ilike.%${q}%`).limit(10),
    ]);
    return NextResponse.json({ clients: clients.data || [], dossiers: dossiers.data || [], factures: factures.data || [], devis: devis.data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
