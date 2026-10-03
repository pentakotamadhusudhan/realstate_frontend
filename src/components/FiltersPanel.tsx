import { Search, RotateCcw, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { usePlotStore } from '../store/plotStore';
import type { PlotStatus } from '../types/plot';

const STATUS_OPTIONS: { value: PlotStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Status', color: '#64748b' },
  { value: 'available', label: 'Available', color: '#10b981' },
  { value: 'reserved', label: 'Reserved', color: '#f59e0b' },
  { value: 'sold', label: 'Sold', color: '#ef4444' },
];

function formatPrice(val: number) {
  if (val >= 10000000) return '₹1Cr+';
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function FiltersPanel() {
  const { filters, setFilter, resetFilters, visiblePlots, allPlots } = usePlotStore();

  const stats = {
    available: allPlots.filter((p) => p.status === 'available').length,
    reserved: allPlots.filter((p) => p.status === 'reserved').length,
    sold: allPlots.filter((p) => p.status === 'sold').length,
  };

  return (
    <aside
      className="flex flex-col h-full overflow-y-auto"
      style={{
        width: 248,
        minWidth: 248,
        background: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-blue-600" />
          <span className="font-display font-semibold text-sm" style={{ color: '#0f172a' }}>
            Filters
          </span>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors hover:bg-blue-50"
          style={{ color: '#2563eb' }}
        >
          <RotateCcw size={10} />
          Reset
        </button>
      </div>

      {/* Stats Summary */}
      <div className="px-3 py-3">
        <div
          className="rounded-xl p-3"
          style={{ background: 'linear-gradient(135deg, #0f2040, #1e4080)' }}
        >
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {visiblePlots.filter((p) => p.category === 'residential').length} plots shown
          </p>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Available', count: stats.available, color: '#10b981' },
              { label: 'Reserved', count: stats.reserved, color: '#f59e0b' },
              { label: 'Sold', count: stats.sold, color: '#ef4444' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-lg font-bold font-display leading-none"
                  style={{ color: s.color }}
                >
                  {s.count}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 flex flex-col gap-3 pb-4">
        {/* Search */}
        <div className="filter-card p-3">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#475569' }}>
            Search Plot
          </label>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Name or number..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg outline-none transition-all"
              style={{
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#0f172a',
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="filter-card p-3">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#475569' }}>
            Availability Status
          </label>
          <div className="flex flex-col gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter('status', opt.value)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background:
                    filters.status === opt.value ? '#eff6ff' : 'transparent',
                  border: `1px solid ${filters.status === opt.value ? '#bfdbfe' : '#f1f5f9'}`,
                  color: filters.status === opt.value ? '#1d4ed8' : '#64748b',
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: opt.color }}
                  />
                  {opt.label}
                </span>
                {filters.status === opt.value && (
                  <span className="text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="filter-card p-3">
          <label className="block text-xs font-semibold mb-1" style={{ color: '#475569' }}>
            Price Range
          </label>
          <div className="flex justify-between text-xs mb-2" style={{ color: '#2563eb' }}>
            <span className="font-semibold">{formatPrice(filters.minPrice)}</span>
            <span className="font-semibold">{formatPrice(filters.maxPrice)}</span>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-xs" style={{ color: '#94a3b8' }}>Min</span>
              <input
                type="range"
                min={0}
                max={10000000}
                step={100000}
                value={filters.minPrice}
                onChange={(e) => setFilter('minPrice', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <span className="text-xs" style={{ color: '#94a3b8' }}>Max</span>
              <input
                type="range"
                min={0}
                max={10000000}
                step={100000}
                value={filters.maxPrice}
                onChange={(e) => setFilter('maxPrice', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>

        {/* Area Range */}
        <div className="filter-card p-3">
          <label className="block text-xs font-semibold mb-1" style={{ color: '#475569' }}>
            Plot Area (sqft)
          </label>
          <div className="flex justify-between text-xs mb-2" style={{ color: '#2563eb' }}>
            <span className="font-semibold">{filters.minArea}</span>
            <span className="font-semibold">{filters.maxArea}</span>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-xs" style={{ color: '#94a3b8' }}>Min Area</span>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={filters.minArea}
                onChange={(e) => setFilter('minArea', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <span className="text-xs" style={{ color: '#94a3b8' }}>Max Area</span>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={filters.maxArea}
                onChange={(e) => setFilter('maxArea', Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="filter-card p-3">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#475569' }}>
            Map Legend
          </label>
          <div className="flex flex-col gap-2">
            {[
              { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Available Plot' },
              { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Reserved Plot' },
              { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Sold Plot' },
              { color: '#22c55e', bg: 'rgba(34,197,94,0.2)', label: 'Park / Green Area' },
              { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'Clubhouse' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
                <span
                  className="legend-dot border"
                  style={{
                    background: item.bg,
                    borderColor: item.color,
                    borderWidth: 2,
                  }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
