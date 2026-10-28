export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://10.233.153.102:8000/api'
        : 'http://10.233.153.102:8000/api')

export const ENDPOINTS = {
    login: `${API_BASE_URL}/auth/login/`,
    register: `${API_BASE_URL}/auth/register/customer/`,
    register_agent: `${API_BASE_URL}/auth/register/agent/`,
    google: `${API_BASE_URL}/auth/google/`,
    googleUrl: (redirectUri?: string) =>
        `${API_BASE_URL}/auth/google/url/${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''
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
    pdfParse: (slug: string) => `${API_BASE_URL}/ventures/${slug}/pdf/parse/`,
    users: (params?: string) => `${API_BASE_URL}/auth/users/${params ? `?${params}` : ''}`,
    agents: `${API_BASE_URL}/auth/agents/`,
    unverifiedAgents: `${API_BASE_URL}/auth/agents/unverified/`,
    verifyUser: (id: string) => `${API_BASE_URL}/auth/users/${id}/verify/`,
    deactivateUser: (id: string) => `${API_BASE_URL}/auth/users/${id}/deactivate/`,
    activateUser: (id: string) => `${API_BASE_URL}/auth/users/${id}/activate/`,
    membershipPlans: (params?: string) =>
        `${API_BASE_URL}/auth/memberships/plans/${params ? `?${params}` : ''}`,
    membershipPlanDetail: (id: string) => `${API_BASE_URL}/auth/memberships/plans/${id}/`,
    userMemberships: `${API_BASE_URL}/auth/memberships/`,
    userMembershipDetail: (id: string) => `${API_BASE_URL}/auth/memberships/${id}/`,
    myActiveMembership: `${API_BASE_URL}/auth/memberships/my/`,
    pendingVentures: `${API_BASE_URL}/ventures/pending-approval/`,
    approveVenture: (slug: string) => `${API_BASE_URL}/ventures/${slug}/approve/`,
    callQueries: (params?: string) =>
        `${API_BASE_URL}/call-queries/${params ? `?${params}` : ''}`,
    callQueryDetail: (id: string) => `${API_BASE_URL}/call-queries/${id}/`,
    adBanners: (params?: string) =>
        `${API_BASE_URL}/ad-banners/${params ? `?${params}` : ''}`,
    adBannerDetail: (id: string | number) => `${API_BASE_URL}/ad-banners/${id}/`,
    authAdBanners: (params?: string) =>
        `${API_BASE_URL}/auth/ad-banners/${params ? `?${params}` : ''}`,
    authAdBannerDetail: (id: string | number) => `${API_BASE_URL}/auth/ad-banners/${id}/`,

    // Apartments & Flats endpoints
    apartments: (params?: string) =>
        `${API_BASE_URL}/apartments/${params ? `?${params}` : ''}`,
    apartmentDetail: (id: string) => `${API_BASE_URL}/apartments/${id}/`,
    apartmentFlats: (id: string, params?: string) =>
        `${API_BASE_URL}/apartments/${id}/flats/${params ? `?${params}` : ''}`,
    apartmentFlatsBulkCreate: (id: string) =>
        `${API_BASE_URL}/apartments/${id}/flats/bulk-create/`,
    apartmentMedia: (id: string) => `${API_BASE_URL}/apartments/${id}/media/`,
    apartmentMediaDetail: (id: string) => `${API_BASE_URL}/apartments/media/${id}/`,
    flats: (params?: string) =>
        `${API_BASE_URL}/flats/${params ? `?${params}` : ''}`,
    flatDetail: (id: string) => `${API_BASE_URL}/flats/${id}/`,
    flatMedia: (id: string) => `${API_BASE_URL}/flats/${id}/media/`,
    flatMediaDetail: (id: string) => `${API_BASE_URL}/flats/media/${id}/`,

    // Revenue Generation Model & Super Admin Governance endpoints
    revenueServices: (params?: string) =>
        `${API_BASE_URL}/revenue/services/${params ? `?${params}` : ''}`,
    revenueServiceToggle: (code: string) =>
        `${API_BASE_URL}/revenue/services/${code}/`,
    builderVerification: `${API_BASE_URL}/revenue/builder/verification/`,
    superAdminVerifications: (params?: string) =>
        `${API_BASE_URL}/revenue/super-admin/verifications/${params ? `?${params}` : ''}`,
    superAdminVerificationReview: (id: string) =>
        `${API_BASE_URL}/revenue/super-admin/verifications/${id}/review/`,
    builderVentureAnalytics: (slug: string) =>
        `${API_BASE_URL}/revenue/builder/ventures/${slug}/analytics/`,
    logVisitorInteraction: `${API_BASE_URL}/revenue/analytics/log/`,
    agentOnboardingFee: `${API_BASE_URL}/revenue/agent/onboarding-fee/pay/`,
    agentLeadPackages: (params?: string) =>
        `${API_BASE_URL}/revenue/agent/lead-packages/${params ? `?${params}` : ''}`,
    agentPurchaseLeadPackage: (id: string) =>
        `${API_BASE_URL}/revenue/agent/lead-packages/${id}/purchase/`,
    agentLeadWallet: `${API_BASE_URL}/revenue/agent/wallet/`,
    agentUnlockLead: (queryId: string) =>
        `${API_BASE_URL}/revenue/agent/leads/${queryId}/unlock/`,
    promotionalBanners: (params?: string) =>
        `${API_BASE_URL}/revenue/promotions/banners/${params ? `?${params}` : ''}`,
    promotionalBannerDetail: (id: string | number) =>
        `${API_BASE_URL}/revenue/promotions/banners/${id}/`,
    promotionalBannerClick: (id: string | number) =>
        `${API_BASE_URL}/revenue/promotions/banners/${id}/click/`,
    sponsoredVentures: (params?: string) =>
        `${API_BASE_URL}/revenue/promotions/sponsored-ventures/${params ? `?${params}` : ''}`,
    advancedVentureSearch: (params?: string) =>
        `${API_BASE_URL}/revenue/search/ventures/${params ? `?${params}` : ''}`,
    ventureProximity: (slug: string) =>
        `${API_BASE_URL}/revenue/ventures/${slug}/proximity/`,
    extendHold: (holdId: string) =>
        `${API_BASE_URL}/revenue/holds/${holdId}/extend/`,
    customerDataPrivacy: `${API_BASE_URL}/revenue/customer/data-privacy/toggle/`,
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

import { formatApiErrorMessage } from "../utils/formatApiError";
import { showApiError } from "../store/apiErrorStore";

export { formatApiErrorMessage } from "../utils/formatApiError";
export { showApiError, clearApiErrors } from "../store/apiErrorStore";

export interface ApiFetchOptions extends RequestInit {
    silent?: boolean;
}

export async function apiFetch(
    url: string,
    options: ApiFetchOptions = {}
): Promise<any> {
    const token = getAccessToken()
    const { silent = false, ...fetchOptions } = options

    const headers: Record<string, string> = {
        ...(fetchOptions.headers as Record<string, string>),
    }

    if (!(fetchOptions.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json"
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }

    try {
        const response = await fetch(url, { ...fetchOptions, headers })

        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            const friendlyMsg = formatApiErrorMessage(data) || `Request failed with status ${response.status}`

            if (!silent) {
                showApiError({
                    title: response.status >= 500 ? "Server Error" : "Request Failed",
                    message: friendlyMsg,
                    code: response.status,
                    onRetry: () => apiFetch(url, options),
                })
            }

            const error = new Error(friendlyMsg) as any
            error.status = response.status
            error.data = data
            throw error
        }

        return response.json()
    } catch (networkError: any) {
        if (!silent && !networkError.status) {
            const friendlyMsg = formatApiErrorMessage(networkError)
            showApiError({
                title: "Connection Error",
                message: friendlyMsg,
                code: "Network Error",
                onRetry: () => apiFetch(url, options),
            })
        }
        throw networkError
    }
}