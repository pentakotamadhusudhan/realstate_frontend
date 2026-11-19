import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    RotateCw,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Eye,
    Layers,
    Compass,
    Sparkles,
    CheckCircle2,
    Clock,
    Lock,
    ShieldAlert,
    Info,
    ChevronUp,
    ChevronDown,
    Building2,
    Play,
    Pause,
    RefreshCw,
    X,
    ExternalLink
} from 'lucide-react';
import type { Apartment, Flat, FlatStatus } from '../../types/apartment';
import {
    formatPrice,
    getFacingIconAndLabel,
    getTypeBadgeColor,
    getStatusBadge
} from '../../utils/apartmentHelpers';

interface Apartment3DModelProps {
    apartment: Apartment | null;
    flats?: Flat[];
    onSelectFlat?: (flat: Flat) => void;
    className?: string;
}

export default function Apartment3DModel({
    apartment,
    flats = [],
    onSelectFlat,
    className = ''
}: Apartment3DModelProps) {
    // 3D Camera & Viewport States
    const [rotX, setRotX] = useState<number>(26); // Vertical pitch tilt
    const [rotY, setRotY] = useState<number>(-35); // Horizontal orbit angle
    const [zoom, setZoom] = useState<number>(1);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [autoRotate, setAutoRotate] = useState<boolean>(false);
    const [exploded, setExploded] = useState<boolean>(false);
    const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
    const [hoveredFlatId, setHoveredFlatId] = useState<string | null>(null);
    const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Auto-rotation loop
    useEffect(() => {
        if (!autoRotate) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        const loop = () => {
            setRotY((prev) => (prev + 0.35) % 360);
            animationFrameRef.current = requestAnimationFrame(loop);
        };
        animationFrameRef.current = requestAnimationFrame(loop);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [autoRotate]);

    // Handle drag rotation
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setAutoRotate(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        setRotY((prev) => prev + deltaX * 0.5);
        setRotX((prev) => Math.max(5, Math.min(85, prev - deltaY * 0.4)));

        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch support for mobile devices
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            setAutoRotate(false);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - dragStart.x;
        const deltaY = e.touches[0].clientY - dragStart.y;

        setRotY((prev) => prev + deltaX * 0.6);
        setRotX((prev) => Math.max(5, Math.min(85, prev - deltaY * 0.5)));

        setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Synthesize / Prepare flat blocks if real flats list is empty
    const buildingData = useMemo(() => {
        if (!apartment) {
            return { floors: [], totalUnits: 0, availableCount: 0, holdCount: 0, soldCount: 0 };
        }

        let effectiveFlats: Flat[] = [...flats];

        // If no flats are returned from API, generate realistic blocks from apartment metadata
        if (effectiveFlats.length === 0) {
            const total = apartment.total_flats || 12;
            const unitsPerFloor = 4;
            const floorCount = Math.max(3, Math.ceil(total / unitsPerFloor));
            const soldCount = apartment.sold || 0;

            let remainingSold = soldCount;
            let flatSeq = 1;

            for (let fl = 1; fl <= floorCount; fl++) {
                for (let u = 1; u <= unitsPerFloor; u++) {
                    if (flatSeq > total) break;

                    const isSold = remainingSold > 0 && Math.random() > 0.4;
                    if (isSold) remainingSold--;
                    const isHold = !isSold && flatSeq % 5 === 0;

                    const types = ['2BHK', '3BHK', '3BHK', '4BHK'] as const;
                    const facings = ['EAST', 'WEST', 'NORTH', 'SOUTH'] as const;

                    effectiveFlats.push({
                        id: `synthetic-${apartment.id}-${fl}-${u}`,
                        apartment: apartment.id,
                        apartment_name: apartment.name,
                        flat_number: `${fl}0${u}`,
                        floor_number: fl,
                        type: types[(u - 1) % types.length],
                        area: 1200 + u * 150 + (fl % 2) * 80,
                        facing: facings[(u - 1) % facings.length],
                        price: 5500000 + fl * 250000 + u * 150000,
                        description: `Luxury unit on Floor ${fl}`,
                        status: isSold ? 'SOLD' : isHold ? 'HOLD' : 'OPENED',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                    flatSeq++;
                }
            }
        }

        // Group flats by floor
        const floorMap = new Map<number, Flat[]>();
        let availableCount = 0;
        let holdCount = 0;
        let soldCount = 0;

        effectiveFlats.forEach((f) => {
            const flNum = Number(f.floor_number) || 1;
            if (!floorMap.has(flNum)) {
                floorMap.set(flNum, []);
            }
            floorMap.get(flNum)!.push(f);

            if (f.status === 'SOLD') soldCount++;
            else if (f.status === 'HOLD') holdCount++;
            else availableCount++;
        });

        // Sort floors descending (top floor at top)
        const sortedFloors = Array.from(floorMap.entries())
            .sort((a, b) => b[0] - a[0])
            .map(([floorNumber, unitList]) => ({
                floorNumber,
                // Sort units by flat_number
                flats: unitList.sort((a, b) => a.flat_number.localeCompare(b.flat_number, undefined, { numeric: true }))
            }));

        return {
            floors: sortedFloors,
            totalUnits: effectiveFlats.length,
            availableCount,
            holdCount,
            soldCount
        };
    }, [apartment, flats]);

    const activeFlat = selectedFlat || (hoveredFlatId ? flats.find((f) => f.id === hoveredFlatId) : null);

    // Color definitions for status blocks
    const getBlockFaceColors = (status: FlatStatus | string, isHovered: boolean, isSelected: boolean) => {
        if (isSelected) {
            return {
                front: 'bg-gradient-to-tr from-cyan-600/90 to-blue-500/95 border-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.8)]',
                top: 'bg-cyan-400 border-cyan-200',
                side: 'bg-cyan-700 border-cyan-400',
                badgeBg: 'bg-cyan-400 text-gray-950 font-black',
                glow: 'rgba(6, 182, 212, 0.7)'
            };
        }
        if (isHovered) {
            return {
                front: 'bg-gradient-to-tr from-blue-600/85 to-indigo-500/90 border-blue-300 ring-1 ring-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)]',
                top: 'bg-blue-400 border-blue-200',
                side: 'bg-blue-700 border-blue-400',
                badgeBg: 'bg-blue-400 text-gray-950 font-black',
                glow: 'rgba(59, 130, 246, 0.6)'
            };
        }

        switch (status) {
            case 'SOLD':
                return {
                    front: 'bg-slate-800/80 border-slate-700/80 text-gray-400',
                    top: 'bg-slate-700/80 border-slate-600',
                    side: 'bg-slate-900/90 border-slate-700',
                    badgeBg: 'bg-slate-800 text-gray-400',
                    glow: 'transparent'
                };
            case 'HOLD':
                return {
                    front: 'bg-gradient-to-tr from-amber-600/75 to-yellow-500/75 border-amber-400/80 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
                    top: 'bg-amber-400/90 border-amber-300',
                    side: 'bg-amber-700/85 border-amber-500',
                    badgeBg: 'bg-amber-400 text-gray-950 font-bold',
                    glow: 'rgba(245, 158, 11, 0.3)'
                };
            case 'OPENED':
            default:
                return {
                    front: 'bg-gradient-to-tr from-emerald-600/75 to-teal-500/75 border-emerald-400/80 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
                    top: 'bg-emerald-400/90 border-emerald-300',
                    side: 'bg-emerald-700/85 border-emerald-500',
                    badgeBg: 'bg-emerald-400 text-gray-950 font-bold',
                    glow: 'rgba(16, 185, 129, 0.35)'
                };
        }
    };

    // Camera preset angles
    const setCameraPreset = (preset: 'isometric' | 'front' | 'side' | 'top') => {
        setAutoRotate(false);
        switch (preset) {
            case 'isometric':
                setRotX(30);
                setRotY(-40);
                setZoom(1);
                break;
            case 'front':
                setRotX(10);
                setRotY(0);
                setZoom(1.05);
                break;
            case 'side':
                setRotX(15);
                setRotY(-85);
                setZoom(1.05);
                break;
            case 'top':
                setRotX(75);
                setRotY(-20);
                setZoom(0.95);
                break;
        }
    };

    if (!apartment) {
        return (
            <div className="w-full bg-gray-900/60 border border-gray-800 rounded-3xl p-12 text-center text-gray-400">
                <Building2 size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-sm font-semibold text-gray-300">Select an apartment complex to load its 3D block model</p>
            </div>
        );
    }

    return (
        <div
            className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-gray-950 via-slate-950 to-gray-950 border border-gray-800 shadow-2xl flex flex-col ${className}`}
        >
            {/* Top Toolbar / Header */}
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-800/80 bg-gray-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Building2 size={20} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                {apartment.name}
                            </h2>
                            {apartment.block_name && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {apartment.block_name}
                                </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                3D Block View
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                            <span>{buildingData.floors.length} Floors</span>
                            <span>•</span>
                            <span>{buildingData.totalUnits} Rectangular Units</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">
                                {buildingData.availableCount} Available
                            </span>
                        </p>
                    </div>
                </div>

                {/* View Controls & Action Bar */}
                <div className="flex items-center flex-wrap gap-2">
                    {/* Camera Presets */}
                    <div className="flex items-center bg-gray-950/80 border border-gray-800 rounded-xl p-1">
                        <button
                            type="button"
                            onClick={() => setCameraPreset('isometric')}
                            className="px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-lg transition"
                            title="Isometric View"
                        >
                            3D Isometric
                        </button>
                        <button
                            type="button"
                            onClick={() => setCameraPreset('front')}
                            className="px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-lg transition"
                            title="Front Elevation"
                        >
                            Front
                        </button>
                        <button
                            type="button"
                            onClick={() => setCameraPreset('side')}
                            className="px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-lg transition"
                            title="Side Elevation"
                        >
                            Side
                        </button>
                        <button
                            type="button"
                            onClick={() => setCameraPreset('top')}
                            className="px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-lg transition"
                            title="Top-Down Plan"
                        >
                            Top
                        </button>
                    </div>

                    {/* Explode / Separate Floors */}
                    <button
                        type="button"
                        onClick={() => setExploded((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            exploded
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                                : 'bg-gray-950/80 border-gray-800 text-gray-300 hover:text-white hover:border-gray-700'
                        }`}
                        title="Expand spacing between floor blocks"
                    >
                        <Layers size={13} />
                        <span>{exploded ? 'Stacked' : 'Explode Levels'}</span>
                    </button>

                    {/* Auto-rotate button */}
                    <button
                        type="button"
                        onClick={() => setAutoRotate((prev) => !prev)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            autoRotate
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                                : 'bg-gray-950/80 border-gray-800 text-gray-300 hover:text-white hover:border-gray-700'
                        }`}
                        title={autoRotate ? 'Pause 360° Spin' : 'Start 360° Spin'}
                    >
                        {autoRotate ? <Pause size={15} /> : <Play size={15} />}
                    </button>

                    {/* Zoom In / Out */}
                    <div className="flex items-center bg-gray-950/80 border border-gray-800 rounded-xl p-0.5">
                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                            title="Zoom In"
                        >
                            <ZoomIn size={14} />
                        </button>
                        <span className="text-[10px] font-mono px-1.5 text-gray-400">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                            title="Zoom Out"
                        >
                            <ZoomOut size={14} />
                        </button>
                    </div>

                    {/* Reset Camera */}
                    <button
                        type="button"
                        onClick={() => setCameraPreset('isometric')}
                        className="p-1.5 bg-gray-950/80 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 rounded-xl transition"
                        title="Reset View"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Sub-bar: Floor Filter and Live Legend */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-gray-900/50 border-b border-gray-800/60 text-xs">
                {/* Floor Picker Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
                    <span className="text-gray-400 text-[11px] font-medium mr-1 shrink-0">Filter Floor:</span>
                    <button
                        type="button"
                        onClick={() => setSelectedFloor('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                            selectedFloor === 'ALL'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-950 border border-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        All Floors
                    </button>
                    {buildingData.floors.map((fl) => (
                        <button
                            key={fl.floorNumber}
                            type="button"
                            onClick={() => setSelectedFloor(fl.floorNumber)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                                selectedFloor === fl.floorNumber
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-950 border border-gray-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            Level {fl.floorNumber}
                        </button>
                    ))}
                </div>

                {/* Status Color Legend */}
                <div className="flex items-center gap-4 text-[11px]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-gray-300">Available ({buildingData.availableCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-500 border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                        <span className="text-gray-300">On Hold ({buildingData.holdCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-slate-700 border border-slate-500"></span>
                        <span className="text-gray-300">Sold ({buildingData.soldCount})</span>
                    </div>
                </div>
            </div>

            {/* Main 3D Viewport Canvas */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative w-full h-[540px] sm:h-[620px] select-none cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center"
                style={{
                    background: 'radial-gradient(circle at 50% 45%, #111827 0%, #030712 85%)'
                }}
            >
                {/* Visual Sky & Grid Horizon */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px'
                        }}
                    />
                </div>

                {/* Drag Hint Overlay */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none bg-gray-950/80 backdrop-blur-md border border-gray-800/80 rounded-2xl px-3 py-2 text-[11px] text-gray-400 flex items-center gap-2 shadow-xl">
                    <RotateCw size={13} className="text-blue-400 animate-spin-slow" />
                    <span>Click & drag to rotate 3D complex</span>
                </div>

                {/* 3D Model Scene Hierarchy */}
                <div
                    className="relative transition-transform duration-75 ease-out"
                    style={{
                        perspective: '1300px',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <div
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                            transition: isDragging ? 'none' : 'transform 0.25s ease-out'
                        }}
                        className="relative flex flex-col items-center justify-center"
                    >
                        {/* Architectural Rooftop Structure / Penthouse Terrace */}
                        <div
                            style={{
                                transformStyle: 'preserve-3d',
                                transform: 'translateZ(15px)',
                                marginBottom: exploded ? '40px' : '10px',
                                transition: 'margin 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                            className="relative flex items-center justify-center"
                        >
                            {/* Rooftop Heli-pad / Solar Canopy Block */}
                            <div className="w-56 h-36 rounded-2xl bg-gradient-to-tr from-gray-800 via-slate-800 to-gray-700 border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex flex-col items-center justify-center p-3 relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/50 text-[9px] font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1 shadow-md">
                                    <Sparkles size={9} />
                                    <span>Penthouse Terrace</span>
                                </div>
                                <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-400/60 flex items-center justify-center">
                                    <span className="text-cyan-300 font-extrabold text-lg">H</span>
                                </div>
                                <div className="absolute bottom-2 text-[9px] text-gray-400 font-mono">
                                    SOLAR ROOF • ELEVATOR HUB
                                </div>
                            </div>
                        </div>

                        {/* Floors Stack (Top to Bottom) */}
                        <div
                            style={{
                                transformStyle: 'preserve-3d'
                            }}
                            className="flex flex-col items-center"
                        >
                            {buildingData.floors.map((floorGroup, fIdx) => {
                                const isFloorVisible =
                                    selectedFloor === 'ALL' || selectedFloor === floorGroup.floorNumber;
                                const floorGap = exploded ? 46 : 8;

                                return (
                                    <div
                                        key={floorGroup.floorNumber}
                                        style={{
                                            transformStyle: 'preserve-3d',
                                            marginBottom: `${floorGap}px`,
                                            opacity: isFloorVisible ? 1 : 0.2,
                                            transform: isFloorVisible ? 'scale(1)' : 'scale(0.92)',
                                            transition:
                                                'margin 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s, transform 0.3s'
                                        }}
                                        className="relative flex items-center justify-center"
                                    >
                                        {/* Floor Level Label Pill (3D Floating on the side) */}
                                        <div
                                            style={{
                                                transformStyle: 'preserve-3d',
                                                transform: 'translateX(-170px) translateZ(10px)'
                                            }}
                                            className="absolute left-0 pointer-events-none hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-900/90 border border-gray-700/80 text-[10px] font-bold text-gray-300 shadow-xl"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                            <span>Floor {floorGroup.floorNumber}</span>
                                        </div>

                                        {/* Floor Concrete Slab Platform */}
                                        <div
                                            style={{
                                                transformStyle: 'preserve-3d'
                                            }}
                                            className="relative flex items-center justify-center gap-3 p-3 bg-gray-900/90 border-2 border-gray-800 rounded-2xl shadow-2xl"
                                        >
                                            {/* Rectangular Unit Blocks on this Floor */}
                                            {floorGroup.flats.map((flat) => {
                                                const isHovered = hoveredFlatId === flat.id;
                                                const isSelected = selectedFlat?.id === flat.id;
                                                const colors = getBlockFaceColors(
                                                    flat.status,
                                                    isHovered,
                                                    isSelected
                                                );

                                                return (
                                                    <div
                                                        key={flat.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedFlat(flat);
                                                            if (onSelectFlat) onSelectFlat(flat);
                                                        }}
                                                        onMouseEnter={() => setHoveredFlatId(flat.id)}
                                                        onMouseLeave={() => setHoveredFlatId(null)}
                                                        style={{
                                                            transformStyle: 'preserve-3d',
                                                            transform:
                                                                isSelected || isHovered
                                                                    ? 'translateZ(26px) translateY(-4px) scale(1.06)'
                                                                    : 'translateZ(10px)',
                                                            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                        }}
                                                        className="relative w-28 sm:w-32 h-24 sm:h-28 rounded-xl cursor-pointer group flex flex-col justify-between p-2.5 transition-all"
                                                    >
                                                        {/* Front Face of the 3D Rectangular Block */}
                                                        <div
                                                            className={`absolute inset-0 rounded-xl border-2 backdrop-blur-md flex flex-col justify-between p-2.5 transition-all duration-300 ${colors.front}`}
                                                        >
                                                            {/* Top Line: Unit # and Type */}
                                                            <div className="flex items-center justify-between">
                                                                <span
                                                                    className={`px-1.5 py-0.5 rounded-md text-[10px] uppercase tracking-wide ${colors.badgeBg}`}
                                                                >
                                                                    #{flat.flat_number}
                                                                </span>
                                                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/40 text-white border border-white/10">
                                                                    {flat.type}
                                                                </span>
                                                            </div>

                                                            {/* Architectural Window Slits (Grid Facade) */}
                                                            <div className="grid grid-cols-3 gap-1 my-1">
                                                                <div className="h-4 rounded-sm bg-white/20 border border-white/20 group-hover:bg-white/40 transition"></div>
                                                                <div className="h-4 rounded-sm bg-white/20 border border-white/20 group-hover:bg-white/40 transition"></div>
                                                                <div className="h-4 rounded-sm bg-white/20 border border-white/20 group-hover:bg-white/40 transition"></div>
                                                            </div>

                                                            {/* Bottom Line: Price & Status */}
                                                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                                                                <span className="font-extrabold text-white truncate max-w-[65px]">
                                                                    {formatPrice(flat.price)}
                                                                </span>
                                                                <span className="text-[9px] uppercase font-bold tracking-tight text-white/90">
                                                                    {flat.status}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* 3D Top Depth Lid of the Rectangular Block */}
                                                        <div
                                                            style={{
                                                                transformOrigin: 'top',
                                                                transform: 'rotateX(90deg) translateY(-14px)'
                                                            }}
                                                            className={`absolute top-0 left-0 right-0 h-4 rounded-t-lg border-t border-x transition-colors opacity-90 pointer-events-none ${colors.top}`}
                                                        />

                                                        {/* 3D Side Depth Face of the Rectangular Block */}
                                                        <div
                                                            style={{
                                                                transformOrigin: 'right',
                                                                transform: 'rotateY(90deg) translateX(14px)'
                                                            }}
                                                            className={`absolute top-0 bottom-0 right-0 w-4 rounded-r-lg border-r border-y transition-colors opacity-90 pointer-events-none ${colors.side}`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Ground Podium / Foundation Slab with Landscaping */}
                        <div
                            style={{
                                transformStyle: 'preserve-3d',
                                transform: 'translateZ(-15px) rotateX(90deg)',
                                marginTop: '15px'
                            }}
                            className="relative flex items-center justify-center"
                        >
                            {/* Concrete Foundation Plinth with Lawn / Walkways */}
                            <div className="w-[380px] sm:w-[480px] h-[340px] sm:h-[420px] rounded-3xl bg-gradient-to-tr from-emerald-950 via-gray-900 to-slate-900 border-4 border-gray-800 shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative flex flex-col justify-between p-6">
                                {/* Driveway and Pathways */}
                                <div className="absolute inset-4 rounded-2xl border border-dashed border-gray-700/60 pointer-events-none flex items-center justify-center">
                                    <div className="w-full h-10 bg-gray-950/70 border-y border-gray-800 flex items-center justify-around text-[10px] text-gray-500 font-mono tracking-widest">
                                        <span>◄ VEHICLE ACCESS</span>
                                        <span>• MAIN GRAND ENTRANCE •</span>
                                        <span>VISITOR PARKING ►</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[11px] font-bold text-emerald-400 z-10">
                                    <span className="flex items-center gap-1">
                                        <span>🌳</span> Landscaped Gardens
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span>🚗</span> Underground Parking (B1-B2)
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-gray-400 z-10">
                                    <span>Clubhouse & Swimming Pool</span>
                                    <span className="font-mono text-cyan-400">24/7 Gated Security</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected / Hovered Flat Inspector Overlay Card */}
                {activeFlat && (
                    <div className="absolute bottom-5 right-5 z-30 w-72 sm:w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-gray-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-extrabold text-white">
                                        Unit #{activeFlat.flat_number}
                                    </h3>
                                    <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTypeBadgeColor(
                                            activeFlat.type
                                        )}`}
                                    >
                                        {activeFlat.type}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Floor {activeFlat.floor_number || 1} • {activeFlat.area} sq.ft
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedFlat(null)}
                                className="p-1 text-gray-400 hover:text-white rounded-lg transition"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Flat Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-2">
                                <span className="text-[10px] text-gray-500 uppercase block">Facing</span>
                                <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                                    <span>{getFacingIconAndLabel(activeFlat.facing).icon}</span>
                                    <span>{getFacingIconAndLabel(activeFlat.facing).label}</span>
                                </span>
                            </div>

                            <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-2">
                                <span className="text-[10px] text-gray-500 uppercase block">Status</span>
                                <span
                                    className={`font-bold mt-0.5 block ${
                                        getStatusBadge(activeFlat.status).color
                                    }`}
                                >
                                    {getStatusBadge(activeFlat.status).label}
                                </span>
                            </div>
                        </div>

                        {/* Price and Action Button */}
                        <div className="flex items-center justify-between pt-1">
                            <div>
                                <span className="text-[10px] text-gray-500 block uppercase">Price</span>
                                <span className="text-base font-extrabold text-emerald-400">
                                    {formatPrice(activeFlat.price)}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    alert(
                                        `Inquiry requested for Unit #${activeFlat.flat_number} in ${apartment.name}. Our sales agent will contact you shortly!`
                                    );
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                            >
                                Inquire Unit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

