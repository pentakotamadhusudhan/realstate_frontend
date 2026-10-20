import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import AdminNavbar from '../../components/admin/AdminNavbar';
import ApiErrorAlert from '../../components/alter_box/ApiErrorAlert';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import type { AdBanner, AdBannerFormData } from '../../types/adBanner';
import {
    Image as ImageIcon,
    PlusCircle,
    Search,
    RefreshCw,
    ExternalLink,
    Edit3,
    Trash2,
    Calendar,
    Clock,
    Sparkles,
    CheckCircle2,
    XCircle,
    AlertCircle,
    TrendingUp,
    LayoutGrid,
    List,
    X,
    Eye,
    ChevronUp,
    ChevronDown,
    SlidersHorizontal,
    Copy,
    Check
} from 'lucide-react';

const AD_TYPE_PRESETS = [
    'HERO_BANNER',
    'POPUP_MODAL',
    'SIDEBAR_PROMO',
    'TOP_NOTIFICATION',
    'VENTURE_FEATURED',
    'FOOTER_STRIP'
];

const SAMPLE_BANNERS = [
    {
        label: 'Luxury Villa Plots',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        target: 'https://plotvista.com/ventures',
        type: 'HERO_BANNER'
    },
    {
        label: 'Prime Commercial Gated Community',
        url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        target: 'https://plotvista.com/ventures',
        type: 'VENTURE_FEATURED'
    },
    {
        label: 'Festival Plot Discount Promo',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        target: 'https://plotvista.com/ventures',
        type: 'POPUP_MODAL'
    }
];

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<AdBanner[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'RANK_DESC' | 'RANK_ASC' | 'NEWEST' | 'EXPIRING_SOON'>('RANK_DESC');
    const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<AdBanner | null>(null);
    const [previewingBanner, setPreviewingBanner] = useState<AdBanner | null>(null);
    const [deletingBanner, setDeletingBanner] = useState<AdBanner | null>(null);

    // Form state
    const [formData, setFormData] = useState<AdBannerFormData>({
        ad_type: 'HERO_BANNER',
        banner_url: '',
        target_url: '',
        end_date: '',
        ranking: 0,
        is_active: true
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | number | null>(null);

    // Track active endpoint (standard vs auth fallback)
    const [useAuthPrefix, setUseAuthPrefix] = useState(false);

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    // Set default end_date to 30 days from now for new banners
    const getDefaultEndDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 16);
    };

    const fetchBanners = async () => {
        setLoading(true);
        setError('');
        try {
            let data: any;
            try {
                // Try standard endpoint first
                const url = useAuthPrefix ? ENDPOINTS.authAdBanners() : ENDPOINTS.adBanners();
                data = await apiFetch(url);
            } catch (primaryErr: any) {
                // If 404, fallback to alternate prefix
                if (primaryErr?.status === 404) {
                    const fallbackUrl = useAuthPrefix ? ENDPOINTS.adBanners() : ENDPOINTS.authAdBanners();
                    data = await apiFetch(fallbackUrl);
                    setUseAuthPrefix(!useAuthPrefix);
                } else {
                    throw primaryErr;
                }
            }

            const list: AdBanner[] = Array.isArray(data)
                ? data
                : data?.results || [];

            setBanners(list);
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to fetch ad banners.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ type, text });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUrl(text);
        setTimeout(() => setCopiedUrl(null), 2000);
        showToast('URL copied to clipboard!');
    };

    // Quick End Date setters
    const addDaysToEndDate = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setFormData(prev => ({ ...prev, end_date: d.toISOString().slice(0, 16) }));
    };

    // Open Create Modal
    const handleOpenCreate = () => {
        setFormData({
            ad_type: 'HERO_BANNER',
            banner_url: '',
            target_url: '',
            end_date: getDefaultEndDate(),
            ranking: 0,
            is_active: true
        });
        setFormError('');
        setShowCreateModal(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (banner: AdBanner) => {
        setEditingBanner(banner);
        // Format ISO date string for datetime-local input
        let formattedEndDate = '';
        if (banner.end_date) {
            try {
                formattedEndDate = new Date(banner.end_date).toISOString().slice(0, 16);
            } catch {
                formattedEndDate = banner.end_date.slice(0, 16);
            }
        }
        setFormData({
            ad_type: banner.ad_type || 'HERO_BANNER',
            banner_url: banner.banner_url || '',
            target_url: banner.target_url || '',
            end_date: formattedEndDate,
            ranking: banner.ranking || 0,
            is_active: Boolean(banner.is_active)
        });
        setFormError('');
    };

    // Submit Create (POST)
    const handleCreateBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.banner_url.trim()) {
            setFormError('Banner image URL is required.');
            return;
        }
        if (!formData.target_url.trim()) {
            setFormError('Target destination URL is required.');
            return;
        }
        if (!formData.end_date) {
            setFormError('End date is required.');
            return;
        }

        setSubmitting(true);
        setFormError('');

        const payload = {
            ad_type: formData.ad_type.trim(),
            banner_url: formData.banner_url.trim(),
            target_url: formData.target_url.trim(),
            end_date: new Date(formData.end_date).toISOString(),
            ranking: Number(formData.ranking) || 0,
            is_active: formData.is_active
        };

        try {
            let res: any;
            try {
                const url = useAuthPrefix ? ENDPOINTS.authAdBanners() : ENDPOINTS.adBanners();
                res = await apiFetch(url, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            } catch (err: any) {
                if (err?.status === 404) {
                    const fallbackUrl = useAuthPrefix ? ENDPOINTS.adBanners() : ENDPOINTS.authAdBanners();
                    res = await apiFetch(fallbackUrl, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    setUseAuthPrefix(!useAuthPrefix);
                } else {
                    throw err;
                }
            }

            setBanners(prev => [res, ...prev]);
            setShowCreateModal(false);
            showToast('Ad banner published successfully!');
        } catch (err: any) {
            setFormError(formatApiErrorMessage(err) || 'Failed to create ad banner.');
        } finally {
            setSubmitting(false);
        }
    };

    // Submit Update (PATCH/PUT)
    const handleUpdateBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBanner) return;

        if (!formData.banner_url.trim()) {
            setFormError('Banner image URL is required.');
            return;
        }
        if (!formData.target_url.trim()) {
            setFormError('Target destination URL is required.');
            return;
        }
        if (!formData.end_date) {
            setFormError('End date is required.');
            return;
        }

        setSubmitting(true);
        setFormError('');

        const payload = {
            ad_type: formData.ad_type.trim(),
            banner_url: formData.banner_url.trim(),
            target_url: formData.target_url.trim(),
            end_date: new Date(formData.end_date).toISOString(),
            ranking: Number(formData.ranking) || 0,
            is_active: formData.is_active
        };

        try {
            let res: any;
            try {
                const url = useAuthPrefix
                    ? ENDPOINTS.authAdBannerDetail(editingBanner.id)
                    : ENDPOINTS.adBannerDetail(editingBanner.id);
                res = await apiFetch(url, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
            } catch (err: any) {
                if (err?.status === 404) {
                    const fallbackUrl = useAuthPrefix
                        ? ENDPOINTS.adBannerDetail(editingBanner.id)
                        : ENDPOINTS.authAdBannerDetail(editingBanner.id);
                    res = await apiFetch(fallbackUrl, {
                        method: 'PATCH',
                        body: JSON.stringify(payload)
                    });
                    setUseAuthPrefix(!useAuthPrefix);
                } else {
                    throw err;
                }
            }

            setBanners(prev => prev.map(b => (b.id === editingBanner.id ? { ...b, ...res } : b)));
            setEditingBanner(null);
            showToast('Ad banner updated successfully!');
        } catch (err: any) {
            setFormError(formatApiErrorMessage(err) || 'Failed to update ad banner.');
        } finally {
            setSubmitting(false);
        }
    };

    // Quick Toggle is_active
    const handleToggleActive = async (banner: AdBanner) => {
        const newStatus = !banner.is_active;
        setTogglingId(banner.id);

        try {
            const url = useAuthPrefix
                ? ENDPOINTS.authAdBannerDetail(banner.id)
                : ENDPOINTS.adBannerDetail(banner.id);

            const res = await apiFetch(url, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: newStatus })
            });

            setBanners(prev =>
                prev.map(b => (b.id === banner.id ? { ...b, is_active: res.is_active !== undefined ? res.is_active : newStatus } : b))
            );
            showToast(`Banner ${newStatus ? 'activated' : 'deactivated'}!`);
        } catch (err: any) {
            showToast(formatApiErrorMessage(err) || 'Failed to change status.', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    // Quick adjust ranking
    const handleAdjustRanking = async (banner: AdBanner, delta: number) => {
        const newRank = Math.max(0, (banner.ranking || 0) + delta);
        try {
            const url = useAuthPrefix
                ? ENDPOINTS.authAdBannerDetail(banner.id)
                : ENDPOINTS.adBannerDetail(banner.id);

            await apiFetch(url, {
                method: 'PATCH',
                body: JSON.stringify({ ranking: newRank })
            });

            setBanners(prev =>
                prev.map(b => (b.id === banner.id ? { ...b, ranking: newRank } : b))
            );
        } catch (err: any) {
            showToast(formatApiErrorMessage(err) || 'Failed to adjust ranking.', 'error');
        }
    };

    // Delete Banner
    const handleDeleteBanner = async () => {
        if (!deletingBanner) return;
        setSubmitting(true);

        try {
            const url = useAuthPrefix
                ? ENDPOINTS.authAdBannerDetail(deletingBanner.id)
                : ENDPOINTS.adBannerDetail(deletingBanner.id);

            await apiFetch(url, {
                method: 'DELETE'
            });

            setBanners(prev => prev.filter(b => b.id !== deletingBanner.id));
            setDeletingBanner(null);
            showToast('Banner deleted successfully.');
        } catch (err: any) {
            showToast(formatApiErrorMessage(err) || 'Failed to delete banner.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Check if a banner is expired
    const isBannerExpired = (banner: AdBanner) => {
        if (!banner.end_date) return false;
        return new Date(banner.end_date).getTime() < Date.now();
    };

    // Filter & sort banners
    const filteredBanners = useMemo(() => {
        return banners
            .filter(b => {
                // Status Filter
                const expired = isBannerExpired(b);
                if (statusFilter === 'ACTIVE' && (!b.is_active || expired)) return false;
                if (statusFilter === 'INACTIVE' && (b.is_active || expired)) return false;
                if (statusFilter === 'EXPIRED' && !expired) return false;

                // Type Filter
                if (typeFilter !== 'ALL' && b.ad_type?.toLowerCase() !== typeFilter.toLowerCase()) {
                    return false;
                }

                // Search query
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                    b.ad_type?.toLowerCase().includes(q) ||
                    b.target_url?.toLowerCase().includes(q) ||
                    b.banner_url?.toLowerCase().includes(q) ||
                    String(b.ranking).includes(q)
                );
            })
            .sort((a, b) => {
                if (sortBy === 'RANK_DESC') return (b.ranking || 0) - (a.ranking || 0);
                if (sortBy === 'RANK_ASC') return (a.ranking || 0) - (b.ranking || 0);
                if (sortBy === 'NEWEST') {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return dateB - dateA;
                }
                if (sortBy === 'EXPIRING_SOON') {
                    const dateA = a.end_date ? new Date(a.end_date).getTime() : Infinity;
                    const dateB = b.end_date ? new Date(b.end_date).getTime() : Infinity;
                    return dateA - dateB;
                }
                return 0;
            });
    }, [banners, statusFilter, typeFilter, searchQuery, sortBy]);

    // Unique Ad Types for filter dropdown
    const availableTypes = useMemo(() => {
        const types = new Set<string>();
        banners.forEach(b => {
            if (b.ad_type) types.add(b.ad_type);
        });
        return Array.from(types);
    }, [banners]);

    // Metrics
    const totalCount = banners.length;
    const activeCount = banners.filter(b => b.is_active && !isBannerExpired(b)).length;
    const expiredCount = banners.filter(b => isBannerExpired(b)).length;
    const topRankedCount = banners.filter(b => (b.ranking || 0) > 0).length;

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
            <AdminNavbar />

            {/* Notification Toast */}
            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold border backdrop-blur-md transition-all transform translate-y-0 ${
                        toastMessage.type === 'success'
                            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50'
                            : 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-rose-950/50'
                    }`}
                >
                    {toastMessage.type === 'success' ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    ) : (
                        <AlertCircle size={18} className="text-rose-400 shrink-0" />
                    )}
                    <span>{toastMessage.text}</span>
                    <button
                        onClick={() => setToastMessage(null)}
                        className="text-gray-400 hover:text-white ml-2 cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* ═══════ HEADER & TOP BAR ═══════ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
                            <Sparkles size={14} />
                            Marketing & Promotions
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            Ad Banners Manager
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Create, schedule, prioritize, and manage promotional ad banners across PlotVista portals.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fetchBanners}
                            disabled={loading}
                            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shadow-sm disabled:opacity-50"
                            title="Refresh banners"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-400' : ''} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            <PlusCircle size={16} />
                            Add New Ad Banner
                        </button>
                    </div>
                </div>

                {/* ═══════ METRICS CARDS ═══════ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total */}
                    <div className="bg-gray-900/70 border border-gray-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm backdrop-blur-sm">
                        <div>
                            <div className="text-xs font-medium text-gray-400">Total Banners</div>
                            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">{totalCount}</div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <ImageIcon size={20} />
                        </div>
                    </div>

                    {/* Active */}
                    <div className="bg-gray-900/70 border border-gray-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm backdrop-blur-sm">
                        <div>
                            <div className="text-xs font-medium text-gray-400">Active & Live</div>
                            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">{activeCount}</div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>

                    {/* Expired */}
                    <div className="bg-gray-900/70 border border-gray-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm backdrop-blur-sm">
                        <div>
                            <div className="text-xs font-medium text-gray-400">Expired</div>
                            <div className="text-2xl sm:text-3xl font-bold text-rose-400 mt-1">{expiredCount}</div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                            <Clock size={20} />
                        </div>
                    </div>

                    {/* Ranked */}
                    <div className="bg-gray-900/70 border border-gray-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm backdrop-blur-sm">
                        <div>
                            <div className="text-xs font-medium text-gray-400">Prioritized (Rank &gt; 0)</div>
                            <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">{topRankedCount}</div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>

                {/* ═══════ FILTERS & CONTROLS ═══════ */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by Ad Type, Target URL, or Banner image URL..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Dropdowns & View Mode */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-medium text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">🟢 Active Only</option>
                                <option value="INACTIVE">⚪ Inactive</option>
                                <option value="EXPIRED">🔴 Expired</option>
                            </select>

                            {/* Ad Type Filter */}
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-medium text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="ALL">All Types</option>
                                {availableTypes.map(t => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>

                            {/* Sort Filter */}
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-medium text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="RANK_DESC">Ranking (High → Low)</option>
                                <option value="RANK_ASC">Ranking (Low → High)</option>
                                <option value="NEWEST">Newest Created</option>
                                <option value="EXPIRING_SOON">Expiring Soonest</option>
                            </select>

                            {/* View Switcher */}
                            <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('GRID')}
                                    className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                                        viewMode === 'GRID'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                    title="Grid View"
                                >
                                    <LayoutGrid size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('TABLE')}
                                    className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                                        viewMode === 'TABLE'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                    title="Table View"
                                >
                                    <List size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800/60 text-xs text-gray-400">
                            <span>Active filters:</span>
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 bg-gray-800 text-gray-200 px-2.5 py-0.5 rounded-full text-[11px]">
                                    Query: "{searchQuery}"
                                    <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
                                </span>
                            )}
                            {statusFilter !== 'ALL' && (
                                <span className="inline-flex items-center gap-1 bg-gray-800 text-gray-200 px-2.5 py-0.5 rounded-full text-[11px]">
                                    Status: {statusFilter}
                                    <X size={12} className="cursor-pointer hover:text-white" onClick={() => setStatusFilter('ALL')} />
                                </span>
                            )}
                            {typeFilter !== 'ALL' && (
                                <span className="inline-flex items-center gap-1 bg-gray-800 text-gray-200 px-2.5 py-0.5 rounded-full text-[11px]">
                                    Type: {typeFilter}
                                    <X size={12} className="cursor-pointer hover:text-white" onClick={() => setTypeFilter('ALL')} />
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('ALL');
                                    setTypeFilter('ALL');
                                }}
                                className="text-blue-400 hover:underline ml-1"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* ═══════ CONTENT (GRID OR TABLE) ═══════ */}
                {error && (
                    <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 flex items-center justify-between text-rose-300">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} className="shrink-0 text-rose-400" />
                            <span className="text-xs sm:text-sm">{error}</span>
                        </div>
                        <button
                            onClick={fetchBanners}
                            className="text-xs font-semibold underline hover:text-white shrink-0 ml-4"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
                        <RefreshCw size={32} className="animate-spin text-blue-500" />
                        <span className="text-sm font-medium">Loading ad banners...</span>
                    </div>
                ) : filteredBanners.length === 0 ? (
                    <div className="bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                            <ImageIcon size={30} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">No Ad Banners Found</h3>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">
                                {banners.length === 0
                                    ? 'Get started by creating your first promotional ad banner.'
                                    : 'No banners match your current filters or search query.'}
                            </p>
                        </div>
                        {banners.length === 0 ? (
                            <button
                                type="button"
                                onClick={handleOpenCreate}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
                            >
                                <PlusCircle size={15} />
                                Create Your First Banner
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('ALL');
                                    setTypeFilter('ALL');
                                }}
                                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : viewMode === 'GRID' ? (
                    /* ═══════ GRID VIEW ═══════ */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredBanners.map(banner => {
                            const expired = isBannerExpired(banner);
                            const isToggling = togglingId === banner.id;

                            return (
                                <div
                                    key={banner.id}
                                    className="bg-gray-900/90 border border-gray-800 hover:border-gray-700/80 rounded-2xl overflow-hidden shadow-lg transition-all group flex flex-col justify-between"
                                >
                                    {/* Banner Thumbnail Preview */}
                                    <div className="relative aspect-[16/9] w-full bg-gray-950 overflow-hidden border-b border-gray-800/80">
                                        <img
                                            src={banner.banner_url}
                                            alt={banner.ad_type}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={e => {
                                                // Fallback on broken image link
                                                (e.target as HTMLImageElement).src =
                                                    'https://placehold.co/800x450/1e293b/94a3b8?text=Image+Unavailable';
                                            }}
                                        />

                                        {/* Status Badge overlay */}
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                            {expired ? (
                                                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-rose-950/90 border border-rose-500/50 text-rose-300 backdrop-blur-md">
                                                    Expired
                                                </span>
                                            ) : banner.is_active ? (
                                                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 backdrop-blur-md flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-gray-950/90 border border-gray-700 text-gray-400 backdrop-blur-md">
                                                    Inactive
                                                </span>
                                            )}

                                            <span className="px-2 py-1 text-[10px] font-bold tracking-wider rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-300 backdrop-blur-md">
                                                {banner.ad_type}
                                            </span>
                                        </div>

                                        {/* Ranking Badge */}
                                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-gray-950/90 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-bold backdrop-blur-md">
                                            <TrendingUp size={12} className="text-amber-400" />
                                            <span>Rank: {banner.ranking || 0}</span>
                                        </div>

                                        {/* Quick preview hover overlay button */}
                                        <button
                                            type="button"
                                            onClick={() => setPreviewingBanner(banner)}
                                            className="absolute bottom-3 right-3 bg-gray-950/85 hover:bg-black text-gray-200 hover:text-white p-2 rounded-xl text-xs font-medium border border-gray-700 backdrop-blur-md transition opacity-0 group-hover:opacity-100 cursor-pointer flex items-center gap-1.5 shadow-md"
                                            title="View Full Preview"
                                        >
                                            <Eye size={14} />
                                            Preview
                                        </button>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            {/* Target URL */}
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400 font-medium">Target Link:</span>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(banner.target_url)}
                                                        className="text-gray-400 hover:text-gray-200 transition"
                                                        title="Copy URL"
                                                    >
                                                        {copiedUrl === banner.target_url ? (
                                                            <Check size={13} className="text-emerald-400" />
                                                        ) : (
                                                            <Copy size={13} />
                                                        )}
                                                    </button>
                                                    <a
                                                        href={banner.target_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-mono text-[11px] truncate max-w-[180px]"
                                                        title={banner.target_url}
                                                    >
                                                        <span className="truncate">{banner.target_url}</span>
                                                        <ExternalLink size={12} className="shrink-0" />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* End Date */}
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400 font-medium flex items-center gap-1">
                                                    <Calendar size={13} />
                                                    End Date:
                                                </span>
                                                <span
                                                    className={`font-semibold ${
                                                        expired ? 'text-rose-400' : 'text-gray-300'
                                                    }`}
                                                >
                                                    {banner.end_date
                                                        ? new Date(banner.end_date).toLocaleString([], {
                                                              year: 'numeric',
                                                              month: 'short',
                                                              day: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit'
                                                          })
                                                        : 'No Expiry'}
                                                </span>
                                            </div>

                                            {/* Created At */}
                                            {banner.created_at && (
                                                <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                    <span>Created:</span>
                                                    <span>{new Date(banner.created_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions row */}
                                        <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
                                            {/* Active Toggle Switch */}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(banner)}
                                                disabled={isToggling}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                                                    banner.is_active
                                                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                                                        : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-800'
                                                } ${isToggling ? 'opacity-50 pointer-events-none' : ''}`}
                                                title={banner.is_active ? 'Click to deactivate' : 'Click to activate'}
                                            >
                                                {isToggling ? (
                                                    <RefreshCw size={12} className="animate-spin" />
                                                ) : banner.is_active ? (
                                                    <CheckCircle2 size={13} className="text-emerald-400" />
                                                ) : (
                                                    <XCircle size={13} className="text-gray-400" />
                                                )}
                                                <span>{banner.is_active ? 'Active' : 'Inactive'}</span>
                                            </button>

                                            {/* Rank Quick Adjust buttons */}
                                            <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdjustRanking(banner, 1)}
                                                    className="p-1 hover:text-white text-gray-400 hover:bg-gray-800 rounded transition"
                                                    title="Increase rank priority"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <span className="text-[11px] font-bold px-1 text-gray-300">
                                                    {banner.ranking || 0}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdjustRanking(banner, -1)}
                                                    className="p-1 hover:text-white text-gray-400 hover:bg-gray-800 rounded transition"
                                                    title="Decrease rank priority"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>

                                            {/* Edit & Delete */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(banner)}
                                                    className="p-2 rounded-xl text-gray-400 hover:text-blue-400 hover:bg-blue-950/40 border border-transparent hover:border-blue-800/40 transition cursor-pointer"
                                                    title="Edit Ad Banner"
                                                >
                                                    <Edit3 size={15} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingBanner(banner)}
                                                    className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition cursor-pointer"
                                                    title="Delete Ad Banner"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ═══════ TABLE VIEW ═══════ */
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-950/90 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800 text-[11px]">
                                    <tr>
                                        <th className="py-3.5 px-4">Banner Preview</th>
                                        <th className="py-3.5 px-4">Type</th>
                                        <th className="py-3.5 px-4">Target Destination</th>
                                        <th className="py-3.5 px-4">Ranking</th>
                                        <th className="py-3.5 px-4">Status</th>
                                        <th className="py-3.5 px-4">Expires</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/60">
                                    {filteredBanners.map(banner => {
                                        const expired = isBannerExpired(banner);
                                        const isToggling = togglingId === banner.id;

                                        return (
                                            <tr
                                                key={banner.id}
                                                className="hover:bg-gray-850/50 transition-colors"
                                            >
                                                {/* Thumbnail */}
                                                <td className="py-3 px-4">
                                                    <div
                                                        className="w-20 h-11 bg-gray-950 rounded-lg overflow-hidden border border-gray-800 cursor-pointer relative group shrink-0"
                                                        onClick={() => setPreviewingBanner(banner)}
                                                    >
                                                        <img
                                                            src={banner.banner_url}
                                                            alt={banner.ad_type}
                                                            className="w-full h-full object-cover"
                                                            onError={e => {
                                                                (e.target as HTMLImageElement).src =
                                                                    'https://placehold.co/800x450/1e293b/94a3b8?text=Broken';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                            <Eye size={12} className="text-white" />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Type */}
                                                <td className="py-3 px-4">
                                                    <span className="font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded-md text-[11px]">
                                                        {banner.ad_type}
                                                    </span>
                                                </td>

                                                {/* Target */}
                                                <td className="py-3 px-4 max-w-xs">
                                                    <a
                                                        href={banner.target_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-300 hover:text-blue-400 font-mono text-[11px] truncate flex items-center gap-1 hover:underline"
                                                        title={banner.target_url}
                                                    >
                                                        <span className="truncate">{banner.target_url}</span>
                                                        <ExternalLink size={12} className="shrink-0" />
                                                    </a>
                                                </td>

                                                {/* Rank */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-amber-400 text-xs">
                                                            {banner.ranking || 0}
                                                        </span>
                                                        <div className="flex flex-col ml-1">
                                                            <button
                                                                onClick={() => handleAdjustRanking(banner, 1)}
                                                                className="text-gray-400 hover:text-white"
                                                            >
                                                                <ChevronUp size={11} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAdjustRanking(banner, -1)}
                                                                className="text-gray-400 hover:text-white"
                                                            >
                                                                <ChevronDown size={11} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Active Switch */}
                                                <td className="py-3 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleActive(banner)}
                                                        disabled={isToggling}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer border ${
                                                            banner.is_active && !expired
                                                                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                                                                : 'bg-gray-800/80 border-gray-700 text-gray-400'
                                                        }`}
                                                    >
                                                        {isToggling ? (
                                                            <RefreshCw size={10} className="animate-spin" />
                                                        ) : banner.is_active ? (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        ) : (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                                        )}
                                                        <span>{banner.is_active ? 'Active' : 'Inactive'}</span>
                                                    </button>
                                                </td>

                                                {/* Expires */}
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`${
                                                            expired ? 'text-rose-400 font-bold' : 'text-gray-300'
                                                        }`}
                                                    >
                                                        {banner.end_date
                                                            ? new Date(banner.end_date).toLocaleDateString([], {
                                                                  year: 'numeric',
                                                                  month: 'short',
                                                                  day: 'numeric'
                                                              })
                                                            : '—'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewingBanner(banner)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                                                            title="Preview"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(banner)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-800 transition"
                                                            title="Edit"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingBanner(banner)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-gray-800 transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* ═══════ CREATE BANNER MODAL (POST) ═══════ */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-2xl relative my-8">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <PlusCircle size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Create New Ad Banner</h2>
                                    <p className="text-xs text-gray-400">Add a promotional ad banner to PlotVista</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                                <AlertCircle size={15} className="shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleCreateBanner} className="space-y-4">
                            {/* Ad Type */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Ad Type <span className="text-rose-400">*</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {AD_TYPE_PRESETS.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, ad_type: type }))}
                                            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition cursor-pointer ${
                                                formData.ad_type === type
                                                    ? 'bg-blue-600 text-white border-blue-500'
                                                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={formData.ad_type}
                                    onChange={e => setFormData(prev => ({ ...prev, ad_type: e.target.value }))}
                                    placeholder="e.g. HERO_BANNER, POPUP, etc."
                                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    required
                                    maxLength={50}
                                />
                            </div>

                            {/* Banner Image URL */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-gray-300">
                                        Banner Image URL <span className="text-rose-400">*</span>
                                    </label>
                                    <span className="text-[11px] text-gray-400">Quick Presets:</span>
                                </div>

                                {/* Preset Sample URLs */}
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {SAMPLE_BANNERS.map((sample, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    banner_url: sample.url,
                                                    target_url: sample.target,
                                                    ad_type: sample.type
                                                }));
                                            }}
                                            className="text-[10px] bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-300 px-2 py-0.5 rounded-md hover:text-white cursor-pointer"
                                        >
                                            Use {sample.label}
                                        </button>
                                    ))}
                                </div>

                                <input
                                    type="url"
                                    value={formData.banner_url}
                                    onChange={e => setFormData(prev => ({ ...prev, banner_url: e.target.value }))}
                                    placeholder="https://example.com/images/banner.jpg"
                                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    required
                                />

                                {/* Live Image Preview Box */}
                                {formData.banner_url && (
                                    <div className="mt-2 relative aspect-[16/6] w-full rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
                                        <img
                                            src={formData.banner_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={e => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://placehold.co/800x300/1e293b/ef4444?text=Invalid+Image+URL';
                                            }}
                                        />
                                        <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono">
                                            Live Preview
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Target URL */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Target Destination URL <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.target_url}
                                    onChange={e => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
                                    placeholder="https://plotvista.com/ventures or https://wa.me/..."
                                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    required
                                />
                                <span className="text-[11px] text-gray-500 mt-1 block">
                                    Where users will be redirected when clicking this banner.
                                </span>
                            </div>

                            {/* End Date & Quick Extenders */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-gray-300">
                                        End Date & Time <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                        <button
                                            type="button"
                                            onClick={() => addDaysToEndDate(7)}
                                            className="bg-gray-950 hover:bg-gray-800 border border-gray-800 px-1.5 py-0.5 rounded text-gray-300 cursor-pointer"
                                        >
                                            +7 Days
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addDaysToEndDate(30)}
                                            className="bg-gray-950 hover:bg-gray-800 border border-gray-800 px-1.5 py-0.5 rounded text-gray-300 cursor-pointer"
                                        >
                                            +30 Days
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addDaysToEndDate(90)}
                                            className="bg-gray-950 hover:bg-gray-800 border border-gray-800 px-1.5 py-0.5 rounded text-gray-300 cursor-pointer"
                                        >
                                            +90 Days
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="datetime-local"
                                    value={formData.end_date}
                                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    required
                                />
                            </div>

                            {/* Ranking & Active Switch */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                        Ranking (Priority Order)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.ranking}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                ranking: parseInt(e.target.value, 10) || 0
                                            }))
                                        }
                                        className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    />
                                    <span className="text-[10px] text-gray-500 mt-1 block">
                                        Higher ranking appears first.
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                        Banner Status
                                    </label>
                                    <label className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={e =>
                                                setFormData(prev => ({ ...prev, is_active: e.target.checked }))
                                            }
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-0 focus:ring-offset-0 bg-gray-900 border-gray-700"
                                        />
                                        <span className="text-xs font-semibold text-gray-200">
                                            {formData.is_active ? 'Active (Live Immediately)' : 'Inactive (Draft)'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            <span>Publishing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            <span>Publish Ad Banner</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════ EDIT BANNER MODAL (UPDATE) ═══════ */}
            {editingBanner && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-2xl relative my-8">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Edit3 size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Edit Ad Banner</h2>
                                    <p className="text-xs text-gray-400">
                                        Update banner settings and targets (ID: {editingBanner.id})
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingBanner(null)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                                <AlertCircle size={15} className="shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleUpdateBanner} className="space-y-4">
                            {/* Ad Type */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Ad Type <span className="text-rose-400">*</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {AD_TYPE_PRESETS.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, ad_type: type }))}
                                            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition cursor-pointer ${
                                                formData.ad_type === type
                                                    ? 'bg-blue-600 text-white border-blue-500'
                                                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={formData.ad_type}
                                    onChange={e => setFormData(prev => ({ ...prev, ad_type: e.target.value }))}
                                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    required
                                    maxLength={50}
                                />
                            </div>

                            {/* Banner Image URL */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Banner Image URL <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.banner_url}
                                    onChange={e => setFormData(prev => ({ ...prev, banner_url: e.target.value }))}
                                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    required
                                />

                                {/* Live Image Preview Box */}
                                {formData.banner_url && (
                                    <div className="mt-2 relative aspect-[16/6] w-full rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
                                        <img
                                            src={formData.banner_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={e => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://placehold.co/800x300/1e293b/ef4444?text=Invalid+Image+URL';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Target URL */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Target Destination URL <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.target_url}
                                    onChange={e => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
                                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    required
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-gray-300">
                                        End Date & Time <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                        <button
                                            type="button"
                                            onClick={() => addDaysToEndDate(7)}
                                            className="bg-gray-950 hover:bg-gray-800 border border-gray-800 px-1.5 py-0.5 rounded text-gray-300 cursor-pointer"
                                        >
                                            +7 Days
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addDaysToEndDate(30)}
                                            className="bg-gray-950 hover:bg-gray-800 border border-gray-800 px-1.5 py-0.5 rounded text-gray-300 cursor-pointer"
                                        >
                                            +30 Days
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="datetime-local"
                                    value={formData.end_date}
                                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    required
                                />
                            </div>

                            {/* Ranking & Active Switch */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                        Ranking (Priority Order)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.ranking}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                ranking: parseInt(e.target.value, 10) || 0
                                            }))
                                        }
                                        className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                        Banner Status
                                    </label>
                                    <label className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={e =>
                                                setFormData(prev => ({ ...prev, is_active: e.target.checked }))
                                            }
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-0 focus:ring-offset-0 bg-gray-900 border-gray-700"
                                        />
                                        <span className="text-xs font-semibold text-gray-200">
                                            {formData.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingBanner(null)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            <span>Saving Changes...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════ PREVIEW MODAL ═══════ */}
            {previewingBanner && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-md bg-blue-950 border border-blue-800 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                    {previewingBanner.ad_type}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">
                                    Rank: {previewingBanner.ranking || 0}
                                </span>
                            </div>
                            <button
                                onClick={() => setPreviewingBanner(null)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Interactive Banner Render */}
                        <div className="space-y-3">
                            <div className="relative aspect-[16/8] w-full rounded-2xl overflow-hidden border border-gray-700 bg-gray-950 shadow-2xl group">
                                <img
                                    src={previewingBanner.banner_url}
                                    alt={previewingBanner.ad_type}
                                    className="w-full h-full object-cover"
                                    onError={e => {
                                        (e.target as HTMLImageElement).src =
                                            'https://placehold.co/1200x600/1e293b/ef4444?text=Image+Load+Error';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs uppercase font-extrabold text-blue-400 tracking-wider">
                                            PlotVista Promotion
                                        </span>
                                        <p className="text-xs text-gray-300 font-mono truncate max-w-sm mt-0.5">
                                            {previewingBanner.target_url}
                                        </p>
                                    </div>
                                    <a
                                        href={previewingBanner.target_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md"
                                    >
                                        Visit Link <ExternalLink size={13} />
                                    </a>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-xl flex items-center justify-between text-xs text-gray-400">
                                <span>
                                    Expires:{' '}
                                    <strong className="text-gray-200">
                                        {previewingBanner.end_date
                                            ? new Date(previewingBanner.end_date).toLocaleString()
                                            : 'No expiration'}
                                    </strong>
                                </span>
                                <span>
                                    Status:{' '}
                                    <strong
                                        className={
                                            previewingBanner.is_active ? 'text-emerald-400' : 'text-gray-400'
                                        }
                                    >
                                        {previewingBanner.is_active ? 'Active' : 'Inactive'}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setPreviewingBanner(null)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ DELETE CONFIRMATION MODAL ═══════ */}
            {deletingBanner && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <div className="text-center space-y-1.5">
                            <h3 className="text-lg font-bold text-white">Delete Ad Banner?</h3>
                            <p className="text-xs text-gray-400">
                                Are you sure you want to permanently remove this banner (
                                {deletingBanner.ad_type})? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingBanner(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteBanner}
                                disabled={submitting}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50"
                            >
                                {submitting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
