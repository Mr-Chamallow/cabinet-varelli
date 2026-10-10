"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/Modal";
import { CardGallery } from "@/components/CardGallery";
import { useGmAccess } from "@/components/gm/bits";
import { roleRP } from "@/lib/rolesRP";

const NODES: Record<string, { role: string; titre: string; desc: string }> = {
  dg: { role: "CEO - Directeur général", titre: "Directeur général (CEO)", desc: "Visage public du consortium lors des grands événements. N'intervient que pour trancher les litiges que personne d'autre ne peut régler. Juge suprême des Procès de l'Ombre." },
  do: { role: "COO - Directrice opérationnel", titre: "Directeur Opérationnel (COO)", desc: "Gère les événements sur le terrain : contacte les groupes pour proposer les contrats de convoi, organise les ventes aux enchères." },
  rj: { role: "Responsable juridique", titre: "Responsable juridique (CLO)", desc: "Ancien procureur général corrompu. Sa présence à une table signifie que le cadre légal du crime va être appliqué. Lit l'acte d'accusation au Tribunal de l'Ombre." },
  aj: { role: "Agent juridique", titre: "Agent juridique (Enquêteur)", desc: "Yeux et oreilles d'Obsidian : infiltrent les scènes, observent les flux, notent qui respecte les traités et fournissent le RP d'enquête." },
  rl: { role: "Responsable logistique", titre: "Responsable logistique", desc: "Contrôle les ressources physiques : maître des hangars de Blaine County et des cargaisons de Cayo Perico." },
  al: { role: "Agent logistique", titre: "Agent logistique (Transporteur)", desc: "L'élite du transport : chauffeurs et pilotes, conduite irréprochable, discrétion absolue." },
  rs: { role: "Responsable sécurité", titre: "Responsable sécurité (CSO)", desc: "Ancien haut gradé militaire. Gardien de la neutralité : si un coup de feu éclate en médiation, nettoie la zone de manière chirurgicale." },
  as: { role: "Agent de sécurité", titre: "Agent de sécurité (Exécuteur / Garde)", desc: "Security Operators : sécurisent les convois majeurs, gardent les infrastructures et capturent les cibles condamnées par le Tribunal." },
  op: { role: "Opérateur", titre: "Opérateur", desc: "Membre confirmé, pleinement intégré aux opérations et affecté à son pôle." },
  st: { role: "Opérateur stagiaire", titre: "Opérateur Stagiaire", desc: "Membre en période de test, sous surveillance de sa hiérarchie, avant titularisation." },
};
// Rôles du site qui comptent aussi pour un poste (le Patron = CEO).
const EXTRA: Record<string, string[]> = { dg: ["Associé / Patron"] };
const POLES = [
  { titre: "⚖️ Pôle Juridique", color: "#a78bfa", keys: ["rj", "aj"] },
  { titre: "📦 Pôle Logistique", color: "var(--gold)", keys: ["rl", "al"] },
  { titre: "🛡️ Pôle Sécurité", color: "var(--danger)", keys: ["rs", "as"] },
];

export default function OrganigrammePage() {
  useGmAccess("organigramme");
  const [gallery, setGallery] = useState(false);
  const [members, setMembers] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("site_logins").select("discord_id,discord_name,nom_perso,site_role"),
      supabase.from("obsidian_employes").select("discord_id,nom"),
    ]).then(([{ data }, { data: emps }]) => {
      const byId: Record<string, string> = {}; (emps || []).forEach((e: any) => { if (e.discord_id) byId[e.discord_id] = e.nom; });
      const m: Record<string, string[]> = {};
      // Toujours Prénom Nom (jamais le pseudo Discord si on connaît le personnage).
      (data || []).forEach((r: any) => { if (r.site_role) (m[r.site_role] ??= []).push(r.nom_perso || byId[r.discord_id] || r.discord_name); });
      setMembers(m);
    });
  }, []);

  const Node = ({ k, color }: { k: string; color?: string }) => {
    const n = NODES[k]; const who = Array.from(new Set([n.role, ...(EXTRA[k] || [])].flatMap(r => members[r] || [])));
    return (
      <div className="card" style={{ padding: "0.75rem 0.9rem", borderTop: `3px solid ${color || "var(--gold)"}` }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{n.titre}</div>
        {roleRP(n.role) && <div style={{ fontStyle: "italic", fontSize: "0.74rem", color: "var(--gold)" }}>« {roleRP(n.role)!.surnom} »</div>}
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
      <div className="page-header"><div><h1 className="page-title">🏛️ Organigramme</h1><p className="page-subtitle">Direction & gouvernance · Obsidian Logistics</p><div className="gold-line" /></div><button className="btn btn-outline" onClick={() => setGallery(true)}>🪪 Cartes par grade</button></div>
      <div className="section-title" style={{ marginBottom: "0.6rem" }}>👑 Directoire exécutif (Niveau Écarlate)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}><Node k="dg" /><Node k="do" /></div>
      <div className="org-link" aria-hidden="true"><i /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1rem", marginBottom: "0" }}>
        {POLES.map(p => (
          <div key={p.titre}>
            <div className="section-title" style={{ marginBottom: "0.6rem", color: p.color }}>{p.titre}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>{p.keys.map(k => <Node key={k} k={k} color={p.color} />)}</div>
          </div>
        ))}
      </div>
      <div className="org-link" aria-hidden="true"><i /></div>
      <div className="section-title" style={{ marginBottom: "0.6rem" }}>🧑‍💼 Membres</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "0.75rem" }}><Node k="op" color="var(--info)" /><Node k="st" color="var(--text-dim)" /></div>
      {gallery && <Modal size="lg" title="🪪 Une carte par rôle et par grade" onClose={() => setGallery(false)}><div style={{ maxHeight: "70vh", overflowY: "auto" }}><CardGallery /></div></Modal>}
    </div>
  );
}
