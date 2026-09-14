'use client';

import { useEffect, useRef, useState, CSSProperties } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CartePoint,
  Category,
  Dossier,
  DossierPiece,
  categoryColor,
  slugify,
} from './types';
import {
  createCategory,
  createPoint,
  deleteCategory,
  deletePoint,
  fetchCategories,
  fetchDossiers,
  fetchPoints,
  updateCategory,
  updatePoint,
  upsertDossier,
} from './supabase-carte';

// ------------------------------------------------------------------
// Calibration mesurée sur le pack de tuiles fourni (styleGrid, 8192x8192
// à zoom max). Le point (0,0) du jeu tombe au pixel (3755, 5525) de
// l'image pleine résolution, à raison de 0.66 px par unité de coordonnée
// GTA sur les deux axes.
// ------------------------------------------------------------------
const DEFAULT_SCALE = 0.66;
const DEFAULT_ORIGIN = { px: 3755, py: 5525 };
const TILE_SIZE = 256;
const MAX_ZOOM = 5;
const MAP_PX = TILE_SIZE * Math.pow(2, MAX_ZOOM);

// ------------------------------------------------------------------
// Styles en ligne (ce projet n'utilise pas Tailwind) — palette proche
// d'un thème sombre "dossier d'enquête".
// ------------------------------------------------------------------
const colors = {
  bg: '#0F1420',
  bgDarker: '#0B0F18',
  panel: '#111826',
  border: '#1e293b',
  borderLight: '#334155',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textDimmer: '#64748b',
  amber: '#f59e0b',
  amberDark: '#fbbf24',
  red: '#ef4444',
  redLight: '#f87171',
};

const S: Record<string, CSSProperties> = {
  root: {
    display: 'flex',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    background: colors.bg,
    color: colors.text,
    fontFamily: 'inherit',
  },
  mapCol: { position: 'relative', flex: 1 },
  toolbar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'rgba(15,20,32,0.72)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    background: colors.border,
    margin: '0 2px',
  },
  btn: {
    pointerEvents: 'auto',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    background: colors.amber,
    color: '#1a1206',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    transition: 'filter 0.15s',
  },
  btnActive: {
    background: colors.amberDark,
  },
  toggleGroup: {
    pointerEvents: 'auto',
    display: 'flex',
    overflow: 'hidden',
    borderRadius: 8,
    background: 'rgba(15,23,42,0.8)',
    border: `1px solid ${colors.border}`,
  },
  toggleBtn: {
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 500,
    background: 'transparent',
    color: colors.textDim,
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
  toggleBtnActive: {
    background: colors.borderLight,
    color: colors.text,
  },
  search: {
    pointerEvents: 'auto',
    flex: '1 1 200px',
    minWidth: 160,
    maxWidth: 280,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: 'rgba(15,23,42,0.8)',
    color: colors.text,
    padding: '7px 12px',
    fontSize: 13,
    outline: 'none',
  },
  filterRow: {
    pointerEvents: 'auto',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: 'rgba(15,23,42,0.8)',
    padding: '5px 10px',
    fontSize: 12,
    color: colors.textDim,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  manageTagsBtn: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    border: `1px dashed ${colors.borderLight}`,
    background: 'transparent',
    padding: '5px 10px',
    fontSize: 12,
    color: colors.textDimmer,
    cursor: 'pointer',
  },
  coordsLabel: {
    pointerEvents: 'none',
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 8,
    background: 'rgba(15,20,32,0.72)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${colors.border}`,
    padding: '6px 10px',
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.textDim,
  },
  errorBanner: {
    pointerEvents: 'none',
    position: 'absolute',
    right: 16,
    top: 74,
    zIndex: 1000,
    borderRadius: 8,
    background: 'rgba(127,29,29,0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: '6px 12px',
    fontSize: 12,
    color: '#fee2e2',
  },
  mapDiv: { height: '100%', width: '100%', background: colors.bgDarker },
  sidebar: {
    width: 288,
    flexShrink: 0,
    overflowY: 'auto',
    borderLeft: `1px solid ${colors.border}`,
    background: colors.bgDarker,
    padding: 12,
  },
  sidebarTitle: {
    marginBottom: 8,
    fontFamily: 'monospace',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: colors.textDimmer,
  },
  dossierItem: {
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 6,
    padding: '6px 8px',
    textAlign: 'left',
    fontSize: 14,
    background: 'transparent',
    border: 'none',
    color: colors.text,
    cursor: 'pointer',
  },
  dossierItemActive: { background: colors.border },
  emptyState: {
    padding: '16px 8px',
    textAlign: 'center',
    fontSize: 12,
    color: colors.textDimmer,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 512,
    borderRadius: 8,
    border: `1px solid ${colors.borderLight}`,
    background: colors.panel,
    padding: 16,
    color: colors.text,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  },
  modalTitleInput: {
    width: '100%',
    background: 'transparent',
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
    border: 'none',
    outline: 'none',
  },
  closeBtn: {
    marginLeft: 8,
    background: 'transparent',
    border: 'none',
    color: colors.textDimmer,
    cursor: 'pointer',
    fontSize: 16,
  },
  label: {
    display: 'block',
    marginBottom: 4,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: colors.textDimmer,
  },
  input: {
    width: '100%',
    borderRadius: 6,
    border: `1px solid ${colors.borderLight}`,
    background: 'rgba(15,23,42,0.7)',
    padding: 8,
    fontSize: 14,
    color: colors.text,
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    resize: 'none',
    borderRadius: 6,
    border: `1px solid ${colors.borderLight}`,
    background: 'rgba(15,23,42,0.7)',
    padding: 8,
    fontSize: 14,
    color: colors.text,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  primaryBtn: {
    borderRadius: 6,
    background: colors.amber,
    color: '#000',
    fontWeight: 500,
    fontSize: 14,
    padding: '6px 12px',
    border: 'none',
    cursor: 'pointer',
  },
  ghostBtn: {
    borderRadius: 6,
    background: 'transparent',
    color: colors.textDim,
    fontSize: 14,
    padding: '6px 12px',
    border: 'none',
    cursor: 'pointer',
  },
  dangerLink: {
    background: 'transparent',
    border: 'none',
    color: colors.red,
    fontSize: 14,
    cursor: 'pointer',
  },
};

const dotStyle = (color: string, size = 8): CSSProperties => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: color,
  display: 'inline-block',
});

const categoryBtnStyle = (active: boolean, color: string): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 6,
  border: `1px solid ${active ? color : '#2A3346'}`,
  background: active ? `${color}22` : 'transparent',
  padding: '4px 8px',
  fontSize: 12,
  color: colors.text,
  cursor: 'pointer',
});

interface Props {
  satelliteTilesUrl?: string;
  gridTilesUrl?: string;
  atlasTilesUrl?: string;
  scale?: number;
  origin?: { px: number; py: number };
}

export default function MapCanvas({
  satelliteTilesUrl = '/map/tiles/satellite/{z}/{x}/{y}.jpg',
  gridTilesUrl = '/map/tiles/grid/{z}/{x}/{y}.png',
  atlasTilesUrl = '/map/tiles/atlas/{z}/{x}/{y}.jpg',
  scale = DEFAULT_SCALE,
  origin = DEFAULT_ORIGIN,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const coordsLabelRef = useRef<HTMLDivElement>(null);
  const addModeRef = useRef(false);

  const [points, setPoints] = useState<CartePoint[]>([]);
  const [dossiers, setDossiers] = useState<Record<string, Dossier>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ point: CartePoint; dossier: Dossier } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'grid' | 'atlas'>('satellite');

  useEffect(() => {
    addModeRef.current = addMode;
  }, [addMode]);

  // CRS.Simple attend des coordonnées en unites "zoom 0" (256x256), pas en
  // pixels pleine resolution (8192x8192) : on divise/multiplie par 2^MAX_ZOOM.
  // CRS.Simple inverse aussi le signe de l'axe lat (Transformation interne
  // de Leaflet) : on neutralise ça en negant systematiquement le "row".
  const ZOOM_FACTOR = Math.pow(2, MAX_ZOOM);
  const gameToLatLng = (x: number, y: number): L.LatLngExpression => {
    const colFullRes = origin.px + x * scale;
    const rowFullRes = origin.py - y * scale;
    return [-(rowFullRes / ZOOM_FACTOR), colFullRes / ZOOM_FACTOR];
  };
  const latLngToGame = (lat: number, lng: number) => {
    const colFullRes = lng * ZOOM_FACTOR;
    const rowFullRes = -lat * ZOOM_FACTOR;
    return {
      x: (colFullRes - origin.px) / scale,
      y: (origin.py - rowFullRes) / scale,
    };
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: 0,
      maxZoom: MAX_ZOOM,
      zoomSnap: 1,
      zoomDelta: 1,
      wheelPxPerZoomLevel: 120,
      maxBoundsViscosity: 0.8,
      attributionControl: false,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const bounds: L.LatLngBoundsExpression = [
      [-TILE_SIZE, 0],
      [0, TILE_SIZE],
    ];
    const tileLayer = L.tileLayer(satelliteTilesUrl, {
      tileSize: TILE_SIZE,
      minZoom: 0,
      maxZoom: MAX_ZOOM,
      noWrap: true,
      bounds,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // fitBounds() peut calculer un zoom fractionnaire mal aligné avec la
    // pyramide de tuiles (indices négatifs -> 404 en boucle). On fixe une
    // vue de départ explicite à la place, centrée sur la carte.
    map.setMaxBounds(bounds);
    map.setView([-TILE_SIZE / 2, TILE_SIZE / 2], 2);

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
      const title = window.prompt('Titre du point (ex : "Planque — Vespucci Canals")');
      setAddMode(false);
      if (!title) return;

      const defaultCategory = categories[0]?.slug ?? 'autre';
      const localId = `local-${Date.now()}`;
      const localPoint: CartePoint = { id: localId, x, y, category: defaultCategory, title };
      setPoints((p) => [...p, localPoint]);
      try {
        const saved = await createPoint({ x, y, category: defaultCategory, title });
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
  }, []);

  useEffect(() => {
    const layer = tileLayerRef.current;
    if (!layer) return;
    const urls = { satellite: satelliteTilesUrl, grid: gridTilesUrl, atlas: atlasTilesUrl };
    layer.setUrl(urls[mapStyle]);
  }, [mapStyle, satelliteTilesUrl, gridTilesUrl, atlasTilesUrl]);

  useEffect(() => {
    (async () => {
      try {
        const [pts, doss, cats] = await Promise.all([fetchPoints(), fetchDossiers(), fetchCategories()]);
        setPoints(pts);
        const map: Record<string, Dossier> = {};
        doss.forEach((d) => (map[d.point_id] = d));
        setDossiers(map);
        setCategories(cats);
      } catch (err) {
        console.error(err);
        setLoadError("Connexion à Supabase indisponible — mode local (rien n'est sauvegardé).");
      }
    })();
  }, []);

  const visiblePoints = points.filter((p) => {
    if (activeFilters.size > 0 && !activeFilters.has(p.category)) return false;
    if (!search.trim()) return true;
    const dossier = dossiers[p.id];
    const haystack = `${p.title} ${dossier?.description ?? ''} ${(dossier?.tags ?? []).join(' ')}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

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
              categories,
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
  }, [visiblePoints, selectedId, dossiers, categories]);

  const flyToPoint = (p: CartePoint) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(gameToLatLng(p.x, p.y), Math.max(map.getZoom(), 2));
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

  const toggleFilter = (cat: string) => {
    setActiveFilters((f) => {
      const next = new Set(f);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <div style={S.root}>
      <div style={S.mapCol}>
        <div style={S.toolbar}>
          <button
            onClick={() => setAddMode((v) => !v)}
            style={{ ...S.btn, ...(addMode ? S.btnActive : {}) }}
          >
            {addMode ? 'Clique sur la carte…' : '+ Nouveau point'}
          </button>

          <div style={S.divider} />

          <div style={S.toggleGroup}>
            <button
              onClick={() => setMapStyle('satellite')}
              style={{ ...S.toggleBtn, ...(mapStyle === 'satellite' ? S.toggleBtnActive : {}) }}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle('atlas')}
              style={{ ...S.toggleBtn, ...(mapStyle === 'atlas' ? S.toggleBtnActive : {}) }}
            >
              Atlas
            </button>
            <button
              onClick={() => setMapStyle('grid')}
              style={{ ...S.toggleBtn, ...(mapStyle === 'grid' ? S.toggleBtnActive : {}) }}
            >
              Grille
            </button>
          </div>

          <div style={S.divider} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un dossier, un tag…"
            style={S.search}
          />

          <div style={S.divider} />

          <div style={S.filterRow}>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => toggleFilter(c.slug)}
                style={{
                  ...S.filterChip,
                  opacity: activeFilters.size === 0 || activeFilters.has(c.slug) ? 1 : 0.4,
                }}
              >
                <span style={dotStyle(c.color, 7)} />
                {c.label}
              </button>
            ))}
            <button onClick={() => setTagsModalOpen(true)} style={S.manageTagsBtn}>
              ⚙ Tags
            </button>
          </div>
        </div>

        <div ref={coordsLabelRef} style={S.coordsLabel}>
          X: —  Y: —
        </div>

        {loadError && <div style={S.errorBanner}>{loadError}</div>}

        <div ref={containerRef} style={{ ...S.mapDiv, cursor: addMode ? 'crosshair' : undefined }} />
      </div>

      <aside style={S.sidebar}>
        <h3 style={S.sidebarTitle}>Dossiers ({visiblePoints.length})</h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                style={{ ...S.dossierItem, ...(p.id === selectedId ? S.dossierItemActive : {}) }}
              >
                <span style={{ ...dotStyle(categoryColor(categories, p.category)), marginTop: 4, flexShrink: 0 }} />
                <span>
                  <div style={{ color: colors.text }}>{p.title}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: colors.textDimmer }}>
                    X {p.x.toFixed(0)} / Y {p.y.toFixed(0)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.textDim,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {dossiers[p.id]?.description || 'Aucune note pour le moment.'}
                  </div>
                </span>
              </button>
            </li>
          ))}
          {visiblePoints.length === 0 && <li style={S.emptyState}>Aucun point ne correspond.</li>}
        </ul>
      </aside>

      {editing && (
        <DossierModal
          point={editing.point}
          dossier={editing.dossier}
          categories={categories}
          onChange={(point, dossier) => setEditing({ point, dossier })}
          onClose={() => setEditing(null)}
          onSave={saveEditing}
          onDelete={() => removePoint(editing.point.id)}
        />
      )}

      {tagsModalOpen && (
        <TagsModal
          categories={categories}
          onClose={() => setTagsModalOpen(false)}
          onAdd={async (label, color) => {
            const slug = slugify(label);
            const localId = `local-${Date.now()}`;
            const local: Category = { id: localId, slug, label, color, sort_order: categories.length + 1 };
            setCategories((c) => [...c, local]);
            try {
              const saved = await createCategory({ slug, label, color, sort_order: categories.length + 1 });
              setCategories((c) => c.map((cat) => (cat.id === localId ? saved : cat)));
            } catch (err) {
              console.error(err);
            }
          }}
          onRename={async (id, label) => {
            setCategories((c) => c.map((cat) => (cat.id === id ? { ...cat, label } : cat)));
            try {
              await updateCategory(id, { label });
            } catch (err) {
              console.error(err);
            }
          }}
          onRecolor={async (id, color) => {
            setCategories((c) => c.map((cat) => (cat.id === id ? { ...cat, color } : cat)));
            try {
              await updateCategory(id, { color });
            } catch (err) {
              console.error(err);
            }
          }}
          onDelete={async (id) => {
            setCategories((c) => c.filter((cat) => cat.id !== id));
            try {
              await deleteCategory(id);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
    </div>
  );
}

function DossierModal({
  point,
  dossier,
  categories,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  point: CartePoint;
  dossier: Dossier;
  categories: Category[];
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
    <div style={S.modalOverlay}>
      <div style={S.modal}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <input
            value={point.title}
            onChange={(e) => commit({ title: e.target.value }, {})}
            style={S.modalTitleInput}
          />
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => commit({ category: c.slug }, {})}
              style={categoryBtnStyle(point.category === c.slug, c.color)}
            >
              <span style={dotStyle(c.color)} />
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={S.label}>Coordonnée X</label>
            <input
              type="number"
              value={point.x}
              onChange={(e) => commit({ x: parseFloat(e.target.value) || 0 }, {})}
              style={{ ...S.input, fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={S.label}>Coordonnée Y</label>
            <input
              type="number"
              value={point.y}
              onChange={(e) => commit({ y: parseFloat(e.target.value) || 0 }, {})}
              style={{ ...S.input, fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <label style={S.label}>Icône personnalisée (URL, facultatif)</label>
        <input
          value={point.icon_url ?? ''}
          onChange={(e) => commit({ icon_url: e.target.value || null }, {})}
          placeholder="/icons/suspect-1.png"
          style={{ ...S.input, marginBottom: 12 }}
        />

        <textarea
          value={dossier.description}
          onChange={(e) => commit({}, { description: e.target.value })}
          placeholder="Notes d'enquête, observations, éléments recueillis…"
          rows={5}
          style={{ ...S.textarea, marginBottom: 12 }}
        />

        <label style={S.label}>Tags</label>
        <input
          value={tagsInput}
          onChange={(e) => {
            setTagsInput(e.target.value);
            commit({}, { tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) });
          }}
          placeholder="braquage, cartel, testimonial…"
          style={{ ...S.input, marginBottom: 12 }}
        />

        <label style={S.label}>Pièces jointes</label>
        <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pieces.map((piece, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6 }}>
              <input
                value={piece.label}
                onChange={(e) => updatePiece(idx, { label: e.target.value })}
                placeholder="Libellé"
                style={{ ...S.input, width: '33%', padding: 6, fontSize: 12 }}
              />
              <input
                value={piece.url}
                onChange={(e) => updatePiece(idx, { url: e.target.value })}
                placeholder="Lien (photo, fichier…)"
                style={{ ...S.input, flex: 1, padding: 6, fontSize: 12 }}
              />
              <button
                onClick={() => {
                  const next = pieces.filter((_, i) => i !== idx);
                  setPieces(next);
                  commit({}, { pieces: next });
                }}
                style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer' }}
              >
                ✕
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
          style={{ marginBottom: 16, background: 'transparent', border: 'none', color: colors.amber, fontSize: 12, cursor: 'pointer' }}
        >
          + Ajouter une pièce
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onDelete} style={S.dangerLink}>Supprimer le point</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={S.ghostBtn}>Annuler</button>
            <button onClick={onSave} style={S.primaryBtn}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TagsModal({
  categories,
  onClose,
  onAdd,
  onRename,
  onRecolor,
  onDelete,
}: {
  categories: Category[];
  onClose: () => void;
  onAdd: (label: string, color: string) => void;
  onRename: (id: string, label: string) => void;
  onRecolor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#f59e0b');

  return (
    <div style={S.modalOverlay}>
      <div style={{ ...S.modal, maxWidth: 420 }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Gérer les tags</h3>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {categories.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={c.color}
                onChange={(e) => onRecolor(c.id, e.target.value)}
                style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
              />
              <input
                value={c.label}
                onChange={(e) => onRename(c.id, e.target.value)}
                style={{ ...S.input, flex: 1 }}
              />
              <button
                onClick={() => {
                  if (window.confirm(`Supprimer le tag "${c.label}" ? Les points existants garderont leur pastille grise.`)) {
                    onDelete(c.id);
                  }
                }}
                style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <div style={{ fontSize: 12, color: colors.textDimmer }}>Aucun tag pour le moment.</div>
          )}
        </div>

        <label style={S.label}>Nouveau tag</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nom du tag (ex : Véhicule)"
            style={{ ...S.input, flex: 1 }}
          />
          <button
            onClick={() => {
              if (!newLabel.trim()) return;
              onAdd(newLabel.trim(), newColor);
              setNewLabel('');
            }}
            style={S.primaryBtn}
          >
            Ajouter
          </button>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={S.ghostBtn}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
