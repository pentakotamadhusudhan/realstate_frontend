import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ENDPOINTS } from '../../lib/api'
import LocationPicker from './LocationPicker'

export default function VentureCreate() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [lat, setLat] = useState<number | null>(null)
    const [lng, setLng] = useState<number | null>(null)

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

    function handleLocationChange(newLat: number, newLng: number) {
        setLat(newLat)
        setLng(newLng)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

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

                    {/* City, State, Pincode */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                            <input
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                placeholder="e.g. Hyderabad"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                            <input
                                name="state"
                                value={form.state}
                                onChange={handleChange}
                                placeholder="e.g. Telangana"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Pincode</label>
                            <input
                                name="pincode"
                                value={form.pincode}
                                onChange={handleChange}
                                placeholder="e.g. 500001"
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
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
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                        </select>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-4 rounded-xl font-semibold text-lg transition"
                    >
                        {loading ? 'Creating Venture...' : 'Create Venture & Add Plots →'}
                    </button>

                </form>
            </div>
        </div>
    )
}