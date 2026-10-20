import {
  X,
  Maximize2,
  IndianRupee,
  Tag,
  Compass,
  Phone,
  MessageSquare,
  Star,
  User,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

import { usePlotStore } from '../store/plotStore';
import type { Plot } from '../types/plot';
import { apiFetch, ENDPOINTS } from '../lib/api';
import { isAgent, getUserProfile } from '../lib/auth';



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

  // Call Query State
  const [showCallDialog, setShowCallDialog] = useState(false);
  const user = getUserProfile();
  const [callName, setCallName] = useState(user?.full_name || '');
  const [callPhone, setCallPhone] = useState(user?.mobile_number || '');
  const [callEmail, setCallEmail] = useState(user?.email || '');
  const [callTime, setCallTime] = useState('Morning (9 AM - 12 PM)');
  const [callMessage, setCallMessage] = useState('');
  const [callSubmitting, setCallSubmitting] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);
  const [callError, setCallError] = useState('');

  useEffect(() => {
    if (showCallDialog) {
      const u = getUserProfile();
      if (u) {
        if (!callName && u.full_name) setCallName(u.full_name);
        if (!callPhone && u.mobile_number) setCallPhone(u.mobile_number);
        if (!callEmail && u.email) setCallEmail(u.email);
      }
      setCallSuccess(false);
      setCallError('');
    }
  }, [showCallDialog]);

  // No selected plot
  if (!selectedPlot) {
    return null;
  }

  const plot: Plot = selectedPlot;

  async function handleCallQuerySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!callName.trim() || !callPhone.trim()) {
      setCallError('Please provide your name and phone number.');
      return;
    }

    setCallSubmitting(true);
    setCallError('');

    try {
      let ventureId = plot.venture;
      if (!ventureId) {
        try {
          const stored = sessionStorage.getItem('customer_venture') || sessionStorage.getItem('selected_venture');
          if (stored) {
            const v = JSON.parse(stored);
            ventureId = v.id;
          }
        } catch { }
      }

      const payload = {
        venture: ventureId || undefined,
        plot: plot.id,
        customer_name: callName.trim(),
        customer_phone: callPhone.trim(),
        customer_email: callEmail.trim() || undefined,
        message: callMessage.trim() || `Inquiry regarding Plot ${plot.plotNumber}`,
        preferred_call_time: callTime,
      };

      await apiFetch(ENDPOINTS.callQueries(), {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCallSuccess(true);
    } catch (err: any) {
      setCallError(err?.detail || err?.message || 'Failed to submit call query. Please try again.');
    } finally {
      setCallSubmitting(false);
    }
  }

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
      await apiFetch('http://192.168.0.202:8000//holds/', {
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

        {/* Book / Hold Button (Restricted: AGENTS CANNOT BOOK SLOTS) */}

        {plot.status?.toLowerCase() === 'available' && (
          <>
            {isAgent() ? (
              <div className="w-full p-3 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    🏢 Agent Mode
                  </span>
                  <span className="bg-amber-900/80 text-amber-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-amber-700">
                    Slot Booking Disabled
                  </span>
                </div>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Agents cannot book or hold plots directly. Initiate a <strong>Call Query</strong> for buyer leads.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCallDialog(true)}
                  className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Phone size={13} />
                  Initiate Call Query
                </button>
              </div>
            ) : holdSuccess ? (
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
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 cursor-pointer"
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
          Call Query Modal (API Integration)
      ------------------------------------------------- */}

      {showCallDialog && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            background: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowCallDialog(false)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-gray-900 to-gray-900 px-6 py-5 border-b border-gray-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Initiate Call Query
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      Plot {plot.plotNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Schedule a callback from our sales team or verified agent
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCallDialog(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content / Form */}
            {callSuccess ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Call Query Submitted!</h4>
                <p className="text-sm text-gray-300 mb-6 max-w-xs leading-relaxed">
                  Thank you! Our dedicated executive or verified agent will contact you at{' '}
                  <span className="text-emerald-400 font-semibold">{callPhone}</span> during your preferred time slot ({callTime}).
                </p>
                <button
                  type="button"
                  onClick={() => setShowCallDialog(false)}
                  className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleCallQuerySubmit} className="p-6 space-y-4">
                {callError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{callError}</span>
                  </div>
                )}

                {/* Plot Quick Overview */}
                <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Selected Property</span>
                    <span className="text-white font-bold">Plot #{plot.plotNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block text-[11px]">Area / Price</span>
                    <span className="text-amber-400 font-bold">
                      {plot.areaSqft} sqft • {formatPrice(plot.price)}
                    </span>
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-3 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={callName}
                        onChange={(e) => setCallName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-3 text-gray-500" />
                      <input
                        type="tel"
                        required
                        value={callPhone}
                        onChange={(e) => setCallPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-3 text-gray-500" />
                    <input
                      type="email"
                      value={callEmail}
                      onChange={(e) => setCallEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Preferred Callback Time */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Clock size={13} className="text-emerald-400" />
                    Preferred Callback Time
                  </label>
                  <select
                    value={callTime}
                    onChange={(e) => setCallTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Morning (9 AM - 12 PM)">Morning (9:00 AM – 12:00 PM)</option>
                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12:00 PM – 4:00 PM)</option>
                    <option value="Evening (4 PM - 7 PM)">Evening (4:00 PM – 7:00 PM)</option>
                    <option value="Anytime">Anytime during business hours</option>
                  </select>
                </div>

                {/* Inquiry Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Specific Questions or Notes
                  </label>
                  <textarea
                    rows={2}
                    value={callMessage}
                    onChange={(e) => setCallMessage(e.target.value)}
                    placeholder="e.g. Inquiring about corner plot negotiation or site visit availability..."
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCallDialog(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-800 hover:bg-gray-800 text-gray-300 font-medium text-xs transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={callSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {callSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Request Callback
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}