import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginWithGoogleCode } from '../lib/auth'
import logo from '../assets/logomain.png'
import BoxLoader from '@/components/ui/box-loader'

export const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams()
    const [statusText, setStatusText] = useState('Authenticating with Google...')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
            setErrorMessage(`Google sign-in cancelled or failed: ${error}`)
            return
        }

        if (!code) {
            navigate('/login', { replace: true })
            return
        }

        const exchangeCode = async () => {
            try {
                setStatusText('Verifying credentials with server...')
                const redirectUri = `${window.location.origin}/auth/callback`
                await loginWithGoogleCode(code, redirectUri, 'CUSTOMER')
                setStatusText('Welcome! Redirecting to ventures...')
                setTimeout(() => {
                    navigate('/ventures', { replace: true })
                }, 600)
            } catch (err: any) {
                console.error('OAuth Callback Error:', err)
                setErrorMessage(err.message || 'Failed to complete Google authentication.')
            }
        }

        exchangeCode()
    }, [searchParams, navigate])

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a1628 0%, #0f2040 50%, #1e3a8a 100%)',
                color: '#ffffff',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                padding: '1.5rem',
            }}
        >
            <div
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    padding: '3rem 2.5rem',
                    maxWidth: '440px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* Brand Logo */}
                <div
                    style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                    }}
                >
                    <img
                        src={logo}
                        alt="PlotVista"
                        style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    />
                </div>

                {errorMessage ? (
                    <div>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto',
                                fontSize: '1.5rem',
                            }}
                        >
                            ✕
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Sign-In Failed
                        </h2>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            {errorMessage}
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            style={{
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0.75rem 1.5rem',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* 3D Box Loader */}
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0 2rem 0' }}>
                            <BoxLoader color="white" />
                        </div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            Connecting to PlotVista
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                            {statusText}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AuthCallback
