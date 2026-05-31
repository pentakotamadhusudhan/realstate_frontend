import {
    GoogleMap,
    useJsApiLoader,
} from "@react-google-maps/api";

import { plots } from "@/data/plots";
import { PlotPolygon } from "./PlotPolygon";

const center = {
    lat: 17.3853,
    lng: 78.4865,
};

export default function PlotMap() {
    const { isLoaded } =
        useJsApiLoader({
            id: "google-map-script",
            googleMapsApiKey:
                import.meta.env
                    .VITE_GOOGLE_MAPS_API_KEY,
        });

    if (!isLoaded)
        return (
            <div>
                Loading Map...
            </div>
        );

    return (
        <GoogleMap
            zoom={18}
            center={center}
            mapContainerClassName="w-full h-full"
            options={{
                streetViewControl: false,
                mapTypeControl: false,
            }}
        >
            {plots.map((plot) => (
                <PlotPolygon
                    key={plot.id}
                    plot={plot}
                />
            ))}
        </GoogleMap>
    );
}