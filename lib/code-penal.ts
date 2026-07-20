export interface ChefPenal {
  code: string;
  infraction: string;
  categorie: string;
  amende: string;
  detention: string;
}

export const CHEFS_PENAL: ChefPenal[] = [
  // Contraventions
  { code:"C-5",  infraction:"Conduite dangereuse",                  categorie:"Contravention", amende:"2 700$",   detention:"—" },
  { code:"C-7",  infraction:"Excès de vitesse",                     categorie:"Contravention", amende:"1 800$",   detention:"—" },
  { code:"C-9",  infraction:"Holster interdit",                     categorie:"Contravention", amende:"1 350$",   detention:"—" },
  { code:"C-18", infraction:"Consommation de drogue",               categorie:"Contravention", amende:"450$",     detention:"—" },
  // Délits mineurs
  { code:"DM-1",  infraction:"Agression sur citoyen",               categorie:"Délit mineur",  amende:"4 500$",   detention:"30 min" },
  { code:"DM-6",  infraction:"Braquage de supérette",               categorie:"Délit mineur",  amende:"3 600$",   detention:"20 min" },
  { code:"DM-7",  infraction:"Braquage/piratage ATM",               categorie:"Délit mineur",  amende:"2 250$",   detention:"15 min" },
  { code:"DM-8",  infraction:"Cambriolage",                         categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-12", infraction:"Délit de fuite",                      categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-13", infraction:"Entrave à une opération police",      categorie:"Délit mineur",  amende:"3 500$",   detention:"30 min" },
  { code:"DM-15", infraction:"Exhibition d'armes de poing",         categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-16", infraction:"Exhibition d'armes lourdes",          categorie:"Délit mineur",  amende:"4 500$",   detention:"30 min" },
  { code:"DM-20", infraction:"Utilisation d'une arme à feu",        categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-21", infraction:"Intrusion zone restreinte",           categorie:"Délit mineur",  amende:"3 200$",   detention:"30 min" },
  { code:"DM-22", infraction:"Menace/intimidation envers civil",    categorie:"Délit mineur",  amende:"3 500$",   detention:"15 min" },
  { code:"DM-23", infraction:"Mise en danger de la vie d'autrui",  categorie:"Délit mineur",  amende:"5 800$",   detention:"15 min" },
  { code:"DM-26", infraction:"Non présentation à convocation",      categorie:"Délit mineur",  amende:"6 750$",   detention:"20 min" },
  { code:"DM-47", infraction:"Possession de pistolet",              categorie:"Délit mineur",  amende:"15 000$",  detention:"20 min" },
  { code:"DM-78", infraction:"Possession de cannabis",              categorie:"Délit mineur",  amende:"32$/u",    detention:"10 min" },
  { code:"DM-79", infraction:"Possession de cocaïne",               categorie:"Délit mineur",  amende:"45$/u",    detention:"10 min" },
  { code:"DM-84", infraction:"Possession d'héroïne",               categorie:"Délit mineur",  amende:"72$/u",    detention:"10 min" },
  { code:"DM-124",infraction:"Vente de drogue",                     categorie:"Délit mineur",  amende:"3 750$",   detention:"10 min" },
  { code:"DM-127",infraction:"Refus d'obtempérer",                  categorie:"Délit mineur",  amende:"900$",     detention:"15 min" },
  { code:"DM-130",infraction:"Trafic de stupéfiants",               categorie:"Délit mineur",  amende:"Variable", detention:"Variable" },
  { code:"DM-133",infraction:"Vol",                                  categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-144",infraction:"Évasion du poste de police",         categorie:"Délit mineur",  amende:"7 500$",   detention:"20 min" },
  // Délits majeurs
  { code:"DMJ-9",  infraction:"Agression sur agent / police",       categorie:"Délit majeur",  amende:"8 500$",   detention:"1h" },
  { code:"DMJ-11", infraction:"Menaces de mort / menaces graves",   categorie:"Délit majeur",  amende:"8 500$",   detention:"45 min" },
  { code:"DMJ-13", infraction:"Homicide involontaire",              categorie:"Délit majeur",  amende:"12 500$",  detention:"25 min" },
  { code:"DMJ-14", infraction:"Association de malfaiteurs",         categorie:"Délit majeur",  amende:"4 500$",   detention:"30 min" },
  { code:"DMJ-17", infraction:"Braquage bijouterie/supermarché",    categorie:"Délit majeur",  amende:"9 000$",   detention:"30 min" },
  { code:"DMJ-18", infraction:"Braquage banque centrale",           categorie:"Délit majeur",  amende:"25 000$",  detention:"60 min" },
  { code:"DMJ-21", infraction:"Braquage banque (Fleeca)",           categorie:"Délit majeur",  amende:"15 000$",  detention:"25 min" },
  { code:"DMJ-28", infraction:"Faux témoignage",                    categorie:"Délit majeur",  amende:"9 000$",   detention:"30 min" },
  { code:"DMJ-36", infraction:"Participation à une fusillade",      categorie:"Délit majeur",  amende:"3 500$",   detention:"30 min" },
  { code:"DMJ-54", infraction:"Possession de fusil d'assaut",       categorie:"Délit majeur",  amende:"35 000$",  detention:"25 min" },
  { code:"DMJ-83", infraction:"Prise d'otage sur civil",            categorie:"Délit majeur",  amende:"4 500$",   detention:"15 min" },
  { code:"DMJ-91", infraction:"Vol à main armée",                   categorie:"Délit majeur",  amende:"5 000$",   detention:"30 min" },
  { code:"DMJ-100",infraction:"Corruption",                         categorie:"Délit majeur",  amende:"22 500$",  detention:"30 min" },
  { code:"DMJ-101",infraction:"Fraude fiscale",                     categorie:"Délit majeur",  amende:"90 000$",  detention:"30 min" },
  // Crimes
  { code:"CR-2",  infraction:"Blanchiment",                         categorie:"Crime",         amende:"5$×somme", detention:"15 min" },
  { code:"CR-4",  infraction:"Assassinat prémédité (MORT RP)",      categorie:"Crime",         amende:"225 000$", detention:"1h" },
  { code:"CR-8",  infraction:"Meurtre (MORT RP)",                   categorie:"Crime",         amende:"100 800$", detention:"1h" },
  { code:"CR-11", infraction:"Cavale",                              categorie:"Crime",         amende:"9 000$",   detention:"1h" },
  { code:"CR-15", infraction:"Meurtre représentant État (MORT RP)", categorie:"Crime",         amende:"300 000$", detention:"30 min" },
  { code:"CR-17", infraction:"Meurtre (COMA)",                      categorie:"Crime",         amende:"18 000$",  detention:"30 min" },
  { code:"CR-19", infraction:"Possession de grenade",               categorie:"Crime",         amende:"135 000$", detention:"30 min" },
  { code:"CR-21", infraction:"Prise d'otage représentant État",     categorie:"Crime",         amende:"18 000$",  detention:"30 min" },
  { code:"CR-22", infraction:"Séquestration",                       categorie:"Crime",         amende:"15 500$",  detention:"30 min" },
  { code:"CR-23", infraction:"Terrorisme",                          categorie:"Crime",         amende:"45 000$",  detention:"1h" },
  { code:"CR-31", infraction:"Violation du secret professionnel",   categorie:"Crime",         amende:"22 500$",  detention:"30 min" },
];
