export const DISCORD_SERVER_ID = "1523895697039163402";
export const DISCORD_CLIENT_ID = "1525212250804322415";

export const DISCORD_ROLE_MAP: Record<string, string> = {
  "1523904722493374514": "CEO - Directeur général",
  "1523904835940782232": "COO - Directrice opérationnel",
  "1523905358064521227": "Responsable juridique",
  "1523905631323684975": "Agent juridique",
  "1523906010715263026": "Responsable logistique",
  "1523906387208437920": "Agent logistique",
  "1523906975363104788": "Responsable sécurité",
  "1523907091453186059": "Agent de sécurité",
  "1523907437013237761": "Opérateur",
  "1523907553925267617": "Opérateur stagiaire",
};

const ROLE_PRIORITY = Object.values(DISCORD_ROLE_MAP);

export function getHighestRole(discordRoles: string[]): string {
  for (const role of ROLE_PRIORITY) {
    const id = Object.keys(DISCORD_ROLE_MAP).find(k => DISCORD_ROLE_MAP[k] === role);
    if (id && discordRoles.includes(id)) return role;
  }
  return "Opérateur stagiaire";
}