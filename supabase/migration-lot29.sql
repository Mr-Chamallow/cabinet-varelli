-- Lot 29 : suppression d'une transaction = annulation complete (stock + historique + compta)
-- A lancer dans Supabase > SQL Editor (apres le lot28).

alter table cahier_transactions add column if not exists stock_id uuid;

-- Vente / achat atomique (version qui memorise le stock concerne)
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
  insert into cahier_transactions (type, montant, categorie, motif, produit_nom, quantite, type_argent, created_by, created_by_id, stock_id)
  values (case when vente then 'entrée' else 'sortie' end, p_montant, p_categorie, p_motif, p_produit_nom, p_quantite, p_type_argent, p_user, p_user_id, s.id)
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

-- Annulation complete d'une transaction
create or replace function obsidian_transaction_annuler(p_id uuid, p_user text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  tx cahier_transactions; s obsidian_stocks; vente boolean; mid uuid; nq numeric; cid uuid;
begin
  select * into tx from cahier_transactions where id = p_id for update;
  if not found then raise exception 'Transaction introuvable'; end if;
  vente := tx.type in ('entrée', 'entree');

  -- stock concerne : lien direct, sinon par nom + categorie (anciennes transactions)
  if tx.stock_id is not null then
    select * into s from obsidian_stocks where id = tx.stock_id for update;
  else
    select * into s from obsidian_stocks
      where lower(trim(nom)) = lower(trim(coalesce(tx.produit_nom, ''))) and lower(categorie) = lower(coalesce(tx.categorie, ''))
      limit 1 for update;
  end if;

  if s.id is not null then
    nq := case when vente then s.quantite + tx.quantite else s.quantite - tx.quantite end;
    if nq < 0 then raise exception 'Annulation impossible : le stock de % deviendrait negatif (% en stock, % a retirer)', s.nom, s.quantite, tx.quantite; end if;
    -- mouvement d'origine (recent format) : on le supprime, le trigger retire aussi la depense "Achat stock"
    select id into mid from obsidian_mouvements
      where stock_id = s.id and quantite = tx.quantite
        and motif = (case when vente then 'Vente (Transaction) : ' else 'Achat (Transaction) : ' end) || coalesce(tx.motif, '')
      order by created_at desc limit 1;
    if mid is not null then
      delete from obsidian_mouvements where id = mid;
    else
      insert into obsidian_mouvements (stock_id, stock_nom, type, quantite, motif, membre, prix_unitaire, total, created_by)
      values (s.id, s.nom, case when vente then 'entrée' else 'sortie' end, tx.quantite, 'Annulation transaction : ' || coalesce(tx.motif, ''), p_user, 0, 0, p_user);
    end if;
    update obsidian_stocks set quantite = nq, updated_at = now() where id = s.id returning * into s;
  end if;

  -- ecriture compta de la transaction
  delete from obsidian_comptabilite where source = 'transaction' and source_id = tx.id;
  if not found then
    select id into cid from obsidian_comptabilite
      where source = 'transaction' and source_id is null and montant = tx.montant and motif = tx.motif
        and abs(extract(epoch from (created_at - tx.created_at))) < 300
      order by created_at desc limit 1;
    if cid is not null then delete from obsidian_comptabilite where id = cid; end if;
  end if;

  delete from cahier_transactions where id = tx.id;
  return jsonb_build_object('stock', case when s.id is not null then to_jsonb(s) else null end);
end $$;
revoke execute on function obsidian_transaction_annuler(uuid, text) from public, anon, authenticated;
