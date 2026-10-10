"use client";
import { ObsLogo } from "@/components/ObsLogo";
import { useLayoutEffect, useRef, useState } from "react";

// Avis de recherche du Consortium : affiche papier vieilli, photo, récompense, tampon animé, recto/verso.
export interface WantedData { nom: string; alias?: string | null; organisation?: string | null; priorite?: string | null; prime?: number | string | null; photo_url?: string | null; photo_id?: string | null; motif?: string | null; age?: number | string | null; origine?: string | null; occupation?: string | null; vehicules?: string | null; tags?: string[] | null }
const BASE = 380;
const usd = (n: any) => (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function WantedPoster({ d }: { d: WantedData }) {
  const wrap = useRef<HTMLDivElement>(null); const [scale, setScale] = useState(1); const [back, setBack] = useState(false);
  useLayoutEffect(() => {
    const el = wrap.current; if (!el) return;
    const f = () => setScale(Math.min(1, el.clientWidth / BASE)); f();
    const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect();
  }, []);
  const hot = ["Critique", "Haute"].includes(d.priorite || "");
  const threat = d.priorite === "Critique" ? "EXTRÊME" : d.priorite === "Haute" ? "ÉLEVÉE" : d.priorite === "Basse" ? "FAIBLE" : "MODÉRÉE";
  const H = BASE * 1.38;
  return (
    <div>
      <div ref={wrap} style={{ width: "100%", maxWidth: BASE, margin: "0 auto", height: H * scale, perspective: 1200 }}>
        <div className={`wp-flip${back ? " back" : ""}`} style={{ width: BASE, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <div className="wp wp-front">
            <i className="wp-tape l" /><i className="wp-tape r" />
            <ObsLogo size={30} className="wp-logo" /><div className="wp-top">AVIS DE RECHERCHE<small>OBSIDIAN LOGISTICS · CONSORTIUM</small></div>
            <div className="wp-title">RECHERCHÉ</div>
            <div className="wp-photo">
              {d.photo_url ? <img src={d.photo_url} alt="" referrerPolicy="no-referrer" /> : <span>?</span>}
              {hot && <b className="wp-stamp">PRIORITAIRE</b>}
              {d.photo_id && <img className="wp-idc" src={d.photo_id} alt="" referrerPolicy="no-referrer" />}
            </div>
            <div className="wp-name">{d.nom}</div>
            {d.alias && <div className="wp-alias">dit « {d.alias} »</div>}
            {d.organisation && <div className="wp-org">🛡️ {d.organisation}</div>}
            <div className="wp-motif">{d.motif || "Pour atteinte aux intérêts du Consortium."}</div>
            <div className="wp-reward"><small>RÉCOMPENSE</small>{Number(d.prime) > 0 ? usd(d.prime) : "À NÉGOCIER"}</div>
            <div className="wp-foot">Tout renseignement : Tribunal de l'Ombre · Danger : <b>{threat}</b></div>
          </div>
          <div className="wp wp-verso">
            <ObsLogo size={30} className="wp-logo" />
            <div className="wp-top">SIGNALEMENT<small>NE PAS APPROCHER SANS ESCORTE</small></div>
            <div className="wp-vhead">
              {d.photo_url && <img className="wp-vph" src={d.photo_url} alt="" referrerPolicy="no-referrer" />}
              {d.photo_id && <img className="wp-vid" src={d.photo_id} alt="" referrerPolicy="no-referrer" />}
            </div>
            <div className="wp-vname">{d.nom}{d.alias ? <i> dit « {d.alias} »</i> : null}</div>
            <div className="wp-rows">
              {([["Âge", d.age ? `${d.age} ans` : "", 0], ["Origine", d.origine, 0], ["Occupation", d.occupation, 1], ["Groupe", d.organisation, 0], ["Danger", threat, 0], ["Véhicules", d.vehicules, 1], ["Signes", (d.tags || []).join(", "), 1], ["Motif", d.motif, 1]] as [string, any, number][]).filter(r => r[1]).map(([k, v, w]) => <div key={k} className={w ? "w2" : ""}><small>{k}</small><span>{v}</span></div>)}
            </div>
            <div className="wp-foot">Document interne - Consortium Obsidian</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}><button type="button" className="btn btn-outline btn-sm" onClick={() => setBack(b => !b)}>↻ {back ? "Recto" : "Verso"}</button></div>
    </div>
  );
}
