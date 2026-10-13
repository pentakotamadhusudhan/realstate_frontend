import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm, type RegisterPayload } from '../components/RegistrationForms';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { ENDPOINTS } from '../lib/api';
import { saveSession, type AuthApiResponse } from '../lib/auth';

export const RegisterPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const [successData, setSuccessData] = useState<AuthApiResponse | null>(null);
    const navigate = useNavigate();

    const handleRegisterSubmit = async (payload: RegisterPayload) => {
        setIsSubmitting(true);
        setApiError('');
        setSuccessData(null);

        try {
            const response = await fetch(ENDPOINTS.register, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || JSON.stringify(data) || 'Something went wrong during registration.');
            }

            const verifiedData = data as AuthApiResponse;
            setSuccessData(verifiedData);
            saveSession(verifiedData.user, verifiedData.tokens);

            navigate('/ventures');

        } catch (error: any) {
            console.error('Registration API Error:', error);
            setApiError(error.message || 'Network connectivity issues. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="estate-login-split-page">
            <div className="showcase-side">
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
                {apiError && <div className="toast-error-banner">{apiError}</div>}

                {successData ? (
                    <div className="success-confirmation-card">
                        <h3>Account Configured!</h3>
                        <p>Welcome, <strong>{successData.user.full_name}</strong>.</p>
                        <span className="status-pill">Status: Active</span>
                        <p className="subtext">Tokens injected seamlessly. Directing you to ventures...</p>
                    </div>
                ) : (
                    <>
                        <RegisterForm loading={isSubmitting} onSubmit={handleRegisterSubmit} />

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
                                mode="signup"
                                onSuccess={() => navigate('/ventures')}
                                onError={(err) => setApiError(err)}
                            />
                        </div>

                        <div className="auth-mode-toggle" style={{ marginTop: '1.5rem' }}>
                            <p className="form-footer" style={{ marginTop: '0' }}>
                                Already have an account?{' '}
                                <a href="/login" className="forgot-link">Sign in here</a>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;