import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithGoogleToken, getGoogleAuthMeta } from '../lib/auth'

interface GoogleSignInButtonProps {
    mode?: 'signin' | 'signup'
    userType?: string
    onSuccess?: () => void
    onError?: (error: string) => void
    className?: string
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void
                    renderButton: (parent: HTMLElement, options: any) => void
                    prompt: (notification?: any) => void
                    disableAutoSelect: () => void
                }
            }
        }
    }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    mode = 'signin',
    userType = 'CUSTOMER',
    onSuccess,
    onError,
    className = '',
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const [configError, setConfigError] = useState<string | null>(null)
    const [showHelpModal, setShowHelpModal] = useState(false)
    const navigate = useNavigate()

    const buttonText = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'

    // Attempt to load Google Identity Services SDK
    useEffect(() => {
        const existingScript = document.getElementById('google-jssdk')
        if (!existingScript) {
            const script = document.createElement('script')
            script.id = 'google-jssdk'
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.defer = true
            document.head.appendChild(script)
        }
    }, [])

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setConfigError(null)

        try {
            // 1. Determine redirect URI for current environment
            const redirectUri = `${window.location.origin}/auth/callback`

            // 2. Fetch Google Auth URL and Client ID from backend
            let authMeta: { url: string; client_id?: string } | null = null
            try {
                authMeta = await getGoogleAuthMeta(redirectUri)
            } catch (err: any) {
                console.warn('Could not fetch Google auth meta from backend:', err)
            }

            const clientId =
                import.meta.env.VITE_GOOGLE_CLIENT_ID ||
                authMeta?.client_id ||
                ''

            const isPlaceholder =
                !clientId ||
                clientId.includes('your-google-client-id') ||
                clientId.includes('example.com')

            // If GIS is loaded and a real client ID is configured, try One-Tap / ID Token flow
            if (!isPlaceholder && window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: async (response: { credential?: string }) => {
                        if (response.credential) {
                            try {
                                await loginWithGoogleToken(response.credential, userType)
                                if (onSuccess) onSuccess()
                                else navigate('/ventures')
                            } catch (err: any) {
                                const msg = err.message || 'Google verification failed.'
                                setConfigError(msg)
                                if (onError) onError(msg)
                            }
                        }
                    },
                    auto_select: false,
                    cancel_on_tap_outside: true,
                })

                // Trigger GIS prompt
                window.google.accounts.id.prompt((notification: any) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // If prompt was skipped or blocked by browser, redirect to standard OAuth URL
                        if (authMeta?.url) {
                            window.location.href = authMeta.url
                        }
                    }
                })
                setIsLoading(false)
                return
            }

            // If placeholder or no GIS, check if auth URL is available
            if (authMeta?.url && !isPlaceholder) {
                // Redirect user to Google OAuth consent screen
                window.location.href = authMeta.url
                return
            }

            // If still placeholder, inform the user with friendly setup guidance
            setIsLoading(false)
            setShowHelpModal(true)
        } catch (error: any) {
            console.error('Google Auth Error:', error)
            const msg = error.message || 'Failed to initialize Google Sign In.'
            setConfigError(msg)
            if (onError) onError(msg)
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className={`google-auth-button-wrapper ${className}`} style={{ width: '100%' }}>
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="google-sign-in-btn"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '0.85rem 1.25rem',
                        backgroundColor: '#ffffff',
                        color: '#1f2937',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        opacity: isLoading ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                        e.currentTarget.style.borderColor = '#d1d5db'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                >
                    {isLoading ? (
                        <span
                            style={{
                                width: '18px',
                                height: '18px',
                                border: '2px solid #cbd5e1',
                                borderTopColor: '#2563eb',
                                borderRadius: '50%',
                                display: 'inline-block',
                                animation: 'spin 0.8s linear infinite',
                            }}
                        />
                    ) : (
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            style={{ display: 'block', flexShrink: 0 }}
                        >
                            <path
                                fill="#4285F4"
                                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                        </svg>
                    )}
                    <span>{isLoading ? 'Connecting to Google...' : buttonText}</span>
                </button>

                {configError && (
                    <div
                        style={{
                            marginTop: '0.5rem',
                            fontSize: '0.8rem',
                            color: '#dc2626',
                            textAlign: 'center',
                        }}
                    >
                        {configError}
                    </div>
                )}
            </div>

            {/* Guidance modal for Google credentials setup */}
            {showHelpModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                    onClick={() => setShowHelpModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            maxWidth: '520px',
                            width: '100%',
                            padding: '2rem',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            color: '#1e293b',
                            position: 'relative',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: '#eff6ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#2563eb',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                }}
                            >
                                G
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                                    Google OAuth Setup
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                    Google Sign-In is enabled in code and awaits your Google Client ID
                                </p>
                            </div>
                        </div>

                        <div
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '1rem',
                                marginBottom: '1.25rem',
                                fontSize: '0.85rem',
                                lineHeight: '1.5',
                                color: '#334155',
                            }}
                        >
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Quick Setup Instructions:</p>
                            <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                <li>
                                    Create OAuth Client ID in{' '}
                                    <a
                                        href="https://console.cloud.google.com/apis/credentials"
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: '#2563eb', textDecoration: 'underline' }}
                                    >
                                        Google Cloud Console
                                    </a>
                                </li>
                                <li>Add Authorized Origin: <code>{window.location.origin}</code></li>
                                <li>Add Authorized Redirect URI: <code>{window.location.origin}/auth/callback</code></li>
                                <li>
                                    Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>realstate_frontend/.env</code> and{' '}
                                    <code>GOOGLE_OAUTH_CLIENT_ID</code> in <code>realstate_backend/.env</code>
                                </li>
                            </ol>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setShowHelpModal(false)}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default GoogleSignInButton
