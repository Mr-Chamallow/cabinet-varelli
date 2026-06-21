"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  nom_rp: string;
  telephone: string;
  organisation: string;
  notes: string;
  created_at: string;
  created_by: string;
}

interface Dossier {
  id: string;
  reference: string;
  type_affaire: string;
  statut: string;
  risque: string;
  montant: number;
}

interface Facture {
  id: string;
  numero: string;
  montant: number;
  statut: string;
  description: string;
  created_at: string;
}

const EMPTY: Omit<Client, "id" | "created_at" | "created_by"> = {
  nom_rp: "", telephone: "", organisation: "", notes: "",
};

const BADGE_STATUT_DOS: Record<string, string> = {
  Ouvert: "badge-info", "En cours": "badge-warning",
  Clôturé: "badge-muted", Gagné: "badge-success", Perdu: "badge-danger",
};
const BADGE_RISQUE: Record<string, string> = {
  Aucun: "badge-muted", Faible: "badge-success",
  Moyen: "badge-warning", Élevé: "badge-danger", Extrême: "badge-danger",
};
const BADGE_STATUT_FAC: Record<string, string> = {
  "En attente": "badge-warning", Payée: "badge-success",
  Annulée: "badge-danger", "En retard": "badge-danger",
};

export default function ClientsPage() {
  const router = useRouter();
  const user = getUser();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

  // Vue détail
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { if (user) load(); }, []);

  async function load() {
    if (!supabase || !user) { setLoading(false); return; }
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("created_by", user.nom)
      .order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  async function loadDetail(client: Client) {
    if (!supabase || !user) return;
    setDetailLoading(true);
    setSelectedClient(client);
    const [{ data: d }, { data: f }] = await Promise.all([
      supabase.from("dossiers").select("id,reference,type_affaire,statut,risque,montant")
        .eq("created_by", user.nom).ilike("client", client.nom_rp),
      supabase.from("factures").select("id,numero,montant,statut,description,created_at")
        .eq("created_by", user.nom).ilike("client", client.nom_rp),
    ]);
    setDossiers(d || []);
    setFactures(f || []);
    setDetailLoading(false);
  }

  function showToast(msg: string, type: "success" | "danger" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setForm({ ...EMPTY });
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(c: Client, e: React.MouseEvent) {
    e.stopPropagation();
    setForm({ nom_rp: c.nom_rp, telephone: c.telephone, organisation: c.organisation, notes: c.notes });
    setEditTarget(c);
    setShowForm(true);
  }

  async function save() {
    if (!supabase || !user || !form.nom_rp.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        const { error } = await supabase.from("clients").update(form).eq("id", editTarget.id);
        if (error) throw error;
        showToast("Client mis à jour");
        if (selectedClient?.id === editTarget.id) setSelectedClient({ ...selectedClient, ...form });
      } else {
        const { error } = await supabase.from("clients").insert([{ ...form, created_by: user.nom }]);
        if (error) throw error;
        showToast("Client ajouté");
      }
      setShowForm(false);
      load();
    } catch {
      showToast("Erreur lors de l'enregistrement", "danger");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!supabase || !confirmDelete) return;
    await supabase.from("clients").delete().eq("id", confirmDelete.id);
    setConfirmDelete(null);
    if (selectedClient?.id === confirmDelete.id) setSelectedClient(null);
    showToast("Client supprimé");
    load();
  }

  const filtered = clients.filter(c =>
    c.nom_rp?.toLowerCase().includes(search.toLowerCase()) ||
    c.organisation?.toLowerCase().includes(search.toLowerCase()) ||
    c.telephone?.includes(search)
  );

  const fmt = (n: number) => n?.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) || "—";
  const dateStr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} client{clients.length !== 1 ? "s" : ""} · Mes dossiers uniquement</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={openNew}>+ Nouveau client</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedClient ? "1fr 420px" : "1fr", gap: "1.5rem" }}>

        {/* LISTE */}
        <div>
          <div className="toolbar" style={{ marginBottom: "1rem" }}>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>×</button>}
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-icon">⚖️</div><div className="empty-title">Chargement…</div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <div className="empty-title">{search ? "Aucun résultat" : "Aucun client"}</div>
              <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>{search ? "Modifiez votre recherche" : "Ajoutez votre premier client."}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.875rem" }}>
              {filtered.map(c => (
                <div
                  key={c.id}
                  className="card"
                  onClick={() => loadDetail(c)}
                  style={{
                    cursor: "pointer",
                    border: selectedClient?.id === c.id ? "1px solid rgba(212,175,55,0.5)" : "1px solid var(--border)",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "0.875rem" }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                      background: "var(--gold-muted)", border: "1.5px solid rgba(212,175,55,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1rem", color: "var(--gold)",
                    }}>{c.nom_rp?.[0]?.toUpperCase() || "?"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nom_rp}</div>
                      {c.organisation && <span className="badge badge-gold">{c.organisation}</span>}
                    </div>
                  </div>
                  {c.telephone && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>📞 {c.telephone}</div>}
                  {c.notes && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", background: "var(--surface)", borderRadius: 6, padding: "0.4rem 0.6rem", borderLeft: "2px solid var(--border)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {c.notes}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", marginTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{dateStr(c.created_at)}</span>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={e => openEdit(c, e)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); setConfirmDelete(c); }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DÉTAIL CLIENT */}
        {selectedClient && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card" style={{ border: "1px solid rgba(212,175,55,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "var(--gold-muted)", border: "2px solid rgba(212,175,55,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.3rem", color: "var(--gold)",
                  }}>{selectedClient.nom_rp[0].toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>{selectedClient.nom_rp}</div>
                    {selectedClient.organisation && <span className="badge badge-gold">{selectedClient.organisation}</span>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedClient(null)}>×</button>
              </div>
              {selectedClient.telephone && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>📞 {selectedClient.telephone}</div>}
              {selectedClient.notes && <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", background: "var(--surface)", borderRadius: 6, padding: "0.6rem", borderLeft: "2px solid var(--border)" }}>{selectedClient.notes}</div>}
            </div>

            {detailLoading ? (
              <div className="card" style={{ textAlign: "center", color: "var(--text-dim)", padding: "2rem" }}>Chargement…</div>
            ) : (
              <>
                {/* Dossiers */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
                    <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>📁 Dossiers ({dossiers.length})</h3>
                    <a href="/dossiers" className="btn btn-ghost btn-sm">+ Nouveau</a>
                  </div>
                  {dossiers.length === 0 ? (
                    <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", textAlign: "center", padding: "1rem 0" }}>Aucun dossier</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {dossiers.map(d => (
                        <div key={d.id} style={{ background: "var(--surface)", borderRadius: 8, padding: "0.6rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--gold)", marginBottom: "0.15rem" }}>{d.reference}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{d.type_affaire}</div>
                          </div>
                          <div style={{ display: "flex", gap: "0.35rem", flexDirection: "column", alignItems: "flex-end" }}>
                            <span className={`badge ${BADGE_STATUT_DOS[d.statut] || "badge-muted"}`} style={{ fontSize: "0.68rem" }}>{d.statut}</span>
                            {d.montant > 0 && <span style={{ fontSize: "0.72rem", color: "var(--gold)", fontWeight: 600 }}>{fmt(d.montant)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Factures */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
                    <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>🧾 Factures ({factures.length})</h3>
                    <a href="/factures" className="btn btn-ghost btn-sm">+ Nouvelle</a>
                  </div>
                  {factures.length === 0 ? (
                    <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", textAlign: "center", padding: "1rem 0" }}>Aucune facture</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {factures.map(f => (
                        <div key={f.id} style={{ background: "var(--surface)", borderRadius: 8, padding: "0.6rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--gold)", marginBottom: "0.15rem" }}>{f.numero}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{f.description || "—"}</div>
                          </div>
                          <div style={{ display: "flex", gap: "0.35rem", flexDirection: "column", alignItems: "flex-end" }}>
                            <span className={`badge ${BADGE_STATUT_FAC[f.statut] || "badge-muted"}`} style={{ fontSize: "0.68rem" }}>{f.statut}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 700 }}>{fmt(f.montant)}</span>
                          </div>
                        </div>
                      ))}
                      <div style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                        <span style={{ color: "var(--text-dim)" }}>Total facturé</span>
                        <span style={{ color: "var(--gold)", fontWeight: 700 }}>{fmt(factures.reduce((s, f) => s + f.montant, 0))}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editTarget ? "Modifier le client" : "Nouveau client"}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nom RP *</label>
                    <input placeholder="Ex : Pesto Aziz" value={form.nom_rp} onChange={e => setForm({ ...form, nom_rp: e.target.value })} autoFocus />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input placeholder="555-1234" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Organisation</label>
                  <input placeholder="Ex : Bande des Ballas, Indépendant…" value={form.organisation} onChange={e => setForm({ ...form, organisation: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea placeholder="Informations complémentaires, contexte RP…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving || !form.nom_rp.trim()} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Enregistrement…" : editTarget ? "Mettre à jour" : "Ajouter le client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer ce client ?</div>
            <div className="confirm-msg"><strong style={{ color: "var(--text)" }}>{confirmDelete.nom_rp}</strong> sera définitivement supprimé.</div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={doDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.type === "success" ? "✅" : "❌"} {toast.msg}</div>
        </div>
      )}
    </div>
  );
}
