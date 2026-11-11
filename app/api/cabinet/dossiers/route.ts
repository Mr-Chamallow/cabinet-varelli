import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { canRead, canWrite, nomAffiche, notifyDiscord } from "@/lib/cabinetServer";

const STATUTS = ["ouvert", "ferme", "archive"];

// Liste des dossiers : le staff (cabinet_dossiers) voit tout, le client seulement les siens
export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const id = new URL(req.url).searchParams.get("id");
    let q = r.supabaseAdmin.from("cabinet_dossiers").select("*, cabinet_dossier_types(nom)").order("created_at", { ascending: false });
    if (id) q = q.eq("id", id);
    if (!canRead(user, ["cabinet_dossiers"])) q = q.eq("client_discord_id", user.discord_id);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Ouverture d'un dossier : un client l'ouvre pour lui-même, le staff pour n'importe quel client
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const b = await req.json();
    const titre = (b.titre || "").trim();
    if (!titre) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
    const staff = canWrite(user, "cabinet_dossiers");

    const clientId = staff ? String(b.client_discord_id || "").trim() : user.discord_id;
    if (!clientId) return NextResponse.json({ error: "Client requis" }, { status: 400 });
    const { data: client } = await db.from("avocat_clients").select("nom_rp,discord_name").eq("discord_id", clientId).maybeSingle();
    if (!client) return NextResponse.json({ error: "Ce client n'a pas encore de compte (ID Discord ou pseudo introuvable)" }, { status: 400 });
    const client_nom = client.nom_rp || client.discord_name;

    const { data: type } = b.type_id
      ? await db.from("cabinet_dossier_types").select("nom,template").eq("id", b.type_id).maybeSingle()
      : { data: null };

    const { data: dossier, error } = await db.from("cabinet_dossiers").insert([{
      titre, type_id: b.type_id || null, client_discord_id: clientId, client_nom,
      statut: "ouvert", created_by: nomAffiche(user),
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Le modèle du type de dossier devient le premier message du dossier
    if (type?.template) {
      await db.from("cabinet_messages").insert([{
        dossier_id: dossier.id, auteur_nom: "Cabinet Varelli & Associés", est_staff: true, contenu: type.template,
      }]);
    }

    await notifyDiscord(`Nouveau dossier : **${titre}**${type ? ` (${type.nom})` : ""}\nClient : ${client_nom}\nOuvert par : ${nomAffiche(user)}`);
    return NextResponse.json(dossier);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Ouvrir / fermer / archiver un dossier : réservé au staff (cabinet_dossiers en écriture)
export async function PATCH(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized || !canWrite(r.user, "cabinet_dossiers")) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const b = await req.json();
    if (!b.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const patch: any = { updated_at: new Date().toISOString() };
    if (b.statut) {
      if (!STATUTS.includes(b.statut)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
      patch.statut = b.statut;
    }
    if (b.titre) patch.titre = String(b.titre).trim();
    const { data, error } = await r.supabaseAdmin.from("cabinet_dossiers").update(patch).eq("id", b.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (b.statut) await notifyDiscord(`Dossier **${data.titre}** → ${b.statut} (par ${nomAffiche(r.user)})`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
