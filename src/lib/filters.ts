import { Plot, PlotFilters } from "@/types/plot";

export function filterPlots(
    plots: Plot[],
    filters: PlotFilters
) {
    return plots.filter((plot) => {
        const searchMatch =
            plot.plotName
                .toLowerCase()
                .includes(
                    filters.search.toLowerCase()
                );

        const priceMatch =
            (!filters.minPrice ||
                plot.price >= filters.minPrice) &&
            (!filters.maxPrice ||
                plot.price <= filters.maxPrice);

        const areaMatch =
            (!filters.minArea ||
                plot.areaSqft >= filters.minArea) &&
            (!filters.maxArea ||
                plot.areaSqft <= filters.maxArea);

        const statusMatch =
            !filters.status ||
            plot.status === filters.status;

        return (
            searchMatch &&
            priceMatch &&
            areaMatch &&
            statusMatch
        );
    });
}