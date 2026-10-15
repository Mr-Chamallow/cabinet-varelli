-- Lot 53 : patch note illegal FlashBackFA du 15/10/2026
-- A lancer dans Supabase > SQL Editor (apres push + deploiement).
-- Cooldowns de braquage : bijouterie 2 h, banques 1 h (portee groupe, modifiable dans Admin > Actions).
insert into actions_illegales_types (nom, icon, delai_minutes, ordre, portee) values
  ('Bijouterie', '💎', 120, 7, 'groupe'),
  ('Banque (Fleeca)', '🏛️', 60, 7, 'groupe')
on conflict (nom) do update set delai_minutes = excluded.delai_minutes, portee = excluded.portee, icon = excluded.icon, actif = true;
