"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useGmAccess } from "@/components/gm/bits";

const NODES: Record<string, { role: string; titre: string; desc: string }> = {
  dg: { role: "CEO - Directeur général", titre: "Directeur Général", desc: "Le Cerveau de l'organisation. Préside le conseil d'administration et incarne le « Juge Suprême » lors des Procès de l'Ombre." },
  do: { role: "COO - Directrice opérationnel", titre: "Directrice Opérationnelle", desc: "Bras droit exécutif : planifie les événements, valide les contrats de transit, contact de haut niveau avec les autres organisations." },
  rj: { role: "Responsable juridique", titre: "Responsable Juridique", desc: "L'Inquisiteur. Rédige les Pactes d'Obsidian et tient le rôle de « Procureur de l'Ombre »." },
  aj: { role: "Agent juridique", titre: "Agent Juridique", desc: "Les enquêteurs en costume : observent, récoltent preuves et informations, veillent au respect des pactes." },
  rl: { role: "Responsable logistique", titre: "Responsable Logistique", desc: "Le maître des flux : stocks, routes stratégiques de Blaine County, liaisons maritimes et aériennes avec Cayo Perico." },
  al: { role: "Agent logistique", titre: "Agent Logistique", desc: "L'élite du transport : chauffeurs et pilotes, conduite irréprochable, discrétion absolue." },
  rs: { role: "Responsable sécurité", titre: "Responsable Sécurité", desc: "Garant de l'inviolabilité : protection du Directoire, sécurité militaire, confidentialité des hangars." },
  as: { role: "Agent de sécurité", titre: "Agent Sécurité", desc: "Le bras armé : sécurise les convois majeurs et capture les cibles condamnées par le Tribunal de l'Ombre." },
  op: { role: "Opérateur", titre: "Opérateur", desc: "Membre confirmé, pleinement intégré aux opérations et affecté à son pôle." },
  st: { role: "Opérateur stagiaire", titre: "Opérateur Stagiaire", desc: "Membre en période de test, sous surveillance de sa hiérarchie, avant titularisation." },
};
const POLES = [
  { titre: "⚖️ Pôle Juridique", color: "#a78bfa", keys: ["rj", "aj"] },
  { titre: "📦 Pôle Logistique", color: "var(--gold)", keys: ["rl", "al"] },
  { titre: "🛡️ Pôle Sécurité", color: "var(--danger)", keys: ["rs", "as"] },
];

export default function OrganigrammePage() {
  useGmAccess("organigramme");
  const [members, setMembers] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (!supabase) return;
    supabase.from("site_logins").select("discord_name,site_role").then(({ data }) => {
      const m: Record<string, string[]> = {};
      (data || []).forEach((r: any) => { if (r.site_role) (m[r.site_role] ??= []).push(r.discord_name); });
      setMembers(m);
    });
  }, []);

  const Node = ({ k, color }: { k: string; color?: string }) => {
    const n = NODES[k]; const who = members[n.role] || [];
    return (
      <div className="card" style={{ padding: "0.75rem 0.9rem", borderTop: `3px solid ${color || "var(--gold)"}` }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{n.titre}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.25rem 0 0.5rem" }}>{n.desc}</div>
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
          {who.length === 0 ? <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>—</span> : who.map(w => <span key={w} style={{ fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)" }}>{w}</span>)}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard</a>
      <div className="page-header"><div><h1 className="page-title">🏛️ Organigramme</h1><p className="page-subtitle">Direction & gouvernance · Obsidian Logistics</p><div className="gold-line" /></div></div>
      <div className="section-title" style={{ marginBottom: "0.6rem" }}>👑 Directoire exécutif</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}><Node k="dg" /><Node k="do" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {POLES.map(p => (
          <div key={p.titre}>
            <div className="section-title" style={{ marginBottom: "0.6rem", color: p.color }}>{p.titre}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>{p.keys.map(k => <Node key={k} k={k} color={p.color} />)}</div>
          </div>
        ))}
      </div>
      <div className="section-title" style={{ marginBottom: "0.6rem" }}>🧑‍💼 Membres</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "0.75rem" }}><Node k="op" color="var(--info)" /><Node k="st" color="var(--text-dim)" /></div>
    </div>
  );
}
