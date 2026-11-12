"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

// Grille des honoraires en carrousel : une fiche par prestation (image, description, prix)
// et un second onglet pour les offres groupées
export default function TarifsCabinet() {
  const [rows, setRows] = useState<any[]>([]);
  const [offres, setOffres] = useState<any[]>([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<"prestations" | "offres">("prestations");
  const [categorie, setCategorie] = useState("Toutes");

  useEffect(() => {
    Promise.all([
      fetch("/api/cabinet/cabinet_tarifs").then(r => r.json()),
      fetch("/api/cabinet/cabinet_offres").then(r => r.json()),
    ])
      .then(([t, o]) => {
        if (t.error) setErreur(t.error);
        else setRows(t.rows || []);
        if (!o.error) setOffres(o.rows || []);
      })
      .finally(() => setChargement(false));
  }, []);

  const triees = useMemo(() => [...rows].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)), [rows]);
  const categories = useMemo(() => ["Toutes", ...Array.from(new Set(triees.map(t => t.categorie || "Général")))], [triees]);
  const prestations = useMemo(
    () => triees.filter(t => categorie === "Toutes" || (t.categorie || "Général") === categorie),
    [triees, categorie]
  );

  const fichesPrestations = prestations.map(t => ({
    quote: t.description || "Prestation proposée par le cabinet.",
    name: t.nom,
    designation: `${t.categorie || "Général"} · ${t.prix || "Sur devis"}`,
    src: t.image_url || "",
  }));

  const fichesOffres = [...offres]
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
    .map(o => {
      const inclus = (o.prestations || "").split("\n").map((x: string) => x.trim()).filter(Boolean);
      const texte = [o.description, inclus.length ? `Inclus : ${inclus.join(", ")}.` : ""].filter(Boolean).join(" ");
      return {
        quote: texte || "Offre groupée proposée par le cabinet.",
        name: o.nom,
        designation: o.prix || "Sur devis",
        src: o.image_url || "",
      };
    });

  if (chargement) return <div className="cab-muted">Chargement de la grille...</div>;
  if (erreur) return <div style={{ color: "#f87171" }}>{erreur}</div>;

  const bouton = (actif: boolean): React.CSSProperties => ({
    padding: "0.45rem 0.9rem", borderRadius: 999, cursor: "pointer", fontSize: "0.8rem",
    border: `1px solid ${actif ? "var(--gold)" : "var(--border, #333)"}`,
    background: actif ? "rgba(176,138,62,0.15)" : "transparent",
    color: actif ? "var(--gold)" : "inherit",
  });

  return (
    <div>
      {/* Bandeau d'introduction */}
      <div style={{
        border: "1px solid var(--gold)", borderRadius: "var(--radius)", padding: "1rem 1.2rem", marginBottom: "1.2rem",
        background: "linear-gradient(135deg, rgba(176,138,62,0.12), rgba(176,138,62,0.02))",
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", letterSpacing: "0.12em", fontSize: "0.78rem", textTransform: "uppercase", marginBottom: "0.3rem" }}>
          Honoraires
        </div>
        <div style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
          Chaque prestation est présentée à titre indicatif. Les montants peuvent évoluer selon les éléments extérieurs au cabinet.
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
        <button style={bouton(onglet === "prestations")} onClick={() => setOnglet("prestations")}>Prestations</button>
        <button style={bouton(onglet === "offres")} onClick={() => setOnglet("offres")}>Offres groupées</button>
      </div>

      {onglet === "prestations" && (
        <>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            {categories.map(c => (
              <button key={c} style={bouton(categorie === c)} onClick={() => setCategorie(c)}>{c}</button>
            ))}
          </div>
          {fichesPrestations.length === 0
            ? <div className="empty-state"><div className="empty-title">Grille en cours de mise à jour</div></div>
            : <AnimatedTestimonials key={categorie} testimonials={fichesPrestations} />}
        </>
      )}

      {onglet === "offres" && (
        fichesOffres.length === 0
          ? <div className="empty-state"><div className="empty-title">Aucune offre groupée pour le moment</div></div>
          : <AnimatedTestimonials testimonials={fichesOffres} />
      )}
    </div>
  );
}
