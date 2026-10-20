import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle, Home, Compass, IndianRupee } from 'lucide-react';
import type { Flat, FlatFacing, FlatStatus, FlatType } from '../../types/apartment';
import { FLAT_FACINGS, FLAT_STATUSES, FLAT_TYPES } from '../../types/apartment';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import { formatCurrencyFull, formatPrice } from '../../utils/apartmentHelpers';

interface FlatFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (flat: Flat) => void;
    apartmentId: string;
    apartmentName?: string;
    flat?: Flat | null; // If provided, edit mode
}

export default function FlatFormModal({
    isOpen,
    onClose,
    onSuccess,
    apartmentId,
    apartmentName,
    flat,
}: FlatFormModalProps) {
    const isEditing = Boolean(flat);

    const [flatNumber, setFlatNumber] = useState('');
    const [floorNumber, setFloorNumber] = useState<number>(1);
    const [type, setType] = useState<FlatType>('2BHK');
    const [area, setArea] = useState<string>('1200');
    const [facing, setFacing] = useState<FlatFacing>('EAST');
    const [price, setPrice] = useState<string>('6500000');
    const [status, setStatus] = useState<FlatStatus>('OPENED');
    const [description, setDescription] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        if (flat) {
            setFlatNumber(flat.flat_number || '');
            setFloorNumber(flat.floor_number ?? 1);
            setType(flat.type || '2BHK');
            setArea(flat.area?.toString() || '1200');
            setFacing(flat.facing || 'EAST');
            setPrice(flat.price?.toString() || '6500000');
            setStatus(flat.status || 'OPENED');
            setDescription(flat.description || '');
        } else {
            setFlatNumber('');
            setFloorNumber(1);
            setType('2BHK');
            setArea('1200');
            setFacing('EAST');
            setPrice('6000000');
            setStatus('OPENED');
            setDescription('');
        }
        setError(null);
    }, [isOpen, flat]);

    if (!isOpen) return null;

    // Derived calculation: price per sq.ft
    const parsedPrice = parseFloat(price) || 0;
    const parsedArea = parseFloat(area) || 0;
    const pricePerSqft = parsedArea > 0 && parsedPrice > 0 ? Math.round(parsedPrice / parsedArea) : null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!flatNumber.trim()) {
            setError('Flat / Unit number is required (e.g. 101, A-302).');
            return;
        }
        if (!area || parseFloat(area) <= 0) {
            setError('Valid area in sq.ft is required.');
            return;
        }
        if (!price || parseFloat(price) <= 0) {
            setError('Valid flat price is required.');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                apartment_id: apartmentId,
                flat_number: flatNumber.trim(),
                floor_number: Number(floorNumber) || 1,
                type,
                area: area.toString(),
                facing,
                price: price.toString(),
                status,
                description: description.trim(),
            };

            let res: Flat;
            if (isEditing) {
                res = await apiFetch(ENDPOINTS.flatDetail(flat!.id), {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                });
            } else {
                res = await apiFetch(ENDPOINTS.flats(), {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }

            onSuccess(res);
            onClose();
        } catch (err: any) {
            console.error('Failed to save flat:', err);
            setError(err.message || 'Failed to save flat details. Please review inputs.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                            <Home size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                {isEditing ? `Edit Flat ${flat?.flat_number}` : 'Add New Flat Unit'}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {apartmentName ? `In ${apartmentName}` : 'Add unit specifications & pricing'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
                            <AlertCircle size={16} className="shrink-0 text-rose-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Unit Identifier Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Flat Number / Unit <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={flatNumber}
                                onChange={(e) => setFlatNumber(e.target.value)}
                                placeholder="e.g. 101, A-202, Penthouse"
                                required
                                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Floor Number
                            </label>
                            <input
                                type="number"
                                value={floorNumber}
                                onChange={(e) => setFloorNumber(parseInt(e.target.value) || 0)}
                                placeholder="1"
                                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                            />
                        </div>
                    </div>

                    {/* Type & Facing Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Flat Type <span className="text-rose-400">*</span>
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as FlatType)}
                                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                            >
                                {FLAT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                                <Compass size={13} className="text-blue-400" />
                                Facing (Fasting) <span className="text-rose-400">*</span>
                            </label>
                            <select
                                value={facing}
                                onChange={(e) => setFacing(e.target.value as FlatFacing)}
                                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                            >
                                {FLAT_FACINGS.map((f) => (
                                    <option key={f.value} value={f.value}>
                                        {f.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Area & Price Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Area (sq.ft) <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="1"
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                placeholder="1250"
                                required
                                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <IndianRupee size={13} className="text-emerald-400" />
                                    Price (₹) <span className="text-rose-400">*</span>
                                </span>
                                <span className="text-[11px] font-bold text-emerald-400">
                                    {formatPrice(parsedPrice)}
                                </span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="6500000"
                                required
                                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                            />
                        </div>
                    </div>

                    {/* Calculated Helper Strip */}
                    <div className="flex items-center justify-between px-3.5 py-2 bg-gray-950/70 border border-gray-800/80 rounded-xl text-xs text-gray-400">
                        <span>
                            Full Amount: <span className="text-white font-semibold">{formatCurrencyFull(parsedPrice)}</span>
                        </span>
                        {pricePerSqft !== null && (
                            <span className="text-emerald-400 font-medium">
                                ₹{pricePerSqft.toLocaleString('en-IN')}/sq.ft
                            </span>
                        )}
                    </div>

                    {/* Status Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Status <span className="text-rose-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {FLAT_STATUSES.map((st) => {
                                const isSelected = status === st.value;
                                return (
                                    <button
                                        key={st.value}
                                        type="button"
                                        onClick={() => setStatus(st.value)}
                                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                                            isSelected
                                                ? `${st.bg} ${st.color} ${st.border} ring-1 ring-emerald-500/50 shadow-sm`
                                                : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-950'
                                        }`}
                                    >
                                        {st.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Description / Features
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Corner unit, sea view, 2 balconies, modular kitchen..."
                            className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span>{isEditing ? 'Save Changes' : 'Create Flat Unit'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
