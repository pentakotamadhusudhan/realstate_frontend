import { useState, useRef } from 'react'
import { getAccessToken } from '../../lib/api'
import { Upload, Layers, MapPin, ChevronRight, X, CheckCircle, AlertCircle } from 'lucide-react'

interface DXFPlot {
    coordinates: { lat: number; lng: number }[]
    layer: string
    approx_area_sqft: number
    bbox: {
        min_lat: number
        max_lat: number
        min_lng: number
        max_lng: number
    }
}

interface DXFImportPanelProps {
    slug: string
    ventureLat: number
    ventureLng: number
    onPlotsImported: (plots: DXFPlot[]) => void
    onClose: () => void
}

type Step = 'upload' | 'layers' | 'origin' | 'parsing' | 'done' | 'error'

const API_BASE =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://192.168.1.18:8000/api'

export default function DXFImportPanel({
    slug,
    ventureLat,
    ventureLng,
    onPlotsImported,
    onClose,
}: DXFImportPanelProps) {
    const [step, setStep] = useState<Step>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [layers, setLayers] = useState<string[]>([])
    const [selectedLayers, setSelectedLayers] = useState<string[]>([])
    const [originLat, setOriginLat] = useState(ventureLat.toString())
    const [originLng, setOriginLng] = useState(ventureLng.toString())
    const [scale, setScale] = useState('1.0')
    const [rotation, setRotation] = useState('0.0')
    const [plotCount, setPlotCount] = useState(0)
    const [errorMsg, setErrorMsg] = useState('')
    const [loading, setLoading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    // Step 1 — Upload file and get layers
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        setLoading(true)
        setErrorMsg('')

        try {
            const token = getAccessToken()
            const formData = new FormData()
            formData.append('file', f)

            const res = await fetch(`${API_BASE}/ventures/${slug}/dxf/layers/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || 'Failed to read DXF layers')
            }

            const data = await res.json()
            setLayers(data.layers ?? [])
            setStep('layers')
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to upload file')
            setStep('error')
        } finally {
            setLoading(false)
        }
    }

    // Step 2 — Toggle layer selection
    function toggleLayer(layer: string) {
        setSelectedLayers(prev =>
            prev.includes(layer)
                ? prev.filter(l => l !== layer)
                : [...prev, layer]
        )
    }

    // Step 3 — Parse DXF with origin + settings
    async function handleParse() {
        if (!file) return
        setLoading(true)
        setStep('parsing')
        setErrorMsg('')

        try {
            const token = getAccessToken()
            const formData = new FormData()
            formData.append('file', file)
            formData.append('origin_lat', originLat)
            formData.append('origin_lng', originLng)
            formData.append('rotation_deg', rotation)
            formData.append('scale', scale)
            if (selectedLayers.length > 0) {
                selectedLayers.forEach(layer => formData.append('layers', layer))
            }

            const res = await fetch(`${API_BASE}/ventures/${slug}/dxf/parse/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            })


            console.log('=== PARSE RESPONSE ===')
            console.log('status:', res.status)
            console.log('ok:', res.ok)

            const responseText = await res.text()
            console.log('raw body:', responseText)

            if (!res.ok) {
                let err: any = {}
                try { err = JSON.parse(responseText) } catch { }
                throw new Error(err.detail || JSON.stringify(err) || 'Failed to parse DXF')
            }

            const data = JSON.parse(responseText)
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || 'Failed to parse DXF')
            }

            // const data = await res.json()
            setPlotCount(data.total_plots_detected ?? 0)
            onPlotsImported(data.plots ?? [])
            setStep('done')
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to parse DXF file')
            setStep('error')
        } finally {
            setLoading(false)
        }
    }

    // Reset everything when user closes
    function handleClose() {
        setFile(null)
        setLayers([])
        setSelectedLayers([])
        setErrorMsg('')
        onClose()
    }

    const steps = ['Upload', 'Layers', 'Origin', 'Import'] as const
    const stepMap: Step[] = ['upload', 'layers', 'origin', 'parsing']
    const currentIdx = (['upload', 'layers', 'origin', 'parsing', 'done', 'error'] as Step[]).indexOf(step)

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-sm font-bold text-white">Import DXF Layout</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-white transition">
                    <X size={16} />
                </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-800">
                {steps.map((s, i) => {
                    const isDone = i < currentIdx
                    const isCurrent = stepMap[i] === step || (step === 'done' && i === 3)
                    return (
                        <div key={s} className="flex items-center gap-1">
                            <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{
                                    background: isDone ? '#16a34a' : isCurrent ? '#2563eb' : '#374151',
                                    color: 'white',
                                }}
                            >
                                {isDone ? '✓' : i + 1}
                            </div>
                            <span className="text-xs" style={{ color: isCurrent ? 'white' : '#6b7280' }}>
                                {s}
                            </span>
                            {i < steps.length - 1 && (
                                <ChevronRight size={10} className="text-gray-600" />
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-4">

                {/* STEP 1 — Upload */}
                {step === 'upload' && (
                    <div className="flex flex-col gap-4">
                        <p className="text-xs text-gray-400">
                            Upload your DXF layout file. We'll detect the layers automatically.
                        </p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".dxf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition"
                        >
                            <Upload size={32} className="mx-auto mb-3 text-gray-500" />
                            <p className="text-gray-300 text-sm font-medium">
                                Click to upload DXF
                            </p>
                            <p className="text-gray-500 text-xs mt-1">Max 50MB</p>
                        </div>
                        {loading && (
                            <p className="text-blue-400 text-xs text-center">
                                ⚙️ Reading DXF layers...
                            </p>
                        )}
                    </div>
                )}

                {/* STEP 2 — Select Layers */}
                {step === 'layers' && (
                    <div className="flex flex-col gap-4">
                        <p className="text-xs text-gray-400">
                            Select the layer(s) that contain plot boundaries. Leave all unselected to use all layers.
                        </p>
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                            {layers.length === 0 && (
                                <p className="text-gray-500 text-xs text-center py-4">
                                    No layers found in this file.
                                </p>
                            )}
                            {layers.map(layer => (
                                <div
                                    key={layer}
                                    onClick={() => toggleLayer(layer)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition"
                                    style={{
                                        background: selectedLayers.includes(layer)
                                            ? 'rgba(37,99,235,0.2)'
                                            : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${selectedLayers.includes(layer) ? '#2563eb' : '#374151'}`,
                                    }}
                                >
                                    <Layers size={13} className="text-gray-400" />
                                    <span className="text-sm text-white flex-1">{layer}</span>
                                    {selectedLayers.includes(layer) && (
                                        <CheckCircle size={14} className="text-blue-400" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setStep('upload')}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 transition hover:opacity-80"
                                style={{ background: 'rgba(255,255,255,0.06)' }}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => setStep('origin')}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                                style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3 — Set Origin */}
                {step === 'origin' && (
                    <div className="flex flex-col gap-4">
                        <p className="text-xs text-gray-400">
                            Set the real-world coordinates for the DXF origin point (0,0). This is usually the bottom-left corner of your layout.
                        </p>

                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                Origin Latitude
                            </label>
                            <input
                                type="number"
                                value={originLat}
                                onChange={e => setOriginLat(e.target.value)}
                                step="0.000001"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                Origin Longitude
                            </label>
                            <input
                                type="number"
                                value={originLng}
                                onChange={e => setOriginLng(e.target.value)}
                                step="0.000001"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                Scale Factor
                                <span className="text-gray-500 ml-1">(1.0 = meters, 0.3048 = feet)</span>
                            </label>
                            <input
                                type="number"
                                value={scale}
                                onChange={e => setScale(e.target.value)}
                                step="0.001"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                Rotation (degrees)
                                <span className="text-gray-500 ml-1">(0 = no rotation)</span>
                            </label>
                            <input
                                type="number"
                                value={rotation}
                                onChange={e => setRotation(e.target.value)}
                                step="1"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div
                            className="rounded-xl p-3 text-xs"
                            style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}
                        >
                            <p className="text-blue-400 font-medium mb-1">💡 Tip</p>
                            <p className="text-gray-400">
                                The venture center coordinates are pre-filled as origin. Adjust if your DXF (0,0) point is different from the venture center.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setStep('layers')}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 transition hover:opacity-80"
                                style={{ background: 'rgba(255,255,255,0.06)' }}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleParse}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                            >
                                Import Plots →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4 — Parsing */}
                {step === 'parsing' && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="text-5xl">⚙️</div>
                        <p className="text-white font-medium">Parsing DXF file...</p>
                        <p className="text-gray-400 text-xs text-center">
                            Extracting plot boundaries and converting to map coordinates
                        </p>
                    </div>
                )}

                {/* DONE */}
                {step === 'done' && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                        <CheckCircle size={48} className="text-green-400" />
                        <div>
                            <p className="text-white font-bold text-lg">
                                {plotCount} plots imported!
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                                Plot boundaries are now visible on the map. Click each plot to fill in the details.
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                        >
                            Start Editing Plots →
                        </button>
                    </div>
                )}

                {/* ERROR */}
                {step === 'error' && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                        <AlertCircle size={48} className="text-red-400" />
                        <div>
                            <p className="text-white font-bold">Import Failed</p>
                            <p className="text-red-400 text-xs mt-1">{errorMsg}</p>
                        </div>
                        <button
                            onClick={() => { setStep('upload'); setFile(null); setErrorMsg('') }}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition"
                            style={{ background: 'rgba(255,255,255,0.08)' }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

            </div>
        </div>
    )
}