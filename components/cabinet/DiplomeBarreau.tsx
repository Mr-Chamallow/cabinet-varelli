"use client";
import { useId } from "react";

interface Props {
  nom: string;
  poste?: string;
  barreau?: string;
  numero?: string;
  annee?: string;
  specialites: string[];
  photo?: string;
  description?: string;
  onFermer: () => void;
}

// Coin orné (4 positions, retournées avec CSS)
const Coin = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => (
  <svg className={`cab-coin ${pos}`} viewBox="0 0 64 64" aria-hidden="true">
    <path d="M3 61 V17 Q3 3 17 3 H61" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10 54 V22 Q10 10 22 10 H54" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".6" />
    <path d="M16 30 Q16 16 30 16" fill="none" stroke="currentColor" strokeWidth="1" />
    <circle cx="20" cy="20" r="3" fill="currentColor" />
  </svg>
);

// Diplôme d'inscription au barreau : cadre double, coins ornés, filigrane, sceau gravé
export default function DiplomeBarreau({ nom, poste, barreau, numero, annee, specialites, photo, description, onFermer }: Props) {
  const uid = useId().replace(/:/g, "");
  const texteSceau = `CABINET VARELLI & ASSOCIÉS · BARREAU ${(barreau || "").toUpperCase()} · ORDRE DES AVOCATS · `;

  return (
    <div className="cab-diplome-grand" style={{ position: "relative" }}>
      <button className="cab-fermer" onClick={onFermer} aria-label="Fermer">×</button>
      <Coin pos="tl" /><Coin pos="tr" /><Coin pos="bl" /><Coin pos="br" />

      <div className="cab-diplome-haut">Cabinet Varelli & Associés</div>
      <div className="cab-ornement-diplome">═════════ ◆ ═════════</div>
      <div className="cab-titre-diplome">Diplôme d&apos;avocat</div>
      <div className="cab-decerne">Le Barreau atteste que</div>

      {photo && <img className="cab-photo" src={photo} alt={nom} style={{ width: 110, height: 110, marginTop: ".8rem" }} />}
      <div className="cab-nom-grand">{nom}</div>

      <div className="cab-texte-grand">
        a été admis au <b style={{ color: "var(--gold-light)" }}>Barreau {barreau || "du cabinet"}</b>
        {numero ? <> et inscrit sous le numéro <b style={{ color: "var(--gold-light)" }}>{numero}</b></> : null}
        {annee ? <> en <b style={{ color: "var(--gold-light)" }}>{annee}</b></> : null}.
      </div>
      {poste && <div className="cab-poste" style={{ marginTop: ".9rem" }}>{poste}</div>}

      {specialites.length > 0 && (
        <>
          <div className="cab-ornement-diplome" style={{ fontSize: ".6rem" }}>Domaines d&apos;exercice</div>
          <div className="cab-chips">{specialites.map(x => <span key={x} className="cab-chip">{x}</span>)}</div>
        </>
      )}
      {description && <p className="cab-texte-grand" style={{ fontStyle: "italic", marginTop: ".9rem" }}>« {description} »</p>}

      <div className="cab-pied">
        <svg viewBox="0 0 140 140" width="118" height="118" aria-label="Sceau du cabinet">
          <defs>
            <radialGradient id={`or${uid}`} cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#f0d88f" />
              <stop offset=".55" stopColor="#c9a24d" />
              <stop offset="1" stopColor="#7a5c24" />
            </radialGradient>
            <path id={`cercle${uid}`} d="M70,70 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0" />
          </defs>
          <circle cx="70" cy="70" r="68" fill={`url(#or${uid})`} />
          <circle cx="70" cy="70" r="60" fill="none" stroke="#3a2a0c" strokeWidth="1" />
          <circle cx="70" cy="70" r="40" fill="none" stroke="#3a2a0c" strokeWidth=".8" />
          <text fill="#2a1c06" fontFamily="Cinzel, serif" fontSize="8.4" letterSpacing="1.4">
            <textPath href={`#cercle${uid}`}>{texteSceau}</textPath>
          </text>
        </svg>
        <div className="cab-signature-bloc">
          <div className="cab-signature">{poste || "Cabinet Varelli & Associés"}</div>
          <div className="cab-ligne-signature" />
          <div className="cab-muted" style={{ fontSize: ".65rem" }}>Signature</div>
        </div>
      </div>

      <div className="cab-serie">N° DE SÉRIE CV-{(numero || "000").toUpperCase()}-{annee || "0000"}</div>
    </div>
  );
}
