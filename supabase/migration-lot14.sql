-- ============================================================
-- LOT 14 — Compta cohérente : achats de stock, paies, contrats, clôture hebdo
-- ============================================================

-- 0) Réparation des semaines (l'ancienne version rangeait le dimanche dans la semaine suivante)
update obsidian_comptabilite
   set semaine = date_trunc('week', created_at at time zone 'Europe/Paris')::date
 where source in ('action','arrestation')
   and semaine is distinct from date_trunc('week', created_at at time zone 'Europe/Paris')::date;

-- 1) Semaines clôturées
create table if not exists obsidian_semaines (
  semaine date primary key,
  cloturee_at timestamptz default now(),
  cloturee_par text default 'auto',
  recettes numeric default 0,
  depenses numeric default 0,
  net numeric default 0,
  paies numeric default 0,
  nb integer default 0
);
alter table obsidian_semaines enable row level security;
drop policy if exists "semaines_read" on obsidian_semaines;
create policy "semaines_read" on obsidian_semaines for select using (true);

-- Verrou : plus d'écriture dans une semaine clôturée (sauf régularisation de PAIE, qui se comptabilise dans la bonne semaine)
create or replace function obsidian_compta_lock() returns trigger language plpgsql as $$
declare w date; s text;
begin
  if tg_op = 'DELETE' then w := old.semaine; s := old.source; else w := new.semaine; s := new.source; end if;
  if s = 'paie' then return coalesce(new, old); end if;
  if w is not null and exists (select 1 from obsidian_semaines where semaine = w) then
    raise exception 'Semaine du % clôturée : écriture impossible', to_char(w, 'DD/MM/YYYY');
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists trg_compta_lock on obsidian_comptabilite;
create trigger trg_compta_lock before insert or update or delete on obsidian_comptabilite
  for each row execute function obsidian_compta_lock();

-- Clôture de toutes les semaines terminées (heure de Paris). Idempotente.
create or replace function obsidian_cloturer_semaines(p_par text default 'auto') returns integer
language plpgsql security definer set search_path = public as $$
declare w date; cur_w date; start_w date; n integer := 0;
begin
  cur_w := date_trunc('week', now() at time zone 'Europe/Paris')::date;
  select min(semaine) into start_w from obsidian_comptabilite;
  if start_w is null then return 0; end if;
  w := start_w;
  while w < cur_w loop
    if not exists (select 1 from obsidian_semaines where semaine = w) then
      insert into obsidian_semaines (semaine, cloturee_par, recettes, depenses, net, paies, nb)
      select w, p_par,
             coalesce(sum(case when type = 'recette' and coalesce(source,'') <> 'blanchiment' then montant end), 0),
             coalesce(sum(case when type <> 'recette' and coalesce(source,'') <> 'blanchiment' then montant end), 0),
             coalesce(sum(case when type = 'recette' then montant else -montant end), 0),
             coalesce(sum(case when source = 'paie' then montant end), 0),
             count(*)
        from obsidian_comptabilite where semaine = w;
      n := n + 1;
    end if;
    w := w + 7;
  end loop;
  return n;
end $$;
grant execute on function obsidian_cloturer_semaines(text) to anon, authenticated, service_role;

-- 2) Achats de stock → dépense (entrée valorisée)
create or replace function obsidian_stock_compta() returns trigger language plpgsql security definer set search_path = public as $$
declare cat text;
begin
  if tg_op = 'DELETE' then
    delete from obsidian_comptabilite where source = 'stock' and source_id = old.id; return old;
  end if;
  if new.type in ('entrée','entree') and coalesce(new.total, 0) > 0 and coalesce(new.motif, '') !~* '^annulation' then
    select categorie into cat from obsidian_stocks where id = new.stock_id;
    insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, created_at, source, source_id)
    values ('dépense', 'Achat stock — ' || coalesce(cat, 'divers'), new.total, 'sale',
            'Achat ' || new.quantite || ' × ' || new.stock_nom || ' à ' || coalesce(new.prix_unitaire, 0) || ' $', coalesce(new.membre, ''),
            date_trunc('week', new.created_at at time zone 'Europe/Paris')::date, coalesce(new.created_by, ''), new.created_at, 'stock', new.id);
  end if;
  return new;
end $$;
drop trigger if exists trg_stock_compta on obsidian_mouvements;
create trigger trg_stock_compta after insert or delete on obsidian_mouvements for each row execute function obsidian_stock_compta();

-- 3) Paies versées → dépense dans la BONNE semaine (celle de la paie, même si elle est déjà clôturée)
create or replace function obsidian_paie_compta() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    delete from obsidian_comptabilite where source = 'paie' and source_id = old.id; return old;
  end if;
  insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, created_at, source, source_id)
  values ('dépense', 'Paie & commissions', new.montant, 'propre', 'Paie semaine du ' || to_char(new.semaine, 'DD/MM') || ' — ' || new.employe, new.employe,
          new.semaine, coalesce(new.paid_by, ''), new.created_at, 'paie', new.id);
  return new;
end $$;
drop trigger if exists trg_paie_compta on obsidian_paiements;
create trigger trg_paie_compta after insert or delete on obsidian_paiements for each row execute function obsidian_paie_compta();

-- 4) Contrat terminé → recette (récompense encaissée)
create or replace function obsidian_contrat_compta() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    delete from obsidian_comptabilite where source = 'contrat' and source_id = old.id; return old;
  end if;
  if new.statut = 'Terminé' and coalesce(new.recompense, 0) > 0 then
    if exists (select 1 from obsidian_comptabilite where source = 'contrat' and source_id = new.id) then
      update obsidian_comptabilite set montant = new.recompense, motif = 'Contrat — ' || new.titre where source = 'contrat' and source_id = new.id;
    else
      insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, source, source_id)
      values ('recette', 'Contrat', new.recompense, 'propre', 'Contrat — ' || new.titre, coalesce(new.membres_affectes[1], ''),
              date_trunc('week', now() at time zone 'Europe/Paris')::date, coalesce(new.created_by, ''), 'contrat', new.id);
    end if;
  else
    delete from obsidian_comptabilite where source = 'contrat' and source_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists trg_contrat_compta on obsidian_contrats;
create trigger trg_contrat_compta after insert or update or delete on obsidian_contrats for each row execute function obsidian_contrat_compta();

-- 5) Rattrapage de l'existant (avant la première clôture)
insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, created_at, source, source_id)
select 'dépense', 'Paie & commissions', p.montant, 'propre', 'Paie semaine du ' || to_char(p.semaine,'DD/MM') || ' — ' || p.employe, p.employe, p.semaine, coalesce(p.paid_by,''), p.created_at, 'paie', p.id
  from obsidian_paiements p where not exists (select 1 from obsidian_comptabilite c where c.source = 'paie' and c.source_id = p.id);
insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, created_at, source, source_id)
select 'dépense', 'Achat stock — ' || coalesce(s.categorie,'divers'), m.total, 'sale', 'Achat ' || m.quantite || ' × ' || m.stock_nom, coalesce(m.membre,''),
       date_trunc('week', m.created_at at time zone 'Europe/Paris')::date, coalesce(m.created_by,''), m.created_at, 'stock', m.id
  from obsidian_mouvements m left join obsidian_stocks s on s.id = m.stock_id
 where m.type in ('entrée','entree') and coalesce(m.total,0) > 0 and coalesce(m.motif,'') !~* '^annulation'
   and not exists (select 1 from obsidian_comptabilite c where c.source = 'stock' and c.source_id = m.id);
insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, created_at, source, source_id)
select 'recette', 'Contrat', k.recompense, 'propre', 'Contrat — ' || k.titre, coalesce(k.membres_affectes[1],''),
       date_trunc('week', k.created_at at time zone 'Europe/Paris')::date, coalesce(k.created_by,''), k.created_at, 'contrat', k.id
  from obsidian_contrats k where k.statut = 'Terminé' and coalesce(k.recompense,0) > 0
   and not exists (select 1 from obsidian_comptabilite c where c.source = 'contrat' and c.source_id = k.id);

-- 6) Clôture automatique : chaque lundi à 00:00 (= dimanche 23:59:59) heure de Paris.
--    pg_cron tourne en UTC : on programme 22:00 ET 23:00 UTC le dimanche, la fonction ne ferme que les semaines réellement terminées.
do $$ begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname like 'obsidian-cloture%';
  perform cron.schedule('obsidian-cloture-ete',   '0 22 * * 0', $c$select obsidian_cloturer_semaines('auto')$c$);
  perform cron.schedule('obsidian-cloture-hiver', '0 23 * * 0', $c$select obsidian_cloturer_semaines('auto')$c$);
exception when others then
  raise notice 'pg_cron indisponible (%). La clôture se fera à la première ouverture du hub Comptabilité.', sqlerrm;
end $$;

-- 7) Première clôture : toutes les semaines déjà terminées (l'ancien historique est figé)
select obsidian_cloturer_semaines('migration');
