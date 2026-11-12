import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { CABINET_STAFF_ROLES, estDirection, estStaff, topicPour } from "@/lib/cabinetAcces";

// Pastilles : plaintes nouvelles (direction), votes à traiter (employés), messages du cabinet non lus (client)
export async function GET() {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const topics = { plaintes: topicPour("liste:plaintes"), votes: topicPour("liste:votes") };

    if (!estStaff(user)) {
      // Client : messages du cabinet depuis la dernière visite de Mon espace
      const { data: vu } = await db.from("cabinet_vus").select("vu_at").eq("discord_id", user.discord_id).eq("section", "messages-client").maybeSingle();
      const depuis = vu?.vu_at || "1970-01-01T00:00:00Z";
      const { data: dossiers } = await db.from("cabinet_dossiers").select("id").eq("client_discord_id", user.discord_id);
      const { data: co } = await db.from("cabinet_dossier_clients").select("dossier_id").eq("client_discord_id", user.discord_id);
      const ids = [...new Set([...(dossiers || []).map((d: any) => d.id), ...(co || []).map((x: any) => x.dossier_id)])];
      let messages = 0;
      if (ids.length) {
        const { count } = await db.from("cabinet_messages").select("id", { count: "exact", head: true })
          .in("dossier_id", ids).eq("est_staff", true).gt("created_at", depuis);
        messages = count || 0;
      }
      return NextResponse.json({ plaintes: 0, votes: 0, messages, topics });
    }

    let plaintes = 0;
    if (estDirection(user)) {
      const { data: vu } = await db.from("cabinet_vus").select("vu_at").eq("discord_id", user.discord_id).eq("section", "plaintes").maybeSingle();
      const depuis = vu?.vu_at || "1970-01-01T00:00:00Z";
      const { count } = await db.from("cabinet_plaintes").select("id", { count: "exact", head: true })
        .eq("statut", "ouvert").gt("created_at", depuis).neq("auteur_discord_id", user.discord_id);
      plaintes = count || 0;
    }

    const { data: votes } = await db.from("cabinet_votes").select("id, cabinet_votes_reponses(voter_discord_id)").eq("statut", "ouvert");
    const aVoter = (votes || []).filter((v: any) => !(v.cabinet_votes_reponses || []).some((x: any) => x.voter_discord_id === user.discord_id)).length;

    // Non-lus de la messagerie : salons et bureaux (un canal sans visite antérieure compte 0 jusqu'à la première ouverture)
    const { data: staffRows } = await db.from("site_logins").select("discord_id").in("site_role", CABINET_STAFF_ROLES);
    const canaux: Record<string, string> = { "salon-general": "salon:general", "salon-juridique": "salon:juridique" };
    for (const s of staffRows || []) if (s.discord_id) canaux[`bureau-${s.discord_id}`] = `bureau:${s.discord_id}`;
    const { data: vus } = await db.from("cabinet_vus").select("section,vu_at").eq("discord_id", user.discord_id).like("section", "canal:%");
    const vuPar: Record<string, string> = Object.fromEntries((vus || []).map((v: any) => [v.section.slice(6), v.vu_at]));
    const compteurs = await Promise.all(Object.entries(canaux).map(async ([slug, canal]) => {
      const depuis = vuPar[slug];
      if (!depuis) return [slug, 0] as const;
      const { count } = await db.from("cabinet_internes").select("id", { count: "exact", head: true })
        .eq("canal", canal).gt("created_at", depuis).neq("auteur_discord_id", user.discord_id);
      return [slug, count || 0] as const;
    }));
    const messagerie = compteurs.reduce((total, [, n]) => total + n, 0);
    return NextResponse.json({ plaintes, votes: aVoter, messages: 0, canaux: Object.fromEntries(compteurs), messagerie, topics });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Marque une section comme vue
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const b = await req.json();
    const canalOk = typeof b.section === "string" && /^canal:(salon-general|salon-juridique|bureau-[A-Za-z0-9_-]+)$/.test(b.section);
    if (!["plaintes", "messages-client"].includes(b.section) && !canalOk) return NextResponse.json({ error: "Section inconnue" }, { status: 400 });
    await r.supabaseAdmin.from("cabinet_vus").upsert([{ discord_id: user.discord_id, section: b.section, vu_at: new Date().toISOString() }], { onConflict: "discord_id,section" });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
