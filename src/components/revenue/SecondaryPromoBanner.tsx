import React, { useState, useEffect } from 'react';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import type { PromotionalPlacement } from '../../types/revenue';
import { ArrowUpRight, Sparkles, Megaphone, Tag } from 'lucide-react';

export default function SecondaryPromoBanner() {
    const [banners, setBanners] = useState<PromotionalPlacement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchBanners = async () => {
            try {
                const data = await apiFetch(ENDPOINTS.promotionalBanners('section=SECTION_2'));
                const list = Array.isArray(data) ? data : data?.results || [];
                if (isMounted) setBanners(list);
            } catch {
                // If service disabled or unavailable, fail gracefully
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchBanners();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleClick = async (banner: PromotionalPlacement) => {
        try {
            apiFetch(ENDPOINTS.promotionalBannerClick(banner.id), { method: 'POST', silent: true });
        } catch {
            // best effort
        }
        if (banner.target_url) {
            if (banner.target_url.startsWith('http')) {
                window.open(banner.target_url, '_blank');
            } else {
                window.location.href = banner.target_url;
            }
        }
    };

    if (loading || banners.length === 0) {
        return null;
    }

    const banner = banners[0];

    return (
        <section className="my-10">
            <div
                onClick={() => handleClick(banner)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]"
                style={{
                    background: 'linear-gradient(135deg, #091322 0%, #0f244a 50%, #1e3a8a 100%)',
                    boxShadow: '0 10px 40px -10px rgba(15,36,74,0.5)',
                }}
            >
                {banner.banner_image_url && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                        style={{ backgroundImage: `url(${banner.banner_image_url})` }}
                    />
                )}

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
                            <Megaphone size={12} className="text-amber-400" />
                            <span>Featured Platform Spotlight</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                            {banner.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-200/80 mt-1.5">
                            {banner.target_city
                                ? `Prime verified opportunities available across ${banner.target_city}.`
                                : 'Explore verified developer layouts, spot registrations, and zero brokerage.'}
                        </p>
                    </div>

                    <div className="shrink-0">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40"
                        >
                            <span>Learn More & Explore</span>
                            <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
