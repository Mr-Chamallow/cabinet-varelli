-- Lot 28 : paie 20% + prime fixe, dons, transaction atomique, budget de lancement
-- A lancer une seule fois dans Supabase > SQL Editor.

-- 1) Reglages
alter table obsidian_settings add column if not exists capital_depart numeric default 0;
alter table obsidian_settings add column if not exists seuil_tresorerie numeric default 0;
alter table obsidian_settings add column if not exists prime_seuil numeric default 20000;
alter table obsidian_settings add column if not exists prime_fixe numeric default 5000;
insert into obsidian_settings (id, commission_pct, prime_seuil, prime_fixe)
values ('default', 20, 20000, 5000)
on conflict (id) do update set commission_pct = 20, prime_seuil = 20000, prime_fixe = 5000, updated_at = now();

-- 2) Dons (deduits de la paie, propre ou sale, avec photo de preuve)
create table if not exists obsidian_dons (
  id uuid primary key default gen_random_uuid(),
  employe text not null,
  montant numeric not null check (montant > 0),
  type_argent text not null check (type_argent in ('propre', 'sale')),
  semaine date not null,
  motif text default '',
  preuve_url text,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'valide', 'refuse')),
  created_by text,
  created_by_id text,
  valide_par text,
  valide_at timestamptz,
  created_at timestamptz default now()
);
alter table obsidian_dons enable row level security;
drop policy if exists "dons_select" on obsidian_dons;
create policy "dons_select" on obsidian_dons for select using (true);
-- Pas de policy d'ecriture : tout passe par les routes serveur (cle service_role).

insert into storage.buckets (id, name, public) values ('dons-preuves', 'dons-preuves', true)
on conflict (id) do nothing;

-- Validation / refus d'un don (atomique : statut + ecriture compta)
create or replace function obsidian_don_valider(p_id uuid, p_par text, p_ok boolean)
returns obsidian_dons language plpgsql security definer set search_path = public as $$
declare d obsidian_dons;
begin
  select * into d from obsidian_dons where id = p_id for update;
  if not found then raise exception 'Don introuvable'; end if;
  if d.statut <> 'en_attente' then raise exception 'Don deja traite'; end if;
  if p_ok then
    insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, source, source_id)
    values ('recette', 'Don', d.montant, d.type_argent,
            'Don de ' || d.employe || coalesce(' : ' || nullif(d.motif, ''), ''), '',
            date_trunc('week', now() at time zone 'Europe/Paris')::date, coalesce(p_par, ''), 'don', d.id);
    update obsidian_dons set statut = 'valide', valide_par = p_par, valide_at = now() where id = p_id returning * into d;
  else
    update obsidian_dons set statut = 'refuse', valide_par = p_par, valide_at = now() where id = p_id returning * into d;
  end if;
  return d;
end $$;
revoke execute on function obsidian_don_valider(uuid, text, boolean) from public, anon, authenticated;

-- 3) Vente / achat atomique : transaction + stock + mouvement + compta en un seul bloc
create or replace function obsidian_vente_achat(
  p_type text, p_stock_id uuid, p_produit_nom text, p_categorie text, p_quantite int,
  p_montant numeric, p_type_argent text, p_motif text, p_user text, p_user_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s obsidian_stocks; tx cahier_transactions; mid uuid; nq numeric;
  vente boolean := p_type in ('entrée', 'entree');
  wk date := date_trunc('week', now() at time zone 'Europe/Paris')::date;
begin
  if coalesce(p_quantite, 0) <= 0 or coalesce(p_montant, 0) <= 0 then
    raise exception 'Quantite et montant doivent etre superieurs a 0';
  end if;
  if p_stock_id is not null then
    select * into s from obsidian_stocks where id = p_stock_id for update;
    if not found then raise exception 'Stock introuvable'; end if;
    if vente and s.quantite < p_quantite then
      raise exception 'Stock insuffisant : % disponible(s) pour %', s.quantite, s.nom;
    end if;
  end if;

  insert into cahier_transactions (type, montant, categorie, motif, produit_nom, quantite, type_argent, created_by, created_by_id)
  values (case when vente then 'entrée' else 'sortie' end, p_montant, p_categorie, p_motif, p_produit_nom, p_quantite, p_type_argent, p_user, p_user_id)
  returning * into tx;

  if s.id is not null then
    nq := case when vente then s.quantite - p_quantite else s.quantite + p_quantite end;
    update obsidian_stocks set quantite = nq, updated_at = now() where id = s.id returning * into s;
    if vente then
      insert into obsidian_mouvements (stock_id, stock_nom, type, quantite, motif, membre, prix_unitaire, total, created_by)
      values (s.id, s.nom, 'sortie', p_quantite, 'Vente (Transaction) : ' || p_motif, p_user, 0, 0, p_user);
    else
      insert into obsidian_mouvements (stock_id, stock_nom, type, quantite, motif, membre, prix_unitaire, total, created_by)
      values (s.id, s.nom, 'entrée', p_quantite, 'Achat (Transaction) : ' || p_motif, p_user, round(p_montant / p_quantite, 2), p_montant, p_user)
      returning id into mid;
      -- le trigger cree la depense "Achat stock" : on y met le bon type d'argent
      update obsidian_comptabilite set type_argent = p_type_argent, motif = p_motif where source = 'stock' and source_id = mid;
    end if;
  end if;

  if vente or s.id is null then
    insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, source, source_id)
    values (case when vente then 'recette' else 'dépense' end,
            (case when vente then 'Vente ' else 'Achat ' end) || p_categorie,
            p_montant, p_type_argent, p_motif, '', wk, p_user, 'transaction', tx.id);
  end if;

  return jsonb_build_object('transaction', to_jsonb(tx), 'stock', case when s.id is not null then to_jsonb(s) else null end);
end $$;
revoke execute on function obsidian_vente_achat(text, uuid, text, text, int, numeric, text, text, text, text) from public, anon, authenticated;

-- 4) Budget : tresorerie par type d'argent + investissements
create or replace function obsidian_budget()
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'capital', coalesce((select capital_depart from obsidian_settings where id = 'default'), 0),
    'seuil', coalesce((select seuil_tresorerie from obsidian_settings where id = 'default'), 0),
    'propre', coalesce(sum(case when coalesce(type_argent, 'sale') = 'propre' then case when type = 'recette' then montant else -montant end end), 0),
    'sale', coalesce(sum(case when coalesce(type_argent, 'sale') = 'sale' then case when type = 'recette' then montant else -montant end end), 0),
    'mixte', coalesce(sum(case when coalesce(type_argent, 'sale') = 'mixte' then case when type = 'recette' then montant else -montant end end), 0),
    'invest', coalesce(sum(case when type <> 'recette' and categorie ilike 'Investissement%' then montant end), 0)
  ) from obsidian_comptabilite;
$$;
grant execute on function obsidian_budget() to anon, authenticated;
