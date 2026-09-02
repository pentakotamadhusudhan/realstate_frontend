import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ENDPOINTS, saveTokens } from '../../lib/api'

export default function AdminLogin() {
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch(ENDPOINTS.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier,
                    password,
                    user_type: 'ADMIN',
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || JSON.stringify(data) || 'Login failed')
            }

            // Check user is admin or super admin
            if (!['ADMIN', 'SUPER_ADMIN'].includes(data.user.user_type)) {
                throw new Error('You do not have admin access.')
            }

            saveTokens(data.tokens.access, data.tokens.refresh)
            localStorage.setItem('user_profile', JSON.stringify(data.user))
            navigate('/admin/ventures')

        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-800">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-xl">🏢</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                    <p className="text-gray-400 text-sm mt-1">Sign in to manage ventures and plots</p>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email or Mobile
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            placeholder="admin@example.com"
                            required
                            disabled={loading}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-3 rounded-xl font-semibold transition mt-2"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Customer portal?{' '}
                    <a href="/login" className="text-blue-400 hover:text-blue-300">
                        Go to customer login
                    </a>
                </p>

            </div>
        </div>
    )
}