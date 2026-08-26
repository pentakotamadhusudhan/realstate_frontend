import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import { usePlotStore } from './store/plotStore';

export default function App() {
  const { isDarkMode } = usePlotStore();

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100dvh',
        background: isDarkMode ? '#0a1628' : '#f8fafc',
      }}
    >
      <Navbar />
      <Dashboard />
    </div>
  );
}
