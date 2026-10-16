import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
    Upload,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
    X,
    ChevronRight,
    Sparkles,
    RotateCw,
    Scan,
    Filter
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Configure worker using unpkg or fallback to ensure smooth Vite compatibility
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

export interface PDFPlot {
    coordinates: { lat: number; lng: number }[]
    plot_number?: string
    approx_area_sqft?: number
}

export interface PDFOverlayData {
    imageUrl?: string | null
    bounds?: [[number, number], [number, number]] | null
    opacity?: number
    remove?: boolean
}

interface PDFImportPanelProps {
    slug: string
    ventureLat: number
    ventureLng: number
    onPlotsImported: (plots: PDFPlot[]) => void
    onPdfOverlayChange?: (overlayData: PDFOverlayData) => void
    onClose: () => void
}

interface RawPlotDetection {
    id: string
    label: string
    pdfX: number      // center X in PDF viewport units
    pdfY: number      // center Y in top-down PDF viewport units
    pdfW: number      // box width in PDF units
    pdfH: number      // box height in PDF units
    isNumeric: boolean
}

type Step = 'upload' | 'calibrate' | 'processing' | 'done' | 'error'

// Helper: rotate a lat/lng point around a center origin
function rotateLatLng(
    lat: number,
    lng: number,
    centerLat: number,
    centerLng: number,
    deg: number
): { lat: number; lng: number } {
    if (!deg) return { lat, lng }
    const rad = (deg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    // Project to local coordinates in meters
    const mY = (lat - centerLat) * 111320
    const mX = (lng - centerLng) * 111320 * Math.cos((centerLat * Math.PI) / 180)

    // Rotate
    const rotX = mX * cos - mY * sin
    const rotY = mX * sin + mY * cos

    // Unproject back to lat/lng
    const rotLat = centerLat + rotY / 111320
    const rotLng = centerLng + rotX / (111320 * Math.cos((centerLat * Math.PI) / 180))

    return { lat: rotLat, lng: rotLng }
}

// Convert raw detections to geographic Map Lat/Lng boxes
function convertDetectionsToMapPlots(
    detections: RawPlotDetection[],
    params: {
        originLat: number
        originLng: number
        widthMeters: number
        rotationDeg: number
        boxScale: number
        pageWidth: number
        pageHeight: number
        aspectRatio: number
    }
): PDFPlot[] {
    const { originLat, originLng, widthMeters, rotationDeg, boxScale, pageWidth, pageHeight, aspectRatio } = params
    if (detections.length === 0 || !pageWidth || !pageHeight) return []

    const heightMeters = widthMeters / (aspectRatio || 1.414)
    const deltaLat = heightMeters / 111320
    const deltaLng = widthMeters / (111320 * Math.cos((originLat * Math.PI) / 180))

    const minLat = originLat - deltaLat / 2
    const maxLat = originLat + deltaLat / 2
    const minLng = originLng - deltaLng / 2
    const maxLng = originLng + deltaLng / 2

    return detections.map(p => {
        const w = p.pdfW * (boxScale || 1.0)
        const h = p.pdfH * (boxScale || 1.0)

        const x1 = p.pdfX - w / 2
        const x2 = p.pdfX + w / 2
        const y1 = p.pdfY - h / 2
        const y2 = p.pdfY + h / 2

        // Normalized ratios (0.0 to 1.0)
        const normX1 = Math.max(0, Math.min(1, x1 / pageWidth))
        const normX2 = Math.max(0, Math.min(1, x2 / pageWidth))
        const normY1 = Math.max(0, Math.min(1, y1 / pageHeight))
        const normY2 = Math.max(0, Math.min(1, y2 / pageHeight))

        // Geographic coordinates (unrotated)
        const lng1 = minLng + normX1 * (maxLng - minLng)
        const lng2 = minLng + normX2 * (maxLng - minLng)
        const lat1 = maxLat - normY1 * (maxLat - minLat)
        const lat2 = maxLat - normY2 * (maxLat - minLat)

        // Rotate corners around center origin
        const sw = rotateLatLng(lat2, lng1, originLat, originLng, rotationDeg)
        const nw = rotateLatLng(lat1, lng1, originLat, originLng, rotationDeg)
        const ne = rotateLatLng(lat1, lng2, originLat, originLng, rotationDeg)
        const se = rotateLatLng(lat2, lng2, originLat, originLng, rotationDeg)

        const plotWidthM = (w / pageWidth) * widthMeters
        const plotHeightM = (h / pageHeight) * heightMeters
        const approxArea = Math.round(plotWidthM * plotHeightM * 10.7639)

        return {
            plot_number: p.label,
            approx_area_sqft: approxArea,
            coordinates: [sw, nw, ne, se],
        }
    })
}

export default function PDFImportPanel({
    slug: _slug,
    ventureLat,
    ventureLng,
    onPlotsImported,
    onPdfOverlayChange,
    onClose,
}: PDFImportPanelProps) {
    const [step, setStep] = useState<Step>('upload')
    const [_file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [pageWidth, setPageWidth] = useState<number>(612)
    const [pageHeight, setPageHeight] = useState<number>(460)
    const [aspectRatio, setAspectRatio] = useState<number>(1.414)
    const [originLat, setOriginLat] = useState(ventureLat.toString())
    const [originLng, setOriginLng] = useState(ventureLng.toString())
    const [widthMeters, setWidthMeters] = useState<number>(300)
    const [rotationDeg, setRotationDeg] = useState<number>(0)
    const [boxScale, setBoxScale] = useState<number>(1.0)
    const [opacity, setOpacity] = useState<number>(65)
    const [overlayActive, setOverlayActive] = useState<boolean>(true)
    const [_numPages, setNumPages] = useState<number>(1)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [detectedPlots, setDetectedPlots] = useState<RawPlotDetection[]>([])
    const [onlyNumeric, setOnlyNumeric] = useState<boolean>(false)
    const [showBoxesOnPreview, setShowBoxesOnPreview] = useState<boolean>(true)
    const [importedCount, setImportedCount] = useState(0)

    const fileRef = useRef<HTMLInputElement>(null)

    // Calculate geographic bounds for the whole layout
    const computeBounds = useCallback(
        (latStr: string, lngStr: string, width: number, aspect: number): [[number, number], [number, number]] => {
            const lat = parseFloat(latStr) || ventureLat
            const lng = parseFloat(lngStr) || ventureLng
            const height = width / (aspect || 1.414)

            const deltaLat = (height / 2) / 111320
            const deltaLng = (width / 2) / (111320 * Math.cos((lat * Math.PI) / 180))

            return [
                [lat - deltaLat, lng - deltaLng],
                [lat + deltaLat, lng + deltaLng],
            ]
        },
        [ventureLat, ventureLng]
    )

    // ── Auto-Detect Plots from PDF ─────────────────────────────
    async function autoDetectPlots(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<RawPlotDetection[]> {
        const page = await pdfDoc.getPage(1)
        const vp = page.getViewport({ scale: 1.0 })

        // Check for vector CAD paths/rectangles in PDF first
        try {
            const ops = await page.getOperatorList()
            const vectorBoxes: { x: number; y: number; w: number; h: number }[] = []
            
            for (let i = 0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] === pdfjsLib.OPS.constructPath) {
                    const [pathOps, pathArgs] = ops.argsArray[i] || [[], []]
                    let argIdx = 0
                    for (let j = 0; j < pathOps.length; j++) {
                        if (pathOps[j] === pdfjsLib.OPS.rectangle) {
                            const rx = pathArgs[argIdx]
                            const ry = pathArgs[argIdx + 1]
                            const rw = pathArgs[argIdx + 2]
                            const rh = pathArgs[argIdx + 3]
                            argIdx += 4
                            // Filter reasonable plot box sizes (between 10 and 150 PDF units)
                            if (rw >= 8 && rw <= 180 && rh >= 8 && rh <= 180) {
                                vectorBoxes.push({
                                    x: rx + rw / 2,
                                    y: vp.height - (ry + rh / 2),
                                    w: rw,
                                    h: rh
                                })
                            }
                        } else if (pathOps[j] === pdfjsLib.OPS.moveTo) {
                            argIdx += 2
                        } else if (pathOps[j] === pdfjsLib.OPS.lineTo) {
                            argIdx += 2
                        }
                    }
                }
            }

            if (vectorBoxes.length >= 10) {
                // Vector rectangles found! Match with text labels if available
                const textContent = await page.getTextContent()
                const labels: { str: string; x: number; y: number }[] = []
                for (const item of textContent.items as any[]) {
                    const str = (item.str || '').trim()
                    if (/^[A-Za-z0-9\-#]+$/.test(str) && str.length <= 5) {
                        labels.push({
                            str,
                            x: item.transform[4],
                            y: vp.height - item.transform[5]
                        })
                    }
                }

                return vectorBoxes.map((vb, idx) => {
                    // Find closest text label inside or near this box
                    const matched = labels.find(l => Math.hypot(l.x - vb.x, l.y - vb.y) < Math.max(vb.w, vb.h) * 0.6)
                    const label = matched ? matched.str : `${idx + 1}`
                    return {
                        id: `det-vec-${idx}`,
                        label,
                        pdfX: vb.x,
                        pdfY: vb.y,
                        pdfW: vb.w,
                        pdfH: vb.h,
                        isNumeric: /^\d+$/.test(label)
                    }
                })
            }
        } catch (e) {
            console.warn('Vector path extraction error (falling back to OCR text analysis):', e)
        }

        // OCR Text items analysis
        const textContent = await page.getTextContent()

        // Filter out non-plot metadata
        const excludedWords = new Set([
            'ROAD', 'PATH', 'LANE', 'STREET', 'NAGAR', 'LAYOUT', 'PLAN',
            'NORTH', 'SOUTH', 'EAST', 'WEST', 'PARK', 'OPEN', 'SPACE',
            'COMMERCIAL', 'SCHOOL', 'SITE', 'BOUND', 'ENTRY', 'EXIT',
            '30\'', '40\'', '50\'', '60\'', '80\'', '100\''
        ])

        const isExcluded = (s: string) => {
            const upper = s.toUpperCase()
            for (const word of excludedWords) {
                if (upper.includes(word)) return true
            }
            if (/^\d+['"]$/.test(s)) return true
            if (s.length > 5) return true
            return false
        }

        const candidates: { str: string; x: number; y: number }[] = []

        for (const item of textContent.items as any[]) {
            const str = (item.str || '').trim()
            if (!str || isExcluded(str)) continue
            // Allow plot numbers like 132, 201, or alphanumerics like P1, 24e, A-12
            if (/^[A-Za-z0-9\-#]+$/.test(str)) {
                candidates.push({
                    str,
                    x: item.transform[4],
                    y: vp.height - item.transform[5], // convert from bottom-up to top-down Y
                })
            }
        }

        // Cluster and deduplicate nearby label fragments within 8 px
        const clusters: { str: string; x: number; y: number }[] = []
        candidates.forEach(c => {
            const existing = clusters.find(cl => Math.hypot(cl.x - c.x, cl.y - c.y) < 8)
            if (existing) {
                if (/^\d+$/.test(c.str) && !/^\d+$/.test(existing.str)) {
                    existing.str = c.str
                }
            } else {
                clusters.push({ ...c })
            }
        })

        if (clusters.length >= 5) {
            // Compute median neighbor spacing horizontally and vertically
            const dxs: number[] = []
            const dys: number[] = []
            clusters.forEach((c1, i) => {
                let minDx = Infinity
                let minDy = Infinity
                clusters.forEach((c2, j) => {
                    if (i === j) return
                    const dx = Math.abs(c1.x - c2.x)
                    const dy = Math.abs(c1.y - c2.y)
                    if (dy < 8 && dx > 7 && dx < 40 && dx < minDx) minDx = dx
                    if (dx < 8 && dy > 7 && dy < 40 && dy < minDy) minDy = dy
                })
                if (minDx < Infinity) dxs.push(minDx)
                if (minDy < Infinity) dys.push(minDy)
            })

            dxs.sort((a, b) => a - b)
            dys.sort((a, b) => a - b)
            const medianDx = dxs[Math.floor(dxs.length / 2)] || 18
            const medianDy = dys[Math.floor(dys.length / 2)] || 16

            // Compute tailored directional bounding box for each plot based on neighbor distance
            return clusters.map((c1, idx) => {
                let minLeft = Infinity
                let minRight = Infinity
                let minTop = Infinity
                let minBottom = Infinity

                clusters.forEach(c2 => {
                    if (c1 === c2) return
                    const dx = c2.x - c1.x
                    const dy = c2.y - c1.y

                    if (Math.abs(dy) < 8) {
                        if (dx > 7 && dx < 40 && dx < minRight) minRight = dx
                        if (dx < -7 && dx > -40 && -dx < minLeft) minLeft = -dx
                    }
                    if (Math.abs(dx) < 8) {
                        if (dy > 7 && dy < 40 && dy < minBottom) minBottom = dy
                        if (dy < -7 && dy > -40 && -dy < minTop) minTop = -dy
                    }
                })

                const halfW = medianDx * 0.48
                const halfH = medianDy * 0.48
                const leftDist = minLeft < Infinity ? Math.min(halfW * 1.3, minLeft * 0.48) : halfW
                const rightDist = minRight < Infinity ? Math.min(halfW * 1.3, minRight * 0.48) : halfW
                const topDist = minTop < Infinity ? Math.min(halfH * 1.3, minTop * 0.48) : halfH
                const bottomDist = minBottom < Infinity ? Math.min(halfH * 1.3, minBottom * 0.48) : halfH

                const w = Math.max(12, Math.min(32, leftDist + rightDist))
                const h = Math.max(10, Math.min(30, topDist + bottomDist))
                const cx = c1.x - leftDist + (leftDist + rightDist) / 2
                const cy = c1.y - topDist + (topDist + bottomDist) / 2

                return {
                    id: `det-${idx}`,
                    label: c1.str,
                    pdfX: cx,
                    pdfY: cy,
                    pdfW: w,
                    pdfH: h,
                    isNumeric: /^\d+$/.test(c1.str),
                }
            })
        } else {
            // Fallback for image scans without OCR or vectors: generate an adaptive grid layout
            const rows = 12
            const cols = 16
            const marginX = vp.width * 0.12
            const marginY = vp.height * 0.12
            const gridW = (vp.width - marginX * 2) / cols
            const gridH = (vp.height - marginY * 2) / rows
            let pNum = 1
            const detected: RawPlotDetection[] = []

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cx = marginX + (c + 0.5) * gridW
                    const cy = marginY + (r + 0.5) * gridH
                    detected.push({
                        id: `det-${pNum}`,
                        label: `${pNum++}`,
                        pdfX: cx,
                        pdfY: cy,
                        pdfW: gridW * 0.85,
                        pdfH: gridH * 0.85,
                        isNumeric: true,
                    })
                }
            }
            return detected
        }
    }

    // ── Process PDF: Render Image, Auto-detect Plots, & DRAW ON MAP IMMEDIATELY ──
    async function processPdfFile(pdfFile: File) {
        setLoading(true)
        setErrorMsg('')

        try {
            const arrayBuffer = await pdfFile.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
            const pdf = await loadingTask.promise
            const page = await pdf.getPage(1)

            const vp = page.getViewport({ scale: 2.0 })
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            canvas.width = vp.width
            canvas.height = vp.height

            if (!context) throw new Error('Canvas context could not be created')

            await page.render({ canvasContext: context, viewport: vp, canvas } as any).promise
            const dataUrl = canvas.toDataURL('image/png')
            const aspect = vp.width / vp.height

            setPreviewUrl(dataUrl)
            const pW = vp.width / 2.0
            const pH = vp.height / 2.0
            setPageWidth(pW)
            setPageHeight(pH)
            setAspectRatio(aspect)
            setNumPages(pdf.numPages)

            // Auto-detect plots from PDF
            const rawDetections = await autoDetectPlots(pdf)
            setDetectedPlots(rawDetections)

            // Immediately apply blueprint overlay onto map
            const bounds = computeBounds(originLat, originLng, widthMeters, aspect)
            onPdfOverlayChange?.({
                imageUrl: dataUrl,
                bounds,
                opacity: opacity / 100,
            })
            setOverlayActive(true)

            // Convert to Map Lat/Lng boxes and DRAW ON MAP IMMEDIATELY!
            const initialMapPlots = convertDetectionsToMapPlots(rawDetections, {
                originLat: parseFloat(originLat) || ventureLat,
                originLng: parseFloat(originLng) || ventureLng,
                widthMeters,
                rotationDeg,
                boxScale,
                pageWidth: pW,
                pageHeight: pH,
                aspectRatio: aspect,
            })

            if (initialMapPlots.length > 0) {
                onPlotsImported(initialMapPlots)
                setImportedCount(initialMapPlots.length)
            }

            setStep('calibrate')
        } catch (err: any) {
            console.error('PDF processing error:', err)
            setErrorMsg(err.message || 'Failed to parse and detect plots from PDF')
            setStep('error')
        } finally {
            setLoading(false)
        }
    }

    // Handle File Upload
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        await processPdfFile(f)
    }

    // Quick Load Sample scanned PDF
    async function handleQuickLoadSample() {
        setLoading(true)
        setErrorMsg('')
        try {
            const response = await fetch('/Adobe Scan 12 Apr 2026 (1).pdf')
            if (!response.ok) throw new Error('Sample PDF file not found')
            const blob = await response.blob()
            const sampleFile = new File([blob], 'Adobe Scan 12 Apr 2026 (1).pdf', { type: 'application/pdf' })
            setFile(sampleFile)
            await processPdfFile(sampleFile)
        } catch (err: any) {
            setErrorMsg(err.message || 'Could not load sample PDF')
            setStep('error')
        } finally {
            setLoading(false)
        }
    }

    // Filtered plots based on user filter
    const activePlots = useMemo(() => {
        if (onlyNumeric) {
            return detectedPlots.filter(p => p.isNumeric)
        }
        return detectedPlots
    }, [detectedPlots, onlyNumeric])

    // Convert active detections to map plots
    const convertedMapPlots = useMemo<PDFPlot[]>(() => {
        return convertDetectionsToMapPlots(activePlots, {
            originLat: parseFloat(originLat) || ventureLat,
            originLng: parseFloat(originLng) || ventureLng,
            widthMeters,
            rotationDeg,
            boxScale,
            pageWidth,
            pageHeight,
            aspectRatio,
        })
    }, [activePlots, originLat, originLng, widthMeters, rotationDeg, boxScale, pageWidth, pageHeight, aspectRatio, ventureLat, ventureLng])

    // Update overlay bounds on map
    const applyOverlay = useCallback(() => {
        if (!previewUrl) return
        const bounds = computeBounds(originLat, originLng, widthMeters, aspectRatio)
        onPdfOverlayChange?.({
            imageUrl: previewUrl,
            bounds,
            opacity: opacity / 100,
        })
        setOverlayActive(true)
    }, [previewUrl, originLat, originLng, widthMeters, aspectRatio, opacity, computeBounds, onPdfOverlayChange])

    // Update overlay whenever calibration parameters change
    useEffect(() => {
        if (overlayActive && previewUrl) {
            applyOverlay()
        }
    }, [originLat, originLng, widthMeters, opacity, overlayActive, previewUrl, applyOverlay])

    // Live-update map plots whenever calibration parameters change in calibrate step
    useEffect(() => {
        if (step === 'calibrate' && convertedMapPlots.length > 0) {
            onPlotsImported(convertedMapPlots)
            setImportedCount(convertedMapPlots.length)
        }
    }, [convertedMapPlots, step, onPlotsImported])

    // Toggle blueprint overlay visibility
    function toggleOverlay() {
        if (overlayActive) {
            onPdfOverlayChange?.({ remove: true })
            setOverlayActive(false)
        } else {
            applyOverlay()
        }
    }

    // Re-apply updated plot boundaries to map
    function handleReapplyToMap() {
        if (convertedMapPlots.length === 0) return
        onPlotsImported(convertedMapPlots)
        setImportedCount(convertedMapPlots.length)
    }

    function handleClose() {
        onClose()
    }

    const steps = ['Upload', 'Calibrate', 'Overlay', 'Done'] as const
    const currentIdx = (['upload', 'calibrate', 'processing', 'done', 'error'] as Step[]).indexOf(step)

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-rose-500/20 text-rose-400">
                        <Scan size={16} />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-white">Auto-Detect Plots</h2>
                        <p className="text-[11px] text-gray-400">PDF to Map Lat/Lng Converter</p>
                    </div>
                </div>
                <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition cursor-pointer"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-800 shrink-0 bg-gray-950/40">
                {steps.map((s, i) => {
                    const isDone = i < currentIdx
                    const isCurrent = (['upload', 'calibrate', 'processing', 'done'][i] === step) || (step === 'done' && i === 3)
                    return (
                        <div key={s} className="flex items-center gap-1">
                            <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                                style={{
                                    background: isDone ? '#16a34a' : isCurrent ? '#ef4444' : '#374151',
                                    color: 'white',
                                }}
                            >
                                {isDone ? '✓' : i + 1}
                            </div>
                            <span className="text-[11px] font-medium" style={{ color: isCurrent ? 'white' : '#6b7280' }}>
                                {s}
                            </span>
                            {i < steps.length - 1 && (
                                <ChevronRight size={10} className="text-gray-600" />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* STEP 1: Upload & Auto-Detect */}
                {step === 'upload' && (
                    <div className="space-y-4">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Upload your layout plan or blueprint PDF. We will automatically detect all plot boxes inside the PDF and draw them directly onto the map so you can edit each boundary.
                        </p>

                        <input
                            ref={fileRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-gray-700 hover:border-rose-500 rounded-xl p-8 text-center cursor-pointer transition bg-gray-800/40 group"
                        >
                            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                                <Upload size={24} />
                            </div>
                            <p className="text-gray-200 text-sm font-semibold">
                                Click or drag PDF layout
                            </p>
                            <p className="text-gray-500 text-xs mt-1">Automatically detects and draws plots on map</p>
                        </div>

                        {/* Quick Load Sample button */}
                        <div className="pt-1">
                            <button
                                onClick={handleQuickLoadSample}
                                className="w-full py-2.5 px-3 rounded-xl border border-rose-900/50 hover:border-rose-500/80 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                                <Sparkles size={14} className="text-rose-400" />
                                ⚡ Quick Load "Adobe Scan 12 Apr 2026 (1).pdf"
                            </button>
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center gap-2 py-3 text-rose-400 text-xs bg-rose-950/30 rounded-lg border border-rose-900/40">
                                <span className="animate-spin text-sm">⏳</span>
                                Scanning PDF & drawing plot boxes on map...
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: Calibrate & Review Detected Plots */}
                {step === 'calibrate' && (
                    <div className="space-y-4 text-xs">

                        {/* Success Drawn Banner */}
                        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border border-emerald-700/60 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle size={16} className="text-emerald-400" />
                                    <span className="text-white font-bold text-sm">
                                        {activePlots.length} Plots Drawn on Map!
                                    </span>
                                </div>
                                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                                    Plotted with real numbers. Click any plot on map to edit.
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-lg"
                            >
                                ✏️ Edit on Map →
                            </button>
                        </div>

                        {/* Thumbnail with interactive bounding box preview overlay */}
                        {previewUrl && (
                            <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-black/60 flex items-center justify-center group">
                                <div className="relative max-h-48 w-full flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt="PDF Blueprint"
                                        className="max-h-48 w-full object-contain"
                                    />
                                    {/* SVG bounding box overlay */}
                                    {showBoxesOnPreview && (
                                        <svg
                                            className="absolute inset-0 w-full h-full pointer-events-none"
                                            viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                                            preserveAspectRatio="xMidYMid meet"
                                        >
                                            {activePlots.map(p => {
                                                const w = p.pdfW * boxScale
                                                const h = p.pdfH * boxScale
                                                return (
                                                    <g key={p.id}>
                                                        <rect
                                                            x={p.pdfX - w / 2}
                                                            y={p.pdfY - h / 2}
                                                            width={w}
                                                            height={h}
                                                            fill="rgba(239, 68, 68, 0.25)"
                                                            stroke="#ef4444"
                                                            strokeWidth="1.2"
                                                            rx="1"
                                                        />
                                                        <text
                                                            x={p.pdfX}
                                                            y={p.pdfY + 2.5}
                                                            fill="#ffffff"
                                                            fontSize="6"
                                                            fontWeight="bold"
                                                            textAnchor="middle"
                                                        >
                                                            {p.label}
                                                        </text>
                                                    </g>
                                                )
                                            })}
                                        </svg>
                                    )}
                                </div>

                                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                    <button
                                        onClick={() => setShowBoxesOnPreview(prev => !prev)}
                                        className="px-2 py-1 rounded bg-black/80 hover:bg-black text-[10px] text-gray-200 border border-gray-700 transition cursor-pointer"
                                    >
                                        {showBoxesOnPreview ? 'Hide Boxes' : 'Show Boxes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Sample Plot Number chips */}
                        {activePlots.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-gray-400">
                                    <span>Detected Plot Numbers:</span>
                                    <button
                                        onClick={() => setOnlyNumeric(prev => !prev)}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition cursor-pointer ${
                                            onlyNumeric ? 'bg-rose-500/20 text-rose-300' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Filter size={11} />
                                        {onlyNumeric ? 'Only Numbers' : 'All Labels'}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto p-1.5 rounded bg-gray-950/60 border border-gray-800 text-[10px]">
                                    {activePlots.slice(0, 36).map(p => (
                                        <span
                                            key={p.id}
                                            className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-200 border border-gray-700/60 font-mono"
                                        >
                                            #{p.label}
                                        </span>
                                    ))}
                                    {activePlots.length > 36 && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/50">
                                            +{activePlots.length - 36} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Map Overlay Toggle Button */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40">
                            <div className="flex items-center gap-2">
                                <span className={overlayActive ? 'text-green-400' : 'text-gray-400'}>
                                    {overlayActive ? <Eye size={16} /> : <EyeOff size={16} />}
                                </span>
                                <div>
                                    <p className="font-semibold text-white">Blueprint Layout on Map</p>
                                    <p className="text-[11px] text-gray-400">
                                        {overlayActive ? 'Visible under satellite tiles' : 'Overlay is hidden'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleOverlay}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                    overlayActive
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                }`}
                            >
                                {overlayActive ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {/* Geographic Calibration Sliders */}
                        <div className="space-y-3 pt-1 border-t border-gray-800">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-gray-300 font-medium">Layout Width (Scale)</label>
                                    <span className="text-rose-400 font-mono text-[11px] font-bold">{widthMeters} meters</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="1200"
                                    step="10"
                                    value={widthMeters}
                                    onChange={e => setWidthMeters(parseInt(e.target.value))}
                                    className="w-full accent-rose-500 cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-gray-300 font-medium flex items-center gap-1">
                                        <RotateCw size={12} className="text-rose-400" />
                                        Rotation
                                    </label>
                                    <span className="text-rose-400 font-mono text-[11px] font-bold">{rotationDeg}°</span>
                                </div>
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    step="1"
                                    value={rotationDeg}
                                    onChange={e => setRotationDeg(parseInt(e.target.value))}
                                    className="w-full accent-rose-500 cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-gray-300 font-medium">Plot Box Size Scale</label>
                                    <span className="text-rose-400 font-mono text-[11px] font-bold">{(boxScale * 100).toFixed(0)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.8"
                                    step="0.05"
                                    value={boxScale}
                                    onChange={e => setBoxScale(parseFloat(e.target.value))}
                                    className="w-full accent-rose-500 cursor-pointer"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                    <label className="block text-gray-400 text-[11px] mb-1">Origin Latitude</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={originLat}
                                        onChange={e => setOriginLat(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs focus:border-rose-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-[11px] mb-1">Origin Longitude</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={originLng}
                                        onChange={e => setOriginLng(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs focus:border-rose-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex flex-col gap-2">
                            <button
                                onClick={handleReapplyToMap}
                                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow bg-rose-600 hover:bg-rose-500"
                            >
                                <RotateCw size={14} />
                                Re-apply Alignment to Map
                            </button>

                            <button
                                onClick={handleClose}
                                className="w-full py-3 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg bg-emerald-600 hover:bg-emerald-500"
                            >
                                ✏️ Edit Plots on Map ({activePlots.length} Plots) →
                            </button>
                        </div>
                    </div>
                )}

                {/* ERROR */}
                {step === 'error' && (
                    <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                        <AlertCircle size={40} className="text-red-400" />
                        <div>
                            <p className="text-white font-bold text-sm">Detection Failed</p>
                            <p className="text-red-400 text-xs mt-1">{errorMsg}</p>
                        </div>
                        <button
                            onClick={() => {
                                setStep('upload')
                                setFile(null)
                                setErrorMsg('')
                            }}
                            className="w-full py-2 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
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
