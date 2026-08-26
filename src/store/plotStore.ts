import { create } from 'zustand';
import type { Plot, Filters, LatLng } from '../types/plot';
import { plots } from '../data/plots';

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
    if (plot.category !== 'residential') return true;
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

export const usePlotStore = create<PlotStore>((set, get) => ({
  allPlots: plots,
  selectedPlot: null,
  hoveredPlotId: null,
  isDarkMode: false,
  isFullscreen: false,
  isEditMode: false,
  editingPlotId: null,
  filters: DEFAULT_FILTERS,
  visiblePlots: plots,

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
      // Deselect plot when leaving edit mode
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
