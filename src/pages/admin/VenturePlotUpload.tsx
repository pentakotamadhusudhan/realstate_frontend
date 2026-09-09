import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { apiFetch, ENDPOINTS } from '../../lib/api'

interface PlotForm {
    plot_number: string
    price_per_sqft: string
    total_price: string
    area_sqft: string
    status: string
    notes: string
}

interface DrawnPlot {
    tempId: string
    coordinates: { lat: number; lng: number }[]
    form: PlotForm
    saved: boolean
    layerRef?: L.Layer
}

const DEFAULT_FORM: PlotForm = {
    plot_number: '',
    price_per_sqft: '',
    total_price: '',
    area_sqft: '',
    status: 'AVAILABLE',
    notes: '',
}

function GeomanDrawControls({ onPlotCreated }: { onPlotCreated: (layer: any) => void }) {
    const map = useMap()
    useEffect(() => {
        if (!map) return
        map.pm.addControls({
            position: 'topleft',
            drawMarker: false,
            drawCircleMarker: false,
            drawPolyline: false,
            drawRectangle: true,
            drawPolygon: true,
            drawCircle: false,
            editMode: true,
            removalMode: true,
        })
        map.on('pm:create', (e: any) => { onPlotCreated(e.layer) })
        return () => {
            map.pm.removeControls()
            map.off('pm:create')
        }
    }, [map, onPlotCreated])
    return null
}

// Captures map instance and triggers existing plot load
function MapRefCapture({
    mapRef,
    onMapReady,
}: {
    mapRef: React.MutableRefObject<L.Map | null>
    onMapReady: () => void
}) {
    const map = useMap()
    useEffect(() => {
        if (!map) return
        mapRef.current = map
        onMapReady()
    }, [map])
    return null
}

export default function VenturePlotUpload() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [venture, setVenture] = useState<any>(null)
    const [plots, setPlots] = useState<DrawnPlot[]>([])
    const [selectedTempId, setSelectedTempId] = useState<string | null>(null)
    const [form, setForm] = useState<PlotForm>(DEFAULT_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const mapRef = useRef<L.Map | null>(null)
    const plotsLoadedRef = useRef(false)

    useEffect(() => {
        document.body.classList.add('admin-page')
        const stored = sessionStorage.getItem('selected_venture')
        if (stored) {
            setVenture(JSON.parse(stored))
        } else {
            navigate('/admin/ventures')
        }
        return () => document.body.classList.remove('admin-page')
    }, [navigate])

    useEffect(() => {
        const area = parseFloat(form.area_sqft)
        const pricePerSqft = parseFloat(form.price_per_sqft)
        if (area && pricePerSqft) {
            setForm(f => ({ ...f, total_price: (area * pricePerSqft).toFixed(2) }))
        }
    }, [form.area_sqft, form.price_per_sqft])

    const handleSelectPlot = useCallback((tempId: string) => {
        setPlots(prev => prev.map(p => {
            if (p.layerRef) {
                if (p.tempId === tempId) {
                    (p.layerRef as any).setStyle({ color: '#e11d48', weight: 4 })
                } else {
                    (p.layerRef as any).setStyle({
                        color: p.saved ? '#16a34a' : '#3b82f6',
                        weight: 2,
                    })
                }
            }
            return p
        }))
        setSelectedTempId(tempId)
        setPlots(prev => {
            const plot = prev.find(p => p.tempId === tempId)
            if (plot) setForm(plot.form)
            return prev
        })
    }, [])

    // Called when map is ready
    const handleMapReady = useCallback(async () => {
        if (plotsLoadedRef.current || !venture || !mapRef.current) return
        plotsLoadedRef.current = true

        try {
            const data = await apiFetch(`${ENDPOINTS.plots}?venture=${venture.id}`)
            const results = data.results ?? data

            results.forEach((apiPlot: any) => {
                if (!apiPlot.coordinates || apiPlot.coordinates.length < 3) return

                const latlngs: [number, number][] = apiPlot.coordinates.map((c: any) => [c.lat, c.lng])

                const color = apiPlot.status === 'AVAILABLE' ? '#16a34a'
                    : apiPlot.status === 'SOLD' ? '#ef4444'
                        : apiPlot.status === 'HELD' ? '#f59e0b'
                            : '#6b7280'

                const layer = L.polygon(latlngs, {
                    color,
                    fillColor: color,
                    fillOpacity: 0.4,
                    weight: 2,
                })

                layer.bindTooltip(`Plot ${apiPlot.plot_number}`, {
                    permanent: true,
                    direction: 'center',
                    className: 'plot-label-tooltip',
                })

                const tempId = `existing-${apiPlot.id}`

                layer.on('click', () => handleSelectPlot(tempId))

                const existingPlot: DrawnPlot = {
                    tempId,
                    coordinates: apiPlot.coordinates,
                    form: {
                        plot_number: apiPlot.plot_number,
                        area_sqft: apiPlot.area_sqft?.toString() || '',
                        price_per_sqft: apiPlot.price_per_sqft?.toString() || '',
                        total_price: apiPlot.total_price?.toString() || '',
                        status: apiPlot.status,
                        notes: apiPlot.notes || '',
                    },
                    saved: true,
                    layerRef: layer,
                }

                // Add to map immediately
                layer.addTo(mapRef.current!)

                setPlots(prev => {
                    if (prev.find(p => p.tempId === tempId)) return prev
                    return [...prev, existingPlot]
                })
            })
        } catch (err) {
            console.error('Failed to fetch existing plots:', err)
        }
    }, [venture, handleSelectPlot])

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleShapeCreated = useCallback((layer: any) => {
        let latlngs = layer.getLatLngs()
        if (Array.isArray(latlngs) && Array.isArray(latlngs[0])) {
            latlngs = latlngs[0]
        }
        const coordinates = latlngs.map((ll: any) => ({ lat: ll.lat, lng: ll.lng }))
        const tempId = `temp-${Date.now()}`
        const newPlot: DrawnPlot = {
            tempId,
            coordinates,
            form: { ...DEFAULT_FORM },
            saved: false,
            layerRef: layer,
        }
        layer.setStyle({ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3 })
        layer.on('click', () => handleSelectPlot(tempId))
        setPlots(prev => [...prev, newPlot])
        setSelectedTempId(tempId)
        setForm({ ...DEFAULT_FORM })
    }, [handleSelectPlot])

    function handleSavePlotDetails() {
        if (!form.plot_number || !form.area_sqft || !form.total_price) {
            setError('Plot number, area and total price are required.')
            return
        }
        const duplicate = plots.find(
            p => p.form.plot_number === form.plot_number && p.tempId !== selectedTempId
        )
        if (duplicate) {
            setError(`Plot number ${form.plot_number} already exists.`)
            return
        }
        setError('')
        setPlots(prev => prev.map(p => {
            if (p.tempId === selectedTempId) {
                if (p.layerRef) {
                    (p.layerRef as any).setStyle({
                        color: '#16a34a',
                        fillColor: '#16a34a',
                        fillOpacity: 0.4,
                    })
                    p.layerRef.unbindTooltip()
                    p.layerRef.bindTooltip(`Plot ${form.plot_number}`, {
                        permanent: true,
                        direction: 'center',
                        className: 'plot-label-tooltip',
                    })
                }
                return { ...p, form: { ...form }, saved: true }
            }
            return p
        }))
        setSelectedTempId(null)
        setForm(DEFAULT_FORM)
    }

    function handleDeletePlot(tempId: string) {
        const target = plots.find(p => p.tempId === tempId)
        if (target?.layerRef) target.layerRef.remove()
        setPlots(prev => prev.filter(p => p.tempId !== tempId))
        if (selectedTempId === tempId) {
            setSelectedTempId(null)
            setForm(DEFAULT_FORM)
        }
    }

    async function handleSubmitAll() {
        if (plots.length === 0) { setError('No plots drawn yet.'); return }
        const unsaved = plots.filter(p => !p.saved)
        if (unsaved.length > 0) {
            setError(`${unsaved.length} plots have unsaved details.`)
            return
        }
        setSubmitting(true)
        setError('')
        try {
            // Only submit new plots (not existing ones)
            const newPlots = plots.filter(p => p.tempId.startsWith('temp-'))
            if (newPlots.length === 0) {
                setError('No new plots to submit.')
                setSubmitting(false)
                return
            }
            const payload = {
                plots: newPlots.map(p => ({
                    plot_number: p.form.plot_number,
                    coordinates: p.coordinates,
                    area_sqft: parseFloat(p.form.area_sqft),
                    total_price: parseFloat(p.form.total_price),
                    price_per_sqft: p.form.price_per_sqft ? parseFloat(p.form.price_per_sqft) : null,
                    status: p.form.status,
                    notes: p.form.notes,
                })),
            }
            await apiFetch(
                `http://192.168.1.10:8000/api/ventures/${slug}/plots/bulk-upload/`,
                { method: 'POST', body: JSON.stringify(payload) }
            )
            alert(`${newPlots.length} new plots uploaded successfully!`)
            plotsLoadedRef.current = false
            navigate('/admin/ventures')
        } catch (err: any) {
            setError(JSON.stringify(err) || 'Failed to upload plots.')
        } finally {
            setSubmitting(false)
        }
    }

    if (!venture) return null

    const center: [number, number] = [
        parseFloat(venture.center_latitude),
        parseFloat(venture.center_longitude),
    ]

    const selectedPlot = plots.find(p => p.tempId === selectedTempId)

    return (
        <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-bold">Plot Editor</h1>
                    <p className="text-gray-400 text-sm">
                        {venture.name} — {venture.city}, {venture.state}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">
                        {plots.filter(p => p.saved).length}/{plots.length} plots
                    </span>
                    <button
                        onClick={handleSubmitAll}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                        {submitting ? 'Uploading...' : 'Submit New Plots →'}
                    </button>
                    <button
                        onClick={() => navigate('/admin/ventures')}
                        className="text-gray-400 hover:text-white text-sm transition"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-900/50 border-b border-red-700 text-red-300 px-8 py-3 text-sm shrink-0">
                    {error}
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">

                {/* Map */}
                <div className="flex-1 relative">
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] bg-gray-900/90 text-gray-300 text-xs px-4 py-2 rounded-full border border-gray-700 pointer-events-none">
                        ✏️ Use the draw tools on the left to draw plot boundaries
                    </div>
                    <MapContainer
                        center={center}
                        zoom={18}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        <MapRefCapture mapRef={mapRef} onMapReady={handleMapReady} />
                        <GeomanDrawControls onPlotCreated={handleShapeCreated} />
                    </MapContainer>
                </div>

                {/* Sidebar */}
                <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden">

                    {selectedPlot ? (
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-lg font-bold">
                                    {selectedPlot.saved
                                        ? `Plot ${selectedPlot.form.plot_number}`
                                        : 'New Plot'}
                                </h2>
                                <button
                                    onClick={() => handleDeletePlot(selectedPlot.tempId)}
                                    className="text-xs bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 px-2 py-1 rounded transition"
                                >
                                    Delete
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">Fill in the plot details</p>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Plot Number *</label>
                                    <input name="plot_number" value={form.plot_number} onChange={handleChange}
                                        placeholder="e.g. A-101"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Area (sq ft) *</label>
                                    <input name="area_sqft" value={form.area_sqft} onChange={handleChange}
                                        placeholder="e.g. 1200" type="number"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Price per sq ft (₹)</label>
                                    <input name="price_per_sqft" value={form.price_per_sqft} onChange={handleChange}
                                        placeholder="e.g. 3000" type="number"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Total Price (₹) *</label>
                                    <input name="total_price" value={form.total_price} onChange={handleChange}
                                        placeholder="Auto-calculated or enter manually" type="number"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                    <select name="status" value={form.status} onChange={handleChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                                        <option value="AVAILABLE">Available</option>
                                        <option value="HELD">Held</option>
                                        <option value="SOLD">Sold</option>
                                        <option value="BLOCKED">Blocked</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                                    <textarea name="notes" value={form.notes} onChange={handleChange}
                                        placeholder="Any additional notes..." rows={2}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-6">
                                <button onClick={handleSavePlotDetails}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
                                    Save Plot Details
                                </button>
                                <button onClick={() => { setSelectedTempId(null); setForm(DEFAULT_FORM) }}
                                    className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition">
                                    Cancel
                                </button>
                            </div>
                        </div>

                    ) : (
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 border-b border-gray-800">
                                <p className="text-gray-300 font-medium">Plots</p>
                                <p className="text-gray-500 text-sm mt-1">
                                    {plots.length > 0
                                        ? `${plots.filter(p => p.tempId.startsWith('existing')).length} existing • ${plots.filter(p => p.tempId.startsWith('temp')).length} new`
                                        : 'Draw a shape on the map to add a plot'}
                                </p>
                            </div>

                            {plots.length === 0 ? (
                                <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
                                    <div className="text-5xl mb-4">🗺️</div>
                                    <p className="text-gray-300 font-medium">No plots yet</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Use the draw tools on the left side of the map
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
                                    {plots.map((plot, idx) => (
                                        <div
                                            key={plot.tempId}
                                            onClick={() => handleSelectPlot(plot.tempId)}
                                            className={`rounded-lg px-4 py-3 cursor-pointer flex items-center justify-between border transition ${plot.tempId.startsWith('existing')
                                                ? 'bg-gray-800/50 border-gray-700 text-gray-300'
                                                : plot.saved
                                                    ? 'bg-green-950/30 border-green-900/50 text-green-400'
                                                    : 'bg-gray-800 border-gray-700 text-gray-300'
                                                }`}
                                        >
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {plot.saved ? `Plot ${plot.form.plot_number}` : `Shape #${idx + 1}`}
                                                </p>
                                                <p className="text-xs mt-0.5 opacity-70">
                                                    {plot.form.area_sqft ? `${plot.form.area_sqft} sqft` : 'No area'} •{' '}
                                                    {plot.form.total_price ? `₹${plot.form.total_price}` : 'No price'}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-medium ${plot.tempId.startsWith('existing') ? 'text-gray-400'
                                                : plot.saved ? 'text-green-400'
                                                    : 'text-yellow-400'
                                                }`}>
                                                {plot.tempId.startsWith('existing') ? '● Existing'
                                                    : plot.saved ? '✓ New'
                                                        : '● Unsaved'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}