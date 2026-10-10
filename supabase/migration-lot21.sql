-- Lot 21 : histoire complète de Pierce Davenport
update obsidian_employes
set histoire_texte = $h$PIERCE DAVENPORT - « L'Arbitre Suprême »
CEO d'Obsidian Logistics

QUI JE SUIS
Je m'appelle Pierce Davenport. Pendant dix ans, j'ai été juriste au service de l'État, du contentieux jusqu'aux dossiers sensibles proches du pouvoir politique. Aujourd'hui, je dirige Obsidian Logistics, un consortium qui arbitre l'économie illégale de San Andreas. On me surnomme « L'Arbitre Suprême ». Je ne l'ai jamais demandé. Je parle peu, je ne hausse jamais le ton, et je ne porte jamais d'arme : ceux qui m'entourent s'en chargent. Ma seule arme, c'est un contrat bien rédigé.

D'OÙ JE VIENS
J'ai grandi à Los Santos dans une famille sans nom et sans appuis. Le droit a été mon seul levier : des études brillantes, puis l'administration. J'y croyais. Je pensais que la loi était un outil neutre, qu'il suffisait de bien la servir pour qu'elle protège les gens. Mon frère Daniel pensait la même chose, à sa manière : il est devenu enquêteur.

LA TRAHISON
Daniel avait remonté un réseau de corruption qui achetait marchés publics, juges et policiers. Il m'a confié son dossier, parce que j'étais le seul en qui il avait confiance. Je l'ai transmis à ma hiérarchie, en toute loyauté. Elle l'a vendu. Trois semaines plus tard, Daniel est mort dans un « accident ». L'enquête a été classée en quarante-huit heures.
J'ai compris ce jour-là que la loi ne protège que ceux qui la tiennent, et que le chaos n'est jamais un accident : c'est une mauvaise gestion que quelqu'un exploite. J'ai démissionné la semaine suivante, sans bruit.

POURQUOI OBSIDIAN
Je n'ai pas bâti Obsidian pour me venger. Une vengeance fait du bruit, et le bruit se paie. J'ai bâti Obsidian parce que le crime est une industrie, et qu'une industrie sans règles finit toujours par tuer des innocents. J'ai donc fait ce que je savais faire : écrire des règles, des contrats, des pactes, et instituer un tribunal. Obsidian ne prend parti pour personne. Elle arbitre, elle trace, elle sanctionne. Elle ne s'enrichit pas, car si Obsidian profite, Obsidian devient exactement ce que j'ai fui.

MA MÉTHODE
- Écrire tout ce qui se promet : un pacte signé engage, une violation est consignée avec preuve.
- Ne jamais entrer en guerre ouverte : on convoque, on audite, on juge.
- Faire de chaque rencontre une scène : un hangar dans le désert, une convocation, un procès.
- Rester neutre : la neutralité est la seule monnaie d'Obsidian.

MES OBJECTIFS
1. Court terme : installer Obsidian, signer les premiers pactes, lancer le premier audit de conformité, composer un Directoire de confiance.
2. Moyen terme : faire de la réputation des groupes une vraie monnaie, et du Tribunal de l'Ombre un rendez-vous que tout le monde redoute et respecte.
3. Long terme : devenir l'arbitre incontournable de San Andreas, au point que régler un litige par les armes soit considéré comme une faute de gestion.
4. Le fond du dossier : j'attends. Ceux qui ont vendu Daniel finiront par signer un pacte, puis par le violer. Ce jour-là, ils comparaîtront devant le Tribunal, et je ne lèverai pas la voix.

CE QUI ME HANTE
Voir la loi se vendre une seconde fois, et que le chaos prenne un proche de plus. C'est pour cela que je ne donne ma confiance à personne sans contrat.

« Le crime est une industrie. Le chaos est une mauvaise gestion. Nous sommes les gestionnaires. »
$h$,
    profil_psy = coalesce(profil_psy,'{}'::jsonb) || '{"peurs":"Voir la loi vendue une seconde fois ; que le chaos tue encore un proche","ennemis":"Le réseau de corruption qui a acheté la hiérarchie de son frère"}'::jsonb
where nom ilike 'Pierce Davenport';
