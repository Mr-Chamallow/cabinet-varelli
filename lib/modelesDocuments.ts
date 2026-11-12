// Modèles de documents pré-remplis avec les infos du dossier.
// Variables disponibles : {{client}} {{dossier}} {{type}} {{avocat}} {{date}} {{cabinet}}
export const MODELES_DOCUMENTS = [
  { id: "contrat", nom: "Contrat de représentation", titre: "CONTRAT DE REPRÉSENTATION", paragraphes: [
    "Entre le Cabinet {{cabinet}}, représenté par {{avocat}}, ci-après « le Cabinet »,",
    "et {{client}}, ci-après « le Client ».",
    "Article 1 : Objet. Le Cabinet accepte de représenter le Client dans le cadre du dossier « {{dossier}} » (domaine : {{type}}).",
    "Article 2 : Honoraires. Les honoraires sont fixés selon la grille tarifaire en vigueur du cabinet, communiquée au Client avant tout engagement.",
    "Article 3 : Obligations. Le Client s'engage à communiquer toutes les informations utiles et à répondre dans des délais raisonnables.",
    "Article 4 : Confidentialité. Les échanges entre le Client et le Cabinet sont confidentiels.",
  ]},
  { id: "plainte", nom: "Plainte", titre: "PLAINTE", paragraphes: [
    "Objet : plainte concernant « {{dossier}} » ({{type}}).",
    "Je soussigné(e) {{client}}, dépose la présente plainte auprès des autorités compétentes.",
    "Exposé des faits : [à compléter : date, lieu, personnes impliquées, description précise].",
    "Pièces jointes : [à compléter].",
    "Je demande que les faits soient instruits et que les suites nécessaires soient données.",
  ]},
  { id: "mise-en-demeure", nom: "Mise en demeure", titre: "MISE EN DEMEURE", paragraphes: [
    "Le Cabinet {{cabinet}}, représenté par {{avocat}}, agissant pour le compte de {{client}}, dans le cadre du dossier « {{dossier}} ».",
    "Par la présente, nous vous mettons en demeure de régulariser la situation décrite ci-dessous dans un délai de 8 jours à compter de la réception du présent courrier.",
    "[à compléter : objet de la demande et montant éventuel]",
    "À défaut, nous engagerons toute procédure utile à la défense des intérêts de notre client.",
  ]},
];

export const remplir = (texte: string, v: Record<string, string>) =>
  texte.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? "");
