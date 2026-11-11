"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CabinetShell from "@/components/cabinet/CabinetShell";
import { estStaffUser } from "@/lib/cabinetRoles";

const SALONS = [
  { slug: "salon-general", nom: "Salon général" },
  { slug: "salon-juridique", nom: "Liaison secrétaire juridique" },
];

function Liste() {
  const [staff, setStaff] = useState<any[]>([]);
  useEffect(() => { fetch("/api/cabinet/staff").then(r => r.json()).then(d => setStaff(d.rows || [])); }, []);

  const lien: React.CSSProperties = { textDecoration: "none", color: "inherit", display: "block" };

  return (
    <div>
      <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", marginBottom: "0.6rem" }}>Salons</div>
      {SALONS.map(s => (
        <Link key={s.slug} href={`/avocat/messagerie/${s.slug}`} style={lien}>
          <div className="cab-card" style={{ marginBottom: "0.5rem", fontWeight: 600 }}>{s.nom}</div>
        </Link>
      ))}

      <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", margin: "1.4rem 0 0.6rem" }}>Vie interne</div>
      <Link href="/avocat/votes" style={lien}>
        <div className="cab-card" style={{ marginBottom: "0.5rem" }}>
          <div style={{ fontWeight: 600 }}>Votes</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Proposer un changement et voter</div>
        </div>
      </Link>
      <Link href="/avocat/plaintes" style={lien}>
        <div className="cab-card" style={{ marginBottom: "0.5rem" }}>
          <div style={{ fontWeight: 600 }}>Plaintes internes</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Visibles uniquement par la direction et par toi</div>
        </div>
      </Link>

      <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", margin: "1.4rem 0 0.6rem" }}>Bureaux</div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "0.6rem" }}>
        Chaque avocat a son bureau. On y dépose des notes et des messages, visibles par tous les employés.
      </div>
      {staff.map(s => (
        <Link key={s.discord_id} href={`/avocat/messagerie/bureau-${s.discord_id}`} style={lien}>
          <div className="cab-card" style={{ marginBottom: "0.5rem" }}>
            <div style={{ fontWeight: 600 }}>Bureau de {s.nom}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{s.role}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Messagerie interne : réservée aux employés du cabinet (jamais aux clients)
export default function Page() {
  return (
    <CabinetShell title="Messagerie interne" icon="" desc="Salons, votes, plaintes et bureaux" perms={["cabinet_dossiers", "cabinet_rdv"]}>
      {(user) => estStaffUser(user)
        ? <Liste />
        : <div className="empty-state"><div className="empty-title">Réservé aux employés</div></div>}
    </CabinetShell>
  );
}
