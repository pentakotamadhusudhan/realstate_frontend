import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ENDPOINTS } from '../../lib/api'
import LocationPicker from './LocationPicker'
import { Loader2, CheckCircle2, AlertCircle, MapPin, Lock, Sparkles } from 'lucide-react'
import { lookupPincode } from '../../utils/pincode'
import { getUserProfile, isAgent, hasActiveMembership } from '../../lib/auth'
import AgentMembershipModal from '../../components/admin/AgentMembershipModal'

export default function VentureCreate() {
    const navigate = useNavigate()
    const user = getUserProfile()
    const userIsAgent = isAgent(user)
    const [userHasMembership, setUserHasMembership] = useState(hasActiveMembership(user))
    const [showMembershipModal, setShowMembershipModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [lat, setLat] = useState<number | null>(null)
    const [lng, setLng] = useState<number | null>(null)

    // Verification check for agents
    useEffect(() => {
        if (userIsAgent && !user?.is_verified) {
            navigate('/unverified')
        }
    }, [userIsAgent, user, navigate])

    const [form, setForm] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        total_area_sqft: '',
        amenities: '',
        status: 'DRAFT',
    })

    const [pincodeStatus, setPincodeStatus] = useState<{
        loading: boolean
        success?: boolean
        error?: boolean
        message?: string
        localities?: string[]
    }>({ loading: false })
    const abortControllerRef = useRef<AbortController | null>(null)

    // Enable scrolling on admin pages
    // Force enable scrolling on admin pages
    useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto'; // Sometimes the <html> tag is the culprit

        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        }
    }, [])

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function triggerPincodeLookup(code: string) {
        const cleaned = code.trim().replace(/\D/g, '').slice(0, 6)
        if (cleaned.length !== 6) {
            setPincodeStatus({ loading: false })
            return
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        const controller = new AbortController()
        abortControllerRef.current = controller

        setPincodeStatus({ loading: true, message: 'Fetching city & state from pincode...' })

        try {
            const res = await lookupPincode(cleaned, controller.signal)
            if (res.success) {
                setForm(prev => ({
                    ...prev,
                    city: res.city,
                    state: res.state,
                }))
                setPincodeStatus({
                    loading: false,
                    success: true,
                    error: false,
                    message: `Auto-detected: ${res.city}, ${res.state}`,
                    localities: res.postOffices || [],
                })
            } else {
                setPincodeStatus({
                    loading: false,
                    success: false,
                    error: true,
                    message: res.message || 'Pincode not found. Enter city & state manually.',
                    localities: [],
                })
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setPincodeStatus({
                    loading: false,
                    success: false,
                    error: true,
                    message: 'Could not fetch pincode details. Enter manually.',
                    localities: [],
                })
            }
        }
    }

    function handlePincodeChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6)
        setForm(prev => ({ ...prev, pincode: val }))

        if (val.length === 6) {
            triggerPincodeLookup(val)
        } else {
            setPincodeStatus({ loading: false, success: false, error: false, message: '', localities: [] })
        }
    }

    function handleLocationChange(newLat: number, newLng: number) {
        setLat(newLat)
        setLng(newLng)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (userIsAgent && !userHasMembership) {
            setShowMembershipModal(true)
            return
        }

        if (!lat || !lng) {
            setError('Please select a location on the map.')
            return
        }

        setLoading(true)

        try {
            // const payload = {
            //     ...form,
            //     center_latitude: lat,
            //     center_longitude: lng,
            //     total_area_sqft: form.total_area_sqft ? parseFloat(form.total_area_sqft) : null,
            //     amenities: form.amenities
            //         ? form.amenities.split(',').map(a => a.trim()).filter(Boolean)
            //         : [],
            // }
            // Inside async function handleSubmit(e) { ...

            const payload = {
                ...form,
                // Limit to 6 decimal places to prevent the 10-digit limit error
                center_latitude: parseFloat(lat.toFixed(6)),
                center_longitude: parseFloat(lng.toFixed(6)),

                total_area_sqft: form.total_area_sqft ? parseFloat(form.total_area_sqft) : null,
                amenities: form.amenities
                    ? form.amenities.split(',').map(a => a.trim()).filter(Boolean)
                    : [],
            }

            // ... rest of the fetch code
            const data = await apiFetch(ENDPOINTS.ventures, {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            alert(`Venture "${data.name}" created successfully!`)
            navigate(`/admin/ventures/${data.slug}/plots`)

        } catch (err: any) {
            setError(JSON.stringify(err) || 'Failed to create venture.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">

            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Create New Venture</h1>
                    <p className="text-gray-400 text-sm">Fill in the venture details</p>
                </div>
                <a href="/admin/ventures" className="text-gray-400 hover:text-white text-sm transition">
                    ← Back
                </a>
            </div>

            <div className="max-w-3xl mx-auto px-8 py-10">

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                {userIsAgent && !userHasMembership && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    Agent Membership Required
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                                        Upload Lock
                                    </span>
                                </h4>
                                <p className="text-xs text-amber-300/80 mt-0.5">
                                    Active membership is required to post ventures and individual plot layouts.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowMembershipModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-950 font-bold text-xs rounded-xl shadow transition whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                        >
                            <Sparkles size={14} />
                            Unlock Membership
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Venture Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Venture Name *</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Green Valley Phase 1"
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe the venture..."
                            rows={3}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                        <input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Street address"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Pincode, City, State with Auto-Fill */}
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Pincode */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Pincode
                                    </label>
                                    <span className="text-[11px] text-blue-400 font-normal">
                                        Auto-fills City & State
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        name="pincode"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={form.pincode}
                                        onChange={handlePincodeChange}
                                        placeholder="e.g. 500001"
                                        className={`w-full bg-gray-900 border rounded-xl pl-4 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none transition ${
                                            pincodeStatus.success
                                                ? 'border-emerald-500/70 focus:border-emerald-500'
                                                : pincodeStatus.error
                                                ? 'border-amber-500/70 focus:border-amber-500'
                                                : 'border-gray-700 focus:border-blue-500'
                                        }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                        {pincodeStatus.loading && (
                                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                        )}
                                        {!pincodeStatus.loading && pincodeStatus.success && (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        )}
                                        {!pincodeStatus.loading && pincodeStatus.error && (
                                            <AlertCircle className="w-5 h-5 text-amber-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* City */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-300">City *</label>
                                    {pincodeStatus.success && form.city && (
                                        <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                                            Auto-filled
                                        </span>
                                    )}
                                </div>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="e.g. Hyderabad"
                                    required
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* State */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-300">State *</label>
                                    {pincodeStatus.success && form.state && (
                                        <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                                            Auto-filled
                                        </span>
                                    )}
                                </div>
                                <input
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                    placeholder="e.g. Telangana"
                                    required
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Status message */}
                        {pincodeStatus.message && (
                            <p
                                className={`mt-2 text-xs flex items-center gap-1.5 ${
                                    pincodeStatus.success
                                        ? 'text-emerald-400'
                                        : pincodeStatus.error
                                        ? 'text-amber-400'
                                        : 'text-gray-400'
                                }`}
                            >
                                {pincodeStatus.message}
                            </p>
                        )}

                        {/* Locality suggestions chips */}
                        {pincodeStatus.localities && pincodeStatus.localities.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-900/90 rounded-xl border border-gray-800">
                                <span className="text-xs text-gray-400 block mb-2">
                                    Localities in this Pincode (click to append to Address):
                                </span>
                                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                                    {pincodeStatus.localities.map((loc) => (
                                        <button
                                            key={loc}
                                            type="button"
                                            onClick={() => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    address: prev.address
                                                        ? prev.address.includes(loc)
                                                            ? prev.address
                                                            : `${prev.address}, ${loc}`
                                                        : loc,
                                                }))
                                            }}
                                            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-2.5 py-1 rounded-lg border border-gray-700/60 transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <MapPin className="w-3 h-3 text-blue-400" />
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location picker from map */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Venture Location *
                        </label>
                        <LocationPicker
                            lat={lat}
                            lng={lng}
                            onChange={handleLocationChange}
                        />
                    </div>

                    {/* Total Area */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Total Area (sq ft)
                        </label>
                        <input
                            name="total_area_sqft"
                            value={form.total_area_sqft}
                            onChange={handleChange}
                            placeholder="e.g. 50000"
                            type="number"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Amenities */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Amenities <span className="text-gray-500">(comma separated)</span>
                        </label>
                        <input
                            name="amenities"
                            value={form.amenities}
                            onChange={handleChange}
                            placeholder="e.g. Park, Clubhouse, 24x7 Security, Gym"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                        {userIsAgent ? (
                            <div className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-300 text-sm flex items-center justify-between">
                                <span>Draft (Pending Super Admin Approval)</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                                    Agent Submission
                                </span>
                            </div>
                        ) : (
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="PUBLISHED">Published</option>
                            </select>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-4 rounded-xl font-semibold text-lg transition cursor-pointer"
                    >
                        {loading ? 'Creating Venture...' : 'Create Venture & Add Plots →'}
                    </button>

                </form>
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