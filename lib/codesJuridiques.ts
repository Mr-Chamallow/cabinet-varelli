// Liste des codes et des thèmes (#). Les tables sont créées par supabase/cabinet-codes.sql.
export type CodeInfo = { slug: string; table: string; titre: string; kind: "articles" | "rows" | "armes" | "livret" };
export type TagInfo = { slug: string; label: string };

export const CODES: CodeInfo[] = [
  { slug: "constitution_usa", table: "cabinet_code_constitution_usa", titre: "Constitution des États-Unis (Bill of Rights)", kind: "articles" },
  { slug: "constitution_sa", table: "cabinet_code_constitution_sa", titre: "Constitution de l'État de San Andreas", kind: "rows" },
  { slug: "aviation", table: "cabinet_code_aviation", titre: "Code de l'aviation civile", kind: "articles" },
  { slug: "civil", table: "cabinet_code_civil", titre: "Code civil", kind: "articles" },
  { slug: "electoral", table: "cabinet_code_electoral", titre: "Code électoral", kind: "articles" },
  { slug: "environnemental", table: "cabinet_code_environnemental", titre: "Code environnemental (chasse, pêche, parcs)", kind: "articles" },
  { slug: "gouvernemental", table: "cabinet_code_gouvernemental", titre: "Code gouvernemental", kind: "articles" },
  { slug: "impots", table: "cabinet_code_impots", titre: "Code général des impôts", kind: "articles" },
  { slug: "travail", table: "cabinet_code_travail", titre: "Code général du travail et des entreprises", kind: "articles" },
  { slug: "maritime", table: "cabinet_code_maritime", titre: "Code maritime civil", kind: "articles" },
  { slug: "penal", table: "cabinet_code_penal_texte", titre: "Code pénal (texte)", kind: "articles" },
  { slug: "procedure_penale", table: "cabinet_code_procedure_penale", titre: "Code de procédure pénale", kind: "articles" },
  { slug: "route", table: "cabinet_code_route", titre: "Code de la route", kind: "articles" },
  { slug: "armes_reglementation", table: "cabinet_reglementation_armes", titre: "Réglementation des armes", kind: "armes" },
  { slug: "etat_urgence", table: "cabinet_etat_urgence", titre: "Classification de l'état d'urgence", kind: "articles" },
  { slug: "autres_lois", table: "cabinet_autres_lois", titre: "Autres lois et décrets", kind: "articles" },
  { slug: "livret", table: "cabinet_code_penal", titre: "Livret des peines", kind: "livret" },
];

export const TAGS: TagInfo[] = [
  { slug: "drogue", label: "Drogue" },
  { slug: "armes", label: "Armes" },
  { slug: "violence", label: "Violence" },
  { slug: "homicide", label: "Homicide / mort" },
  { slug: "vol", label: "Vol / braquage" },
  { slug: "fraude", label: "Fraude / finances" },
  { slug: "corruption", label: "Corruption / autorité" },
  { slug: "circulation", label: "Circulation / véhicules" },
  { slug: "sexuel", label: "Sexuel" },
  { slug: "organisation", label: "Organisation / chef" },
  { slug: "procedure", label: "Procédure / justice" },
  { slug: "ordre_public", label: "Ordre public" },
  { slug: "etat_urgence", label: "État d'urgence" },
  { slug: "environnement", label: "Environnement / faune" },
];

export const LIBELLE_TAG: Record<string, string> = Object.fromEntries(TAGS.map((t) => [t.slug, t.label]));
