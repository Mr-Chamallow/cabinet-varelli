"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { hasPermission } from "@/lib/auth";
import { money } from "@/lib/money";
import { weekStartOf } from "@/lib/weekStart";

const STATUT: Record<string, { l: string; c: string }> = {
  en_attente: { l: "⏳ En attente de validation", c: "var(--warning)" },
  valide: { l: "✅ Validé", c: "var(--success)" },
  refuse: { l: "❌ Refusé", c: "var(--danger)" },
};

export default function DonsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_dons"))) window.location.href = "/"; }, [user, userLoading]);

  const [dons, setDons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [montant, setMontant] = useState(0);
  const [argent, setArgent] = useState<"propre" | "sale">("propre");
  const [motif, setMotif] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  useEffect(() => { load(); }, [user?.nom]);
  useRealtimeTable(["obsidian_dons"], load);
  async function load() {
    if (!supabase || !user?.nom) return;
    const { data } = await supabase.from("obsidian_dons").select("*").eq("employe", user.nom).order("created_at", { ascending: false }).limit(200);
    setDons(data || []); setLoading(false);
  }

  function pick(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function envoyer() {
    if (!(montant > 0)) { showToast("Indique un montant"); return; }
    setSaving(true);
    const fd = new FormData();
    fd.set("montant", String(montant)); fd.set("type_argent", argent); fd.set("motif", motif); fd.set("semaine", weekStartOf());
    if (file) fd.set("preuve", file);
    const res = await fetch("/api/obsidian/dons", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { alert("❌ " + (data.error || "Erreur")); return; }
    showToast("Don envoyé, en attente de validation");
    setMontant(0); setMotif(""); pick(null); load();
  }

  const valides = dons.filter(d => d.statut === "valide").reduce((s, d) => s + Number(d.montant), 0);

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">Obsidian Logistics</a>
      <div className="page-header"><div><h1 className="page-title">🎁 Dons</h1><p className="page-subtitle">Remets de l'argent à l'entreprise · propre ou sale · ajouté à la caisse une fois validé</p><div className="gold-line" /></div></div>

      <div className="card" style={{ maxWidth: 480, marginBottom: "1.5rem" }}>
        <div className="section-title" style={{ marginBottom: "1rem" }}>Nouveau don</div>
        <div className="form-group"><label>Montant ($)</label><input type="number" min={0} value={montant || ""} onChange={e => setMontant(+e.target.value)} placeholder="1.000" /></div>
        <div className="form-group"><label>Type d'argent</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["propre", "sale"] as const).map(t => <button key={t} type="button" className={`btn btn-sm ${argent === t ? "btn-gold" : "btn-outline"}`} onClick={() => setArgent(t)}>{t === "propre" ? "💵 Propre" : "🕶️ Sale"}</button>)}
          </div>
        </div>
        <div className="form-group"><label>Motif (facultatif)</label><input value={motif} onChange={e => setMotif(e.target.value)} placeholder="Pour l'achat de l'entrepôt" /></div>
        <div className="form-group"><label>Photo de preuve (facultatif)</label>
          <input type="file" accept="image/*" onChange={e => pick(e.target.files?.[0] || null)} />
          {preview && <img src={preview} alt="preuve" style={{ marginTop: 8, maxWidth: "100%", maxHeight: 180, borderRadius: 8, border: "1px solid var(--border)" }} />}
        </div>
        <button className="btn btn-gold" onClick={envoyer} disabled={saving}>{saving ? "..." : "Envoyer le don"}</button>
        <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.75rem" }}>Une fois validé, le montant est ajouté à la caisse (propre ou sale). Un don n'est pas déduit de ta paie.</p>
      </div>

      <div className="section-title" style={{ marginBottom: "0.75rem" }}>Mes dons · {money(valides)} validés</div>
      {loading ? <LoadingBlock /> : dons.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🎁</div><div className="empty-title">Aucun don pour l'instant</div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {dons.map(d => (
            <div key={d.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700 }}>{money(d.montant)} · {d.type_argent === "propre" ? "💵 propre" : "🕶️ sale"}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{new Date(d.created_at).toLocaleString("fr-FR")}{d.motif ? ` · ${d.motif}` : ""}</div>
              </div>
              {d.preuve_url && <a href={`/api/obsidian/dons/preuve?id=${d.id}`} target="_blank" rel="noreferrer"><img src={`/api/obsidian/dons/preuve?id=${d.id}`} alt="preuve" style={{ height: 44, borderRadius: 6, border: "1px solid var(--border)" }} /></a>}
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: STATUT[d.statut]?.c }}>{STATUT[d.statut]?.l || d.statut}</span>
            </div>
          ))}
        </div>
      )}
      <Toast toast={toast} />
    </div>
  );
}
