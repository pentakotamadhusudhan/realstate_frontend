import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building,
    Home,
    Plus,
    Sparkles,
    Search,
    Filter,
    MapPin,
    Calendar,
    UserCheck,
    IndianRupee,
    Compass,
    Layers,
    Image as ImageIcon,
    Edit3,
    Trash2,
    ChevronLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Navigation,
    Info,
    ArrowUpDown,
    Check,
} from 'lucide-react';
import type {
    Apartment,
    Flat,
    FlatFacing,
    FlatStatus,
    FlatType,
} from '../../types/apartment';
import {
    FLAT_FACINGS,
    FLAT_STATUSES,
    FLAT_TYPES,
} from '../../types/apartment';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import {
    computeFlatStats,
    formatCurrencyFull,
    formatDate,
    formatPrice,
    formatShortDate,
    getFacingIconAndLabel,
    getStatusBadge,
    getTypeBadgeColor,
} from '../../utils/apartmentHelpers';
import AdminNavbar from '../../components/admin/AdminNavbar';
import FlatFormModal from '../../components/admin/FlatFormModal';
import BulkFlatModal from '../../components/admin/BulkFlatModal';
import ApartmentFormModal from '../../components/admin/ApartmentFormModal';
import ApartmentMediaModal from '../../components/admin/ApartmentMediaModal';
import LoadingScreen from '../../components/LoadingComponent';
import ApiErrorAlert from '../../components/alter_box/ApiErrorAlert';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function AdminApartmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [apartment, setApartment] = useState<Apartment | null>(null);
    const [flats, setFlats] = useState<Flat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Active tab: 'flats' | 'media' | 'overview'
    const [activeTab, setActiveTab] = useState<'flats' | 'media' | 'overview'>('flats');

    // Flats filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [facingFilter, setFacingFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'NUMBER' | 'FLOOR' | 'PRICE_ASC' | 'PRICE_DESC' | 'AREA'>('NUMBER');

    // Modals
    const [showAddFlatModal, setShowAddFlatModal] = useState(false);
    const [showBulkFlatModal, setShowBulkFlatModal] = useState(false);
    const [editingFlat, setEditingFlat] = useState<Flat | null>(null);
    const [deletingFlat, setDeletingFlat] = useState<Flat | null>(null);
    const [isDeletingFlat, setIsDeletingFlat] = useState(false);

    // Apartment edit & media modals
    const [showEditApartmentModal, setShowEditApartmentModal] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [flatForMedia, setFlatForMedia] = useState<Flat | null>(null);

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    async function loadApartmentData() {
        if (!id) return;
        setLoading(true);
        setError(null);

        try {
            // Load apartment detail (includes flats and media)
            const aptData = await apiFetch(ENDPOINTS.apartmentDetail(id));
            setApartment(aptData);

            // Also load flat list explicitly to ensure latest query results
            const flatData = await apiFetch(ENDPOINTS.apartmentFlats(id));
            const flatList = Array.isArray(flatData) ? flatData : flatData?.results || [];
            setFlats(flatList);
        } catch (err: any) {
            console.error('Failed to load apartment:', err);
            setError(err.message || 'Failed to load apartment details.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadApartmentData();
    }, [id]);

    // Flat stats computation
    const flatStats = useMemo(() => computeFlatStats(flats), [flats]);

    // Filtered flats list
    const filteredFlats = useMemo(() => {
        let result = flats.filter((flat) => {
            const matchesSearch =
                flat.flat_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                flat.description?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;
            if (statusFilter !== 'ALL' && flat.status !== statusFilter) return false;
            if (typeFilter !== 'ALL' && flat.type !== typeFilter) return false;
            if (facingFilter !== 'ALL' && flat.facing !== facingFilter) return false;

            return true;
        });

        result.sort((a, b) => {
            if (sortBy === 'PRICE_ASC') {
                return (Number(a.price) || 0) - (Number(b.price) || 0);
            }
            if (sortBy === 'PRICE_DESC') {
                return (Number(b.price) || 0) - (Number(a.price) || 0);
            }
            if (sortBy === 'FLOOR') {
                return (a.floor_number || 0) - (b.floor_number || 0);
            }
            if (sortBy === 'AREA') {
                return (Number(b.area) || 0) - (Number(a.area) || 0);
            }
            // Default: by flat number
            return (a.flat_number || '').localeCompare(b.flat_number || '', undefined, {
                numeric: true,
                sensitivity: 'base',
            });
        });

        return result;
    }, [flats, searchTerm, statusFilter, typeFilter, facingFilter, sortBy]);

    // Fast status switch on flat card
    async function handleQuickStatusChange(flat: Flat, newStatus: FlatStatus) {
        if (flat.status === newStatus) return;

        const previousStatus = flat.status;

        // Optimistic update
        setFlats((prev) =>
            prev.map((f) => (f.id === flat.id ? { ...f, status: newStatus } : f))
        );

        try {
            await apiFetch(ENDPOINTS.flatDetail(flat.id), {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });

            // Reload apartment to refresh synced sold count if status was sold
            const refreshed = await apiFetch(ENDPOINTS.apartmentDetail(id!));
            setApartment(refreshed);
        } catch (err: any) {
            console.error('Failed to update flat status:', err);
            // Revert
            setFlats((prev) =>
                prev.map((f) => (f.id === flat.id ? { ...f, status: previousStatus } : f))
            );
            alert('Failed to update status.');
        }
    }

    // Delete single flat
    async function confirmDeleteFlat() {
        if (!deletingFlat) return;
        setIsDeletingFlat(true);

        try {
            await apiFetch(ENDPOINTS.flatDetail(deletingFlat.id), {
                method: 'DELETE',
            });
            setFlats((prev) => prev.filter((f) => f.id !== deletingFlat.id));
            setDeletingFlat(null);

            // Refresh apartment counts
            if (id) {
                const refreshed = await apiFetch(ENDPOINTS.apartmentDetail(id));
                setApartment(refreshed);
            }
        } catch (err: any) {
            console.error('Failed to delete flat:', err);
            alert(err.message || 'Failed to delete flat unit.');
        } finally {
            setIsDeletingFlat(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex flex-col">
                <AdminNavbar />
                <div className="flex-1 flex items-center justify-center">
                    <LoadingScreen />
                </div>
            </div>
        );
    }

    if (!apartment) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex flex-col">
                <AdminNavbar />
                <div className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
                    <Building size={48} className="mx-auto text-gray-600 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Apartment Not Found</h2>
                    <p className="text-sm text-gray-400 mb-6">
                        The requested apartment building does not exist or has been removed.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/apartments')}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
                    >
                        Back to Apartments
                    </button>
                </div>
            </div>
        );
    }

    const latNum = apartment.latitude ? Number(apartment.latitude) : null;
    const lngNum = apartment.longitude ? Number(apartment.longitude) : null;

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            <AdminNavbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/apartments')}
                        className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                    >
                        <ChevronLeft size={14} />
                        Apartments
                    </button>
                    <span>/</span>
                    <span className="text-white font-medium truncate max-w-xs">{apartment.name}</span>
                </div>

                {/* Hero Header Banner */}
                <div className="relative rounded-3xl overflow-hidden border border-gray-800 bg-gray-900/90 shadow-2xl">
                    <div className="relative h-48 sm:h-56 bg-gray-950">
                        {apartment.cover_image ? (
                            <img
                                src={apartment.cover_image}
                                alt={apartment.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-purple-950/60 flex items-center justify-center">
                                <Building size={64} className="text-blue-500/30" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border backdrop-blur-md ${
                                    apartment.is_active
                                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                        : 'bg-zinc-950/80 text-zinc-400 border-zinc-800'
                                }`}
                            >
                                {apartment.is_active ? '● Active Building' : '○ Inactive / Draft'}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowMediaModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md text-xs font-medium border border-white/10 transition cursor-pointer"
                                >
                                    <ImageIcon size={14} />
                                    <span>Photos ({apartment.media?.length || 0})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditApartmentModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition cursor-pointer"
                                >
                                    <Edit3 size={14} />
                                    <span>Edit Details</span>
                                </button>
                            </div>
                        </div>

                        {/* Title and Info Overlay */}
                        <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                    {apartment.name}
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-300 flex items-center gap-1.5 mt-1">
                                    <MapPin size={15} className="text-blue-400 shrink-0" />
                                    <span>{apartment.address}</span>
                                </p>
                            </div>

                            {/* Geo badge */}
                            {latNum && lngNum && (
                                <div className="px-3 py-1.5 rounded-xl bg-gray-900/90 border border-gray-800 backdrop-blur-md text-xs text-gray-300 font-mono flex items-center gap-2 self-start sm:self-auto">
                                    <Navigation size={13} className="text-blue-400" />
                                    <span>
                                        {latNum.toFixed(6)}, {lngNum.toFixed(6)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="px-6 py-3.5 bg-gray-900/95 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <UserCheck size={14} className="text-blue-400" />
                                Created by: <strong className="text-gray-200">{apartment.created_by_name || 'Admin'}</strong>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-gray-500" />
                                Created: {formatDate(apartment.created_at)}
                            </span>
                            {apartment.updated_at && (
                                <span className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-gray-500" />
                                    Updated: {formatDate(apartment.updated_at)}
                                </span>
                            )}
                        </div>

                        <div className="text-xs">
                            Configured Units: <strong className="text-white">{apartment.total_flats}</strong> |
                            Sold Units: <strong className="text-rose-400">{apartment.sold}</strong>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-gray-400 block uppercase">Actual Flats</span>
                        <span className="text-xl font-bold text-white">{flats.length}</span>
                    </div>
                    <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-emerald-400 block uppercase">Opened</span>
                        <span className="text-xl font-bold text-emerald-400">{flatStats.opened}</span>
                    </div>
                    <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-amber-400 block uppercase">On Hold</span>
                        <span className="text-xl font-bold text-amber-400">{flatStats.hold}</span>
                    </div>
                    <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-rose-400 block uppercase">Sold</span>
                        <span className="text-xl font-bold text-rose-400">{flatStats.sold}</span>
                    </div>
                    <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-zinc-400 block uppercase">Not Opened</span>
                        <span className="text-xl font-bold text-zinc-400">{flatStats.notOpened}</span>
                    </div>
                    <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-indigo-400 block uppercase">Total Value</span>
                        <span className="text-base font-bold text-indigo-300">
                            {formatPrice(flatStats.totalValue)}
                        </span>
                    </div>
                </div>

                {/* Tabs Bar */}
                <div className="flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('flats')}
                            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'flats'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            <Home size={16} />
                            Flats Inventory ({flats.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('media')}
                            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'media'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            <ImageIcon size={16} />
                            Photos & Media ({apartment.media?.length || 0})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('overview')}
                            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            <MapPin size={16} />
                            Location & Overview
                        </button>
                    </div>

                    {activeTab === 'flats' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowBulkFlatModal(true)}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 transition cursor-pointer"
                            >
                                <Sparkles size={14} />
                                <span>Bulk Add Flats</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddFlatModal(true)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
                            >
                                <Plus size={14} />
                                <span>Add Flat</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* ═════════════════ TAB 1: FLATS INVENTORY ═════════════════ */}
                {activeTab === 'flats' && (
                    <div className="space-y-5">
                        {/* Filter Bar */}
                        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                {/* Search */}
                                <div className="relative lg:col-span-2">
                                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search flat number (e.g. 101, 204)..."
                                        className="w-full pl-9 pr-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="ALL">All Statuses ({flats.length})</option>
                                        <option value="OPENED">Opened ({flatStats.opened})</option>
                                        <option value="HOLD">On Hold ({flatStats.hold})</option>
                                        <option value="SOLD">Sold ({flatStats.sold})</option>
                                        <option value="NOT_OPENED">Not Opened ({flatStats.notOpened})</option>
                                    </select>
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="ALL">All Types (1BHK, 2BHK...)</option>
                                        {FLAT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Facing Filter */}
                                <div>
                                    <select
                                        value={facingFilter}
                                        onChange={(e) => setFacingFilter(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="ALL">All Facings (East, West...)</option>
                                        {FLAT_FACINGS.map((f) => (
                                            <option key={f.value} value={f.value}>
                                                {f.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Sort & Quick Filter Chips */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800/80 text-xs text-gray-400">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] text-gray-500 mr-1">Quick Filter:</span>
                                    {['ALL', 'OPENED', 'HOLD', 'SOLD', 'NOT_OPENED'].map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setStatusFilter(st)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                                                statusFilter === st
                                                    ? 'bg-blue-600 text-white border-blue-500'
                                                    : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                        <ArrowUpDown size={12} />
                                        Sort:
                                    </span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="px-2.5 py-1 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="NUMBER">Unit Number</option>
                                        <option value="FLOOR">Floor Level</option>
                                        <option value="PRICE_ASC">Price: Low to High</option>
                                        <option value="PRICE_DESC">Price: High to Low</option>
                                        <option value="AREA">Area Size</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Flat Units Grid */}
                        {filteredFlats.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                <Home size={36} className="mx-auto text-gray-600 mb-3" />
                                <h4 className="text-base font-bold text-white mb-1">No Flats Match Criteria</h4>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5">
                                    {flats.length === 0
                                        ? 'No flats created for this apartment yet. Add individual units or generate multiple flats in bulk.'
                                        : 'No flat units found with current search or status filters.'}
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkFlatModal(true)}
                                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
                                    >
                                        Bulk Generate Flats
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddFlatModal(true)}
                                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
                                    >
                                        Add Single Flat
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredFlats.map((flat) => {
                                    const stBadge = getStatusBadge(flat.status);
                                    const facingInfo = getFacingIconAndLabel(flat.facing);
                                    const priceNum = typeof flat.price === 'string' ? parseFloat(flat.price) : flat.price;
                                    const areaNum = typeof flat.area === 'string' ? parseFloat(flat.area) : flat.area;
                                    const rate = areaNum > 0 && priceNum > 0 ? Math.round(priceNum / areaNum) : null;

                                    return (
                                        <div
                                            key={flat.id}
                                            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 shadow-md transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                {/* Top Row: Unit, Floor, Status Dropdown */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-black text-white">
                                                                #{flat.flat_number}
                                                            </span>
                                                            <span
                                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getTypeBadgeColor(
                                                                    flat.type
                                                                )}`}
                                                            >
                                                                {flat.type}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-gray-500">
                                                            Floor {flat.floor_number || 1}
                                                        </span>
                                                    </div>

                                                    {/* Quick Status Selector */}
                                                    <select
                                                        value={flat.status}
                                                        onChange={(e) =>
                                                            handleQuickStatusChange(flat, e.target.value as FlatStatus)
                                                        }
                                                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border transition cursor-pointer ${stBadge.bg} ${stBadge.color} ${stBadge.border} focus:outline-none`}
                                                    >
                                                        {FLAT_STATUSES.map((s) => (
                                                            <option key={s.value} value={s.value}>
                                                                {s.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Specs: Area, Facing, Rate */}
                                                <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-950/70 border border-gray-800/80 rounded-xl text-xs mb-3">
                                                    <div>
                                                        <span className="text-[10px] text-gray-500 block">Area</span>
                                                        <span className="font-semibold text-gray-200">
                                                            {flat.area} sq.ft
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-gray-500 block">Facing</span>
                                                        <span className="font-semibold text-gray-200 flex items-center gap-1">
                                                            <span>{facingInfo.icon}</span>
                                                            <span>{facingInfo.label}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Price Header */}
                                                <div className="mb-3">
                                                    <span className="text-[10px] text-gray-500 block uppercase">Price</span>
                                                    <div className="flex items-baseline justify-between">
                                                        <span className="text-base font-extrabold text-emerald-400">
                                                            {formatPrice(priceNum)}
                                                        </span>
                                                        {rate !== null && (
                                                            <span className="text-[10px] text-gray-400">
                                                                ₹{rate.toLocaleString('en-IN')}/sqft
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-mono">
                                                        {formatCurrencyFull(priceNum)}
                                                    </span>
                                                </div>

                                                {/* Description */}
                                                {flat.description && (
                                                    <p className="text-xs text-gray-400 line-clamp-2 mb-3 italic">
                                                        "{flat.description}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Card Footer Actions */}
                                            <div className="border-t border-gray-800/80 pt-3 flex items-center justify-between text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setFlatForMedia(flat)}
                                                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition"
                                                >
                                                    <ImageIcon size={12} className="text-cyan-400" />
                                                    <span>Media ({flat.media?.length || 0})</span>
                                                </button>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingFlat(flat)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-950/40 transition cursor-pointer"
                                                        title="Edit Flat"
                                                    >
                                                        <Edit3 size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingFlat(flat)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                                                        title="Delete Flat"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ═════════════════ TAB 2: MEDIA GALLERY ═════════════════ */}
                {activeTab === 'media' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white">Apartment Media Gallery</h3>
                                <p className="text-xs text-gray-400">
                                    Photos, 3D renderings, floor layouts, and building brochures
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMediaModal(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition cursor-pointer"
                            >
                                <Plus size={14} />
                                <span>Upload Media</span>
                            </button>
                        </div>

                        {!apartment.media || apartment.media.length === 0 ? (
                            <div className="py-16 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/40">
                                <ImageIcon size={36} className="mx-auto text-gray-600 mb-2" />
                                <h4 className="text-sm font-bold text-white mb-1">No Media Files Yet</h4>
                                <p className="text-xs text-gray-400 mb-4">
                                    Upload building elevations, amenities, floor plans, and walk-through videos.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowMediaModal(true)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer"
                                >
                                    Upload First Media
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {apartment.media.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden group shadow-lg flex flex-col justify-between"
                                    >
                                        <div className="h-40 bg-gray-950 overflow-hidden relative">
                                            {item.media_type === 'IMAGE' ? (
                                                <img
                                                    src={item.file}
                                                    alt={item.caption || 'Building Photo'}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-cyan-400">
                                                    <span className="text-xs uppercase font-bold">{item.media_type}</span>
                                                </div>
                                            )}
                                            <a
                                                href={item.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold"
                                            >
                                                View Full Size
                                            </a>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-semibold text-white truncate">
                                                {item.caption || 'Building Photo'}
                                            </p>
                                            <span className="text-[10px] text-gray-500 block mt-0.5">
                                                {formatDate(item.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═════════════════ TAB 3: LOCATION & OVERVIEW ═════════════════ */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Map & Coordinates */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <MapPin size={16} className="text-blue-400" />
                                    Geographic Location
                                </h3>
                                <p className="text-xs text-gray-400 mb-4">{apartment.address}</p>

                                {latNum && lngNum ? (
                                    <div className="rounded-xl overflow-hidden border border-gray-800 h-80">
                                        <MapContainer
                                            center={[latNum, lngNum]}
                                            zoom={16}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution="&copy; OpenStreetMap"
                                            />
                                            <Marker position={[latNum, lngNum]}>
                                                <Popup>
                                                    <div className="text-xs">
                                                        <strong>{apartment.name}</strong>
                                                        <br />
                                                        {apartment.address}
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gray-950 rounded-xl flex items-center justify-center text-xs text-gray-500 border border-gray-800">
                                        No geographic coordinates specified. Click "Edit Details" to add map location.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Building Details Sidebar */}
                        <div className="space-y-4">
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4 text-xs">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Info size={16} className="text-blue-400" />
                                    Building Specifications
                                </h3>

                                <div className="space-y-2.5 divide-y divide-gray-800/80">
                                    <div className="flex justify-between pt-2">
                                        <span className="text-gray-400">Total Flats</span>
                                        <span className="font-bold text-white">{apartment.total_flats}</span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-gray-400">Sold Count</span>
                                        <span className="font-bold text-rose-400">{apartment.sold}</span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-gray-400">Available Units</span>
                                        <span className="font-bold text-emerald-400">
                                            {Math.max(0, (apartment.total_flats || 0) - (apartment.sold || 0))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-gray-400">Active Status</span>
                                        <span
                                            className={`font-bold ${
                                                apartment.is_active ? 'text-emerald-400' : 'text-zinc-500'
                                            }`}
                                        >
                                            {apartment.is_active ? 'Active & Published' : 'Draft / Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-gray-400">Created By</span>
                                        <span className="font-bold text-gray-200">
                                            {apartment.created_by_name || 'Admin'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-gray-400">Created At</span>
                                        <span className="text-gray-300">{formatDate(apartment.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-gray-400">Updated At</span>
                                        <span className="text-gray-300">{formatDate(apartment.updated_at)}</span>
                                    </div>
                                </div>

                                {apartment.description && (
                                    <div className="pt-3 border-t border-gray-800">
                                        <span className="text-gray-400 font-semibold block mb-1">
                                            Description:
                                        </span>
                                        <p className="text-gray-300 leading-relaxed italic">
                                            {apartment.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Add Flat Modal */}
            <FlatFormModal
                isOpen={showAddFlatModal}
                onClose={() => setShowAddFlatModal(false)}
                apartmentId={apartment.id}
                apartmentName={apartment.name}
                onSuccess={(newFlat) => {
                    setFlats((prev) => [newFlat, ...prev]);
                    // Reload apartment to reflect updated counts
                    apiFetch(ENDPOINTS.apartmentDetail(apartment.id)).then(setApartment).catch(() => {});
                }}
            />

            {/* Edit Flat Modal */}
            {editingFlat && (
                <FlatFormModal
                    isOpen={Boolean(editingFlat)}
                    onClose={() => setEditingFlat(null)}
                    apartmentId={apartment.id}
                    apartmentName={apartment.name}
                    flat={editingFlat}
                    onSuccess={(updated) => {
                        setFlats((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                        apiFetch(ENDPOINTS.apartmentDetail(apartment.id)).then(setApartment).catch(() => {});
                    }}
                />
            )}

            {/* Bulk Add Flats Modal */}
            <BulkFlatModal
                isOpen={showBulkFlatModal}
                onClose={() => setShowBulkFlatModal(false)}
                apartmentId={apartment.id}
                apartmentName={apartment.name}
                onSuccess={(newFlats) => {
                    setFlats((prev) => [...newFlats, ...prev]);
                    apiFetch(ENDPOINTS.apartmentDetail(apartment.id)).then(setApartment).catch(() => {});
                }}
            />

            {/* Apartment Edit Modal */}
            {showEditApartmentModal && (
                <ApartmentFormModal
                    isOpen={showEditApartmentModal}
                    onClose={() => setShowEditApartmentModal(false)}
                    apartment={apartment}
                    onSuccess={(updated) => {
                        setApartment(updated);
                    }}
                />
            )}

            {/* Apartment Media Modal */}
            <ApartmentMediaModal
                isOpen={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                title={`Apartment Media - ${apartment.name}`}
                targetId={apartment.id}
                targetType="apartment"
                mediaList={apartment.media || []}
                onMediaUpdated={loadApartmentData}
            />

            {/* Flat Media Modal */}
            {flatForMedia && (
                <ApartmentMediaModal
                    isOpen={Boolean(flatForMedia)}
                    onClose={() => setFlatForMedia(null)}
                    title={`Flat #${flatForMedia.flat_number} Media - ${apartment.name}`}
                    targetId={flatForMedia.id}
                    targetType="flat"
                    mediaList={flatForMedia.media || []}
                    onMediaUpdated={() => {
                        loadApartmentData();
                        setFlatForMedia(null);
                    }}
                />
            )}

            {/* Delete Flat Confirmation Modal */}
            {deletingFlat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-900 flex items-center justify-center text-rose-400 mx-auto mb-3">
                            <Trash2 size={22} />
                        </div>
                        <h4 className="text-base font-bold text-white text-center mb-1">
                            Delete Flat #{deletingFlat.flat_number}?
                        </h4>
                        <p className="text-xs text-gray-400 text-center mb-5">
                            Are you sure you want to remove this flat from the inventory? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeletingFlat(null)}
                                disabled={isDeletingFlat}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteFlat}
                                disabled={isDeletingFlat}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50 cursor-pointer"
                            >
                                {isDeletingFlat ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete Flat</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
