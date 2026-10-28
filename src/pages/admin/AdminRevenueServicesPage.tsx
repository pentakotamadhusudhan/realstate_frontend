import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import { getUserProfile, isSuperAdmin } from '../../lib/auth';
import type {
    PlatformRevenueService,
    ServiceCategory,
    BuilderVerification,
    LeadPackage,
} from '../../types/revenue';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import ApiErrorAlert from '../../components/alter_box/ApiErrorAlert';
import {
    Sliders,
    Shield,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Layers,
    DollarSign,
    Users,
    Building2,
    Megaphone,
    Sparkles,
    RefreshCw,
    Search,
    Plus,
    ExternalLink,
    Clock,
    Lock,
    Settings,
    ChevronRight,
    TrendingUp,
} from 'lucide-react';

const CATEGORY_META: Record<
    ServiceCategory,
    { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }
> = {
    BUILDER: {
        label: '1. Builders & Developers',
        icon: Building2,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.1)',
    },
    AGENT: {
        label: '2. Agents & Mediators',
        icon: Users,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
    },
    ADVERTISING: {
        label: '3. Advertising & Promotions',
        icon: Megaphone,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)',
    },
    CUSTOMER: {
        label: '4. Customer & Premium Services',
        icon: Sparkles,
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.1)',
    },
};

export default function AdminRevenueServicesPage() {
    const navigate = useNavigate();
    const user = getUserProfile();
    const isSuper = isSuperAdmin(user);

    const [activeTab, setActiveTab] = useState<'SERVICES' | 'VERIFICATIONS' | 'LEAD_PACKAGES'>('SERVICES');
    const [services, setServices] = useState<PlatformRevenueService[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [servicesError, setServicesError] = useState('');
    const [togglingCode, setTogglingCode] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | ServiceCategory>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Builder Verifications
    const [verifications, setVerifications] = useState<BuilderVerification[]>([]);
    const [loadingVerifications, setLoadingVerifications] = useState(false);
    const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [reviewingItem, setReviewingItem] = useState<BuilderVerification | null>(null);
    const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
    const [adminNotes, setAdminNotes] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Lead Packages
    const [packages, setPackages] = useState<LeadPackage[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [showNewPackModal, setShowNewPackModal] = useState(false);
    const [packForm, setPackForm] = useState({ name: '', credits: 10, price: 999, description: '' });
    const [submittingPack, setSubmittingPack] = useState(false);

    // Config Edit Modal
    const [editingConfigService, setEditingConfigService] = useState<PlatformRevenueService | null>(null);
    const [rawConfigText, setRawConfigText] = useState('{}');
    const [savingConfig, setSavingConfig] = useState(false);

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    // Fetch Services
    const fetchServices = async () => {
        setLoadingServices(true);
        setServicesError('');
        try {
            const data = await apiFetch(ENDPOINTS.revenueServices());
            const list: PlatformRevenueService[] = Array.isArray(data) ? data : data?.results || [];
            setServices(list);
        } catch (err: any) {
            setServicesError(formatApiErrorMessage(err) || 'Failed to load platform revenue services.');
        } finally {
            setLoadingServices(false);
        }
    };

    // Fetch Verifications
    const fetchVerifications = async () => {
        if (!isSuper) return;
        setLoadingVerifications(true);
        try {
            const data = await apiFetch(ENDPOINTS.superAdminVerifications());
            const list = Array.isArray(data) ? data : data?.results || [];
            setVerifications(list);
        } catch (err) {
            console.error('Failed to load builder verifications', err);
        } finally {
            setLoadingVerifications(false);
        }
    };

    // Fetch Lead Packages
    const fetchPackages = async () => {
        setLoadingPackages(true);
        try {
            const data = await apiFetch(ENDPOINTS.agentLeadPackages());
            const list = Array.isArray(data) ? data : data?.results || [];
            setPackages(list);
        } catch (err) {
            console.error('Failed to load lead packages', err);
        } finally {
            setLoadingPackages(false);
        }
    };

    useEffect(() => {
        fetchServices();
        if (isSuper) {
            fetchVerifications();
            fetchPackages();
        }
    }, [isSuper]);

    // Super Admin Master Toggle
    const handleToggleService = async (service: PlatformRevenueService) => {
        if (!isSuper) return;
        setTogglingCode(service.code);
        try {
            const updated = await apiFetch(ENDPOINTS.revenueServiceToggle(service.code), {
                method: 'PATCH',
                body: JSON.stringify({
                    is_enabled: !service.is_enabled,
                }),
            });
            const updatedService = updated.service || updated;
            setServices(prev =>
                prev.map(s => (s.code === service.code ? { ...s, ...updatedService } : s))
            );
        } catch (err: any) {
            setServicesError(formatApiErrorMessage(err) || `Failed to toggle service ${service.name}`);
        } finally {
            setTogglingCode(null);
        }
    };

    // Save JSON Configuration for Service
    const handleSaveConfig = async () => {
        if (!editingConfigService || !isSuper) return;
        setSavingConfig(true);
        try {
            const parsed = JSON.parse(rawConfigText);
            const updated = await apiFetch(ENDPOINTS.revenueServiceToggle(editingConfigService.code), {
                method: 'PATCH',
                body: JSON.stringify({ config: parsed }),
            });
            const updatedService = updated.service || updated;
            setServices(prev =>
                prev.map(s => (s.code === editingConfigService.code ? { ...s, ...updatedService } : s))
            );
            setEditingConfigService(null);
        } catch (err: any) {
            alert('Invalid JSON: ' + (err.message || 'Check your format'));
        } finally {
            setSavingConfig(false);
        }
    };

    // Review Builder Verification
    const handleSubmitReview = async () => {
        if (!reviewingItem || !isSuper) return;
        setSubmittingReview(true);
        try {
            const res = await apiFetch(ENDPOINTS.superAdminVerificationReview(reviewingItem.id), {
                method: 'POST',
                body: JSON.stringify({
                    status: reviewStatus,
                    admin_notes: adminNotes,
                }),
            });
            const updated = res.verification || res;
            setVerifications(prev =>
                prev.map(v => (v.id === reviewingItem.id ? { ...v, ...updated } : v))
            );
            setReviewingItem(null);
            setAdminNotes('');
        } catch (err: any) {
            alert(formatApiErrorMessage(err) || 'Failed to review verification.');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Create New Lead Package
    const handleCreatePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSuper) return;
        setSubmittingPack(true);
        try {
            const created = await apiFetch(ENDPOINTS.agentLeadPackages(), {
                method: 'POST',
                body: JSON.stringify({
                    name: packForm.name,
                    credits: Number(packForm.credits),
                    price: Number(packForm.price),
                    description: packForm.description,
                    is_active: true,
                }),
            });
            setPackages(prev => [created, ...prev]);
            setShowNewPackModal(false);
            setPackForm({ name: '', credits: 10, price: 999, description: '' });
        } catch (err: any) {
            alert(formatApiErrorMessage(err) || 'Failed to create lead package');
        } finally {
            setSubmittingPack(false);
        }
    };

    // Filtered services
    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const matchCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
            const matchQuery =
                !searchQuery ||
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCategory && matchQuery;
        });
    }, [services, categoryFilter, searchQuery]);

    // Statistics
    const stats = useMemo(() => {
        const total = services.length;
        const enabled = services.filter(s => s.is_enabled).length;
        const disabled = total - enabled;
        return { total, enabled, disabled };
    }, [services]);

    const filteredVerifications = useMemo(() => {
        if (verificationFilter === 'ALL') return verifications;
        return verifications.filter(v => v.status === verificationFilter);
    }, [verifications, verificationFilter]);

    if (!isSuper) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex flex-col">
                <AdminNavbar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-gray-900 border border-red-900/50 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Super Admin Only Feature</h2>
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Platform revenue generation services and monetization master switches can only be configured and enabled by a Super Administrator.
                        </p>
                        <button
                            onClick={() => navigate('/admin/ventures')}
                            className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
            <AdminNavbar />

            {/* Sub-header / Title section */}
            <header className="border-b border-gray-800/80 bg-gray-900/60 backdrop-blur sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 shadow-lg shadow-amber-500/20">
                                    <Sliders size={20} className="text-gray-950" />
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                    Revenue Generation Governance
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    Super Admin Only
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                                Master service switches, developer lifetime verification review, agent lead packages, and platform monetization controls.
                            </p>
                        </div>

                        {/* Top action tabs */}
                        <div className="flex items-center gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
                            <button
                                onClick={() => setActiveTab('SERVICES')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                    activeTab === 'SERVICES'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-900'
                                }`}
                            >
                                <Sliders size={14} />
                                Master Services ({stats.total})
                            </button>
                            <button
                                onClick={() => setActiveTab('VERIFICATIONS')}
                                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                    activeTab === 'VERIFICATIONS'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-900'
                                }`}
                            >
                                <ShieldCheck size={14} />
                                Builder Verifications
                                {verifications.filter(v => v.status === 'PENDING').length > 0 && (
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('LEAD_PACKAGES')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                    activeTab === 'LEAD_PACKAGES'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-900'
                                }`}
                            >
                                <DollarSign size={14} />
                                Lead Packages ({packages.length})
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* ══════════════════════════════════════════════════════════════════
                    TAB 1: MASTER SERVICES CONTROLS
                    ══════════════════════════════════════════════════════════════════ */}
                {activeTab === 'SERVICES' && (
                    <div className="space-y-6">
                        {/* KPI Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Services</p>
                                    <p className="text-2xl font-black text-white mt-0.5">{stats.total}</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Across 4 Revenue Segments</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                    <Layers size={22} />
                                </div>
                            </div>

                            <div className="bg-gray-900/70 border border-emerald-900/30 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Live & Monetizing</p>
                                    <p className="text-2xl font-black text-emerald-400 mt-0.5">{stats.enabled}</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Active on public/client API</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                    <CheckCircle2 size={22} />
                                </div>
                            </div>

                            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Turned Off</p>
                                    <p className="text-2xl font-black text-gray-400 mt-0.5">{stats.disabled}</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Blocked with 403 Forbidden</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gray-800/60 text-gray-400 flex items-center justify-center">
                                    <XCircle size={22} />
                                </div>
                            </div>
                        </div>

                        {/* Error alert */}
                        {servicesError && (
                            <ApiErrorAlert
                                message={servicesError}
                                onRetry={fetchServices}
                                onClose={() => setServicesError('')}
                            />
                        )}

                        {/* Filter Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gray-900/50 p-3 rounded-2xl border border-gray-800">
                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                                <button
                                    onClick={() => setCategoryFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                                        categoryFilter === 'ALL'
                                            ? 'bg-white text-gray-950 shadow'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    All Categories
                                </button>
                                {(['BUILDER', 'AGENT', 'ADVERTISING', 'CUSTOMER'] as ServiceCategory[]).map(cat => {
                                    const meta = CATEGORY_META[cat];
                                    const Icon = meta.icon;
                                    const isSel = categoryFilter === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                                                isSel
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                            }`}
                                        >
                                            <Icon size={13} />
                                            {meta.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search */}
                            <div className="relative w-full lg:w-72">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Filter by name, code, description…"
                                    className="w-full bg-gray-950 border border-gray-800 text-xs rounded-xl pl-9 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Services Grid */}
                        {loadingServices ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="h-44 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse" />
                                ))}
                            </div>
                        ) : filteredServices.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800">
                                <Layers size={32} className="mx-auto text-gray-600 mb-2" />
                                <p className="text-gray-400 text-sm">No revenue services found matching filter.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {filteredServices.map(service => {
                                    const meta = CATEGORY_META[service.category];
                                    const Icon = meta.icon;
                                    const isUpdating = togglingCode === service.code;

                                    return (
                                        <div
                                            key={service.id}
                                            className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                                                service.is_enabled
                                                    ? 'bg-gray-900/90 border-gray-800 hover:border-gray-700 shadow-lg'
                                                    : 'bg-gray-950/70 border-gray-900 opacity-75'
                                            }`}
                                        >
                                            {/* Card Top */}
                                            <div className="p-5">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                            style={{ background: meta.bg, color: meta.color }}
                                                        >
                                                            <Icon size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-white leading-snug">
                                                                {service.name}
                                                            </h3>
                                                            <span
                                                                className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border inline-block mt-0.5"
                                                                style={{
                                                                    borderColor: `${meta.color}40`,
                                                                    color: meta.color,
                                                                    background: `${meta.color}10`,
                                                                }}
                                                            >
                                                                {service.code}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Toggle Switch */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span
                                                            className={`text-[11px] font-bold ${
                                                                service.is_enabled ? 'text-emerald-400' : 'text-gray-500'
                                                            }`}
                                                        >
                                                            {service.is_enabled ? 'ENABLED' : 'DISABLED'}
                                                        </span>
                                                        <button
                                                            disabled={isUpdating}
                                                            onClick={() => handleToggleService(service)}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                service.is_enabled ? 'bg-emerald-500' : 'bg-gray-800'
                                                            } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                                                            title={`Toggle ${service.name}`}
                                                        >
                                                            <span
                                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                    service.is_enabled ? 'translate-x-5' : 'translate-x-0'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-gray-400 leading-relaxed min-h-[36px]">
                                                    {service.description || 'Monetization feature active on platform.'}
                                                </p>
                                            </div>

                                            {/* Card Footer / Controls */}
                                            <div className="px-5 py-3 bg-gray-950/80 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500">
                                                <div className="truncate pr-2">
                                                    {service.updated_by_name ? (
                                                        <span>Updated by {service.updated_by_name}</span>
                                                    ) : (
                                                        <span>Default System Policy</span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setEditingConfigService(service);
                                                        setRawConfigText(JSON.stringify(service.config || {}, null, 2));
                                                    }}
                                                    className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition font-medium"
                                                >
                                                    <Settings size={12} />
                                                    Parameters ({Object.keys(service.config || {}).length})
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    TAB 2: BUILDER LIFETIME VERIFICATIONS
                    ══════════════════════════════════════════════════════════════════ */}
                {activeTab === 'VERIFICATIONS' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-amber-400" />
                                    Builder Lifetime Verification Badge Requests
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Official accreditation requests from real estate developers and builders.
                                </p>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800">
                                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setVerificationFilter(st)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            verificationFilter === st
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loadingVerifications ? (
                            <div className="py-12 text-center text-gray-500 text-xs">Loading requests…</div>
                        ) : filteredVerifications.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800">
                                <Shield size={36} className="mx-auto text-gray-600 mb-2" />
                                <p className="text-gray-300 font-semibold text-sm">No builder verification requests</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    Builders can apply from their dashboard to receive official accreditation.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredVerifications.map(item => (
                                    <div
                                        key={item.id}
                                        className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-base font-bold text-white">{item.company_name}</h3>
                                                    <span
                                                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                                            item.status === 'APPROVED'
                                                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                                                : item.status === 'PENDING'
                                                                ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                                                                : 'bg-red-950/80 text-red-400 border-red-800'
                                                        }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                                                    <span>Developer: <strong className="text-gray-200">{item.builder_name || item.builder_email}</strong></span>
                                                    {item.rera_number && <span>RERA: <strong className="text-gray-200">{item.rera_number}</strong></span>}
                                                    {item.license_number && <span>License: <strong className="text-gray-200">{item.license_number}</strong></span>}
                                                    <span>Fee Paid: <strong className="text-emerald-400 font-semibold">₹{Number(item.fee_paid).toLocaleString('en-IN')}</strong></span>
                                                    <span>Applied: {new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>

                                                {item.document_url && (
                                                    <a
                                                        href={item.document_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline pt-1"
                                                    >
                                                        <ExternalLink size={12} />
                                                        View Accreditation / Incorporation Certificate
                                                    </a>
                                                )}

                                                {item.admin_notes && (
                                                    <p className="text-xs text-amber-300 bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-xl mt-2">
                                                        <strong>Admin Note:</strong> {item.admin_notes}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Review Action */}
                                            <div className="shrink-0 flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setReviewingItem(item);
                                                        setReviewStatus('APPROVED');
                                                        setAdminNotes(item.admin_notes || '');
                                                    }}
                                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                                                >
                                                    Review & Update
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    TAB 3: AGENT LEAD PACKAGES
                    ══════════════════════════════════════════════════════════════════ */}
                {activeTab === 'LEAD_PACKAGES' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <DollarSign size={20} className="text-emerald-400" />
                                    Pay-Per-Lead Credit Packages for Agents
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Pre-configured credit packs allowing real estate agents to unlock prospective buyer contact details.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowNewPackModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
                            >
                                <Plus size={14} />
                                New Lead Package
                            </button>
                        </div>

                        {loadingPackages ? (
                            <div className="py-12 text-center text-gray-500 text-xs">Loading packages…</div>
                        ) : packages.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800">
                                <DollarSign size={36} className="mx-auto text-gray-600 mb-2" />
                                <p className="text-gray-300 font-semibold text-sm">No Lead Packages Active</p>
                                <p className="text-gray-500 text-xs mt-1">Create packages so agents can purchase lead credits.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {packages.map(pack => (
                                    <div
                                        key={pack.id}
                                        className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-bold text-white text-base">{pack.name}</h3>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                    {pack.credits} Leads
                                                </span>
                                            </div>

                                            <div className="text-2xl font-black text-white mb-2">
                                                ₹{Number(pack.price).toLocaleString('en-IN')}
                                                <span className="text-xs font-normal text-gray-400 ml-1">
                                                    (₹{(Number(pack.price) / (pack.credits || 1)).toFixed(0)} / lead)
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-400 leading-relaxed mb-4">
                                                {pack.description || `Unlocks ${pack.credits} prospective buyer customer contacts with full verified phone & email.`}
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-gray-800 text-[11px] text-gray-500 flex items-center justify-between">
                                            <span>Active on Portal</span>
                                            <span className="text-emerald-400 font-semibold">Ready for Purchase</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Modal: Service Parameters Config Inspector */}
            {editingConfigService && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm"
                    onClick={() => setEditingConfigService(null)}
                >
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-bold text-white">
                                Service Parameters: {editingConfigService.name}
                            </h3>
                            <span className="text-[10px] font-mono text-gray-400">
                                {editingConfigService.code}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                            JSON configuration parameters applied by backend revenue enforcement rules.
                        </p>

                        <div className="mb-4">
                            <textarea
                                rows={8}
                                value={rawConfigText}
                                onChange={e => setRawConfigText(e.target.value)}
                                className="w-full bg-gray-950 font-mono text-xs text-emerald-300 p-3 rounded-xl border border-gray-800 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setEditingConfigService(null)}
                                className="flex-1 py-2 rounded-xl border border-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={savingConfig}
                                onClick={handleSaveConfig}
                                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
                            >
                                {savingConfig ? 'Saving…' : 'Save Parameters'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Review Builder Verification */}
            {reviewingItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm"
                    onClick={() => setReviewingItem(null)}
                >
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-white mb-1">
                            Review Verification: {reviewingItem.company_name}
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Approving grants the Lifetime Verification Badge and enables unlimited developer property showcase.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                    Decision Status
                                </label>
                                <select
                                    value={reviewStatus}
                                    onChange={e => setReviewStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                                >
                                    <option value="APPROVED">APPROVED (Grant Lifetime Badge)</option>
                                    <option value="REJECTED">REJECTED (Decline Application)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                    Administrative Notes / Reason
                                </label>
                                <textarea
                                    rows={3}
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                    placeholder="e.g. Verified with state RERA directory. Documentation verified."
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReviewingItem(null)}
                                    className="flex-1 py-2 rounded-xl border border-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={submittingReview}
                                    onClick={handleSubmitReview}
                                    className={`flex-1 py-2 rounded-xl text-white text-xs font-bold transition shadow-md ${
                                        reviewStatus === 'APPROVED'
                                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                                            : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                                    }`}
                                >
                                    {submittingReview ? 'Submitting…' : `Confirm ${reviewStatus}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Create Lead Package */}
            {showNewPackModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm"
                    onClick={() => setShowNewPackModal(false)}
                >
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-white mb-1">Create Lead Credit Package</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Configure credit unlock packs for accredited agents.
                        </p>

                        <form onSubmit={handleCreatePackage} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">
                                    Package Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={packForm.name}
                                    onChange={e => setPackForm({ ...packForm, name: e.target.value })}
                                    placeholder="e.g. Starter Pack (10 Leads)"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1">
                                        Credits (Lead Count)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={packForm.credits}
                                        onChange={e => setPackForm({ ...packForm, credits: Number(e.target.value) })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1">
                                        Price (₹ INR)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        required
                                        value={packForm.price}
                                        onChange={e => setPackForm({ ...packForm, price: Number(e.target.value) })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={packForm.description}
                                    onChange={e => setPackForm({ ...packForm, description: e.target.value })}
                                    placeholder="e.g. Pay-per-lead package to unlock 10 customer inquiries."
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewPackModal(false)}
                                    className="flex-1 py-2 rounded-xl border border-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingPack}
                                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
                                >
                                    {submittingPack ? 'Creating…' : 'Create Package'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
