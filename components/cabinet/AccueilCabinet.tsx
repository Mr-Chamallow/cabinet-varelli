"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CartesMembres from "@/components/cabinet/CartesMembres";
import AvisCabinet from "@/components/cabinet/AvisCabinet";

// Page d'accueil du cabinet : présentation, domaines, équipe, avis clients
export default function AccueilCabinet({ staff = false }: { staff?: boolean }) {
  const [domaines, setDomaines] = useState<[string, number][]>([]);

  useEffect(() => {
    fetch("/api/cabinet/cabinet_tarifs").then(r => r.json()).then(d => {
      const compte: Record<string, number> = {};
      (d.rows || []).forEach((t: any) => { const c = t.categorie || "Autres"; compte[c] = (compte[c] || 0) + 1; });
      setDomaines(Object.entries(compte));
    });
  }, []);

  return (
    <div className="cab-stagger" style={{ display: "flex", flexDirection: "column", gap: "2.2rem", marginBottom: "2.2rem" }}>
      <section className="cab-card" style={{ padding: "1.6rem" }}>
        <p className="cab-muted" style={{ fontSize: "1rem", maxWidth: 640, margin: 0 }}>
          Un accompagnement juridique sérieux, discret et sur mesure. Choisis ce dont tu as besoin.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1.1rem" }}>
          <Link className="btn btn-gold btn-sm" href="/avocat/mon-espace">Mon espace</Link>
          {staff && <Link className="btn btn-outline btn-sm" href="/avocat/rdv">Prise de RDV</Link>}
          <Link className="btn btn-outline btn-sm" href="/avocat/dossiers">Ouvrir un dossier</Link>
          <Link className="btn btn-outline btn-sm" href="/avocat/tarifs">Voir les tarifs</Link>
        </div>
      </section>

      {domaines.length > 0 && (
        <section>
          <h2 className="cab-section-titre">Nos domaines</h2>
          <div className="cab-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1rem" }}>
            {domaines.map(([nom, n]) => (
              <Link key={nom} href="/avocat/tarifs" className="cab-link">
                <div className="cab-card">
                  <div className="cab-title" style={{ fontSize: "0.95rem" }}>{nom}</div>
                  <div className="cab-muted" style={{ marginTop: "0.3rem" }}>{n} prestation{n > 1 ? "s" : ""}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.8rem" }}>
          <h2 className="cab-section-titre" style={{ margin: 0 }}>Notre équipe</h2>
          <Link href="/avocat/organigramme" className="cab-muted" style={{ color: "var(--gold)" }}>Voir tout l&apos;organigramme</Link>
        </div>
        <CartesMembres />
      </section>

      <AvisCabinet />
    </div>
  );
}
