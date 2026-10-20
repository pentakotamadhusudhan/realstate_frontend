import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building,
    Plus,
    Search,
    Filter,
    MapPin,
    Eye,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    Layers,
    ArrowUpRight,
    TrendingUp,
    Sparkles,
    LayoutGrid,
    Table as TableIcon,
    Loader2,
    Calendar,
    UserCheck,
    Navigation,
} from 'lucide-react';
import type { Apartment } from '../../types/apartment';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import { formatDate, formatShortDate } from '../../utils/apartmentHelpers';
import AdminNavbar from '../../components/admin/AdminNavbar';
import ApartmentFormModal from '../../components/admin/ApartmentFormModal';
import LoadingScreen from '../../components/LoadingComponent';
import ApiErrorAlert from '../../components/alter_box/ApiErrorAlert';

export default function AdminApartmentsPage() {
    const navigate = useNavigate();

    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [sortBy, setSortBy] = useState<'NEWEST' | 'NAME' | 'FLATS' | 'SOLD'>('NEWEST');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
    const [deletingApartment, setDeletingApartment] = useState<Apartment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    async function loadApartments() {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(ENDPOINTS.apartments());
            const list = Array.isArray(data) ? data : data?.results || [];
            setApartments(list);
        } catch (err: any) {
            console.error('Failed to load apartments:', err);
            setError(err.message || 'Failed to load apartments.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadApartments();
    }, []);

    // Filter and sort list
    const filteredApartments = useMemo(() => {
        let result = apartments.filter((apt) => {
            const matchesSearch =
                apt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.description?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === 'ACTIVE') return apt.is_active;
            if (statusFilter === 'INACTIVE') return !apt.is_active;
            return true;
        });

        result.sort((a, b) => {
            if (sortBy === 'NAME') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'FLATS') return (b.total_flats || 0) - (a.total_flats || 0);
            if (sortBy === 'SOLD') return (b.sold || 0) - (a.sold || 0);
            // Default NEWEST
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        return result;
    }, [apartments, searchTerm, statusFilter, sortBy]);

    // Quick stats
    const totalFlatsCount = useMemo(() => apartments.reduce((sum, a) => sum + (a.total_flats || 0), 0), [apartments]);
    const totalSoldCount = useMemo(() => apartments.reduce((sum, a) => sum + (a.sold || 0), 0), [apartments]);
    const activeApartmentsCount = useMemo(() => apartments.filter((a) => a.is_active).length, [apartments]);
    const overallSoldPercentage = totalFlatsCount > 0 ? Math.round((totalSoldCount / totalFlatsCount) * 100) : 0;

    // Toggle active state
    async function handleToggleActive(apartment: Apartment, e: React.MouseEvent) {
        e.stopPropagation();
        const updatedStatus = !apartment.is_active;

        try {
            // Optimistic update
            setApartments((prev) =>
                prev.map((a) => (a.id === apartment.id ? { ...a, is_active: updatedStatus } : a))
            );

            await apiFetch(ENDPOINTS.apartmentDetail(apartment.id), {
                method: 'PATCH',
                body: JSON.stringify({ is_active: updatedStatus }),
            });
        } catch (err: any) {
            console.error('Failed to update status:', err);
            // Revert
            setApartments((prev) =>
                prev.map((a) => (a.id === apartment.id ? { ...a, is_active: apartment.is_active } : a))
            );
            alert('Failed to update status.');
        }
    }

    // Delete apartment
    async function confirmDelete() {
        if (!deletingApartment) return;
        setIsDeleting(true);

        try {
            await apiFetch(ENDPOINTS.apartmentDetail(deletingApartment.id), {
                method: 'DELETE',
            });
            setApartments((prev) => prev.filter((a) => a.id !== deletingApartment.id));
            setDeletingApartment(null);
        } catch (err: any) {
            console.error('Failed to delete apartment:', err);
            alert(err.message || 'Failed to delete apartment.');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            <AdminNavbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Title & Action */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Building size={22} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                                    Apartment Complexes
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800">
                                        {apartments.length} Total
                                    </span>
                                </h1>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Manage residential & commercial towers, track flat availability, facing and pricing
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>Add New Apartment</span>
                        </button>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm hover:border-gray-700 transition">
                        <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                            <span>Apartment Towers</span>
                            <span className="p-1.5 rounded-lg bg-blue-950 text-blue-400">
                                <Building size={14} />
                            </span>
                        </div>
                        <div className="text-2xl font-extrabold text-white">{apartments.length}</div>
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {activeApartmentsCount} Active Buildings
                        </div>
                    </div>

                    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm hover:border-gray-700 transition">
                        <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                            <span>Total Units</span>
                            <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400">
                                <Layers size={14} />
                            </span>
                        </div>
                        <div className="text-2xl font-extrabold text-white">{totalFlatsCount}</div>
                        <div className="text-[11px] text-gray-400 mt-1">Configured inventory</div>
                    </div>

                    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm hover:border-gray-700 transition">
                        <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                            <span>Sold Units</span>
                            <span className="p-1.5 rounded-lg bg-rose-950 text-rose-400">
                                <TrendingUp size={14} />
                            </span>
                        </div>
                        <div className="text-2xl font-extrabold text-rose-400">{totalSoldCount}</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                            {overallSoldPercentage}% Sold out
                        </div>
                    </div>

                    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm hover:border-gray-700 transition">
                        <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                            <span>Available Units</span>
                            <span className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400">
                                <Sparkles size={14} />
                            </span>
                        </div>
                        <div className="text-2xl font-extrabold text-emerald-400">
                            {Math.max(0, totalFlatsCount - totalSoldCount)}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">Ready for sale</div>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4">
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, location..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                        {/* Status Filter */}
                        <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('ALL')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                                    statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('ACTIVE')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                                    statusFilter === 'ACTIVE'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('INACTIVE')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                                    statusFilter === 'INACTIVE'
                                        ? 'bg-zinc-700 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Inactive
                            </button>
                        </div>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="NEWEST">Newest First</option>
                            <option value="NAME">Name (A-Z)</option>
                            <option value="FLATS">Most Flats</option>
                            <option value="SOLD">Most Sold</option>
                        </select>

                        {/* View toggle */}
                        <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="Table View"
                            >
                                <TableIcon size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && <LoadingScreen />}

                {/* Error Alert */}
                {error && (
                    <ApiErrorAlert
                        message={error}
                        onRetry={loadApartments}
                        onClose={() => setError(null)}
                    />
                )}

                {/* Empty State */}
                {!loading && filteredApartments.length === 0 && (
                    <div className="text-center py-20 bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
                        <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4 text-gray-500">
                            <Building size={28} />
                        </div>
                        <h3 className="text-base font-bold text-white mb-1">No Apartments Found</h3>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
                            {searchTerm || statusFilter !== 'ALL'
                                ? 'No apartments match your search filters. Try resetting the filters.'
                                : 'Start building your portfolio by adding your first apartment building.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
                        >
                            <Plus size={14} />
                            Create Apartment
                        </button>
                    </div>
                )}

                {/* Content: Grid Cards */}
                {!loading && filteredApartments.length > 0 && viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApartments.map((apartment) => {
                            const total = apartment.total_flats || 0;
                            const soldCount = apartment.sold || 0;
                            const availableCount = Math.max(0, total - soldCount);
                            const soldPercent = total > 0 ? Math.round((soldCount / total) * 100) : 0;

                            return (
                                <div
                                    key={apartment.id}
                                    onClick={() => navigate(`/admin/apartments/${apartment.id}`)}
                                    className="group bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                                >
                                    {/* Cover Image / Gradient */}
                                    <div className="relative h-44 bg-gray-950 overflow-hidden">
                                        {apartment.cover_image ? (
                                            <img
                                                src={apartment.cover_image}
                                                alt={apartment.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-gray-950 via-gray-900 to-blue-950/40 text-gray-600 group-hover:text-blue-400 transition-colors">
                                                <Building size={42} strokeWidth={1.5} />
                                                <span className="text-[11px] font-medium text-gray-500 mt-2">
                                                    Apartment Complex
                                                </span>
                                            </div>
                                        )}

                                        {/* Overlay Badges */}
                                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                            {/* Status Badge */}
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleActive(apartment, e)}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md transition cursor-pointer ${
                                                    apartment.is_active
                                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                                        : 'bg-zinc-950/80 text-zinc-400 border-zinc-800'
                                                }`}
                                                title="Click to toggle active status"
                                            >
                                                {apartment.is_active ? '● Active' : '○ Inactive'}
                                            </button>

                                            {/* Quick Actions */}
                                            <div
                                                className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingApartment(apartment)}
                                                    className="p-1.5 rounded-lg bg-black/60 hover:bg-blue-600 text-white backdrop-blur-md transition cursor-pointer"
                                                    title="Edit Apartment"
                                                >
                                                    <Edit3 size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingApartment(apartment)}
                                                    className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white backdrop-blur-md transition cursor-pointer"
                                                    title="Delete Apartment"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Geo Tag */}
                                        {apartment.latitude && apartment.longitude && (
                                            <div className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-gray-300 flex items-center gap-1 font-mono">
                                                <Navigation size={10} className="text-blue-400" />
                                                {Number(apartment.latitude).toFixed(4)}, {Number(apartment.longitude).toFixed(4)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                                    {apartment.name}
                                                </h3>
                                                <ArrowUpRight
                                                    size={16}
                                                    className="text-gray-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5"
                                                />
                                            </div>

                                            <p className="text-xs text-gray-400 flex items-center gap-1.5 line-clamp-1 mb-4">
                                                <MapPin size={13} className="text-blue-400 shrink-0" />
                                                <span>{apartment.address}</span>
                                            </p>

                                            {/* Flat Inventory Metrics */}
                                            <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-950/70 border border-gray-800/80 rounded-xl text-center mb-4">
                                                <div>
                                                    <span className="text-[10px] text-gray-500 block uppercase">Total</span>
                                                    <span className="text-sm font-bold text-white">{total}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-rose-400 block uppercase">Sold</span>
                                                    <span className="text-sm font-bold text-rose-400">{soldCount}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-emerald-400 block uppercase">Available</span>
                                                    <span className="text-sm font-bold text-emerald-400">{availableCount}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1 mb-4">
                                                <div className="flex justify-between text-[10px] text-gray-400">
                                                    <span>Sales Progress</span>
                                                    <span className="font-semibold text-gray-300">{soldPercent}% Sold</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(100, soldPercent)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="border-t border-gray-800/80 pt-3 flex items-center justify-between text-[11px] text-gray-500">
                                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                                                <UserCheck size={12} className="text-gray-400" />
                                                {apartment.created_by_name || 'Admin'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatShortDate(apartment.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Content: Table View */}
                {!loading && filteredApartments.length > 0 && viewMode === 'table' && (
                    <div className="border border-gray-800 rounded-2xl overflow-hidden bg-gray-900 shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-gray-950 text-gray-400 border-b border-gray-800 font-semibold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="py-3.5 px-4">Building Name</th>
                                        <th className="py-3.5 px-4">Location / Address</th>
                                        <th className="py-3.5 px-3">Coordinates (Lati / Long)</th>
                                        <th className="py-3.5 px-3 text-center">Total</th>
                                        <th className="py-3.5 px-3 text-center">Sold</th>
                                        <th className="py-3.5 px-3 text-center">Available</th>
                                        <th className="py-3.5 px-3 text-center">Status</th>
                                        <th className="py-3.5 px-4">Created By</th>
                                        <th className="py-3.5 px-4">Date</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/70">
                                    {filteredApartments.map((apartment) => {
                                        const total = apartment.total_flats || 0;
                                        const soldCount = apartment.sold || 0;
                                        const availableCount = Math.max(0, total - soldCount);

                                        return (
                                            <tr
                                                key={apartment.id}
                                                onClick={() => navigate(`/admin/apartments/${apartment.id}`)}
                                                className="hover:bg-gray-800/40 transition cursor-pointer"
                                            >
                                                <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-900 flex items-center justify-center text-blue-400 shrink-0">
                                                        <Building size={14} />
                                                    </div>
                                                    <span className="hover:text-blue-400 transition">{apartment.name}</span>
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-400 max-w-xs truncate">
                                                    {apartment.address}
                                                </td>
                                                <td className="py-3.5 px-3 text-gray-400 font-mono text-[11px]">
                                                    {apartment.latitude && apartment.longitude
                                                        ? `${Number(apartment.latitude).toFixed(4)}, ${Number(apartment.longitude).toFixed(4)}`
                                                        : '—'}
                                                </td>
                                                <td className="py-3.5 px-3 text-center font-semibold text-white">
                                                    {total}
                                                </td>
                                                <td className="py-3.5 px-3 text-center font-semibold text-rose-400">
                                                    {soldCount}
                                                </td>
                                                <td className="py-3.5 px-3 text-center font-semibold text-emerald-400">
                                                    {availableCount}
                                                </td>
                                                <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleToggleActive(apartment, e)}
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                                            apartment.is_active
                                                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                                                : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                                                        }`}
                                                    >
                                                        {apartment.is_active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-400">
                                                    {apartment.created_by_name || 'Admin'}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                                                    {formatShortDate(apartment.created_at)}
                                                </td>
                                                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/admin/apartments/${apartment.id}`)}
                                                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white transition cursor-pointer"
                                                            title="View & Manage Flats"
                                                        >
                                                            <Layers size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingApartment(apartment)}
                                                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-indigo-600 text-gray-300 hover:text-white transition cursor-pointer"
                                                            title="Edit Apartment"
                                                        >
                                                            <Edit3 size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingApartment(apartment)}
                                                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-rose-600 text-gray-300 hover:text-white transition cursor-pointer"
                                                            title="Delete Apartment"
                                                        >
                                                            <Trash2 size={13} />
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

            {/* Create Apartment Modal */}
            <ApartmentFormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={(newApt) => {
                    setApartments((prev) => [newApt, ...prev]);
                }}
            />

            {/* Edit Apartment Modal */}
            {editingApartment && (
                <ApartmentFormModal
                    isOpen={Boolean(editingApartment)}
                    onClose={() => setEditingApartment(null)}
                    apartment={editingApartment}
                    onSuccess={(updated) => {
                        setApartments((prev) =>
                            prev.map((a) => (a.id === updated.id ? updated : a))
                        );
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deletingApartment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-900 flex items-center justify-center text-rose-400 mx-auto mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-base font-bold text-white text-center mb-1">
                            Delete Apartment?
                        </h3>
                        <p className="text-xs text-gray-400 text-center mb-6">
                            Are you sure you want to delete <strong className="text-white">"{deletingApartment.name}"</strong>? All associated flats and media files will also be removed.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeletingApartment(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50 cursor-pointer"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Confirm Delete</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
