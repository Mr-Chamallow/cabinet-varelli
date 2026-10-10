-- Lot 17 : onglet « Profil psy » des employés + fiche de Pierce Davenport (histoire + profil psychologique).
alter table obsidian_employes add column if not exists histoire_texte text;
alter table obsidian_employes add column if not exists profil_psy jsonb;

update obsidian_employes set
histoire_texte = $h$PIERCE DAVENPORT — « L'Arbitre Suprême »
CEO d'Obsidian Logistics · Juge suprême du Tribunal de l'Ombre

Avant Obsidian, Pierce Davenport n'était personne de remarquable : un homme discret, méthodique, qui observait Los Santos plus qu'il n'y vivait. Il a compris tôt une chose que les gangs, les cartels et même la police refusaient de voir : le crime n'est pas un chaos, c'est une industrie. Et une industrie sans gestionnaire s'effondre dans le sang.

Il a passé des années à regarder les guerres de territoire, les fusillades à répétition, les représailles absurdes, et à compter ce qu'elles coûtaient à tout le monde : des hommes, de l'argent, des routes, de la confiance. De ce constat est né le Consortium de Régulation : un groupe qui ne prend jamais parti, qui ne fait jamais la guerre, qui n'agit jamais pour son profit personnel — sauf quand un contrat ou un pacte est violé.

Il a bâti Obsidian comme on bâtit une institution : des pôles (juridique, logistique, sécurité), des règles écrites, des pactes signés, des audits. Des infrastructures ultra-sécurisées dans le désert de Blaine County. Des cadres qui se déplacent comme des diplomates et jugent comme des magistrats déchus.

Pierce est le visage public du consortium lors des grands événements. Il n'intervient jamais pour les petits litiges : il tranche uniquement ce que personne d'autre ne peut régler. Quand il siège en juge au Tribunal de l'Ombre, dans le hangar transformé en tribunal luxueux et funèbre, il accorde à l'accusé le droit de se défendre, écoute tout, puis rend un verdict glacial, sans haine ni hésitation.

Sa doctrine tient en une phrase : « Le crime est une industrie. Le chaos est une mauvaise gestion. Nous sommes les gestionnaires. »

Sa neutralité est sa seule vraie arme. Il le sait : le jour où Obsidian prendra parti, le consortium deviendra un gang de plus — et il aura échoué.$h$,
profil_psy = $p${
 "archetype": "L'Arbitre Suprême",
 "devise": "Le crime est une industrie. Le chaos est une mauvaise gestion.",
 "resume": "Dirigeant froid, patient et méthodique, qui se pense comme une institution plus que comme un homme. Il gouverne par la neutralité, la mise en scène et la peur du verdict. Il ne hausse jamais le ton : le calme est son autorité. Il ne tranche que ce que personne d'autre ne peut trancher.",
 "traits": {"Sang-froid": 10, "Contrôle": 9, "Empathie": 4, "Ambition": 7, "Paranoïa": 6, "Impulsivité": 1, "Loyauté": 8, "Charisme": 9},
 "motivations": "Remplacer le chaos par l'ordre. Prouver que le crime peut être géré. Préserver la neutralité et la pérennité du consortium.",
 "peurs": "Qu'Obsidian prenne parti et devienne un gang. Perdre le contrôle d'une scène. Une fuite (clé USB, lanceur d'alerte) qui expose les pactes. La trahison venant de l'intérieur.",
 "forces": "Calme absolu, vision d'ensemble, sens de la mise en scène, autorité naturelle, patience, parole rare donc écoutée.",
 "faiblesses": "Isolement du pouvoir, difficulté à déléguer les décisions finales, rigidité face à ce qui sort du cadre, dépendance à l'image de neutralité.",
 "pression": "Il ralentit au lieu d'accélérer. Silence, regard, puis décision nette. Il convoque, ne court jamais après personne.",
 "argent": "Un outil de régulation, jamais un but personnel. Il compte tout, au centime, mais méprise l'ostentation.",
 "pouvoir": "Le pouvoir est une responsabilité d'arbitrage. Il l'exerce par les règles, les pactes et le théâtre, pas par la force.",
 "autorite": "Respecte la loi du crime qu'il a écrite, pas celle de l'État. Face au SAMP : ni guerre ouverte, ni alliance ; il laisse fuiter, il observe.",
 "voix": "Posée, basse, vocabulaire juridique et choisi. Phrases courtes. Jamais un mot de trop, jamais un juron.",
 "tics": "Costume d'une sobriété funèbre, mains jointes, silence avant le verdict, regarde l'accusé dans les yeux jusqu'au bout.",
 "allies": "Le Directeur Opérationnel (le Maître du Jeu), le Responsable juridique (l'Inquisiteur), le Responsable logistique (l'Intendant), le Responsable sécurité (le Prévôt).",
 "ennemis": "Tout groupe qui viole un pacte ou un contrat. Les chefs de gang impulsifs qui mettent l'économie en péril. Un éventuel lanceur d'alerte.",
 "accroches": "Convocation d'un chef de gang dans le désert · Audit de conformité en personne · Procès de l'Ombre (juge suprême) · Enchères de Grand Senora · Médiation entre deux organisations en guerre · Négociation d'un pacte d'Obsidienne."
}$p$::jsonb
where nom ilike 'Pierce Davenport';
