"use client";
import type { Row } from "@/lib/types";
import { lire } from "@/lib/lire";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { scoreOf, scoreLabel } from "@/lib/gmApi";

// Vue "tout sur le groupe" : réputation, pactes, audits, fiches et autres dossiers liés au même groupe.
const Pill = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", textDecoration: "none" }}>{children}</a>
);

export function OrgLinks({ organisation, excludeDossierId }: { organisation?: string | null; excludeDossierId?: string }) {
  const [d, setD] = useState<Row | null>(null);
  useEffect(() => {
    if (!supabase || !organisation) return;
    let off = false;
    (async () => {
      const [pa, au, fi, tr, rp] = await Promise.all([
        lire("gm_pactes", { select: "id,statut,date_fin", eq: [["organisation", organisation]] }),
        lire("gm_audits", { select: "id,note,created_at", eq: [["organisation", organisation]], order: [["created_at", false]], limit: 3 }),
        lire("obsidian_fiches", { select: "id,nom", eq: [["organisation", organisation]], limit: 8 }),
        lire("tribunal_dossiers", { select: "id,titre,verdict", eq: [["organisation", organisation]] }),
        lire("gm_reputation_log", { select: "delta", eq: [["organisation", organisation]] }),
      ]);
      if (!off) setD({ pactes: pa.data || [], audits: au.data || [], fiches: fi.data || [], dossiers: (tr.data || []).filter((x: Row) => x.id !== excludeDossierId), score: scoreOf((rp.data || []).map((x: Row) => x.delta)) });
    })();
    return () => { off = true; };
  }, [organisation, excludeDossierId]);
  if (!organisation) return null;
  const lab = d ? scoreLabel(d.score) : null;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.6rem 0.75rem", background: "var(--surface)" }}>
      <div style={{ fontWeight: 700, marginBottom: "0.4rem" }}>🔗 Tout sur {organisation}</div>
      {!d ? <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Chargement...</span> : (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <Pill href="/obsidian/reputation">⭐ Réputation {d.score}/100{lab ? ` · ${lab.label}` : ""}</Pill>
          {d.pactes.map((p: Row) => <Pill key={p.id} href="/obsidian/pactes">🤝 Pacte {p.statut}</Pill>)}
          {d.audits.map((a: Row) => <Pill key={a.id} href="/obsidian/audits">🔎 Audit {a.note}/10</Pill>)}
          {d.fiches.map((f: Row) => <Pill key={f.id} href="/obsidian/fiches">🗂️ {f.nom}</Pill>)}
          {d.dossiers.map((x: Row) => <Pill key={x.id} href="/obsidian/tribunal">⚖️ {x.titre}{x.verdict !== "en_cours" ? ` (${x.verdict})` : ""}</Pill>)}
          {!d.pactes.length && !d.audits.length && !d.fiches.length && !d.dossiers.length && <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Aucun pacte, audit, fiche ni autre dossier lié.</span>}
        </div>
      )}
    </div>
  );
}
