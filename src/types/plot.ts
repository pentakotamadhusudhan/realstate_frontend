export type PlotStatus = 'available' | 'reserved' | 'sold';

export type PlotCategory = 'residential' | 'commercial' | 'park' | 'road' | 'amenity';

export interface LatLng {
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
  category: PlotCategory;
  coordinates: LatLng[];
  description?: string;
  facing?: string;
  corner?: boolean;
  images?: string[];
}

export interface SpecialFeature {
  id: string;
  type: 'entrance' | 'park' | 'clubhouse' | 'road';
  label: string;
  position: LatLng;
  polygon?: LatLng[];
}

export interface Filters {
  search: string;
  minPrice: number;
  maxPrice: number;
  status: PlotStatus | 'all';
  minArea: number;
  maxArea: number;
}
