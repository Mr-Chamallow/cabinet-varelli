"use client";

import React, { useState, useEffect, useRef } from "react";
import { CartePoint, Dossier } from "./types";
import {
  fetchPoints,
  fetchCategories,
  createPoint,
  fetchDossiers,
} from "./supabase-carte";
import NewPointModal from "./NewPointModal";

interface Lien {
  id: string;
  source_id: string;
  target_id: string;
  label?: string;
}

export default function MapCanvas() {
  const [points, setPoints] = useState<CartePoint[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [liens, setLiens] = useState<Lien[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);
  const [editing, setEditing] = useState<{ point: CartePoint; dossier: Dossier } | null>(null);
  const [lienSourceId, setLienSourceId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [pts, cats] = await Promise.all([
          fetchPoints(),
          fetchCategories(),
        ]);
        setPoints(pts || []);
        setCategories(cats || []);
        if (cats) setSelectedCategories(cats.map((c: any) => c.slug ?? c.id));
      } catch (err) {
        console.error("Erreur chargement carte:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest(".point-marker") ||
      (e.target as HTMLElement).closest(".map-control")
    ) {
      return;
    }
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.5), 3));
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest(".point-marker") ||
      (e.target as HTMLElement).closest(".map-control")
    ) {
      return;
    }
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    setPendingCoords({
      x: Math.round(percentX * 100) / 100,
      y: Math.round(percentY * 100) / 100,
    });
  };

  const confirmNewPoint = async (title: string, iconUrl?: string) => {
    if (!pendingCoords) return;
    const { x, y } = pendingCoords;
    setPendingCoords(null);

    const defaultCategory = categories.length > 0 ? (categories[0].slug ?? categories[0].id) : "autre";
    const tempId = `local-${Date.now()}`;

    const draftPoint: CartePoint = {
      id: tempId,
      x,
      y,
      category: defaultCategory,
      title,
      icon_url: iconUrl ?? null,
    };

    const draftDossier: Dossier = {
      id: "",
      point_id: tempId,
      description: "",
      tags: [],
      pieces: [],
    };

    setPoints((p) => [...p, draftPoint]);
    setEditing({ point: draftPoint, dossier: draftDossier });

    try {
      const savedPoint = await createPoint({
        x,
        y,
        category: defaultCategory,
        title,
        icon_url: iconUrl ?? null,
      });

      setPoints((p) => p.map((pt) => (pt.id === tempId ? savedPoint : pt)));
      setEditing((prev) =>
        prev && prev.point.id === tempId
          ? {
              point: savedPoint,
              dossier: { ...prev.dossier, point_id: savedPoint.id },
            }
          : prev
      );
    } catch (err) {
      console.error("Erreur création point:", err);
      setPoints((p) => p.filter((pt) => pt.id !== tempId));
      setEditing(null);
    }
  };

  const handlePointClick = async (point: CartePoint, e: React.MouseEvent) => {
    e.stopPropagation();

    if (lienSourceId) {
      if (lienSourceId !== point.id) {
        const newLien: Lien = {
          id: `lien-${Date.now()}`,
          source_id: lienSourceId,
          target_id: point.id,
        };
        setLiens((prev) => [...prev, newLien]);
      }
      setLienSourceId(null);
      return;
    }

    try {
      const dossiers = await fetchDossiers();
      const dossier = dossiers?.find((d: Dossier) => d.point_id === point.id) ?? {
        id: "",
        point_id: point.id,
        description: "",
        tags: [],
        pieces: [],
      };
      setEditing({ point, dossier });
    } catch (err) {
      console.error("Erreur récupération dossier:", err);
    }
  };

  const filteredPoints = points.filter((p) => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white bg-slate-900">
        Chargement du tableau d'enquête...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleMapClick}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 map-control">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded text-sm outline-none focus:border-amber-500"
        />
        {lienSourceId && (
          <div className="bg-amber-500/20 border border-amber-500 text-amber-300 px-3 py-1.5 rounded text-xs">
            Cliquez sur un autre point pour créer une liaison
            <button
              onClick={() => setLienSourceId(null)}
              className="ml-2 underline font-bold"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      <div
        className="w-full h-full origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {liens.map((l) => {
            const source = points.find((p) => p.id === l.source_id);
            const target = points.find((p) => p.id === l.target_id);
            if (!source || !target) return null;

            return (
              <line
                key={l.id}
                x1={`${source.x}%`}
                y1={`${source.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {filteredPoints.map((pt) => {
          const cat = categories.find((c) => (c.slug ?? c.id) === pt.category);
          const color = cat?.color ?? "#8A93A6";
          const isSource = lienSourceId === pt.id;

          return (
            <div
              key={pt.id}
              onClick={(e) => handlePointClick(pt, e)}
              className={`point-marker absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-10 ${
                isSource ? "ring-4 ring-amber-400 rounded-full scale-125" : ""
              }`}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              title={pt.title}
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-slate-900 shadow-xl flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                {pt.icon_url ? (
                  <img src={pt.icon_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="absolute top-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-slate-900/90 text-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap border border-slate-700 pointer-events-none">
                {pt.title}
              </span>
            </div>
          );
        })}
      </div>

      {pendingCoords && (
        <NewPointModal
          presets={[]}
          onConfirm={confirmNewPoint}
          onCancel={() => setPendingCoords(null)}
        />
      )}
    </div>
  );
}
