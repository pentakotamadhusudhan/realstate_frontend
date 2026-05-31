import { memo } from "react";
import { Polygon } from "@react-google-maps/api";
import { Plot } from "@/types/plot";
import { usePlotStore } from "@/app/store/plotStore";

interface Props {
    plot: Plot;
}

const colors = {
    available: "#22c55e",
    reserved: "#facc15",
    sold: "#ef4444",
};

function PlotPolygonComponent({
    plot,
}: Props) {
    const setSelectedPlot =
        usePlotStore(
            (s) => s.setSelectedPlot
        );

    const setHoveredPlot =
        usePlotStore(
            (s) => s.setHoveredPlot
        );

    return (
        <Polygon
            paths={plot.coordinates}
            options={{
                fillColor:
                    colors[plot.status],
                fillOpacity: 0.45,
                strokeColor:
                    colors[plot.status],
                strokeWeight: 2,
            }}
            onMouseOver={() =>
                setHoveredPlot(plot)
            }
            onMouseOut={() =>
                setHoveredPlot(null)
            }
            onClick={() =>
                setSelectedPlot(plot)
            }
        />
    );
}

export const PlotPolygon = memo(
    PlotPolygonComponent
);