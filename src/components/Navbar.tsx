import { MapPin, Moon, Sun, Maximize2, Minimize2, Building2, Phone, ChevronDown } from 'lucide-react';
import { usePlotStore } from '../store/plotStore';
import { TOWNSHIP_NAME } from '../data/plots';

export default function Navbar() {
  const { isDarkMode, toggleDarkMode, isFullscreen, toggleFullscreen, allPlots } = usePlotStore();

  const available = allPlots.filter((p) => p.status === 'available').length;
  const total = allPlots.filter((p) => p.category === 'residential').length;

  return (
    <header
      className="flex items-center justify-between px-6 h-14 shrink-0 z-50 shadow-sm"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #0a1628 0%, #0f2040 100%)'
          : 'linear-gradient(135deg, #0f2040 0%, #1e4080 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
        >
          <MapPin size={15} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <span
            className="font-display text-white font-bold tracking-tight text-sm leading-none block"
            style={{ letterSpacing: '-0.02em' }}
          >
            PlotVista
          </span>
          <span className="text-xs leading-none" style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>
            {TOWNSHIP_NAME}
          </span>
        </div>
      </div>

      {/* Center Nav */}
      <nav className="hidden md:flex items-center gap-1">
        {['Plots', 'About Project', 'Location', 'Contact'].map((item, i) => (
          <button
            key={item}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            style={{
              color: i === 0 ? 'white' : 'rgba(255,255,255,0.55)',
              background: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            {item}
            {item === 'About Project' && <ChevronDown size={10} />}
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Stats pill */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span className="text-white font-semibold">{available}</span>
            <span>available</span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
          <span>{total} plots</span>
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
          title="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
          title="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        <button
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            color: 'white',
          }}
        >
          <Phone size={11} />
          Enquire Now
        </button>
      </div>
    </header>
  );
}
