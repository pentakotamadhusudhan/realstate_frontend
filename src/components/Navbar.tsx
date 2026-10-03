import { MapPin, Moon, Sun, Maximize2, Minimize2, Phone, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlotStore } from '../store/plotStore';
import { clearTokens } from '../lib/api';

const TOWNSHIP_NAME = 'Premium Plots';

export default function Navbar() {
  const { isDarkMode, toggleDarkMode, isFullscreen, toggleFullscreen, allPlots } = usePlotStore();
  const navigate = useNavigate();

  const available = allPlots.filter((p) => p.status === 'available').length;
  const total = allPlots.length;

  function handleLogout() {
    clearTokens();
    localStorage.removeItem('user_profile');
    navigate('/login');
  }

  return (
    <header
      className="flex items-center justify-between px-6 h-14 shrink-0 z-50 shadow-sm"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #0a1628 0%, #0f2040 100%)'
          : 'linear-gradient(135deg, #0f2040 0%, #1e4080 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        overflowX: 'auto',
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
      <div className="flex items-center gap-2 ml-auto shrink-0">

        {/* Stats pill - hide on small screens */}
        <div
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
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

        {/* Dark mode - hide on small screens */}
        <button
          onClick={toggleDarkMode}
          className="hidden sm:flex p-2 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
          title="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Fullscreen - hide on small screens */}
        <button
          onClick={toggleFullscreen}
          className="hidden sm:flex p-2 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
          title="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* Enquire - hide on small screens */}
        <button
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            color: 'white',
          }}
        >
          <Phone size={11} />
          Enquire Now
        </button>

        {/* Logout — always visible */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
          title="Logout"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </button>

      </div>
    </header>
  );
}