'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CartePoint,
  Dossier,
  DossierPiece,
  PIN_CATEGORIES,
  PinCategory,
  categoryColor,
} from './types';
import {
  createPoint,
  deletePoint,
  fetchDossiers,
  fetchPoints,
  updatePoint,
  upsertDossier,
} from './supabase-carte';

// ------------------------------------------------------------------
// Calibration par dÃ©faut, mesurÃ©e sur le pack de cartes 8000Ã—8000
// (grille + satellite fournis). Le point (0,0) du jeu tombe au pixel
// (3667, 5395) de l'image, Ã  raison de 0.645 px par unitÃ© de coordonnÃ©e
// GTA sur les deux axes. Si tu changes d'image (autre rÃ©solution/crop),
// il faut recalibrer ces trois valeurs â€” voir le README.
// ------------------------------------------------------------------
const DEFAULT_SCALE = 0.645;
const DEFAULT_ORIGIN = { px: 3667, py: 5395 };

interface Props {
  mapImageUrl: string;
  imageWidth: number;
  imageHeight: number;
  scale?: number;
  origin?: { px: number; py: number };
}

export default function MapCanvas({
  mapImageUrl,
  imageWidth,
  imageHeight,
  scale = DEFAULT_SCALE,
  origin = DEFAULT_ORIGIN,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const coordsLabelRef = useRef<HTMLDivElement>(null);
  const addModeRef = useRef(false);

  const [points, setPoints] = useState<CartePoint[]>([]);
  const [dossiers, setDossiers] = useState<Record<string, Dossier>>({});
  const [addMode, setAddMode] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<PinCategory>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ point: CartePoint; dossier: Dossier } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    addModeRef.current = addMode;
  }, [addMode]);

  // --- Conversions coordonnÃ©es jeu <-> pixels Leaflet (CRS.Simple : [lat,lng] = [row,col]) ---
  const gameToLatLng = (x: number, y: number): L.LatLngExpression => {
    const col = origin.px + x * scale;
    const row = origin.py - y * scale;
    return [row, col];
  };
  const latLngToGame = (lat: number, lng: number) => ({
    x: (lng - origin.px) / scale,
    y: (origin.py - lat) / scale,
  });

  // --- Initialisation de la carte (une seule fois) ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -4,
      maxZoom: 3,
      zoomSnap: 0.25,
      attributionControl: false,
    });

    const bounds: L.LatLngBoundsExpression = [
      [0, 0],
      [imageHeight, imageWidth],
    ];
    L.imageOverlay(mapImageUrl, bounds).addTo(map);
    map.fitBounds(bounds);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!coordsLabelRef.current) return;
      const { x, y } = latLngToGame(e.latlng.lat, e.latlng.lng);
      coordsLabelRef.current.textContent = `X: ${x.toFixed(0)}  Y: ${y.toFixed(0)}`;
    });

    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (!addModeRef.current) return;
      const { x, y } = latLngToGame(e.latlng.lat, e.latlng.lng);
      const title = window.prompt('Titre du point (ex : "Planque â€” Vespucci Canals")');
      setAddModeState(false);
      if (!title) return;

      const localId = `local-${Date.now()}`;
      const localPoint: CartePoint = { id: localId, x, y, category: 'autre', title };
      setPoints((p) => [...p, localPoint]);
      try {
        const saved = await createPoint({ x, y, category: 'autre', title });
        setPoints((p) => p.map((pt) => (pt.id === localId ? saved : pt)));
        setEditing({
          point: saved,
          dossier: { id: '', point_id: saved.id, description: '', tags: [], pieces: [] },
        });
      } catch (err) {
        console.error(err);
        setEditing({
          point: localPoint,
          dossier: { id: '', point_id: localPoint.id, description: '', tags: [], pieces: [] },
        });
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapImageUrl, imageWidth, imageHeight]);

  // petit helper pour Ã©viter la confusion entre le setState React et la ref utilisÃ©e par le handler Leaflet
  function setAddModeState(v: boolean) {
    setAddMode(v);
  }

  // --- Chargement initial depuis Supabase ---
  useEffect(() => {
    (async () => {
      try {
        const [pts, doss] = await Promise.all([fetchPoints(), fetchDossiers()]);
        setPoints(pts);
        const map: Record<string, Dossier> = {};
        doss.forEach((d) => (map[d.point_id] = d));
        setDossiers(map);
      } catch (err) {
        console.error(err);
        setLoadError("Connexion Ã  Supabase indisponible â€” mode local (rien n'est sauvegardÃ©).");
      }
    })();
  }, []);

  // --- Filtrage ---
  const visiblePoints = points.filter((p) => {
    if (activeFilters.size > 0 && !activeFilters.has(p.category)) return false;
    if (!search.trim()) return true;
    const dossier = dossiers[p.id];
    const haystack = `${p.title} ${dossier?.description ?? ''} ${(dossier?.tags ?? []).join(' ')}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  // --- Rendu des marqueurs Ã  chaque changement pertinent ---
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;
    layerGroup.clearLayers();

    visiblePoints.forEach((p) => {
      const icon = p.icon_url
        ? L.icon({ iconUrl: p.icon_url, iconSize: [30, 30], iconAnchor: [15, 30] })
        : L.divIcon({
            className: '',
            html: `<div style="width:16px;height:16px;border-radius:50%;background:${categoryColor(
              p.category,
            )};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 0 2px rgba(0,0,0,0.35);${
              p.id === selectedId ? 'outline:2px solid white;' : ''
            }"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

      const marker = L.marker(gameToLatLng(p.x, p.y), { icon });
      marker.on('click', () => {
        setSelectedId(p.id);
        setEditing({
          point: p,
          dossier: dossiers[p.id] ?? { id: '', point_id: p.id, description: '', tags: [], pieces: [] },
        });
      });
      marker.bindTooltip(p.title, { direction: 'top', offset: [0, -10] });
      marker.addTo(layerGroup);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePoints, selectedId, dossiers]);

  const flyToPoint = (p: CartePoint) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(gameToLatLng(p.x, p.y), Math.max(map.getZoom(), 0));
  };

  const saveEditing = async () => {
    if (!editing) return;
    const { point, dossier } = editing;
    setPoints((p) => p.map((pt) => (pt.id === point.id ? point : pt)));
    setDossiers((d) => ({ ...d, [point.id]: dossier }));
    try {
      await updatePoint(point.id, {
        title: point.title,
        category: point.category,
        x: point.x,
        y: point.y,
        icon_url: point.icon_url ?? null,
      });
      await upsertDossier(dossier);
    } catch (err) {
      console.error(err);
    }
    setEditing(null);
  };

  const removePoint = async (id: string) => {
    if (!window.confirm('Supprimer ce point et son dossier ?')) return;
    setPoints((p) => p.filter((pt) => pt.id !== id));
    setDossiers((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });
    setEditing(null);
    if (selectedId === id) setSelectedId(null);
    try {
      await deletePoint(id);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFilter = (cat: PinCategory) => {
    setActiveFilters((f) => {
      const next = new Set(f);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex h-[720px] w-full overflow-hidden rounded-lg border border-slate-800 bg-[#0F1420] text-slate-200">
      <div className="relative flex-1">
        {/* Barre d'outils */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-wrap items-center gap-2 p-3">
          <button
            onClick={() => setAddMode((v) => !v)}
            className={`pointer-events-auto rounded-md px-3 py-1.5 text-sm font-medium transition ${
              addMode ? 'bg-amber-500 text-black' : 'bg-slate-800/90 hover:bg-slate-700'
            }`}
          >
            {addMode ? 'Clique sur la carteâ€¦' : '+ Nouveau point'}
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un dossier, un tagâ€¦"
            className="pointer-events-auto w-56 rounded-md border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {PIN_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => toggleFilter(c.value)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/90 px-2 py-1 text-xs"
              style={{ opacity: activeFilters.size === 0 || activeFilters.has(c.value) ? 1 : 0.35 }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Lecture des coordonnÃ©es sous le curseur */}
        <div
          ref={coordsLabelRef}
          className="pointer-events-none absolute bottom-3 right-3 z-[1000] rounded-md bg-slate-900/90 px-2 py-1 font-mono text-xs text-slate-300"
        >
          X: â€”  Y: â€”
        </div>

        {loadError && (
          <div className="pointer-events-none absolute right-3 top-16 z-[1000] rounded-md bg-red-900/80 px-3 py-1.5 text-xs text-red-100">
            {loadError}
          </div>
        )}

        <div
          ref={containerRef}
          className={`h-full w-full ${addMode ? 'cursor-crosshair' : ''}`}
          style={{ background: '#0B0F18' }}
        />
      </div>

      {/* Sidebar dossiers */}
      <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-800 bg-[#0B0F18] p-3">
        <h3 className="mb-2 font-mono text-xs uppercase tracking-wide text-slate-500">
          Dossiers ({visiblePoints.length})
        </h3>
        <ul className="space-y-1.5">
          {visiblePoints.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  setSelectedId(p.id);
                  flyToPoint(p);
                  setEditing({
                    point: p,
                    dossier: dossiers[p.id] ?? { id: '', point_id: p.id, description: '', tags: [], pieces: [] },
                  });
                }}
                className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-800/70 ${
                  p.id === selectedId ? 'bg-slate-800' : ''
                }`}
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: categoryColor(p.category) }} />
                <span>
                  <div className="text-slate-100">{p.title}</div>
                  <div className="font-mono text-[11px] text-slate-600">
                    X {p.x.toFixed(0)} / Y {p.y.toFixed(0)}
                  </div>
                  <div className="line-clamp-2 text-xs text-slate-500">
                    {dossiers[p.id]?.description || 'Aucune note pour le moment.'}
                  </div>
                </span>
              </button>
            </li>
          ))}
          {visiblePoints.length === 0 && (
            <li className="px-2 py-4 text-center text-xs text-slate-600">Aucun point ne correspond.</li>
          )}
        </ul>
      </aside>

      {editing && (
        <DossierModal
          point={editing.point}
          dossier={editing.dossier}
          onChange={(point, dossier) => setEditing({ point, dossier })}
          onClose={() => setEditing(null)}
          onSave={saveEditing}
          onDelete={() => removePoint(editing.point.id)}
        />
      )}
    </div>
  );
}

function DossierModal({
  point,
  dossier,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  point: CartePoint;
  dossier: Dossier;
  onChange: (point: CartePoint, dossier: Dossier) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [tagsInput, setTagsInput] = useState(dossier.tags.join(', '));
  const [pieces, setPieces] = useState<DossierPiece[]>(dossier.pieces);

  const commit = (patchPoint: Partial<CartePoint>, patchDossier: Partial<Dossier>) => {
    onChange({ ...point, ...patchPoint }, { ...dossier, ...patchDossier });
  };

  const updatePiece = (idx: number, patch: Partial<DossierPiece>) => {
    const next = pieces.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    setPieces(next);
    commit({}, { pieces: next });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-[#111826] p-4 text-slate-200 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <input
            value={point.title}
            onChange={(e) => commit({ title: e.target.value }, {})}
            className="w-full bg-transparent text-lg font-semibold outline-none"
          />
          <button onClick={onClose} className="ml-2 text-slate-500 hover:text-slate-300">
            âœ•
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {PIN_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => commit({ category: c.value }, {})}
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
              style={{
                borderColor: point.category === c.value ? c.color : '#2A3346',
                background: point.category === c.value ? `${c.color}22` : 'transparent',
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
              {c.label}
            </button>
          ))}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">CoordonnÃ©e X</label>
            <input
              type="number"
              value={point.x}
              onChange={(e) => commit({ x: parseFloat(e.target.value) || 0 }, {})}
              className="w-full rounded-md border border-slate-700 bg-slate-900/70 p-1.5 font-mono text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">CoordonnÃ©e Y</label>
            <input
              type="number"
              value={point.y}
              onChange={(e) => commit({ y: parseFloat(e.target.value) || 0 }, {})}
              className="w-full rounded-md border border-slate-700 bg-slate-900/70 p-1.5 font-mono text-sm outline-none"
            />
          </div>
        </div>

        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
          IcÃ´ne personnalisÃ©e (URL, facultatif)
        </label>
        <input
          value={point.icon_url ?? ''}
          onChange={(e) => commit({ icon_url: e.target.value || null }, {})}
          placeholder="/icons/suspect-1.png"
          className="mb-3 w-full rounded-md border border-slate-700 bg-slate-900/70 p-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
        />

        <textarea
          value={dossier.description}
          onChange={(e) => commit({}, { description: e.target.value })}
          placeholder="Notes d'enquÃªte, observations, Ã©lÃ©ments recueillisâ€¦"
          rows={5}
          className="mb-3 w-full resize-none rounded-md border border-slate-700 bg-slate-900/70 p-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
        />

        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Tags</label>
        <input
          value={tagsInput}
          onChange={(e) => {
            setTagsInput(e.target.value);
            commit(
              {},
              { tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) },
            );
          }}
          placeholder="braquage, cartel, testimonialâ€¦"
          className="mb-3 w-full rounded-md border border-slate-700 bg-slate-900/70 p-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
        />

        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">PiÃ¨ces jointes</label>
        <div className="mb-2 space-y-1.5">
          {pieces.map((piece, idx) => (
            <div key={idx} className="flex gap-1.5">
              <input
                value={piece.label}
                onChange={(e) => updatePiece(idx, { label: e.target.value })}
                placeholder="LibellÃ©"
                className="w-1/3 rounded-md border border-slate-700 bg-slate-900/70 p-1.5 text-xs outline-none"
              />
              <input
                value={piece.url}
                onChange={(e) => updatePiece(idx, { url: e.target.value })}
                placeholder="Lien (photo, fichierâ€¦)"
                className="flex-1 rounded-md border border-slate-700 bg-slate-900/70 p-1.5 text-xs outline-none"
              />
              <button
                onClick={() => {
                  const next = pieces.filter((_, i) => i !== idx);
                  setPieces(next);
                  commit({}, { pieces: next });
                }}
                className="text-slate-500 hover:text-red-400"
              >
                âœ•
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            const next = [...pieces, { label: '', url: '' }];
            setPieces(next);
            commit({}, { pieces: next });
          }}
          className="mb-4 text-xs text-amber-500 hover:text-amber-400"
        >
          + Ajouter une piÃ¨ce
        </button>

        <div className="flex items-center justify-between">
          <button onClick={onDelete} className="text-sm text-red-500 hover:text-red-400">
            Supprimer le point
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800">
              Annuler
            </button>
            <button
              onClick={onSave}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-amber-400"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
