import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { canWrite, nomAffiche, notifyDiscord } from "@/lib/cabinetServer";
import { accesDossier, estDirection, estSecretaire, estStaff } from "@/lib/cabinetAcces";

const STATUTS = ["ouvert", "ferme", "archive"];

// Liste des dossiers : le client voit les siens, la direction et la secrétaire voient tout, l'avocat voit ceux qui lui sont attribués
export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const id = new URL(req.url).searchParams.get("id");

    let q = db.from("cabinet_dossiers")
      .select("*, cabinet_dossier_types(nom), cabinet_dossier_acces(avocat_discord_id,avocat_nom)")
      .order("created_at", { ascending: false });
    if (id) q = q.eq("id", id);

    if (!estStaff(user)) {
      q = q.eq("client_discord_id", user.discord_id);
    } else if (!estDirection(user) && !estSecretaire(user)) {
      const { data: acces } = await db.from("cabinet_dossier_acces").select("dossier_id").eq("avocat_discord_id", user.discord_id);
      const ids = (acces || []).map((a: any) => a.dossier_id);
      if (ids.length === 0) return NextResponse.json({ rows: [] });
      q = q.in("id", ids);
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Ouverture d'un dossier : un client l'ouvre pour lui-même, un employé pour un client (il en devient l'avocat)
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const b = await req.json();
    const titre = (b.titre || "").trim();
    if (!titre) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
    const staff = estStaff(user);

    const clientId = staff ? String(b.client_discord_id || "").trim() : user.discord_id;
    if (!clientId) return NextResponse.json({ error: "Client requis" }, { status: 400 });
    const { data: client } = await db.from("avocat_clients").select("nom_rp,discord_name").eq("discord_id", clientId).maybeSingle();
    if (!client) return NextResponse.json({ error: "Ce client n'a pas encore de compte (ID Discord ou pseudo introuvable)" }, { status: 400 });
    const client_nom = client.nom_rp || client.discord_name;

    const { data: type } = b.type_id
      ? await db.from("cabinet_dossier_types").select("nom,template").eq("id", b.type_id).maybeSingle()
      : { data: null };

    const { data: dossier, error } = await db.from("cabinet_dossiers").insert([{
      titre,
      type_id: b.type_id || null,
      prestation: (b.prestation || "").trim() || null,
      client_discord_id: clientId,
      client_nom,
      statut: "ouvert",
      created_by: nomAffiche(user),
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // L'employé qui ouvre le dossier pour un client y a automatiquement accès
    if (staff) {
      await db.from("cabinet_dossier_acces").insert([{
        dossier_id: dossier.id, avocat_discord_id: user.discord_id, avocat_nom: nomAffiche(user), attribue_par: nomAffiche(user),
      }]);
    }

    // Le modèle du type de dossier devient le premier message du dossier
    if (type?.template) {
      await db.from("cabinet_messages").insert([{
        dossier_id: dossier.id, auteur_nom: "Cabinet Varelli & Associés", est_staff: true, contenu: type.template,
      }]);
    }

    await notifyDiscord(`**Nouveau dossier** : ${titre}${type ? ` (${type.nom})` : ""}${dossier.prestation ? `\nPrestation : ${dossier.prestation}` : ""}\nClient : ${client_nom}\nOuvert par : ${nomAffiche(user)}`);
    return NextResponse.json(dossier);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Ouvrir, fermer, archiver ou renommer un dossier : réservé aux avocats du dossier et à la direction
export async function PATCH(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized || !canWrite(r.user, "cabinet_dossiers")) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const b = await req.json();
    if (!b.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const acces = await accesDossier(r.supabaseAdmin, user, b.id);
    if (!acces.peutGerer) return NextResponse.json({ error: "Dossier non attribué à ton nom" }, { status: 403 });

    const patch: any = { updated_at: new Date().toISOString() };
    if (b.statut) {
      if (!STATUTS.includes(b.statut)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
      patch.statut = b.statut;
    }
    if (b.titre) patch.titre = String(b.titre).trim();
    const { data, error } = await r.supabaseAdmin.from("cabinet_dossiers").update(patch).eq("id", b.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (b.statut) await notifyDiscord(`**Dossier** ${data.titre} : statut ${b.statut} (par ${nomAffiche(user)})`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

