import React, { useState, useEffect } from 'react';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import type { BuilderVentureAnalyticsResponse } from '../../types/revenue';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import {
    BarChart3,
    Eye,
    Users,
    MessageSquare,
    CheckCircle2,
    Clock,
    X,
    RefreshCw,
    Lock,
    Phone,
    Mail,
    Building2,
    TrendingUp,
} from 'lucide-react';

interface Props {
    slug: string;
    ventureName: string;
    onClose: () => void;
}

export default function BuilderVentureAnalyticsModal({ slug, ventureName, onClose }: Props) {
    const [analytics, setAnalytics] = useState<BuilderVentureAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch(ENDPOINTS.builderVentureAnalytics(slug));
            setAnalytics(data);
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to fetch venture analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [slug]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-gray-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                <BarChart3 size={20} />
                            </span>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                Buyer Analytics & Visitor Insights
                            </h2>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Actionable prospective buyer metrics and engagement logs for{' '}
                            <strong className="text-gray-200">{ventureName}</strong>.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchAnalytics}
                            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
                            title="Refresh analytics"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 mb-6 rounded-2xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={fetchAnalytics} className="underline font-semibold ml-2">
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="py-20 text-center text-gray-500 text-xs">
                        Loading buyer intelligence data…
                    </div>
                ) : analytics ? (
                    <div className="space-y-6">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3.5">
                                <div className="flex items-center gap-1.5 text-blue-400 text-xs mb-1">
                                    <Eye size={13} />
                                    <span>Venture Views</span>
                                </div>
                                <p className="text-xl font-black text-white">
                                    {analytics.metrics.total_views}
                                </p>
                            </div>

                            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3.5">
                                <div className="flex items-center gap-1.5 text-indigo-400 text-xs mb-1">
                                    <Building2 size={13} />
                                    <span>Plot Views</span>
                                </div>
                                <p className="text-xl font-black text-white">
                                    {analytics.metrics.plot_views}
                                </p>
                            </div>

                            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3.5">
                                <div className="flex items-center gap-1.5 text-purple-400 text-xs mb-1">
                                    <Users size={13} />
                                    <span>Unique Visitors</span>
                                </div>
                                <p className="text-xl font-black text-white">
                                    {analytics.metrics.unique_visitors}
                                </p>
                            </div>

                            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3.5">
                                <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1">
                                    <MessageSquare size={13} />
                                    <span>Inquiries</span>
                                </div>
                                <p className="text-xl font-black text-white">
                                    {analytics.metrics.total_inquiries}
                                </p>
                            </div>

                            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3.5">
                                <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-1">
                                    <Clock size={13} />
                                    <span>Active Holds</span>
                                </div>
                                <p className="text-xl font-black text-white">
                                    {analytics.metrics.active_holds}
                                </p>
                            </div>

                            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3.5">
                                <div className="flex items-center gap-1.5 text-teal-400 text-xs mb-1">
                                    <TrendingUp size={13} />
                                    <span>Converted</span>
                                </div>
                                <p className="text-xl font-black text-emerald-400">
                                    {analytics.metrics.converted_sales}
                                </p>
                            </div>
                        </div>

                        {/* Prospective Buyer Leads */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Users size={15} className="text-blue-400" />
                                    Prospective Buyer Inquiries ({analytics.prospective_buyers.length})
                                </h3>
                                <span className="text-[11px] text-gray-500">
                                    Real-time buyer intent pipeline
                                </span>
                            </div>

                            {analytics.prospective_buyers.length === 0 ? (
                                <div className="p-8 bg-gray-950/40 rounded-2xl border border-gray-800 text-center text-xs text-gray-500">
                                    No customer inquiries logged yet for this venture.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {analytics.prospective_buyers.map(lead => (
                                        <div
                                            key={lead.query_id}
                                            className="bg-gray-950/90 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="font-bold text-sm text-white">
                                                        {lead.customer_name}
                                                    </span>
                                                    {lead.is_contact_masked && (
                                                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-gray-800 text-amber-400 px-2 py-0.5 rounded-full border border-gray-700">
                                                            <Lock size={10} />
                                                            Shielded by Buyer
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
                                                        {lead.status}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={12} className="text-gray-500" />
                                                        {lead.customer_phone}
                                                    </span>
                                                    {lead.customer_email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail size={12} className="text-gray-500" />
                                                            {lead.customer_email}
                                                        </span>
                                                    )}
                                                    {lead.preferred_call_time && (
                                                        <span className="text-gray-500 text-[11px]">
                                                            Prefers: {lead.preferred_call_time}
                                                        </span>
                                                    )}
                                                </div>

                                                {lead.message && (
                                                    <p className="text-xs text-gray-400 italic bg-gray-900/60 p-2 rounded-xl mt-1">
                                                        "{lead.message}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="shrink-0 text-[11px] text-gray-500 text-right">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
