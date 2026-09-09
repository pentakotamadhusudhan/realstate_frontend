import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ENDPOINTS } from '../lib/api'
import { MapPin, Home, ChevronRight } from 'lucide-react'

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

export default function VentureSelect() {
    const [ventures, setVentures] = useState<Venture[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

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

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">

            {/* Header */}
            <div
                className="px-8 py-5 flex items-center justify-between shrink-0"
                style={{
                    background: 'linear-gradient(135deg, #0f2040 0%, #1e4080 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                    >
                        <MapPin size={15} color="white" />
                    </div>
                    <div>
                        <span className="font-bold text-white text-sm block">PlotVista</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            Select a venture to explore
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        localStorage.clear()
                        navigate('/login')
                    }}
                    className="text-xs text-gray-400 hover:text-white transition"
                >
                    Logout
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl mx-auto w-full">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Find Your Dream Plot
                    </h1>
                    <p className="text-gray-400">
                        Choose a venture to explore available plots
                    </p>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="text-4xl mb-3">⚙️</div>
                            <p className="text-gray-400">Loading ventures...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {ventures.map(venture => (
                        <div
                            key={venture.id}
                            onClick={() => handleSelect(venture)}
                            className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-200"
                            style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
                        >
                            {/* Top color bar */}
                            <div
                                className="h-1.5 w-full"
                                style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
                            />

                            <div className="p-6">
                                {/* Status badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${venture.status === 'PUBLISHED'
                                            ? 'bg-green-900/50 text-green-400'
                                            : 'bg-yellow-900/50 text-yellow-400'
                                        }`}>
                                        {venture.status}
                                    </span>
                                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                                        <Home size={11} />
                                        {venture.total_plots} plots
                                    </div>
                                </div>

                                {/* Name and location */}
                                <h2 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition">
                                    {venture.name}
                                </h2>
                                <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-4">
                                    <MapPin size={12} />
                                    {venture.city}, {venture.state}
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div
                                        className="rounded-xl p-3 text-center"
                                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                                    >
                                        <p className="text-2xl font-bold text-emerald-400">
                                            {venture.available_plots}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">Available</p>
                                    </div>
                                    <div
                                        className="rounded-xl p-3 text-center"
                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                                    >
                                        <p className="text-2xl font-bold text-red-400">
                                            {venture.total_plots - venture.available_plots}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">Booked</p>
                                    </div>
                                </div>

                                {/* Amenities */}
                                {venture.amenities && venture.amenities.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-5">
                                        {venture.amenities.slice(0, 4).map((a: string) => (
                                            <span
                                                key={a}
                                                className="text-xs px-2 py-0.5 rounded-full"
                                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                                            >
                                                {a}
                                            </span>
                                        ))}
                                        {venture.amenities.length > 4 && (
                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full"
                                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                                            >
                                                +{venture.amenities.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* CTA */}
                                <button
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition group-hover:opacity-90"
                                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white' }}
                                >
                                    Explore Plots
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}