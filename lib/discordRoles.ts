// IDs des rôles Discord (serveur Obsidian) pour les mentions ciblées dans les alertes.
export const ROLE_IDS = {
  CEO: "1523904722493374514",
  COO: "1523904835940782232",
  RJ: "1523905358064521227",        // Responsable juridique
  AVOCAT: "1554910715624820787",
  AJ: "1523905631323684975",        // Agent juridique
  RL: "1523906010715263026",        // Responsable logistique
  AL: "1523906387208437920",        // Agent logistique
  RS: "1523906975363104788",        // Responsable sécurité
  AS: "1523907091453186059",        // Agent de sécurité
  OP: "1523907437013237761",
  ST: "1523907553925267617",
  RESP: "1523946121624551434",      // Tous les responsables
  EMPLOYE: "1523912973683265626",   // Tous les employés
  PARTENAIRE: "1523908428609618021",
  CLIENT: "1523908508838400031",
} as const;

export type RoleKey = keyof typeof ROLE_IDS;

export const GROUPS = {
  JURIDIQUE: ["RJ", "AJ", "AVOCAT"] as RoleKey[],
  SECURITE: ["RS", "AS"] as RoleKey[],
  LOGISTIQUE: ["RL", "AL"] as RoleKey[],
  DIRECTION: ["CEO", "COO"] as RoleKey[],
};

// "<@&id> <@&id>" à placer dans le contenu du message
export const mention = (...keys: (RoleKey | RoleKey[])[]) =>
  [...new Set(keys.flat())].map(k => `<@&${ROLE_IDS[k]}>`).join(" ");
export const roleIds = (...keys: (RoleKey | RoleKey[])[]) => [...new Set(keys.flat())].map(k => ROLE_IDS[k] as string);
