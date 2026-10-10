"use client";
import { roleRP } from "@/lib/rolesRP";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ObsLogo } from "@/components/ObsLogo";
import { Stamp } from "@/components/Stamp";
import { roleStyle, roleLabel, genderize, matricule, type CardEmploye } from "@/components/EmployeeCard";

// Dossier du personnel : chemise kraft, polaroïd, tampon, texte à la machine (même style que les fiches).
export function EmployeeDossier({ e }: { e: CardEmploye }) {
  const p = roleStyle(e.role);
  const [arr, setArr] = useState<any[]>([]);
  useEffect(() => { if (!supabase) return; supabase.from("arrestations").select("id,created_at,amende,argent_perdu,notes,membre").eq("membre", e.nom).order("created_at", { ascending: false }).limit(12).then(({ data }) => setArr(data || [])); }, [e.nom]);
  const since = e.created_at ? new Date(e.created_at).toLocaleDateString("fr-FR") : " - ";
  const rows: [string, any][] = [["Poste", roleLabel(e.role, e.genre)], ["Surnom", roleRP(e.role) ? `« ${roleRP(e.role)!.surnom} »${roleRP(e.role)!.sigle ? " (" + roleRP(e.role)!.sigle + ")" : ""}` : ""], ["Mission", roleRP(e.role)?.fonction], ["Service", p.nom], ["Fonction", genderize(p.titre, e.genre)], ["Habilitation", `${p.hab} / 5 - niveau ${p.niveau}`], ["Matricule", matricule(e.id)], ["Entrée", since], ["Téléphone", e.telephone], ["Email", e.email], ["RIB", e.rib]];
  return (
    <div className="fd">
      <div className="fd-tab">PERSONNEL N° {matricule(e.id)}</div>
      <div className="fd-paper">
        <div className="fd-head"><span style={{ display: "flex", alignItems: "center", gap: 8 }}><ObsLogo size={26} />OBSIDIAN LOGISTICS - RESSOURCES HUMAINES</span><span>{p.emblem} {p.nom}</span></div>
        <div className="fd-grid">
          <div className="fd-photos">
            <div className="fd-polaroid"><i className="fd-clip" />{e.photo_url ? <img src={e.photo_url} alt="" referrerPolicy="no-referrer" /> : <div className="fd-nophoto">PHOTO<br />MANQUANTE</div>}<small>AGENT</small></div>
          </div>
          <div className="fd-body">
            <div className="fd-name">{e.nom}</div>
            <div className="fd-stamp-act"><Stamp color={e.actif === false ? "red" : "green"} size="sm" rotate={7}>{e.actif === false ? "Inactif" : "En service"}</Stamp></div>
            <div className="fd-rows">{rows.filter(r => r[1]).map(([k, v]) => <div key={k}><b>{k}</b><i /><span>{v}</span></div>)}</div>
          </div>
        </div>
        <div className="fd-block"><b>Accès autorisés</b><p>{p.acces.join(" · ")}</p></div>
        <div className="fd-block"><b>Mention</b><p>{p.fn}</p></div>
        <div className="fd-block"><b>Casier - {arr.length} arrestation{arr.length > 1 ? "s" : ""}</b>
          {arr.length === 0 ? <p>Casier vierge.</p> : <div className="appar">{arr.map(a => <div key={a.id} className="appar-row"><small>{new Date(a.created_at).toLocaleDateString("fr-FR")}</small><span>Amende <b>{Number(a.amende || 0).toLocaleString("fr-FR")} $</b>{Number(a.argent_perdu) > 0 ? ` · perdu ${Number(a.argent_perdu).toLocaleString("fr-FR")} $` : ""}{a.notes ? ` - ${a.notes}` : ""}</span></div>)}</div>}
        </div>
        {e.notes && <div className="fd-block"><b>Observations</b><p>{e.notes}</p></div>}
        <div className="fd-foot">Document interne - Consortium Obsidian</div>
      </div>
    </div>
  );
}
