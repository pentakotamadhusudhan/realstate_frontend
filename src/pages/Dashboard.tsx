import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FiltersPanel from '../components/FiltersPanel'
import PlotMap from '../components/PlotMap'
import PlotDetailsDrawer from '../components/PlotDetailsDrawer'
import { usePlotStore } from '../store/plotStore'
import { MapPin, ArrowLeft, Compass, Megaphone, ArrowUpRight } from 'lucide-react'
import LoadingScreen from '../components/LoadingComponent'
import { apiFetch, ENDPOINTS } from '../lib/api'
import type { PromotionalPlacement } from '../types/revenue'
import VentureProximityManagerModal from '../components/revenue/VentureProximityManagerModal'

export default function Dashboard() {
  const { selectedPlot, fetchPlots, isLoading, error, allPlots } = usePlotStore()
  const navigate = useNavigate()

  const stored = sessionStorage.getItem('customer_venture')
  const venture = stored ? JSON.parse(stored) : null

  const [ventureAd, setVentureAd] = useState<PromotionalPlacement | null>(null)
  const [showProximityModal, setShowProximityModal] = useState(false)

  useEffect(() => {
    fetchPlots()

    // 1. Log visitor interaction for Builder Visitor Analytics
    if (venture?.id) {
      apiFetch(ENDPOINTS.logVisitorInteraction, {
        method: 'POST',
        body: JSON.stringify({
          venture_id: venture.id,
          action_type: 'VENTURE_VIEW',
        }),
        silent: true,
      }).catch(() => {})
    }

    // 2. Fetch Ventures Page Ads (Section 3: Target-relevant ad slots embedded in venture details)
    apiFetch(ENDPOINTS.promotionalBanners('section=VENTURES_PAGE_ADS'), { silent: true })
      .then(data => {
        const list = Array.isArray(data) ? data : data?.results || []
        if (list.length > 0) {
          setVentureAd(list[0])
        }
      })
      .catch(() => {})
  }, [venture?.id])

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
            <button
              type="button"
              onClick={() => setShowProximityModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition"
            >
              <Compass size={13} className="text-purple-300" />
              Proximity & Transit
            </button>

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

      {/* Target-relevant ad slot embedded within venture details page (Section 3: Ventures Page Ads) */}
      {ventureAd && (
        <div
          onClick={() => {
            apiFetch(ENDPOINTS.promotionalBannerClick(ventureAd.id), { method: 'POST', silent: true })
            if (ventureAd.target_url) {
              window.open(ventureAd.target_url, '_blank')
            }
          }}
          className="shrink-0 bg-gradient-to-r from-amber-950/80 via-blue-950/80 to-purple-950/80 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-200 cursor-pointer hover:opacity-95 transition"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-gray-950 font-extrabold text-[10px] uppercase">
              Sponsored
            </span>
            <span className="font-bold text-white">{ventureAd.title}</span>
            <span className="text-gray-300 text-[11px] hidden sm:inline">
              Exclusive developer loan offers and stamp-duty waivers.
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-blue-300 font-bold hover:underline shrink-0">
            View Offer <ArrowUpRight size={12} />
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <FiltersPanel />
        <PlotMap />
        {selectedPlot && <PlotDetailsDrawer />}
      </div>

      {/* Proximity & Infrastructure Modal */}
      {showProximityModal && venture && (
        <VentureProximityManagerModal
          slug={venture.slug}
          ventureName={venture.name}
          canEdit={false}
          onClose={() => setShowProximityModal(false)}
        />
      )}

    </div>
  )
}