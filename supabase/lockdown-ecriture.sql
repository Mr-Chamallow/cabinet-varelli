-- VERROUILLAGE DES ECRITURES (a lancer APRES avoir pousse le lot33 et que Vercel a fini de deployer)
-- Apres ca, plus personne ne peut ecrire dans ces tables depuis le navigateur avec la cle publique :
-- tout passe par le site (routes serveur avec controle des permissions). La lecture reste identique.
do $$
declare t text; pol record;
begin
  foreach t in array array[
    'obsidian_drogues','obsidian_armes_prix','obsidian_zones','obsidian_garage','obsidian_rdv','obsidian_contrats',
    'obsidian_fiches','obsidian_journal','bdd_personnes','bdd_vehicules','bdd_activites','carte_gangs','carte_points',
    'carte_dossiers','carte_personnes','carte_plaques','carte_categories','cahier_produits','obsidian_board','obsidian_settings'
  ] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('alter table %I enable row level security', t);
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on %I', pol.policyname, t);
    end loop;
    execute format('create policy "lecture_seule" on %I for select using (true)', t);
  end loop;
end $$;

-- ANNULER (si un souci) : remettre l'ecriture libre sur une table, par exemple :
--   create policy "libre" on obsidian_garage for all using (true) with check (true);
