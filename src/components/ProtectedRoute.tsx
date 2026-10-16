import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken } from '../lib/api'
import { getUserProfile, isAgent, isAdmin } from '../lib/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = getAccessToken()
    const location = useLocation()

    if (!token) {
        const isTryingAdmin = location.pathname.startsWith('/admin')
        return <Navigate to={isTryingAdmin ? "/admin/login" : "/login"} replace state={{ from: location }} />
    }

    const user = getUserProfile()

    // 1. Agent Verification Required: If an agent is not verified, restrict to /unverified
    if (isAgent(user) && !user?.is_verified && location.pathname !== '/unverified') {
        return <Navigate to="/unverified" replace />
    }

    // 2. Customers cannot access admin routes
    if (location.pathname.startsWith('/admin') && user?.user_type === 'CUSTOMER') {
        return <Navigate to="/ventures" replace />
    }

    // 3. Agents cannot access Super Admin exclusive management routes
    if (isAgent(user) && (location.pathname.startsWith('/admin/agents') || location.pathname.startsWith('/admin/approvals'))) {
        return <Navigate to="/admin/ventures" replace />
    }

    return <>{children}</>
}