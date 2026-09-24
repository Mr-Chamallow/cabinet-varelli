'use client';

import { useEffect, useRef, useState, CSSProperties, ClipboardEvent as ReactClipboardEvent } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import {
  CartePoint,
  Category,
  Dossier,
  DossierPiece,
  DossierStatut,
  STATUT_CONFIG,
  ChecklistItem,
  isChecklistItemDone,
  defaultChecklistForCategory,
  categoryLabel,
  Gang,
  Personne,
  Plaque,
  Preset,
  categoryColor,
  gangTypeLabel,
  parseVector3,
  slugify,
} from './types';
import {
  createCategory,
  createGang,
  createPoint,
  deleteCategory,
  deleteGang,
  deletePoint,
  fetchCategories,
  fetchDossiers,
  fetchGangs,
  fetchPersonnes,
  fetchPlaques,
  fetchPoints,
  fetchPresets,
  updateCategory,
  updateGang,
  updatePoint,
  uploadImage,
  upsertDossier,
} from './supabase-carte';
import RegistreModal from './RegistreModal';
import NewPointModal from './NewPointModal';
import GangsModal from './GangsModal';
import TagsModal from './TagsModal';
import { use3DTilt } from '@/lib/use3DTilt';

// Fix icônes Leaflet sous Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_SCALE = 0.66;
const DEFAULT_ORIGIN = { px: 3755, py: 5525 };
const TILE_SIZE = 256;
const MAX_ZOOM = 5;

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
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    background: colors.bg,
    color: colors.text,
    fontFamily: 'inherit',
    position: 'relative',
  },
  mapCol: { position: 'relative', flex: 1, height: '100%', width: '100%', overflow: 'hidden' },
  toolbar: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 500,
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderRadius: 16,
    width: 'max-content',
    maxWidth: 'min(880px, calc(100% - 32px))',
    background: 'linear-gradient(180deg, rgba(17,24,38,0.92), rgba(11,15,24,0.92))',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: `1px solid ${colors.borderLight}`,
    boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  filterRowCentered: {
    pointerEvents: 'auto',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingTop: 8,
    marginTop: 2,
    borderTop: `1px solid ${colors.border}`,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    background: colors.border,
    margin: '0 2px',
  },
  btn: {
    pointerEvents: 'auto',
    borderRadius: 9,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 700,
    background: `linear-gradient(180deg, ${colors.amberDark}, ${colors.amber})`,
    color: '#1a1206',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
    transition: 'filter 0.15s, transform 0.1s',
    whiteSpace: 'nowrap',
  },
  btnActive: {
    background: colors.amberDark,
    boxShadow: '0 0 0 2px rgba(245,158,11,0.3)',
  },
  btnDisabled: {
    pointerEvents: 'none',
    opacity: 0.4,
    filter: 'grayscale(0.4)',
    boxShadow: 'none',
  },
  toggleGroup: {
    pointerEvents: 'auto',
    display: 'flex',
    overflow: 'hidden',
    borderRadius: 9,
    background: 'rgba(15,23,42,0.75)',
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
    flex: '1 1 180px',
    minWidth: 140,
    maxWidth: 260,
    borderRadius: 9,
    border: `1px solid ${colors.border}`,
    background: 'rgba(15,23,42,0.75)',
    color: colors.text,
    padding: '7px 12px',
    fontSize: 13,
    outline: 'none',
  },
  filterChip: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: 'rgba(15,23,42,0.75)',
    padding: '5px 11px',
    fontSize: 12,
    fontWeight: 500,
    color: colors.textDim,
    cursor: 'pointer',
    transition: 'opacity 0.15s, border-color 0.15s',
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
    transition: 'color 0.15s, border-color 0.15s',
  },
  coordsLabel: {
    pointerEvents: 'none',
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 500,
    borderRadius: 8,
    background: 'rgba(15,20,32,0.72)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${colors.border}`,
    padding: '6px 10px',
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: colors.textDim,
  },
  errorBanner: {
    pointerEvents: 'none',
    position: 'absolute',
    right: 16,
    top: 74,
    zIndex: 500,
    borderRadius: 8,
    background: 'rgba(127,29,29,0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: '6px 12px',
    fontSize: 12,
    color: '#fee2e2',
  },
  mapDiv: { height: '100%', width: '100%', background: colors.bgDarker, zIndex: 0 },
  sidebar: {
    width: 312,
    flexShrink: 0,
    overflowY: 'auto',
    borderLeft: `1px solid ${colors.border}`,
    background: `linear-gradient(180deg, ${colors.bgDarker}, ${colors.bg})`,
    padding: '14px 12px',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: `1px solid ${colors.border}`,
  },
  sidebarTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.02em',
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  sidebarCount: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 700,
    color: colors.amberDark,
    background: 'rgba(245,158,11,0.12)',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: 999,
    padding: '2px 9px',
  },
  dossierItem: {
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 10,
    padding: '10px 10px',
    textAlign: 'left',
    fontSize: 14,
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid rgba(255,255,255,0.03)`,
    color: colors.text,
    cursor: 'pointer',
    transition: 'background 0.12s, border-color 0.12s, transform 0.08s',
  },
  dossierItemActive: {
    background: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.35)',
  },
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
    perspective: '900px', // profondeur 3D pour l'entrée en flip du modal
  },
  modal: {
    width: '100%',
    maxWidth: 512,
    // ⚠️ Une modale flex-column avec SEULEMENT max-height (pas de height définie) empêche
    // son enfant `flex:1;min-height:0;overflow:auto` de calculer un espace réel à occuper :
    // le navigateur n'a rien de concret vers quoi grandir, donc cet enfant s'effondre à ~0px
    // au lieu de scroller. Il faut une hauteur DÉFINIE (via min()), pas juste un plafond.
    height: 'min(88vh, 720px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // empêche tout contenu de déborder visuellement hors du cadre arrondi
    borderRadius: 8,
    border: `1px solid ${colors.borderLight}`,
    background: colors.panel,
    padding: 16,
    color: colors.text,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    transformStyle: 'preserve-3d',
    animation: 'modalFlipIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
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
  readOnly?: boolean;
}

export default function MapCanvas({
  satelliteTilesUrl = '/map/tiles/satellite/{z}/{x}/{y}.jpg',
  gridTilesUrl = '/map/tiles/grid/{z}/{x}/{y}.png',
  atlasTilesUrl = '/map/tiles/atlas/{z}/{x}/{y}.jpg',
  scale = DEFAULT_SCALE,
  origin = DEFAULT_ORIGIN,
  readOnly = false,
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
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [personnesAll, setPersonnesAll] = useState<Personne[]>([]);
  const [plaquesAll, setPlaquesAll] = useState<Plaque[]>([]);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [gangsModalOpen, setGangsModalOpen] = useState(false);
  const [registreOpen, setRegistreOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [groupFilter, setGroupFilter] = useState<string>(''); // '' = tous les groupes
  const [statutFilter, setStatutFilter] = useState<string>('non_archive'); // 'tous' | 'non_archive' | DossierStatut
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ point: CartePoint; dossier: Dossier } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'grid' | 'atlas'>('satellite');

  useEffect(() => {
    addModeRef.current = addMode;
  }, [addMode]);

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

  // ─── Init de la carte (SANS créer le tileLayer ici — géré par le useEffect [mapStyle]) ───
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
    map.setMaxBounds(bounds);
    map.setView([-TILE_SIZE / 2, TILE_SIZE / 2], 2);

    const layerGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 45,
      disableClusteringAtZoom: MAX_ZOOM,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          className: '',
          html: `<div style="width:36px;height:36px;border-radius:50%;background:${colors.amber};border:3px solid rgba(255,255,255,0.95);box-shadow:0 2px 10px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;font-weight:800;font-size:13px;color:#1a1206;">${count}</div>`,
          iconSize: [36, 36],
        });
      },
    }).addTo(map);
    layerGroupRef.current = layerGroup;

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!coordsLabelRef.current) return;
      const { x, y } = latLngToGame(e.latlng.lat, e.latlng.lng);
      coordsLabelRef.current.textContent = `X: ${x.toFixed(0)}  Y: ${y.toFixed(0)}`;
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!addModeRef.current) return;
      const { x, y } = latLngToGame(e.latlng.lat, e.latlng.lng);
      setAddMode(false);
      setPendingCoords({ x, y });
    });

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Switch de style : détruit vraiment l'ancien layer avant d'en créer un nouveau ───
  // (fix mémoire : setUrl() gardait les anciennes tuiles en cache → fuite RAM → crash navigateur)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const urls = { satellite: satelliteTilesUrl, grid: gridTilesUrl, atlas: atlasTilesUrl };

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const bounds: L.LatLngBoundsExpression = [
      [-TILE_SIZE, 0],
      [0, TILE_SIZE],
    ];
    const newLayer = L.tileLayer(urls[mapStyle], {
      tileSize: TILE_SIZE,
      minZoom: 0,
      maxZoom: MAX_ZOOM,
      noWrap: true,
      bounds,
      updateWhenIdle: true,
      keepBuffer: 1,
      updateWhenZooming: false,
    });
    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
  }, [mapStyle, satelliteTilesUrl, gridTilesUrl, atlasTilesUrl]);

  useEffect(() => {
    (async () => {
      try {
        const [pts, doss, cats, gs, prs, pers, plq] = await Promise.all([
          fetchPoints(),
          fetchDossiers(),
          fetchCategories(),
          fetchGangs(),
          fetchPresets(),
          fetchPersonnes(),
          fetchPlaques(),
        ]);
        setPoints(pts);
        const map: Record<string, Dossier> = {};
        doss.forEach((d) => (map[d.point_id] = d));
        setDossiers(map);
        setCategories(cats);
        setGangs(gs);
        setPresets(prs);
        setPersonnesAll(pers);
        setPlaquesAll(plq);
      } catch (err) {
        console.error(err);
        setLoadError("Connexion à Supabase indisponible — mode local (rien n'est sauvegardé).");
      }
    })();
  }, []);

  // Dossier "vide" utilisé quand on ouvre un point qui n'a encore jamais été sauvegardé
  // (créé avant l'existence des checklists, ou jamais ouvert) — applique quand même la
  // checklist par défaut si la catégorie du point est Labo/Table de purification, pour
  // que les points déjà existants en profitent aussi, pas seulement les nouveaux.
  const emptyDossierFor = (p: CartePoint): Dossier => ({
    id: '', point_id: p.id, description: '', tags: [], pieces: [], statut: 'actif',
    checklist: defaultChecklistForCategory(categoryLabel(categories, p.category)),
  });

  const confirmNewPoint = async (title: string, iconUrl?: string, drogueLiee?: string, pointType?: 'laboratoire' | 'table_purification' | 'autre') => {
    if (!pendingCoords) return;
    const { x, y } = pendingCoords;
    setPendingCoords(null);

    // Fait correspondre le type choisi (étape 1 du modal de création) à une vraie
    // catégorie existante par son libellé — les catégories sont gérées dynamiquement
    // (⚙ Catégories) donc on matche par nom plutôt que par slug figé.
    const typeLabel = pointType === 'laboratoire' ? 'laboratoire' : pointType === 'table_purification' ? 'table de purification' : null;
    const matchedCategory = typeLabel ? categories.find((c) => c.label.trim().toLowerCase() === typeLabel) : null;
    const defaultCategory = matchedCategory?.slug ?? categories[0]?.slug ?? 'autre';
    const defaultChecklist = typeLabel ? defaultChecklistForCategory(typeLabel) : [];

    const localId = `local-${Date.now()}`;
    const localPoint: CartePoint = { id: localId, x, y, category: defaultCategory, title, icon_url: iconUrl ?? null, drogue_liee: drogueLiee ?? null } as any;
    setPoints((p) => [...p, localPoint]);
    try {
      const saved = await createPoint({ x, y, category: defaultCategory, title, icon_url: iconUrl ?? null, drogue_liee: drogueLiee ?? null } as any);
      setPoints((p) => p.map((pt) => (pt.id === localId ? saved : pt)));
      setEditing({
        point: saved,
        dossier: { id: '', point_id: saved.id, description: '', tags: [], pieces: [], checklist: defaultChecklist },
      });
    } catch (err) {
      console.error(err);
      setEditing({
        point: localPoint,
        dossier: { id: '', point_id: localPoint.id, description: '', tags: [], pieces: [], checklist: defaultChecklist },
      });
    }
  };

  const visiblePoints = points.filter((p) => {
    if (activeFilters.size > 0 && !activeFilters.has(p.category)) return false;
    if (groupFilter && p.groupe_id !== groupFilter) return false;

    const dossier = dossiers[p.id];
    const statut: DossierStatut = dossier?.statut || 'actif';
    if (statutFilter === 'non_archive' && statut === 'archive') return false;
    if (statutFilter !== 'tous' && statutFilter !== 'non_archive' && statut !== statutFilter) return false;

    if (dateFrom && (!p.created_at || p.created_at.slice(0, 10) < dateFrom)) return false;
    if (dateTo && (!p.created_at || p.created_at.slice(0, 10) > dateTo)) return false;

    if (!search.trim()) return true;
    const haystack = `${p.title} ${dossier?.description ?? ''} ${(dossier?.tags ?? []).join(' ')}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;
    layerGroup.clearLayers();

    visiblePoints.forEach((p) => {
      const statut: DossierStatut = dossiers[p.id]?.statut || 'actif';
      const dimmed = statut !== 'actif'; // résolu/archivé : marqueur estompé sur la carte
      const opacityStyle = dimmed ? 'opacity:0.45;' : '';
      const statutDot = statut !== 'actif'
        ? `<div style="position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:${STATUT_CONFIG[statut].color};border:2px solid #0f172a;"></div>`
        : '';
      const icon = p.icon_url
        ? L.divIcon({
            className: '',
            html: `<div style="position:relative;${opacityStyle}"><div style="width:40px;height:40px;border-radius:50%;background:#0f172a;border:3px solid ${
              p.id === selectedId ? '#fff' : categoryColor(categories, p.category)
            };box-shadow:0 2px 10px rgba(0,0,0,0.6);overflow:hidden;"><img src="${p.icon_url}" style="width:100%;height:100%;object-fit:cover;" /></div>${statutDot}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          })
        : L.divIcon({
            className: '',
            html: `<div style="position:relative;${opacityStyle}"><div style="width:24px;height:24px;border-radius:50%;background:${categoryColor(
              categories,
              p.category,
            )};border:3px solid rgba(255,255,255,0.95);box-shadow:0 2px 8px rgba(0,0,0,0.6);${
              p.id === selectedId ? 'outline:3px solid white;outline-offset:1px;' : ''
            }"></div>${statutDot}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

      const marker = L.marker(gameToLatLng(p.x, p.y), { icon });
      marker.on('click', () => {
        setSelectedId(p.id);
        setEditing({
          point: p,
          dossier: dossiers[p.id] ?? emptyDossierFor(p),
        });
      });
      marker.bindTooltip(`${p.title}${statut !== 'actif' ? ` — ${STATUT_CONFIG[statut].label}` : ''}`, { direction: 'top', offset: [0, -10] });
      marker.addTo(layerGroup);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePoints, selectedId, dossiers, categories]);

  const flyToPoint = (p: CartePoint) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(gameToLatLng(p.x, p.y), Math.max(map.getZoom(), 2));
  };

  // Lien direct (?point=<id>) : une fois les points chargés, sélectionne et ouvre
  // automatiquement le point ciblé, une seule fois (ne doit pas se redéclencher si
  // l'utilisateur ferme la fiche et modifie d'autres points ensuite).
  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    if (points.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('point');
    if (!targetId) { deepLinkHandledRef.current = true; return; }
    const target = points.find((p) => p.id === targetId);
    if (!target) return; // les points arrivent parfois par lots ; on retente au prochain rendu
    deepLinkHandledRef.current = true;
    setSelectedId(target.id);
    flyToPoint(target);
    setEditing({
      point: target,
      dossier: dossiers[target.id] ?? emptyDossierFor(target),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

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
        z: point.z ?? null,
        heading: point.heading ?? null,
        groupe_id: point.groupe_id ?? null,
        personne_ids: point.personne_ids ?? [],
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
          <div style={S.toolbarRow}>
            {!readOnly && (
              <>
                <button
                  onClick={() => setAddMode((v) => !v)}
                  style={{ ...S.btn, ...(addMode ? S.btnActive : {}) }}
                >
                  {addMode ? 'Clique sur la carte…' : '+ Nouveau point'}
                </button>
                <div style={S.divider} />
              </>
            )}

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
          </div>

          <div style={S.filterRowCentered}>
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
            {!readOnly && (
              <>
                <div style={S.divider} />
                <button onClick={() => setTagsModalOpen(true)} style={S.manageTagsBtn}>
                  ⚙ Catégories
                </button>
                <button onClick={() => setGangsModalOpen(true)} style={S.manageTagsBtn}>
                  ⚙ Groupes
                </button>
              </>
            )}
            <div style={S.divider} />
            <button onClick={() => setRegistreOpen(true)} style={S.manageTagsBtn}>
              📇 Registre
            </button>
            <button
              onClick={() => setAdvancedFiltersOpen((v) => !v)}
              style={{
                ...S.manageTagsBtn,
                ...(advancedFiltersOpen || groupFilter || statutFilter !== 'non_archive' || dateFrom || dateTo
                  ? { color: colors.amber, borderColor: colors.amber + '60' }
                  : {}),
              }}
            >
              🔍 Filtres{advancedFiltersOpen ? ' ▴' : ' ▾'}
            </button>
          </div>

          {advancedFiltersOpen && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', paddingTop: 10, marginTop: 2, borderTop: `1px solid ${colors.border}` }}>
              <div>
                <div style={{ fontSize: 10.5, color: colors.textDimmer, marginBottom: 3 }}>Groupe</div>
                <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} style={{ ...S.search, minWidth: 150, maxWidth: 180 }}>
                  <option value="">Tous les groupes</option>
                  {gangs.map((g) => (
                    <option key={g.id} value={g.id}>{g.nom} ({gangTypeLabel(g.type)})</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: colors.textDimmer, marginBottom: 3 }}>Statut</div>
                <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} style={{ ...S.search, minWidth: 150, maxWidth: 180 }}>
                  <option value="non_archive">Actifs + Résolus</option>
                  <option value="tous">Tous (avec archivés)</option>
                  <option value="actif">🔴 Actif uniquement</option>
                  <option value="resolu">🟢 Résolu uniquement</option>
                  <option value="archive">⚪ Archivé uniquement</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: colors.textDimmer, marginBottom: 3 }}>Créé du</div>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...S.search, minWidth: 140, maxWidth: 150 }} />
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: colors.textDimmer, marginBottom: 3 }}>Au</div>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...S.search, minWidth: 140, maxWidth: 150 }} />
              </div>
              {(groupFilter || statutFilter !== 'non_archive' || dateFrom || dateTo) && (
                <button
                  onClick={() => { setGroupFilter(''); setStatutFilter('non_archive'); setDateFrom(''); setDateTo(''); }}
                  style={{ ...S.manageTagsBtn, alignSelf: 'center' }}
                >
                  ✕ Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        <div ref={coordsLabelRef} style={S.coordsLabel}>
          X: —  Y: —
        </div>

        {loadError && <div style={S.errorBanner}>{loadError}</div>}

        <div ref={containerRef} style={{ ...S.mapDiv, cursor: addMode ? 'crosshair' : undefined }} />
      </div>

      <aside style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <span style={S.sidebarTitle}>🔥 Points chauds</span>
          <span style={S.sidebarCount}>{visiblePoints.length}</span>
        </div>

        {(() => {
          // Groupe les points par catégorie (ordre = celui défini dans "⚙ Catégories")
          const orderedCats = [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          const bySlug: Record<string, CartePoint[]> = {};
          for (const p of visiblePoints) (bySlug[p.category] ??= []).push(p);
          const groups = orderedCats
            .map((c) => ({ cat: c, pts: bySlug[c.slug] || [] }))
            .filter((g) => g.pts.length > 0);
          // Points dont la catégorie n'existe plus / n'est pas reconnue
          const knownSlugs = new Set(orderedCats.map((c) => c.slug));
          const orphans = visiblePoints.filter((p) => !knownSlugs.has(p.category));
          if (orphans.length > 0) groups.push({ cat: { id: '__orphan', slug: '__orphan', label: 'Autre', color: '#8A93A6' } as Category, pts: orphans });

          if (groups.length === 0) return <div style={S.emptyState}>Aucun point ne correspond.</div>;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {groups.map(({ cat, pts }) => {
                const isCollapsed = collapsedCats.has(cat.slug);
                return (
                  <div key={cat.slug}>
                    <button
                      onClick={() => setCollapsedCats((s) => {
                        const next = new Set(s);
                        next.has(cat.slug) ? next.delete(cat.slug) : next.add(cat.slug);
                        return next;
                      })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '6px 8px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                        background: cat.color + '10', border: `1px solid ${cat.color}30`,
                        fontFamily: "'Inter',sans-serif",
                      }}
                    >
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: cat.color, flexShrink: 0, boxShadow: `0 0 6px ${cat.color}80` }} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: cat.color, flex: 1, textAlign: 'left' }}>{cat.label}</span>
                      <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: colors.textDimmer, background: 'rgba(255,255,255,0.05)', borderRadius: 999, padding: '1px 7px' }}>{pts.length}</span>
                      <span style={{ fontSize: 10, color: colors.textDimmer, transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: '0.15s' }}>▾</span>
                    </button>

                    {!isCollapsed && (
                      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
                        {pts.map((p) => {
                          const isActive = p.id === selectedId;
                          const dossier = dossiers[p.id];
                          const statut: DossierStatut = dossier?.statut || 'actif';
                          const checklist = dossier?.checklist || [];
                          const checklistDone = checklist.filter(isChecklistItemDone).length;
                          return (
                            <li key={p.id}>
                              <button
                                onClick={() => {
                                  setSelectedId(p.id);
                                  flyToPoint(p);
                                  setEditing({
                                    point: p,
                                    dossier: dossiers[p.id] ?? emptyDossierFor(p),
                                  });
                                }}
                                style={{
                                  ...S.dossierItem,
                                  ...(isActive ? S.dossierItemActive : {}),
                                  borderLeft: `3px solid ${cat.color}`,
                                }}
                              >
                                <span style={{ minWidth: 0, flex: 1, opacity: statut === 'archive' ? 0.55 : 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                    <div style={{ color: colors.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                      {p.title}
                                    </div>
                                    {statut !== 'actif' && (
                                      <span style={{ flexShrink: 0, fontSize: 13 }} title={STATUT_CONFIG[statut].label}>
                                        {STATUT_CONFIG[statut].icon}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 4,
                                      fontFamily: "var(--font-mono)", fontSize: 10.5, color: colors.textDimmer,
                                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.border}`,
                                      borderRadius: 999, padding: '1px 7px', marginBottom: 5,
                                    }}
                                  >
                                    X {p.x.toFixed(0)} · Y {p.y.toFixed(0)}
                                  </div>
                                  {checklist.length > 0 && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: checklistDone === checklist.length ? '#22c55e' : colors.textDim, marginBottom: 3, marginLeft: 6 }}>
                                      ✓ {checklistDone}/{checklist.length}
                                    </div>
                                  )}
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: colors.textDim,
                                      lineHeight: 1.4,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                    }}
                                  >
                                    {dossier?.description || 'Aucune note pour le moment.'}
                                  </div>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </aside>

      {pendingCoords && (
        <NewPointModal
          presets={presets}
          onCancel={() => setPendingCoords(null)}
          onConfirm={confirmNewPoint}
        />
      )}

      {editing && (
        <DossierModal
          point={editing.point}
          dossier={editing.dossier}
          categories={categories}
          gangs={gangs}
          personnesAll={personnesAll}
          plaquesAll={plaquesAll}
          readOnly={readOnly}
          onChange={(point, dossier) => setEditing({ point, dossier })}
          onClose={() => setEditing(null)}
          onSave={saveEditing}
          onDelete={() => removePoint(editing.point.id)}
        />
      )}

      {registreOpen && <RegistreModal onClose={() => setRegistreOpen(false)} readOnly={readOnly} />}

      {gangsModalOpen && (
        <GangsModal
          gangs={gangs}
          onClose={() => setGangsModalOpen(false)}
          onAdd={async (nom, type) => {
            const localId = `local-${Date.now()}`;
            const local: Gang = { id: localId, nom, type, sort_order: gangs.length + 1 };
            setGangs((g) => [...g, local]);
            try {
              const saved = await createGang({ nom, type, sort_order: gangs.length + 1 });
              setGangs((g) => g.map((x) => (x.id === localId ? saved : x)));
            } catch (err) {
              console.error(err);
            }
          }}
          onRename={async (id, nom) => {
            setGangs((g) => g.map((x) => (x.id === id ? { ...x, nom } : x)));
            try {
              await updateGang(id, { nom });
            } catch (err) {
              console.error(err);
            }
          }}
          onRetype={async (id, type) => {
            setGangs((g) => g.map((x) => (x.id === id ? { ...x, type } : x)));
            try {
              await updateGang(id, { type });
            } catch (err) {
              console.error(err);
            }
          }}
          onDelete={async (id) => {
            setGangs((g) => g.filter((x) => x.id !== id));
            try {
              await deleteGang(id);
            } catch (err) {
              console.error(err);
            }
          }}
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
  gangs,
  personnesAll,
  plaquesAll,
  readOnly = false,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  point: CartePoint;
  dossier: Dossier;
  categories: Category[];
  gangs: Gang[];
  personnesAll: Personne[];
  plaquesAll: Plaque[];
  readOnly?: boolean;
  onChange: (point: CartePoint, dossier: Dossier) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [tagsInput, setTagsInput] = useState(dossier.tags.join(', '));
  const [checklist, setChecklist] = useState<ChecklistItem[]>(dossier.checklist || []);
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [pieces, setPieces] = useState<DossierPiece[]>(dossier.pieces);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [vectorInput, setVectorInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commit = (patchPoint: Partial<CartePoint>, patchDossier: Partial<Dossier>) => {
    onChange({ ...point, ...patchPoint }, { ...dossier, ...patchDossier });
  };

  const addChecklistItem = () => {
    if (!newChecklistLabel.trim()) return;
    const next = [...checklist, { label: newChecklistLabel.trim(), done: false }];
    setChecklist(next);
    setNewChecklistLabel('');
    commit({}, { checklist: next });
  };

  const toggleChecklistItem = (idx: number) => {
    const next = checklist.map((c, i) => (i === idx ? { ...c, done: !c.done } : c));
    setChecklist(next);
    commit({}, { checklist: next });
  };

  const removeChecklistItem = (idx: number) => {
    const next = checklist.filter((_, i) => i !== idx);
    setChecklist(next);
    commit({}, { checklist: next });
  };

  const setChecklistCounter = (idx: number, value: number) => {
    const next = checklist.map((c, i) => {
      if (i !== idx) return c;
      const max = c.max ?? 0;
      const clamped = Math.max(0, Math.min(value, max));
      return { ...c, count: clamped };
    });
    setChecklist(next);
    commit({}, { checklist: next });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFeedback(label);
      setTimeout(() => setCopiedFeedback(null), 1800);
    } catch {
      window.alert(`Copie impossible. Voici la valeur :\n${text}`);
    }
  };

  const statut: DossierStatut = dossier.statut || 'actif';
  const tilt = use3DTilt<HTMLDivElement>(5);

  const handleFiles = async (files: FileList | File[]) => {
    if (readOnly) return;
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;
    setUploading(true);
    try {
      const uploaded: DossierPiece[] = [];
      for (const file of list) {
        const url = await uploadImage(file);
        uploaded.push({ label: file.name || 'Photo', url });
      }
      const next = [...pieces, ...uploaded];
      setPieces(next);
      commit({}, { pieces: next });
    } catch (err) {
      console.error(err);
      window.alert("Échec de l'envoi de l'image. Vérifie la connexion à Supabase Storage.");
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: ReactClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
  };

  return (
    <div style={S.modalOverlay}>
      <div ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave} style={S.modal}>
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 10 }}>
          <input
            value={point.title}
            disabled={readOnly}
            onChange={(e) => commit({ title: e.target.value }, {})}
            style={{ ...S.modalTitleInput, opacity: readOnly ? 0.75 : 1, cursor: readOnly ? 'default' : 'text' }}
          />
          {readOnly && (
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '3px 9px', borderRadius: 999,
              background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.35)', color: '#94a3b8',
            }}>
              🔒 Lecture seule
            </span>
          )}
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => copyToClipboard(`X: ${point.x.toFixed(0)} / Y: ${point.y.toFixed(0)}`, 'coords')}
            style={S.manageTagsBtn}
            title="Copier les coordonnées"
          >
            {copiedFeedback === 'coords' ? '✅ Copié' : '📋 Copier XY'}
          </button>
          <button
            onClick={() => copyToClipboard(`${window.location.origin}${window.location.pathname}?point=${point.id}`, 'lien')}
            style={S.manageTagsBtn}
            title="Copier un lien direct vers ce point"
          >
            {copiedFeedback === 'lien' ? '✅ Copié' : '🔗 Copier le lien'}
          </button>
        </div>

        <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', paddingRight: 6 }} onPaste={handlePaste}>
        <fieldset
          disabled={readOnly}
          style={{ border: 0, padding: 0, margin: 0 }}
        >
          <label style={S.label}>Statut du dossier</label>
          <div style={{ marginBottom: 14, display: 'flex', gap: 6 }}>
            {(Object.keys(STATUT_CONFIG) as DossierStatut[]).map((s) => (
              <button
                key={s}
                onClick={() => commit({}, { statut: s })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
                  fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: statut === s ? 700 : 500,
                  background: statut === s ? STATUT_CONFIG[s].color + '18' : 'transparent',
                  border: `1px solid ${statut === s ? STATUT_CONFIG[s].color + '50' : colors.border}`,
                  color: statut === s ? STATUT_CONFIG[s].color : colors.textDim,
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                {STATUT_CONFIG[s].icon} {STATUT_CONFIG[s].label}
              </button>
            ))}
          </div>

          <label style={S.label}>Catégorie</label>
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

          <label style={S.label}>Groupe (gang / orga)</label>
          <select
            value={point.groupe_id ?? ''}
            onChange={(e) => commit({ groupe_id: e.target.value || null }, {})}
            style={{ ...S.input, marginBottom: 12 }}
          >
            <option value="">— Aucun —</option>
            {gangs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom} ({gangTypeLabel(g.type)})
              </option>
            ))}
          </select>

          <label style={S.label}>Coller une position en jeu (format Vector3)</label>
          <input
            value={vectorInput}
            onChange={(e) => {
              setVectorInput(e.target.value);
              const parsed = parseVector3(e.target.value);
              if (parsed) {
                commit({ x: parsed.x, y: parsed.y, z: parsed.z, heading: parsed.heading ?? point.heading }, {});
              }
            }}
            placeholder="{ pos: new Vector3(-116.460, -1137.269, 24.280), heading: 90.261}"
            style={{ ...S.input, marginBottom: 12, fontFamily: "var(--font-mono)", fontSize: 12 }}
          />

          <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            <div>
              <label style={S.label}>X</label>
              <input
                type="number"
                value={point.x}
                onChange={(e) => commit({ x: parseFloat(e.target.value) || 0 }, {})}
                style={S.input}
              />
            </div>
            <div>
              <label style={S.label}>Y</label>
              <input
                type="number"
                value={point.y}
                onChange={(e) => commit({ y: parseFloat(e.target.value) || 0 }, {})}
                style={S.input}
              />
            </div>
            <div>
              <label style={S.label}>Z</label>
              <input
                type="number"
                value={point.z ?? ''}
                onChange={(e) => commit({ z: e.target.value !== '' ? parseFloat(e.target.value) : undefined }, {})}
                style={S.input}
              />
            </div>
            <div>
              <label style={S.label}>Heading</label>
              <input
                type="number"
                value={point.heading ?? ''}
                onChange={(e) => commit({ heading: e.target.value !== '' ? parseFloat(e.target.value) : undefined }, {})}
                style={S.input}
              />
            </div>
          </div>

          <label style={S.label}>Description / Notes d'enquête</label>
          <textarea
            rows={4}
            value={dossier.description}
            onChange={(e) => commit({}, { description: e.target.value })}
            placeholder="Écris tes observations, détails, suspects aperçus..."
            style={{ ...S.textarea, marginBottom: 12 }}
          />

          <label style={S.label}>Tags (séparés par des virgules)</label>
          <input
            value={tagsInput}
            onChange={(e) => {
              setTagsInput(e.target.value);
              const array = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
              commit({}, { tags: array });
            }}
            placeholder="Drogue, Armes, Suspect, Enquête"
            style={{ ...S.input, marginBottom: 16 }}
          />

          <label style={S.label}>Checklist ({checklist.filter(isChecklistItemDone).length}/{checklist.length})</label>
          <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {checklist.map((item, idx) => {
              const done = isChecklistItemDone(item);
              if (item.kind === 'counter') {
                const count = item.count ?? 0;
                const max = item.max ?? 0;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, background: done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${done ? 'rgba(34,197,94,0.25)' : colors.border}` }}>
                    <span style={{ flex: 1, fontSize: 13, color: done ? '#22c55e' : colors.text, fontWeight: done ? 600 : 400 }}>
                      {done && '✓ '}{item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChecklistCounter(idx, count - 1)}
                      disabled={count <= 0}
                      style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.textDim, cursor: count > 0 ? 'pointer' : 'default', opacity: count > 0 ? 1 : 0.4, fontSize: 13, lineHeight: 1 }}
                    >−</button>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, minWidth: 42, textAlign: 'center', color: done ? '#22c55e' : colors.textDim }}>{count}/{max}</span>
                    <button
                      type="button"
                      onClick={() => setChecklistCounter(idx, count + 1)}
                      disabled={count >= max}
                      style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.textDim, cursor: count < max ? 'pointer' : 'default', opacity: count < max ? 1 : 0.4, fontSize: 13, lineHeight: 1 }}
                    >+</button>
                    <button onClick={() => removeChecklistItem(idx)} style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✕</button>
                  </div>
                );
              }
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: `1px solid ${colors.border}` }}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(idx)}
                    style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0, accentColor: colors.amber }}
                  />
                  <span style={{ flex: 1, fontSize: 13, color: item.done ? colors.textDim : colors.text, textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.label}
                  </span>
                  <button onClick={() => removeChecklistItem(idx)} style={{ background: 'transparent', border: 'none', color: colors.textDimmer, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✕</button>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <input
                value={newChecklistLabel}
                onChange={(e) => setNewChecklistLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                placeholder="Ex : Recensement 15/15, Arrestation suspect X..."
                style={{ ...S.input, flex: 1 }}
              />
              <button onClick={addChecklistItem} style={S.manageTagsBtn}>+ Ajouter</button>
            </div>
          </div>

          <label style={S.label}>Pièces jointes / Preuves ({pieces.length})</label>
          <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {pieces.map((p, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  width: 80,
                  height: 80,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: `1px solid ${colors.borderLight}`,
                  cursor: 'pointer',
                }}
                onClick={() => setLightboxUrl(p.url)}
              >
                <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = pieces.filter((_, i) => i !== idx);
                    setPieces(next);
                    commit({}, { pieces: next });
                  }}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 80,
                height: 80,
                borderRadius: 6,
                border: `1px dashed ${colors.borderLight}`,
                background: 'rgba(15,23,42,0.4)',
                color: colors.textDim,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {uploading ? 'Envoi...' : '+ Image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>
        </fieldset>
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {!readOnly ? (
            <button type="button" onClick={onDelete} style={S.dangerLink}>
              Supprimer
            </button>
          ) : (
            <span style={{ fontSize: 12, color: colors.textDimmer }}>Consultation uniquement</span>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={S.ghostBtn}>
              {readOnly ? 'Fermer' : 'Annuler'}
            </button>
            {!readOnly && (
              <button type="button" onClick={onSave} style={S.primaryBtn}>
                Enregistrer
              </button>
            )}
          </div>
        </div>
      </div>

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <img src={lightboxUrl} alt="Agrandissement" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}