import type { Plot } from '../types/plot';

interface PlotTooltipProps {
  plot: Plot;
  x: number;
  y: number;
}

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

const STATUS_STYLE = {
  available: { bg: '#dcfce7', color: '#166534', dot: '#16a34a' },
  reserved: { bg: '#fef9c3', color: '#854d0e', dot: '#ca8a04' },
  sold: { bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
};

export default function PlotTooltip({ plot, x, y }: PlotTooltipProps) {
  const statusStyle = STATUS_STYLE[plot.status];
  const tooltipWidth = 200;
  const tooltipHeight = 140;

  // Keep tooltip inside viewport
  const adjustedX = x + tooltipWidth > window.innerWidth - 20 ? x - tooltipWidth - 12 : x + 12;
  const adjustedY = y + tooltipHeight > window.innerHeight - 20 ? y - tooltipHeight - 12 : y + 12;

  return (
    <div
      className="plot-tooltip fixed z-50 pointer-events-none"
      style={{
        left: adjustedX,
        top: adjustedY,
        width: tooltipWidth,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Header accent bar */}
        <div
          style={{
            height: 3,
            background:
              plot.status === 'available'
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : plot.status === 'reserved'
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #ef4444, #f87171)',
          }}
        />

        <div className="p-3">
          {/* Plot name + number */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div
                className="font-display font-bold text-sm leading-tight"
                style={{ color: '#0f172a' }}
              >
                {plot.plotName}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                Plot {plot.plotNumber}
              </div>
            </div>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: statusStyle.dot }}
              />
              {plot.status.charAt(0).toUpperCase() + plot.status.slice(1)}
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <div
              className="rounded-lg p-2"
              style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
            >
              <div className="text-xs" style={{ color: '#94a3b8' }}>
                Area
              </div>
              <div className="font-semibold text-xs" style={{ color: '#0f172a' }}>
                {plot.areaSqft.toLocaleString()} sqft
              </div>
            </div>
            <div
              className="rounded-lg p-2"
              style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
            >
              <div className="text-xs" style={{ color: '#94a3b8' }}>
                Price
              </div>
              <div className="font-semibold text-xs" style={{ color: '#0f172a' }}>
                {formatPrice(plot.price)}
              </div>
            </div>
          </div>

          {plot.facing && (
            <div className="mt-1.5 text-xs" style={{ color: '#64748b' }}>
              Facing: <span className="font-medium text-blue-600">{plot.facing}</span>
              {plot.corner && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold"
                  style={{ background: '#fef3c7', color: '#92400e' }}>
                  Corner
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
