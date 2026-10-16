import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import AdminNavbar from '../../components/admin/AdminNavbar';
import ApiErrorAlert from '../../components/alter_box/ApiErrorAlert';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import { getUserProfile, isAgent } from '../../lib/auth';
import {
    Phone,
    Mail,
    Clock,
    User,
    CheckCircle2,
    Building2,
    Layers,
    Search,
    RefreshCw,
    MessageSquare,
    ChevronDown,
    Save,
    AlertCircle,
    Calendar,
    Filter
} from 'lucide-react';

export interface CallQueryRecord {
    id: string;
    venture?: string;
    venture_name?: string;
    plot?: string;
    plot_number?: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    message?: string;
    preferred_call_time?: string;
    status: 'PENDING' | 'CONTACTED' | 'RESOLVED' | 'CLOSED';
    notes?: string;
    created_at: string;
}

export default function AdminCallQueriesPage() {
    const navigate = useNavigate();
    const user = getUserProfile();
    const [queries, setQueries] = useState<CallQueryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedQuery, setSelectedQuery] = useState<CallQueryRecord | null>(null);
    const [editNotes, setEditNotes] = useState('');
    const [editStatus, setEditStatus] = useState<CallQueryRecord['status']>('CONTACTED');

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    const fetchQueries = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch(ENDPOINTS.callQueries());
            const list: CallQueryRecord[] = Array.isArray(data)
                ? data
                : data?.results || [];
            setQueries(list);
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to fetch call queries.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    const handleUpdateStatus = async (queryId: string, newStatus: CallQueryRecord['status'], notes?: string) => {
        setUpdatingId(queryId);
        try {
            const updated = await apiFetch(ENDPOINTS.callQueryDetail(queryId), {
                method: 'PATCH',
                body: JSON.stringify({
                    status: newStatus,
                    notes: notes !== undefined ? notes : undefined,
                }),
            });

            setQueries(prev => prev.map(q => (q.id === queryId ? { ...q, ...updated } : q)));
            if (selectedQuery?.id === queryId) {
                setSelectedQuery(null);
            }
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to update query status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredQueries = queries.filter(q => {
        if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
        if (!searchQuery.trim()) return true;
        const s = searchQuery.toLowerCase();
        return (
            q.customer_name?.toLowerCase().includes(s) ||
            q.customer_phone?.toLowerCase().includes(s) ||
            q.customer_email?.toLowerCase().includes(s) ||
            q.venture_name?.toLowerCase().includes(s) ||
            q.plot_number?.toLowerCase().includes(s)
        );
    });

    const pendingCount = queries.filter(q => q.status === 'PENDING').length;
    const contactedCount = queries.filter(q => q.status === 'CONTACTED').length;
    const resolvedCount = queries.filter(q => q.status === 'RESOLVED').length;

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            <AdminNavbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                                <Phone size={12} />
                                {isAgent(user) ? 'Agent Inquiries' : 'Customer Leads'}
                            </span>
                            <span className="text-gray-500 text-xs">•</span>
                            <span className="text-gray-400 text-xs">Customer Call Queries & Callback Requests</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Call Query Leads
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                            Follow up on customer inquiries for plots and scheduled callback slots.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fetchQueries}
                            disabled={loading}
                            className="px-3.5 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <ApiErrorAlert
                        message={error}
                        onRetry={fetchQueries}
                        onClose={() => setError('')}
                    />
                )}

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-900/60 border border-amber-500/20 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-2">
                            <span>Pending Callback</span>
                            <Clock size={16} />
                        </div>
                        <div className="text-2xl font-extrabold text-white">{pendingCount}</div>
                    </div>

                    <div className="bg-gray-900/60 border border-blue-500/20 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-blue-400 font-bold mb-2">
                            <span>Contacted</span>
                            <Phone size={16} />
                        </div>
                        <div className="text-2xl font-extrabold text-white">{contactedCount}</div>
                    </div>

                    <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-2">
                            <span>Resolved / Converted</span>
                            <CheckCircle2 size={16} />
                        </div>
                        <div className="text-2xl font-extrabold text-white">{resolvedCount}</div>
                    </div>

                    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-gray-400 font-bold mb-2">
                            <span>Total Leads</span>
                            <MessageSquare size={16} />
                        </div>
                        <div className="text-2xl font-extrabold text-white">{queries.length}</div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/40 p-2 rounded-2xl border border-gray-800">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {['ALL', 'PENDING', 'CONTACTED', 'RESOLVED', 'CLOSED'].map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setStatusFilter(st)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    statusFilter === st
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search size={14} className="absolute left-3.5 top-3 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name, phone, plot..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* Queries List */}
                <div className="space-y-4">
                    {loading && (
                        <div className="p-12 text-center text-gray-400 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <RefreshCw size={24} className="animate-spin text-emerald-500 mx-auto mb-3" />
                            <p className="text-sm">Loading call queries...</p>
                        </div>
                    )}

                    {!loading && filteredQueries.length === 0 && (
                        <div className="p-12 text-center bg-gray-900/30 rounded-2xl border border-gray-800">
                            <Phone size={28} className="text-gray-500 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-white mb-1">No Call Queries Found</h3>
                            <p className="text-xs text-gray-400">
                                {statusFilter === 'ALL'
                                    ? 'No inquiries submitted yet.'
                                    : `No queries with status "${statusFilter}".`}
                            </p>
                        </div>
                    )}

                    {!loading && filteredQueries.map((query) => {
                        const isUpdating = updatingId === query.id;

                        return (
                            <div
                                key={query.id}
                                className="bg-gray-900/70 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                            >
                                <div className="space-y-2.5 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                                            <User size={15} className="text-gray-400" />
                                            {query.customer_name}
                                        </h3>

                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                            query.status === 'PENDING'
                                                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                                : query.status === 'CONTACTED'
                                                ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                                                : query.status === 'RESOLVED'
                                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                                : 'bg-gray-800 text-gray-400 border-gray-700'
                                        }`}>
                                            {query.status}
                                        </span>

                                        {query.preferred_call_time && (
                                            <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <Clock size={11} />
                                                Preferred: {query.preferred_call_time}
                                            </span>
                                        )}
                                    </div>

                                    {/* Contact & Property Info */}
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
                                        <a
                                            href={`tel:${query.customer_phone}`}
                                            className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                                        >
                                            <Phone size={12} />
                                            {query.customer_phone}
                                        </a>

                                        {query.customer_email && (
                                            <a
                                                href={`mailto:${query.customer_email}`}
                                                className="text-gray-400 hover:text-white flex items-center gap-1"
                                            >
                                                <Mail size={12} />
                                                {query.customer_email}
                                            </a>
                                        )}

                                        {(query.venture_name || query.plot_number) && (
                                            <span className="text-gray-400 flex items-center gap-1">
                                                <Building2 size={12} className="text-blue-400" />
                                                {query.venture_name || 'Venture'}
                                                {query.plot_number && ` • Plot #${query.plot_number}`}
                                            </span>
                                        )}

                                        <span className="text-gray-500 text-[11px]">
                                            {query.created_at ? new Date(query.created_at).toLocaleString() : ''}
                                        </span>
                                    </div>

                                    {query.message && (
                                        <p className="text-xs text-gray-400 italic bg-gray-950/60 p-2.5 rounded-xl border border-gray-800/80 max-w-2xl">
                                            "{query.message}"
                                        </p>
                                    )}

                                    {query.notes && (
                                        <div className="text-xs text-blue-300 bg-blue-950/30 border border-blue-900/50 p-2 rounded-lg">
                                            <strong>Follow-up Note:</strong> {query.notes}
                                        </div>
                                    )}
                                </div>

                                {/* Status Update Actions */}
                                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-800">
                                    <select
                                        disabled={isUpdating}
                                        value={query.status}
                                        onChange={(e) => handleUpdateStatus(query.id, e.target.value as CallQueryRecord['status'])}
                                        className="bg-gray-950 border border-gray-800 text-xs font-semibold rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="PENDING">PENDING</option>
                                        <option value="CONTACTED">CONTACTED</option>
                                        <option value="RESOLVED">RESOLVED</option>
                                        <option value="CLOSED">CLOSED</option>
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedQuery(query);
                                            setEditStatus(query.status);
                                            setEditNotes(query.notes || '');
                                        }}
                                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-xl transition cursor-pointer"
                                    >
                                        Add Note
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Note & Status Modal */}
            {selectedQuery && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm"
                    onClick={() => setSelectedQuery(null)}
                >
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-white mb-1">
                            Follow-up Note: {selectedQuery.customer_name}
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Update lead status and save callback details.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                    Lead Status
                                </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as CallQueryRecord['status'])}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="CONTACTED">CONTACTED</option>
                                    <option value="RESOLVED">RESOLVED</option>
                                    <option value="CLOSED">CLOSED</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                    Callback / Site Visit Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    placeholder="e.g. Called customer, interested in Plot 104, scheduled site visit this Saturday 11am."
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedQuery(null)}
                                    className="flex-1 py-2 rounded-xl border border-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-800 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(selectedQuery.id, editStatus, editNotes)}
                                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
                                >
                                    Save Note & Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
