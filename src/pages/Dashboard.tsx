import FiltersPanel from '../components/FiltersPanel';
import PlotMap from '../components/PlotMap';
import PlotDetailsDrawer from '../components/PlotDetailsDrawer';
import { usePlotStore } from '../store/plotStore';

export default function Dashboard() {
  const { selectedPlot } = usePlotStore();

  return (
    <div className="flex flex-1 overflow-hidden">
      <FiltersPanel />
      <PlotMap />
      {selectedPlot && <PlotDetailsDrawer />}
    </div>
  );
}
