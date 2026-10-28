import React, { useState, useEffect } from 'react';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import type { BuilderVerification } from '../../types/revenue';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import { ShieldCheck, Shield, CheckCircle2, Clock, X, ExternalLink, Award } from 'lucide-react';

interface Props {
    onClose: () => void;
    onSuccess?: () => void;
}

export default function BuilderVerificationModal({ onClose, onSuccess }: Props) {
    const [existingVerifications, setExistingVerifications] = useState<BuilderVerification[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        company_name: '',
        license_number: '',
        rera_number: '',
        document_url: '',
    });

    const fetchMyVerifications = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch(ENDPOINTS.builderVerification);
            setExistingVerifications(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to check verification status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyVerifications();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await apiFetch(ENDPOINTS.builderVerification, {
                method: 'POST',
                body: JSON.stringify(form),
            });
            await fetchMyVerifications();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to submit verification request.');
        } finally {
            setSubmitting(false);
        }
    };

    const latest = existingVerifications[0];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                Lifetime Developer Verification Badge
                            </h2>
                            <p className="text-xs text-gray-400">
                                Official accreditation to build credibility, trust, and brand presence.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                        <X size={16} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-xs text-gray-500">Checking credentials…</div>
                ) : latest && latest.status === 'APPROVED' ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Award size={36} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Lifetime Verified Developer</h3>
                            <p className="text-xs text-emerald-400 font-semibold mt-1">
                                Badge Active • Verified on Platform
                            </p>
                            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
                                Your venture showcases feature the official verification shield badge, ranking preference, and unlimited uploads.
                            </p>
                        </div>
                        <div className="p-3 bg-gray-950 rounded-xl text-xs text-left text-gray-400 border border-gray-800 space-y-1">
                            <div>Company: <strong className="text-gray-200">{latest.company_name}</strong></div>
                            {latest.rera_number && <div>RERA: <strong className="text-gray-200">{latest.rera_number}</strong></div>}
                            <div>Accredited: <strong className="text-gray-200">{new Date(latest.updated_at).toLocaleDateString()}</strong></div>
                        </div>
                    </div>
                ) : latest && latest.status === 'PENDING' ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Clock size={32} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Application Under Review</h3>
                            <p className="text-xs text-amber-400 font-semibold mt-1">
                                Pending Super Admin Approval
                            </p>
                            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
                                Your accreditation documents and fee payment (₹{Number(latest.fee_paid).toLocaleString('en-IN')}) are currently being verified by our compliance team.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div>
                        {error && (
                            <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">
                                    Company / Developer Entity Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.company_name}
                                    onChange={e => setForm({ ...form, company_name: e.target.value })}
                                    placeholder="e.g. Prestige Estate Developers Pvt Ltd"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                                        RERA Number
                                    </label>
                                    <input
                                        type="text"
                                        value={form.rera_number}
                                        onChange={e => setForm({ ...form, rera_number: e.target.value })}
                                        placeholder="P0240000000"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                                        Trade License #
                                    </label>
                                    <input
                                        type="text"
                                        value={form.license_number}
                                        onChange={e => setForm({ ...form, license_number: e.target.value })}
                                        placeholder="LIC-98421"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">
                                    Accreditation Document / Certificate Link
                                </label>
                                <input
                                    type="url"
                                    value={form.document_url}
                                    onChange={e => setForm({ ...form, document_url: e.target.value })}
                                    placeholder="https://drive.google.com/… or https://example.com/rera.pdf"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs text-amber-300">
                                <div className="flex justify-between font-bold">
                                    <span>One-Time Lifetime Badge Fee:</span>
                                    <span>₹15,000</span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Permanent golden badge displayed on all ventures and search results. Includes unlimited portfolio uploads.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
                                >
                                    {submitting ? 'Submitting…' : 'Apply & Verify Badge'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
