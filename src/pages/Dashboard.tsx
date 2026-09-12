import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FiltersPanel from '../components/FiltersPanel'
import PlotMap from '../components/PlotMap'
import PlotDetailsDrawer from '../components/PlotDetailsDrawer'
import { usePlotStore } from '../store/plotStore'
import { MapPin, ArrowLeft } from 'lucide-react'
import LoadingScreen from '../components/LoadingComponent'

export default function Dashboard() {
  const { selectedPlot, fetchPlots, isLoading, error, allPlots } = usePlotStore()
  const navigate = useNavigate()

  const stored = sessionStorage.getItem('customer_venture')
  const venture = stored ? JSON.parse(stored) : null

  useEffect(() => {
    fetchPlots()
  }, [])

  if (isLoading) {
    return (
      <LoadingScreen />
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

  const available = allPlots.filter(p => p.status === 'available').length
  const total = allPlots.length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Venture info bar */}
      {venture && (
        <div
          className="shrink-0 flex items-center justify-between px-6 py-2.5 border-b"
          style={{
            background: 'linear-gradient(135deg, #0f2040, #1e4080)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/ventures')}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
            >
              <ArrowLeft size={13} />
              All Ventures
            </button>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <div className="flex items-center gap-2">
              <MapPin size={13} style={{ color: '#f59e0b' }} />
              <span className="text-white font-semibold text-sm">
                {venture.name}
              </span>
              <span className="text-gray-400 text-xs">
                {venture.city}, {venture.state}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-gray-300">
                <span className="text-white font-semibold">{available}</span> available
              </span>
            </span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">{total} total plots</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <FiltersPanel />
        <PlotMap />
        {selectedPlot && <PlotDetailsDrawer />}
      </div>

    </div>
  )
}