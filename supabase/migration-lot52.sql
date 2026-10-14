-- LOT 52 : mouvements de stock atomiques (verrou + historique + stock dans UNE transaction)
-- A coller dans le SQL Editor Supabase APRES le deploiement Vercel. Idempotent.

create or replace function obsidian_mouvement_stock(
  p_stock_id uuid, p_type text, p_quantite numeric, p_motif text, p_membre text, p_user text,
  p_prix numeric default null, p_type_argent text default 'sale')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s obsidian_stocks;
  entree boolean := p_type in ('entrée', 'entree');
  pu numeric; nq numeric; np numeric; mid uuid; ta text;
begin
  if p_type not in ('entrée', 'entree', 'sortie') then raise exception 'Type de mouvement invalide'; end if;
  if coalesce(p_quantite, 0) <= 0 then raise exception 'Quantite superieure a 0 requise'; end if;

  select * into s from obsidian_stocks where id = p_stock_id for update;
  if not found then raise exception 'Stock introuvable'; end if;

  if not entree and p_quantite > s.quantite then
    raise exception 'Stock insuffisant : % disponible(s) pour %', s.quantite, s.nom;
  end if;

  -- prix : prix d'achat saisi (entree) sinon prix actuel du stock
  pu := case when entree and p_prix is not null and p_prix >= 0 then p_prix else coalesce(s.prix_unitaire, 0) end;
  nq := case when entree then s.quantite + p_quantite else s.quantite - p_quantite end;

  -- cout moyen pondere sur les entrees valorisees
  np := s.prix_unitaire;
  if entree and pu > 0 then
    np := round(case when s.quantite > 0 and coalesce(s.prix_unitaire, 0) > 0
                     then (s.quantite * s.prix_unitaire + p_quantite * pu) / (s.quantite + p_quantite)
                     else pu end, 2);
  end if;

  insert into obsidian_mouvements (stock_id, stock_nom, type, quantite, motif, membre, prix_unitaire, total, created_by)
  values (s.id, s.nom, case when entree then 'entrée' else 'sortie' end, p_quantite, coalesce(p_motif, ''),
          coalesce(nullif(p_membre, ''), p_user, ''), pu, p_quantite * pu, coalesce(nullif(p_user, ''), p_membre, ''))
  returning id into mid;

  update obsidian_stocks set quantite = nq, prix_unitaire = np, updated_at = now() where id = s.id returning * into s;

  -- le trigger compta a note l'achat en argent "sale" : on le corrige si l'achat est en propre / mixte
  ta := case when p_type_argent in ('sale', 'propre', 'mixte') then p_type_argent else 'sale' end;
  if entree and ta <> 'sale' then
    update obsidian_comptabilite set type_argent = ta where source = 'stock' and source_id = mid;
  end if;

  return jsonb_build_object('stock', to_jsonb(s), 'mouvement_id', mid);
end $$;

revoke execute on function obsidian_mouvement_stock(uuid, text, numeric, text, text, text, numeric, text) from public, anon, authenticated;
