import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ENDPOINTS, API_BASE_URL } from '../lib/api'
import { MapPin, Clock, CheckCircle, XCircle, ArrowLeft, Phone } from 'lucide-react'

interface Hold {
    id: string
    plot: string
    plot_detail: {
        id: string
        plot_number: string
        area_sqft: string
        total_price: string
        status: string
        notes: string
        venture: string
    }
    customer: string
    customer_name: string
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'CONVERTED'
    held_at: string
    expires_at: string
    released_at: string | null
    notes: string
}

function formatPrice(price: string): string {
    const p = parseFloat(price)
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`
    if (p >= 100000) return `₹${(p / 100000).toFixed(1)} Lakhs`
    return `₹${p.toLocaleString('en-IN')}`
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function timeRemaining(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`
    return `${hours}h ${minutes}m remaining`
}

interface StatusConfig {
    label: string
    bg: string
    color: string
    border: string
    icon: React.ReactElement
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
    ACTIVE: {
        label: 'Active',
        bg: '#dcfce7',
        color: '#166534',
        border: '#bbf7d0',
        icon: <CheckCircle size={13} />,
    },
    EXPIRED: {
        label: 'Expired',
        bg: '#fee2e2',
        color: '#991b1b',
        border: '#fecaca',
        icon: <XCircle size={13} />,
    },
    CANCELLED: {
        label: 'Cancelled',
        bg: '#f1f5f9',
        color: '#475569',
        border: '#e2e8f0',
        icon: <XCircle size={13} />,
    },
    CONVERTED: {
        label: 'Sold',
        bg: '#eff6ff',
        color: '#1d4ed8',
        border: '#bfdbfe',
        icon: <CheckCircle size={13} />,
    },
}

function HoldCard({
    hold,
    onCancel,
    cancellingId,
    onCall,
}: {
    hold: Hold
    onCancel: (id: string) => void
    cancellingId: string | null
    onCall: () => void
}) {
    const cfg = STATUS_CONFIG[hold.status] ?? STATUS_CONFIG.CANCELLED
    const isActive = hold.status === 'ACTIVE'

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
        >
            <div
                className="h-1 w-full"
                style={{
                    background: isActive
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                }}
            />

            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                            Plot {hold.plot_detail?.plot_number || 'N/A'}
                        </h3>
                        <p className="text-sm" style={{ color: '#64748b' }}>
                            Hold ID: {hold.id.slice(0, 8)}...
                        </p>
                    </div>
                    <span
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                    >
                        {cfg.icon}
                        {cfg.label}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Area</p>
                        <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>
                            {hold.plot_detail?.area_sqft
                                ? `${parseFloat(hold.plot_detail.area_sqft).toLocaleString()} sqft`
                                : 'N/A'}
                        </p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Total Price</p>
                        <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>
                            {hold.plot_detail?.total_price
                                ? formatPrice(hold.plot_detail.total_price)
                                : 'N/A'}
                        </p>
                    </div>
                </div>

                <div
                    className="rounded-xl p-3 mb-4 flex items-center gap-3"
                    style={{
                        background: isActive ? '#f0fdf4' : '#f8fafc',
                        border: `1px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`,
                    }}
                >
                    <Clock size={16} color={isActive ? '#16a34a' : '#94a3b8'} />
                    <div>
                        <p className="text-xs font-semibold" style={{ color: isActive ? '#166534' : '#475569' }}>
                            {isActive ? timeRemaining(hold.expires_at) : STATUS_CONFIG[hold.status]?.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                            Held on {formatDate(hold.held_at)}
                        </p>
                        {isActive && (
                            <p className="text-xs" style={{ color: '#94a3b8' }}>
                                Expires {formatDate(hold.expires_at)}
                            </p>
                        )}
                    </div>
                </div>

                {hold.notes && (
                    <p className="text-xs mb-4 px-1" style={{ color: '#64748b' }}>
                        📝 {hold.notes}
                    </p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={onCall}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:opacity-80"
                        style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}
                    >
                        <Phone size={11} />
                        Call Agent
                    </button>
                    {isActive && (
                        <button
                            onClick={() => onCancel(hold.id)}
                            disabled={cancellingId === hold.id}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:opacity-80 disabled:opacity-60"
                            style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                        >
                            <XCircle size={11} />
                            {cancellingId === hold.id ? 'Cancelling...' : 'Cancel Hold'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function MyHolds() {
    const [holds, setHolds] = useState<Hold[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [cancellingId, setCancellingId] = useState<string | null>(null)
    const [showCallDialog, setShowCallDialog] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchHolds()
    }, [])

    async function fetchHolds() {
        setLoading(true)
        setError('')
        try {
            const data = await apiFetch(ENDPOINTS.myHolds)
            setHolds(data.results ?? data)
        } catch {
            setError('Failed to load your holdings.')
        } finally {
            setLoading(false)
        }
    }

    async function handleCancel(holdId: string) {
        if (!confirm('Are you sure you want to cancel this hold?')) return
        setCancellingId(holdId)
        try {
            await apiFetch(`${API_BASE_URL}/holds/${holdId}/release/`, { method: 'POST' })
            fetchHolds()
        } catch {
            alert('Failed to cancel hold. Please try again.')
        } finally {
            setCancellingId(null)
        }
    }

    const user = JSON.parse(localStorage.getItem('user_profile') || '{}')
    const activeHolds = holds.filter(h => h.status === 'ACTIVE')
    const pastHolds = holds.filter(h => h.status !== 'ACTIVE')

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>

            {/* Header */}
            <header
                className="shrink-0 px-8 py-4 flex items-center justify-between"
                style={{
                    background: 'linear-gradient(135deg, #0f2040 0%, #1a2f5e 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                    >
                        <MapPin size={18} color="white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <span
                            className="font-bold text-white text-lg block leading-none"
                            style={{ letterSpacing: '-0.03em' }}
                        >
                            PlotVista
                        </span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            My Holdings
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/ventures')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80 text-white"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                        <ArrowLeft size={12} />
                        Back to Ventures
                    </button>
                    <button
                        onClick={() => { localStorage.clear(); navigate('/login') }}
                        className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">

                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
                        My Holdings
                    </h1>
                    <p className="text-sm" style={{ color: '#64748b' }}>
                        Welcome, {user.full_name || 'User'} — here are your plot bookings
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Active Holds', count: activeHolds.length, color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
                        { label: 'Total Holds', count: holds.length, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
                        { label: 'Converted', count: holds.filter(h => h.status === 'CONVERTED').length, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                    ].map(stat => (
                        <div
                            key={stat.label}
                            className="rounded-2xl p-4 text-center"
                            style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
                        >
                            <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.count}</p>
                            <p className="text-xs font-medium mt-1" style={{ color: stat.color }}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="text-4xl mb-3">⚙️</div>
                            <p style={{ color: '#64748b' }}>Loading your holdings...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                        {error}
                        <button onClick={fetchHolds} className="ml-3 underline font-medium">Retry</button>
                    </div>
                )}

                {!loading && holds.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🏡</div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: '#0f172a' }}>No holdings yet</h3>
                        <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                            Browse ventures and book your dream plot
                        </p>
                        <button
                            onClick={() => navigate('/ventures')}
                            className="px-6 py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
                        >
                            Browse Ventures
                        </button>
                    </div>
                )}

                {activeHolds.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#0f172a' }}>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            Active Holdings ({activeHolds.length})
                        </h2>
                        <div className="flex flex-col gap-4">
                            {activeHolds.map(hold => (
                                <HoldCard
                                    key={hold.id}
                                    hold={hold}
                                    onCancel={handleCancel}
                                    cancellingId={cancellingId}
                                    onCall={() => setShowCallDialog(true)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {pastHolds.length > 0 && (
                    <div>
                        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#64748b' }}>
                            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                            Past Holdings ({pastHolds.length})
                        </h2>
                        <div className="flex flex-col gap-4">
                            {pastHolds.map(hold => (
                                <HoldCard
                                    key={hold.id}
                                    hold={hold}
                                    onCancel={handleCancel}
                                    cancellingId={cancellingId}
                                    onCall={() => setShowCallDialog(true)}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Call Dialog */}
            {showCallDialog && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowCallDialog(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 mx-4 flex flex-col items-center gap-4"
                        style={{ width: 300, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}
                        >
                            <Phone size={28} color="#16a34a" />
                        </div>

                        <div className="text-center">
                            <h3 className="text-lg font-bold" style={{ color: '#0f172a' }}>
                                Contact Us
                            </h3>
                            <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                                Call us for more details about your holding
                            </p>
                        </div>


                        <a href="tel:+91123456789"
                            style={{
                                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                color: 'white',
                                display: 'block',
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                textDecoration: 'none',
                            }}
                        >
                            +91 123456789
                        </a>

                        <p className="text-xs text-center" style={{ color: '#94a3b8' }}>
                            Available Mon–Sat, 9:00 AM – 6:00 PM
                        </p>

                        <button
                            onClick={() => setShowCallDialog(false)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '12px',
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: '14px',
                                fontWeight: '500',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )
            }

        </div >
    )
}