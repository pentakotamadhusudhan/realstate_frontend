import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import type { SponsoredVenturesResponse, SponsoredVentureCard } from '../../types/revenue';
import { Sparkles, MapPin, Star, ArrowUpRight, Building2, TrendingUp, Compass } from 'lucide-react';

interface Props {
    city?: string;
    onSelectVenture: (venture: any) => void;
}

export default function SponsoredVenturesGrid({ city, onSelectVenture }: Props) {
    const [data, setData] = useState<SponsoredVenturesResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchSponsored = async () => {
            setLoading(true);
            try {
                const query = city ? `city=${encodeURIComponent(city)}` : '';
                const res = await apiFetch(ENDPOINTS.sponsoredVentures(query));
                if (isMounted) setData(res);
            } catch {
                // If service disabled or fails, fail silently
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSponsored();
        return () => {
            isMounted = false;
        };
    }, [city]);

    if (loading || !data || !data.display_grid || data.display_grid.length === 0) {
        return null;
    }

    return (
        <section className="mb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 mb-1.5">
                        <Sparkles size={13} className="text-amber-600 fill-amber-500" />
                        <span>Recommended & Sponsored Showcase</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Featured Regional Ventures
                    </h2>
                    <p className="text-xs text-slate-500">
                        Top paid sponsored ventures and high-performing organic township layouts in {data.city}.
                    </p>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                    2x4 Display Grid • {data.sponsored_count} Sponsored • {data.organic_count} Regional Top Picks
                </div>
            </div>

            {/* 2x4 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.display_grid.slice(0, 8).map((venture: SponsoredVentureCard) => (
                    <div
                        key={venture.id}
                        onClick={() => onSelectVenture(venture)}
                        className={`group relative cursor-pointer rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${
                            venture.is_sponsored
                                ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-2 border-amber-400/60 shadow-md shadow-amber-500/10 hover:shadow-xl hover:border-amber-500 hover:-translate-y-1'
                                : 'bg-white border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-1'
                        }`}
                    >
                        <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                                {venture.is_sponsored ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
                                        <Star size={10} className="fill-white" />
                                        Sponsored
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/50">
                                        Top Organic
                                    </span>
                                )}

                                <span className="text-[11px] font-semibold text-slate-400">
                                    {venture.total_plots} Plots
                                </span>
                            </div>

                            {/* Title & Ad Title */}
                            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition line-clamp-1">
                                {venture.name}
                            </h3>

                            {venture.ad_title && (
                                <p className="text-[11px] text-amber-800 font-medium line-clamp-1 mt-0.5">
                                    "{venture.ad_title}"
                                </p>
                            )}

                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 mb-3">
                                <MapPin size={11} className="text-slate-400" />
                                {venture.city}, {venture.state}
                            </p>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500 group-hover:text-blue-600 transition font-medium">
                                Explore Layout →
                            </span>
                            <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition text-slate-500">
                                <ArrowUpRight size={12} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
