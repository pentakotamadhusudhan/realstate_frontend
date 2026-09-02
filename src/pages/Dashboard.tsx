import { useEffect } from 'react';
import FiltersPanel from '../components/FiltersPanel';
import PlotMap from '../components/PlotMap';
import PlotDetailsDrawer from '../components/PlotDetailsDrawer';
import { usePlotStore } from '../store/plotStore';

export default function Dashboard() {
  const { selectedPlot, fetchPlots, isLoading, error } = usePlotStore();

  // Fetch plots from Django when dashboard loads
  useEffect(() => {
    fetchPlots()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="text-4xl mb-3">⚙️</div>
          <p className="text-gray-400">Loading plots...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchPlots}
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <FiltersPanel />
      <PlotMap />
      {selectedPlot && <PlotDetailsDrawer />}
    </div>
  );
}