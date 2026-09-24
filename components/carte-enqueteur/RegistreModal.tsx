'use client';

import { useEffect, useState } from 'react';
import type { Personne, Plaque } from './types';
import {
  createPersonne,
  createPlaque,
  deletePersonne,
  deletePlaque,
  fetchPersonnes,
  fetchPlaques,
  updatePersonne,
  updatePlaque,
} from './supabase-carte';

const colors = {
  bg: '#0F1420',
  panel: '#111826',
  border: '#1e293b',
  borderLight: '#334155',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textDimmer: '#64748b',
  amber: '#f59e0b',
  red: '#ef4444',
};

const inputStyle = {
  width: '100%',
  borderRadius: 6,
  border: `1px solid ${colors.borderLight}`,
  background: 'rgba(15,23,42,0.7)',
  padding: 8,
  fontSize: 13,
  color: colors.text,
  outline: 'none',
  boxSizing: 'border-box' as const,
};

interface Props {
  onClose: () => void;
  readOnly?: boolean;
}

export default function RegistreModal({ onClose, readOnly = false }: Props) {
  const [tab, setTab] = useState<'personnes' | 'plaques'>('personnes');
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [plaques, setPlaques] = useState<Plaque[]>([]);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, pl] = await Promise.all([fetchPersonnes(), fetchPlaques()]);
        setPersonnes(p);
        setPlaques(pl);
      } catch (err) {
        console.error(err);
        setLoadError("Connexion à Supabase indisponible — mode local (rien n'est sauvegardé).");
      }
    })();
  }, []);

  const q = search.trim().toLowerCase();
  const filteredPersonnes = personnes.filter(
    (p) => !q || `${p.nom} ${p.prenom ?? ''} ${p.notes ?? ''}`.toLowerCase().includes(q),
  );
  const filteredPlaques = plaques.filter((p) => {
    if (!q) return true;
    const owner = personnes.find((pe) => pe.id === p.personne_id);
    return `${p.plaque} ${p.notes ?? ''} ${owner ? owner.nom + ' ' + (owner.prenom ?? '') : ''}`
      .toLowerCase()
      .includes(q);
  });

  const addPersonne = async () => {
    const local: Personne = { id: `local-${Date.now()}`, nom: '', prenom: '', notes: '' };
    setPersonnes((p) => [local, ...p]);
    try {
      const saved = await createPersonne({ nom: '', prenom: '', notes: '' });
      setPersonnes((p) => p.map((x) => (x.id === local.id ? saved : x)));
    } catch (err) {
      console.error(err);
    }
  };

  const addPlaque = async () => {
    const local: Plaque = { id: `local-${Date.now()}`, plaque: '', personne_id: null, notes: '' };
    setPlaques((p) => [local, ...p]);
    try {
      const saved = await createPlaque({ plaque: '', personne_id: null, notes: '' });
      setPlaques((p) => p.map((x) => (x.id === local.id ? saved : x)));
    } catch (err) {
      console.error(err);
    }
  };

  const patchPersonne = (id: string, patch: Partial<Personne>) => {
    setPersonnes((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    updatePersonne(id, patch).catch(console.error);
  };

  const patchPlaque = (id: string, patch: Partial<Plaque>) => {
    setPlaques((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    updatePlaque(id, patch).catch(console.error);
  };

  const removePersonne = (id: string) => {
    if (!window.confirm('Supprimer cette personne ? Les plaques liées seront détachées (pas supprimées).')) return;
    setPersonnes((p) => p.filter((x) => x.id !== id));
    setPlaques((p) => p.map((x) => (x.personne_id === id ? { ...x, personne_id: null } : x)));
    deletePersonne(id).catch(console.error);
  };

  const removePlaque = (id: string) => {
    if (!window.confirm('Supprimer cette plaque ?')) return;
    setPlaques((p) => p.filter((x) => x.id !== id));
    deletePlaque(id).catch(console.error);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          height: 'min(85vh, 620px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 8,
          border: `1px solid ${colors.borderLight}`,
          background: colors.panel,
          color: colors.text,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ padding: 16, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            Registre
            {readOnly && (
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 999,
                background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.35)', color: colors.textDim,
              }}>
                🔒 Lecture seule
              </span>
            )}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border}`, padding: '0 16px' }}>
          {(['personnes', 'plaques'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 4px',
                marginRight: 20,
                background: 'transparent',
                border: 'none',
                borderBottom: tab === t ? `2px solid ${colors.amber}` : '2px solid transparent',
                color: tab === t ? colors.text : colors.textDimmer,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t === 'personnes' ? `Personnes (${personnes.length})` : `Plaques (${plaques.length})`}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom, une plaque, une note…"
            style={inputStyle}
          />
        </div>

        {loadError && (
          <div style={{ margin: '0 16px 8px', padding: '6px 10px', borderRadius: 6, background: 'rgba(127,29,29,0.4)', color: '#fee2e2', fontSize: 12 }}>
            {loadError}
          </div>
        )}

        <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}>
        <fieldset disabled={readOnly} style={{ border: 0, padding: 16, margin: 0 }}>
          {tab === 'personnes' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredPersonnes.map((p) => (
                <div key={p.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={p.nom}
                    onChange={(e) => patchPersonne(p.id, { nom: e.target.value })}
                    placeholder="Nom"
                    style={{ ...inputStyle, width: '28%' }}
                  />
                  <input
                    value={p.prenom ?? ''}
                    onChange={(e) => patchPersonne(p.id, { prenom: e.target.value })}
                    placeholder="Prénom"
                    style={{ ...inputStyle, width: '28%' }}
                  />
                  <input
                    value={p.notes ?? ''}
                    onChange={(e) => patchPersonne(p.id, { notes: e.target.value })}
                    placeholder="Notes"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button onClick={() => removePersonne(p.id)} style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {filteredPersonnes.length === 0 && (
                <div style={{ fontSize: 12, color: colors.textDimmer, textAlign: 'center', padding: 16 }}>Aucune personne.</div>
              )}
              <button
                onClick={addPersonne}
                style={{ marginTop: 4, alignSelf: 'flex-start', background: 'transparent', border: 'none', color: colors.amber, fontSize: 12, cursor: 'pointer' }}
              >
                + Ajouter une personne
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredPlaques.map((p) => (
                <div key={p.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={p.plaque}
                    onChange={(e) => patchPlaque(p.id, { plaque: e.target.value.toUpperCase() })}
                    placeholder="Plaque"
                    style={{ ...inputStyle, width: '22%', fontFamily: "var(--font-mono)", textTransform: 'uppercase' }}
                  />
                  <select
                    value={p.personne_id ?? ''}
                    onChange={(e) => patchPlaque(p.id, { personne_id: e.target.value || null })}
                    style={{ ...inputStyle, width: '30%' }}
                  >
                    <option value="">— Propriétaire inconnu —</option>
                    {personnes.map((pe) => (
                      <option key={pe.id} value={pe.id}>
                        {pe.nom} {pe.prenom ?? ''}
                      </option>
                    ))}
                  </select>
                  <input
                    value={p.notes ?? ''}
                    onChange={(e) => patchPlaque(p.id, { notes: e.target.value })}
                    placeholder="Notes"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button onClick={() => removePlaque(p.id)} style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {filteredPlaques.length === 0 && (
                <div style={{ fontSize: 12, color: colors.textDimmer, textAlign: 'center', padding: 16 }}>Aucune plaque.</div>
              )}
              <button
                onClick={addPlaque}
                style={{ marginTop: 4, alignSelf: 'flex-start', background: 'transparent', border: 'none', color: colors.amber, fontSize: 12, cursor: 'pointer' }}
              >
                + Ajouter une plaque
              </button>
            </div>
          )}
        </fieldset>
        </div>
      </div>
    </div>
  );
}
