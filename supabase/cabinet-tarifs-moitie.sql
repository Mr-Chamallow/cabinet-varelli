-- Baisse officielle de 50 % de tous les tarifs (une seule fois : relancer ne re-divise pas).
-- Chaque changement est journalisé dans cabinet_tarifs_historique.
with base as (
  select t.id, t.nom, t.prix, t.prix_montant,
         coalesce(t.prix_montant, nullif(regexp_replace(coalesce(t.prix, ''), '\D', '', 'g'), '')::numeric) as ancien
  from cabinet_tarifs t
  where not exists (
    select 1 from cabinet_tarifs_historique h
    where h.tarif_id = t.id and h.auteur_nom = 'Baisse officielle 50 %'
  )
),
calc as (
  select id, nom, prix as ancien_texte, ancien,
         round(ancien / 2) as nouveau,
         regexp_replace(round(ancien / 2)::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g') || ' $' as nouveau_texte
  from base
  where ancien is not null
),
journal as (
  insert into cabinet_tarifs_historique (tarif_id, nom, ancien_prix, nouveau_prix, auteur_nom)
  select id, nom, ancien_texte, nouveau_texte, 'Baisse officielle 50 %' from calc
  returning tarif_id
)
update cabinet_tarifs t
set prix_montant = c.nouveau, prix = c.nouveau_texte
from calc c
where t.id = c.id;

-- Vérification
select nom, prix, prix_montant from cabinet_tarifs order by ordre;
