import type { Flat, FlatFacing, FlatStatus, FlatType } from '../types/apartment';
import { FLAT_STATUSES } from '../types/apartment';

export function formatPrice(price: number | string | undefined | null): string {
    if (price === undefined || price === null || price === '') return '₹0';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '₹0';

    if (num >= 10_000_000) {
        return `₹${(num / 10_000_000).toFixed(2)} Cr`;
    }
    if (num >= 100_000) {
        return `₹${(num / 100_000).toFixed(1)} Lakhs`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
}

export function formatCurrencyFull(price: number | string | undefined | null): string {
    if (price === undefined || price === null || price === '') return '₹0';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '₹0';
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

export function formatDate(dateString?: string | null): string {
    if (!dateString) return '—';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
}

export function formatShortDate(dateString?: string | null): string {
    if (!dateString) return '—';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
}

export function getStatusBadge(status: FlatStatus | string) {
    const s = FLAT_STATUSES.find((item) => item.value === status);
    if (s) {
        return s;
    }
    return {
        value: status as FlatStatus,
        label: status,
        color: 'text-gray-400',
        bg: 'bg-gray-800/80',
        border: 'border-gray-700',
    };
}

export function getTypeBadgeColor(type: FlatType | string) {
    switch (type) {
        case '1BHK':
            return 'bg-blue-950/80 text-blue-300 border-blue-800/70';
        case '2BHK':
            return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/70';
        case '3BHK':
            return 'bg-purple-950/80 text-purple-300 border-purple-800/70';
        case '4BHK':
            return 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800/70';
        case 'COMMERCIAL':
            return 'bg-amber-950/80 text-amber-300 border-amber-800/70';
        default:
            return 'bg-gray-800 text-gray-300 border-gray-700';
    }
}

export function getFacingIconAndLabel(facing: FlatFacing | string) {
    switch (facing) {
        case 'EAST':
            return { icon: '🌅', label: 'East' };
        case 'WEST':
            return { icon: '🌇', label: 'West' };
        case 'NORTH':
            return { icon: '🧭', label: 'North' };
        case 'SOUTH':
            return { icon: '🧭', label: 'South' };
        case 'NORTH_EAST':
            return { icon: '🧭', label: 'North-East' };
        case 'NORTH_WEST':
            return { icon: '🧭', label: 'North-West' };
        case 'SOUTH_EAST':
            return { icon: '🧭', label: 'South-East' };
        case 'SOUTH_WEST':
            return { icon: '🧭', label: 'South-West' };
        default:
            return { icon: '🧭', label: facing };
    }
}

export interface FlatStats {
    total: number;
    opened: number;
    hold: number;
    sold: number;
    notOpened: number;
    totalValue: number;
    avgPrice: number;
}

export function computeFlatStats(flats: Flat[]): FlatStats {
    let opened = 0;
    let hold = 0;
    let sold = 0;
    let notOpened = 0;
    let totalValue = 0;

    flats.forEach((flat) => {
        const price = typeof flat.price === 'string' ? parseFloat(flat.price) : flat.price;
        if (!isNaN(price)) {
            totalValue += price;
        }

        switch (flat.status) {
            case 'OPENED':
                opened++;
                break;
            case 'HOLD':
                hold++;
                break;
            case 'SOLD':
                sold++;
                break;
            case 'NOT_OPENED':
            default:
                notOpened++;
                break;
        }
    });

    const total = flats.length;
    const avgPrice = total > 0 ? totalValue / total : 0;

    return {
        total,
        opened,
        hold,
        sold,
        notOpened,
        totalValue,
        avgPrice,
    };
}
