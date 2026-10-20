export type FlatType = '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'COMMERCIAL';

export type FlatFacing =
    | 'EAST'
    | 'WEST'
    | 'NORTH'
    | 'SOUTH'
    | 'NORTH_EAST'
    | 'NORTH_WEST'
    | 'SOUTH_EAST'
    | 'SOUTH_WEST';

export type FlatStatus = 'OPENED' | 'NOT_OPENED' | 'HOLD' | 'SOLD';

export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'OTHER';

export interface ApartmentMedia {
    id: string;
    apartment: string;
    file: string;
    media_type: MediaType;
    caption?: string;
    created_by?: string;
    created_by_name?: string;
    created_by_email?: string;
    created_at: string;
    updated_at: string;
}

export interface FlatMedia {
    id: string;
    flat: string;
    file: string;
    media_type: MediaType;
    caption?: string;
    created_by?: string;
    created_by_name?: string;
    created_by_email?: string;
    created_at: string;
    updated_at: string;
}

export interface Flat {
    id: string;
    apartment: string;
    apartment_name?: string;
    flat_number: string;
    floor_number: number;
    type: FlatType;
    area: string | number;
    facing: FlatFacing;
    price: string | number;
    description: string;
    status: FlatStatus;
    is_available?: boolean;
    created_by?: string;
    created_by_name?: string;
    created_at: string;
    updated_at: string;
    media?: FlatMedia[];
}

export interface Apartment {
    id: string;
    name: string;
    slug: string;
    address: string;
    latitude: number | string | null;
    longitude: number | string | null;
    is_active: boolean;
    total_flats: number;
    sold: number;
    available_flats?: number;
    actual_flats_count?: number;
    media_count?: number;
    cover_image?: string | null;
    description?: string;
    created_by?: string;
    created_by_name?: string;
    created_at: string;
    updated_at: string;
    media?: ApartmentMedia[];
    flats?: Flat[];
}

export const FLAT_TYPES: { value: FlatType; label: string }[] = [
    { value: '1BHK', label: '1 BHK' },
    { value: '2BHK', label: '2 BHK' },
    { value: '3BHK', label: '3 BHK' },
    { value: '4BHK', label: '4 BHK' },
    { value: 'COMMERCIAL', label: 'Commercial' },
];

export const FLAT_FACINGS: { value: FlatFacing; label: string }[] = [
    { value: 'EAST', label: 'East' },
    { value: 'WEST', label: 'West' },
    { value: 'NORTH', label: 'North' },
    { value: 'SOUTH', label: 'South' },
    { value: 'NORTH_EAST', label: 'North-East' },
    { value: 'NORTH_WEST', label: 'North-West' },
    { value: 'SOUTH_EAST', label: 'South-East' },
    { value: 'SOUTH_WEST', label: 'South-West' },
];

export const FLAT_STATUSES: {
    value: FlatStatus;
    label: string;
    color: string;
    bg: string;
    border: string;
}[] = [
    {
        value: 'OPENED',
        label: 'Opened',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/60',
        border: 'border-emerald-800/80',
    },
    {
        value: 'NOT_OPENED',
        label: 'Not Opened',
        color: 'text-zinc-400',
        bg: 'bg-zinc-900/60',
        border: 'border-zinc-700/80',
    },
    {
        value: 'HOLD',
        label: 'On Hold',
        color: 'text-amber-400',
        bg: 'bg-amber-950/60',
        border: 'border-amber-800/80',
    },
    {
        value: 'SOLD',
        label: 'Sold',
        color: 'text-rose-400',
        bg: 'bg-rose-950/60',
        border: 'border-rose-800/80',
    },
];
