import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building,
    Home,
    MapPin,
    Search,
    Filter,
    Compass,
    ArrowUpRight,
    IndianRupee,
    Phone,
    LogOut,
    Sparkles,
    ShieldCheck,
    ChevronRight,
    X,
    Eye,
} from 'lucide-react';
import type { Apartment, Flat, FlatFacing, FlatType } from '../types/apartment';
import { apiFetch, ENDPOINTS } from '../lib/api';
import { getUserProfile, logout } from '../lib/auth';
import {
    formatPrice,
    formatCurrencyFull,
    getFacingIconAndLabel,
    getTypeBadgeColor,
    getStatusBadge,
} from '../utils/apartmentHelpers';
import LoadingScreen from '../components/LoadingComponent';
import ApiErrorAlert from '../components/alter_box/ApiErrorAlert';

export default function CustomerApartmentsPage() {
    const navigate = useNavigate();
    const user = getUserProfile();

    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
    const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);

    // Selected apartment's flats
    const [flats, setFlats] = useState<Flat[]>([]);
    const [flatsLoading, setFlatsLoading] = useState(false);
    const [bhkFilter, setBhkFilter] = useState<string>('ALL');

    async function loadApartments() {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(ENDPOINTS.apartments());
            const list = Array.isArray(data) ? data : data?.results || [];
            // Public/customers see active apartments
            setApartments(list.filter((a: Apartment) => a.is_active));
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

    // Filter apartments
    const filteredApartments = useMemo(() => {
        return apartments.filter((apt) => {
            const search = searchTerm.toLowerCase();
            return (
                apt.name?.toLowerCase().includes(search) ||
                apt.address?.toLowerCase().includes(search) ||
                apt.description?.toLowerCase().includes(search)
            );
        });
    }, [apartments, searchTerm]);

    // Open apartment modal to view flats
    async function handleViewApartment(apt: Apartment) {
        setSelectedApartment(apt);
        setFlatsLoading(true);
        try {
            const data = await apiFetch(ENDPOINTS.apartmentFlats(apt.id));
            const list = Array.isArray(data) ? data : data?.results || [];
            setFlats(list);
        } catch (err) {
            console.error('Failed to load flats:', err);
            setFlats([]);
        } finally {
            setFlatsLoading(false);
        }
    }

    const filteredFlats = useMemo(() => {
        return flats.filter((f) => {
            if (bhkFilter !== 'ALL' && f.type !== bhkFilter) return false;
            return true;
        });
    }, [flats, bhkFilter]);

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Top Customer Header */}
            <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div
                            onClick={() => navigate('/ventures')}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                <span className="text-white text-lg">🏢</span>
                            </div>
                            <div>
                                <span className="font-bold text-white tracking-tight text-base sm:text-lg block">
                                    PlotVista
                                </span>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                                    Apartments & Flats
                                </span>
                            </div>
                        </div>

                        {/* Nav switches */}
                        <nav className="hidden sm:flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/ventures')}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                            >
                                Open Plots
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/apartments')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 transition cursor-pointer"
                            >
                                Apartments
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/my-holds')}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                            >
                                My Bookings
                            </button>
                        </nav>
                    </div>

                    {/* Right User Bar */}
                    <div className="flex items-center gap-3">
                        {user && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-xs font-medium text-gray-200 hidden md:inline">
                                    {user.full_name}
                                </span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => logout(navigate)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-950/20 transition cursor-pointer"
                        >
                            <LogOut size={14} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Hero Banner */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-950 to-gray-950 border border-blue-900/40 p-8 shadow-2xl">
                    <div className="max-w-2xl space-y-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/30 text-blue-300 border border-blue-500/40 inline-block">
                            Premium High-Rise Living
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Find Your Dream Apartment
                        </h1>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Explore verified 1BHK, 2BHK, 3BHK, 4BHK apartments and commercial spaces with live availability, transparent pricing, and vastu-compliant facings.
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center justify-between gap-4 bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by apartment name, area, location..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                        Showing <strong className="text-white">{filteredApartments.length}</strong> available complexes
                    </span>
                </div>

                {/* Loading State */}
                {loading && <LoadingScreen />}

                {/* Error */}
                {error && (
                    <ApiErrorAlert message={error} onRetry={loadApartments} onClose={() => setError(null)} />
                )}

                {/* Empty State */}
                {!loading && filteredApartments.length === 0 && (
                    <div className="text-center py-20 bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
                        <Building size={40} className="mx-auto text-gray-600 mb-3" />
                        <h3 className="text-base font-bold text-white mb-1">No Apartments Listed</h3>
                        <p className="text-xs text-gray-400">
                            Check back soon for new luxury towers and residential projects.
                        </p>
                    </div>
                )}

                {/* Apartments Grid */}
                {!loading && filteredApartments.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApartments.map((apartment) => {
                            const total = apartment.total_flats || 0;
                            const sold = apartment.sold || 0;
                            const available = Math.max(0, total - sold);

                            return (
                                <div
                                    key={apartment.id}
                                    onClick={() => handleViewApartment(apartment)}
                                    className="group bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                                >
                                    {/* Cover Image */}
                                    <div className="relative h-48 bg-gray-950 overflow-hidden">
                                        {apartment.cover_image ? (
                                            <img
                                                src={apartment.cover_image}
                                                alt={apartment.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-gray-950 to-blue-950 text-gray-600 group-hover:text-blue-400 transition-colors">
                                                <Building size={48} strokeWidth={1.5} />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800 backdrop-blur-md">
                                            {available} Units Available
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
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

                                            {apartment.description && (
                                                <p className="text-xs text-gray-400 line-clamp-2 mb-4 italic">
                                                    "{apartment.description}"
                                                </p>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-800 pt-3 flex items-center justify-between text-xs">
                                            <span className="text-gray-400">
                                                Total Units: <strong className="text-white">{total}</strong>
                                            </span>
                                            <span className="text-blue-400 font-semibold flex items-center gap-1 group-hover:underline">
                                                Explore Units <ChevronRight size={13} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* View Apartment Flats Modal */}
            {selectedApartment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden my-6">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/90">
                            <div>
                                <h3 className="text-lg font-bold text-white">{selectedApartment.name}</h3>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <MapPin size={12} className="text-blue-400" />
                                    {selectedApartment.address}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedApartment(null)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            {/* BHK Filters */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 mr-1">Filter Type:</span>
                                {['ALL', '1BHK', '2BHK', '3BHK', '4BHK', 'COMMERCIAL'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setBhkFilter(type)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                            bhkFilter === type
                                                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {/* Flats List */}
                            {flatsLoading ? (
                                <div className="py-12 flex justify-center">
                                    <LoadingScreen />
                                </div>
                            ) : filteredFlats.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl text-xs text-gray-500">
                                    No flat units available under this filter.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredFlats.map((flat) => {
                                        const facingInfo = getFacingIconAndLabel(flat.facing);
                                        const stBadge = getStatusBadge(flat.status);

                                        return (
                                            <div
                                                key={flat.id}
                                                className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between hover:border-gray-700 transition"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-base font-bold text-white">
                                                            Unit #{flat.flat_number}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getTypeBadgeColor(
                                                                flat.type
                                                            )}`}
                                                        >
                                                            {flat.type}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1.5 text-xs text-gray-400 mb-3">
                                                        <div className="flex justify-between">
                                                            <span>Floor:</span>
                                                            <span className="text-white font-medium">
                                                                {flat.floor_number || 1}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Area:</span>
                                                            <span className="text-white font-medium">
                                                                {flat.area} sq.ft
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Facing:</span>
                                                            <span className="text-white font-medium flex items-center gap-1">
                                                                <span>{facingInfo.icon}</span>
                                                                <span>{facingInfo.label}</span>
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Status:</span>
                                                            <span className={`font-bold ${stBadge.color}`}>
                                                                {stBadge.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-gray-800/80">
                                                        <span className="text-[10px] text-gray-500 block uppercase">
                                                            Price
                                                        </span>
                                                        <span className="text-base font-extrabold text-emerald-400">
                                                            {formatPrice(flat.price)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        alert(
                                                            `Inquiry requested for Unit #${flat.flat_number} in ${selectedApartment.name}. Our sales agent will contact you shortly!`
                                                        );
                                                    }}
                                                    className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
                                                >
                                                    Inquire About Flat
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
