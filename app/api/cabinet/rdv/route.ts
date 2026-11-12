import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { canRead, canWrite, nomAffiche, notifyDiscord } from "@/lib/cabinetServer";
import { estDirection, nomStaff } from "@/lib/cabinetAcces";

// Workflow d'un RDV :
// demande -> (employés demandent la prise en charge) -> attribue (client choisit, ou direction attribue)
// -> confirme (l'avocat valide) -> termine. Annulé possible à tout moment par le client, l'avocat ou la direction.
const STATUT_OCCUPE = ["attribue", "confirme"];

// Lecture : le staff voit tous les RDV (avec motif et candidatures), le client voit les siens
// et, pour le calendrier, les créneaux occupés sans aucun détail.
export async function GET() {
  try {
    const r = await requireAnyPermission(["cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const staff = canRead(user, ["cabinet_rdv"]);

    let q = db.from("cabinet_rdv").select("*, cabinet_rdv_candidats(avocat_discord_id,avocat_nom)").order("date_rdv", { ascending: true });
    if (!staff) q = q.eq("discord_id", user.discord_id);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    let occupes: { date_rdv: string; statut: string }[] = [];
    if (!staff) {
      const { data: occ } = await db.from("cabinet_rdv").select("date_rdv,statut").in("statut", ["demande", ...STATUT_OCCUPE]);
      occupes = (occ || []) as any[];
    }
    return NextResponse.json({ rows: data || [], occupes, staff });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Création : le client demande un RDV (statut demande). Un employé peut créer un RDV déjà attribué à lui-même.
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const b = await req.json();
    if (!b.date_rdv) return NextResponse.json({ error: "Date requise" }, { status: 400 });
    const staff = canWrite(user, "cabinet_rdv");

    // Créneau déjà pris ?
    const { data: deja } = await db.from("cabinet_rdv").select("id").eq("date_rdv", b.date_rdv).in("statut", STATUT_OCCUPE).limit(1);
    if (deja && deja.length) return NextResponse.json({ error: "Ce créneau est déjà pris, choisis-en un autre" }, { status: 400 });

    let discord_id: string = user.discord_id;
    let client_nom: string | null = null;
    if (staff && b.discord_id) {
      discord_id = String(b.discord_id).trim();
      client_nom = (b.client_nom || "").trim() || null;
    }
    if (!client_nom) {
      const { data } = await db.from("avocat_clients").select("nom_rp,discord_name").eq("discord_id", discord_id).maybeSingle();
      client_nom = data ? (data.nom_rp || data.discord_name) : null;
    }
    if (!client_nom) return NextResponse.json({ error: "Client introuvable : il doit d'abord créer son compte client" }, { status: 400 });

    const avocatSoi = staff && !b.discord_id;
    const { data, error } = await db.from("cabinet_rdv").insert([{
      discord_id,
      client_nom,
      motif: (b.motif || "").trim() || null,
      prestation: (b.prestation || "").trim() || null,
      date_rdv: b.date_rdv,
      statut: avocatSoi ? "attribue" : "demande",
      avocat_discord_id: avocatSoi ? user.discord_id : null,
      avocat_nom: avocatSoi ? nomAffiche(user) : null,
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const quand = new Date(b.date_rdv).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });
    await notifyDiscord(`**${avocatSoi ? "RDV ajouté" : "Nouvelle demande de RDV"}** : ${client_nom}\nDate : ${quand}${data.prestation ? `\nPrestation : ${data.prestation}` : ""}${data.motif ? `\nMotif : ${data.motif}` : ""}`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Actions sur un RDV, selon action :
// candidature (employé), choisir (client), attribuer (direction), valider (avocat), terminer, annuler
export async function PATCH(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const b = await req.json();
    if (!b.id || !b.action) return NextResponse.json({ error: "id et action requis" }, { status: 400 });

    const { data: rdv } = await db.from("cabinet_rdv").select("*").eq("id", b.id).maybeSingle();
    if (!rdv) return NextResponse.json({ error: "RDV introuvable" }, { status: 404 });

    const client = rdv.discord_id === user.discord_id;
    const direction = estDirection(user);
    const assigne = rdv.avocat_discord_id === user.discord_id;
    const employe = canWrite(user, "cabinet_rdv");
    const maj = async (patch: any) => {
      const { data, error } = await db.from("cabinet_rdv").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", b.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    };
    const interdit = () => NextResponse.json({ error: "Action non autorisée pour toi à cette étape" }, { status: 403 });
    const nom = nomAffiche(user);

    if (b.action === "candidature") {
      if (!employe || rdv.statut !== "demande") return interdit();
      await db.from("cabinet_rdv_candidats").upsert([{ rdv_id: b.id, avocat_discord_id: user.discord_id, avocat_nom: nom }], { onConflict: "rdv_id,avocat_discord_id" });
      await notifyDiscord(`**Prise en charge demandée** : ${nom} pour le RDV de ${rdv.client_nom}`);
      return NextResponse.json(rdv);
    }

    if (b.action === "choisir") {
      if (!client || rdv.statut !== "demande") return interdit();
      if (b.aucune_preference) {
        return NextResponse.json(await maj({ aucune_preference: true, avocat_discord_id: null, avocat_nom: null }));
      }
      const { data: cand } = await db.from("cabinet_rdv_candidats").select("*").eq("rdv_id", b.id).eq("avocat_discord_id", b.avocat_discord_id).maybeSingle();
      if (!cand) return NextResponse.json({ error: "Cet employé n'a pas demandé ce RDV" }, { status: 400 });
      const row = await maj({ avocat_discord_id: cand.avocat_discord_id, avocat_nom: cand.avocat_nom, aucune_preference: false, statut: "attribue" });
      await notifyDiscord(`**RDV attribué** : ${rdv.client_nom} avec ${cand.avocat_nom} (choix du client)`);
      return NextResponse.json(row);
    }

    if (b.action === "attribuer") {
      if (!direction || !["demande", "attribue"].includes(rdv.statut)) return interdit();
      if (!b.avocat_discord_id) return NextResponse.json({ error: "Avocat requis" }, { status: 400 });
      const nomAvocat = (await nomStaff(db, b.avocat_discord_id)) || b.avocat_nom || b.avocat_discord_id;
      const row = await maj({ avocat_discord_id: b.avocat_discord_id, avocat_nom: nomAvocat, statut: "attribue" });
      await notifyDiscord(`**RDV attribué** : ${rdv.client_nom} avec ${nomAvocat} (par ${nom})`);
      return NextResponse.json(row);
    }

    if (b.action === "valider") {
      if (!(assigne || direction) || rdv.statut !== "attribue") return interdit();
      const row = await maj({ statut: "confirme" });
      await notifyDiscord(`**RDV confirmé** : ${rdv.client_nom} avec ${rdv.avocat_nom || nom}`);
      return NextResponse.json(row);
    }

    if (b.action === "terminer") {
      if (!(assigne || direction) || rdv.statut !== "confirme") return interdit();
      return NextResponse.json(await maj({ statut: "termine" }));
    }

    if (b.action === "annuler") {
      if (!(client || assigne || direction) || rdv.statut === "termine" || rdv.statut === "annule") return interdit();
      const row = await maj({ statut: "annule" });
      await notifyDiscord(`**RDV annulé** : ${rdv.client_nom} (par ${nom})`);
      return NextResponse.json(row);
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
