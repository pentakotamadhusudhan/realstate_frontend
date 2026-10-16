import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForms';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { ENDPOINTS } from '../lib/api';
import { saveSession, type AuthApiResponse } from '../lib/auth';
import ApiErrorAlert from '../components/alter_box/ApiErrorAlert';
import { formatApiErrorMessage } from '../utils/formatApiError';
import loginBackground from "../assets/login_background.jpg";

export const LoginPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const lastCredentialsRef = useRef<{ email: string; password: string } | null>(null);

    const navigate = useNavigate();

    const handleAuthSubmit = async (credentials: { email: string; password: string }) => {
        lastCredentialsRef.current = credentials;
        setIsSubmitting(true);
        setErrorMessage('');
        const endpoint = ENDPOINTS.login;

        const loginPayload = {
            identifier: credentials.email,
            password: credentials.password,
            user_type: 'CUSTOMER'
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginPayload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMsg = formatApiErrorMessage(data) || 'Authentication failed.';
                throw new Error(errorMsg);
            }

            const verifiedData = data as AuthApiResponse;
            saveSession(verifiedData.user, verifiedData.tokens);

            navigate('/ventures');

        } catch (error: any) {
            console.error('Auth API Error:', error);
            const msg = formatApiErrorMessage(error);
            setErrorMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="estate-login-split-page">
            <div className="showcase-side" style={{ backgroundImage: `url(${loginBackground})` }}>
                <div className="showcase-overlay" />
                <div className="showcase-content">
                    <div className="trending-badge">✦ Over 10,000+ Premium Properties Available</div>
                    <h2>Find a Place Where Your Story Begins.</h2>
                    <p>Gain premium access to off-market listings, virtual home tours, and real-time market updates perfectly tailored to your budget.</p>

                    <div className="mini-stats">
                        <div>
                            <span className="stat-num">24 Hours</span>
                            <span className="stat-label">Avg. Agent Response</span>
                        </div>
                        <div>
                            <span className="stat-num">98%</span>
                            <span className="stat-label">Customer Satisfaction</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="form-side">
                {errorMessage && (
                    <div style={{ width: '100%', maxWidth: '420px', marginBottom: '1.25rem' }}>
                        <ApiErrorAlert
                            message={errorMessage}
                            onRetry={lastCredentialsRef.current ? () => handleAuthSubmit(lastCredentialsRef.current!) : undefined}
                            onClose={() => setErrorMessage('')}
                        />
                    </div>
                )}

                <LoginForm
                    loading={isSubmitting}
                    isSignup={false}
                    onSubmit={handleAuthSubmit}
                />

                <div style={{ width: '100%', maxWidth: '420px', marginTop: '1.25rem' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '1.25rem 0',
                            color: '#94a3b8',
                        }}
                    >
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                        <span
                            style={{
                                padding: '0 0.75rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: '#94a3b8',
                            }}
                        >
                            Or continue with
                        </span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                    </div>

                    <GoogleSignInButton
                        mode="signin"
                        onSuccess={() => navigate('/ventures')}
                        onError={(err) => setErrorMessage(formatApiErrorMessage(err))}
                    />
                </div>

                <div className="auth-mode-toggle" style={{ marginTop: '1.5rem' }}>
                    <p className="form-footer" style={{ marginTop: '0' }}>
                        New to Hearth & Key?{' '}
                        <a href="/register" className="forgot-link">Create an account</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
