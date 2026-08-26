import { useEffect, useRef, useState, useCallback, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { usePlotStore } from '../store/plotStore';
import { specialFeatures, TOWNSHIP_CENTER, MAP_ZOOM, plots as allPlotsData } from '../data/plots';
import type { Plot, LatLng } from '../types/plot';
import PlotTooltip from './PlotTooltip';
import { Pencil, X, Check, RotateCcw, Info } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Set GOOGLE_MAPS_API_KEY to your real key to swap to Google Maps.
// Leave empty → Leaflet (OpenStreetMap) is used — no key needed.
// ─────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = '';

// ── Colour palette ──────────────────────────────────────────────
const COLORS = {
  available: '#10b981',
  reserved:  '#f59e0b',
  sold:      '#ef4444',
};

// ── Coord converters ────────────────────────────────────────────
const toLL  = (c: LatLng): L.LatLngExpression => [c.lat, c.lng];
const toLLs = (cs: LatLng[]): L.LatLngExpression[] => cs.map(toLL);

function readCoords(poly: L.Polygon): LatLng[] {
  const lls = poly.getLatLngs()[0] as L.LatLng[];
  return lls.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
}

// ── Leaflet style helpers ───────────────────────────────────────
function idleStyle(status: Plot['status'], visible: boolean): L.PathOptions {
  const c = COLORS[status];
  return { color: c, fillColor: c, fillOpacity: visible ? 0.18 : 0.05,
           opacity: visible ? 1 : 0.25, weight: 2 };
}
function hoverStyle(status: Plot['status']): L.PathOptions {
  const c = COLORS[status];
  return { color: c, fillColor: c, fillOpacity: 0.38, opacity: 1, weight: 3 };
}
function selectedStyle(status: Plot['status']): L.PathOptions {
  const c = COLORS[status];
  return { color: c, fillColor: c, fillOpacity: 0.52, opacity: 1, weight: 3.5 };
}
const EDITING_STYLE: L.PathOptions = {
  color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.22, opacity: 1, weight: 3,
};

// ── Drag-handle marker for edit mode ────────────────────────────
function makeHandle(latlng: L.LatLng, poly: L.Polygon, idx: number, map: L.Map): L.Marker {
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:white;border:2.5px solid #f59e0b;
      box-shadow:0 1px 6px rgba(0,0,0,0.35);
      cursor:grab;
    "></div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });

  const marker = L.marker(latlng, { icon, draggable: true, zIndexOffset: 1000 }).addTo(map);

  marker.on('drag', (e: L.LeafletEvent) => {
    const ev       = e as L.DragEndEvent & { latlng: L.LatLng };
    const newLatLng = (ev as unknown as { latlng: L.LatLng }).latlng;
    const path     = poly.getLatLngs()[0] as L.LatLng[];
    path[idx]      = newLatLng;
    poly.setLatLngs([path]);
  });

  return marker;
}

interface TooltipState { plot: Plot; x: number; y: number }

// ╔═══════════════════════════════════════════════════════════════╗
// ║                        PlotMap                               ║
// ╚═══════════════════════════════════════════════════════════════╝
export default memo(function PlotMap() {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletRef  = useRef<L.Map | null>(null);
  const polysRef    = useRef<Map<string, L.Polygon>>(new Map());
  const handlesRef  = useRef<L.Marker[]>([]);
  const featuresRef = useRef<(L.Polygon | L.Marker)[]>([]);

  const editSnapshotRef  = useRef<LatLng[] | null>(null);
  const originalCoordsRef = useRef(
    new Map(allPlotsData.map((p) => [p.id, p.coordinates.map((c) => ({ ...c }))]))
  );

  const {
    visiblePlots, allPlots, selectedPlot,
    selectPlot, hoverPlot,
    isEditMode, editingPlotId,
    toggleEditMode, setEditingPlotId, updatePlotCoordinates,
  } = usePlotStore();

  const [tooltip,  setTooltip]  = useState<TooltipState | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const visibleIds = new Set(visiblePlots.map((p) => p.id));

  // ── Remove all drag handles ────────────────────────────────────
  const clearHandles = useCallback(() => {
    handlesRef.current.forEach((h) => h.remove());
    handlesRef.current = [];
  }, []);

  // ── Attach drag handles to the currently-edited polygon ────────
  const attachHandles = useCallback((poly: L.Polygon) => {
    if (!leafletRef.current) return;
    clearHandles();
    const path = poly.getLatLngs()[0] as L.LatLng[];
    handlesRef.current = path.map((ll, i) => makeHandle(ll, poly, i, leafletRef.current!));
  }, [clearHandles]);

  // ── Start editing a plot ───────────────────────────────────────
  const startEditing = useCallback((plotId: string) => {
    const poly = polysRef.current.get(plotId);
    if (!poly) return;
    editSnapshotRef.current = readCoords(poly);
    poly.setStyle(EDITING_STYLE);
    attachHandles(poly);
    setEditingPlotId(plotId);
    selectPlot(null);
    setTooltip(null);
  }, [attachHandles, setEditingPlotId, selectPlot]);

  // ── Save edited shape ──────────────────────────────────────────
  const saveEdit = useCallback(() => {
    if (!editingPlotId) return;
    const poly = polysRef.current.get(editingPlotId);
    if (!poly) return;
    updatePlotCoordinates(editingPlotId, readCoords(poly));
    const plot = allPlots.find((p) => p.id === editingPlotId);
    if (plot) poly.setStyle(idleStyle(plot.status, visibleIds.has(editingPlotId)));
    clearHandles();
    editSnapshotRef.current = null;
    setEditingPlotId(null);
  }, [editingPlotId, allPlots, visibleIds, clearHandles, updatePlotCoordinates, setEditingPlotId]);

  // ── Cancel — revert to snapshot ────────────────────────────────
  const cancelEdit = useCallback(() => {
    if (!editingPlotId) return;
    const poly = polysRef.current.get(editingPlotId);
    if (poly) {
      if (editSnapshotRef.current) poly.setLatLngs([toLLs(editSnapshotRef.current)]);
      const plot = allPlots.find((p) => p.id === editingPlotId);
      if (plot) poly.setStyle(idleStyle(plot.status, visibleIds.has(editingPlotId)));
    }
    clearHandles();
    editSnapshotRef.current = null;
    setEditingPlotId(null);
  }, [editingPlotId, allPlots, visibleIds, clearHandles, setEditingPlotId]);

  // ── Reset to original coords from plots.ts ─────────────────────
  const resetToOriginal = useCallback(() => {
    if (!editingPlotId) return;
    const poly = polysRef.current.get(editingPlotId);
    const orig = originalCoordsRef.current.get(editingPlotId);
    if (poly && orig) {
      poly.setLatLngs([toLLs(orig)]);
      attachHandles(poly);
    }
  }, [editingPlotId, attachHandles]);

  // ── Toggle global edit mode ────────────────────────────────────
  const handleToggleEditMode = useCallback(() => {
    if (editingPlotId) cancelEdit();
    toggleEditMode();
  }, [editingPlotId, cancelEdit, toggleEditMode]);

  // ── 1. Mount Leaflet ───────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    const map = L.map(mapRef.current, {
      center:      [TOWNSHIP_CENTER.lat, TOWNSHIP_CENTER.lng],
      zoom:        MAP_ZOOM,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 22,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    leafletRef.current = map;
    setMapReady(true);

    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // ── 2. Draw polygons whenever map / filters / editMode change ──
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;

    // Teardown
    clearHandles();
    featuresRef.current.forEach((f) => f.remove());
    featuresRef.current = [];
    polysRef.current.forEach((p) => p.remove());
    polysRef.current.clear();

    // ── Residential plots ──────────────────────────────────────
    allPlotsData.filter((p) => p.category === 'residential').forEach((base) => {
      const plot      = allPlots.find((p) => p.id === base.id) ?? base;
      const isVisible = visibleIds.has(plot.id);

      const poly = L.polygon(toLLs(plot.coordinates), idleStyle(plot.status, isVisible))
        .addTo(leafletRef.current!);
      polysRef.current.set(plot.id, poly);

      poly.on('mouseover', (e: L.LeafletMouseEvent) => {
        if (!isVisible) return;
        if (isEditMode && !editingPlotId) {
          poly.setStyle({ ...idleStyle(plot.status, true), fillOpacity: 0.30, weight: 2.5 });
        } else if (!isEditMode) {
          poly.setStyle(hoverStyle(plot.status));
          hoverPlot(plot.id);
          setTooltip({ plot, x: e.originalEvent.clientX, y: e.originalEvent.clientY });
        }
      });

      poly.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (!isVisible || isEditMode) return;
        setTooltip((prev) => prev ? { ...prev, x: e.originalEvent.clientX, y: e.originalEvent.clientY } : null);
      });

      poly.on('mouseout', () => {
        if (editingPlotId === plot.id) return;
        poly.setStyle(idleStyle(plot.status, isVisible));
        if (!isEditMode) { hoverPlot(null); setTooltip(null); }
      });

      poly.on('click', () => {
        if (!isVisible) return;
        if (isEditMode) {
          if (editingPlotId && editingPlotId !== plot.id) saveEdit();
          if (editingPlotId !== plot.id) startEditing(plot.id);
        } else {
          selectPlot(plot);
        }
      });
    });

    // ── Park / Clubhouse polygons ──────────────────────────────
    specialFeatures.forEach((f) => {
      if (!f.polygon) return;
      const color = f.type === 'park' ? '#22c55e' : '#8b5cf6';
      const p = L.polygon(toLLs(f.polygon), {
        color, fillColor: color, fillOpacity: 0.20, weight: 2, opacity: 0.8, interactive: false,
      }).addTo(leafletRef.current!);
      featuresRef.current.push(p);
    });

    // ── Markers ────────────────────────────────────────────────
    specialFeatures.forEach((f) => {
      const emoji = f.type === 'entrance' ? '🏛' : f.type === 'park' ? '🌳' : '🏊';
      const bg    = f.type === 'entrance' ? '#0f2040' : f.type === 'park' ? '#16a34a' : '#7c3aed';
      const sz    = f.type === 'entrance' ? 34 : 28;
      const icon  = L.divIcon({
        className: '',
        html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;
          background:${bg};border:2px solid white;display:flex;
          align-items:center;justify-content:center;
          font-size:${sz * 0.45}px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
        iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2],
      });
      const m = L.marker([f.position.lat, f.position.lng], { icon, interactive: false })
        .addTo(leafletRef.current!);
      featuresRef.current.push(m);
    });

  }, [mapReady, visiblePlots, isEditMode, allPlots]);

  // ── 3. Selected-plot highlight ─────────────────────────────────
  useEffect(() => {
    polysRef.current.forEach((poly, id) => {
      if (id === editingPlotId) return;
      const plot = allPlots.find((p) => p.id === id);
      if (!plot) return;
      poly.setStyle(
        selectedPlot?.id === id
          ? selectedStyle(plot.status)
          : idleStyle(plot.status, visibleIds.has(id))
      );
    });
  }, [selectedPlot, visiblePlots, allPlots, editingPlotId]);

  const editingPlot = editingPlotId ? allPlots.find((p) => p.id === editingPlotId) : null;

  return (
    <div className="flex-1 relative overflow-hidden">

      {/* ── Map canvas ─────────────────────────────────────────── */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }} />

      {/* ── Hover tooltip ──────────────────────────────────────── */}
      {tooltip && !isEditMode && (
        <PlotTooltip plot={tooltip.plot} x={tooltip.x} y={tooltip.y} />
      )}

      {/* ══════════════════════════════════════════════════════════
          EDIT BUTTON — top-right (left of zoom controls)
      ══════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 right-14 flex flex-col items-end gap-2 z-[1000]">
        <button
          onClick={handleToggleEditMode}
          title={isEditMode ? 'Exit Edit Mode' : 'Edit Plot Shapes'}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold
                     text-sm shadow-lg transition-all duration-200 active:scale-95"
          style={isEditMode
            ? { background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: 'white',
                boxShadow: '0 4px 20px rgba(239,68,68,0.45)' }
            : { background: 'linear-gradient(135deg,#0f2040,#1e4080)', color: 'white',
                boxShadow: '0 4px 20px rgba(15,32,64,0.35)' }}
        >
          {isEditMode
            ? <><X size={15} strokeWidth={2.5} />Exit Edit</>
            : <><Pencil size={15} strokeWidth={2.5} />Edit Plots</>}
        </button>

        {isEditMode && !editingPlotId && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs
                          font-medium shadow-md"
               style={{ background: 'rgba(245,158,11,0.95)', color: '#451a03',
                        backdropFilter: 'blur(8px)', maxWidth: 210 }}>
            <Info size={13} strokeWidth={2.5} />
            Click any plot to reshape it
          </div>
        )}
      </div>

      {/* ── Edit mode badge (top-left) ──────────────────────────── */}
      {isEditMode && (
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2
                        px-3 py-2 rounded-xl text-xs font-semibold shadow-lg"
             style={{ background: 'rgba(245,158,11,0.92)', color: '#451a03',
                      backdropFilter: 'blur(8px)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <Pencil size={12} strokeWidth={2.5} />
          Edit Mode Active
          {editingPlotId && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(0,0,0,0.15)' }}>
              Reshaping…
            </span>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ACTIVE EDIT CONTROLS — bottom centre bar
      ══════════════════════════════════════════════════════════ */}
      {editingPlotId && editingPlot && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]
                        flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
             style={{ background: 'rgba(15,32,64,0.96)', backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.12)', minWidth: 360 }}>
          <div className="flex-1 min-w-0">
            <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Editing polygon
            </div>
            <div className="text-sm font-bold text-white truncate">
              {editingPlot.plotName}
              <span className="ml-2 text-xs font-normal"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                {editingPlot.plotNumber}
              </span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Drag the yellow handles to reshape
            </div>
          </div>

          <button onClick={resetToOriginal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
                             font-semibold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
            <RotateCcw size={13} /> Reset
          </button>

          <button onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
                             font-semibold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.18)', color: '#fca5a5' }}>
            <X size={13} /> Cancel
          </button>

          <button onClick={saveEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs
                             font-bold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)',
                           color: 'white', boxShadow: '0 2px 12px rgba(16,185,129,0.4)' }}>
            <Check size={13} strokeWidth={2.5} /> Save Shape
          </button>
        </div>
      )}

      {/* ── "Using OSM" watermark ───────────────────────────────── */}
      {GOOGLE_MAPS_API_KEY === '' && (
        <div className="absolute bottom-3 left-3 z-[1000] text-xs px-2.5 py-1.5 rounded-lg"
             style={{ background: 'rgba(15,32,64,0.72)', color: 'rgba(255,255,255,0.45)',
                      backdropFilter: 'blur(6px)' }}>
          OpenStreetMap ·{' '}
          <span style={{ color: 'rgba(147,197,253,0.8)' }}>
            set GOOGLE_MAPS_API_KEY for Google Maps
          </span>
        </div>
      )}
    </div>
  );
});
