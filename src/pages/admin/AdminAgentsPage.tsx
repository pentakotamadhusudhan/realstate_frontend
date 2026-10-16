import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import AdminNavbar from '../../components/admin/AdminNavbar';
import ApiErrorAlert from '../../components/alter_box/ApiErrorAlert';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import {
    Users,
    ShieldCheck,
    ShieldAlert,
    Ban,
    CheckCircle2,
    Search,
    RefreshCw,
    UserCheck,
    UserX,
    Clock,
    Phone,
    Mail,
    Calendar,
    Eye,
    X,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    FileText,
    ExternalLink
} from 'lucide-react';

export interface AgentUser {
    id: string;
    full_name: string;
    email: string;
    mobile_number?: string;
    user_type: string;
    is_verified: boolean;
    is_active?: boolean;
    created_at?: string;
    date_joined?: string;
    agency_name?: string;
    license_number?: string;
    experience_years?: number;
    bio?: string;
}

export default function AdminAgentsPage() {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<AgentUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'UNVERIFIED' | 'VERIFIED' | 'BLOCKED'>('ALL');
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<AgentUser | null>(null);
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        type: 'VERIFY' | 'BLOCK' | 'UNBLOCK';
        agent: AgentUser | null;
    }>({ open: false, type: 'VERIFY', agent: null });

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    // Fetch agents from backend
    const fetchAgents = async () => {
        setLoading(true);
        setError('');
        try {
            // First try uppercase 'AGENT', then lowercase 'agent'
            let data: any;
            try {
                data = await apiFetch(ENDPOINTS.users('user_type=AGENT'), { silent: true });
            } catch {
                data = await apiFetch(ENDPOINTS.users('user_type=agent'), { silent: true });
            }

            const rawList: AgentUser[] = Array.isArray(data) ? data : data?.results || [];
            
            // Normalize agent properties
            const normalized = rawList.map((a: any) => ({
                id: String(a.id),
                full_name: a.full_name || a.username || 'Agent User',
                email: a.email || '',
                mobile_number: a.mobile_number || a.phone_number || a.phone || '',
                user_type: a.user_type || 'AGENT',
                is_verified: Boolean(a.is_verified),
                is_active: a.is_active !== undefined ? Boolean(a.is_active) : true,
                created_at: a.created_at || a.date_joined || new Date().toISOString(),
                agency_name: a.agency_name || '',
                license_number: a.license_number || '',
            }));

            setAgents(normalized);
        } catch (err: any) {
            console.error('Failed to load agents:', err);
            setError(formatApiErrorMessage(err) || 'Failed to load agents list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 4500);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    // Derived counts
    const unverifiedCount = useMemo(() => agents.filter(a => !a.is_verified).length, [agents]);
    const verifiedCount = useMemo(() => agents.filter(a => a.is_verified && a.is_active !== false).length, [agents]);
    const blockedCount = useMemo(() => agents.filter(a => a.is_active === false).length, [agents]);

    // Filtered list
    const filteredAgents = useMemo(() => {
        return agents.filter(agent => {
            // Tab filter
            if (activeTab === 'UNVERIFIED' && agent.is_verified) return false;
            if (activeTab === 'VERIFIED' && (!agent.is_verified || agent.is_active === false)) return false;
            if (activeTab === 'BLOCKED' && agent.is_active !== false) return false;

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = agent.full_name.toLowerCase().includes(q);
                const matchEmail = agent.email.toLowerCase().includes(q);
                const matchPhone = (agent.mobile_number || '').includes(q);
                return matchName || matchEmail || matchPhone;
            }

            return true;
        });
    }, [agents, activeTab, searchQuery]);

    // Handle Verify Agent
    const handleVerifyAgent = async (agent: AgentUser) => {
        setActionLoadingId(agent.id);
        try {
            try {
                // Try dedicated verify endpoint
                await apiFetch(ENDPOINTS.verifyUser(agent.id), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_verified: true })
                });
            } catch {
                // Fallback to PATCH /api/auth/users/<id>/
                await apiFetch(`${ENDPOINTS.users()}${agent.id}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_verified: true })
                });
            }

            // Update local state
            setAgents(prev =>
                prev.map(a => (a.id === agent.id ? { ...a, is_verified: true, is_active: true } : a))
            );
            if (selectedAgent?.id === agent.id) {
                setSelectedAgent(prev => (prev ? { ...prev, is_verified: true, is_active: true } : null));
            }

            setToastMessage({
                type: 'success',
                text: `Agent "${agent.full_name}" is now verified and approved!`,
            });
            setConfirmModal({ open: false, type: 'VERIFY', agent: null });
        } catch (err: any) {
            setToastMessage({
                type: 'error',
                text: formatApiErrorMessage(err) || 'Failed to verify agent.',
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Deactivate / Block Agent
    const handleDeactivateAgent = async (agent: AgentUser) => {
        setActionLoadingId(agent.id);
        try {
            try {
                await apiFetch(ENDPOINTS.deactivateUser(agent.id), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch {
                await apiFetch(`${ENDPOINTS.users()}${agent.id}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_active: false })
                });
            }

            setAgents(prev =>
                prev.map(a => (a.id === agent.id ? { ...a, is_active: false } : a))
            );
            if (selectedAgent?.id === agent.id) {
                setSelectedAgent(prev => (prev ? { ...prev, is_active: false } : null));
            }

            setToastMessage({
                type: 'success',
                text: `Agent "${agent.full_name}" has been deactivated.`,
            });
            setConfirmModal({ open: false, type: 'BLOCK', agent: null });
        } catch (err: any) {
            setToastMessage({
                type: 'error',
                text: formatApiErrorMessage(err) || 'Failed to deactivate agent.',
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Reactivate / Unblock Agent
    const handleReactivateAgent = async (agent: AgentUser) => {
        setActionLoadingId(agent.id);
        try {
            try {
                await apiFetch(ENDPOINTS.activateUser(agent.id), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch {
                await apiFetch(`${ENDPOINTS.users()}${agent.id}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_active: true })
                });
            }

            setAgents(prev =>
                prev.map(a => (a.id === agent.id ? { ...a, is_active: true } : a))
            );
            if (selectedAgent?.id === agent.id) {
                setSelectedAgent(prev => (prev ? { ...prev, is_active: true } : null));
            }

            setToastMessage({
                type: 'success',
                text: `Agent "${agent.full_name}" has been reactivated.`,
            });
            setConfirmModal({ open: false, type: 'UNBLOCK', agent: null });
        } catch (err: any) {
            setToastMessage({
                type: 'error',
                text: formatApiErrorMessage(err) || 'Failed to reactivate agent.',
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
            {/* Top Navigation */}
            <AdminNavbar pendingAgentsCount={unverifiedCount} />

            {/* Notification Toast */}
            {toastMessage && (
                <div
                    className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold transition-all animate-bounce ${
                        toastMessage.type === 'success'
                            ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                            : 'bg-rose-950 border border-rose-500 text-rose-200'
                    }`}
                >
                    {toastMessage.type === 'success' ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    ) : (
                        <AlertCircle size={18} className="text-rose-400 shrink-0" />
                    )}
                    <span>{toastMessage.text}</span>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        className="ml-2 text-gray-400 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header & Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                Agent Management
                            </h1>
                            <span className="bg-blue-950/80 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-800/80">
                                Super Admin Console
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                            Review unverified agent onboarding, approve KYC verifications, and regulate platform access.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fetchAgents}
                            disabled={loading}
                            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <a
                            href="/agent-register"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
                        >
                            + Onboard Agent
                        </a>
                    </div>
                </div>

                {/* Error Banner if API fails */}
                {error && (
                    <div className="max-w-2xl">
                        <ApiErrorAlert
                            message={error}
                            onRetry={fetchAgents}
                            onClose={() => setError('')}
                        />
                    </div>
                )}

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        onClick={() => setActiveTab('ALL')}
                        className={`bg-gray-900 border p-5 rounded-2xl cursor-pointer transition ${
                            activeTab === 'ALL'
                                ? 'border-blue-500/60 bg-blue-950/20 shadow-lg shadow-blue-500/5'
                                : 'border-gray-800 hover:border-gray-700'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Agents</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                <Users size={16} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                            {agents.length}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 block">Registered in platform</span>
                    </div>

                    <div
                        onClick={() => setActiveTab('UNVERIFIED')}
                        className={`bg-gray-900 border p-5 rounded-2xl cursor-pointer transition ${
                            activeTab === 'UNVERIFIED'
                                ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/5'
                                : 'border-gray-800 hover:border-gray-700'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                Pending Approval
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                                <ShieldAlert size={16} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2 flex items-center gap-2">
                            {unverifiedCount}
                            {unverifiedCount > 0 && (
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                            )}
                        </div>
                        <span className="text-xs text-amber-400/80 mt-1 block">Requires KYC review</span>
                    </div>

                    <div
                        onClick={() => setActiveTab('VERIFIED')}
                        className={`bg-gray-900 border p-5 rounded-2xl cursor-pointer transition ${
                            activeTab === 'VERIFIED'
                                ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/5'
                                : 'border-gray-800 hover:border-gray-700'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Verified</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                                <ShieldCheck size={16} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
                            {verifiedCount}
                        </div>
                        <span className="text-xs text-emerald-400/80 mt-1 block">Active and verified</span>
                    </div>

                    <div
                        onClick={() => setActiveTab('BLOCKED')}
                        className={`bg-gray-900 border p-5 rounded-2xl cursor-pointer transition ${
                            activeTab === 'BLOCKED'
                                ? 'border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-500/5'
                                : 'border-gray-800 hover:border-gray-700'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Blocked</span>
                            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                                <Ban size={16} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2">
                            {blockedCount}
                        </div>
                        <span className="text-xs text-rose-400/80 mt-1 block">Access revoked</span>
                    </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-gray-900/60 p-2.5 rounded-2xl border border-gray-800">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('ALL')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                                activeTab === 'ALL'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                            }`}
                        >
                            All Agents ({agents.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('UNVERIFIED')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'UNVERIFIED'
                                    ? 'bg-amber-500 text-gray-950 shadow-sm'
                                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-gray-800/60'
                            }`}
                        >
                            <Clock size={14} />
                            Pending Verification ({unverifiedCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('VERIFIED')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'VERIFIED'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                            }`}
                        >
                            <ShieldCheck size={14} />
                            Verified ({verifiedCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('BLOCKED')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'BLOCKED'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                            }`}
                        >
                            <Ban size={14} />
                            Blocked ({blockedCount})
                        </button>
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full md:w-80">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search name, email, mobile..."
                            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-950 border border-gray-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Agents List / Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center text-gray-400">
                            <RefreshCw size={36} className="animate-spin text-blue-500 mb-4" />
                            <p className="text-base font-semibold text-gray-300">Loading Agents List...</p>
                            <p className="text-xs text-gray-500 mt-1">Retrieving agent roster from server</p>
                        </div>
                    ) : filteredAgents.length === 0 ? (
                        <div className="py-24 text-center px-4">
                            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto text-2xl text-gray-400 mb-4">
                                👥
                            </div>
                            <h3 className="text-lg font-bold text-white">No Agents Found</h3>
                            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                                {searchQuery
                                    ? `No agent matches "${searchQuery}". Try a different keyword.`
                                    : activeTab === 'UNVERIFIED'
                                    ? 'No agents currently waiting for verification. All clear!'
                                    : 'No agents registered under this category yet.'}
                            </p>
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="mt-4 text-xs font-semibold text-blue-400 hover:underline cursor-pointer"
                                >
                                    Clear search query
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-400 bg-gray-950/40">
                                        <th className="py-4 px-6 font-bold">Agent Details</th>
                                        <th className="py-4 px-6 font-bold">Contact Info</th>
                                        <th className="py-4 px-6 font-bold">Verification Status</th>
                                        <th className="py-4 px-6 font-bold">Access Status</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/80">
                                    {filteredAgents.map(agent => {
                                        const isActionLoading = actionLoadingId === agent.id;
                                        const isBlocked = agent.is_active === false;

                                        return (
                                            <tr
                                                key={agent.id}
                                                className="hover:bg-gray-800/40 transition-colors group"
                                            >
                                                {/* Agent Name & Identity */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-700 border border-gray-700 flex items-center justify-center font-bold text-sm text-blue-400 shrink-0">
                                                            {agent.full_name ? agent.full_name[0].toUpperCase() : 'A'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors flex items-center gap-2">
                                                                {agent.full_name}
                                                                {agent.is_verified && (
                                                                    <span title="Verified Agent">
                                                                        <CheckCircle2
                                                                            size={15}
                                                                            className="text-emerald-400 shrink-0"
                                                                        />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                                                <span>ID: #{agent.id.slice(0, 8)}</span>
                                                                {agent.agency_name && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="text-gray-300 font-medium">
                                                                            {agent.agency_name}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Contact Details */}
                                                <td className="py-4 px-6">
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex items-center gap-1.5 text-gray-300">
                                                            <Mail size={13} className="text-gray-500 shrink-0" />
                                                            <a
                                                                href={`mailto:${agent.email}`}
                                                                className="hover:underline hover:text-blue-400"
                                                            >
                                                                {agent.email}
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-400">
                                                            <Phone size={13} className="text-gray-500 shrink-0" />
                                                            <span>{agent.mobile_number || 'No phone provided'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Verification Status */}
                                                <td className="py-4 px-6">
                                                    {agent.is_verified ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                                                            <ShieldCheck size={13} className="text-emerald-400" />
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/90 text-amber-300 border border-amber-700/90 animate-pulse">
                                                            <Clock size={13} className="text-amber-400" />
                                                            Pending Verification
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Account Status (Active/Blocked) */}
                                                <td className="py-4 px-6">
                                                    {isBlocked ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-950/80 text-rose-300 border border-rose-800/60">
                                                            <Ban size={12} className="text-rose-400" />
                                                            Blocked
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                            Active
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Quick Inspect Details */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedAgent(agent)}
                                                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
                                                            title="Inspect Agent KYC details"
                                                        >
                                                            <Eye size={15} />
                                                        </button>

                                                        {/* Action: Verify / Approve if unverified */}
                                                        {!agent.is_verified && (
                                                            <button
                                                                type="button"
                                                                disabled={isActionLoading}
                                                                onClick={() =>
                                                                    setConfirmModal({
                                                                        open: true,
                                                                        type: 'VERIFY',
                                                                        agent,
                                                                    })
                                                                }
                                                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                                                            >
                                                                <CheckCircle size={13} />
                                                                Approve
                                                            </button>
                                                        )}

                                                        {/* Action: Block / Unblock */}
                                                        {isBlocked ? (
                                                            <button
                                                                type="button"
                                                                disabled={isActionLoading}
                                                                onClick={() =>
                                                                    setConfirmModal({
                                                                        open: true,
                                                                        type: 'UNBLOCK',
                                                                        agent,
                                                                    })
                                                                }
                                                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 border border-blue-800/60 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                                            >
                                                                Unblock
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                disabled={isActionLoading}
                                                                onClick={() =>
                                                                    setConfirmModal({
                                                                        open: true,
                                                                        type: 'BLOCK',
                                                                        agent,
                                                                    })
                                                                }
                                                                className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/60 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                                                title="Revoke access"
                                                            >
                                                                <Ban size={13} />
                                                                Block
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Agent KYC & Details Inspector Modal */}
            {selectedAgent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setSelectedAgent(null)}
                >
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setSelectedAgent(null)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition"
                        >
                            <X size={18} />
                        </button>

                        {/* Modal Header */}
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                                {selectedAgent.full_name ? selectedAgent.full_name[0].toUpperCase() : 'A'}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    {selectedAgent.full_name}
                                    {selectedAgent.is_verified && (
                                        <CheckCircle2 size={18} className="text-emerald-400" />
                                    )}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Agent ID: #{selectedAgent.id}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span
                                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                                            selectedAgent.is_verified
                                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                                : 'bg-amber-950 text-amber-300 border-amber-800'
                                        }`}
                                    >
                                        {selectedAgent.is_verified ? 'Verified Agent' : 'Verification Pending'}
                                    </span>
                                    <span
                                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                                            selectedAgent.is_active !== false
                                                ? 'bg-gray-800 text-gray-300 border-gray-700'
                                                : 'bg-rose-950 text-rose-300 border-rose-800'
                                        }`}
                                    >
                                        {selectedAgent.is_active !== false ? 'Active' : 'Blocked'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* KYC & Identity Checklist */}
                        <div className="mt-6 border-t border-gray-800 pt-5 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Verification & Contact Profile
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-950/70 p-3.5 rounded-xl border border-gray-800">
                                    <span className="text-xs text-gray-500 block">Email Address</span>
                                    <span className="font-semibold text-gray-200 break-all">{selectedAgent.email}</span>
                                </div>

                                <div className="bg-gray-950/70 p-3.5 rounded-xl border border-gray-800">
                                    <span className="text-xs text-gray-500 block">Mobile Phone</span>
                                    <span className="font-semibold text-gray-200">
                                        {selectedAgent.mobile_number || 'Not provided'}
                                    </span>
                                </div>

                                <div className="bg-gray-950/70 p-3.5 rounded-xl border border-gray-800">
                                    <span className="text-xs text-gray-500 block">Role / Type</span>
                                    <span className="font-semibold text-blue-400 uppercase">{selectedAgent.user_type}</span>
                                </div>

                                <div className="bg-gray-950/70 p-3.5 rounded-xl border border-gray-800">
                                    <span className="text-xs text-gray-500 block">Registration Date</span>
                                    <span className="font-semibold text-gray-300">
                                        {selectedAgent.created_at
                                            ? new Date(selectedAgent.created_at).toLocaleDateString()
                                            : 'Recent'}
                                    </span>
                                </div>
                            </div>

                            {/* Verification Checklist */}
                            <div className="bg-gray-950/60 p-4 rounded-xl border border-gray-800 space-y-2.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                                    Onboarding Checks
                                </span>
                                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                                    <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                                    <span>Mobile & Email credential formats authenticated</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                                    <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                                    <span>Agent profile created with permissions restricted to unverified tier</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                                    {selectedAgent.is_verified ? (
                                        <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                                    ) : (
                                        <Clock size={15} className="text-amber-400 shrink-0" />
                                    )}
                                    <span>Super Admin manual KYC verification review</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="mt-6 pt-5 border-t border-gray-800 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedAgent(null)}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                            >
                                Close
                            </button>

                            <div className="flex items-center gap-2">
                                {!selectedAgent.is_verified && (
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === selectedAgent.id}
                                        onClick={() => handleVerifyAgent(selectedAgent)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <ShieldCheck size={16} />
                                        Approve & Verify
                                    </button>
                                )}

                                {selectedAgent.is_active !== false ? (
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === selectedAgent.id}
                                        onClick={() => handleDeactivateAgent(selectedAgent)}
                                        className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Ban size={15} />
                                        Block Agent
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === selectedAgent.id}
                                        onClick={() => handleReactivateAgent(selectedAgent)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-50"
                                    >
                                        Unblock
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog Modal */}
            {confirmModal.open && confirmModal.agent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setConfirmModal({ open: false, type: 'VERIFY', agent: null })}
                >
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                                confirmModal.type === 'VERIFY'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                        >
                            {confirmModal.type === 'VERIFY' ? (
                                <ShieldCheck size={24} />
                            ) : (
                                <Ban size={24} />
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-white">
                            {confirmModal.type === 'VERIFY'
                                ? `Verify "${confirmModal.agent.full_name}"?`
                                : confirmModal.type === 'BLOCK'
                                ? `Block "${confirmModal.agent.full_name}"?`
                                : `Unblock "${confirmModal.agent.full_name}"?`}
                        </h3>

                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                            {confirmModal.type === 'VERIFY'
                                ? 'Approving this agent marks their KYC as verified and enables full dashboard capabilities according to their membership plan.'
                                : confirmModal.type === 'BLOCK'
                                ? 'Blocking this agent will immediately revoke their ability to access listings, post plots, or receive inquiries.'
                                : 'Unblocking will restore their account access and active status.'}
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ open: false, type: 'VERIFY', agent: null })}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={Boolean(actionLoadingId)}
                                onClick={() => {
                                    if (confirmModal.type === 'VERIFY') {
                                        handleVerifyAgent(confirmModal.agent!);
                                    } else if (confirmModal.type === 'BLOCK') {
                                        handleDeactivateAgent(confirmModal.agent!);
                                    } else {
                                        handleReactivateAgent(confirmModal.agent!);
                                    }
                                }}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-lg cursor-pointer disabled:opacity-50 ${
                                    confirmModal.type === 'VERIFY'
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                                }`}
                            >
                                {actionLoadingId ? (
                                    <RefreshCw size={16} className="animate-spin inline" />
                                ) : confirmModal.type === 'VERIFY' ? (
                                    'Confirm Verification'
                                ) : confirmModal.type === 'BLOCK' ? (
                                    'Confirm Block'
                                ) : (
                                    'Confirm Unblock'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
