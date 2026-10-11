"use client";
import { useState } from "react";
import { money } from "@/lib/money";
import { GroupeInput } from "@/components/GroupeInput";
import { useGroupes } from "@/lib/groupes";
import { Fournisseur, refAchat, moinsCher, marge } from "@/lib/fournisseurs";

// Fournisseurs (prix d'achat) d'un produit du Tableau des prix + marge par rapport au prix de vente de reference.
export function FournisseursPanel({ categorie, produit, vente, list, onChange, canEdit = true }: {
  categorie: "drogue" | "arme" | "accessoire"; produit: string; vente: number; list: Fournisseur[]; onChange: () => void; canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<string | null>(null);
  const empty = { qui: "", groupe: "", telephone: "", prix_achat: "" as any, prefere: false };
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);
  const groupes = useGroupes();
  const ref = refAchat(list), cheap = moinsCher(list);
  const mg = ref ? marge(vente, ref.prix_achat) : null;

  async function call(method: string, body: any) {
    setBusy(true);
    const r = await fetch("/api/obsidian/fournisseurs", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const out = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { alert("❌ " + (out.error || "Erreur")); return false; }
    onChange(); return true;
  }
  async function save() {
    const body = { ...form, prix_achat: Number(form.prix_achat), categorie, produit: produit.trim() };
    const ok = edit ? await call("PATCH", { ...body, id: edit }) : await call("POST", body);
    if (ok) { setEdit(null); setForm(empty); }
  }
  const col = { fontSize: "0.7rem", color: "var(--text-dim)" } as const;

  return (
    <div style={{ marginTop: "0.5rem", borderTop: "1px dashed var(--border)", paddingTop: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ fontSize: "0.75rem" }}>
          {ref ? <>
            <span style={col}>Achat réf. </span><b style={{ color: "var(--text)" }}>{money(ref.prix_achat)}</b>
            {mg && vente > 0 && <> · <span style={col}>Marge </span><b style={{ color: mg.val >= 0 ? "var(--success)" : "var(--danger)" }}>{money(mg.val)} ({mg.pct.toFixed(0)}%)</b></>}
          </> : <span style={col}>Aucun fournisseur</span>}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)}>🛒 {list.length} {open ? "▲" : "▼"}</button>
      </div>
      {open && <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {list.map(f => (
          <div key={f.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "0.4rem 0.5rem", fontSize: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.4rem", alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <b>{f.qui}</b>{f.groupe && <span style={col}> · {f.groupe}</span>}
                <div style={col}>{f.telephone ? "📞 " + f.telephone : "pas de numéro"}</div>
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <b style={{ color: "var(--gold)" }}>{money(f.prix_achat)}</b>
                <div style={{ fontSize: "0.62rem" }}>
                  {ref?.id === f.id && <span style={{ color: "var(--success)" }}>● réf. </span>}
                  {f.prefere && <span style={{ color: "var(--gold)" }}>⭐ préféré </span>}
                  {cheap?.id === f.id && <span style={{ color: "var(--text-dim)" }}>moins cher</span>}
                </div>
              </div>
            </div>
            {canEdit && <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.3rem" }}>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => call("PATCH", { id: f.id, prefere: !f.prefere })}>{f.prefere ? "⭐ Retirer" : "☆ Préféré"}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEdit(f.id); setForm({ qui: f.qui, groupe: f.groupe || "", telephone: f.telephone || "", prix_achat: f.prix_achat, prefere: f.prefere }); }}>✏️</button>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} disabled={busy} onClick={() => { if (window.confirm(`Supprimer ${f.qui} ?`)) call("DELETE", { id: f.id }); }}>🗑️</button>
            </div>}
          </div>
        ))}
        {canEdit && <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <div style={col}>{edit ? "Modifier le fournisseur" : "+ Ajouter un fournisseur"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem" }}>
            <input placeholder="À qui (nom)" value={form.qui} onChange={e => setForm((f: any) => ({ ...f, qui: e.target.value }))} />
            <GroupeInput groupes={groupes} value={form.groupe} onChange={v => setForm((f: any) => ({ ...f, groupe: v }))} />
            <input placeholder="Téléphone" value={form.telephone} onChange={e => setForm((f: any) => ({ ...f, telephone: e.target.value }))} />
            <input type="number" min={0} placeholder="Prix d'achat" value={form.prix_achat} onChange={e => setForm((f: any) => ({ ...f, prix_achat: e.target.value }))} />
          </div>
          <label style={{ fontSize: "0.72rem", display: "flex", gap: "0.35rem", alignItems: "center" }}><input type="checkbox" style={{ width: "auto" }} checked={form.prefere} onChange={e => setForm((f: any) => ({ ...f, prefere: e.target.checked }))} /> Fournisseur préféré (sinon : le moins cher)</label>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <button className="btn btn-gold btn-sm" style={{ flex: 1 }} disabled={busy || !form.qui.trim() || !(Number(form.prix_achat) > 0)} onClick={save}>{edit ? "OK" : "+ Ajouter"}</button>
            {edit && <button className="btn btn-ghost btn-sm" onClick={() => { setEdit(null); setForm(empty); }}>✕</button>}
          </div>
        </div>}
      </div>}
    </div>
  );
}
