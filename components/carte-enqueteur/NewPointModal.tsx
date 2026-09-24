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

type PointType = 'laboratoire' | 'table_purification' | 'autre';

const TYPE_OPTIONS: { key: PointType; label: string; icon: string }[] = [
  { key: 'laboratoire', label: 'Laboratoire', icon: '🧪' },
  { key: 'table_purification', label: 'Table de purification', icon: '⚗️' },
  { key: 'autre', label: 'Autre', icon: '📍' },
];

interface Props {
  presets: Preset[];
  onCancel: () => void;
  onConfirm: (title: string, iconUrl?: string, drogueLiee?: string, pointType?: PointType) => void;
}

export default function NewPointModal({ presets, onCancel, onConfirm }: Props) {
  const [step, setStep] = useState<'type' | 'drogue' | 'titre'>('type');
  const [pointType, setPointType] = useState<PointType | null>(null);
  const [selectedDrogue, setSelectedDrogue] = useState<{ nom: string; icon_url?: string } | null>(null);
  const [title, setTitle] = useState('');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q ? presets.filter((p) => p.nom.toLowerCase().includes(q)) : presets;
  const composants = filtered.filter((p) => p.groupe === 'composant');
  const drogues = filtered.filter((p) => p.groupe === 'drogue');
  const autres = filtered.filter((p) => p.groupe !== 'composant' && p.groupe !== 'drogue');

  function pickType(t: PointType) {
    setPointType(t);
    if (t === 'laboratoire' || t === 'table_purification') {
      setStep('drogue');
    } else {
      setStep('titre');
    }
  }

  function pickDrogue(preset: Preset) {
    setSelectedDrogue({ nom: preset.nom, icon_url: preset.icon_url });
    setTitle(`${pointType === 'laboratoire' ? 'Labo' : 'Table'} — ${preset.nom}`);
    setStep('titre');
  }

  function skipDrogue() {
    setSelectedDrogue(null);
    setStep('titre');
  }

  function confirm() {
    if (!title.trim()) return;
    onConfirm(title.trim(), selectedDrogue?.icon_url, selectedDrogue?.nom, pointType ?? undefined);
  }

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
              onClick={() => pickDrogue(p)}
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
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {step === 'type' && 'Nouveau point chaud'}
            {step === 'drogue' && 'Drogue liée'}
            {step === 'titre' && 'Titre du point'}
          </h3>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* ÉTAPE 1 : type de point */}
        {step === 'type' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.key}
                onClick={() => pickType(t.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: `1px solid ${colors.borderLight}`,
                  background: 'rgba(15,23,42,0.5)',
                  color: colors.text,
                  cursor: 'pointer',
                  fontSize: 14,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ÉTAPE 2 : choix de la drogue liée */}
        {step === 'drogue' && (
          <>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une drogue…"
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderGroup('Composants de fabrication', composants)}
              {renderGroup('Drogue', drogues)}
              {renderGroup('Autre', autres)}
              {filtered.length === 0 && (
                <div style={{ fontSize: 12, color: colors.textDimmer, textAlign: 'center', padding: 16 }}>
                  Aucun résultat.
                </div>
              )}
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep('type')} style={{ background: 'transparent', border: 'none', color: colors.textDim, fontSize: 13, cursor: 'pointer' }}>
                ← Retour
              </button>
              <button onClick={skipDrogue} style={{ background: 'transparent', border: 'none', color: colors.amber, fontSize: 13, cursor: 'pointer' }}>
                Passer cette étape →
              </button>
            </div>
          </>
        )}

        {/* ÉTAPE 3 : titre libre */}
        {step === 'titre' && (
          <>
            {selectedDrogue && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                padding: '6px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.1)',
                border: `1px solid ${colors.amber}40`, fontSize: 12, color: colors.amber,
              }}>
                {selectedDrogue.icon_url && <img src={selectedDrogue.icon_url} style={{ width: 20, height: 20, borderRadius: 4 }} />}
                Drogue liée : {selectedDrogue.nom}
              </div>
            )}
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirm()}
              placeholder="Nom du point (ex: Labo Del Perro)"
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep(pointType === 'autre' ? 'type' : 'drogue')}
                style={{ background: 'transparent', border: 'none', color: colors.textDim, fontSize: 13, cursor: 'pointer' }}
              >
                ← Retour
              </button>
              <button
                onClick={confirm}
                disabled={!title.trim()}
                style={{
                  borderRadius: 6, background: colors.amber, color: '#1a1206', border: 'none',
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  opacity: title.trim() ? 1 : 0.5,
                }}
              >
                Créer le point
              </button>
            </div>
          </>
        )}

        {step === 'type' && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: colors.textDim, fontSize: 13, cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}