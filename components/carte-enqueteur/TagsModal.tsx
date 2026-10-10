'use client';

import { useState } from 'react';
import { Category } from './types';

interface TagsModalProps {
  categories: Category[];
  onClose: () => void;
  onAdd: (label: string, color: string) => Promise<void>;
  onRename: (id: string, label: string) => Promise<void>;
  onRecolor: (id: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TagsModal({
  categories,
  onClose,
  onAdd,
  onRename,
  onRecolor,
  onDelete,
}: TagsModalProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setLoading(true);
    await onAdd(newLabel.trim(), newColor);
    setNewLabel('');
    setLoading(false);
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
          maxWidth: 480,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: 16,
          color: 'var(--text)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Gestion des Catégories</h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        </div>

        {/* Formulaire de création */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            style={{ width: 40, height: 36, border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
          />
          <input
            type="text"
            placeholder="Nouvelle catégorie…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            style={{
              flex: 1,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'rgba(15,23,42,0.7)',
              padding: '6px 10px',
              fontSize: 14,
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !newLabel.trim()}
            style={{
              borderRadius: 6,
              background: '#f59e0b',
              color: 'var(--card)',
              fontWeight: 600,
              fontSize: 13,
              padding: '6px 12px',
              border: 'none',
              cursor: 'pointer',
              opacity: loading || !newLabel.trim() ? 0.5 : 1,
            }}
          >
            Ajouter
          </button>
        </form>

        {/* Liste des catégories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid var(--border)',
              }}
            >
              <input
                type="color"
                value={cat.color}
                onChange={(e) => onRecolor(cat.id, e.target.value)}
                style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={cat.label}
                onChange={(e) => onRename(cat.id, e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => onDelete(cat.id)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 12 }}>
              Aucune catégorie enregistrée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}