// Guide détaillé des permissions : ce que chacune donne en lecture / en écriture.
export interface PermInfo { key: string; read: string; write: string; note?: string }
export interface PermGroup { titre: string; icon: string; perms: PermInfo[] }

export const PERMISSION_GUIDE: PermGroup[] = [
  { titre: "Opérations & logistique", icon: "📦", perms: [
    { key: "obsidian_dashboard", read: "Voir le tableau de bord (KPI, alertes, activité).", write: "Idem (page en lecture seule)." },
    { key: "obsidian_prix", read: "Consulter le tableau des prix (achat/vente).", write: "Créer, modifier, supprimer des prix. Sert de référence pour stocks, marges et transactions." },
    { key: "obsidian_stocks", read: "Voir les stocks, quantités et historique des mouvements.", write: "Créer des articles, faire des entrées/sorties. Une entrée avec prix d'achat crée automatiquement une DÉPENSE en compta." },
    { key: "obsidian_armurerie", read: "Voir les armes et munitions en stock.", write: "Entrées/sorties d'armes et munitions (mêmes règles compta que Stocks)." },
    { key: "obsidian_garage", read: "Voir les véhicules, photos et affectations.", write: "Ajouter, modifier, assigner un véhicule à un employé, supprimer." },
    { key: "obsidian_rdv", read: "Voir le planning (opérations, rendez-vous, calendrier).", write: "Créer, modifier, supprimer des rendez-vous / opérations." },
    { key: "obsidian_contrats", read: "Voir les contrats, leur statut et leurs rapports.", write: "Créer/modifier/supprimer, changer le statut, rédiger le rapport, exporter le PDF. Passer un contrat en « Terminé » crée la RECETTE de la récompense en compta." },
    { key: "cahier_vente", read: "Voir l'onglet Transaction (ventes/achats) et le blanchiment.", write: "Enregistrer des transactions (met à jour le stock + la compta) et lancer un blanchiment d'argent." },
  ]},
  { titre: "Finances", icon: "💰", perms: [
    { key: "obsidian_comptabilite", read: "Hub compta complet : synthèse, flux, catégories, marges, semaines, journal, expert (lecture seule).", write: "Écriture réservée au blanchiment, à la clôture manuelle de semaine et à l'export. Aucune saisie manuelle : tout vient des autres onglets." },
    { key: "obsidian_paie", read: "Voir les paies, commissions et primes de la semaine.", write: "Marquer payé, saisir bonus/malus. Une paie payée devient une DÉPENSE dans la semaine du paiement." },
    { key: "obsidian_stats", read: "Hub statistiques (équipe, activité, performance).", write: "Idem (page en lecture seule)." },
  ]},
  { titre: "Actions & terrain", icon: "🎯", perms: [
    { key: "obsidian_actions", read: "Voir les actions illégales et leurs gains.", write: "Créer/modifier/supprimer une action : génère recettes en compta (catégorie = type d'action)." },
    { key: "obsidian_arrestations", read: "Voir les arrestations et pertes associées.", write: "Enregistrer une arrestation : amende = prime (compta), objets/argent perdus = profil et stats uniquement (jamais en compta)." },
    { key: "obsidian_fiches", read: "Voir les fiches et le profil central des personnes.", write: "Créer/modifier fiches, photos, tags ; export PDF." },
    { key: "base_donnees", read: "Consulter la base de données (recherche globale).", write: "Modifier / alimenter les données de la base." },
  ]},
  { titre: "Équipe", icon: "👥", perms: [
    { key: "obsidian_employes", read: "Voir la liste des employés, histoire, rôles.", write: "Créer/modifier/supprimer, RIB, changer le rôle. La promotion CEO/COO est réservée aux CEO/COO." },
    { key: "organigramme", read: "Voir l'organigramme.", write: "Idem (lecture seule)." },
  ]},
  { titre: "Consortium (GM)", icon: "🏛️", perms: [
    { key: "gm_tribunal", read: "Voir les dossiers du Tribunal de l'Ombre.", write: "Ouvrir, juger, modifier des dossiers ; PDF." },
    { key: "gm_pactes", read: "Voir les pactes d'Obsidienne.", write: "Créer, modifier, enregistrer des violations ; PDF." },
    { key: "gm_audits", read: "Voir les audits de conformité.", write: "Réaliser audits, sanctions ; PDF." },
    { key: "gm_evenements", read: "Voir convois, enchères, alertes.", write: "Créer/gérer événements et enchères ; PDF." },
    { key: "gm_reputation", read: "Voir la réputation des groupes.", write: "Modifier organisations et réputations ; dossier PDF." },
    { key: "gm_stats", read: "Voir les stats du Consortium.", write: "Réinitialiser les stats du consortium." },
  ]},
  { titre: "Outils & ressources", icon: "🧰", perms: [
    { key: "juridique", read: "Consulter le code pénal.", write: "Modifier le code pénal." },
    { key: "carte-enqueteur", read: "Voir la carte San Andreas.", write: "Poser/modifier des marqueurs." },
    { key: "utile_samp", read: "Voir les ressources utiles SAMP.", write: "Modifier le contenu." },
    { key: "h47", read: "Accéder à la section H-47.", write: "Modifier le contenu H-47." },
  ]},
  { titre: "Administration", icon: "🛡️", perms: [
    { key: "admin", read: "Voir l'admin (utilisateurs, rôles, logs).", write: "Gérer rôles, permissions, overrides utilisateurs. À réserver à la direction." },
    { key: "supervision", read: "Voir la supervision (activité de tous).", write: "Idem." },
    { key: "edit_all", read: "—", write: "Droit d'édition sur TOUTES les entrées, même celles des autres." },
    { key: "delete_all", read: "—", write: "Droit de suppression sur TOUT (même les entrées des autres). Très sensible." },
  ]},
];
