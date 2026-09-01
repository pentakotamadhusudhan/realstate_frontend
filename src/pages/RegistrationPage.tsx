import React, { useState } from 'react';
import { RegisterForm, type RegisterPayload } from '../components/registrationForms';

// Interfaces modeled strictly against your API response layout
interface ApiResponse {
    user: {
        id: string;
        full_name: string;
        email: string;
        mobile_number: string;
        user_type: string;
        auth_provider: string;
        is_verified: boolean;
        created_at: string;
    };
    tokens: {
        refresh: string;
        access: string;
    };
}

export const RegisterPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const [successData, setSuccessData] = useState<ApiResponse | null>(null);

    const handleRegisterSubmit = async (payload: RegisterPayload) => {
        setIsSubmitting(true);
        setApiError('');
        setSuccessData(null);

        try {
            const response = await fetch('http://192.168.0.5:8000/api/auth/register/customer/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                // Fallback checks for structured Django REST framework validation errors
                throw new Error(data.message || JSON.stringify(data) || 'Something went wrong during registration.');
            }

            const verifiedData = data as ApiResponse;
            setSuccessData(verifiedData);

            // Store session metadata inside localStorage
            localStorage.setItem('access_token', verifiedData.tokens.access);
            localStorage.setItem('refresh_token', verifiedData.tokens.refresh);
            localStorage.setItem('user_profile', JSON.stringify(verifiedData.user));

            alert(`Registration Successful! Welcome ${verifiedData.user.full_name}`);

            // Real application redirection path would execute here:
            // navigate('/dashboard');

        } catch (error: any) {
            console.error('Registration API Error:', error);
            setApiError(error.message || 'Network connectivity issues. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="estate-login-split-page">
            {/* Visual Design Showcase Panel */}
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

            {/* Interactive API Action Form Panel */}
            <div className="form-side">
                {apiError && <div className="toast-error-banner">{apiError}</div>}

                {successData ? (
                    <div className="success-confirmation-card">
                        <h3>Account Configured!</h3>
                        <p>Welcome, <strong>{successData.user.full_name}</strong>.</p>
                        <span className="status-pill">Status: Active (Unverified)</span>
                        <p className="subtext">Tokens injected seamlessly. Directing you to dashboard...</p>
                    </div>
                ) : (
                    <>
                        <RegisterForm loading={isSubmitting} onSubmit={handleRegisterSubmit} />
                        <div className="auth-mode-toggle">
                            <p className="form-footer">
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
