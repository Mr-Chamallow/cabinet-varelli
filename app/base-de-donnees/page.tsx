"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/lib/useToast";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { hasPermission, hasWriteAccess } from "@/lib/auth";
import {
  fetchGangs,
  createGang,
  deleteGang,
  uploadImage,
  fetchPoints,
  updatePoint,
} from "@/components/carte-enqueteur/supabase-carte";
import { syncBddToFiche } from "@/lib/ficheSync";
import { WantedPoster } from "@/components/WantedPoster";
import { gangTypeLabel } from "@/components/carte-enqueteur/types";
import type { Gang, CartePoint } from "@/components/carte-enqueteur/types";
import { PhotoSlot } from "@/components/base-de-donnees/PhotoSlot";
import { PRIOS, PCOL, EMPTY_PERSONNE, EMPTY_VEHICULE, ACT_ICON, fullName } from "@/components/base-de-donnees/types";
import type { Personne, Vehicule, Activite } from "@/components/base-de-donnees/types";

export default function BaseDeDonneesPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "base_donnees"))) { window.location.href = "/"; } }, [user, userLoading]);
  const canWrite = hasWriteAccess(user, "base_donnees");

  const [tab, setTab] = useState<"personnes" | "vehicules" | "groupes">("personnes");
  const [loading, setLoading] = useState(true);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [points, setPoints] = useState<CartePoint[]>([]);

  const [selectedPersonneId, setSelectedPersonneId] = useState<string | null>(null);
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string | null>(null);
  const [selectedGroupeId, setSelectedGroupeId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");

  const [personneForm, setPersonneForm] = useState<Omit<Personne, "id">>({ ...EMPTY_PERSONNE });
  const [editPersonneId, setEditPersonneId] = useState<string | null>(null);
  const [showPersonneForm, setShowPersonneForm] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [savingPersonne, setSavingPersonne] = useState(false);

  const [vehiculeForm, setVehiculeForm] = useState<Omit<Vehicule, "id">>({ ...EMPTY_VEHICULE });
  const [editVehiculeId, setEditVehiculeId] = useState<string | null>(null);
  const [showVehiculeForm, setShowVehiculeForm] = useState(false);
  const [savingVehicule, setSavingVehicule] = useState(false);

  const [showGroupeForm, setShowGroupeForm] = useState(false);
  const [groupeNom, setGroupeNom] = useState("");
  const [wantedP, setWantedP] = useState<any>(null);
  const [groupeType, setGroupeType] = useState<Gang["type"]>("orga");
  const [formPointId, setFormPointId] = useState<string>("");

  const [liensQuery, setLiensQuery] = useState("");
  const [activites, setActivites] = useState<Activite[]>([]);
  const [quickImportQuery, setQuickImportQuery] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: p }, { data: v }, gs, pts] = await Promise.all([
      supabase.from("bdd_personnes").select("*").order("nom"),
      supabase.from("bdd_vehicules").select("*").order("plaque"),
      fetchGangs(),
      fetchPoints(),
    ]);
    setPersonnes(p || []);
    setVehicules(v || []);
    setGangs(gs || []);
    setPoints(pts || []);
    setLoading(false);
  }

  // ─── Lien personne ↔ point chaud (stocké côté carte_points.personne_ids,
  // réutilise le champ déjà existant sur la carte enquêteur) ───────────────
  function pointOf(personneId: string): CartePoint | null {
    return points.find(pt => (pt.personne_ids || []).includes(personneId)) || null;
  }

  async function linkPersonneToPoint(personneId: string, newPointId: string) {
    const old = pointOf(personneId);
    if (old && old.id !== newPointId) {
      await updatePoint(old.id, { personne_ids: (old.personne_ids || []).filter(id => id !== personneId) });
    }
    if (newPointId && newPointId !== old?.id) {
      const target = points.find(pt => pt.id === newPointId);
      const ids = Array.from(new Set([...(target?.personne_ids || []), personneId]));
      await updatePoint(newPointId, { personne_ids: ids });
    }
    if (old || newPointId) setPoints(await fetchPoints());
  }

  // ─── Timeline d'activité ────────────────────────────────────────────────
  async function logActivite(personneId: string, type: string, description: string) {
    if (!supabase) return;
    await supabase.from("bdd_activites").insert([{ personne_id: personneId, type, description, created_by: user?.nom || "" }]);
  }
  useEffect(() => {
    if (!supabase || !selectedPersonneId) { setActivites([]); return; }
    supabase.from("bdd_activites").select("*").eq("personne_id", selectedPersonneId).order("created_at", { ascending: false })
      .then(({ data }: any) => setActivites(data || []));
  }, [selectedPersonneId]);

  // ─── Recherche globale (personne ou plaque) ───────────────────────────
  const globalResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return { personnes: [], vehicules: [] };
    return {
      personnes: personnes.filter(p => `${fullName(p)} ${p.surnom || ""} ${p.telephone || ""}`.toLowerCase().includes(q)).slice(0, 8),
      vehicules: vehicules.filter(v => v.plaque.toLowerCase().includes(q)).slice(0, 8),
    };
  }, [globalQuery, personnes, vehicules]);

  // ─── Import rapide : détecte un doublon pendant la création (nom, tel) ───
  const quickImportMatches = useMemo(() => {
    const q = quickImportQuery.trim().toLowerCase();
    if (!q || editPersonneId) return [];
    return personnes.filter(p => `${fullName(p)} ${p.telephone || ""}`.toLowerCase().includes(q)).slice(0, 5);
  }, [quickImportQuery, personnes, editPersonneId]);

  function importPersonne(p: Personne) {
    setQuickImportQuery("");
    openEditPersonne(p);
  }

  // ─── Dossiers liés : recherche pour ajouter un lien ────────────────────
  const liensMatches = useMemo(() => {
    const q = liensQuery.trim().toLowerCase();
    if (!q) return [];
    const current = personneForm.liens_ids || [];
    return personnes.filter(p => p.id !== editPersonneId && !current.includes(p.id) && fullName(p).toLowerCase().includes(q)).slice(0, 6);
  }, [liensQuery, personnes, personneForm.liens_ids, editPersonneId]);

  function addLien(id: string) {
    setPersonneForm(f => ({ ...f, liens_ids: Array.from(new Set([...(f.liens_ids || []), id])) }));
    setLiensQuery("");
  }
  function removeLien(id: string) {
    setPersonneForm(f => ({ ...f, liens_ids: (f.liens_ids || []).filter(x => x !== id) }));
  }

  function gotoPersonne(id: string) { setTab("personnes"); setSelectedPersonneId(id); setGlobalQuery(""); }
  function gotoVehicule(id: string) { setTab("vehicules"); setSelectedVehiculeId(id); setGlobalQuery(""); }

  // ─── Personnes ─────────────────────────────────────────────────────────
  const filteredPersonnes = personnes.filter(p => !search || `${fullName(p)} ${p.surnom || ""}`.toLowerCase().includes(search.toLowerCase()));
  const selectedPersonne = personnes.find(p => p.id === selectedPersonneId) || null;
  const vehiculesDe = (personneId: string) => vehicules.filter(v => v.proprietaire_id === personneId);
  const gangOf = (id?: string | null) => gangs.find(g => g.id === id) || null;

  function openNewPersonne() { setPersonneForm({ ...EMPTY_PERSONNE }); setEditPersonneId(null); setTagsInput(""); setFormPointId(""); setLiensQuery(""); setQuickImportQuery(""); setShowPersonneForm(true); }
  function openEditPersonne(p: Personne) { setPersonneForm({ ...p, liens_ids: p.liens_ids || [] }); setEditPersonneId(p.id); setTagsInput((p.tags || []).join(", ")); setFormPointId(pointOf(p.id)?.id || ""); setLiensQuery(""); setQuickImportQuery(""); setShowPersonneForm(true); }

  // ─── Dossiers liés (liens_ids, symétrique entre les deux fiches) ───────
  async function syncLiens(personneId: string, newLiens: string[]) {
    if (!supabase) return;
    const before = personnes.find(p => p.id === personneId);
    const oldLiens = before?.liens_ids || [];
    const added = newLiens.filter(id => !oldLiens.includes(id));
    const removed = oldLiens.filter(id => !newLiens.includes(id));
    for (const otherId of added) {
      const other = personnes.find(p => p.id === otherId);
      const otherLiens = Array.from(new Set([...(other?.liens_ids || []), personneId]));
      await supabase.from("bdd_personnes").update({ liens_ids: otherLiens }).eq("id", otherId);
      setPersonnes(list => list.map(p => p.id === otherId ? { ...p, liens_ids: otherLiens } : p));
    }
    for (const otherId of removed) {
      const other = personnes.find(p => p.id === otherId);
      const otherLiens = (other?.liens_ids || []).filter(id => id !== personneId);
      await supabase.from("bdd_personnes").update({ liens_ids: otherLiens }).eq("id", otherId);
      setPersonnes(list => list.map(p => p.id === otherId ? { ...p, liens_ids: otherLiens } : p));
    }
    if (added.length) {
      const noms = added.map(id => fullName(personnes.find(p => p.id === id) || ({ nom: "?" } as Personne)));
      await logActivite(personneId, "lien", `Dossier lié à : ${noms.join(", ")}`);
    }
  }

  // ─── Notification Discord — uniquement les events "importants" ────────
  async function notifyDiscord(title: string, description: string, color = 0xef4444) {
    try {
      await fetch("/api/discord-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "base_donnees", title, description, color }),
      });
    } catch { /* une alerte Discord qui échoue ne doit jamais bloquer l'action */ }
  }

  async function savePersonne() {
    if (!supabase || !personneForm.nom) return;
    setSavingPersonne(true);
    const tags = tagsInput.split(",").map(s => s.trim()).filter(Boolean);
    const before = editPersonneId ? personnes.find(x => x.id === editPersonneId) : null;
    const payload = { ...personneForm, organisation: gangOf(personneForm.groupe_id)?.nom || "", tags, updated_at: new Date().toISOString() };
    let savedId = editPersonneId;
    if (editPersonneId) {
      const { data, error } = await supabase.from("bdd_personnes").update(payload).eq("id", editPersonneId).select().single();
      if (error) { alert("❌ Erreur: " + error.message); setSavingPersonne(false); return; }
      setPersonnes(list => list.map(x => x.id === editPersonneId ? data : x));
      if (data.fiche_id) await syncBddToFiche(supabase, data); // fiche liée mise à jour aussi
      showToast("Fiche mise à jour");
      if (before && before.statut !== data.statut) await logActivite(data.id, "statut", `Statut : ${before.statut || "—"} → ${data.statut || "—"}`);
      if (before && before.groupe_id !== data.groupe_id) await logActivite(data.id, "groupe", `Groupe : ${gangOf(before.groupe_id)?.nom || "aucun"} → ${gangOf(data.groupe_id)?.nom || "aucun"}`);
      if (before && before.priorite !== "Critique" && data.priorite === "Critique") {
        await notifyDiscord("🚨 Priorité CRITIQUE", `**${fullName(data)}** est passé(e) en priorité Critique${user?.nom ? ` (par ${user.nom})` : ""}.`);
      }
    } else {
      const { data, error } = await supabase.from("bdd_personnes").insert([{ ...payload, created_by: user?.nom || "" }]).select().single();
      if (error) { alert("❌ Erreur: " + error.message); setSavingPersonne(false); return; }
      setPersonnes(list => [...list, data]);
      setSelectedPersonneId(data.id);
      savedId = data.id;
      showToast("Personne recensée");
      await logActivite(data.id, "creation", `Fiche créée${user?.nom ? " par " + user.nom : ""}`);
      if (data.priorite === "Critique") {
        await notifyDiscord("🚨 Nouvelle fiche CRITIQUE", `**${fullName(data)}** recensé(e) directement en priorité Critique${user?.nom ? ` (par ${user.nom})` : ""}.`);
      }
    }
    if (savedId) {
      await linkPersonneToPoint(savedId, formPointId);
      await syncLiens(savedId, personneForm.liens_ids || []);
    }
    setShowPersonneForm(false); setEditPersonneId(null); setSavingPersonne(false);
  }

  async function deletePersonne(id: string) {
    if (!supabase) return;
    await supabase.from("bdd_personnes").delete().eq("id", id);
    setPersonnes(list => list.filter(x => x.id !== id));
    if (selectedPersonneId === id) setSelectedPersonneId(null);
    showToast("Supprimé");
  }

  async function uploadPersonnePhoto(field: "photo_identite" | "photo_police", file: File) {
    const url = await uploadImage(file);
    setPersonneForm(f => ({ ...f, [field]: url }));
  }

  // ─── Véhicules ──────────────────────────────────────────────────────────
  const filteredVehicules = vehicules.filter(v => !search || v.plaque.toLowerCase().includes(search.toLowerCase()));
  const selectedVehicule = vehicules.find(v => v.id === selectedVehiculeId) || null;

  // ─── Alerte plaque récurrente : même plaque déjà vue sur une autre fiche ───
  const norm = (p: string) => (p || "").trim().toUpperCase().replace(/\s+/g, "");
  function autresFichesPourPlaque(plaque: string, excludeId?: string | null) {
    const p = norm(plaque);
    if (!p) return [];
    return vehicules.filter(v => norm(v.plaque) === p && v.id !== excludeId);
  }
  const plaquesRecurrentes = useMemo(() => {
    const set = new Set<string>();
    const seen = new Map<string, number>();
    vehicules.forEach(v => { const p = norm(v.plaque); seen.set(p, (seen.get(p) || 0) + 1); });
    seen.forEach((count, p) => { if (count > 1) set.add(p); });
    return set;
  }, [vehicules]);
  const vehiculeFormDoublons = useMemo(
    () => autresFichesPourPlaque(vehiculeForm.plaque, editVehiculeId),
    [vehiculeForm.plaque, vehicules, editVehiculeId]
  );

  function openNewVehicule() { setVehiculeForm({ ...EMPTY_VEHICULE }); setEditVehiculeId(null); setShowVehiculeForm(true); }
  function openEditVehicule(v: Vehicule) { setVehiculeForm({ ...v, photos: v.photos || [] }); setEditVehiculeId(v.id); setShowVehiculeForm(true); }

  async function saveVehicule() {
    if (!supabase || !vehiculeForm.plaque) return;
    setSavingVehicule(true);
    const payload = { ...vehiculeForm, updated_at: new Date().toISOString() };
    const doublonsAvant = autresFichesPourPlaque(vehiculeForm.plaque, editVehiculeId);
    if (editVehiculeId) {
      const { data, error } = await supabase.from("bdd_vehicules").update(payload).eq("id", editVehiculeId).select().single();
      if (error) { alert("❌ Erreur: " + error.message); setSavingVehicule(false); return; }
      setVehicules(list => list.map(x => x.id === editVehiculeId ? data : x));
      showToast("Véhicule mis à jour");
    } else {
      const { data, error } = await supabase.from("bdd_vehicules").insert([payload]).select().single();
      if (error) { alert("❌ Erreur: " + error.message); setSavingVehicule(false); return; }
      setVehicules(list => [...list, data]);
      setSelectedVehiculeId(data.id);
      showToast("Véhicule ajouté");
      if (doublonsAvant.length > 0) {
        const noms = doublonsAvant.map(v => v.marque_modele || v.id).join(", ");
        await notifyDiscord("🚨 Plaque récurrente détectée", `La plaque **${data.plaque}** est déjà enregistrée sur ${doublonsAvant.length} autre(s) fiche(s) (${noms})${user?.nom ? ` — ajoutée par ${user.nom}` : ""}.`, 0xf97316);
      }
    }
    setShowVehiculeForm(false); setEditVehiculeId(null); setSavingVehicule(false);
  }

  async function deleteVehicule(id: string) {
    if (!supabase) return;
    await supabase.from("bdd_vehicules").delete().eq("id", id);
    setVehicules(list => list.filter(x => x.id !== id));
    if (selectedVehiculeId === id) setSelectedVehiculeId(null);
    showToast("Supprimé");
  }

  async function addVehiculePhoto(file: File) {
    if ((vehiculeForm.photos || []).length >= 3) return;
    const url = await uploadImage(file);
    setVehiculeForm(f => ({ ...f, photos: [...(f.photos || []), url] }));
  }
  function removeVehiculePhoto(idx: number) {
    setVehiculeForm(f => ({ ...f, photos: (f.photos || []).filter((_, i) => i !== idx) }));
  }

  // ─── Groupes ────────────────────────────────────────────────────────────
  const selectedGroupe = gangs.find(g => g.id === selectedGroupeId) || null;
  const membresDe = (groupeId: string) => personnes.filter(p => p.groupe_id === groupeId);
  const vehiculesGroupe = (groupeId: string) => vehicules.filter(v => v.groupe_id === groupeId);

  async function addGroupe() {
    if (!groupeNom.trim()) return;
    const g = await createGang({ nom: groupeNom.trim(), type: groupeType });
    setGangs(list => [...list, g]);
    setGroupeNom(""); setShowGroupeForm(false);
    showToast("Groupe créé");
  }
  async function removeGroupe(id: string) {
    const nbPersonnes = membresDe(id).length;
    const nbVehicules = vehiculesGroupe(id).length;
    if (nbPersonnes + nbVehicules > 0) {
      const ok = window.confirm(
        `Ce groupe est lié à ${nbPersonnes} personne(s) et ${nbVehicules} véhicule(s).\n` +
        `Elles seront détachées (pas supprimées) du groupe. Continuer ?`
      );
      if (!ok) return;
    }
    // Cascade : on détache les fiches liées (pas de suppression des personnes/véhicules eux-mêmes)
    if (nbPersonnes > 0) {
      await supabase.from("bdd_personnes").update({ groupe_id: null }).eq("groupe_id", id);
    }
    if (nbVehicules > 0) {
      await supabase.from("bdd_vehicules").update({ groupe_id: null }).eq("groupe_id", id);
    }
    await deleteGang(id);
    setPersonnes(list => list.map(p => (p.groupe_id === id ? { ...p, groupe_id: null } : p)));
    setVehicules(list => list.map(v => (v.groupe_id === id ? { ...v, groupe_id: null } : v)));
    setGangs(list => list.filter(g => g.id !== id));
    if (selectedGroupeId === id) setSelectedGroupeId(null);
    showToast("Groupe supprimé, fiches détachées");
  }

  if (loading) return <div className="page-container"><div style={{ color: "var(--text-dim)" }}>Chargement…</div></div>;

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header">
        <div><h1 className="page-title">🗄️ Base de données</h1><p className="page-subtitle">Recensements · Véhicules · Groupes — tout au même endroit</p><div className="gold-line" /></div>
      </div>

      {/* Recherche globale */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <div className="search-bar"><span className="search-icon">🔍</span>
          <input placeholder="Rechercher une personne ou une plaque…" value={globalQuery} onChange={e => setGlobalQuery(e.target.value)} />
          {globalQuery && <button onClick={() => setGlobalQuery("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}>×</button>}
        </div>
        {globalQuery && (globalResults.personnes.length > 0 || globalResults.vehicules.length > 0) && (
          <div className="card" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, marginTop: 4, maxHeight: 320, overflowY: "auto", padding: "0.5rem" }}>
            {globalResults.personnes.map(p => (
              <button key={p.id} onClick={() => gotoPersonne(p.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "0.5rem", borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}>
                <span>👤</span><span style={{ fontWeight: 600 }}>{fullName(p)}</span>{p.surnom && <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>alias {p.surnom}</span>}
              </button>
            ))}
            {globalResults.vehicules.map(v => (
              <button key={v.id} onClick={() => gotoVehicule(v.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "0.5rem", borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}>
                <span>🚗</span><span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{v.plaque}</span>{v.marque_modele && <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>{v.marque_modele}</span>}
              </button>
            ))}
            {globalResults.personnes.length === 0 && globalResults.vehicules.length === 0 && <div style={{ padding: "0.5rem", color: "var(--text-dim)", fontSize: "0.8rem" }}>Aucun résultat</div>}
          </div>
        )}
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <button className={tab === "personnes" ? "btn btn-gold" : "btn btn-outline"} onClick={() => setTab("personnes")}>👤 Personnes ({personnes.length})</button>
        <button className={tab === "vehicules" ? "btn btn-gold" : "btn btn-outline"} onClick={() => setTab("vehicules")}>🚗 Véhicules ({vehicules.length})</button>
        <button className={tab === "groupes" ? "btn btn-gold" : "btn btn-outline"} onClick={() => setTab("groupes")}>🛡️ Groupes ({gangs.length})</button>
      </div>

      {/* ─── Onglet Personnes ─────────────────────────────────────────── */}
      {tab === "personnes" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem", alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem" }}>
              <div className="search-bar" style={{ flex: 1 }}><span className="search-icon">🔍</span><input placeholder="Filtrer…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              {canWrite && <button className="btn btn-gold btn-sm" onClick={openNewPersonne}>+</button>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {filteredPersonnes.map(p => {
                const col = PCOL[p.priorite || "Normale"] || "var(--text-dim)";
                const isSel = selectedPersonneId === p.id;
                return (
                  <button key={p.id} onClick={() => setSelectedPersonneId(p.id)} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-lg)", background: isSel ? "var(--gold-muted)" : "var(--card)", border: `1px solid ${isSel ? "rgba(var(--gold-rgb), 0.4)" : "var(--border)"}`, cursor: "pointer", fontFamily: "'Inter',sans-serif", textAlign: "left", width: "100%" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: col + "15", border: `2px solid ${col}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, color: col }}>
                      {p.photo_identite ? <img src={p.photo_identite} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} /> : fullName(p).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName(p)}</div><div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>{p.surnom ? "alias " + p.surnom : (gangOf(p.groupe_id)?.nom || "")}</div></div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0, boxShadow: `0 0 6px ${col}80` }} />
                  </button>
                );
              })}
              {filteredPersonnes.length === 0 && <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "1.5rem 0", fontSize: "0.82rem" }}>Aucune personne</div>}
            </div>
          </div>

          {selectedPersonne ? (
            <div className="card" style={{ borderColor: `${PCOL[selectedPersonne.priorite || "Normale"] || "var(--border)"}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <PhotoSlot url={selectedPersonne.photo_identite} icon="🪪" label="Carte ID" size={56} />
                    <PhotoSlot url={selectedPersonne.photo_police} icon="👮" label="Police" size={56} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.2rem", margin: 0, marginBottom: "0.2rem" }}>{fullName(selectedPersonne)}{selectedPersonne.surnom && <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: "0.9rem" }}> alias {selectedPersonne.surnom}</span>}</h2>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.62rem", padding: "0.08rem 0.4rem", borderRadius: 999, background: (PCOL[selectedPersonne.priorite || "Normale"] || "var(--text-dim)") + "15", color: PCOL[selectedPersonne.priorite || "Normale"] || "var(--text-dim)", border: `1px solid ${(PCOL[selectedPersonne.priorite || "Normale"] || "var(--text-dim)")}25`, fontWeight: 600 }}>{selectedPersonne.priorite || "Normale"}</span>
                      {selectedPersonne.statut && <span style={{ fontSize: "0.62rem", padding: "0.08rem 0.4rem", borderRadius: 999, background: "rgba(34,197,94,0.1)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.2)" }}>{selectedPersonne.statut}</span>}
                      {gangOf(selectedPersonne.groupe_id) && <span style={{ fontSize: "0.62rem", padding: "0.08rem 0.4rem", borderRadius: 999, background: "var(--gold-muted)", color: "var(--gold)", border: "1px solid rgba(var(--gold-rgb), 0.3)" }}>🛡️ {gangOf(selectedPersonne.groupe_id)!.nom}</span>}
                      {pointOf(selectedPersonne.id) && <a href={`/carte-enqueteur?point=${pointOf(selectedPersonne.id)!.id}`} style={{ fontSize: "0.62rem", padding: "0.08rem 0.4rem", borderRadius: 999, background: "rgba(100,181,246,0.12)", color: "var(--info)", border: "1px solid rgba(100,181,246,0.3)", textDecoration: "none" }}>📍 {pointOf(selectedPersonne.id)!.title}</a>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {(selectedPersonne as any).fiche_id && <a className="btn btn-outline btn-sm" href="/obsidian/fiches" title="Fiche liée">🗂️ Fiche</a>}
                  <button className="btn btn-outline btn-sm" title="Avis de recherche du Consortium" onClick={() => setWantedP(selectedPersonne)}>🧾 Recherché</button>
                  {canWrite && <button className="btn btn-outline btn-sm" onClick={() => openEditPersonne(selectedPersonne)}>✏️</button>}
                  {canWrite && <button className="btn btn-ghost btn-sm" onClick={() => deletePersonne(selectedPersonne.id)} style={{ color: "var(--danger)" }}>🗑️</button>}
                </div>
              </div>

              {selectedPersonne.tags && selectedPersonne.tags.length > 0 && <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>{selectedPersonne.tags.map(t => <span key={t} style={{ fontSize: "0.65rem", padding: "0.08rem 0.5rem", borderRadius: 999, background: "var(--gold-muted)", color: "var(--gold)", border: "1px solid rgba(var(--gold-rgb), 0.3)" }}>{t}</span>)}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                {([["📞 Téléphone", selectedPersonne.telephone], ["🏢 Organisation", gangOf(selectedPersonne.groupe_id)?.nom || selectedPersonne.organisation], ["💼 Occupation", selectedPersonne.occupation], ["🌍 Origine", selectedPersonne.origine], ["🎂 Âge", selectedPersonne.age ? selectedPersonne.age + " ans" : ""]] as [string, string | undefined][]).map(([l, v]) => v ? <div key={l}><div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.15rem" }}>{l}</div><div style={{ fontSize: "0.82rem" }}>{v}</div></div> : null)}
              </div>

              {selectedPersonne.adresses && <div style={{ marginTop: "0.75rem" }}><div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>📍 Adresses</div><div style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{selectedPersonne.adresses}</div></div>}
              {selectedPersonne.comptes_bancaires && <div style={{ marginTop: "0.75rem" }}><div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>🏦 Comptes bancaires RP</div><div style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{selectedPersonne.comptes_bancaires}</div></div>}
              {selectedPersonne.relations && <div style={{ marginTop: "0.75rem" }}><div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>🔗 Relations</div><div style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{selectedPersonne.relations}</div></div>}

              {vehiculesDe(selectedPersonne.id).length > 0 && (
                <div style={{ marginTop: "0.875rem" }}>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>🚗 Véhicules liés</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {vehiculesDe(selectedPersonne.id).map(v => (
                      <button key={v.id} onClick={() => gotoVehicule(v.id)} className="card" style={{ padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{v.plaque}</button>
                    ))}
                  </div>
                </div>
              )}

              {(selectedPersonne.liens_ids || []).length > 0 && (
                <div style={{ marginTop: "0.875rem" }}>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>🔗 Dossiers liés</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(selectedPersonne.liens_ids || []).map(id => {
                      const p2 = personnes.find(x => x.id === id);
                      if (!p2) return null;
                      return <button key={id} onClick={() => gotoPersonne(id)} className="card" style={{ padding: "0.4rem 0.7rem", cursor: "pointer", fontSize: "0.78rem" }}>{fullName(p2)}</button>;
                    })}
                  </div>
                </div>
              )}

              {selectedPersonne.notes_publiques && <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.875rem", background: "var(--surface)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--gold)" }}><div style={{ fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: "0.2rem" }}>📝 Notes</div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{selectedPersonne.notes_publiques}</div></div>}
              {selectedPersonne.notes_privees && <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.875rem", background: "rgba(239,68,68,0.06)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--danger)" }}><div style={{ fontSize: "0.6rem", color: "var(--danger)", marginBottom: "0.2rem" }}>🔒 Notes privées</div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{selectedPersonne.notes_privees}</div></div>}

              {activites.length > 0 && (
                <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>🕒 Activité</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 220, overflowY: "auto" }}>
                    {activites.map(a => (
                      <div key={a.id} style={{ display: "flex", gap: 8, fontSize: "0.76rem" }}>
                        <span>{ACT_ICON[a.type] || "•"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "var(--text-muted)" }}>{a.description}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>{new Date(a.created_at).toLocaleString("fr-FR")}{a.created_by ? " — " + a.created_by : ""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : <div className="empty-state" style={{ alignSelf: "start", padding: "3rem" }}><div className="empty-icon">👤</div><div className="empty-title">Sélectionnez une personne</div></div>}
        </div>
      )}

      {/* ─── Onglet Véhicules ─────────────────────────────────────────── */}
      {tab === "vehicules" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem", alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem" }}>
              <div className="search-bar" style={{ flex: 1 }}><span className="search-icon">🔍</span><input placeholder="Filtrer une plaque…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              {canWrite && <button className="btn btn-gold btn-sm" onClick={openNewVehicule}>+</button>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {filteredVehicules.map(v => {
                const isSel = selectedVehiculeId === v.id;
                return (
                  <button key={v.id} onClick={() => setSelectedVehiculeId(v.id)} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-lg)", background: isSel ? "var(--gold-muted)" : "var(--card)", border: `1px solid ${isSel ? "rgba(var(--gold-rgb), 0.4)" : "var(--border)"}`, cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, overflow: "hidden", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {v.photos?.[0] ? <img src={v.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🚗"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>{v.plaque}</div>
                        {plaquesRecurrentes.has(norm(v.plaque)) && <span title="Plaque récurrente : vue sur plusieurs fiches">⚠️</span>}
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>{v.marque_modele || "—"}</div>
                    </div>
                  </button>
                );
              })}
              {filteredVehicules.length === 0 && <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "1.5rem 0", fontSize: "0.82rem" }}>Aucun véhicule</div>}
            </div>
          </div>

          {selectedVehicule ? (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div><h2 style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.3rem", margin: 0 }}>{selectedVehicule.plaque} {plaquesRecurrentes.has(norm(selectedVehicule.plaque)) && <span title="Plaque récurrente">⚠️</span>}</h2><div style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>{selectedVehicule.marque_modele}{selectedVehicule.couleur ? " · " + selectedVehicule.couleur : ""}</div></div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {canWrite && <button className="btn btn-outline btn-sm" onClick={() => openEditVehicule(selectedVehicule)}>✏️</button>}
                  {canWrite && <button className="btn btn-ghost btn-sm" onClick={() => deleteVehicule(selectedVehicule.id)} style={{ color: "var(--danger)" }}>🗑️</button>}
                </div>
              </div>

              {(selectedVehicule.photos || []).length > 0 && (
                <div style={{ display: "flex", gap: 8, marginBottom: "0.875rem" }}>
                  {selectedVehicule.photos!.map((url, i) => <img key={i} src={url} alt="" style={{ width: 120, height: 90, objectFit: "cover", borderRadius: "var(--radius)", border: "1px solid var(--border)" }} />)}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                <div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.15rem" }}>👤 Propriétaire</div>
                  {selectedVehicule.proprietaire_id ? (
                    <button onClick={() => gotoPersonne(selectedVehicule.proprietaire_id!)} className="btn btn-outline btn-sm">{fullName(personnes.find(p => p.id === selectedVehicule.proprietaire_id) || { nom: "Inconnu" } as Personne)}</button>
                  ) : <div style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>Aucun</div>}
                </div>
                {gangOf(selectedVehicule.groupe_id) && <div><div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.15rem" }}>🛡️ Groupe</div><div style={{ fontSize: "0.82rem" }}>{gangOf(selectedVehicule.groupe_id)!.nom}</div></div>}
              </div>

              {selectedVehicule.notes && <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.875rem", background: "var(--surface)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--gold)" }}><div style={{ fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: "0.2rem" }}>📝 Notes</div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{selectedVehicule.notes}</div></div>}

              {autresFichesPourPlaque(selectedVehicule.plaque, selectedVehicule.id).length > 0 && (
                <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.875rem", background: "rgba(249,115,22,0.08)", borderRadius: "var(--radius)", borderLeft: "3px solid #f97316" }}>
                  <div style={{ fontSize: "0.68rem", color: "#f97316", fontWeight: 700, marginBottom: "0.35rem" }}>⚠️ Plaque récurrente — autres fiches avec la même plaque</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {autresFichesPourPlaque(selectedVehicule.plaque, selectedVehicule.id).map(v => (
                      <button key={v.id} onClick={() => gotoVehicule(v.id)} className="card" style={{ padding: "0.35rem 0.6rem", cursor: "pointer", fontSize: "0.76rem" }}>
                        {v.marque_modele || "Véhicule"}{v.proprietaire_id ? " · " + fullName(personnes.find(p => p.id === v.proprietaire_id) || { nom: "Inconnu" } as Personne) : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : <div className="empty-state" style={{ alignSelf: "start", padding: "3rem" }}><div className="empty-icon">🚗</div><div className="empty-title">Sélectionnez un véhicule</div></div>}
        </div>
      )}

      {/* ─── Onglet Groupes ───────────────────────────────────────────── */}
      {tab === "groupes" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem", alignItems: "start" }}>
          <div>
            {canWrite && <div style={{ marginBottom: "0.75rem" }}><button className="btn btn-gold btn-sm" onClick={() => setShowGroupeForm(true)}>+ Nouveau groupe</button></div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {gangs.map(g => {
                const isSel = selectedGroupeId === g.id;
                return (
                  <button key={g.id} onClick={() => setSelectedGroupeId(g.id)} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-lg)", background: isSel ? "var(--gold-muted)" : "var(--card)", border: `1px solid ${isSel ? "rgba(var(--gold-rgb), 0.4)" : "var(--border)"}`, cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <span>🛡️</span>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{g.nom}</div><div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>{gangTypeLabel(g.type)}</div></div>
                  </button>
                );
              })}
              {gangs.length === 0 && <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "1.5rem 0", fontSize: "0.82rem" }}>Aucun groupe</div>}
            </div>
          </div>

          {selectedGroupe ? (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div><h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.2rem", margin: 0 }}>🛡️ {selectedGroupe.nom}</h2><div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{gangTypeLabel(selectedGroupe.type)}</div></div>
                {canWrite && <button className="btn btn-ghost btn-sm" onClick={() => removeGroupe(selectedGroupe.id)} style={{ color: "var(--danger)" }}>🗑️</button>}
              </div>

              <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>👤 Membres ({membresDe(selectedGroupe.id).length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1rem" }}>
                {membresDe(selectedGroupe.id).map(p => <button key={p.id} onClick={() => gotoPersonne(p.id)} className="card" style={{ padding: "0.4rem 0.7rem", cursor: "pointer", fontSize: "0.78rem" }}>{fullName(p)}</button>)}
                {membresDe(selectedGroupe.id).length === 0 && <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Aucun membre</div>}
              </div>

              <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>🚗 Véhicules ({vehiculesGroupe(selectedGroupe.id).length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {vehiculesGroupe(selectedGroupe.id).map(v => <button key={v.id} onClick={() => gotoVehicule(v.id)} className="card" style={{ padding: "0.4rem 0.7rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{v.plaque}</button>)}
                {vehiculesGroupe(selectedGroupe.id).length === 0 && <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Aucun véhicule</div>}
              </div>
            </div>
          ) : <div className="empty-state" style={{ alignSelf: "start", padding: "3rem" }}><div className="empty-icon">🛡️</div><div className="empty-title">Sélectionnez un groupe</div></div>}
        </div>
      )}

      {/* ─── Modale Personne ──────────────────────────────────────────── */}
      {showPersonneForm && (
        <Modal title={<>{editPersonneId ? "Modifier" : "Nouveau"} recensement</>} onClose={() => setShowPersonneForm(false)} size="lg" footer={<><button className="btn btn-outline" onClick={() => setShowPersonneForm(false)}>Annuler</button><button className="btn btn-gold" onClick={savePersonne} disabled={savingPersonne || !personneForm.nom}>{savingPersonne ? "…" : "Sauvegarder"}</button></>}>
          <div style={{ maxHeight: "62vh", overflowY: "auto" }}>
            {!editPersonneId && (
              <div style={{ position: "relative", marginBottom: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>🔎 Import rapide — vérifier si la fiche existe déjà (nom, tel)</label>
                  <input value={quickImportQuery} onChange={e => setQuickImportQuery(e.target.value)} placeholder="Taper un nom ou un téléphone…" />
                </div>
                {quickImportMatches.length > 0 && (
                  <div className="card" style={{ marginTop: 6, padding: "0.4rem" }}>
                    {quickImportMatches.map(p => (
                      <button key={p.id} onClick={() => importPersonne(p)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "0.45rem 0.6rem", borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}>
                        <span>👤</span><span style={{ fontWeight: 600 }}>{fullName(p)}</span>
                        {p.telephone && <span style={{ color: "var(--text-dim)", fontSize: "0.72rem" }}>{p.telephone}</span>}
                        <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--gold)" }}>Ouvrir →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 14, marginBottom: "1rem" }}>
              <PhotoSlot url={personneForm.photo_identite} icon="🪪" label="Carte ID" size={92} onUpload={f => uploadPersonnePhoto("photo_identite", f)} />
              <PhotoSlot url={personneForm.photo_police} icon="👮" label="Photo police" size={92} onUpload={f => uploadPersonnePhoto("photo_police", f)} />
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Nom *</label><input autoFocus value={personneForm.nom} onChange={e => setPersonneForm(f => ({ ...f, nom: e.target.value }))} /></div>
              <div className="form-group"><label>Prénom</label><input value={personneForm.prenom} onChange={e => setPersonneForm(f => ({ ...f, prenom: e.target.value }))} /></div>
              <div className="form-group"><label>Surnom / alias</label><input value={personneForm.surnom} onChange={e => setPersonneForm(f => ({ ...f, surnom: e.target.value }))} /></div>
              <div className="form-group"><label>Téléphone</label><input value={personneForm.telephone} onChange={e => setPersonneForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              <div className="form-group"><label>Priorité</label><select value={personneForm.priorite} onChange={e => setPersonneForm(f => ({ ...f, priorite: e.target.value }))}>{PRIOS.map(p => <option key={p}>{p}</option>)}</select></div>
              <div className="form-group"><label>Statut</label><input value={personneForm.statut} onChange={e => setPersonneForm(f => ({ ...f, statut: e.target.value }))} /></div>
              <div className="form-group"><label>Groupe / Organisation</label><select value={personneForm.groupe_id || ""} onChange={e => setPersonneForm(f => ({ ...f, groupe_id: e.target.value || null }))}><option value="">Aucun</option>{gangs.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}</select></div>
              <div className="form-group"><label>📍 Point chaud (recensement)</label><select value={formPointId} onChange={e => setFormPointId(e.target.value)}><option value="">Aucun</option>{[...points].sort((a, b) => a.title.localeCompare(b.title)).map(pt => <option key={pt.id} value={pt.id}>{pt.title}</option>)}</select></div>
              <div className="form-group"><label>Occupation</label><input value={personneForm.occupation} onChange={e => setPersonneForm(f => ({ ...f, occupation: e.target.value }))} /></div>
              <div className="form-group"><label>Origine</label><input value={personneForm.origine} onChange={e => setPersonneForm(f => ({ ...f, origine: e.target.value }))} /></div>
              <div className="form-group"><label>Âge</label><input type="number" value={personneForm.age || ""} onChange={e => setPersonneForm(f => ({ ...f, age: +e.target.value }))} /></div>
              <div className="form-group"><label>Récompense (avis de recherche, $)</label><input type="number" min={0} value={(personneForm as any).prime || ""} onChange={e => setPersonneForm(f => ({ ...f, prime: +e.target.value } as any))} /></div>
              <div className="form-group"><label>Tags (virgule)</label><input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="suspect,fournisseur,ennemi" /></div>
            </div>
            <div className="form-group"><label>Adresses</label><textarea rows={2} value={personneForm.adresses} onChange={e => setPersonneForm(f => ({ ...f, adresses: e.target.value }))} /></div>
            <div className="form-group"><label>Comptes bancaires RP</label><textarea rows={2} value={personneForm.comptes_bancaires} onChange={e => setPersonneForm(f => ({ ...f, comptes_bancaires: e.target.value }))} /></div>
            <div className="form-group"><label>Relations</label><textarea rows={2} value={personneForm.relations} onChange={e => setPersonneForm(f => ({ ...f, relations: e.target.value }))} /></div>

            <div className="form-group" style={{ position: "relative" }}>
              <label>🔗 Dossiers liés</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {(personneForm.liens_ids || []).map(id => {
                  const p2 = personnes.find(x => x.id === id);
                  return (
                    <span key={id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: 999, background: "var(--gold-muted)", color: "var(--gold)", border: "1px solid rgba(var(--gold-rgb), 0.3)" }}>
                      {p2 ? fullName(p2) : "?"}
                      <button onClick={() => removeLien(id)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: 700, padding: 0 }}>×</button>
                    </span>
                  );
                })}
              </div>
              <input value={liensQuery} onChange={e => setLiensQuery(e.target.value)} placeholder="Chercher une personne à lier…" />
              {liensMatches.length > 0 && (
                <div className="card" style={{ position: "absolute", zIndex: 10, marginTop: 4, padding: "0.35rem", width: "100%" }}>
                  {liensMatches.map(p => (
                    <button key={p.id} onClick={() => addLien(p.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.4rem 0.55rem", borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: "0.78rem" }}>{fullName(p)}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group"><label>Notes</label><textarea rows={3} value={personneForm.notes_publiques} onChange={e => setPersonneForm(f => ({ ...f, notes_publiques: e.target.value }))} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Notes privées 🔒</label><textarea rows={2} value={personneForm.notes_privees} onChange={e => setPersonneForm(f => ({ ...f, notes_privees: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {/* ─── Modale Véhicule ──────────────────────────────────────────── */}
      {showVehiculeForm && (
        <Modal title={<>{editVehiculeId ? "Modifier" : "Nouveau"} véhicule</>} onClose={() => setShowVehiculeForm(false)} footer={<><button className="btn btn-outline" onClick={() => setShowVehiculeForm(false)}>Annuler</button><button className="btn btn-gold" onClick={saveVehicule} disabled={savingVehicule || !vehiculeForm.plaque}>{savingVehicule ? "…" : "Sauvegarder"}</button></>}>
          <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>📸 Photos (3 max)</label>
          <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
            {(vehiculeForm.photos || []).map((url, i) => (
              <div key={i} style={{ position: "relative", width: 84, height: 64, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.35)" }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => removeVehiculePhoto(i)} style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", borderRadius: "50%", width: 17, height: 17, fontSize: 10, cursor: "pointer", lineHeight: "17px" }}>×</button>
              </div>
            ))}
            {(vehiculeForm.photos || []).length < 3 && (
              <div style={{ width: 84, height: 64, borderRadius: 8, background: "linear-gradient(160deg, var(--surface), var(--card))", border: "1px dashed var(--border-light)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, position: "relative" }}>
                <span style={{ fontSize: "1.1rem", color: "var(--gold)", opacity: 0.8 }}>+</span>
                <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Ajouter</span>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && addVehiculePhoto(e.target.files[0])} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
              </div>
            )}
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Plaque *</label>
              <input autoFocus value={vehiculeForm.plaque} onChange={e => setVehiculeForm(f => ({ ...f, plaque: e.target.value.toUpperCase() }))} />
              {vehiculeFormDoublons.length > 0 && (
                <div style={{ marginTop: 6, padding: "0.5rem 0.7rem", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "var(--radius)", fontSize: "0.74rem", color: "#f97316" }}>
                  ⚠️ Plaque déjà enregistrée sur {vehiculeFormDoublons.length} autre(s) fiche(s) : {vehiculeFormDoublons.map(v => v.marque_modele || v.plaque).join(", ")}
                </div>
              )}
            </div>
            <div className="form-group"><label>Marque / modèle</label><input value={vehiculeForm.marque_modele} onChange={e => setVehiculeForm(f => ({ ...f, marque_modele: e.target.value }))} /></div>
            <div className="form-group"><label>Couleur</label><input value={vehiculeForm.couleur} onChange={e => setVehiculeForm(f => ({ ...f, couleur: e.target.value }))} /></div>
            <div className="form-group"><label>Propriétaire</label><select value={vehiculeForm.proprietaire_id || ""} onChange={e => setVehiculeForm(f => ({ ...f, proprietaire_id: e.target.value || null }))}><option value="">Aucun</option>{personnes.map(p => <option key={p.id} value={p.id}>{fullName(p)}</option>)}</select></div>
            <div className="form-group"><label>Groupe</label><select value={vehiculeForm.groupe_id || ""} onChange={e => setVehiculeForm(f => ({ ...f, groupe_id: e.target.value || null }))}><option value="">Aucun</option>{gangs.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}</select></div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Notes</label><textarea rows={2} value={vehiculeForm.notes} onChange={e => setVehiculeForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </Modal>
      )}

      {wantedP && (
        <Modal title="🧾 Avis de recherche" size="lg" onClose={() => setWantedP(null)}>
          <WantedPoster d={{ nom: fullName(wantedP), alias: wantedP.surnom, organisation: gangOf(wantedP.groupe_id)?.nom || wantedP.organisation, priorite: wantedP.priorite, prime: (wantedP as any).prime, photo_url: wantedP.photo_police || wantedP.photo_identite, photo_id: wantedP.photo_police ? wantedP.photo_identite : null, motif: (wantedP.notes_publiques || "").split("\n")[0].slice(0, 140), age: wantedP.age, origine: wantedP.origine, occupation: wantedP.occupation, vehicules: undefined, tags: wantedP.tags }} />
        </Modal>
      )}

      {/* ─── Modale Groupe ────────────────────────────────────────────── */}
      {showGroupeForm && (
        <Modal title="Nouveau groupe" onClose={() => setShowGroupeForm(false)} footer={<><button className="btn btn-outline" onClick={() => setShowGroupeForm(false)}>Annuler</button><button className="btn btn-gold" onClick={addGroupe} disabled={!groupeNom.trim()}>Créer</button></>}>
          <div className="form-group"><label>Nom</label><input autoFocus value={groupeNom} onChange={e => setGroupeNom(e.target.value)} /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Type</label><select value={groupeType} onChange={e => setGroupeType(e.target.value as Gang["type"])}><option value="orga">Orga</option><option value="gang">Gang</option><option value="pf">PF</option><option value="inde">Indé</option></select></div>
        </Modal>
      )}

      <Toast toast={toast} />
    </div>
  );
}
