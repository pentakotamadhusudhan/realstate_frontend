import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ENDPOINTS } from '../../lib/api'
import LoadingScreen from '../../components/LoadingComponent'

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

  useEffect(() => {
    document.body.classList.add('admin-page')
    return () => document.body.classList.remove('admin-page')
  }, [])

  console.log("ventures log", ENDPOINTS.ventures);


  useEffect(() => {
    async function fetchVentures() {
      try {
        console.log("ventures log", ENDPOINTS.ventures);
        const data = await apiFetch(ENDPOINTS.ventures)
        console.log("ventures log", data);
        setVentures(data.results ?? data)
      } catch (err: any) {
        setError('Failed to load ventures.')
      } finally {
        setLoading(false)
      }
    }
    fetchVentures()
  }, [])

  function handleSelect(venture: Venture) {
    // Store selected venture in sessionStorage
    sessionStorage.setItem('selected_venture', JSON.stringify(venture))
    navigate(`/admin/ventures/${venture.slug}/plots`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Ventures</h1>
          <p className="text-gray-400 text-sm">Select a venture to add plots</p>
        </div>

        <a
          href="/admin/ventures/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
        >
          + New Venture
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Loading State */}
        {loading && (
          <LoadingScreen />
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && ventures.length === 0 && (
          <div className="text-center text-gray-400 py-20 bg-gray-900 rounded-xl border border-gray-800 p-8">
            <div className="text-4xl mb-3">📁</div>
            <h3 className="text-lg font-semibold text-white mb-1">No Ventures Found</h3>
            <p className="text-sm text-gray-400 mb-6">Get started by creating your first venture.</p>
            <a
              href="/admin/ventures/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Create Venture
            </a>
          </div>
        )}

        {/* Ventures List Grid */}
        {!loading && ventures.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ventures.map((venture) => (
              <div
                key={venture.id}
                onClick={() => handleSelect(venture)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-gray-700 hover:bg-gray-900/80 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-white tracking-wide">{venture.name}</h2>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${venture.status === 'active' ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                      {venture.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    📍 {venture.city}, {venture.state}
                  </p>
                </div>

                <div className="border-t border-gray-800 pt-4 flex justify-between items-center text-xs text-gray-400">
                  <div>
                    Total: <span className="text-white font-semibold">{venture.total_plots}</span>
                  </div>
                  <div>
                    Available: <span className="text-green-400 font-semibold">{venture.available_plots}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
