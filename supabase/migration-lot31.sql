-- Lot 31 : fournisseurs (prix d'achat) + cout moyen du stock
-- A lancer une seule fois dans Supabase > SQL Editor.

create table if not exists obsidian_fournisseurs (
  id uuid primary key default gen_random_uuid(),
  categorie text not null check (categorie in ('drogue', 'arme', 'accessoire')),
  produit text not null,
  qui text not null,
  groupe text default '',
  telephone text default '',
  prix_achat numeric not null default 0 check (prix_achat >= 0),
  prefere boolean not null default false,
  actif boolean not null default true,
  notes text default '',
  created_by text,
  created_at timestamptz default now()
);
create index if not exists obsidian_fournisseurs_produit_idx on obsidian_fournisseurs (categorie, lower(trim(produit)));
alter table obsidian_fournisseurs enable row level security;
drop policy if exists "fournisseurs_select" on obsidian_fournisseurs;
create policy "fournisseurs_select" on obsidian_fournisseurs for select using (true);
-- Pas de policy d'ecriture : tout passe par la route serveur (cle service_role).

-- Achat atomique : le prix du stock devient le COUT MOYEN pondere
create or replace function obsidian_vente_achat(
  p_type text, p_stock_id uuid, p_produit_nom text, p_categorie text, p_quantite int,
  p_montant numeric, p_type_argent text, p_motif text, p_user text, p_user_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s obsidian_stocks; tx cahier_transactions; mid uuid; nq numeric; np numeric;
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
    np := s.prix_unitaire;
    if not vente then
      np := round(case when s.quantite > 0 and coalesce(s.prix_unitaire, 0) > 0
                       then (s.quantite * s.prix_unitaire + p_montant) / (s.quantite + p_quantite)
                       else p_montant / p_quantite end, 2);
    end if;
    update obsidian_stocks set quantite = nq, prix_unitaire = np, updated_at = now() where id = s.id returning * into s;
    if vente then
      insert into obsidian_mouvements (stock_id, stock_nom, type, quantite, motif, membre, prix_unitaire, total, created_by)
      values (s.id, s.nom, 'sortie', p_quantite, 'Vente (Transaction) : ' || p_motif, p_user, 0, 0, p_user);
    else
      insert into obsidian_mouvements (stock_id, stock_nom, type, quantite, motif, membre, prix_unitaire, total, created_by)
      values (s.id, s.nom, 'entrée', p_quantite, 'Achat (Transaction) : ' || p_motif, p_user, round(p_montant / p_quantite, 2), p_montant, p_user)
      returning id into mid;
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
