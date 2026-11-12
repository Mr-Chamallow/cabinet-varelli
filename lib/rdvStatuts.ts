// Statuts d'un rendez-vous, partagés entre le serveur et les écrans (client, avocat, espace perso)
export const RDV_STATUT: Record<string, { txt: string; color: string }> = {
  demande: { txt: "En attente de prise en charge", color: "#e0b050" },
  attribue: { txt: "Attribué, à confirmer", color: "#e0b050" },
  confirme: { txt: "Confirmé", color: "#5fb878" },
  en_cours: { txt: "En cours", color: "#4a9eff" },
  reporte: { txt: "Reporté, à confirmer", color: "#e08a3c" },
  termine: { txt: "Terminé", color: "#8a8a8a" },
  annule: { txt: "Annulé", color: "#d9534f" },
};

// Statuts qui bloquent un créneau (un créneau "demande" reste réservable)
export const STATUT_OCCUPE = ["attribue", "confirme", "en_cours", "reporte"];
