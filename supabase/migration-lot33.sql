-- Lot 33 : lien fournisseur -> groupe de la base
alter table obsidian_fournisseurs add column if not exists groupe_id uuid references carte_gangs(id) on delete set null;
update obsidian_fournisseurs f set groupe_id = g.id, groupe = g.nom
from carte_gangs g where f.groupe_id is null and lower(trim(f.groupe)) = lower(trim(g.nom));

-- Totaux de la compta calcules en base (plus de limite de 1000 lignes) : on ajoute recettes / depenses a obsidian_budget
create or replace function obsidian_budget()
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'capital', coalesce((select capital_depart from obsidian_settings where id = 'default'), 0),
    'seuil', coalesce((select seuil_tresorerie from obsidian_settings where id = 'default'), 0),
    'propre', coalesce(sum(case when coalesce(type_argent, 'sale') = 'propre' then case when type = 'recette' then montant else -montant end end), 0),
    'sale', coalesce(sum(case when coalesce(type_argent, 'sale') = 'sale' then case when type = 'recette' then montant else -montant end end), 0),
    'mixte', coalesce(sum(case when coalesce(type_argent, 'sale') = 'mixte' then case when type = 'recette' then montant else -montant end end), 0),
    'invest', coalesce(sum(case when type <> 'recette' and categorie ilike 'Investissement%' then montant end), 0),
    'recettes', coalesce(sum(case when type = 'recette' and coalesce(source, '') <> 'blanchiment' then montant end), 0),
    'depenses', coalesce(sum(case when type <> 'recette' and coalesce(source, '') <> 'blanchiment' then montant end), 0)
                + coalesce(sum(case when coalesce(source, '') = 'blanchiment' then case when type = 'recette' then -montant else montant end end), 0)
  ) from obsidian_comptabilite;
$$;
grant execute on function obsidian_budget() to anon, authenticated;

-- Photos de preuve des dons : bucket prive (acces par lien temporaire via le site)
update storage.buckets set public = false where id = 'dons-preuves';
