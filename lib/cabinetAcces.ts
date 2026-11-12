import { createHmac } from "crypto";
import { hasPermission } from "@/lib/auth";
import { appUser } from "@/lib/cabinetServer";
import { estStaffUser, estSecretaireUser, CABINET_STAFF_ROLES } from "@/lib/cabinetRoles";

export { CABINET_STAFF_ROLES };

// Salons internes par équipe. "juridique" s'affiche comme "Liaison secrétaire juridique".
export const SALONS = ["general", "juridique"] as const;

// Employé = rôle du cabinet (jamais le client)
export const estStaff = (user: any) => estStaffUser(user);
export const estSecretaire = (user: any) => estStaffUser(user) && estSecretaireUser(user);
export const estDirection = (user: any) => hasPermission(appUser(user), "cabinet_attribution");
export const estCompta = (user: any) => hasPermission(appUser(user), "cabinet_compta");

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

// Accès à un dossier (visible uniquement par) : le client ou l'employé qui l'a ouvert, l'avocat assigné,
// la direction et la secrétaire juridique. Seuls l'avocat assigné et la direction peuvent le gérer.
export async function accesDossier(db: any, user: any, dossierId: string) {
  const { data: dossier } = await db.from("cabinet_dossiers").select("*").eq("id", dossierId).maybeSingle();
  if (!dossier) return { dossier: null, client: false, direction: false, secretaire: false, assigne: false, peutVoir: false, peutGerer: false };
  const client = dossier.client_discord_id === user.discord_id;
  const direction = estDirection(user);
  const secretaire = estSecretaire(user);
  let assigne = false;
  if (estStaff(user) && !direction) {
    const { data } = await db.from("cabinet_dossier_acces").select("dossier_id").eq("dossier_id", dossierId).eq("avocat_discord_id", user.discord_id).maybeSingle();
    assigne = !!data;
  }
  return {
    dossier, client, direction, secretaire, assigne,
    peutVoir: client || direction || assigne || secretaire,
    peutGerer: direction || assigne,
  };
}

// Nom d'un employé à partir de son ID Discord (annuaire des connexions du site)
export async function nomStaff(db: any, discordId: string): Promise<string | null> {
  const { data } = await db.from("site_logins").select("discord_name,nom_perso").eq("discord_id", discordId).maybeSingle();
  if (!data) return null;
  return data.nom_perso || data.discord_name || null;
}
