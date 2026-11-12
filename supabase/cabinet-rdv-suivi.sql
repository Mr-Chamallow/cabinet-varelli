-- Suivi des RDV : report (ancien créneau, qui a reporté). Les nouveaux statuts (en_cours, reporte) n'ont pas besoin de contrainte.
alter table cabinet_rdv add column if not exists date_precedente timestamp without time zone;
alter table cabinet_rdv add column if not exists reporte_par text;
