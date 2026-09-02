import { create } from 'zustand';
import type { Plot, Filters, LatLng } from '../types/plot';
import { apiFetch, ENDPOINTS } from '../lib/api';

interface PlotStore {
  allPlots: Plot[];
  selectedPlot: Plot | null;
  hoveredPlotId: string | null;
  isDarkMode: boolean;
  isFullscreen: boolean;
  isEditMode: boolean;
  editingPlotId: string | null;
  filters: Filters;
  visiblePlots: Plot[];
  isLoading: boolean;
  error: string | null;

  fetchPlots: () => Promise<void>;
  selectPlot: (plot: Plot | null) => void;
  hoverPlot: (id: string | null) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  toggleDarkMode: () => void;
  toggleFullscreen: () => void;
  toggleEditMode: () => void;
  setEditingPlotId: (id: string | null) => void;
  updatePlotCoordinates: (plotId: string, coords: LatLng[]) => void;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  minPrice: 0,
  maxPrice: 10000000,
  status: 'all',
  minArea: 0,
  maxArea: 5000,
};

function applyFilters(plots: Plot[], filters: Filters): Plot[] {
  return plots.filter((plot) => {
    if (
      filters.search &&
      !plot.plotName.toLowerCase().includes(filters.search.toLowerCase()) &&
      !plot.plotNumber.toLowerCase().includes(filters.search.toLowerCase())
    ) return false;
    if (filters.status !== 'all' && plot.status !== filters.status) return false;
    if (plot.price < filters.minPrice || plot.price > filters.maxPrice) return false;
    if (plot.areaSqft < filters.minArea || plot.areaSqft > filters.maxArea) return false;
    return true;
  });
}

// Map Django API plot shape → your frontend Plot type
function mapApiPlot(apiPlot: any): Plot {
  const statusMap: Record<string, Plot['status']> = {
    AVAILABLE: 'available',
    HELD: 'held',
    SOLD: 'sold',
    BLOCKED: 'blocked',
    RESERVED: 'reserved',
  }

  return {
    id: apiPlot.id,
    plotNumber: apiPlot.plot_number,
    plotName: `Plot ${apiPlot.plot_number}`,
    areaSqft: parseFloat(apiPlot.area_sqft),
    price: parseFloat(apiPlot.total_price),
    status: statusMap[apiPlot.status] ?? 'available',
    description: apiPlot.notes || '',
    coordinates: apiPlot.coordinates || [],
    facing: apiPlot.facing || '',
    dimensions: apiPlot.dimensions || '',
    corner_plot: apiPlot.corner_plot || false,
  }
}

export const usePlotStore = create<PlotStore>((set, get) => ({
  allPlots: [],
  selectedPlot: null,
  hoveredPlotId: null,
  isDarkMode: false,
  isFullscreen: false,
  isEditMode: false,
  editingPlotId: null,
  filters: DEFAULT_FILTERS,
  visiblePlots: [],
  isLoading: false,
  error: null,

  // Fetch plots from Django API
  fetchPlots: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiFetch(ENDPOINTS.plots)
      // Django returns paginated response: { results: [...] }
      const raw = data.results ?? data
      const plots = raw.map(mapApiPlot)
      set({
        allPlots: plots,
        visiblePlots: applyFilters(plots, get().filters),
        isLoading: false,
      })
    } catch (err: any) {
      set({
        error: 'Failed to load plots. Please try again.',
        isLoading: false,
      })
    }
  },

  selectPlot: (plot) => set({ selectedPlot: plot }),
  hoverPlot: (id) => set({ hoveredPlotId: id }),

  setFilter: (key, value) => {
    const newFilters = { ...get().filters, [key]: value };
    set({ filters: newFilters, visiblePlots: applyFilters(get().allPlots, newFilters) });
  },

  resetFilters: () => set({ filters: DEFAULT_FILTERS, visiblePlots: get().allPlots }),
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),

  toggleEditMode: () =>
    set((s) => ({
      isEditMode: !s.isEditMode,
      editingPlotId: null,
      selectedPlot: s.isEditMode ? null : s.selectedPlot,
    })),

  setEditingPlotId: (id) => set({ editingPlotId: id }),

  updatePlotCoordinates: (plotId, coords) => {
    const updated = get().allPlots.map((p) =>
      p.id === plotId ? { ...p, coordinates: coords } : p
    );
    set({
      allPlots: updated,
      visiblePlots: applyFilters(updated, get().filters),
    });
  },
}));