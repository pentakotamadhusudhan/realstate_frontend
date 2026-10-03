import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ENDPOINTS } from '../lib/api'
import { MapPin, Home, ChevronRight, User, Info, Building2, ChevronLeft, Building2Icon, Clock } from 'lucide-react'
import LoadingScreen from '../components/LoadingComponent'
import logo from "../assets/logomain.png";

interface Venture {
    id: string
    name: string
    slug: string
    city: string
    state: string
    center_latitude: string
    center_longitude: string
    total_plots: number
    available_plots: number
    status: string
    amenities: string[]
}

const BANNERS = [
    {
        id: 1,
        title: 'Premium Plots Starting at ₹25 Lakhs',
        subtitle: 'Book now and get early bird discount of 10%',
        bg: 'linear-gradient(135deg, #0f2040 0%, #1e4080 50%, #2563eb 100%)',
        badge: '🔥 Limited Offer',
        cta: 'Book Now',
    },
    {
        id: 2,
        title: 'HMDA Approved Layouts',
        subtitle: 'All plots are legally verified with clear titles',
        bg: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%)',
        badge: '✅ 100% Legal',
        cta: 'Learn More',
    },
    {
        id: 3,
        title: 'Zero GST on Registration',
        subtitle: 'Save up to ₹2 Lakhs on registration charges',
        bg: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)',
        badge: '💰 Save More',
        cta: 'View Offer',
    },
    {
        id: 4,
        title: 'Bank Loans Available',
        subtitle: 'Easy EMI options with all leading banks',
        bg: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)',
        badge: '🏦 Easy Finance',
        cta: 'Apply Now',
    },
]

export default function VentureSelect() {
    const [ventures, setVentures] = useState<Venture[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentBanner, setCurrentBanner] = useState(0)
    const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const navigate = useNavigate()

    // Auto scroll banners
    useEffect(() => {
        bannerTimerRef.current = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % BANNERS.length)
        }, 3500)
        return () => {
            if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
        }
    }, [])

    useEffect(() => {
        async function fetchVentures() {
            try {
                const data = await apiFetch(ENDPOINTS.ventures)
                setVentures(data.results ?? data)
            } catch {
                setError('Failed to load ventures.')
            } finally {
                setLoading(false)
            }
        }
        fetchVentures()
    }, [])

    function handleSelect(venture: Venture) {
        sessionStorage.setItem('customer_venture', JSON.stringify(venture))
        navigate('/dashboard')
    }

    function prevBanner() {
        if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
        setCurrentBanner(prev => (prev - 1 + BANNERS.length) % BANNERS.length)
        bannerTimerRef.current = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % BANNERS.length)
        }, 3500)
    }

    function nextBanner() {
        if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
        setCurrentBanner(prev => (prev + 1) % BANNERS.length)
        bannerTimerRef.current = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % BANNERS.length)
        }, 3500)
    }

    const user = JSON.parse(localStorage.getItem('user_profile') || '{}')
    const banner = BANNERS[currentBanner]

    return (
        <div className="min-h-screen text-white flex flex-col" style={{ background: '#f6f6f6ff' }}>

            {/* ── Header ── */}
            <header
                className="shrink-0 px-8 py-4 flex items-center justify-between"
                style={{
                    background: 'linear-gradient(135deg, #0f2040 0%, #1a2f5e 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
                }}
            >
                {/* Left — Logo + Name */}
                <div className="flex items-center gap-1">

                    {/* Center logo */}
                    <div className="w-16 h-16  items-center justify-center bg-white rounded-full animate-pulse">
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-full h-full object-contain animate-pulse rounded-full"
                        />
                    </div>

                    <div>
                        <span
                            className="font-bold text-white text-lg block leading-none"
                            style={{ letterSpacing: '-0.03em' }}
                        >
                            PlotVista
                        </span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Real Estate Ventures
                        </span>
                    </div>
                </div>

                {/* Center — Nav links */}
                <nav className="hidden md:flex items-center gap-1">
                    {[
                        { label: 'Home', icon: <Home size={13} />, path: '/ventures' },
                        { label: 'Ventures', icon: <Building2 size={13} />, path: '/ventures' },
                        { label: 'My Holds', icon: <Clock size={13} />, path: '/my-holds' },
                        { label: 'About Us', icon: <Info size={13} />, path: null },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => item.path && navigate(item.path)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition"
                            style={{
                                color: item.path === window.location.pathname ? 'white' : 'rgba(255,255,255,0.6)',
                                background: item.path === window.location.pathname ? 'rgba(255,255,255,0.1)' : 'transparent',
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Right — Profile + Logout */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white' }}
                        >
                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden lg:block">
                            <p className="text-xs font-semibold text-white leading-none">{user.full_name || 'User'}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.email || ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { localStorage.clear(); navigate('/login') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                    >
                        <User size={12} />
                        Logout
                    </button>
                </div>
            </header>

            {/* ── Banner Slider ── */}
            <div className="shrink-0 relative overflow-hidden" style={{ height: 200 }}>

                {/* Banner content */}
                <div
                    className="absolute inset-0 flex items-center justify-between px-12"
                    style={{ background: banner.bg, transition: 'background 0.6s ease' }}
                >
                    {/* Left arrow */}
                    <button
                        onClick={prevBanner}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-80 shrink-0"
                        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                    >
                        <ChevronLeft size={18} color="white" />
                    </button>

                    {/* Banner text */}
                    <div className="flex-1 text-center px-8">
                        <span
                            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                        >
                            {banner.badge}
                        </span>
                        <h2
                            className="text-2xl font-bold text-white mb-2"
                            style={{ letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                        >
                            {banner.title}
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.75)' }} className="text-sm mb-4">
                            {banner.subtitle}
                        </p>
                        <button
                            className="px-6 py-2 rounded-full text-sm font-semibold transition hover:opacity-90 active:scale-95"
                            style={{ background: 'rgba(255,255,255,0.95)', color: '#0f172a' }}
                        >
                            {banner.cta}
                        </button>
                    </div>

                    {/* Right arrow */}
                    <button
                        onClick={nextBanner}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-80 shrink-0"
                        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                    >
                        <ChevronRight size={18} color="white" />
                    </button>
                </div>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {BANNERS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentBanner(i)}
                            className="rounded-full transition-all"
                            style={{
                                width: i === currentBanner ? 20 : 6,
                                height: 6,
                                background: i === currentBanner ? 'white' : 'rgba(255,255,255,0.4)',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto w-full">

                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
                        Available Ventures
                    </h1>
                    <p style={{ color: '#64748b' }} className="text-sm">
                        Choose a venture to explore plots on the map
                    </p>
                </div>

                {loading && (
                    <LoadingScreen />
                )}

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                ```jsx
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {ventures.map((venture) => (

                        <div
                            key={venture.id}
                            onClick={() => handleSelect(venture)}
                            className="group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-200"
                            style={{
                                background: '#ffffff',
                                borderColor: '#e5e7eb',
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.borderColor = '#3b82f6')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.borderColor = '#e5e7eb')
                            }
                        >

                            {/* Top color bar */}
                            <div
                                className="h-1.5 w-full"
                                style={{
                                    background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                                }}
                            />

                            <div className="p-6">

                                {/* Status + plots count */}
                                <div className="flex items-center justify-between mb-4">

                                    <span
                                        className={`text-xs font-semibold px-3 py-1 rounded-full ${venture.status === 'PUBLISHED'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                    >
                                        {venture.status}
                                    </span>

                                    <div
                                        className="flex items-center gap-1 text-xs"
                                        style={{ color: '#6b7280' }}
                                    >
                                        <Home size={11} />
                                        {venture.total_plots} total plots
                                    </div>

                                </div>

                                {/* Name and location */}
                                <h2 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                                    {venture.name}
                                </h2>

                                <div
                                    className="flex items-center gap-1.5 text-sm mb-5"
                                    style={{ color: '#6b7280' }}
                                >
                                    <MapPin size={12} />
                                    {venture.city}, {venture.state}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-5">

                                    {/* Available */}
                                    <div
                                        className="rounded-xl p-3 text-center"
                                        style={{
                                            background: 'rgba(16, 185, 129, 0.08)',
                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                        }}
                                    >
                                        <p className="text-2xl font-bold text-emerald-600">
                                            {venture.available_plots}
                                        </p>

                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: '#6b7280' }}
                                        >
                                            Available
                                        </p>
                                    </div>

                                    {/* Booked */}
                                    <div
                                        className="rounded-xl p-3 text-center"
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                        }}
                                    >
                                        <p className="text-2xl font-bold text-red-500">
                                            {venture.total_plots - venture.available_plots}
                                        </p>

                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: '#6b7280' }}
                                        >
                                            Booked
                                        </p>
                                    </div>

                                </div>

                                {/* Amenities */}
                                {venture.amenities && venture.amenities.length > 0 && (

                                    <div className="flex flex-wrap gap-1.5 mb-5">

                                        {venture.amenities.slice(0, 4).map((a: string) => (

                                            <span
                                                key={a}
                                                className="text-xs px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: '#f3f4f6',
                                                    color: '#4b5563',
                                                }}
                                            >
                                                {a}
                                            </span>

                                        ))}

                                        {venture.amenities.length > 4 && (

                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: '#f3f4f6',
                                                    color: '#4b5563',
                                                }}
                                            >
                                                +{venture.amenities.length - 4} more
                                            </span>

                                        )}

                                    </div>

                                )}

                                {/* CTA */}
                                <button
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition"
                                    style={{
                                        background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                        color: '#ffffff',
                                    }}
                                >
                                    Explore Plots
                                    <ChevronRight size={15} />
                                </button>

                            </div>

                        </div>

                    ))}

                </div>


                {/* Footer */}
                <div className="mt-12 text-center pb-6">
                    <p className="text-xs" style={{ color: '#94a3b8' }}>
                        © 2026 PlotVista Real Estate · All rights reserved
                    </p>
                </div>

            </div>
        </div>
    )
}