export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8000/api'
        : 'http://192.168.1.18:8000/api')

export const ENDPOINTS = {
    login: `${API_BASE_URL}/auth/login/`,
    register: `${API_BASE_URL}/auth/register/customer/`,
    google: `${API_BASE_URL}/auth/google/`,
    googleUrl: (redirectUri?: string) =>
        `${API_BASE_URL}/auth/google/url/${
            redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''
        }`,
    socialLogin: `${API_BASE_URL}/auth/social-login/`,
    logout: `${API_BASE_URL}/auth/logout/`,
    me: `${API_BASE_URL}/auth/me/`,
    ventures: `${API_BASE_URL}/ventures/`,
    plots: `${API_BASE_URL}/plots/`,
    tokenRefresh: `${API_BASE_URL}/auth/token/refresh/`,
    myHolds: `${API_BASE_URL}/holds/mine/`,
    dxfLayers: (slug: string) => `${API_BASE_URL}/ventures/${slug}/dxf/layers/`,
    dxfParse: (slug: string) => `${API_BASE_URL}/ventures/${slug}/dxf/parse/`,
}

export function saveTokens(access: string, refresh: string) {
    localStorage.setItem("access_token", access)
    localStorage.setItem("refresh_token", refresh)
}

export function getAccessToken(): string | null {
    return localStorage.getItem("access_token")
}

export function getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token")
}

export function clearTokens() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
}

export async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<any> {
    const token = getAccessToken()

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw error
    }

    return response.json()
}