import { ENDPOINTS, saveTokens, clearTokens, getAccessToken, getRefreshToken } from './api'

export interface ActiveMembershipInfo {
    id: string;
    plan_id: string;
    plan_name: string;
    plan_type: 'AGENT' | 'ADMIN';
    status: string;
    start_date: string;
    end_date: string;
    is_valid: boolean;
}

export interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    mobile_number: string;
    user_type: string;
    auth_provider: string;
    social_id?: string;
    is_verified: boolean;
    is_active?: boolean;
    has_active_membership?: boolean;
    active_membership?: ActiveMembershipInfo | null;
    has_lifetime_verification?: boolean;
    is_onboarding_fee_paid?: boolean;
    privacy_conceal_profile?: boolean;
    created_at?: string;
}

export function isAgent(user?: UserProfile | null): boolean {
    const u = user !== undefined ? user : getUserProfile();
    return u?.user_type === 'AGENT';
}

export function isSuperAdmin(user?: UserProfile | null): boolean {
    const u = user !== undefined ? user : getUserProfile();
    return u?.user_type === 'SUPER_ADMIN';
}

export function isAdmin(user?: UserProfile | null): boolean {
    const u = user !== undefined ? user : getUserProfile();
    return u?.user_type === 'ADMIN' || u?.user_type === 'SUPER_ADMIN';
}

export function hasActiveMembership(user?: UserProfile | null): boolean {
    const u = user !== undefined ? user : getUserProfile();
    if (!u) return false;
    if (isAdmin(u)) return true;
    return Boolean(u.has_active_membership || u.active_membership?.is_valid);
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface AuthApiResponse {
    user: UserProfile;
    tokens: AuthTokens;
}

export function saveSession(user: UserProfile, tokens: AuthTokens) {
    saveTokens(tokens.access, tokens.refresh)
    localStorage.setItem('user_profile', JSON.stringify(user))
}

export function getUserProfile(): UserProfile | null {
    try {
        const raw = localStorage.getItem('user_profile')
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function isGoogleUser(): boolean {
    const user = getUserProfile()
    return user?.auth_provider === 'GOOGLE'
}

/**
 * Unified logout:
 * 1. Calls backend /api/auth/logout/ to blacklist the refresh token
 * 2. Disables Google One-Tap/GIS auto-select
 * 3. Clears local and session storage
 * 4. Redirects to /login
 */
export async function logout(navigate?: (to: string) => void): Promise<void> {
    const refresh = getRefreshToken()
    const access = getAccessToken()

    // 1. Notify backend to blacklist token server-side (best-effort)
    if (refresh && access) {
        try {
            await fetch(ENDPOINTS.logout, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`,
                },
                body: JSON.stringify({ refresh }),
            })
        } catch (err) {
            console.warn('Backend logout notification skipped or failed:', err)
        }
    }

    // 2. Disable Google Identity Services auto-selection if loaded
    try {
        if (typeof window !== 'undefined' && (window as any).google?.accounts?.id?.disableAutoSelect) {
            ;(window as any).google.accounts.id.disableAutoSelect()
        }
    } catch (err) {
        console.warn('Google auto-select disable error:', err)
    }

    // 3. Clear tokens & storage
    clearTokens()
    localStorage.removeItem('user_profile')
    sessionStorage.removeItem('customer_venture')

    // 4. Navigate to login
    if (navigate) {
        navigate('/login')
    } else if (typeof window !== 'undefined') {
        window.location.href = '/login'
    }
}

/**
 * Sign in using Google ID token or Access Token
 */
export async function loginWithGoogleToken(
    token: string,
    userType: string = 'CUSTOMER'
): Promise<AuthApiResponse> {
    const response = await fetch(ENDPOINTS.google, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user_type: userType }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        const message =
            data.message ||
            data.detail ||
            data.non_field_errors?.[0] ||
            JSON.stringify(data) ||
            'Google authentication failed.'
        throw new Error(message)
    }

    const authData = data as AuthApiResponse
    saveSession(authData.user, authData.tokens)
    return authData
}

/**
 * Sign in using Google OAuth authorization code
 */
export async function loginWithGoogleCode(
    code: string,
    redirectUri: string,
    userType: string = 'CUSTOMER'
): Promise<AuthApiResponse> {
    const response = await fetch(ENDPOINTS.google, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri, user_type: userType }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        const message =
            data.message ||
            data.detail ||
            data.non_field_errors?.[0] ||
            JSON.stringify(data) ||
            'Google code exchange failed.'
        throw new Error(message)
    }

    const authData = data as AuthApiResponse
    saveSession(authData.user, authData.tokens)
    return authData
}

/**
 * Fetch Google authorization URL and client ID from backend
 */
export async function getGoogleAuthMeta(
    redirectUri?: string
): Promise<{ url: string; client_id?: string }> {
    const res = await fetch(ENDPOINTS.googleUrl(redirectUri))
    if (!res.ok) {
        throw new Error('Failed to fetch Google auth URL')
    }
    return res.json()
}
