import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Eye, FileText, Video, Image as ImageIcon, Loader2, AlertCircle, Check } from 'lucide-react';
import type { ApartmentMedia, FlatMedia, MediaType } from '../../types/apartment';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import { formatDate } from '../../utils/apartmentHelpers';

interface ApartmentMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    targetId: string;
    targetType: 'apartment' | 'flat';
    mediaList: (ApartmentMedia | FlatMedia)[];
    onMediaUpdated: () => void;
}

export default function ApartmentMediaModal({
    isOpen,
    onClose,
    title,
    targetId,
    targetType,
    mediaList,
    onMediaUpdated,
}: ApartmentMediaModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
    const [caption, setCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);

            // Auto detect media type from mime
            if (selected.type.startsWith('video/')) {
                setMediaType('VIDEO');
            } else if (selected.type.startsWith('image/')) {
                setMediaType('IMAGE');
            } else if (selected.type.includes('pdf') || selected.type.includes('document')) {
                setMediaType('DOCUMENT');
            }
        }
    }

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('media_type', mediaType);
            if (caption.trim()) {
                formData.append('caption', caption.trim());
            }

            const url = targetType === 'apartment'
                ? ENDPOINTS.apartmentMedia(targetId)
                : ENDPOINTS.flatMedia(targetId);

            await apiFetch(url, {
                method: 'POST',
                body: formData,
            });

            setFile(null);
            setCaption('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            onMediaUpdated();
        } catch (err: any) {
            console.error('Failed to upload media:', err);
            setError(err.message || 'Failed to upload media.');
        } finally {
            setIsUploading(false);
        }
    }

    async function handleDelete(mediaId: string) {
        if (!confirm('Are you sure you want to delete this media file?')) return;

        setDeletingId(mediaId);
        setError(null);

        try {
            const url = targetType === 'apartment'
                ? ENDPOINTS.apartmentMediaDetail(mediaId)
                : ENDPOINTS.flatMediaDetail(mediaId);

            await apiFetch(url, { method: 'DELETE' });
            onMediaUpdated();
        } catch (err: any) {
            console.error('Failed to delete media:', err);
            setError(err.message || 'Failed to delete media file.');
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-6">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/90">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Media & Attachments</h3>
                            <p className="text-xs text-gray-400">{title}</p>
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

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
                            <AlertCircle size={16} className="shrink-0 text-rose-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Upload Section */}
                    <form onSubmit={handleUpload} className="bg-gray-950/70 border border-gray-800 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Upload size={14} className="text-cyan-400" />
                            Upload New Media File
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] text-gray-400 mb-1">Select File</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">Media Type</label>
                                <select
                                    value={mediaType}
                                    onChange={(e) => setMediaType(e.target.value as MediaType)}
                                    className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="IMAGE">Image / Photo</option>
                                    <option value="VIDEO">Video Tour</option>
                                    <option value="DOCUMENT">Document / Brochure</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] text-gray-400 mb-1">Caption / Description</label>
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="e.g. Master Bedroom, West Elevation, Floor Plan 2BHK"
                                className="w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                disabled={isUploading || !file}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition disabled:opacity-50 cursor-pointer"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={13} />
                                        <span>Upload Media</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Media Gallery */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">
                            Attached Media ({mediaList.length})
                        </h4>

                        {mediaList.length === 0 ? (
                            <div className="py-12 border border-dashed border-gray-800 rounded-xl text-center bg-gray-950/40 text-gray-500 text-xs">
                                No media files uploaded yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {mediaList.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative bg-gray-950 border border-gray-800 rounded-xl overflow-hidden group flex flex-col justify-between"
                                    >
                                        {/* Thumbnail / Preview */}
                                        <div className="h-32 bg-gray-900 flex items-center justify-center overflow-hidden relative">
                                            {item.media_type === 'IMAGE' ? (
                                                <img
                                                    src={item.file}
                                                    alt={item.caption || 'Media file'}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : item.media_type === 'VIDEO' ? (
                                                <div className="flex flex-col items-center text-cyan-400 gap-1">
                                                    <Video size={28} />
                                                    <span className="text-[10px] text-gray-400">Video</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-amber-400 gap-1">
                                                    <FileText size={28} />
                                                    <span className="text-[10px] text-gray-400">Document</span>
                                                </div>
                                            )}

                                            {/* Hover Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                                <a
                                                    href={item.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
                                                    title="View Full"
                                                >
                                                    <Eye size={14} />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.id)}
                                                    disabled={deletingId === item.id}
                                                    className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition cursor-pointer"
                                                    title="Delete"
                                                >
                                                    {deletingId === item.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Caption & Meta */}
                                        <div className="p-2.5">
                                            <p className="text-xs font-semibold text-gray-200 truncate">
                                                {item.caption || 'Untitled Media'}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                                                <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                                                    {item.media_type}
                                                </span>
                                                <span>{formatDate(item.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-3.5 border-t border-gray-800 bg-gray-900/90">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-800 hover:bg-gray-700 text-white transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
