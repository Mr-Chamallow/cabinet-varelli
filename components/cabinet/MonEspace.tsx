"use client";
import { montant } from "@/lib/montant";
import Link from "next/link";
import { useEffect, useState } from "react";

const dateFr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const dateHeure = (d: string) => new Date(d).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

const STATUT_RDV: Record<string, string> = { demande: "En attente de validation", attribue: "Avocat attribué", confirme: "Confirmé" };
const STATUT_DOSSIER: Record<string, { txt: string; color: string }> = {
  ouvert: { txt: "Ouvert", color: "#5fb878" },
  ferme: { txt: "Fermé", color: "#e0b050" },
};

const Badge = ({ txt, color }: { txt: string; color: string }) => (
  <span className="cab-badge" style={{ color, borderColor: `${color}66`, background: `${color}14` }}>{txt}</span>
);

// Espace client : vue globale de ses dossiers, factures et rendez-vous
export default function MonEspace() {
  const [data, setData] = useState<any>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch("/api/cabinet/mon-espace").then(r => r.json()).then(d => d.error ? setErreur(d.error) : setData(d));
  }, []);

  if (erreur) return <div style={{ color: "var(--danger)" }}>{erreur}</div>;
  if (!data) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;

  const enAttente = data.factures.filter((f: any) => f.statut !== "payee");
  const totalDu = enAttente.reduce((a: number, f: any) => a + Number(f.montant || 0), 0);
  const prochain = data.rdv[0];

  return (
    <div className="cab-stagger" style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
      {/* Indicateurs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1rem" }}>
        <div className="cab-card">
          <div className="cab-muted">Dossiers en cours</div>
          <div className="cab-title" style={{ fontSize: "1.8rem", marginTop: "0.3rem" }}>{data.dossiers.length}</div>
        </div>
        <div className="cab-card">
          <div className="cab-muted">Factures en attente</div>
          <div className="cab-title" style={{ fontSize: "1.8rem", marginTop: "0.3rem" }}>{montant(totalDu)}</div>
          <div className="cab-muted" style={{ fontSize: "0.75rem" }}>{enAttente.length} facture{enAttente.length > 1 ? "s" : ""}</div>
        </div>
        <div className="cab-card">
          <div className="cab-muted">Prochain rendez-vous</div>
          <div className="cab-title" style={{ fontSize: "0.95rem", marginTop: "0.5rem" }}>
            {prochain ? dateHeure(prochain.date_rdv) : "Aucun"}
          </div>
        </div>
      </div>

      {/* Dossiers */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.8rem" }}>
          <h2 className="cab-section-titre" style={{ margin: 0 }}>Mes dossiers en cours</h2>
          <Link href="/avocat/dossiers" className="cab-muted" style={{ color: "var(--gold)" }}>Ouvrir un dossier</Link>
        </div>
        {data.dossiers.length === 0 ? <div className="cab-muted">Aucun dossier en cours.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {data.dossiers.map((d: any) => {
              const s = STATUT_DOSSIER[d.statut] || { txt: d.statut, color: "var(--text-dim)" };
              return (
                <Link key={d.id} href={`/avocat/dossiers/${d.id}`} className="cab-link">
                  <div className="cab-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}># {d.titre}</div>
                      <div className="cab-muted" style={{ fontSize: "0.75rem" }}>{[d.prestation, dateFr(d.created_at)].filter(Boolean).join(" · ")}</div>
                    </div>
                    <Badge txt={s.txt} color={s.color} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Factures */}
      <section>
        <h2 className="cab-section-titre">Mes factures</h2>
        {data.factures.length === 0 ? <div className="cab-muted">Aucune facture pour le moment.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {data.factures.map((f: any) => {
              const payee = f.statut === "payee";
              return (
                <div key={f.id} className="cab-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{f.libelle}</div>
                    <div className="cab-muted" style={{ fontSize: "0.75rem" }}>
                      {f.date_echeance ? `Échéance : ${dateFr(f.date_echeance)}` : `Émise le ${dateFr(f.created_at)}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span className="cab-title">{montant(f.montant)}</span>
                    {payee ? <Badge txt="Payée" color="#5fb878" /> : <Badge txt="En attente" color="#e0b050" />}
                    <a className="btn btn-outline btn-sm" href={`/api/cabinet/factures/${f.id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Rendez-vous */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.8rem" }}>
          <h2 className="cab-section-titre" style={{ margin: 0 }}>Mes prochains rendez-vous</h2>
          <Link href="/avocat/rdv" className="cab-muted" style={{ color: "var(--gold)" }}>Prendre rendez-vous</Link>
        </div>
        {data.rdv.length === 0 ? <div className="cab-muted">Aucun rendez-vous à venir.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {data.rdv.map((r: any) => (
              <div key={r.id} className="cab-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{dateHeure(r.date_rdv)}</div>
                  <div className="cab-muted" style={{ fontSize: "0.75rem" }}>
                    {[r.prestation || r.motif, r.avocat_nom ? `avec ${r.avocat_nom}` : "avocat à définir"].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <Badge txt={STATUT_RDV[r.statut] || r.statut} color="#c9a24d" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
