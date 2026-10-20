import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, MapPin, Building, Loader2, Check, AlertCircle } from 'lucide-react';
import type { Apartment } from '../../types/apartment';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import LocationPicker from '../../pages/admin/LocationPicker';

interface ApartmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (apartment: Apartment) => void;
    apartment?: Apartment | null; // If provided, edit mode
}

export default function ApartmentFormModal({
    isOpen,
    onClose,
    onSuccess,
    apartment,
}: ApartmentFormModalProps) {
    const isEditing = Boolean(apartment);

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [totalFlats, setTotalFlats] = useState<number>(0);
    const [sold, setSold] = useState<number>(0);
    const [description, setDescription] = useState('');
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

    const [showMapPicker, setShowMapPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize or reset form when modal opens or apartment prop changes
    useEffect(() => {
        if (!isOpen) return;

        if (apartment) {
            setName(apartment.name || '');
            setAddress(apartment.address || '');
            setLat(apartment.latitude ? Number(apartment.latitude) : null);
            setLng(apartment.longitude ? Number(apartment.longitude) : null);
            setIsActive(apartment.is_active ?? true);
            setTotalFlats(apartment.total_flats || 0);
            setSold(apartment.sold || 0);
            setDescription(apartment.description || '');
            setCoverImageFile(null);
            setCoverImagePreview(apartment.cover_image || null);
        } else {
            setName('');
            setAddress('');
            setLat(17.7212); // Vizag default center
            setLng(83.3150);
            setIsActive(true);
            setTotalFlats(10);
            setSold(0);
            setDescription('');
            setCoverImageFile(null);
            setCoverImagePreview(null);
        }
        setShowMapPicker(false);
        setError(null);
    }, [isOpen, apartment]);

    if (!isOpen) return null;

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverImageFile(file);
            setCoverImagePreview(URL.createObjectURL(file));
        }
    }

    function handleGetLocation() {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(Number(pos.coords.latitude.toFixed(7)));
                setLng(Number(pos.coords.longitude.toFixed(7)));
            },
            (err) => {
                setError(`Could not detect location: ${err.message}`);
            }
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Apartment name is required.');
            return;
        }
        if (!address.trim()) {
            setError('Address / Location is required.');
            return;
        }

        setIsSubmitting(true);

        try {
            let res: Apartment;

            // If a cover image file is chosen, send multipart FormData
            if (coverImageFile) {
                const formData = new FormData();
                formData.append('name', name.trim());
                formData.append('address', address.trim());
                if (lat !== null) formData.append('latitude', lat.toString());
                if (lng !== null) formData.append('longitude', lng.toString());
                formData.append('is_active', isActive ? 'true' : 'false');
                formData.append('total_flats', totalFlats.toString());
                formData.append('sold', sold.toString());
                formData.append('description', description.trim());
                formData.append('cover_image', coverImageFile);

                const url = isEditing
                    ? ENDPOINTS.apartmentDetail(apartment!.id)
                    : ENDPOINTS.apartments();

                res = await apiFetch(url, {
                    method: isEditing ? 'PATCH' : 'POST',
                    body: formData,
                });
            } else {
                // Standard JSON payload
                const payload: any = {
                    name: name.trim(),
                    address: address.trim(),
                    latitude: lat !== null ? lat : null,
                    longitude: lng !== null ? lng : null,
                    is_active: isActive,
                    total_flats: Number(totalFlats) || 0,
                    sold: Number(sold) || 0,
                    description: description.trim(),
                };

                const url = isEditing
                    ? ENDPOINTS.apartmentDetail(apartment!.id)
                    : ENDPOINTS.apartments();

                res = await apiFetch(url, {
                    method: isEditing ? 'PATCH' : 'POST',
                    body: JSON.stringify(payload),
                });
            }

            onSuccess(res);
            onClose();
        } catch (err: any) {
            console.error('Failed to save apartment:', err);
            setError(err.message || 'Failed to save apartment. Please check your inputs.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                            <Building size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                {isEditing ? 'Edit Apartment' : 'Add New Apartment'}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {isEditing
                                    ? 'Update apartment details, flat counts and geo location'
                                    : 'Create an apartment building or complex for flat listings'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
                            <AlertCircle size={16} className="shrink-0 text-rose-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Apartment Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Skyline Towers, Ocean Pearl Residency"
                            required
                            className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Location / Address <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={2}
                            placeholder="Full address, landmark, city, state"
                            required
                            className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                        />
                    </div>

                    {/* Coordinates / Map */}
                    <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                                <MapPin size={14} className="text-blue-400" />
                                Geo Coordinates (Latitude / Longitude)
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    className="text-[11px] text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-950/40 border border-blue-900/60 transition"
                                >
                                    Detect GPS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowMapPicker(!showMapPicker)}
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-indigo-950/40 border border-indigo-900/60 transition"
                                >
                                    {showMapPicker ? 'Hide Map' : 'Pick on Map'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">
                                    Latitude (Lati)
                                </label>
                                <input
                                    type="number"
                                    step="0.0000001"
                                    value={lat ?? ''}
                                    onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="17.7212000"
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">
                                    Longitude (Long)
                                </label>
                                <input
                                    type="number"
                                    step="0.0000001"
                                    value={lng ?? ''}
                                    onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="83.3150000"
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {showMapPicker && (
                            <div className="pt-2">
                                <LocationPicker
                                    lat={lat}
                                    lng={lng}
                                    onChange={(newLat, newLng) => {
                                        setLat(Number(newLat.toFixed(7)));
                                        setLng(Number(newLng.toFixed(7)));
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Stats & Active Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Total Flats
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={totalFlats}
                                onChange={(e) => setTotalFlats(parseInt(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Total units in building</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Sold Flats
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={sold}
                                onChange={(e) => setSold(parseInt(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Already booked/sold</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Status (Is Active)
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsActive(!isActive)}
                                className={`w-full h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition cursor-pointer ${
                                    isActive
                                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800'
                                }`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                                    }`}
                                />
                                {isActive ? 'Active & Published' : 'Draft / Inactive'}
                            </button>
                            <p className="text-[10px] text-gray-500 mt-1">Visibility for customers</p>
                        </div>
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Cover Image
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        {coverImagePreview ? (
                            <div className="relative rounded-xl overflow-hidden border border-gray-800 h-40 bg-gray-950 group">
                                <img
                                    src={coverImagePreview}
                                    alt="Cover Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition cursor-pointer"
                                    >
                                        Change Photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCoverImageFile(null);
                                            setCoverImagePreview(null);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-500 transition cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-800 hover:border-gray-700 bg-gray-950/40 rounded-xl p-6 text-center cursor-pointer transition"
                            >
                                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-xs font-medium text-gray-300">
                                    Click to upload cover photo
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1">PNG, JPG, WebP up to 10MB</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Amenities, highlights, possession date, architectural details..."
                            className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span>{isEditing ? 'Save Changes' : 'Create Apartment'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
