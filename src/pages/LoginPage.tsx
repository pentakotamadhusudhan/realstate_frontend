import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import hook
import { LoginForm } from '../components/LoginForms';

interface AuthApiResponse {
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

export const LoginPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // ✅ FIX: Hook declared at the top level of the component body
    const navigate = useNavigate();

    const handleAuthSubmit = async (credentials: { email: string; password: string }) => {
        setIsSubmitting(true);
        setErrorMessage('');

        const endpoint = 'http://192.168.0.5:8000/api/auth/login/';

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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.detail || JSON.stringify(data) || 'Authentication failed.');
            }

            const verifiedData = data as AuthApiResponse;

            localStorage.setItem('access_token', verifiedData.tokens.access);
            localStorage.setItem('refresh_token', verifiedData.tokens.refresh);
            localStorage.setItem('user_profile', JSON.stringify(verifiedData.user));

            alert(`Welcome back, ${verifiedData.user.full_name}! Let’s find your next home.`);

            // ✅ Using the instantiated navigate function here is now safe
            navigate('/dashboard');

        } catch (error: any) {
            console.error('Auth API Error:', error);
            setErrorMessage(error.message || 'Network connectivity issues. Please try again.');
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
                {errorMessage && <div className="toast-error-banner">{errorMessage}</div>}

                <LoginForm
                    loading={isSubmitting}
                    isSignup={false}
                    onSubmit={handleAuthSubmit}
                />

                <div className="auth-mode-toggle">
                    <p className="form-footer">
                        New to Hearth & Key?{' '}
                        <a href="/register" className="forgot-link">Create an account</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
