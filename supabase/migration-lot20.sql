-- Lot 20 : retire des rôles les permissions qui n'existent plus (H-47, Planification, Calculatrice).
update roles set permissions = (
  select coalesce(jsonb_agg(p), '[]'::jsonb)
  from jsonb_array_elements_text(permissions) p
  where regexp_replace(p, ':(read|write)$', '') not in ('h47', 'obsidian_planification', 'calculatrice')
)
where exists (
  select 1 from jsonb_array_elements_text(permissions) p
  where regexp_replace(p, ':(read|write)$', '') in ('h47', 'obsidian_planification', 'calculatrice')
);
