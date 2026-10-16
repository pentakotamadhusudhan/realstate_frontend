import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import AdminNavbar from '../../components/admin/AdminNavbar';
import ApiErrorAlert from '../../components/alter_box/ApiErrorAlert';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import {
    CheckCircle2,
    Clock,
    Building2,
    MapPin,
    Layers,
    User,
    Check,
    Eye,
    RefreshCw,
    Search,
    Shield,
    Sparkles,
    ArrowRight,
    ExternalLink,
    AlertCircle,
    Calendar,
    ChevronRight,
    BadgeCheck
} from 'lucide-react';

export interface VentureItem {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    pincode?: string;
    center_latitude: string | number;
    center_longitude: string | number;
    total_plots: number;
    available_plots: number;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
    created_at: string;
    created_by_name?: string;
    created_by_email?: string;
    amenities?: string[];
    description?: string;
}

export default function AdminPlotApprovalsPage() {
    const navigate = useNavigate();
    const [pendingVentures, setPendingVentures] = useState<VentureItem[]>([]);
    const [publishedVentures, setPublishedVentures] = useState<VentureItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingSlug, setApprovingSlug] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'PENDING' | 'PUBLISHED'>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    const fetchVentures = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Fetch pending drafts
            const pendingData = await apiFetch(ENDPOINTS.pendingVentures);
            const pendingList: VentureItem[] = Array.isArray(pendingData)
                ? pendingData
                : pendingData?.results || [];
            setPendingVentures(pendingList);

            // 2. Fetch published ventures
            const publishedData = await apiFetch(`${ENDPOINTS.ventures}?status=PUBLISHED`);
            const publishedList: VentureItem[] = Array.isArray(publishedData)
                ? publishedData
                : publishedData?.results || [];
            setPublishedVentures(publishedList);
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to load ventures.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVentures();
    }, []);

    // Approve Venture (Drafts to Public)
    const handleApprove = async (venture: VentureItem) => {
        setApprovingSlug(venture.slug);
        setError('');
        try {
            const resp = await apiFetch(ENDPOINTS.approveVenture(venture.slug), {
                method: 'POST',
            });

            setToastMessage({
                type: 'success',
                text: `Venture "${venture.name}" has been approved & published to public!`,
            });
            setTimeout(() => setToastMessage(null), 5000);

            // Move from pending to published list
            setPendingVentures(prev => prev.filter(v => v.slug !== venture.slug));
            setPublishedVentures(prev => [{ ...venture, status: 'PUBLISHED' }, ...prev]);
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || `Failed to approve venture "${venture.name}".`);
        } finally {
            setApprovingSlug(null);
        }
    };

    const currentList = activeTab === 'PENDING' ? pendingVentures : publishedVentures;

    const filteredList = currentList.filter(v => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            v.name?.toLowerCase().includes(q) ||
            v.city?.toLowerCase().includes(q) ||
            v.state?.toLowerCase().includes(q) ||
            v.created_by_name?.toLowerCase().includes(q) ||
            v.created_by_email?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            <AdminNavbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                                <Shield size={12} />
                                Super Admin Review
                            </span>
                            <span className="text-gray-500 text-xs">•</span>
                            <span className="text-gray-400 text-xs">Quality Assurance & Public Releases</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            Plot & Venture Approvals
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                            Review draft layouts uploaded by agents and approve them to public availability.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fetchVentures}
                            disabled={loading}
                            className="px-3.5 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-400' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Toast Notification */}
                {toastMessage && (
                    <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2 ${
                        toastMessage.type === 'success'
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                            : 'bg-rose-950/80 border-rose-800 text-rose-200'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                            <span>{toastMessage.text}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setToastMessage(null)}
                            className="text-gray-400 hover:text-white text-xs font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <ApiErrorAlert
                        message={error}
                        onRetry={fetchVentures}
                        onClose={() => setError('')}
                    />
                )}

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-900/60 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                                Drafts Pending Approval
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                                <Clock size={16} />
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold text-white">
                            {pendingVentures.length}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Awaiting verification to be published publicly
                        </p>
                    </div>

                    <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                Public Live Ventures
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold text-white">
                            {publishedVentures.length}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Active and publicly searchable ventures
                        </p>
                    </div>

                    <div className="bg-gray-900/60 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                                Pending Plots Total
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                                <Layers size={16} />
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold text-white">
                            {pendingVentures.reduce((acc, v) => acc + (v.total_plots || 0), 0)}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Plots ready for release upon approval
                        </p>
                    </div>

                    <div className="bg-gray-900/60 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                                Publishing Status
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                <BadgeCheck size={16} />
                            </div>
                        </div>
                        <div className="text-base font-bold text-white mt-1">
                            Super Admin Privileged
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Drafts transition to public in one click
                        </p>
                    </div>
                </div>

                {/* Tabs & Search Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/40 p-2 rounded-2xl border border-gray-800">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('PENDING')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeTab === 'PENDING'
                                    ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                            }`}
                        >
                            <Clock size={14} />
                            Pending Drafts
                            {pendingVentures.length > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                    activeTab === 'PENDING'
                                        ? 'bg-gray-950 text-amber-400'
                                        : 'bg-amber-500 text-gray-950'
                                }`}>
                                    {pendingVentures.length}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('PUBLISHED')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeTab === 'PUBLISHED'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                            }`}
                        >
                            <CheckCircle2 size={14} />
                            Public Live ({publishedVentures.length})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search size={14} className="absolute left-3.5 top-3 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, city, agent..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* Ventures List */}
                <div className="space-y-4">
                    {loading && (
                        <div className="p-12 text-center text-gray-400 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-3" />
                            <p className="text-sm">Fetching pending approval submissions...</p>
                        </div>
                    )}

                    {!loading && filteredList.length === 0 && (
                        <div className="p-12 text-center bg-gray-900/30 rounded-2xl border border-gray-800/80">
                            <div className="w-12 h-12 rounded-2xl bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-3">
                                {activeTab === 'PENDING' ? <CheckCircle2 size={24} className="text-emerald-400" /> : <Building2 size={24} />}
                            </div>
                            <h3 className="text-base font-bold text-white mb-1">
                                {activeTab === 'PENDING'
                                    ? 'All Clear! No Pending Drafts'
                                    : 'No Published Ventures Found'}
                            </h3>
                            <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                {activeTab === 'PENDING'
                                    ? 'All submitted ventures and plots have been approved or there are no new submissions from agents.'
                                    : 'Published ventures will appear here once approved.'}
                            </p>
                        </div>
                    )}

                    {!loading && filteredList.map((venture) => {
                        const isApproving = approvingSlug === venture.slug;
                        const isPending = venture.status === 'DRAFT';

                        return (
                            <div
                                key={venture.id || venture.slug}
                                className={`bg-gray-900/70 border rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-gray-700 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm ${
                                    isPending
                                        ? 'border-amber-500/20 hover:border-amber-500/40'
                                        : 'border-gray-800 hover:border-gray-700'
                                }`}
                            >
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h3 className="text-lg font-bold text-white tracking-tight">
                                            {venture.name}
                                        </h3>

                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                                            isPending
                                                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                        }`}>
                                            {isPending ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                                            {isPending ? 'Draft / Pending Approval' : 'Public / Published'}
                                        </span>

                                        <span className="text-gray-500 text-xs font-mono">
                                            slug: {venture.slug}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-400 pt-1">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-rose-400 shrink-0" />
                                            <span>
                                                {venture.city}, {venture.state}
                                                {venture.pincode ? ` (${venture.pincode})` : ''}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Layers size={14} className="text-blue-400 shrink-0" />
                                            <span>
                                                Total Plots: <strong className="text-white">{venture.total_plots || 0}</strong>
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-emerald-400 shrink-0" />
                                            <span>
                                                Submitted: {venture.created_at ? new Date(venture.created_at).toLocaleDateString() : 'Recent'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Creator & Amenities */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                                        {venture.created_by_name && (
                                            <span className="inline-flex items-center gap-1 bg-gray-800/80 text-gray-300 px-2 py-0.5 rounded-md border border-gray-700/60">
                                                <User size={12} className="text-indigo-400" />
                                                Agent: <strong className="text-white">{venture.created_by_name}</strong>
                                                {venture.created_by_email && (
                                                    <span className="text-gray-400">({venture.created_by_email})</span>
                                                )}
                                            </span>
                                        )}

                                        {venture.amenities && venture.amenities.length > 0 && (
                                            venture.amenities.slice(0, 3).map((amenity, idx) => (
                                                <span
                                                    key={idx}
                                                    className="bg-gray-950 px-2 py-0.5 rounded text-[11px] text-gray-400 border border-gray-800"
                                                >
                                                    {amenity}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-800/60">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            sessionStorage.setItem('selected_venture', JSON.stringify(venture));
                                            navigate(`/admin/ventures/${venture.slug}/plots`);
                                        }}
                                        className="px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                                    >
                                        <Eye size={14} />
                                        Inspect Plots
                                    </button>

                                    {isPending ? (
                                        <button
                                            type="button"
                                            disabled={isApproving}
                                            onClick={() => handleApprove(venture)}
                                            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                                        >
                                            {isApproving ? (
                                                <>
                                                    <RefreshCw size={14} className="animate-spin" />
                                                    Approving...
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={14} />
                                                    Approve to Public
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs font-medium">
                                            <CheckCircle2 size={14} />
                                            Live on Portal
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
