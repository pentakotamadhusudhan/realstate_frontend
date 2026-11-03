import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ENDPOINTS, updateVentureToPublic, updateVentureToDraft } from '../../lib/api'
import { getUserProfile, isAdmin, isSuperAdmin } from '../../lib/auth'
import LoadingScreen from '../../components/LoadingComponent'
import ApiErrorAlert from '../../components/alter_box/ApiErrorAlert'
import { formatApiErrorMessage } from '../../utils/formatApiError'
import AdminNavbar from '../../components/admin/AdminNavbar'
import BuilderVentureAnalyticsModal from '../../components/revenue/BuilderVentureAnalyticsModal'
import BuilderVerificationModal from '../../components/revenue/BuilderVerificationModal'
import VentureProximityManagerModal from '../../components/revenue/VentureProximityManagerModal'
import {
  Building2,
  Plus,
  BarChart3,
  Compass,
  ShieldCheck,
  Shield,
  Layers,
  MapPin,
  Sparkles,
  Globe,
  CheckCircle2,
  Clock,
  RefreshCw,
  X
} from 'lucide-react'

interface Venture {
  id: string
  name: string
  slug: string
  city: string
  state: string
  center_latitude: string
  center_longitude: string
  total_plots: number
  available_plots: number
  status: string
  created_at: string
}

export default function VentureList() {
  const [ventures, setVentures] = useState<Venture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const user = getUserProfile()

  // Modals state
  const [selectedAnalyticsVenture, setSelectedAnalyticsVenture] = useState<Venture | null>(null)
  const [selectedProximityVenture, setSelectedProximityVenture] = useState<Venture | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [publishingSlug, setPublishingSlug] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    document.body.classList.add('admin-page')
    return () => document.body.classList.remove('admin-page')
  }, [])

  async function fetchVentures() {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch(ENDPOINTS.ventures)
      setVentures(data.results ?? data)
    } catch (err: any) {
      setError(formatApiErrorMessage(err) || 'Failed to load ventures.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVentures()
  }, [])

  async function handlePublishVenture(venture: Venture) {
    setPublishingSlug(venture.slug)
    setError('')
    try {
      await updateVentureToPublic(venture.slug)
      setVentures(prev =>
        prev.map(v => (v.slug === venture.slug ? { ...v, status: 'PUBLISHED' } : v))
      )
      setToastMessage({
        type: 'success',
        text: `Venture "${venture.name}" has been published to public successfully!`,
      })
      setTimeout(() => setToastMessage(null), 5000)
    } catch (err: any) {
      setError(formatApiErrorMessage(err) || `Failed to publish venture "${venture.name}".`)
    } finally {
      setPublishingSlug(null)
    }
  }

  async function handleUnpublishVenture(venture: Venture) {
    if (!window.confirm(`Are you sure you want to revert "${venture.name}" back to Draft?`)) return
    setPublishingSlug(venture.slug)
    setError('')
    try {
      await updateVentureToDraft(venture.slug)
      setVentures(prev =>
        prev.map(v => (v.slug === venture.slug ? { ...v, status: 'DRAFT' } : v))
      )
      setToastMessage({
        type: 'success',
        text: `Venture "${venture.name}" has been reverted to Draft.`,
      })
      setTimeout(() => setToastMessage(null), 5000)
    } catch (err: any) {
      setError(formatApiErrorMessage(err) || `Failed to revert venture to draft.`)
    } finally {
      setPublishingSlug(null)
    }
  }

  function handleSelect(venture: Venture) {
    sessionStorage.setItem('selected_venture', JSON.stringify(venture))
    navigate(`/admin/ventures/${venture.slug}/plots`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <AdminNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Top Header / Developer Hub Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Venture Management
              </h1>
              {user?.has_lifetime_verification ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
                  <ShieldCheck size={14} className="text-amber-400" />
                  Lifetime Verified Developer
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-gray-400 border border-gray-800">
                  <Layers size={13} />
                  Unlimited Property Portfolio
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Showcase projects, track real-time buyer analytics, and manage plot inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!user?.has_lifetime_verification && (
              <button
                type="button"
                onClick={() => setShowVerificationModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm"
              >
                <ShieldCheck size={15} />
                Get Lifetime Verification Badge
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/admin/ventures/create')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
            >
              <Plus size={15} />
              Create Venture
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xl ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/90 border-rose-800 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-white text-xs font-bold"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingScreen />}

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <ApiErrorAlert
              message={error}
              onRetry={fetchVentures}
              onClose={() => setError('')}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && ventures.length === 0 && (
          <div className="text-center text-gray-400 py-20 bg-gray-900/60 rounded-3xl border border-gray-800 p-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Building2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Ventures Found</h3>
            <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
              Get started by uploading and configuring your first township layout or housing project.
            </p>
            <button
              onClick={() => navigate('/admin/ventures/create')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md"
            >
              <Plus size={14} />
              Create Venture
            </button>
          </div>
        )}

        {/* Ventures List Grid */}
        {!loading && ventures.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ventures.map((venture) => {
              const isPublished = venture.status === 'PUBLISHED' || venture.status === 'active'
              const isUpdating = publishingSlug === venture.slug

              return (
                <div
                  key={venture.id}
                  className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 hover:border-gray-700 transition flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                          {venture.name}
                          {user?.has_lifetime_verification && (
                            <span title="Verified Developer">
                              <ShieldCheck size={16} className="text-amber-400" />
                            </span>
                          )}
                        </h2>
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                          <MapPin size={12} className="text-gray-500" />
                          {venture.city}, {venture.state}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          isPublished
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {isPublished ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {isPublished ? 'Public / Live' : 'Draft'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-4">
                      <div className="bg-gray-950/80 p-3 rounded-2xl border border-gray-800/80">
                        <span className="text-[11px] text-gray-400">Total Plots</span>
                        <p className="text-lg font-extrabold text-white mt-0.5">{venture.total_plots}</p>
                      </div>
                      <div className="bg-gray-950/80 p-3 rounded-2xl border border-gray-800/80">
                        <span className="text-[11px] text-gray-400">Available Plots</span>
                        <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
                          {venture.available_plots}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="border-t border-gray-800/80 pt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Buyer Analytics Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedAnalyticsVenture(venture)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-semibold transition cursor-pointer"
                        title="View Buyer Analytics & Visitor Insights"
                      >
                        <BarChart3 size={13} />
                        Buyer Insights
                      </button>

                      {/* Proximity Points Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedProximityVenture(venture)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-400 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
                        title="Manage Proximity & Infrastructure Analytics"
                      >
                        <Compass size={13} />
                        Proximity
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Draft to Public Action Button */}
                      {!isPublished ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handlePublishVenture(venture)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                          title="Update venture draft to public availability"
                        >
                          {isUpdating ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Globe size={13} />
                              Publish to Public
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUnpublishVenture(venture)}
                          className="px-2.5 py-1.5 rounded-xl text-gray-500 hover:text-amber-400 hover:bg-amber-950/30 text-xs font-medium transition cursor-pointer"
                          title="Revert published venture to draft"
                        >
                          {isUpdating ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            'Set to Draft'
                          )}
                        </button>
                      )}

                      {/* Plots upload link */}
                      <button
                        type="button"
                        onClick={() => handleSelect(venture)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Manage Plots →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Buyer Analytics Modal */}
      {selectedAnalyticsVenture && (
        <BuilderVentureAnalyticsModal
          slug={selectedAnalyticsVenture.slug}
          ventureName={selectedAnalyticsVenture.name}
          onClose={() => setSelectedAnalyticsVenture(null)}
        />
      )}

      {/* Proximity Manager Modal */}
      {selectedProximityVenture && (
        <VentureProximityManagerModal
          slug={selectedProximityVenture.slug}
          ventureName={selectedProximityVenture.name}
          canEdit={true}
          onClose={() => setSelectedProximityVenture(null)}
        />
      )}

      {/* Lifetime Verification Modal */}
      {showVerificationModal && (
        <BuilderVerificationModal
          onClose={() => setShowVerificationModal(false)}
          onSuccess={() => {
            setShowVerificationModal(false)
            fetchVentures()
          }}
        />
      )}
    </div>
  )
}

