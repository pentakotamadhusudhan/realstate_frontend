import DXFImportPanel from '../../components/admin/DXFImportPanel'
import PDFImportPanel, { type PDFOverlayData } from '../../components/admin/PDFImportPanel'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { apiFetch, ENDPOINTS, API_BASE_URL } from '../../lib/api'
import { getUserProfile, isAgent, hasActiveMembership } from '../../lib/auth'
import AgentMembershipModal from '../../components/admin/AgentMembershipModal'
import {
    Sliders,
    Layers,
    Eye,
    EyeOff,
    CheckCheck,
    ChevronDown,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Sparkles
} from 'lucide-react'

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
    }, [map, onMapReady])
    return null
}

function computePolygonAreaSqft(coords: { lat: number; lng: number }[]): number {
    if (coords.length < 3) return 0
    const centerLat = coords[0].lat
    const centerLng = coords[0].lng
    const cosLat = Math.cos((centerLat * Math.PI) / 180)

    const points = coords.map(c => ({
        x: (c.lng - centerLng) * 111320 * cosLat,
        y: (c.lat - centerLat) * 111320,
    }))

    let areaM2 = 0
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length
        areaM2 += points[i].x * points[j].y
        areaM2 -= points[j].x * points[i].y
    }
    areaM2 = Math.abs(areaM2) / 2
    return Math.round(areaM2 * 10.7639)
}

export default function VenturePlotUpload() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const user = getUserProfile()
    const userIsAgent = isAgent(user)
    const [userHasMembership, setUserHasMembership] = useState(hasActiveMembership(user))
    const [showMembershipModal, setShowMembershipModal] = useState(false)
    const [venture, setVenture] = useState<any>(null)
    const [plots, setPlots] = useState<DrawnPlot[]>([])
    const [selectedTempId, setSelectedTempId] = useState<string | null>(null)
    const [form, setForm] = useState<PlotForm>(DEFAULT_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [showDXFPanel, setShowDXFPanel] = useState(false)
    const [showPDFPanel, setShowPDFPanel] = useState(false)
    const pdfOverlayRef = useRef<L.ImageOverlay | null>(null)
    const [hasPdfOverlay, setHasPdfOverlay] = useState(false)
    const [pdfFloatingOpen, setPdfFloatingOpen] = useState(true)
    const [pdfOverlayOpacity, setPdfOverlayOpacity] = useState(65)
    const [pdfOverlayVisible, setPdfOverlayVisible] = useState(true)
    const [bulkPriceInput, setBulkPriceInput] = useState('1200')
    const lastOverlayDataRef = useRef<PDFOverlayData | null>(null)
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
        setPlots(prev => {
            const updated = prev.map(p => {
                if (p.layerRef) {
                    if (p.tempId === tempId) {
                        (p.layerRef as any).setStyle({ color: '#e11d48', weight: 4, fillOpacity: 0.5 })
                        if ((p.layerRef as any).pm) {
                            (p.layerRef as any).pm.enable({
                                allowSelfIntersection: false,
                            })
                            if (typeof (p.layerRef as any).pm.setOptions === 'function') {
                                (p.layerRef as any).pm.setOptions({ draggable: true })
                            }
                            if (typeof (p.layerRef as any).pm.enableLayerDrag === 'function') {
                                (p.layerRef as any).pm.enableLayerDrag()
                            }
                        }
                    } else {
                        (p.layerRef as any).setStyle({
                            color: p.saved
                                ? '#16a34a'
                                : p.tempId.startsWith('pdf-')
                                    ? '#ef4444'
                                    : p.tempId.startsWith('dxf-')
                                        ? '#f59e0b'
                                        : '#3b82f6',
                            weight: 2,
                            fillOpacity: 0.3,
                        })
                        if ((p.layerRef as any).pm) {
                            if ((p.layerRef as any).pm.enabled()) {
                                (p.layerRef as any).pm.disable()
                            }
                            if (typeof (p.layerRef as any).pm.disableLayerDrag === 'function') {
                                (p.layerRef as any).pm.disableLayerDrag()
                            }
                        }
                    }
                }
                return p
            })
            const selected = updated.find(p => p.tempId === tempId)
            if (selected) setForm(selected.form)
            return updated
        })
        setSelectedTempId(tempId)
    }, [])

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
                    color, fillColor: color, fillOpacity: 0.4, weight: 2,
                })

                layer.bindTooltip(`Plot ${apiPlot.plot_number}`, {
                    permanent: true, direction: 'center', className: 'plot-label-tooltip',
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
        if (Array.isArray(latlngs) && Array.isArray(latlngs[0])) latlngs = latlngs[0]
        const coordinates = latlngs.map((ll: any) => ({ lat: ll.lat, lng: ll.lng }))
        const tempId = `temp-${Date.now()}`
        const initialArea = computePolygonAreaSqft(coordinates).toString()

        const handleLayerEdit = () => {
            let currentLatLngs = (layer as any).getLatLngs()
            if (Array.isArray(currentLatLngs) && Array.isArray(currentLatLngs[0])) currentLatLngs = currentLatLngs[0]
            const updatedCoords = currentLatLngs.map((ll: any) => ({ lat: ll.lat, lng: ll.lng }))
            const newArea = computePolygonAreaSqft(updatedCoords)
            setPlots(prev => prev.map(p => p.tempId === tempId ? {
                ...p,
                coordinates: updatedCoords,
                form: { ...p.form, area_sqft: newArea > 0 ? newArea.toString() : p.form.area_sqft },
            } : p))
            setForm(f => ({ ...f, area_sqft: newArea > 0 ? newArea.toString() : f.area_sqft }))
        }

        layer.on('pm:edit pm:dragend pm:markerdragend pm:vertexadded pm:vertexremoved', handleLayerEdit)

        const newPlot: DrawnPlot = {
            tempId, coordinates,
            form: { ...DEFAULT_FORM, area_sqft: initialArea },
            saved: false, layerRef: layer,
        }
        layer.setStyle({ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3 })
        layer.on('click', () => handleSelectPlot(tempId))
        setPlots(prev => [...prev, newPlot])
        setSelectedTempId(tempId)
        setForm({ ...DEFAULT_FORM, area_sqft: initialArea })
    }, [handleSelectPlot])

    // ── DXF Import handler ──────────────────────────────────────
    function handleDXFImport(dxfPlots: any[]) {
        if (!mapRef.current) {
            console.error('Map not ready')
            return
        }

        console.log('Importing DXF plots:', dxfPlots.length)

        const newPlots: DrawnPlot[] = []

        dxfPlots.forEach((dxfPlot, index) => {
            if (!dxfPlot.coordinates || dxfPlot.coordinates.length < 3) return

            const latlngs: [number, number][] = dxfPlot.coordinates.map(
                (c: any) => [c.lat, c.lng]
            )

            const layer = L.polygon(latlngs, {
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.25,
                weight: 2,
                dashArray: '4 4',
            })

            layer.addTo(mapRef.current!)

            const tempId = `dxf-${Date.now()}-${index}`

            const newPlot: DrawnPlot = {
                tempId,
                coordinates: dxfPlot.coordinates,
                form: {
                    ...DEFAULT_FORM,
                    area_sqft: dxfPlot.approx_area_sqft
                        ? Math.round(dxfPlot.approx_area_sqft).toString()
                        : '',
                },
                saved: false,
                layerRef: layer,
            }

            layer.on('click', () => handleSelectPlot(tempId))
            newPlots.push(newPlot)
        })

        // Batch state update
        setPlots(prev => [...prev, ...newPlots])

        // Fit map to imported plots
        if (newPlots.length > 0 && mapRef.current) {
            const allCoords = newPlots.flatMap(p => p.coordinates)
            const bounds = L.latLngBounds(allCoords.map(c => [c.lat, c.lng] as [number, number]))
            mapRef.current.fitBounds(bounds, { padding: [40, 40] })
        }
    }

    // ── PDF Overlay Handler ────────────────────────────────────
    const handlePdfOverlayChange = useCallback((data: PDFOverlayData) => {
        if (!mapRef.current) return
        lastOverlayDataRef.current = data

        if (data.remove) {
            if (pdfOverlayRef.current) {
                pdfOverlayRef.current.remove()
                pdfOverlayRef.current = null
            }
            setHasPdfOverlay(false)
            return
        }

        if (data.imageUrl && data.bounds) {
            if (pdfOverlayRef.current) {
                pdfOverlayRef.current.remove()
            }
            const overlay = L.imageOverlay(data.imageUrl, data.bounds, {
                opacity: data.opacity ?? 0.65,
                interactive: false,
                zIndex: 400,
            })
            overlay.addTo(mapRef.current)
            pdfOverlayRef.current = overlay
            setHasPdfOverlay(true)
            setPdfOverlayVisible(true)
            setPdfOverlayOpacity(Math.round((data.opacity ?? 0.65) * 100))
            mapRef.current.fitBounds(data.bounds, { padding: [40, 40] })
        } else if (pdfOverlayRef.current && data.opacity !== undefined) {
            pdfOverlayRef.current.setOpacity(data.opacity)
            setPdfOverlayOpacity(Math.round(data.opacity * 100))
        }
    }, [])

    function togglePdfOverlayVisibility() {
        if (!mapRef.current) return
        if (pdfOverlayVisible) {
            if (pdfOverlayRef.current) {
                pdfOverlayRef.current.remove()
            }
            setPdfOverlayVisible(false)
        } else {
            if (pdfOverlayRef.current) {
                pdfOverlayRef.current.addTo(mapRef.current)
                pdfOverlayRef.current.setOpacity(pdfOverlayOpacity / 100)
            } else if (lastOverlayDataRef.current?.imageUrl && lastOverlayDataRef.current?.bounds) {
                const overlay = L.imageOverlay(lastOverlayDataRef.current.imageUrl, lastOverlayDataRef.current.bounds, {
                    opacity: pdfOverlayOpacity / 100,
                    interactive: false,
                    zIndex: 400,
                })
                overlay.addTo(mapRef.current)
                pdfOverlayRef.current = overlay
            }
            setPdfOverlayVisible(true)
        }
    }

    function handlePdfOpacityChange(newOpacity: number) {
        setPdfOverlayOpacity(newOpacity)
        if (pdfOverlayRef.current) {
            pdfOverlayRef.current.setOpacity(newOpacity / 100)
        }
    }

    function handleNudgePDFPlots(dLatM: number, dLngM: number) {
        if (!venture) return
        const vLat = parseFloat(venture.center_latitude) || center[0]
        const dLat = dLatM / 111320
        const dLng = dLngM / (111320 * Math.cos((vLat * Math.PI) / 180))

        setPlots(prev => prev.map(p => {
            if (p.tempId.startsWith('pdf-')) {
                const newCoords = p.coordinates.map(c => ({
                    lat: c.lat + dLat,
                    lng: c.lng + dLng,
                }))
                if (p.layerRef) {
                    const latlngs = newCoords.map(c => [c.lat, c.lng])
                        ; (p.layerRef as any).setLatLngs(latlngs)
                }
                return {
                    ...p,
                    coordinates: newCoords,
                }
            }
            return p
        }))

        // Also shift overlay bounds if active
        if (pdfOverlayRef.current) {
            const curBounds = pdfOverlayRef.current.getBounds()
            const sw = curBounds.getSouthWest()
            const ne = curBounds.getNorthEast()
            const newBounds = L.latLngBounds(
                [sw.lat + dLat, sw.lng + dLng],
                [ne.lat + dLat, ne.lng + dLng]
            )
            pdfOverlayRef.current.setBounds(newBounds)
        }
    }

    function handleBulkSetPrice(price: number) {
        if (!price || isNaN(price)) return
        setPlots(prev => prev.map(p => {
            if (p.tempId.startsWith('pdf-') || p.tempId.startsWith('dxf-') || p.tempId.startsWith('temp-')) {
                const area = parseFloat(p.form.area_sqft) || computePolygonAreaSqft(p.coordinates)
                const totalPrice = (area * price).toFixed(2)
                if (p.layerRef) {
                    (p.layerRef as any).setStyle({
                        color: '#16a34a',
                        fillColor: '#16a34a',
                        fillOpacity: 0.4,
                    })
                }
                return {
                    ...p,
                    form: {
                        ...p.form,
                        price_per_sqft: price.toString(),
                        total_price: totalPrice,
                    },
                    saved: true,
                }
            }
            return p
        }))
    }

    function handleMarkAllSaved() {
        setPlots(prev => prev.map(p => {
            if (!p.saved) {
                if (p.layerRef) {
                    (p.layerRef as any).setStyle({
                        color: '#16a34a',
                        fillColor: '#16a34a',
                        fillOpacity: 0.4,
                    })
                }
                const area = parseFloat(p.form.area_sqft) || computePolygonAreaSqft(p.coordinates)
                const ppsq = parseFloat(p.form.price_per_sqft) || 1200
                return {
                    ...p,
                    form: {
                        ...p.form,
                        price_per_sqft: ppsq.toString(),
                        total_price: p.form.total_price || (area * ppsq).toFixed(2),
                    },
                    saved: true,
                }
            }
            return p
        }))
    }

    // ── PDF Import handler ──────────────────────────────────────
    function handlePDFImport(pdfPlots: any[]) {
        if (!mapRef.current) {
            console.error('Map not ready')
            return
        }

        console.log('Importing PDF plots:', pdfPlots.length)

        setPlots(prev => {
            const existingPdfPlots = prev.filter(p => p.tempId.startsWith('pdf-') && !p.saved)

            // If the number of plots matches existing unsaved PDF plots, smoothly update coordinates without recreating
            if (existingPdfPlots.length === pdfPlots.length && existingPdfPlots.length > 0) {
                return prev.map(p => {
                    if (p.tempId.startsWith('pdf-') && !p.saved) {
                        const parts = p.tempId.split('-')
                        const idx = parseInt(parts[parts.length - 1], 10)
                        const newPlot = pdfPlots[idx]
                        if (newPlot && p.layerRef) {
                            const latlngs: [number, number][] = newPlot.coordinates.map((c: any) => [c.lat, c.lng])
                                ; (p.layerRef as any).setLatLngs(latlngs)
                            const newArea = newPlot.approx_area_sqft
                                ? Math.round(newPlot.approx_area_sqft).toString()
                                : computePolygonAreaSqft(newPlot.coordinates).toString()
                            return {
                                ...p,
                                coordinates: newPlot.coordinates,
                                form: {
                                    ...p.form,
                                    area_sqft: newArea,
                                    total_price: p.form.price_per_sqft
                                        ? (parseFloat(newArea) * parseFloat(p.form.price_per_sqft)).toFixed(2)
                                        : p.form.total_price,
                                },
                            }
                        }
                    }
                    return p
                })
            }

            // Otherwise, cleanly recreate layers
            existingPdfPlots.forEach(p => {
                if (p.layerRef) {
                    if ((p.layerRef as any).pm && (p.layerRef as any).pm.enabled()) {
                        (p.layerRef as any).pm.disable()
                    }
                    p.layerRef.remove()
                }
            })

            const preservedPlots = prev.filter(p => !p.tempId.startsWith('pdf-') || p.saved)
            const newPlots: DrawnPlot[] = []
            const timestamp = Date.now()

            pdfPlots.forEach((pdfPlot, index) => {
                if (!pdfPlot.coordinates || pdfPlot.coordinates.length < 3) return

                const latlngs: [number, number][] = pdfPlot.coordinates.map(
                    (c: any) => [c.lat, c.lng]
                )

                const layer = L.polygon(latlngs, {
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.35,
                    weight: 2,
                })

                layer.addTo(mapRef.current!)

                const tempId = `pdf-${timestamp}-${index}`
                const plotNumber = pdfPlot.plot_number ? String(pdfPlot.plot_number) : `${index + 1}`

                layer.bindTooltip(`Plot ${plotNumber}`, {
                    permanent: true,
                    direction: 'center',
                    className: 'plot-label-tooltip',
                })

                // Bind Geoman edit and drag events to make the box boundaries directly editable on the map
                const handleLayerEdit = () => {
                    let currentLatLngs = (layer as any).getLatLngs()
                    if (Array.isArray(currentLatLngs) && Array.isArray(currentLatLngs[0])) currentLatLngs = currentLatLngs[0]
                    const updatedCoords = currentLatLngs.map((ll: any) => ({ lat: ll.lat, lng: ll.lng }))
                    const newArea = computePolygonAreaSqft(updatedCoords)
                    setPlots(curr => curr.map(p => p.tempId === tempId ? {
                        ...p,
                        coordinates: updatedCoords,
                        form: {
                            ...p.form,
                            area_sqft: newArea > 0 ? newArea.toString() : p.form.area_sqft,
                            total_price: p.form.price_per_sqft && newArea > 0
                                ? (newArea * parseFloat(p.form.price_per_sqft)).toFixed(2)
                                : p.form.total_price
                        },
                    } : p))
                    setForm(f => ({
                        ...f,
                        area_sqft: newArea > 0 ? newArea.toString() : f.area_sqft,
                        total_price: f.price_per_sqft && newArea > 0
                            ? (newArea * parseFloat(f.price_per_sqft)).toFixed(2)
                            : f.total_price
                    }))
                }

                layer.on('pm:edit pm:dragend pm:markerdragend pm:vertexadded pm:vertexremoved', handleLayerEdit)

                const calculatedArea = pdfPlot.approx_area_sqft
                    ? Math.round(pdfPlot.approx_area_sqft).toString()
                    : computePolygonAreaSqft(pdfPlot.coordinates).toString()

                const newPlot: DrawnPlot = {
                    tempId,
                    coordinates: pdfPlot.coordinates,
                    form: {
                        ...DEFAULT_FORM,
                        plot_number: plotNumber,
                        area_sqft: calculatedArea,
                    },
                    saved: false,
                    layerRef: layer,
                }

                layer.on('click', () => handleSelectPlot(tempId))
                newPlots.push(newPlot)
            })

            // Fit map to imported plots
            if (newPlots.length > 0 && mapRef.current) {
                const allCoords = newPlots.flatMap(p => p.coordinates)
                const bounds = L.latLngBounds(allCoords.map(c => [c.lat, c.lng] as [number, number]))
                mapRef.current.fitBounds(bounds, { padding: [40, 40] })
                setTimeout(() => handleSelectPlot(newPlots[0].tempId), 50)
            }

            return [...preservedPlots, ...newPlots]
        })
    }

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
                        color: '#16a34a', fillColor: '#16a34a',
                        fillOpacity: 0.4, dashArray: null,
                    })
                    if ((p.layerRef as any).pm) {
                        if ((p.layerRef as any).pm.enabled()) {
                            (p.layerRef as any).pm.disable()
                        }
                        if (typeof (p.layerRef as any).pm.disableLayerDrag === 'function') {
                            (p.layerRef as any).pm.disableLayerDrag()
                        }
                    }
                    p.layerRef.unbindTooltip()
                    p.layerRef.bindTooltip(`Plot ${form.plot_number}`, {
                        permanent: true, direction: 'center', className: 'plot-label-tooltip',
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
        if (target?.layerRef) {
            if ((target.layerRef as any).pm && (target.layerRef as any).pm.enabled()) {
                (target.layerRef as any).pm.disable()
            }
            target.layerRef.remove()
        }
        setPlots(prev => prev.filter(p => p.tempId !== tempId))
        if (selectedTempId === tempId) {
            setSelectedTempId(null)
            setForm(DEFAULT_FORM)
        }
    }

    async function handleSubmitAll() {
        if (userIsAgent && !userHasMembership) {
            setShowMembershipModal(true)
            return
        }
        if (plots.length === 0) { setError('No plots drawn yet.'); return }
        const newPlots = plots.filter(
            p => p.tempId.startsWith('temp-') || p.tempId.startsWith('dxf-') || p.tempId.startsWith('pdf-')
        )
        if (newPlots.length === 0) {
            setError('No new plots to submit.')
            return
        }

        // Auto-complete price or area if missing to allow smooth submission
        const readyPlots = newPlots.map(p => {
            const area = parseFloat(p.form.area_sqft) || computePolygonAreaSqft(p.coordinates)
            const pricePerSqft = p.form.price_per_sqft ? parseFloat(p.form.price_per_sqft) : 1200
            const totalPrice = p.form.total_price ? parseFloat(p.form.total_price) : (area * pricePerSqft)
            return {
                plot_number: p.form.plot_number || 'Plot',
                coordinates: p.coordinates,
                area_sqft: area,
                total_price: totalPrice,
                price_per_sqft: pricePerSqft,
                status: p.form.status || 'AVAILABLE',
                notes: p.form.notes || '',
            }
        })

        setSubmitting(true)
        setError('')
        try {
            const payload = { plots: readyPlots }
            await apiFetch(
                `${API_BASE_URL}/ventures/${slug}/plots/bulk-upload/`,
                { method: 'POST', body: JSON.stringify(payload) }
            )
            alert(`${readyPlots.length} new plots uploaded successfully!`)
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
    const newPlotsCount = plots.filter(
        p => p.tempId.startsWith('temp-') || p.tempId.startsWith('dxf-') || p.tempId.startsWith('pdf-')
    ).length

    return (
        <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-lg font-bold">Plot Editor</h1>
                    <p className="text-gray-400 text-xs">
                        {venture.name} — {venture.city}, {venture.state}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">
                        {plots.filter(p => p.saved).length}/{plots.length} plots
                    </span>

                    {/* Import DXF button */}
                    <button
                        onClick={() => {
                            setShowDXFPanel(prev => !prev)
                            setShowPDFPanel(false)
                            setSelectedTempId(null)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                        style={{
                            background: showDXFPanel ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.15)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245,158,11,0.4)',
                        }}
                    >
                        📐 Import DXF
                    </button>

                    {/* Import PDF button */}
                    <button
                        onClick={() => {
                            setShowPDFPanel(prev => !prev)
                            setShowDXFPanel(false)
                            setSelectedTempId(null)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                        style={{
                            background: showPDFPanel ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239,68,68,0.4)',
                        }}
                    >
                        📄 Import PDF
                    </button>

                    <button
                        onClick={handleSubmitAll}
                        disabled={submitting || newPlotsCount === 0}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                    >
                        {submitting ? 'Uploading...' : `Submit ${newPlotsCount} New Plots →`}
                    </button>

                    <button
                        onClick={() => navigate('/admin/ventures')}
                        className="text-gray-400 hover:text-white text-xs transition"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-900/50 border-b border-red-700 text-red-300 px-6 py-2 text-xs shrink-0">
                    {error}
                </div>
            )}

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* Map */}
                <div className="flex-1 relative">
                    {!showDXFPanel && !showPDFPanel && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] bg-gray-900/90 text-gray-300 text-xs px-4 py-2 rounded-full border border-gray-700 pointer-events-none flex items-center gap-2 shadow-lg">
                            <span>✏️ Draw tools on the left</span>
                            <span>·</span>
                            <span>📐 DXF & 📄 PDF Import in header</span>
                            {hasPdfOverlay && (
                                <span className="text-rose-400 font-semibold">· 📄 Blueprint overlay active</span>
                            )}
                        </div>
                    )}

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

                    {/* Floating PDF Blueprint & Layout Controls on Map */}
                    {(hasPdfOverlay || plots.some(p => p.tempId.startsWith('pdf-'))) && !showPDFPanel && (
                        <div className="absolute bottom-5 left-5 z-[999] max-w-sm">
                            {!pdfFloatingOpen ? (
                                <button
                                    onClick={() => setPdfFloatingOpen(true)}
                                    className="bg-gray-900/90 hover:bg-gray-900 text-rose-300 border border-rose-900/60 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md transition cursor-pointer"
                                >
                                    <Sliders size={14} className="text-rose-400" />
                                    <span>📄 PDF Blueprint & Controls</span>
                                    <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                                        {plots.filter(p => p.tempId.startsWith('pdf-')).length}
                                    </span>
                                </button>
                            ) : (
                                <div className="bg-gray-900/95 border border-gray-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-3 text-xs w-84 text-gray-200">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1 rounded bg-rose-500/20 text-rose-400">
                                                <Layers size={14} />
                                            </span>
                                            <span className="font-bold text-white text-xs">PDF Blueprint & Controls</span>
                                            <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                                                {plots.filter(p => p.tempId.startsWith('pdf-')).length} plots
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setPdfFloatingOpen(false)}
                                            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition cursor-pointer"
                                            title="Minimize"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>

                                    {/* Blueprint Overlay Toggle & Opacity */}
                                    <div className="flex items-center justify-between gap-2 bg-gray-950/60 p-2 rounded-lg border border-gray-800">
                                        <button
                                            onClick={togglePdfOverlayVisibility}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${pdfOverlayVisible ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400'
                                                }`}
                                        >
                                            {pdfOverlayVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                            {pdfOverlayVisible ? 'Overlay On' : 'Overlay Off'}
                                        </button>
                                        <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
                                            <span className="text-[10px] text-gray-400">Opacity</span>
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                step="5"
                                                value={pdfOverlayOpacity}
                                                onChange={e => handlePdfOpacityChange(parseInt(e.target.value))}
                                                className="w-full accent-rose-500 cursor-pointer h-1.5"
                                            />
                                            <span className="text-[10px] font-mono text-rose-400">{pdfOverlayOpacity}%</span>
                                        </div>
                                    </div>

                                    {/* Nudge / Shift Layout Position */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                                            <span>Nudge Layout (Align to roads):</span>
                                            <span className="text-[10px] text-gray-500">2m steps</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={() => handleNudgePDFPlots(0, -2)}
                                                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition flex items-center gap-0.5 cursor-pointer"
                                                title="Nudge West (-2m)"
                                            >
                                                <ArrowLeft size={12} /> W
                                            </button>
                                            <button
                                                onClick={() => handleNudgePDFPlots(2, 0)}
                                                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition flex items-center gap-0.5 cursor-pointer"
                                                title="Nudge North (+2m)"
                                            >
                                                <ArrowUp size={12} /> N
                                            </button>
                                            <button
                                                onClick={() => handleNudgePDFPlots(-2, 0)}
                                                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition flex items-center gap-0.5 cursor-pointer"
                                                title="Nudge South (-2m)"
                                            >
                                                <ArrowDown size={12} /> S
                                            </button>
                                            <button
                                                onClick={() => handleNudgePDFPlots(0, 2)}
                                                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition flex items-center gap-0.5 cursor-pointer"
                                                title="Nudge East (+2m)"
                                            >
                                                E <ArrowRight size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bulk Pricing */}
                                    <div className="pt-1.5 border-t border-gray-800 space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                                            <span>Batch Set Price for All Plots:</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="relative flex-1">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 1200 /sqft"
                                                    value={bulkPriceInput}
                                                    onChange={e => setBulkPriceInput(e.target.value)}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-rose-500"
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const p = parseFloat(bulkPriceInput)
                                                    if (p > 0) handleBulkSetPrice(p)
                                                }}
                                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick action buttons */}
                                    <div className="pt-1 flex items-center gap-2">
                                        <button
                                            onClick={handleMarkAllSaved}
                                            className="flex-1 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                        >
                                            <CheckCheck size={13} />
                                            Mark All Ready
                                        </button>
                                        <button
                                            onClick={() => setShowPDFPanel(true)}
                                            className="py-1.5 px-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-semibold transition cursor-pointer"
                                            title="Open Calibration Sliders"
                                        >
                                            ⚙️ Calibrate
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right panel — toggles between plot editor, DXF import, and PDF import */}
                <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden relative">

                    {/* DXF Import Panel — slides over the sidebar */}
                    {showDXFPanel && (
                        <div className="absolute inset-0 z-10 bg-gray-900 flex flex-col">
                            <DXFImportPanel
                                slug={slug || ''}
                                ventureLat={center[0]}
                                ventureLng={center[1]}
                                onPlotsImported={(dxfPlots) => {
                                    handleDXFImport(dxfPlots)
                                    setShowDXFPanel(false)
                                }}
                                onClose={() => setShowDXFPanel(false)}
                            />
                        </div>
                    )}

                    {/* PDF Import Panel — slides over the sidebar */}
                    {showPDFPanel && (
                        <div className="absolute inset-0 z-10 bg-gray-900 flex flex-col">
                            <PDFImportPanel
                                slug={slug || ''}
                                ventureLat={center[0]}
                                ventureLng={center[1]}
                                onPlotsImported={(pdfPlots) => {
                                    handlePDFImport(pdfPlots)
                                }}
                                onPdfOverlayChange={handlePdfOverlayChange}
                                onClose={() => setShowPDFPanel(false)}
                            />
                        </div>
                    )}

                    {/* Plot details form */}
                    {selectedPlot && !showDXFPanel && !showPDFPanel ? (
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-lg font-bold">
                                    {selectedPlot.saved ? `Plot ${selectedPlot.form.plot_number}` : 'New Plot'}
                                </h2>
                                <div className="flex items-center gap-2">
                                    {selectedPlot.tempId.startsWith('dxf-') && (
                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                                            DXF
                                        </span>
                                    )}
                                    {selectedPlot.tempId.startsWith('pdf-') && (
                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                                            PDF
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDeletePlot(selectedPlot.tempId)}
                                        className="text-xs bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 px-2 py-1 rounded transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">Fill in the plot details</p>

                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Plot Number *</label>
                                    <input name="plot_number" value={form.plot_number} onChange={handleChange}
                                        placeholder="e.g. A-101"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Area (sq ft) *</label>
                                    <input name="area_sqft" value={form.area_sqft} onChange={handleChange}
                                        placeholder="e.g. 1200" type="number"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Price per sq ft (₹)</label>
                                    <input name="price_per_sqft" value={form.price_per_sqft} onChange={handleChange}
                                        placeholder="e.g. 3000" type="number"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Total Price (₹) *</label>
                                    <input name="total_price" value={form.total_price} onChange={handleChange}
                                        placeholder="Auto-calculated" type="number"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Status</label>
                                    <select name="status" value={form.status} onChange={handleChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                                        <option value="AVAILABLE">Available</option>
                                        <option value="HELD">Held</option>
                                        <option value="SOLD">Sold</option>
                                        <option value="BLOCKED">Blocked</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Notes</label>
                                    <textarea name="notes" value={form.notes} onChange={handleChange}
                                        placeholder="Any additional notes..." rows={2}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 resize-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-5">
                                <button onClick={handleSavePlotDetails}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm transition">
                                    Save Plot Details
                                </button>
                                <button onClick={() => { setSelectedTempId(null); setForm(DEFAULT_FORM) }}
                                    className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition">
                                    Cancel
                                </button>
                            </div>
                        </div>

                    ) : !showDXFPanel && !showPDFPanel ? (
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-4 border-b border-gray-800">
                                <p className="text-gray-300 font-medium text-sm">Plots</p>
                                <p className="text-gray-500 text-xs mt-0.5">
                                    {plots.length > 0
                                        ? `${plots.filter(p => p.tempId.startsWith('existing')).length} existing • ${newPlotsCount} new`
                                        : 'Draw shapes, import DXF, or import PDF'}
                                </p>
                            </div>

                            {plots.length === 0 ? (
                                <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
                                    <div className="text-5xl mb-4">🗺️</div>
                                    <p className="text-gray-300 font-medium text-sm">No plots yet</p>
                                    <p className="text-gray-500 text-xs mt-2 mb-4">
                                        Draw shapes on the map, or import a DXF or PDF layout
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setShowDXFPanel(true); setShowPDFPanel(false) }}
                                            className="px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                                            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
                                        >
                                            📐 Import DXF
                                        </button>
                                        <button
                                            onClick={() => { setShowPDFPanel(true); setShowDXFPanel(false) }}
                                            className="px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                                            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                                        >
                                            📄 Import PDF
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2">
                                    {plots.map((plot, idx) => (
                                        <div
                                            key={plot.tempId}
                                            onClick={() => handleSelectPlot(plot.tempId)}
                                            className={`rounded-lg px-3 py-2.5 cursor-pointer flex items-center justify-between border transition ${plot.tempId.startsWith('existing')
                                                ? 'bg-gray-800/50 border-gray-700 text-gray-300'
                                                : plot.saved
                                                    ? 'bg-green-950/30 border-green-900/50 text-green-400'
                                                    : plot.tempId.startsWith('dxf-')
                                                        ? 'bg-yellow-950/20 border-yellow-900/40 text-yellow-300'
                                                        : plot.tempId.startsWith('pdf-')
                                                            ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                                                            : 'bg-gray-800 border-gray-700 text-gray-300'
                                                }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-medium">
                                                        {plot.saved ? `Plot ${plot.form.plot_number}` : `Shape #${idx + 1}`}
                                                    </p>
                                                    {plot.tempId.startsWith('dxf-') && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded"
                                                            style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 10 }}>
                                                            DXF
                                                        </span>
                                                    )}
                                                    {plot.tempId.startsWith('pdf-') && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded"
                                                            style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: 10 }}>
                                                            PDF
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs mt-0.5 opacity-60">
                                                    {plot.form.area_sqft ? `${plot.form.area_sqft} sqft` : 'No area'}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-medium ${plot.tempId.startsWith('existing') ? 'text-gray-400'
                                                : plot.saved ? 'text-green-400'
                                                    : 'text-yellow-400'
                                                }`}>
                                                {plot.tempId.startsWith('existing') ? '● Existing'
                                                    : plot.saved ? '✓ Saved'
                                                        : '● Unsaved'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            <AgentMembershipModal
                open={showMembershipModal}
                onClose={() => setShowMembershipModal(false)}
                onSuccess={() => {
                    setUserHasMembership(true)
                    setShowMembershipModal(false)
                }}
            />
        </div>
    )
}