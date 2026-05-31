
export type PlotStatus =
    | "available"
    | "reserved"
    | "sold";

export interface PlotCoordinate {
    lat: number;
    lng: number;
}

export interface Plot {
    id: string;
    plotNumber: string;
    plotName: string;
    areaSqft: number;
    price: number;
    status: PlotStatus;
    description: string;
    coordinates: PlotCoordinate[];
}

export interface PlotFilters {
    search: string;
    minPrice: number | null;
    maxPrice: number | null;
    status: PlotStatus | "";
    minArea: number | null;
    maxArea: number | null;
}
