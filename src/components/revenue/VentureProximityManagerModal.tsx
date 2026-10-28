import React, { useState, useEffect } from 'react';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import type { VentureProximityPoint, ProximityCategoryType } from '../../types/revenue';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import {
    MapPin,
    Navigation,
    Train,
    Plane,
    Building,
    Plus,
    X,
    Clock,
    Trash2,
    Hospital,
    GraduationCap,
    Compass,
} from 'lucide-react';

interface Props {
    slug: string;
    ventureName: string;
    canEdit?: boolean;
    onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    TRANSIT_HUB: Navigation,
    COMMERCIAL_ZONE: Building,
    PUBLIC_AMENITY: MapPin,
    AIRPORT: Plane,
    RAILWAY_STATION: Train,
    METRO_STATION: Train,
    HIGHWAY: Navigation,
    IT_CORRIDOR: Building,
    HOSPITAL: Hospital,
    SCHOOL: GraduationCap,
};

export default function VentureProximityManagerModal({ slug, ventureName, canEdit = false, onClose }: Props) {
    const [points, setPoints] = useState<VentureProximityPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        category: 'TRANSIT_HUB' as ProximityCategoryType,
        distance_km: '',
        travel_time_mins: 10,
        notes: '',
    });

    const fetchPoints = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch(ENDPOINTS.ventureProximity(slug));
            setPoints(Array.isArray(data) ? data : data?.results || []);
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to fetch proximity points.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, [slug]);

    const handleAddPoint = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const created = await apiFetch(ENDPOINTS.ventureProximity(slug), {
                method: 'POST',
                body: JSON.stringify({
                    name: form.name,
                    category: form.category,
                    distance_km: parseFloat(form.distance_km),
                    travel_time_mins: Number(form.travel_time_mins),
                    notes: form.notes,
                }),
            });
            setPoints(prev => [...prev, created].sort((a, b) => Number(a.distance_km) - Number(b.distance_km)));
            setShowAddForm(false);
            setForm({
                name: '',
                category: 'TRANSIT_HUB',
                distance_km: '',
                travel_time_mins: 10,
                notes: '',
            });
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to add proximity point.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-5 pb-3 border-b border-gray-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                <Compass size={20} />
                            </span>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                Proximity & Infrastructure Analytics
                            </h2>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Location intelligence mapping distance to key transit hubs and landmarks for{' '}
                            <strong className="text-gray-200">{ventureName}</strong>.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                        <X size={16} />
                    </button>
                </div>

                {error && (
                    <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                        {error}
                    </div>
                )}

                {/* Actions */}
                {canEdit && !showAddForm && (
                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                        >
                            <Plus size={13} />
                            Add Proximity Point
                        </button>
                    </div>
                )}

                {/* Add Form */}
                {showAddForm && (
                    <form onSubmit={handleAddPoint} className="bg-gray-950 p-4 rounded-2xl border border-gray-800 mb-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">Add Infrastructure / Transit Landmark</span>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="text-gray-400 hover:text-white text-xs"
                            >
                                Cancel
                            </button>
                        </div>

                        <div>
                            <label className="block text-[11px] text-gray-400 mb-1">Landmark Name</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Rajiv Gandhi International Airport / Outer Ring Road"
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value as ProximityCategoryType })}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-2 py-2 text-xs text-white"
                                >
                                    <option value="TRANSIT_HUB">Transit Hub</option>
                                    <option value="METRO_STATION">Metro Station</option>
                                    <option value="RAILWAY_STATION">Railway Station</option>
                                    <option value="AIRPORT">Airport</option>
                                    <option value="HIGHWAY">Highway / Expressway</option>
                                    <option value="IT_CORRIDOR">IT Corridor</option>
                                    <option value="COMMERCIAL_ZONE">Commercial Zone</option>
                                    <option value="HOSPITAL">Hospital</option>
                                    <option value="SCHOOL">School / College</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Distance (km)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={form.distance_km}
                                    onChange={e => setForm({ ...form, distance_km: e.target.value })}
                                    placeholder="e.g. 4.5"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Drive Time (mins)</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={form.travel_time_mins}
                                    onChange={e => setForm({ ...form, travel_time_mins: Number(e.target.value) })}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                            {submitting ? 'Adding…' : 'Save Proximity Point'}
                        </button>
                    </form>
                )}

                {/* Points List */}
                {loading ? (
                    <div className="py-12 text-center text-xs text-gray-500">Loading infrastructure points…</div>
                ) : points.length === 0 ? (
                    <div className="text-center py-12 bg-gray-950/40 rounded-2xl border border-gray-800">
                        <MapPin size={28} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-xs text-gray-400">No proximity points added yet.</p>
                        {canEdit && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="mt-2 text-xs text-blue-400 hover:underline"
                            >
                                Add your first key landmark
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {points.map(pt => {
                            const Icon = CATEGORY_ICONS[pt.category] || MapPin;
                            return (
                                <div
                                    key={pt.id}
                                    className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3.5 flex items-center justify-between hover:border-gray-700 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                                            <Icon size={16} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">{pt.name}</span>
                                                <span className="text-[10px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                                                    {pt.category_display || pt.category.replace('_', ' ')}
                                                </span>
                                            </div>
                                            {pt.notes && <p className="text-[11px] text-gray-500">{pt.notes}</p>}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-bold text-emerald-400">
                                            {pt.distance_km} km
                                        </div>
                                        <div className="text-[11px] text-gray-400 flex items-center gap-1 justify-end">
                                            <Clock size={10} />
                                            {pt.travel_time_mins} mins
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
