import type { Plot, SpecialFeature } from '../types/plot';

// Base center: Anakapalli, AP area (realistic coords)
const BASE_LAT = 17.6910;
const BASE_LNG = 82.9980;

// Helper to offset coords (1 meter ≈ 0.000009 deg lat, 0.000011 deg lng)
const mToLat = (m: number) => m * 0.000009;
const mToLng = (m: number) => m * 0.000011;

// Generate a rectangular plot polygon from top-left corner + dimensions
function rect(
  topLeftLat: number,
  topLeftLng: number,
  heightM: number,
  widthM: number
) {
  return [
    { lat: topLeftLat, lng: topLeftLng },
    { lat: topLeftLat, lng: topLeftLng + mToLng(widthM) },
    { lat: topLeftLat - mToLat(heightM), lng: topLeftLng + mToLng(widthM) },
    { lat: topLeftLat - mToLat(heightM), lng: topLeftLng },
  ];
}

// Township starts at BASE + some offsets, laid out in blocks
const T = BASE_LAT + mToLat(50);  // top of township
const L = BASE_LNG - mToLng(200); // left edge

// Road width: 9m, plot width: 30m, plot depth: 40m
const PW = 30; // plot width meters
const PD = 40; // plot depth meters
const RD = 9;  // road width

// Row 1 plots (top section, 8 plots)
const R1_TOP = T;
const R1_LEFT = L + mToLng(40); // 40m from left boundary (entrance road)

// Row 2 plots (middle section, 8 plots)
const R2_TOP = T - mToLat(PD + RD);

// Row 3 plots (bottom section, 6 plots)
const R3_TOP = T - mToLat(2 * (PD + RD));

const plotImages = [
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80',
  'https://images.unsplash.com/photo-1625602812206-5ec545ca1231?w=400&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80',
];

export const plots: Plot[] = [
  // ── ROW 1 (North side, 8 plots) ──
  {
    id: 'p01',
    plotNumber: 'A-01',
    plotName: 'North Meadow',
    areaSqft: 1200,
    price: 3600000,
    status: 'available',
    category: 'residential',
    facing: 'East',
    corner: true,
    coordinates: rect(R1_TOP, R1_LEFT, PD, PW),
    description: 'Prime corner plot with east-facing entrance and excellent road access. Surrounded by lush greenery and close to the main clubhouse.',
    images: plotImages,
  },
  {
    id: 'p02',
    plotNumber: 'A-02',
    plotName: 'Sunrise View',
    areaSqft: 1200,
    price: 3200000,
    status: 'sold',
    category: 'residential',
    facing: 'East',
    corner: false,
    coordinates: rect(R1_TOP, R1_LEFT + mToLng(PW), PD, PW),
    description: 'Excellent residential plot with morning sunlight and panoramic views of the park.',
    images: plotImages,
  },
  {
    id: 'p03',
    plotNumber: 'A-03',
    plotName: 'Garden Villa',
    areaSqft: 1200,
    price: 3100000,
    status: 'available',
    category: 'residential',
    facing: 'East',
    corner: false,
    coordinates: rect(R1_TOP, R1_LEFT + mToLng(2 * PW), PD, PW),
    description: 'Serene plot adjacent to community garden. Perfect for a family villa.',
    images: plotImages,
  },
  {
    id: 'p04',
    plotNumber: 'A-04',
    plotName: 'Maple Crest',
    areaSqft: 1200,
    price: 3050000,
    status: 'reserved',
    category: 'residential',
    facing: 'East',
    corner: false,
    coordinates: rect(R1_TOP, R1_LEFT + mToLng(3 * PW), PD, PW),
    description: 'A beautiful residential plot in the heart of the township with excellent connectivity.',
    images: plotImages,
  },
  {
    id: 'p05',
    plotNumber: 'A-05',
    plotName: 'Oak Haven',
    areaSqft: 1200,
    price: 3080000,
    status: 'available',
    category: 'residential',
    facing: 'West',
    corner: false,
    coordinates: rect(R1_TOP, R1_LEFT + mToLng(4 * PW), PD, PW),
    description: 'Quiet and peaceful plot ideal for building your dream home.',
    images: plotImages,
  },
  {
    id: 'p06',
    plotNumber: 'A-06',
    plotName: 'Pinnacle Plot',
    areaSqft: 1200,
    price: 3150000,
    status: 'sold',
    category: 'residential',
    facing: 'West',
    corner: false,
    coordinates: rect(R1_TOP, R1_LEFT + mToLng(5 * PW), PD, PW),
    description: 'Premium plot with wide road frontage and excellent vastu compliance.',
    images: plotImages,
  },
  {
    id: 'p07',
    plotNumber: 'A-07',
    plotName: 'Hilltop Retreat',
    areaSqft: 1200,
    price: 3200000,
    status: 'available',
    category: 'residential',
    facing: 'West',
    corner: false,
    coordinates: rect(R1_TOP, R1_LEFT + mToLng(6 * PW), PD, PW),
    description: 'Elevated plot with scenic landscape views and cool breeze.',
    images: plotImages,
  },
  {
    id: 'p08',
    plotNumber: 'A-08',
    plotName: 'Corner Glory',
    areaSqft: 1400,
    price: 4200000,
    status: 'reserved',
    category: 'residential',
    facing: 'West',
    corner: true,
    coordinates: rect(R1_TOP, R1_LEFT + mToLng(7 * PW), PD, PW + 10),
    description: 'Premium corner plot with dual road frontage. One of the most sought-after plots in the project.',
    images: plotImages,
  },

  // ── ROW 2 (Middle, 8 plots) ──
  {
    id: 'p09',
    plotNumber: 'B-01',
    plotName: 'Blossom Park',
    areaSqft: 1200,
    price: 2900000,
    status: 'available',
    category: 'residential',
    facing: 'East',
    corner: false,
    coordinates: rect(R2_TOP, R1_LEFT, PD, PW),
    description: 'A centrally located plot with excellent access to all amenities.',
    images: plotImages,
  },
  {
    id: 'p10',
    plotNumber: 'B-02',
    plotName: 'Emerald Lane',
    areaSqft: 1200,
    price: 2850000,
    status: 'sold',
    category: 'residential',
    facing: 'East',
    corner: false,
    coordinates: rect(R2_TOP, R1_LEFT + mToLng(PW), PD, PW),
    description: 'Green-surrounded plot perfect for peaceful family living.',
    images: plotImages,
  },
  {
    id: 'p11',
    plotNumber: 'B-03',
    plotName: 'Silver Oaks',
    areaSqft: 1200,
    price: 2800000,
    status: 'available',
    category: 'residential',
    facing: 'East',
    corner: false,
    coordinates: rect(R2_TOP, R1_LEFT + mToLng(2 * PW), PD, PW),
    description: 'Affordable yet premium plot in the second row with good connectivity.',
    images: plotImages,
  },
  {
    id: 'p12',
    plotNumber: 'B-04',
    plotName: 'Tranquil Heights',
    areaSqft: 1200,
    price: 2750000,
    status: 'reserved',
    category: 'residential',
    facing: 'East',
    corner: false,
    coordinates: rect(R2_TOP, R1_LEFT + mToLng(3 * PW), PD, PW),
    description: 'Calm and serene plot surrounded by mature trees and green walkways.',
    images: plotImages,
  },
  {
    id: 'p13',
    plotNumber: 'B-05',
    plotName: 'Verdant View',
    areaSqft: 1200,
    price: 2800000,
    status: 'available',
    category: 'residential',
    facing: 'West',
    corner: false,
    coordinates: rect(R2_TOP, R1_LEFT + mToLng(4 * PW), PD, PW),
    description: 'West-facing plot with excellent evening light and good vastu energy.',
    images: plotImages,
  },
  {
    id: 'p14',
    plotNumber: 'B-06',
    plotName: 'Lotus Nest',
    areaSqft: 1200,
    price: 2900000,
    status: 'sold',
    category: 'residential',
    facing: 'West',
    corner: false,
    coordinates: rect(R2_TOP, R1_LEFT + mToLng(5 * PW), PD, PW),
    description: 'Uniquely positioned plot near the community lotus pond and walking tracks.',
    images: plotImages,
  },
  {
    id: 'p15',
    plotNumber: 'B-07',
    plotName: 'Aurora Estate',
    areaSqft: 1200,
    price: 2950000,
    status: 'available',
    category: 'residential',
    facing: 'West',
    corner: false,
    coordinates: rect(R2_TOP, R1_LEFT + mToLng(6 * PW), PD, PW),
    description: 'Beautiful plot with wide internal road and well-planned drainage system.',
    images: plotImages,
  },
  {
    id: 'p16',
    plotNumber: 'B-08',
    plotName: 'Prestige Crown',
    areaSqft: 1400,
    price: 4000000,
    status: 'reserved',
    category: 'residential',
    facing: 'West',
    corner: true,
    coordinates: rect(R2_TOP, R1_LEFT + mToLng(7 * PW), PD, PW + 10),
    description: 'Prestigious corner plot with maximum road frontage and luxury finishings.',
    images: plotImages,
  },

  // ── ROW 3 (South, 6 plots) ──
  {
    id: 'p17',
    plotNumber: 'C-01',
    plotName: 'South Haven',
    areaSqft: 1200,
    price: 2600000,
    status: 'available',
    category: 'residential',
    facing: 'East',
    corner: true,
    coordinates: rect(R3_TOP, R1_LEFT, PD, PW),
    description: 'Southern block corner plot close to the park. Great for families who love outdoor space.',
    images: plotImages,
  },
  {
    id: 'p18',
    plotNumber: 'C-02',
    plotName: 'Cascade View',
    areaSqft: 1200,
    price: 2500000,
    status: 'sold',
    category: 'residential',
    facing: 'East',
    corner: false,
    coordinates: rect(R3_TOP, R1_LEFT + mToLng(PW), PD, PW),
    description: 'Well-positioned plot near the water feature and park area.',
    images: plotImages,
  },
  {
    id: 'p19',
    plotNumber: 'C-03',
    plotName: 'Harmony Homes',
    areaSqft: 1200,
    price: 2550000,
    status: 'available',
    category: 'residential',
    facing: 'East',
    corner: false,
    coordinates: rect(R3_TOP, R1_LEFT + mToLng(2 * PW), PD, PW),
    description: 'Harmoniously designed plot with park views and excellent ventilation.',
    images: plotImages,
  },
  {
    id: 'p20',
    plotNumber: 'C-04',
    plotName: 'Zenith Point',
    areaSqft: 1200,
    price: 2600000,
    status: 'reserved',
    category: 'residential',
    facing: 'West',
    corner: false,
    coordinates: rect(R3_TOP, R1_LEFT + mToLng(3 * PW), PD, PW),
    description: 'Exclusive plot in the southern block. Best value for money in the township.',
    images: plotImages,
  },
  {
    id: 'p21',
    plotNumber: 'C-05',
    plotName: 'Palm Grove',
    areaSqft: 1200,
    price: 2650000,
    status: 'available',
    category: 'residential',
    facing: 'West',
    corner: false,
    coordinates: rect(R3_TOP, R1_LEFT + mToLng(4 * PW), PD, PW),
    description: 'Shaded by mature palm trees, this plot offers natural beauty and tranquility.',
    images: plotImages,
  },
  {
    id: 'p22',
    plotNumber: 'C-06',
    plotName: 'Grand Finale',
    areaSqft: 1600,
    price: 4800000,
    status: 'available',
    category: 'residential',
    facing: 'West',
    corner: true,
    coordinates: rect(R3_TOP, R1_LEFT + mToLng(5 * PW), PD, PW + 20),
    description: 'The largest plot in the township! A magnificent corner plot adjacent to the clubhouse with triple road frontage.',
    images: plotImages,
  },
];

export const specialFeatures: SpecialFeature[] = [
  {
    id: 'entrance',
    type: 'entrance',
    label: 'Main Entrance Gate',
    position: { lat: T - mToLat(PD / 2), lng: L + mToLng(15) },
  },
  {
    id: 'park',
    type: 'park',
    label: 'Community Park',
    position: {
      lat: R3_TOP - mToLat(PD / 2),
      lng: R1_LEFT + mToLng(6 * PW + 20),
    },
    polygon: rect(R3_TOP, R1_LEFT + mToLng(6 * PW + 5), PD, 60),
  },
  {
    id: 'clubhouse',
    type: 'clubhouse',
    label: 'Clubhouse',
    position: {
      lat: R2_TOP - mToLat(PD / 2 + 5),
      lng: R1_LEFT + mToLng(8 * PW + 20),
    },
    polygon: rect(R2_TOP - mToLat(RD), R1_LEFT + mToLng(8 * PW + 5), PD + 20, 70),
  },
];

export const TOWNSHIP_NAME = 'PlotVista Green Township';
export const TOWNSHIP_CENTER = {
  lat: T - mToLat(1.5 * PD + RD),
  lng: L + mToLng(150),
};
export const MAP_ZOOM = 19;
