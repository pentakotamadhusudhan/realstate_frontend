import { usePlotStore } from "@/app/store/plotStore";

export default function PlotDetailsDrawer() {
    const selectedPlot = usePlotStore(
        (state) => state.selectedPlot
    );

    if (!selectedPlot) return null;

    return (
        <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl p-4 overflow-auto z-50">
            <h2 className="text-xl font-bold">
                {selectedPlot.plotName}
            </h2>

            <div className="mt-4 space-y-2">
                <p>
                    Plot No:
                    {selectedPlot.plotNumber}
                </p>

                <p>
                    Area:
                    {selectedPlot.areaSqft} sqft
                </p>

                <p>
                    Price:
                    ₹{selectedPlot.price.toLocaleString()}
                </p>

                <p>
                    Status:
                    {selectedPlot.status}
                </p>

                <p>
                    {selectedPlot.description}
                </p>
            </div>
        </div>
    );
}