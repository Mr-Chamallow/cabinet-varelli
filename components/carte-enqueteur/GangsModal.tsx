'use client';

import { useState } from 'react';
import type { Gang } from './types';

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
  borderRadius: 6,
  border: `1px solid ${colors.borderLight}`,
  background: 'rgba(15,23,42,0.7)',
  padding: 7,
  fontSize: 13,
  color: colors.text,
  outline: 'none',
  boxSizing: 'border-box' as const,
};

interface Props {
  gangs: Gang[];
  onClose: () => void;
  onAdd: (nom: string, type: Gang['type']) => void;
  onRename: (id: string, nom: string) => void;
  onRetype: (id: string, type: Gang['type']) => void;
  onDelete: (id: string) => void;
}

export default function GangsModal({ gangs, onClose, onAdd, onRename, onRetype, onDelete }: Props) {
  const [newNom, setNewNom] = useState('');
  const [newType, setNewType] = useState<Gang['type']>('orga');

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
          maxWidth: 480,
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
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Gérer les groupes</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {gangs.map((g) => (
            <div key={g.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                value={g.nom}
                onChange={(e) => onRename(g.id, e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <select
                value={g.type}
                onChange={(e) => onRetype(g.id, e.target.value as Gang['type'])}
                style={{ ...inputStyle, width: 80 }}
              >
                <option value="orga">Orga</option>
                <option value="pf">PF</option>
                <option value="inde">Indé</option>
              </select>
              <button
                onClick={() => {
                  if (window.confirm(`Supprimer "${g.nom}" ?`)) onDelete(g.id);
                }}
                style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          ))}
          {gangs.length === 0 && (
            <div style={{ fontSize: 12, color: colors.textDimmer, textAlign: 'center', padding: 16 }}>Aucun groupe.</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={newNom}
            onChange={(e) => setNewNom(e.target.value)}
            placeholder="Nom du groupe"
            style={{ ...inputStyle, flex: 1 }}
          />
          <select value={newType} onChange={(e) => setNewType(e.target.value as Gang['type'])} style={{ ...inputStyle, width: 80 }}>
            <option value="orga">Orga</option>
            <option value="pf">PF</option>
            <option value="inde">Indé</option>
          </select>
          <button
            onClick={() => {
              if (!newNom.trim()) return;
              onAdd(newNom.trim(), newType);
              setNewNom('');
            }}
            style={{ borderRadius: 6, background: colors.amber, color: '#1a1206', border: 'none', padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Ajouter
          </button>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: colors.textDim, fontSize: 13, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
