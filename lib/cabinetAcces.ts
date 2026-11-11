import { createHmac } from "crypto";
import { hasPermission } from "@/lib/auth";
import { appUser } from "@/lib/cabinetServer";

// Rôles du cabinet (employés). Le client a le rôle "Clients Varelli & Associés".
export const CABINET_STAFF_ROLES = ["Secrétaire juridique", "Collaborateur", "Associé", "Associé Sénior", "Associé Gérant"];

// Salons internes par équipe. Le salon "direction" est réservé à ceux qui ont l'attribution.
export const SALONS = ["general", "juridique", "direction"] as const;

export const estStaff = (user: any) => hasPermission(appUser(user), "cabinet_dossiers") || hasPermission(appUser(user), "cabinet_rdv");
export const estDirection = (user: any) => hasPermission(appUser(user), "cabinet_attribution");

// Nom de canal de temps réel : impossible à deviner sans passer par l'API (signé avec un secret serveur)
export function topicPour(canal: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "cabinet";
  return "cabinet-" + createHmac("sha256", secret).update(canal).digest("hex").slice(0, 40);
}

// Envoie un message en temps réel à tous les abonnés du canal (via l'API Broadcast de Supabase)
export async function diffuser(canal: string, payload: any) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic: topicPour(canal), event: "message", payload }] }),
    });
  } catch {
    // le message est enregistré même si le temps réel échoue
  }
}

// Accès à un dossier : client propriétaire, direction, ou avocat assigné par la direction
export async function accesDossier(db: any, user: any, dossierId: string) {
  const { data: dossier } = await db.from("cabinet_dossiers").select("*").eq("id", dossierId).maybeSingle();
  if (!dossier) return { dossier: null, client: false, direction: false, assigne: false, peutVoir: false, peutGerer: false };
  const client = dossier.client_discord_id === user.discord_id;
  const direction = estDirection(user);
  let assigne = false;
  if (estStaff(user) && !direction) {
    const { data } = await db.from("cabinet_dossier_acces").select("dossier_id").eq("dossier_id", dossierId).eq("avocat_discord_id", user.discord_id).maybeSingle();
    assigne = !!data;
  }
  return { dossier, client, direction, assigne, peutVoir: client || direction || assigne, peutGerer: direction || assigne };
}

// Nom d'un employé à partir de son ID Discord (annuaire des connexions du site)
export async function nomStaff(db: any, discordId: string): Promise<string | null> {
  const { data } = await db.from("site_logins").select("discord_name,nom_perso").eq("discord_id", discordId).maybeSingle();
  if (!data) return null;
  return data.nom_perso || data.discord_name || null;
}
