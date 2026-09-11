import {
  X,
  Maximize2,
  IndianRupee,
  Tag,
  Compass,
  Phone,
  MessageSquare,
  Star,
} from 'lucide-react';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { usePlotStore } from '../store/plotStore';
import type { Plot } from '../types/plot';
import { apiFetch } from '../lib/api';


// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

function formatPrice(price: number): string {
  if (price >= 10_000_000) {
    return `₹${(price / 10_000_000).toFixed(2)} Cr`;
  }

  if (price >= 100_000) {
    return `₹${(price / 100_000).toFixed(1)} Lakhs`;
  }

  return `₹${price.toLocaleString('en-IN')}`;
}


// -----------------------------------------------------
// Status Configuration
// -----------------------------------------------------

interface StatusConfig {
  label: string;
  bg: string;
  color: string;
  dot: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  available: {
    label: 'Available',
    bg: '#dcfce7',
    color: '#166534',
    dot: '#16a34a',
  },

  reserved: {
    label: 'Reserved',
    bg: '#fef9c3',
    color: '#854d0e',
    dot: '#ca8a04',
  },

  held: {
    label: 'Held',
    bg: '#fef9c3',
    color: '#854d0e',
    dot: '#ca8a04',
  },

  sold: {
    label: 'Sold',
    bg: '#fee2e2',
    color: '#991b1b',
    dot: '#dc2626',
  },

  blocked: {
    label: 'Blocked',
    bg: '#f1f5f9',
    color: '#475569',
    dot: '#94a3b8',
  },
};

const DEFAULT_STATUS: StatusConfig = {
  label: 'Unknown',
  bg: '#f1f5f9',
  color: '#475569',
  dot: '#94a3b8',
};


// -----------------------------------------------------
// Stat Card
// -----------------------------------------------------

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-1 p-3 rounded-xl"
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        className="flex items-center gap-1.5 text-xs"
        style={{ color: '#94a3b8' }}
      >
        {icon}
        {label}
      </div>

      <div
        className="font-semibold text-sm"
        style={{ color: '#0f172a' }}
      >
        {value}
      </div>
    </div>
  );
}


// -----------------------------------------------------
// Plot Details Drawer
// -----------------------------------------------------

export default function PlotDetailsDrawer() {
  const { selectedPlot, selectPlot } = usePlotStore();

  const [holding, setHolding] = useState(false);
  const [holdSuccess, setHoldSuccess] = useState(false);
  const [holdError, setHoldError] = useState('');
  const [showCallDialog, setShowCallDialog] = useState(false);

  // No selected plot
  if (!selectedPlot) {
    return null;
  }

  const plot: Plot = selectedPlot;

  const cfg =
    STATUS_CONFIG[plot.status?.toLowerCase()] ?? DEFAULT_STATUS;

  const pricePerSqft =
    plot.areaSqft > 0
      ? Math.round(plot.price / plot.areaSqft)
      : 0;


  // -----------------------------------------------------
  // Hold Plot
  // -----------------------------------------------------

  async function handleHold() {
    if (holding) {
      return;
    }

    setHolding(true);
    setHoldError('');
    setHoldSuccess(false);

    try {
      await apiFetch('http://192.168.1.10:8000/api/holds/', {
        method: 'POST',
        body: JSON.stringify({
          plot_id: plot.id,
        }),
      });

      setHoldSuccess(true);
    } catch (error: unknown) {
      const err = error as {
        detail?: string;
        non_field_errors?: string[];
        plot_id?: string[];
        message?: string;
      };

      const message =
        err?.detail ||
        err?.non_field_errors?.[0] ||
        err?.plot_id?.[0] ||
        err?.message ||
        'Failed to place hold. Try again.';

      setHoldError(message);
    } finally {
      setHolding(false);
    }
  }


  // -----------------------------------------------------
  // Close Drawer
  // -----------------------------------------------------

  function handleClose() {
    selectPlot(null);
  }


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

      {/* -------------------------------------------------
          Header
      ------------------------------------------------- */}

      <div
        className="relative p-4 shrink-0"
        style={{
          background: 'linear-gradient(135deg, #0f2040, #1e3a6e)',
        }}
      >
        {/* Close Button */}

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close plot details"
          className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-white/20"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <X size={14} />
        </button>


        {/* Status */}

        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{
              background: cfg.bg,
              color: cfg.color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.dot }}
            />

            {cfg.label}
          </span>


          {/* Corner Plot */}

          {plot.corner_plot && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: '#fef3c7',
                color: '#92400e',
              }}
            >
              Corner Plot
            </span>
          )}
        </div>


        {/* Plot Name */}

        <h2
          className="font-display font-bold text-lg leading-tight text-white"
          style={{ letterSpacing: '-0.02em' }}
        >
          {plot.plotName}
        </h2>


        {/* Plot Number */}

        <p
          className="text-sm mt-0.5"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Plot No. {plot.plotNumber}
        </p>


        {/* Price */}

        <div className="mt-3 flex items-end gap-2">
          <span
            className="text-2xl font-display font-bold"
            style={{ color: '#fbbf24' }}
          >
            {formatPrice(plot.price)}
          </span>

          {pricePerSqft > 0 && (
            <span
              className="text-xs mb-1"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              ₹{pricePerSqft.toLocaleString('en-IN')}/sqft
            </span>
          )}
        </div>
      </div>


      {/* -------------------------------------------------
          Images
      ------------------------------------------------- */}

      {plot.images && plot.images.length > 0 && (
        <div className="p-3 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {plot.images.slice(0, 2).map((img, index) => (
              <div
                key={`${img}-${index}`}
                className="rounded-xl overflow-hidden"
                style={{
                  aspectRatio: '4/3',
                  background: '#f1f5f9',
                }}
              >
                <img
                  src={img}
                  alt={`Plot view ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}


      {/* -------------------------------------------------
          Stats
      ------------------------------------------------- */}

      <div className="px-3 pb-3 grid grid-cols-2 gap-2">

        <StatCard
          icon={<Maximize2 size={11} />}
          label="Area"
          value={`${plot.areaSqft.toLocaleString('en-IN')} sqft`}
        />

        <StatCard
          icon={<Compass size={11} />}
          label="Facing"
          value={plot.facing || 'N/A'}
        />

        <StatCard
          icon={<IndianRupee size={11} />}
          label="Price/sqft"
          value={
            pricePerSqft > 0
              ? `₹${pricePerSqft.toLocaleString('en-IN')}`
              : 'N/A'
          }
        />

        <StatCard
          icon={<Tag size={11} />}
          label="Dimensions"
          value={plot.dimensions || 'N/A'}
        />
      </div>


      {/* -------------------------------------------------
          Description
      ------------------------------------------------- */}

      {plot.description && (
        <div className="px-3 pb-3">
          <div
            className="rounded-xl p-3"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <h4
              className="text-xs font-semibold mb-1.5"
              style={{ color: '#475569' }}
            >
              About This Plot
            </h4>

            <p
              className="text-xs leading-relaxed"
              style={{ color: '#64748b' }}
            >
              {plot.description}
            </p>
          </div>
        </div>
      )}


      {/* -------------------------------------------------
          Nearby Amenities
      ------------------------------------------------- */}

      <div className="px-3 pb-3">
        <h4
          className="text-xs font-semibold mb-2"
          style={{ color: '#475569' }}
        >
          Nearby Amenities
        </h4>

        <div className="flex flex-wrap gap-1.5">
          {[
            'Club House',
            'Park',
            'Security',
            '24/7 Water',
            'Paved Roads',
            'Street Lights',
          ].map((amenity) => (
            <span
              key={amenity}
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
              }}
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>


      {/* -------------------------------------------------
          Rating
      ------------------------------------------------- */}

      <div className="px-3 pb-3">
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
          }}
        >
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={12}
                fill={star <= 4 ? '#f59e0b' : 'none'}
                color="#f59e0b"
              />
            ))}
          </div>

          <span
            className="text-xs font-semibold"
            style={{ color: '#92400e' }}
          >
            4.2 / 5 • Premium Location
          </span>
        </div>
      </div>


      {/* -------------------------------------------------
          CTA Buttons
      ------------------------------------------------- */}

      <div className="px-3 pb-4 mt-auto flex flex-col gap-2">

        {/* Book / Hold Button */}

        {plot.status?.toLowerCase() === 'available' && (
          <>
            {holdSuccess ? (
              <div
                className="w-full py-3 rounded-xl text-sm font-semibold text-center"
                style={{
                  background: '#dcfce7',
                  color: '#166534',
                }}
              >
                <div>✅ Plot held successfully!</div>

                <p
                  className="text-xs font-normal mt-0.5"
                  style={{ color: '#166534' }}
                >
                  Our team will contact you soon.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleHold}
                disabled={holding}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{
                  background:
                    'linear-gradient(135deg, #0f2040, #2563eb)',
                }}
              >
                {holding
                  ? 'Placing Hold...'
                  : '🔒 Book This Plot'}
              </button>
            )}

            {holdError && (
              <p className="text-xs text-red-500 text-center">
                {holdError}
              </p>
            )}
          </>
        )}


        {/* Held Status */}

        {plot.status?.toLowerCase() === 'held' && (
          <div
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{
              background: '#fef9c3',
              color: '#854d0e',
            }}
          >
            ⏳ This plot is currently on hold
          </div>
        )}


        {/* Reserved Status */}

        {plot.status?.toLowerCase() === 'reserved' && (
          <div
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{
              background: '#fef9c3',
              color: '#854d0e',
            }}
          >
            📋 This plot is currently reserved
          </div>
        )}


        {/* Sold Status */}

        {plot.status?.toLowerCase() === 'sold' && (
          <div
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{
              background: '#fee2e2',
              color: '#991b1b',
            }}
          >
            ❌ This plot has been sold
          </div>
        )}


        {/* -------------------------------------------------
            Contact Buttons
        ------------------------------------------------- */}

        <div className="grid grid-cols-2 gap-2">

          {/* Call */}

          <button
            type="button"
            onClick={() => setShowCallDialog(true)}
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


          {/* Enquire */}

          <button
            type="button"
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


      {/* -------------------------------------------------
          Call Dialog
      ------------------------------------------------- */}

      {showCallDialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowCallDialog(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 mx-4 flex flex-col items-center gap-4"
            style={{
              width: 300,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(event) => event.stopPropagation()}
          >

            {/* Icon */}

            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, #dcfce7, #bbf7d0)',
              }}
            >
              <Phone size={28} color="#16a34a" />
            </div>


            {/* Title */}

            <div className="text-center">
              <h3
                className="text-lg font-bold"
                style={{ color: '#0f172a' }}
              >
                Contact Us
              </h3>

              <p
                className="text-sm mt-1"
                style={{ color: '#64748b' }}
              >
                Call us for more details about
              </p>

              <p
                className="text-sm font-semibold"
                style={{ color: '#0f172a' }}
              >
                Plot {plot.plotNumber}
              </p>
            </div>


            {/* Phone Number */}

            <a
              href="tel:+91123456789"
              className="w-full py-3 rounded-xl text-center font-bold text-lg transition-all hover:opacity-90 active:scale-95"
              style={{
                background:
                  'linear-gradient(135deg, #16a34a, #15803d)',
                color: 'white',
              }}
            >
              +91 123456789
            </a>


            {/* Timings */}

            <p
              className="text-xs text-center"
              style={{ color: '#94a3b8' }}
            >
              Available Mon–Sat, 9:00 AM – 6:00 PM
            </p>


            {/* Close */}

            <button
              type="button"
              onClick={() => setShowCallDialog(false)}
              className="w-full py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{
                background: '#f1f5f9',
                color: '#475569',
              }}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}