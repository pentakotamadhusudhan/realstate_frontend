import { create } from "zustand";
import { Plot, PlotFilters } from "@/types/plot";

interface PlotStore {
    selectedPlot: Plot | null;
    hoveredPlot: Plot | null;

    filters: PlotFilters;

    setSelectedPlot: (plot: Plot | null) => void;
    setHoveredPlot: (plot: Plot | null) => void;
    updateFilters: (
        filters: Partial<PlotFilters>
    ) => void;
}

export const usePlotStore =
    create<PlotStore>((set) => ({
        selectedPlot: null,
        hoveredPlot: null,

        filters: {
            search: "",
            minPrice: null,
            maxPrice: null,
            status: "",
            minArea: null,
            maxArea: null,
        },

        setSelectedPlot: (plot) =>
            set({ selectedPlot: plot }),

        setHoveredPlot: (plot) =>
            set({ hoveredPlot: plot }),

        updateFilters: (filters) =>
            set((state) => ({
                filters: {
                    ...state.filters,
                    ...filters,
                },
            })),
    }));