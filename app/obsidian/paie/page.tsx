"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";

function getWeekStart(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 - offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}
function toISO(d: Date) { return d.toISOString().split("T")[0]; }
function inWeek(dateStr: string, weekStart: Date) {
  const d = new Date(dateStr);
  const end = new Date(weekStart); end.setDate(end.getDate() + 7);
  return d >= weekStart && d < end;
}
const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

interface EmployeeRow {
  nom: string;
  revenus: number;
  depenses: number;
  benefice: number;
  commission: number;
  dejaPaye: number;
  restant: number;
}

export default function PaieObsidianPage() {
  const { user, loading: userLoading } = useCurrentUser();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_paie"))) { window.location.href = "/"; } }, [user, userLoading]);

  const [tab, setTab] = useState<"apercu" | "historique" | "reglages">("apercu");
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [compta, setCompta] = useState<any[]>([]);
  const [cahier, setCahier] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [pct, setPct] = useState(10);
  const [savingPct, setSavingPct] = useState(false);
  const [payAmount, setPayAmount] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  const weekStart = getWeekStart(weekOffset);
  const weekStartISO = toISO(weekStart);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const [{ data: m }, { data: c }, { data: cv }, { data: p }, { data: s }] = await Promise.all([
      supabase.from("obsidian_mouvements").select("*").eq("type", "sortie"),
      supabase.from("obsidian_comptabilite").select("*"),
      supabase.from("cahier_vente").select("*"),
      supabase.from("obsidian_paiements").select("*").order("created_at", { ascending: false }),
      supabase.from("obsidian_settings").select("*").eq("id", "default").maybeSingle(),
    ]);
    setMouvements(m || []);
    setCompta(c || []);
    setCahier(cv || []);
    setPaiements(p || []);
    if (s?.commission_pct != null) setPct(s.commission_pct);
    setLoading(false);
  }

  function showT(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  // ─── Agrégation par employé pour la semaine sélectionnée ───────────────────
  const rows: EmployeeRow[] = useMemo(() => {
    const map: Record<string, { revenus: number; depenses: number }> = {};
    const bump = (nom: string, rev: number, dep: number) => {
      if (!nom) return;
      if (!map[nom]) map[nom] = { revenus: 0, depenses: 0 };
      map[nom].revenus += rev;
      map[nom].depenses += dep;
    };

    // Stock/armurerie : sorties = ventes = revenu
    mouvements.forEach(m => {
      if (!inWeek(m.created_at, weekStart)) return;
      bump(m.membre || m.created_by, m.total || 0, 0);
    });

    // Compta manuelle Obsidian : recette = revenu, dépense = dépense perso
    compta.forEach(e => {
      if (e.semaine !== weekStartISO) return;
      if (e.type === "recette") bump(e.created_by, e.montant || 0, 0);
      else bump(e.created_by, 0, e.montant || 0);
    });

    // Cahier de vente H-47 : entrée = revenu, sortie = dépense
    cahier.forEach(t => {
      if (!inWeek(t.created_at, weekStart)) return;
      if (t.type === "entrée") bump(t.created_by, t.montant || 0, 0);
      else bump(t.created_by, 0, t.montant || 0);
    });

    return Object.entries(map).map(([nom, v]) => {
      const benefice = v.revenus - v.depenses;
      const commission = Math.max(0, benefice) * (pct / 100);
      const dejaPaye = paiements
        .filter(p => p.employe === nom && p.semaine === weekStartISO)
        .reduce((s, p) => s + p.montant, 0);
      return { nom, revenus: v.revenus, depenses: v.depenses, benefice, commission, dejaPaye, restant: Math.max(0, commission - dejaPaye) };
    }).sort((a, b) => b.commission - a.commission);
  }, [mouvements, compta, cahier, paiements, weekStart, weekStartISO, pct]);

  const totaux = useMemo(() => ({
    revenus: rows.reduce((s, r) => s + r.revenus, 0),
    depenses: rows.reduce((s, r) => s + r.depenses, 0),
    commission: rows.reduce((s, r) => s + r.commission, 0),
    restant: rows.reduce((s, r) => s + r.restant, 0),
  }), [rows]);

  async function marquerPaye(nom: string) {
    if (!supabase || !user) return;
    const montant = payAmount[nom] ?? rows.find(r => r.nom === nom)?.restant ?? 0;
    if (montant <= 0) return;
    await supabase.from("obsidian_paiements").insert([{
      employe: nom, semaine: weekStartISO, montant, paid_by: user.nom, paid_by_id: user.id,
    }]);
    showT(`${nom} marqué payé (${fmt(montant)})`);
    load();
  }

  async function savePct() {
    if (!supabase) return;
    setSavingPct(true);
    await supabase.from("obsidian_settings").upsert([{ id: "default", commission_pct: pct, updated_at: new Date().toISOString() }]);
    showT("Taux de commission mis à jour");
    setSavingPct(false);
  }

  const weekLabel = `${weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} — ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Obsidian Logistics</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Paie & Commissions</h1>
          <p className="page-subtitle">Bénéfice net par employé · {pct}% de commission · Semaine du {weekLabel}</p>
          <div className="gold-line" />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem" }}>
        {(["apercu", "historique", "reglages"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "0.4rem 0.875rem", borderRadius: "var(--radius)", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: "0.8rem", fontWeight: tab === t ? 700 : 400, background: tab === t ? "var(--gold-muted)" : "var(--surface)", border: `1px solid ${tab === t ? "rgba(196,179,137,0.4)" : "var(--border)"}`, color: tab === t ? "var(--gold)" : "var(--text-muted)" }}>
            {t === "apercu" ? "📊 Aperçu" : t === "historique" ? "📜 Historique des paiements" : "⚙️ Réglages"}
          </button>
        ))}
      </div>

      {tab === "apercu" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(w => w + 1)}>← Semaine précédente</button>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{weekOffset === 0 ? "Semaine en cours" : weekLabel}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}>Semaine suivante →</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}>
            {[
              { l: "Revenus cumulés", v: fmt(totaux.revenus), c: "var(--success)" },
              { l: "Dépenses cumulées", v: fmt(totaux.depenses), c: "var(--danger)" },
              { l: "Commissions dues", v: fmt(totaux.commission), c: "var(--gold)" },
              { l: "Reste à payer", v: fmt(totaux.restant), c: totaux.restant > 0 ? "var(--warning)" : "var(--text-dim)" },
            ].map(s => (
              <div key={s.l} className="stat-card">
                <div className="stat-value" style={{ color: s.c, fontSize: "1.15rem" }}>{s.v}</div>
                <div className="stat-label">{s.l}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-title">Chargement…</div></div>
          ) : rows.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-title">Aucune activité cette semaine</div></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {rows.map(r => (
                <div key={r.nom} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 700, marginBottom: "0.2rem" }}>{r.nom}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                        Revenus {fmt(r.revenus)} · Dépenses {fmt(r.depenses)} · Bénéfice net {fmt(r.benefice)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "var(--gold)", fontSize: "1.05rem" }}>{fmt(r.commission)}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>commission ({pct}%)</div>
                    </div>
                    {r.dejaPaye > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600, color: "var(--success)", fontSize: "0.85rem" }}>{fmt(r.dejaPaye)}</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>déjà payé</div>
                      </div>
                    )}
                    {r.restant > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <input type="number" placeholder={r.restant.toFixed(0)} value={payAmount[r.nom] ?? ""} onChange={e => setPayAmount(p => ({ ...p, [r.nom]: +e.target.value }))} style={{ width: 90, fontSize: "0.8rem" }} />
                        <button className="btn btn-gold btn-sm" onClick={() => marquerPaye(r.nom)}>✓ Marquer payé</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.55rem", borderRadius: 999, background: "rgba(34,197,94,0.12)", color: "var(--success)", fontWeight: 600 }}>Soldé</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "historique" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {paiements.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📜</div><div className="empty-title">Aucun paiement enregistré</div></div>
          ) : paiements.map(p => (
            <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.employe}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                  Semaine du {new Date(p.semaine).toLocaleDateString("fr-FR")} · payé par {p.paid_by} le {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: "var(--gold)" }}>{fmt(p.montant)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "reglages" && (
        <div className="card" style={{ maxWidth: 420 }}>
          <div className="section-title" style={{ marginBottom: "1rem" }}>Taux de commission</div>
          <div className="form-group">
            <label>Pourcentage appliqué au bénéfice net (%)</label>
            <input type="number" min={0} max={100} value={pct} onChange={e => setPct(+e.target.value)} />
          </div>
          <button className="btn btn-gold" onClick={savePct} disabled={savingPct}>{savingPct ? "…" : "Enregistrer"}</button>
          <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.75rem" }}>
            S'applique à tout le monde, pareil pour chaque employé. Le changement prend effet sur les calculs futurs (n'affecte pas les paiements déjà marqués).
          </p>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}
