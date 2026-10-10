// Crée / relie automatiquement les employés à partir des membres du site (rôles internes uniquement).
// Un employé supprimé par le Patron n'est jamais recréé (site_logins.employe_exclu).
const EXTERNAL_ROLES = ["Légal Service"];

export async function syncEmployes(db: any): Promise<{ crees: number; lies: number }> {
  const { data: logins } = await db.from("site_logins").select("discord_id,discord_name,nom_perso,site_role,employe_exclu");
  const { data: emps } = await db.from("obsidian_employes").select("id,nom,role,discord_id");
  const list: any[] = emps || [];
  let crees = 0, lies = 0;
  for (const l of logins || []) {
    if (!l.site_role || EXTERNAL_ROLES.includes(l.site_role) || l.employe_exclu) continue;
    const nom = (l.nom_perso || l.discord_name || "").trim();
    if (!nom) continue;
    const byId = list.find(e => e.discord_id === l.discord_id);
    if (byId) {
      if (byId.role !== l.site_role) { await db.from("obsidian_employes").update({ role: l.site_role }).eq("id", byId.id); byId.role = l.site_role; }
      continue;
    }
    const byName = list.find(e => !e.discord_id && [l.nom_perso, l.discord_name].filter(Boolean).some((n: string) => n.toLowerCase() === String(e.nom).toLowerCase()));
    if (byName) {
      await db.from("obsidian_employes").update({ discord_id: l.discord_id, role: byName.role || l.site_role }).eq("id", byName.id);
      byName.discord_id = l.discord_id; lies++;
      continue;
    }
    const { data: created } = await db.from("obsidian_employes").insert([{ nom, role: l.site_role, discord: l.discord_name, discord_id: l.discord_id, actif: true, notes: "Ajouté automatiquement depuis les membres du site", created_by: "auto" }]).select().single();
    if (created) { list.push(created); crees++; }
  }
  return { crees, lies };
}
