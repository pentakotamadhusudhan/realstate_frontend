import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Check, Loader2, AlertCircle, Home } from 'lucide-react';
import type { Flat, FlatFacing, FlatStatus, FlatType } from '../../types/apartment';
import { FLAT_FACINGS, FLAT_STATUSES, FLAT_TYPES } from '../../types/apartment';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import { formatPrice } from '../../utils/apartmentHelpers';

interface BulkFlatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (flats: Flat[]) => void;
    apartmentId: string;
    apartmentName?: string;
}

interface DraftFlat {
    flat_number: string;
    floor_number: number;
    type: FlatType;
    area: string;
    facing: FlatFacing;
    price: string;
    status: FlatStatus;
    description: string;
}

export default function BulkFlatModal({
    isOpen,
    onClose,
    onSuccess,
    apartmentId,
    apartmentName,
}: BulkFlatModalProps) {
    // Generator controls
    const [startFloor, setStartFloor] = useState(1);
    const [endFloor, setEndFloor] = useState(4);
    const [flatsPerFloor, setFlatsPerFloor] = useState(4);
    const [defaultType, setDefaultType] = useState<FlatType>('2BHK');
    const [defaultArea, setDefaultArea] = useState('1200');
    const [defaultFacing, setDefaultFacing] = useState<FlatFacing>('EAST');
    const [defaultPrice, setDefaultPrice] = useState('6000000');
    const [defaultStatus, setDefaultStatus] = useState<FlatStatus>('OPENED');

    // Generated flat list
    const [draftFlats, setDraftFlats] = useState<DraftFlat[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    function handleGenerate() {
        if (endFloor < startFloor) {
            setError('End floor must be greater than or equal to start floor.');
            return;
        }
        if (flatsPerFloor < 1 || flatsPerFloor > 20) {
            setError('Flats per floor must be between 1 and 20.');
            return;
        }

        setError(null);
        const generated: DraftFlat[] = [];

        for (let fl = startFloor; fl <= endFloor; fl++) {
            for (let unit = 1; unit <= flatsPerFloor; unit++) {
                // Formatting: e.g. Floor 1, Unit 2 -> 102; Floor 12, Unit 4 -> 1204
                const unitSuffix = unit < 10 ? `0${unit}` : `${unit}`;
                const flatNum = `${fl}${unitSuffix}`;

                generated.push({
                    flat_number: flatNum,
                    floor_number: fl,
                    type: defaultType,
                    area: defaultArea,
                    facing: defaultFacing,
                    price: defaultPrice,
                    status: defaultStatus,
                    description: `${defaultType} flat on Floor ${fl}`,
                });
            }
        }

        setDraftFlats(generated);
    }

    function handleUpdateRow(index: number, field: keyof DraftFlat, value: any) {
        setDraftFlats((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    }

    function handleRemoveRow(index: number) {
        setDraftFlats((prev) => prev.filter((_, i) => i !== index));
    }

    function handleAddRow() {
        const nextFloor = draftFlats.length > 0 ? draftFlats[draftFlats.length - 1].floor_number : 1;
        setDraftFlats((prev) => [
            ...prev,
            {
                flat_number: `Unit-${prev.length + 1}`,
                floor_number: nextFloor,
                type: defaultType,
                area: defaultArea,
                facing: defaultFacing,
                price: defaultPrice,
                status: defaultStatus,
                description: '',
            },
        ]);
    }

    async function handleBulkSubmit() {
        if (draftFlats.length === 0) {
            setError('Please generate or add at least one flat to upload.');
            return;
        }

        // Validate
        for (const f of draftFlats) {
            if (!f.flat_number.trim()) {
                setError('All flats must have a unit number.');
                return;
            }
            if (!f.area || parseFloat(f.area) <= 0) {
                setError(`Flat ${f.flat_number} must have a valid area.`);
                return;
            }
            if (!f.price || parseFloat(f.price) <= 0) {
                setError(`Flat ${f.flat_number} must have a valid price.`);
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                flats: draftFlats.map((df) => ({
                    flat_number: df.flat_number.trim(),
                    floor_number: Number(df.floor_number) || 1,
                    type: df.type,
                    area: df.area.toString(),
                    facing: df.facing,
                    price: df.price.toString(),
                    status: df.status,
                    description: df.description.trim(),
                })),
            };

            const res = await apiFetch(ENDPOINTS.apartmentFlatsBulkCreate(apartmentId), {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            onSuccess(Array.isArray(res) ? res : []);
            onClose();
        } catch (err: any) {
            console.error('Failed to bulk create flats:', err);
            setError(err.message || 'Failed to create flats in bulk. Please check for duplicate unit numbers.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-5xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-6">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/90">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Bulk Flat Generator</h3>
                            <p className="text-xs text-gray-400">
                                {apartmentName ? `Generate multiple units for ${apartmentName}` : 'Create multiple flats across floors in one click'}
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

                <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
                            <AlertCircle size={16} className="shrink-0 text-rose-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Generator Configuration Panel */}
                    <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Home size={14} className="text-purple-400" />
                                Floor & Unit Template
                            </h4>
                            <span className="text-[11px] text-gray-400">
                                Total will be: <strong className="text-purple-400">{Math.max(0, endFloor - startFloor + 1) * flatsPerFloor}</strong> flats
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Start Floor</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={startFloor}
                                    onChange={(e) => setStartFloor(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">End Floor</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={endFloor}
                                    onChange={(e) => setEndFloor(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Flats per Floor</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={flatsPerFloor}
                                    onChange={(e) => setFlatsPerFloor(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Default Type</label>
                                <select
                                    value={defaultType}
                                    onChange={(e) => setDefaultType(e.target.value as FlatType)}
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                >
                                    {FLAT_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Default Area (sq.ft)</label>
                                <input
                                    type="number"
                                    value={defaultArea}
                                    onChange={(e) => setDefaultArea(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Default Facing</label>
                                <select
                                    value={defaultFacing}
                                    onChange={(e) => setDefaultFacing(e.target.value as FlatFacing)}
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                >
                                    {FLAT_FACINGS.map((f) => (
                                        <option key={f.value} value={f.value}>
                                            {f.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Default Price (₹)</label>
                                <input
                                    type="number"
                                    value={defaultPrice}
                                    onChange={(e) => setDefaultPrice(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Default Status</label>
                                <select
                                    value={defaultStatus}
                                    onChange={(e) => setDefaultStatus(e.target.value as FlatStatus)}
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                >
                                    {FLAT_STATUSES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={handleGenerate}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition cursor-pointer"
                            >
                                <Sparkles size={14} />
                                Generate Preview Rows
                            </button>
                        </div>
                    </div>

                    {/* Preview Table */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                                Generated Flats ({draftFlats.length})
                            </h4>
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded bg-blue-950/40 border border-blue-900/60 transition cursor-pointer"
                            >
                                <Plus size={12} />
                                Add Custom Row
                            </button>
                        </div>

                        {draftFlats.length === 0 ? (
                            <div className="py-12 border border-dashed border-gray-800 rounded-xl text-center bg-gray-950/40 text-gray-500 text-xs">
                                Click "Generate Preview Rows" above to create flat units.
                            </div>
                        ) : (
                            <div className="border border-gray-800 rounded-xl overflow-x-auto max-h-[360px] bg-gray-950">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="bg-gray-900/90 text-gray-400 sticky top-0 z-10 border-b border-gray-800">
                                        <tr>
                                            <th className="py-2.5 px-3">#</th>
                                            <th className="py-2.5 px-3">Unit</th>
                                            <th className="py-2.5 px-3">Floor</th>
                                            <th className="py-2.5 px-3">Type</th>
                                            <th className="py-2.5 px-3">Area (sqft)</th>
                                            <th className="py-2.5 px-3">Facing</th>
                                            <th className="py-2.5 px-3">Price</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-2 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/60">
                                        {draftFlats.map((flat, idx) => (
                                            <tr key={idx} className="hover:bg-gray-900/50">
                                                <td className="py-2 px-3 text-gray-500 font-mono text-[11px]">{idx + 1}</td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="text"
                                                        value={flat.flat_number}
                                                        onChange={(e) => handleUpdateRow(idx, 'flat_number', e.target.value)}
                                                        className="w-20 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white font-medium"
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="number"
                                                        value={flat.floor_number}
                                                        onChange={(e) => handleUpdateRow(idx, 'floor_number', parseInt(e.target.value) || 0)}
                                                        className="w-14 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white"
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <select
                                                        value={flat.type}
                                                        onChange={(e) => handleUpdateRow(idx, 'type', e.target.value as FlatType)}
                                                        className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white"
                                                    >
                                                        {FLAT_TYPES.map((t) => (
                                                            <option key={t.value} value={t.value}>
                                                                {t.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="number"
                                                        value={flat.area}
                                                        onChange={(e) => handleUpdateRow(idx, 'area', e.target.value)}
                                                        className="w-20 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white"
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <select
                                                        value={flat.facing}
                                                        onChange={(e) => handleUpdateRow(idx, 'facing', e.target.value as FlatFacing)}
                                                        className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white"
                                                    >
                                                        {FLAT_FACINGS.map((f) => (
                                                            <option key={f.value} value={f.value}>
                                                                {f.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            value={flat.price}
                                                            onChange={(e) => handleUpdateRow(idx, 'price', e.target.value)}
                                                            className="w-24 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white"
                                                        />
                                                        <span className="text-[10px] text-gray-500">
                                                            {formatPrice(flat.price)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <select
                                                        value={flat.status}
                                                        onChange={(e) => handleUpdateRow(idx, 'status', e.target.value as FlatStatus)}
                                                        className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white"
                                                    >
                                                        {FLAT_STATUSES.map((s) => (
                                                            <option key={s.value} value={s.value}>
                                                                {s.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRow(idx)}
                                                        className="p-1 text-gray-500 hover:text-rose-400 rounded hover:bg-rose-950/40 transition"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900/90">
                    <span className="text-xs text-gray-400">
                        Ready to upload: <strong className="text-white">{draftFlats.length}</strong> flats
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkSubmit}
                            disabled={isSubmitting || draftFlats.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Uploading Flats...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span>Create All {draftFlats.length} Flats</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
