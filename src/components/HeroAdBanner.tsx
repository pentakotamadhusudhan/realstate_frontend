import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles, Star, ExternalLink, ShieldCheck, Tag } from 'lucide-react';
import { apiFetch, ENDPOINTS } from '../lib/api';
import type { AdBanner } from '../types/adBanner';

export interface DisplayBanner {
    id: string | number;
    title?: string;
    subtitle?: string;
    badge?: string;
    cta?: string;
    image: string;
    target_url?: string;
    ranking: number;
    bg?: string;
    glow?: string;
    isApiBanner?: boolean;
}

const DEFAULT_FALLBACK_BANNERS: DisplayBanner[] = [
    {
        id: 'fb-1',
        title: 'Premium Plots Starting at ₹25 Lakhs',
        subtitle: 'Book now and unlock an early-bird discount of 10%',
        badge: '🔥 Limited Offer',
        cta: 'Explore Plots',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
        target_url: '/ventures',
        ranking: 10,
        bg: 'linear-gradient(135deg, #0b1220 0%, #0f2040 40%, #1e40af 100%)',
        glow: 'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.35), transparent 60%)',
    },
    {
        id: 'fb-2',
        title: 'GVMC Approved Layouts & Apartments',
        subtitle: 'Legally verified properties with 100% clear titles & spot registration',
        badge: '✅ 100% Verified',
        cta: 'View Apartments',
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
        target_url: '/apartments',
        ranking: 5,
        bg: 'linear-gradient(135deg, #041e17 0%, #064e3b 50%, #059669 100%)',
        glow: 'radial-gradient(circle at 20% 30%, rgba(16,185,129,0.4), transparent 55%)',
    },
    {
        id: 'fb-3',
        title: 'Zero GST & Easy Bank Loans',
        subtitle: 'Tie-ups with leading banks for instant EMI approvals & maximum savings',
        badge: '💰 Save More',
        cta: 'Check Ventures',
        image: 'https://premiumplotsnagpur.com/plots/img/banner_estate.webp',
        target_url: '/ventures',
        ranking: 1,
        bg: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #7c3aed 100%)',
        glow: 'radial-gradient(circle at 70% 70%, rgba(167,139,250,0.35), transparent 60%)',
    },
];

interface HeroAdBannerProps {
    className?: string;
    adTypeFilter?: string;
}

export default function HeroAdBanner({ className = '', adTypeFilter = 'HERO_BANNER' }: HeroAdBannerProps) {
    const [banners, setBanners] = useState<DisplayBanner[]>([]);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const navigate = useNavigate();

    // Fetch ad banners from API
    useEffect(() => {
        let isMounted = true;

        async function fetchBanners() {
            setLoading(true);
            try {
                // Fetch active banners ordered by ranking descending
                let data: any = null;
                try {
                    data = await apiFetch(ENDPOINTS.adBanners('is_active=true&ordering=-ranking'), { silent: true });
                } catch {
                    // Fallback to authAdBanners if needed
                    try {
                        data = await apiFetch(ENDPOINTS.authAdBanners('is_active=true&ordering=-ranking'), { silent: true });
                    } catch {
                        data = null;
                    }
                }

                if (!isMounted) return;

                const rawList: AdBanner[] = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.results)
                        ? data.results
                        : [];

                // Filter active and non-expired
                const now = Date.now();
                const activeList = rawList.filter(b => {
                    if (b.is_active === false) return false;
                    if (b.end_date && new Date(b.end_date).getTime() < now) return false;
                    return true;
                });

                // Filter by ad_type if requested and available
                const matchingType = activeList.filter(
                    b => !adTypeFilter || (b.ad_type && b.ad_type.toUpperCase() === adTypeFilter.toUpperCase())
                );

                const finalPool = matchingType.length > 0 ? matchingType : activeList;

                // Sort explicitly as per ranking descending: highest rank first
                finalPool.sort((a, b) => {
                    const rankA = typeof a.ranking === 'number' ? a.ranking : 0;
                    const rankB = typeof b.ranking === 'number' ? b.ranking : 0;
                    if (rankB !== rankA) {
                        return rankB - rankA; // Higher ranking first
                    }
                    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return timeB - timeA;
                });

                if (finalPool.length > 0) {
                    const mappedBanners: DisplayBanner[] = finalPool.map((b, index) => {
                        const rank = typeof b.ranking === 'number' ? b.ranking : 0;
                        const badgeText = rank > 0
                            ? `⭐ Rank #${rank} • Top Featured`
                            : `🔥 Featured Ad #${index + 1}`;

                        let ctaText = 'Explore Now';
                        if (b.target_url) {
                            if (b.target_url.includes('/apartments')) ctaText = 'View Apartments';
                            else if (b.target_url.includes('/ventures')) ctaText = 'Explore Ventures';
                            else if (b.target_url.includes('/my-holds')) ctaText = 'My Holds';
                            else if (b.target_url.startsWith('http')) ctaText = 'Visit Link';
                        }

                        return {
                            id: b.id,
                            image: b.banner_url,
                            target_url: b.target_url,
                            ranking: rank,
                            badge: badgeText,
                            cta: ctaText,
                            bg: 'linear-gradient(135deg, rgba(11,18,32,0.85) 0%, rgba(15,32,64,0.7) 50%, rgba(30,64,175,0.7) 100%)',
                            glow: 'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.35), transparent 60%)',
                            isApiBanner: true,
                        };
                    });

                    setBanners(mappedBanners);
                } else {
                    // Fallback to default banners sorted by ranking
                    const sortedFallback = [...DEFAULT_FALLBACK_BANNERS].sort((a, b) => b.ranking - a.ranking);
                    setBanners(sortedFallback);
                }
            } catch {
                // If anything fails, gracefully fall back to sorted default banners
                if (isMounted) {
                    const sortedFallback = [...DEFAULT_FALLBACK_BANNERS].sort((a, b) => b.ranking - a.ranking);
                    setBanners(sortedFallback);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchBanners();

        return () => {
            isMounted = false;
        };
    }, [adTypeFilter]);

    // Timer reset & advance
    const resetTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (banners.length <= 1) return;
        timerRef.current = setInterval(() => {
            if (!isHovered) {
                setCurrentBanner(p => (p + 1) % banners.length);
            }
        }, 5000);
    };

    useEffect(() => {
        resetTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [banners.length, isHovered]);

    // Bounds safety
    useEffect(() => {
        if (banners.length > 0 && currentBanner >= banners.length) {
            setCurrentBanner(0);
        }
    }, [banners.length, currentBanner]);

    const prevBanner = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        resetTimer();
        setCurrentBanner(p => (p - 1 + banners.length) % banners.length);
    };

    const nextBanner = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        resetTimer();
        setCurrentBanner(p => (p + 1) % banners.length);
    };

    const handleBannerClick = () => {
        const active = banners[currentBanner];
        if (!active || !active.target_url) return;

        const target = active.target_url.trim();
        if (target.startsWith('http://') || target.startsWith('https://')) {
            window.open(target, '_blank', 'noopener,noreferrer');
        } else {
            navigate(target);
        }
    };

    if (banners.length === 0 && !loading) {
        return null;
    }

    const banner = banners[currentBanner] || banners[0] || DEFAULT_FALLBACK_BANNERS[0];
    const isClickable = Boolean(banner?.target_url);

    return (
        <section className={`px-4 sm:px-6 lg:px-8 pt-3 ${className}`}>
            <div className="mx-auto max-w-7xl">
                <div
                    onClick={isClickable ? handleBannerClick : undefined}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    role={isClickable ? 'link' : 'region'}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={(e) => {
                        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            handleBannerClick();
                        }
                    }}
                    className={`group relative overflow-hidden rounded-3xl border border-white/10 flex flex-col justify-between transition-all duration-300 select-none ${
                        isClickable ? 'cursor-pointer hover:border-blue-400/40 hover:shadow-blue-900/20' : ''
                    }`}
                    style={{
                        height: 280,
                        boxShadow: '0 30px 60px -30px rgba(15,32,64,0.6)',
                        background: '#090d16',
                    }}
                >
                    {/* ── Background image layers (cross-fade + Ken Burns) ── */}
                    {banners.map((b, i) => (
                        <div
                            key={b.id || i}
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                opacity: i === currentBanner ? 1 : 0,
                                backgroundImage: `url(${b.image})`,
                                transform: i === currentBanner ? 'scale(1.04)' : 'scale(1)',
                                transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1), transform 7s ease-out',
                            }}
                        />
                    ))}

                    {/* ── Subtle colored overlay scrim ── */}
                    <div
                        className="absolute inset-0 transition-all duration-700 pointer-events-none"
                        style={{
                            background: banner.isApiBanner
                                ? 'linear-gradient(to top, rgba(10,17,34,0.85) 0%, rgba(10,17,34,0.3) 50%, rgba(10,17,34,0.6) 100%)'
                                : (banner.bg || 'linear-gradient(135deg, rgba(15,32,64,0.85), rgba(10,18,35,0.9))'),
                        }}
                    />

                    {/* ── Radial glow accent ── */}
                    <div
                        className="absolute inset-0 transition-all duration-700 pointer-events-none"
                        style={{ background: banner.glow || 'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.25), transparent 60%)' }}
                    />

                    {/* ── Top Header Strip: Ranking & Live Badge ── */}
                    <div className="relative z-20 flex items-center justify-between px-6 pt-5">
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full text-white tracking-wide"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.65)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
                                }}
                            >
                                <Sparkles size={12} className="text-amber-400 animate-pulse" />
                                {banner.badge}
                            </span>

                            {banner.ranking > 0 && (
                                <span
                                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full text-amber-300"
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.15)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                    }}
                                >
                                    <Star size={10} className="fill-amber-400 text-amber-400" />
                                    Rank #{banner.ranking}
                                </span>
                            )}
                        </div>

                        {/* Slide counter pill */}
                        {banners.length > 1 && (
                            <span
                                className="text-[11px] font-medium text-white/70 px-2.5 py-1 rounded-full"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                {currentBanner + 1} / {banners.length}
                            </span>
                        )}
                    </div>

                    {/* ── Banner Content (Center Title & Subtitle if available) ── */}
                    <div className="relative z-20 flex-1 flex flex-col justify-center text-center px-12 sm:px-16 py-2">
                        {banner.title && (
                            <h2
                                className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight"
                                style={{ letterSpacing: '-0.02em', textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}
                            >
                                {banner.title}
                            </h2>
                        )}
                        {banner.subtitle && (
                            <p
                                style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
                                className="text-xs sm:text-sm max-w-xl mx-auto line-clamp-2"
                            >
                                {banner.subtitle}
                            </p>
                        )}
                    </div>

                    {/* ═══ Left Navigation Arrow ═══ */}
                    {banners.length > 1 && (
                        <button
                            type="button"
                            onClick={prevBanner}
                            aria-label="Previous Banner"
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                            style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}

                    {/* ═══ Right Navigation Arrow ═══ */}
                    {banners.length > 1 && (
                        <button
                            type="button"
                            onClick={nextBanner}
                            aria-label="Next Banner"
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                            style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                            }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    )}

                    {/* ═══ Bottom Controls Bar (Dots left, CTA right) ═══ */}
                    <div className="relative z-30 px-6 pb-5 flex items-center justify-between gap-4">
                        {/* Dot indicators */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {banners.map((b, i) => (
                                <button
                                    key={b.id || i}
                                    type="button"
                                    onClick={() => {
                                        resetTimer();
                                        setCurrentBanner(i);
                                    }}
                                    aria-label={`Go to slide ${i + 1} (Rank ${b.ranking || 0})`}
                                    className="rounded-full transition-all duration-300"
                                    style={{
                                        width: i === currentBanner ? 26 : 7,
                                        height: 7,
                                        background: i === currentBanner ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                        boxShadow: i === currentBanner ? '0 0 12px rgba(255,255,255,0.8)' : 'none',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Bottom-right CTA Button */}
                        {isClickable && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleBannerClick();
                                }}
                                className="group/btn inline-flex items-center gap-2 pl-4 pr-3 py-2 rounded-full text-xs sm:text-sm font-semibold transition active:scale-95 hover:shadow-2xl hover:scale-105"
                                style={{
                                    background: 'rgba(255,255,255,0.96)',
                                    color: '#0f172a',
                                    boxShadow: '0 8px 24px -8px rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.25)',
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <span>{banner.cta || 'Explore Now'}</span>
                                <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center transition group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                                    style={{ background: 'rgba(15,23,42,0.08)' }}
                                >
                                    <ArrowUpRight size={13} />
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
