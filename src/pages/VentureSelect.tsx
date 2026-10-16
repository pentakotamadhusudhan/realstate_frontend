import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ENDPOINTS } from '../lib/api'
import { logout } from '../lib/auth'
import ApiErrorAlert from '../components/alter_box/ApiErrorAlert'
import { formatApiErrorMessage } from '../utils/formatApiError'
import {
    MapPin, Home, ChevronRight, Info, Building2, ChevronLeft,
    Clock, LogOut, Search, Bell, Sparkles, TrendingUp,
    ShieldCheck, Wallet, Landmark, ArrowUpRight, Compass
} from 'lucide-react'
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
        subtitle: 'Book now and unlock an early-bird discount of 10%',
        bg: 'linear-gradient(135deg, #0b1220 0%, #0f2040 40%, #1e40af 100%)',
        glow: 'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.35), transparent 60%)',
        badge: '🔥 Limited Offer',
        icon: Sparkles,
        cta: 'Book Now',
        image: "https://premiumplotsnagpur.com/plots/img/banner_estate.webp"
    },
    {
        id: 2,
        title: 'GVMC Approved Layouts',
        subtitle: 'Legally verified plots with 100% clear titles',
        bg: 'linear-gradient(135deg, #041e17 0%, #064e3b 50%, #059669 100%)',
        glow: 'radial-gradient(circle at 20% 30%, rgba(16,185,129,0.4), transparent 55%)',
        badge: '✅ 100% Legal',
        icon: ShieldCheck,
        cta: 'Learn More',
        image: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%2Fid%2FOIP.leYTgOQKaX2tfE4ZToe0fAHaEK%3Fr%3D0%26pid%3DApi&f=1&ipt=b43588754e16c59175ea9b16e5dd0c11831aa8bc24628fb8a79f6e6c496741d3&ipo=images'
    },
    {
        id: 3,
        title: 'Zero GST on Registration',
        subtitle: 'Save up to ₹2 Lakhs on registration charges',
        bg: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #7c3aed 100%)',
        glow: 'radial-gradient(circle at 70% 70%, rgba(167,139,250,0.35), transparent 60%)',
        badge: '💰 Save More',
        icon: Wallet,
        cta: 'View Offer',
        image: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.tR9bK1q3Z5iiM2ykbdeXXgHaEK%3Fr%3D0%26pid%3DApi&f=1&ipt=500e28cdb26c747c7b6024270c46489566acd2d9dec7d675a97835027c8788f8&ipo=images"
    },
    {
        id: 4,
        title: 'Bank Loans Available',
        subtitle: 'Easy EMI options with all leading banks',
        bg: 'linear-gradient(135deg, #431407 0%, #9a3412 50%, #ea580c 100%)',
        glow: 'radial-gradient(circle at 30% 60%, rgba(251,146,60,0.4), transparent 55%)',
        badge: '🏦 Easy Finance',
        icon: Landmark,
        cta: 'Apply Now',
        image: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.JQkTbZrIFIIG86jQ_uk1RAHaD9%3Fr%3D0%26pid%3DApi&f=1&ipt=e911ff1fc15c6ea72ed112db90b20c8ee67a690ffdd9e97db758a93ffcec5b1c&ipo=images'
    },
]

const NAV = [
    { label: 'Home', icon: Home, path: '/ventures' },
    { label: 'Ventures', icon: Building2, path: '/ventures' },
    { label: 'My Holds', icon: Clock, path: '/my-holds' },
    { label: 'About Us', icon: Info, path: null },
]

/* ─────────────────────────────────────────────────────
   Hook: count-up animation (must be called top-level)
   ───────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 800) {
    const [value, setValue] = useState(0)

    useEffect(() => {
        let raf: number
        const start = performance.now()
        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3)
            setValue(Math.round(target * eased))
            if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [target, duration])

    return value
}

/* ─────────────────────────────────────────────────────
   Component: StatCard (extracted so useCountUp is legal)
   ───────────────────────────────────────────────────── */
function StatCard({
    icon: Icon,
    label,
    value,
    tint,
}: {
    icon: React.ComponentType<{ size?: number }>
    label: string
    value: number
    tint: string
}) {
    const animated = useCountUp(value)

    return (
        <div
            className="rounded-2xl px-4 py-3.5 border bg-white/70 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
            style={{ borderColor: '#e5e7eb' }}
        >
            <div className="flex items-center gap-2 mb-1">
                <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: `${tint}15`, color: tint }}
                >
                    <Icon size={13} />
                </div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {label}
                </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{animated}</p>
        </div>
    )
}

/* ─────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────── */
export default function VentureSelect() {
    const [ventures, setVentures] = useState<Venture[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentBanner, setCurrentBanner] = useState(0)
    const [query, setQuery] = useState('')
    const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const navigate = useNavigate()

    // Auto-advance banner
    useEffect(() => {
        bannerTimerRef.current = setInterval(() => {
            setCurrentBanner(p => (p + 1) % BANNERS.length)
        }, 5000)
        return () => {
            if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
        }
    }, [])

    async function fetchVentures() {
        setLoading(true)
        setError('')
        try {
            const data = await apiFetch(ENDPOINTS.ventures)
            await new Promise(r => setTimeout(r, 400))
            setVentures(data.results ?? data)
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to load ventures.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVentures()
    }, [])

    function handleSelect(venture: Venture) {
        sessionStorage.setItem('customer_venture', JSON.stringify(venture))
        navigate('/dashboard')
    }

    function resetTimer() {
        if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
        bannerTimerRef.current = setInterval(() => {
            setCurrentBanner(p => (p + 1) % BANNERS.length)
        }, 5000)
    }

    const prevBanner = () => {
        resetTimer()
        setCurrentBanner(p => (p - 1 + BANNERS.length) % BANNERS.length)
    }

    const nextBanner = () => {
        resetTimer()
        setCurrentBanner(p => (p + 1) % BANNERS.length)
    }

    const user = useMemo(
        () => JSON.parse(localStorage.getItem('user_profile') || '{}'),
        []
    )
    const banner = BANNERS[currentBanner]

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return ventures
        return ventures.filter(v =>
            v.name.toLowerCase().includes(q) ||
            v.city.toLowerCase().includes(q) ||
            v.state.toLowerCase().includes(q)
        )
    }, [ventures, query])

    const totalStats = useMemo(
        () => ({
            ventures: ventures.length,
            available: ventures.reduce((s, v) => s + v.available_plots, 0),
            cities: new Set(ventures.map(v => v.city)).size,
        }),
        [ventures]
    )

    const pathname = window.location.pathname

    return (
        <div className="min-h-screen text-slate-900 antialiased" style={{ background: '#f4f6fb' }}>
            {/* Ambient background glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                <div
                    className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-40 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 70%)' }}
                />
                <div
                    className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)' }}
                />
            </div>

            <div className="relative flex flex-col min-h-screen">
                {/* ═══════ HEADER ═══════ */}
                <header className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3">
                    <div
                        className="mx-auto max-w-7xl flex items-center justify-between gap-4 rounded-2xl px-4 py-2.5 border border-white/10 backdrop-blur-xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(15,32,64,0.92) 0%, rgba(26,47,94,0.88) 100%)',
                            boxShadow:
                                '0 10px 40px -10px rgba(15,32,64,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                        }}
                    >
                        {/* Brand */}
                        <button
                            onClick={() => navigate('/ventures')}
                            className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-xl p-1 -m-1"
                        >
                            <div className="relative">
                                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center overflow-hidden ring-2 ring-blue-400/40 group-hover:ring-blue-400 transition">
                                    <img src={logo} alt="PlotVista" className="w-full h-full object-contain" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0f2040] animate-pulse" />
                            </div>
                            <div className="text-left hidden sm:block">
                                <span className="font-bold text-white text-base leading-none tracking-tight block">
                                    PlotVista
                                </span>
                                <span className="text-[11px] text-white/45">Real Estate Ventures</span>
                            </div>
                        </button>

                        {/* Nav */}
                        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                            {NAV.map(item => {
                                const active = item.path === pathname
                                const Icon = item.icon
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => item.path && navigate(item.path)}
                                        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'text-white' : 'text-white/55 hover:text-white/90'
                                            }`}
                                    >
                                        {active && (
                                            <span className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-500/25 to-blue-600/10 border border-blue-400/30" />
                                        )}
                                        <Icon size={14} className="relative z-10" />
                                        <span className="relative z-10">{item.label}</span>
                                    </button>
                                )
                            })}
                        </nav>

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            <button
                                className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
                                aria-label="Notifications"
                            >
                                <Bell size={16} />
                            </button>

                            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                                <div className="relative">
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                                    >
                                        {user.full_name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    {user.auth_provider === 'GOOGLE' && (
                                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow ring-2 ring-[#0f2040]">
                                            <svg viewBox="0 0 24 24" width="9" height="9">
                                                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                                                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                                                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                                                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                <div className="hidden xl:block">
                                    <p className="text-[11px] font-semibold text-white leading-none">
                                        {user.full_name || 'User'}
                                    </p>
                                    <p className="text-[10px] text-white/40 mt-0.5 max-w-[140px] truncate">
                                        {user.email || ''}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => logout(navigate)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:bg-red-500/15 hover:text-red-300 transition"
                                title="Sign out"
                            >
                                <LogOut size={13} />
                                <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ═══════ HERO BANNER ═══════ */}
                <section className="px-4 sm:px-6 lg:px-8 pt-3">
                    <div className="mx-auto max-w-7xl">
                        <div
                            className="relative overflow-hidden rounded-3xl border border-white/10 flex flex-col justify-between"
                            style={{ height: 280, boxShadow: '0 30px 60px -30px rgba(15,32,64,0.6)' }}
                        >
                            {/* ── Background image layers (cross-fade + Ken Burns) ── */}
                            {BANNERS.map((b, i) => (
                                <div
                                    key={b.id}
                                    className="absolute inset-0"
                                    style={{
                                        opacity: i === currentBanner ? 1 : 0,
                                        // Fixed: Changed single quotes to backticks for template literal evaluation
                                        backgroundImage: `url(${b.image})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        transform: i === currentBanner ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'opacity 1s ease, transform 8s ease-out',
                                    }}
                                />
                            ))}

                            {/* ── Colored overlay scrim ── */}
                            <div
                                className="absolute inset-0 transition-all duration-700 pointer-events-none"
                                style={{ background: (banner as any).overlay || banner.bg }}
                            />

                            {/* ── Radial glow accent ── */}
                            <div
                                className="absolute inset-0 transition-all duration-700 pointer-events-none"
                                style={{ background: banner.glow }}
                            />

                            {/* ── Bottom gradient fade so text & controls stay legible ── */}
                            <div
                                className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none z-10"
                                style={{
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                                }}
                            />

                            {/* ── Banner Content (Positioned relative & z-20 to sit above backgrounds) ── */}
                            <div className="relative z-20 flex-1 flex flex-col justify-center text-center px-12 sm:px-16 pt-6">
                                <span
                                    className="inline-block self-center text-xs font-semibold px-3 py-1 rounded-full mb-2"
                                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                                >
                                    {banner.badge}
                                </span>
                                <h2
                                    className="text-xl sm:text-2xl font-bold text-white mb-1"
                                    style={{ letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                                >
                                    {banner.title}
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.85)' }} className="text-xs sm:text-sm max-w-xl mx-auto">
                                    {banner.subtitle}
                                </p>
                            </div>

                            {/* ═══ Left Navigation Arrow ═══ */}
                            <button
                                onClick={prevBanner}
                                aria-label="Previous"
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}
                            >
                                <ChevronLeft size={18} color="white" />
                            </button>

                            {/* ═══ Right Navigation Arrow ═══ */}
                            <button
                                onClick={nextBanner}
                                aria-label="Next"
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}
                            >
                                <ChevronRight size={18} color="white" />
                            </button>

                            {/* ═══ Bottom Controls Bar (Dots left, CTA right) ═══ */}
                            <div className="relative z-30 px-6 pb-5 flex items-center justify-between">
                                {/* Dot indicators */}
                                <div className="flex items-center gap-1.5">
                                    {BANNERS.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                resetTimer();
                                                setCurrentBanner(i);
                                            }}
                                            aria-label={`Go to slide ${i + 1}`}
                                            className="rounded-full transition-all duration-300"
                                            style={{
                                                width: i === currentBanner ? 24 : 6,
                                                height: 6,
                                                background: i === currentBanner ? 'white' : 'rgba(255,255,255,0.5)',
                                                boxShadow: i === currentBanner ? '0 0 10px rgba(255,255,255,0.6)' : 'none',
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Bottom-right CTA Button */}
                                <button
                                    className="group inline-flex items-center gap-2 pl-4 pr-3 py-2 rounded-full text-xs sm:text-sm font-semibold transition active:scale-95 hover:shadow-2xl"
                                    style={{
                                        background: 'rgba(255,255,255,0.97)',
                                        color: '#0f172a',
                                        boxShadow: '0 8px 24px -8px rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.25)',
                                        backdropFilter: 'blur(8px)',
                                    }}
                                >
                                    <banner.icon size={14} />
                                    {banner.cta}
                                    <span
                                        className="ml-1 w-5 h-5 rounded-full flex items-center justify-center transition group-hover:translate-x-0.5"
                                        style={{ background: 'rgba(15,23,42,0.08)' }}
                                    >
                                        <ArrowUpRight size={12} />
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════ MAIN ═══════ */}
                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mx-auto max-w-7xl">
                        {/* Stats strip — ✅ now uses StatCard, no hook-in-loop */}
                        {!loading && ventures.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
                                <StatCard
                                    icon={Building2}
                                    label="Live Ventures"
                                    value={totalStats.ventures}
                                    tint="#3b82f6"
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    label="Plots Available"
                                    value={totalStats.available}
                                    tint="#10b981"
                                />
                                <StatCard
                                    icon={Compass}
                                    label="Cities Covered"
                                    value={totalStats.cities}
                                    tint="#8b5cf6"
                                />
                            </div>
                        )}

                        {/* Title row + search */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
                                    Available Ventures
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Pick a venture to explore plots on the interactive map
                                </p>
                            </div>

                            <div className="relative w-full sm:w-72">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search by name or city…"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white border border-slate-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6">
                                <ApiErrorAlert
                                    message={error}
                                    onRetry={fetchVentures}
                                    onClose={() => setError('')}
                                />
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {loading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[0, 1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className="rounded-3xl bg-white border border-slate-200 overflow-hidden"
                                    >
                                        <div className="h-1.5 w-full bg-slate-100 animate-pulse" />
                                        <div className="p-6 space-y-4">
                                            <div className="flex justify-between">
                                                <div className="h-5 w-20 rounded-full bg-slate-100 animate-pulse" />
                                                <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
                                            </div>
                                            <div className="h-6 w-3/4 rounded bg-slate-100 animate-pulse" />
                                            <div className="h-4 w-1/2 rounded bg-slate-100 animate-pulse" />
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                                                <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                                            </div>
                                            <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && filtered.length === 0 && (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                    <Compass size={28} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">No ventures found</h3>
                                <p className="text-sm text-slate-500">
                                    {query
                                        ? `Nothing matches "${query}"`
                                        : 'Check back soon — new ventures are added regularly.'}
                                </p>
                            </div>
                        )}

                        {/* Cards */}
                        {!loading && filtered.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {filtered.map((venture, idx) => (
                                    <VentureCard
                                        key={venture.id}
                                        venture={venture}
                                        onSelect={() => handleSelect(venture)}
                                        index={idx}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        <footer className="mt-16 pb-8 text-center">
                            <div className="inline-flex items-center gap-2 text-xs text-slate-400">
                                <span>© 2026 PlotVista Real Estate</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>All rights reserved</span>
                            </div>
                        </footer>
                    </div>
                </main>
            </div>

            {/* Keyframes */}
            <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   Venture Card
   ═══════════════════════════════════════════════════════ */
function VentureCard({
    venture,
    onSelect,
    index,
}: {
    venture: Venture
    onSelect: () => void
    index: number
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [tilt, setTilt] = useState({ x: 0, y: 0 })
    const [hover, setHover] = useState(false)

    const total = venture.total_plots || 0
    const available = venture.available_plots || 0
    const booked = Math.max(total - available, 0)
    const availPct = total > 0 ? Math.round((available / total) * 100) : 0

    function handleMove(e: React.MouseEvent) {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        setTilt({ x: y * -6, y: x * 6 })
    }

    function handleLeave() {
        setHover(false)
        setTilt({ x: 0, y: 0 })
    }

    const isPublished = venture.status === 'PUBLISHED'
    const statusColor = isPublished ? '#10b981' : '#f59e0b'

    return (
        <div
            ref={ref}
            onMouseMove={handleMove}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={handleLeave}
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect()
                }
            }}
            className="group relative cursor-pointer rounded-3xl overflow-hidden bg-white border border-slate-200 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
            style={{
                transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${hover ? -4 : 0
                    }px)`,
                boxShadow: hover
                    ? '0 30px 60px -20px rgba(15,32,64,0.35), 0 0 0 1px rgba(59,130,246,0.2)'
                    : '0 4px 20px -8px rgba(15,32,64,0.1)',
                transition: hover ? 'transform 0.15s ease-out, box-shadow 0.3s ease' : 'all 0.4s ease',
                animationDelay: `${index * 60}ms`,
            }}
        >
            {/* Gradient border glow */}
            <div
                className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.5), rgba(139,92,246,0.5))',
                    opacity: hover ? 0.15 : 0,
                    mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    padding: 1,
                }}
            />

            {/* Top accent bar */}
            <div
                className="h-1.5 w-full relative overflow-hidden"
                style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed, #2563eb)' }}
            >
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                    style={{
                        background:
                            'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
                        animation: hover ? 'shimmer 1.5s linear infinite' : 'none',
                    }}
                />
            </div>

            <div className="p-6">
                {/* Top row */}
                <div className="flex items-center justify-between mb-4">
                    <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: `${statusColor}15`, color: statusColor }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: statusColor }}
                        />
                        {venture.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Home size={11} />
                        {total} total
                    </div>
                </div>

                {/* Name + location */}
                <h2 className="text-lg font-bold text-slate-900 mb-1 transition group-hover:text-blue-600">
                    {venture.name}
                </h2>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
                    <MapPin size={12} />
                    {venture.city}, {venture.state}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{
                            background: 'rgba(16,185,129,0.06)',
                            border: '1px solid rgba(16,185,129,0.18)',
                        }}
                    >
                        <p className="text-2xl font-bold text-emerald-600 tabular-nums">{available}</p>
                        <p className="text-[11px] mt-0.5 text-slate-500 font-medium">Available</p>
                    </div>
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{
                            background: 'rgba(239,68,68,0.05)',
                            border: '1px solid rgba(239,68,68,0.16)',
                        }}
                    >
                        <p className="text-2xl font-bold text-red-500 tabular-nums">{booked}</p>
                        <p className="text-[11px] mt-0.5 text-slate-500 font-medium">Booked</p>
                    </div>
                </div>

                {/* Availability bar */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-slate-500">Availability</span>
                        <span className="text-[11px] font-bold text-emerald-600 tabular-nums">
                            {availPct}%
                        </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${availPct}%`,
                                background: 'linear-gradient(90deg, #10b981, #34d399)',
                            }}
                        />
                    </div>
                </div>

                {/* Amenities */}
                {venture.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {venture.amenities.slice(0, 4).map((a: string) => (
                            <span
                                key={a}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium"
                            >
                                {a}
                            </span>
                        ))}
                        {venture.amenities.length > 4 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                +{venture.amenities.length - 4}
                            </span>
                        )}
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={e => {
                        e.stopPropagation()
                        onSelect()
                    }}
                    className="group/btn relative w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb 50%, #7c3aed)' }}
                >
                    <span
                        className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"
                        style={{
                            background:
                                'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                        }}
                    />
                    <span className="relative">Explore Plots</span>
                    <ChevronRight
                        size={15}
                        className="relative transition group-hover/btn:translate-x-0.5"
                    />
                </button>
            </div>
        </div>
    )
}