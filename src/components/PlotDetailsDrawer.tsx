import { X, MapPin, Maximize2, IndianRupee, Tag, SquareSquare, Compass, Phone, MessageSquare, Star } from 'lucide-react';
import { usePlotStore } from '../store/plotStore';
import type { Plot } from '../types/plot';

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} Lakhs`;
  return `₹${price.toLocaleString('en-IN')}`;
}

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    bg: '#dcfce7',
    color: '#166534',
    dot: '#16a34a',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  reserved: {
    label: 'Reserved',
    bg: '#fef9c3',
    color: '#854d0e',
    dot: '#ca8a04',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  sold: {
    label: 'Sold',
    bg: '#fee2e2',
    color: '#991b1b',
    dot: '#dc2626',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
  },
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-1 p-3 rounded-xl"
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
    >
      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
        {icon}
        {label}
      </div>
      <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>
        {value}
      </div>
    </div>
  );
}

export default function PlotDetailsDrawer() {
  const { selectedPlot, selectPlot } = usePlotStore();

  if (!selectedPlot) return null;

  const plot: Plot = selectedPlot;
  const cfg = STATUS_CONFIG[plot.status];
  const pricePerSqft = Math.round(plot.price / plot.areaSqft);

  return (
    <div
      className="details-drawer flex flex-col h-full overflow-y-auto"
      style={{
        width: 300,
        minWidth: 300,
        background: 'white',
        borderLeft: '1px solid #e2e8f0',
      }}
    >
      {/* Header */}
      <div
        className="relative p-4 shrink-0"
        style={{ background: 'linear-gradient(135deg, #0f2040, #1e3a6e)' }}
      >
        <button
          onClick={() => selectPlot(null)}
          className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
          </span>
          {plot.corner && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#fef3c7', color: '#92400e' }}
            >
              Corner Plot
            </span>
          )}
        </div>

        <h2
          className="font-display font-bold text-lg leading-tight text-white"
          style={{ letterSpacing: '-0.02em' }}
        >
          {plot.plotName}
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Plot No. {plot.plotNumber}
        </p>

        {/* Price display */}
        <div className="mt-3 flex items-end gap-2">
          <span
            className="text-2xl font-display font-bold"
            style={{ color: '#fbbf24' }}
          >
            {formatPrice(plot.price)}
          </span>
          <span className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            ₹{pricePerSqft.toLocaleString()}/sqft
          </span>
        </div>
      </div>

      {/* Images */}
      {plot.images && plot.images.length > 0 && (
        <div className="p-3 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {plot.images.slice(0, 2).map((img, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ aspectRatio: '4/3', background: '#f1f5f9' }}
              >
                <img
                  src={img}
                  alt={`Plot view ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
        <StatCard
          icon={<Maximize2 size={11} />}
          label="Area"
          value={`${plot.areaSqft.toLocaleString()} sqft`}
        />
        <StatCard
          icon={<Compass size={11} />}
          label="Facing"
          value={plot.facing || 'N/A'}
        />
        <StatCard
          icon={<IndianRupee size={11} />}
          label="Price/sqft"
          value={`₹${pricePerSqft.toLocaleString()}`}
        />
        <StatCard
          icon={<Tag size={11} />}
          label="Category"
          value="Residential"
        />
      </div>

      {/* Description */}
      {plot.description && (
        <div className="px-3 pb-3">
          <div
            className="rounded-xl p-3"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <h4 className="text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
              About This Plot
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
              {plot.description}
            </p>
          </div>
        </div>
      )}

      {/* Amenities */}
      <div className="px-3 pb-3">
        <h4 className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>
          Nearby Amenities
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {['Club House', 'Park', 'Security', '24/7 Water', 'Paved Roads', 'Street Lights'].map((a) => (
            <span
              key={a}
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="px-3 pb-3">
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
        >
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={12} fill={s <= 4 ? '#f59e0b' : 'none'} color="#f59e0b" />
            ))}
          </div>
          <span className="text-xs font-semibold" style={{ color: '#92400e' }}>
            4.2 / 5 • Premium Location
          </span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="px-3 pb-4 mt-auto flex flex-col gap-2">
        {plot.status === 'available' && (
          <button
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #0f2040, #2563eb)',
            }}
          >
            Book This Plot
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
            style={{
              background: '#dcfce7',
              color: '#166534',
              border: '1px solid #bbf7d0',
            }}
          >
            <Phone size={11} />
            Call Now
          </button>
          <button
            className="py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
            style={{
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            }}
          >
            <MessageSquare size={11} />
            Enquire
          </button>
        </div>
      </div>
    </div>
  );
}
