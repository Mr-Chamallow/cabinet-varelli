"use client";
import { Stamp } from "@/components/Stamp";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/lib/useToast";
import { Toast } from "@/components/ui/Toast";
import { hasPermission } from "@/lib/auth";
import { money } from "@/lib/money";
import { weekStartOf } from "@/lib/weekStart";
import { dbw } from "@/lib/dbw";
import { fetchAll } from "@/lib/fetchAll";

function inWeek(dateStr: string, weekStart: Date) {
  const d = new Date(dateStr);
  const end = new Date(weekStart); end.setDate(end.getDate() + 7);
  return d >= weekStart && d < end;
}
const fmt = (n: number) => money(n);

interface EmployeeRow {
  nom: string;
  revenus: number;
  depenses: number;
  benefice: number;
  commission: number;
  dejaPaye: number;
  restant: number;
  primeSale: number;
  primePropre: number;
  primeMixte: number;
  prime: number;
  primeFixe: number;
}

export default function PaieObsidianPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_paie"))) { window.location.href = "/"; } }, [user, userLoading]);

  const [tab, setTab] = useState<"apercu" | "dons" | "reglages">("apercu");
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [compta, setCompta] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [arrests, setArrests] = useState<any[]>([]);
  const [dons, setDons] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [pct, setPct] = useState(20);
  const [primeSeuil, setPrimeSeuil] = useState(20000);
  const [primeFixe, setPrimeFixe] = useState(5000);
  const [savingPct, setSavingPct] = useState(false);
  const [payAmount, setPayAmount] = useState<Record<string, number>>({});

  const weekStartISO = weekStartOf(new Date(Date.now() - weekOffset * 7 * 86400000));
  const weekStart = useMemo(() => new Date(weekStartISO + "T00:00:00"), [weekStartISO]);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const [c, p, { data: s }, ar, { data: dn }, { data: bg }] = await Promise.all([
      fetchAll((a, b) => supabase!.from("obsidian_comptabilite").select("*").eq("source", "action").order("created_at").order("id").range(a, b)),
      fetchAll((a, b) => supabase!.from("obsidian_paiements").select("*").order("created_at", { ascending: false }).order("id").range(a, b)),
      supabase.from("obsidian_settings").select("*").eq("id", "default").maybeSingle(),
      fetchAll((a, b) => supabase!.from("arrestations").select("membre,amende,argent_perdu,type_argent,created_at").order("created_at").order("id").range(a, b)),
      supabase.from("obsidian_dons").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.rpc("obsidian_budget"),
    ]);
    setArrests(ar || []);
    setCompta(c || []);
    setPaiements(p || []);
    setDons(dn || []);
    setBudget(bg || null);
    if (s?.commission_pct != null) setPct(Number(s.commission_pct));
    if (s?.prime_seuil != null) setPrimeSeuil(Number(s.prime_seuil));
    if (s?.prime_fixe != null) setPrimeFixe(Number(s.prime_fixe));
    setLoading(false);
  }

  // Trésorerie propre (celle qui sert à payer) et seuil d'alerte
  const tresoPropre = (Number(budget?.capital) || 0) + (Number(budget?.propre) || 0);
  const seuilTreso = Number(budget?.seuil) || 0;

  // --- Agrégation par employé pour la semaine sélectionnée ---
  // RÈGLE : seules les ACTIONS ILLÉGALES comptent pour la commission. Les ventes/achats
  // (Transaction, Stocks) sont des opérations de l'entreprise : elles ne touchent pas la paie.
  const rows: EmployeeRow[] = useMemo(() => {
    const map: Record<string, { revenus: number; depenses: number }> = {};
    const bump = (nom: string, rev: number, dep: number) => {
      if (!nom) return;
      if (!map[nom]) map[nom] = { revenus: 0, depenses: 0 };
      map[nom].revenus += rev;
      map[nom].depenses += dep;
    };

    compta.forEach(e => {
      if (e.source !== "action" || !inWeek(e.created_at, weekStart)) return;
      if (/^investissement/i.test(e.categorie || "")) return;
      if (e.type === "recette") bump(e.membre || e.created_by, e.montant || 0, 0);
      else bump(e.membre || e.created_by, 0, e.montant || 0);
    });

    // Primes d'arrestation : seule l'amende est remboursée en prime sur la paie.
    const primes: Record<string, { sale: number; propre: number; mixte: number }> = {};
    arrests.forEach(a => {
      if (!inWeek(a.created_at, weekStart) || !a.membre || !(Number(a.amende) > 0)) return;
      (primes[a.membre] ??= { sale: 0, propre: 0, mixte: 0 }).propre += Number(a.amende);
      if (!map[a.membre]) map[a.membre] = { revenus: 0, depenses: 0 };
    });

    return Object.entries(map).map(([nom, v]) => {
      const pr = primes[nom] || { sale: 0, propre: 0, mixte: 0 };
      const prime = pr.sale + pr.propre + pr.mixte;
      const benefice = v.revenus - v.depenses;
      const commission = Math.max(0, benefice) * (pct / 100);
      const fixe = primeFixe > 0 && v.revenus >= primeSeuil ? primeFixe : 0;
      const dejaPaye = paiements
        .filter(p => p.employe === nom && p.semaine === weekStartISO)
        .reduce((s, p) => s + p.montant, 0);
      return { nom, revenus: v.revenus, depenses: v.depenses, benefice, commission, dejaPaye, restant: Math.max(0, commission + prime + fixe - dejaPaye), primeSale: pr.sale, primePropre: pr.propre, primeMixte: pr.mixte, prime, primeFixe: fixe };
    }).sort((a, b) => (b.commission + b.prime + b.primeFixe) - (a.commission + a.prime + a.primeFixe));
  }, [compta, paiements, arrests, weekStart, weekStartISO, pct, primeSeuil, primeFixe]);

  const totaux = useMemo(() => ({
    revenus: rows.reduce((s, r) => s + r.revenus, 0),
    depenses: rows.reduce((s, r) => s + r.depenses, 0),
    commission: rows.reduce((s, r) => s + r.commission, 0),
    prime: rows.reduce((s, r) => s + r.prime, 0),
    fixe: rows.reduce((s, r) => s + r.primeFixe, 0),
    restant: rows.reduce((s, r) => s + r.restant, 0),
  }), [rows]);

  const donsAttente = dons.filter(d => d.statut === "en_attente");

  async function marquerPaye(nom: string) {
    if (!user) return;
    const montant = payAmount[nom] ?? rows.find(r => r.nom === nom)?.restant ?? 0;
    if (montant <= 0) return;
    if (tresoPropre - montant < seuilTreso) {
      const ok = window.confirm(`⚠️ Trésorerie propre : ${fmt(tresoPropre)}\nSeuil minimum : ${fmt(seuilTreso)}\nAprès ce paiement : ${fmt(tresoPropre - montant)}\n\nPayer quand même ${fmt(montant)} à ${nom} ?`);
      if (!ok) return;
    }
    const res = await fetch("/api/obsidian/paie", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employe: nom, semaine: weekStartISO, montant, paid_by: user.nom, paid_by_id: user.id }),
    });
    if (!res.ok) { const data = await res.json(); alert("❌ "+data.error); return; }
    showToast(`${nom} marqué payé (${fmt(montant)})`);
    load();
  }

  async function traiterDon(id: string, ok: boolean) {
    const res = await fetch("/api/obsidian/dons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ok }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert("❌ " + (data.error || "Erreur")); return; }
    showToast(ok ? "Don validé, ajouté à la caisse" : "Don refusé");
    load();
  }

  async function savePct() {
    if (!supabase) return;
    setSavingPct(true);
    await dbw.upsert("obsidian_settings", { id: "default", commission_pct: pct, prime_seuil: primeSeuil, prime_fixe: primeFixe });
    showToast("Réglages de paie enregistrés");
    setSavingPct(false);
  }

  const weekLabel = `${weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} - ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">Obsidian Logistics</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Paie & Commissions</h1>
          <p className="page-subtitle">Actions illégales · {pct}% de commission · prime fixe {fmt(primeFixe)} dès {fmt(primeSeuil)} de ventes · Semaine du {weekLabel}</p>
          <div className="gold-line" />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem" }}>
        {(["apercu", "dons", "reglages"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "0.4rem 0.875rem", borderRadius: "var(--radius)", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: "0.8rem", fontWeight: tab === t ? 700 : 400, background: tab === t ? "var(--gold-muted)" : "var(--surface)", border: `1px solid ${tab === t ? "rgba(var(--gold-rgb), 0.4)" : "var(--border)"}`, color: tab === t ? "var(--gold)" : "var(--text-muted)" }}>
            {t === "apercu" ? "📊 Aperçu" : t === "dons" ? `🎁 Dons${donsAttente.length ? ` (${donsAttente.length})` : ""}` : "⚙️ Réglages"}
          </button>
        ))}
      </div>

      {tab === "apercu" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(w => w + 1)}>Semaine précédente</button>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{weekOffset === 0 ? "Semaine en cours" : weekLabel}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}>Semaine suivante {'->'}</button>
          </div>

          {!loading && budget && (tresoPropre < seuilTreso || tresoPropre < totaux.restant) && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "var(--radius-lg)", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.8rem", color: "var(--danger)", fontWeight: 600 }}>
              ⚠️ Trésorerie propre : {fmt(tresoPropre)}{seuilTreso > 0 ? ` (seuil minimum ${fmt(seuilTreso)})` : ""} · reste à payer cette semaine : {fmt(totaux.restant)}. Les paies sortent uniquement de la caisse propre : blanchis de l'argent sale si besoin. Un paiement demandera une confirmation.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.875rem", marginBottom: "1.5rem" }}>
            {[
              { l: "Ventes (actions)", v: fmt(totaux.revenus), c: "var(--success)" },
              { l: "Pertes (actions)", v: fmt(totaux.depenses), c: "var(--danger)" },
              { l: "Commissions dues", v: fmt(totaux.commission), c: "var(--gold)" },
              { l: "Primes fixes", v: fmt(totaux.fixe), c: "var(--info)" },
              { l: "Primes arrestation", v: fmt(totaux.prime), c: "var(--info)" },
              { l: "Reste à payer", v: fmt(totaux.restant), c: totaux.restant > 0 ? "var(--warning)" : "var(--text-dim)" },
            ].map(s => (
              <div key={s.l} className="stat-card">
                <div className="stat-value" style={{ color: s.c, fontSize: "1.15rem" }}>{s.v}</div>
                <div className="stat-label">{s.l}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-title">Chargement...</div></div>
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
                        Ventes {fmt(r.revenus)} · Pertes {fmt(r.depenses)} · Bénéfice net {fmt(r.benefice)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "var(--gold)", fontSize: "1.05rem" }}>{fmt(r.commission)}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>commission ({pct}%)</div>
                    </div>
                    {r.prime > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "var(--info)", fontSize: "0.9rem" }}>+ {fmt(r.prime)}</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>prime arrestation{[r.primeSale > 0 && ` · sale ${fmt(r.primeSale)}`, r.primePropre > 0 && ` · propre ${fmt(r.primePropre)}`, r.primeMixte > 0 && ` · mixte ${fmt(r.primeMixte)}`].filter(Boolean).join("")}</div>
                      </div>
                    )}
                    {r.primeFixe > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "var(--info)", fontSize: "0.9rem" }}>+ {fmt(r.primeFixe)}</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>prime fixe (ventes {'>='} {fmt(primeSeuil)})</div>
                      </div>
                    )}
                    {r.dejaPaye > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600, color: "var(--success)", fontSize: "0.85rem" }}>{fmt(r.dejaPaye)}</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>{r.restant <= 0 ? <Stamp color="green" size="sm" rotate={-6}>Payé</Stamp> : "déjà payé"}</div>
                      </div>
                    )}
                    {r.restant > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <input type="number" placeholder={r.restant.toFixed(0)} value={payAmount[r.nom] ?? ""} onChange={e => setPayAmount(p => ({ ...p, [r.nom]: +e.target.value }))} style={{ width: 90, fontSize: "0.8rem" }} />
                        <button className="btn btn-gold btn-sm" onClick={() => marquerPaye(r.nom)}>Marquer payé</button>
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

      {tab === "dons" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {dons.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎁</div><div className="empty-title">Aucun don</div></div>
          ) : dons.slice(0, 100).map(d => (
            <div key={d.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700 }}>{d.employe} · {fmt(d.montant)} · {d.type_argent === "propre" ? "💵 propre" : "🕶️ sale"}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{new Date(d.created_at).toLocaleString("fr-FR")}{d.motif ? ` · ${d.motif}` : ""}</div>
              </div>
              {d.preuve_url && <a href={d.preuve_url} target="_blank" rel="noreferrer"><img src={d.preuve_url} alt="preuve" style={{ height: 52, borderRadius: 6, border: "1px solid var(--border)" }} /></a>}
              {d.statut === "en_attente" ? (
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-gold btn-sm" onClick={() => traiterDon(d.id, true)}>Valider</button>
                  <button className="btn btn-outline btn-sm" onClick={() => traiterDon(d.id, false)}>Refuser</button>
                </div>
              ) : (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: d.statut === "valide" ? "var(--success)" : "var(--danger)" }}>{d.statut === "valide" ? "✅ Validé" : "❌ Refusé"}{d.valide_par ? ` par ${d.valide_par}` : ""}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "reglages" && (
        <div className="card" style={{ maxWidth: 420 }}>
          <div className="section-title" style={{ marginBottom: "1rem" }}>Commission & prime fixe</div>
          <div className="form-group">
            <label>Commission sur le bénéfice net des actions illégales (%)</label>
            <input type="number" min={0} max={100} value={pct} onChange={e => setPct(+e.target.value)} />
          </div>
          <div className="form-group">
            <label>Ventes minimum de l'employé pour la prime fixe ($)</label>
            <input type="number" min={0} value={primeSeuil} onChange={e => setPrimeSeuil(+e.target.value)} />
          </div>
          <div className="form-group">
            <label>Montant de la prime fixe ($)</label>
            <input type="number" min={0} value={primeFixe} onChange={e => setPrimeFixe(+e.target.value)} />
          </div>
          <button className="btn btn-gold" onClick={savePct} disabled={savingPct}>{savingPct ? "..." : "Enregistrer"}</button>
          <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.75rem" }}>
            Seules les actions illégales comptent. Les ventes et achats de produits (Transaction, Stocks) sont des opérations de l'entreprise et ne touchent pas la paie. Le seuil de trésorerie se règle dans Comptabilité, onglet Budget de lancement.
          </p>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
