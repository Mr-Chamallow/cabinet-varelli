// Fonctions partagées du recrutement du cabinet : changer le rôle d'accès d'un employé
import { CABINET_STAFF_ROLES } from "@/lib/cabinetRoles";

export const roleAccesValide = (r: unknown) => typeof r === "string" && (CABINET_STAFF_ROLES as readonly string[]).includes(r);

// Applique le rôle : site_logins (effet immédiat) + role_overrides (conservé à la prochaine connexion)
export async function appliquerRole(db: any, discordId: string, role: string) {
  await db.from("site_logins").update({ site_role: role }).eq("discord_id", discordId);
  await db.from("role_overrides").upsert([{ discord_id: discordId, role }], { onConflict: "discord_id" });
}
