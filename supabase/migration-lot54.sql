-- LOT 54 : ajustements de stock (pas de depense compta) + alerte tresorerie
-- A coller dans le SQL Editor Supabase APRES le deploiement Vercel. Idempotent.
create or replace function public.obsidian_stock_compta()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare cat text;
begin
  if tg_op = 'DELETE' then
    delete from obsidian_comptabilite where source = 'stock' and source_id = old.id; return old;
  end if;
  if new.type in ('entrée','entree') and coalesce(new.total, 0) > 0 and coalesce(new.motif, '') !~* '^(annulation|ajustement)' then
    select categorie into cat from obsidian_stocks where id = new.stock_id;
    insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, created_at, source, source_id)
    values ('dépense', 'Achat stock — ' || coalesce(cat, 'divers'), new.total, 'sale',
            'Achat ' || new.quantite || ' × ' || new.stock_nom || ' à ' || coalesce(new.prix_unitaire, 0) || ' $', coalesce(new.membre, ''),
            date_trunc('week', new.created_at at time zone 'Europe/Paris')::date, coalesce(new.created_by, ''), new.created_at, 'stock', new.id);
  end if;
  return new;
end $function$;

alter table obsidian_settings add column if not exists alerte_treso boolean not null default false;
