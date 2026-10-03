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
    if (p >= 100000) return `₹${(p / 100000).toFixed(1)} L`
    return `₹${p.toLocaleString('en-IN')}`
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
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
    icon: React.ReactElement
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
    ACTIVE: { label: 'Active', icon: <CheckCircle size={13} /> },
    EXPIRED: { label: 'Expired', icon: <XCircle size={13} /> },
    CANCELLED: { label: 'Cancelled', icon: <XCircle size={13} /> },
    CONVERTED: { label: 'Converted', icon: <CheckCircle size={13} /> },
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
    const isActive = hold.status === 'ACTIVE'

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                maxWidth: 640,
            }}
        >
            {/* Top accent bar */}
            <div
                className="h-1.5 w-full"
                style={{
                    background: isActive ? '#10b981' : '#d1d5db',
                }}
            />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-xl" style={{ color: '#111827' }}>
                        Plot {hold.plot_detail?.plot_number || 'N/A'}
                    </h3>
                    {hold.plot_detail?.total_price && (
                        <span className="font-bold text-base" style={{ color: '#111827' }}>
                            {formatPrice(hold.plot_detail.total_price)}
                        </span>
                    )}
                </div>

                {/* Subtitle */}
                <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                    HLD-{hold.id.slice(0, 5).toUpperCase()}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl p-3" style={{ background: '#f9fafb' }}>
                        <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>Area</p>
                        <p className="font-semibold text-sm" style={{ color: '#111827' }}>
                            {hold.plot_detail?.area_sqft
                                ? `${parseFloat(hold.plot_detail.area_sqft).toLocaleString()} sqft`
                                : 'N/A'}
                        </p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#f9fafb' }}>
                        <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>Held on</p>
                        <p className="font-semibold text-sm" style={{ color: '#111827' }}>
                            {formatDate(hold.held_at)}
                        </p>
                    </div>
                </div>

                {/* Time remaining */}
                {isActive && (
                    <div className="flex items-center gap-2 mb-5">
                        <Clock size={15} color="#10b981" />
                        <span className="text-sm font-medium" style={{ color: '#10b981' }}>
                            {timeRemaining(hold.expires_at)}
                        </span>
                    </div>
                )}

                {!isActive && (
                    <div className="flex items-center gap-2 mb-5">
                        <XCircle size={15} color="#9ca3af" />
                        <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>
                            {STATUS_CONFIG[hold.status]?.label}
                        </span>
                    </div>
                )}

                {hold.notes && (
                    <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                        📝 {hold.notes}
                    </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                    {isActive && (
                        <button
                            onClick={() => onCancel(hold.id)}
                            disabled={cancellingId === hold.id}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: 'white',
                                border: 'none',
                            }}
                        >
                            {cancellingId === hold.id ? 'Cancelling...' : 'Cancel Hold'}
                        </button>
                    )}
                    <button
                        onClick={onCall}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition hover:opacity-80"
                        style={{
                            background: 'white',
                            color: '#374151',
                            border: '1px solid #e5e7eb',
                        }}
                    >
                        Call Agent
                    </button>
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

    const statCards = [
        {
            label: 'Active Holds',
            count: activeHolds.length,
            bg: 'linear-gradient(135deg, #10b981, #059669)',
        },
        {
            label: 'Total Holds',
            count: holds.length,
            bg: 'linear-gradient(135deg, #0f2040, #1e3a6e)',
        },
        {
            label: 'Converted',
            count: holds.filter(h => h.status === 'CONVERTED').length,
            bg: 'linear-gradient(135deg, #f97316, #ea580c)',
        },
    ]

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#f9fafb' }}>

            {/* Header */}
            <header
                className="shrink-0 px-8 py-4 flex items-center justify-between"
                style={{
                    background: 'linear-gradient(135deg, #0f2040 0%, #1a2f5e 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                    >
                        <MapPin size={18} color="white" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-white text-lg" style={{ letterSpacing: '-0.03em' }}>
                        PlotVista
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/ventures')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-80"
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
            <div className="flex-1 overflow-y-auto px-6 py-10 max-w-3xl mx-auto w-full">

                {/* Page title */}
                <h1 className="text-3xl font-bold mb-8" style={{ color: '#111827' }}>
                    My holdings
                </h1>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    {statCards.map(stat => (
                        <div
                            key={stat.label}
                            className="rounded-2xl p-5"
                            style={{ background: stat.bg }}
                        >
                            <p className="text-3xl font-bold text-white">{stat.count}</p>
                            <p className="text-sm text-white mt-1 opacity-90">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="text-4xl mb-3">⚙️</div>
                            <p style={{ color: '#6b7280' }}>Loading your holdings...</p>
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
                        <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>No holdings yet</h3>
                        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
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

                {/* Active holdings */}
                {activeHolds.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                            Active holdings
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

                {/* Past holdings */}
                {pastHolds.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                            Past holdings
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
                            style={{ background: '#dcfce7' }}
                        >
                            <Phone size={28} color="#16a34a" />
                        </div>

                        <div className="text-center">
                            <h3 className="text-lg font-bold" style={{ color: '#111827' }}>Contact Us</h3>
                            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
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

                        <p className="text-xs text-center" style={{ color: '#9ca3af' }}>
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
            )}

        </div>
    )
}