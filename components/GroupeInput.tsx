"use client";
import { useId } from "react";
import { GroupeRef, groupeExact } from "@/lib/groupes";

// Champ "groupe" : suggestions depuis la base (Base de donnees -> Groupes), correction automatique du nom a la sortie du champ.
export function GroupeInput({ value, onChange, groupes, placeholder = "Groupe", style }: { value: string; onChange: (v: string) => void; groupes: GroupeRef[]; placeholder?: string; style?: React.CSSProperties }) {
  const id = useId();
  const ex = groupeExact(groupes, value);
  return (
    <div style={{ minWidth: 0 }}>
      <input list={id} value={value} placeholder={placeholder} style={style}
        onChange={e => onChange(e.target.value)}
        onBlur={() => { if (ex && ex.nom !== value) onChange(ex.nom); }} />
      <datalist id={id}>{groupes.map(g => <option key={g.id} value={g.nom}>{g.type || ""}</option>)}</datalist>
      {value.trim() && <div style={{ fontSize: "0.62rem", marginTop: 2, color: ex ? "var(--success)" : "var(--text-dim)" }}>{ex ? "✔ groupe de la base" : "Hors base (texte libre) : crée-le dans Base de données > Groupes"}</div>}
    </div>
  );
}
