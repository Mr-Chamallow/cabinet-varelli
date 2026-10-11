"use client";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { vehAutorises, vehInterdits, vehNote } from "@/lib/regles";
import { VEH_LIST, vehInfo, fmtPrix } from "@/lib/vehicules";

// Pense-bete : vehicules qu'on peut acheter (organisation, lore mixte) et ceux a eviter.
export function VehiculesPenseBete({ onClose, onPick }: { onClose: () => void; onPick?: (nom: string) => void }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"ok" | "non">("ok");
  const ok = useMemo(() => vehAutorises(), []);
  const non = useMemo(() => vehInterdits(), []);
  const ql = q.trim().toLowerCase();
  const list = (tab === "ok" ? ok.map(v => ({ v, note: vehNote(v.nom) })) : non).filter(x => !ql || x.v.nom.toLowerCase().includes(ql) || x.v.cat.toLowerCase().includes(ql) || x.v.code.includes(ql));
  const cats = [...new Set(list.map(x => x.v.cat))];
  return (
    <Modal title="📋 Pense-bête véhicules" size="lg" onClose={onClose}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
        <button className={`btn btn-sm ${tab === "ok" ? "btn-gold" : "btn-outline"}`} onClick={() => setTab("ok")}>✅ Achetables ({ok.length})</button>
        <button className={`btn btn-sm ${tab === "non" ? "btn-gold" : "btn-outline"}`} onClick={() => setTab("non")}>🚫 À éviter ({non.length})</button>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher un modèle ou une catégorie" style={{ flex: 1, minWidth: 180 }} />
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
        Base : catalogue illégal FlashBackFA (interdictions par type de groupe) et règlement. Organisation, lore mixte. {VEH_LIST.length} modèles connus. Les pastilles orange sont autorisées avec précaution (survole pour voir pourquoi).
      </div>
      <div style={{ maxHeight: "58vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {cats.map(c => (
          <div key={c}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--gold)", marginBottom: "0.25rem" }}>{c}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {list.filter(x => x.v.cat === c).map(({ v, note }) => {
                const col = note?.niveau === "interdit" ? "var(--danger)" : note?.niveau === "attention" ? "var(--warning)" : "var(--text-muted)";
                return <button key={v.code} type="button" title={[note?.texte || v.code, vehInfo(v.code)?.vitesse ? `${vehInfo(v.code)!.vitesse} km/h · coffre ${vehInfo(v.code)!.coffre} kg · ${vehInfo(v.code)!.places} pl.` : ""].filter(Boolean).join(" · ")} onClick={() => onPick?.(v.nom)} style={{ cursor: onPick ? "pointer" : "default", fontSize: "0.7rem", padding: "0.12rem 0.55rem", borderRadius: 999, background: "transparent", border: `1px solid ${note ? col : "var(--border)"}`, color: col, fontFamily: "inherit" }}>{v.nom}{vehInfo(v.code) && <span style={{ opacity: 0.6 }}> · {fmtPrix(vehInfo(v.code)!.prix)}</span>}</button>;
              })}
            </div>
          </div>
        ))}
        {cats.length === 0 && <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>Aucun résultat.</div>}
      </div>
    </Modal>
  );
}
