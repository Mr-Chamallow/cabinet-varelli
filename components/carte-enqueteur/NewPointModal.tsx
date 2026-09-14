'use client';

import { useState } from 'react';
import type { Preset } from './types';

const colors = {
  panel: '#111826',
  border: '#1e293b',
  borderLight: '#334155',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textDimmer: '#64748b',
  amber: '#f59e0b',
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
  presets: Preset[];
  onCancel: () => void;
  onConfirm: (title: string, iconUrl?: string) => void;
}

export default function NewPointModal({ presets, onCancel, onConfirm }: Props) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q ? presets.filter((p) => p.nom.toLowerCase().includes(q)) : presets;
  const composants = filtered.filter((p) => p.groupe === 'composant');
  const drogues = filtered.filter((p) => p.groupe === 'drogue');
  const autres = filtered.filter((p) => p.groupe !== 'composant' && p.groupe !== 'drogue');

  const renderGroup = (label: string, items: Preset[]) =>
    items.length > 0 && (
      <div key={label} style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textDimmer, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.map((p) => (
            <button
              key={p.id}
              onClick={() => onConfirm(p.nom, p.icon_url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: 'rgba(15,23,42,0.7)',
                padding: '5px 8px 5px 5px',
                cursor: 'pointer',
                color: colors.text,
                fontSize: 12,
              }}
            >
              <img src={p.icon_url} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
              {p.nom}
            </button>
          ))}
        </div>
      </div>
    );

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
          maxWidth: 460,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 8,
          border: `1px solid ${colors.borderLight}`,
          background: colors.panel,
          color: colors.text,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          padding: 16,
        }}
      >
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Nouveau point chaud</h3>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) onConfirm(query.trim());
          }}
          placeholder="Cherche un modèle, ou tape un titre libre puis Entrée…"
          style={{ ...inputStyle, marginBottom: 12 }}
        />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderGroup('Composants de fabrication', composants)}
          {renderGroup('Drogue', drogues)}
          {renderGroup('Autre', autres)}
          {filtered.length === 0 && (
            <div style={{ fontSize: 12, color: colors.textDimmer, textAlign: 'center', padding: 16 }}>
              Aucun modèle ne correspond — appuie sur Entrée pour créer "{query}".
            </div>
          )}
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: colors.textDim, fontSize: 13, cursor: 'pointer' }}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
