import React, { useState } from 'react';

interface LoginPayload {
    email: string;
    password: string;
}

interface LoginFormProps {
    loading: boolean;
    isSignup: boolean;
    onSubmit: (payload: LoginPayload) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ loading, isSignup, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email || !password) return;
        onSubmit({ email, password });
    };

    return (
        <div className="login-form-container">
            {/* Brand Header */}
            <div className="brand-meta">
                <span className="brand-logo-icon">✦</span>
                <span className="brand-name">HEARTH & KEY</span>
            </div>

            <div className="form-header">
                <h1>{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
                <p>
                    {isSignup
                        ? 'Discover your dream property and track your favorite listings.'
                        : 'Sign in to access your saved homes and personalized searches.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="modern-form">
                <div className="input-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="input-group">
                    <div className="label-wrapper">
                        <label htmlFor="password">Password</label>
                        {!isSignup && <a href="#forgot" className="forgot-link">Forgot?</a>}
                    </div>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        disabled={loading}
                        required
                    />
                </div>

                <button type="submit" className="prime-submit-btn" disabled={loading}>
                    {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
                </button>
            </form>
        </div>
    );
};
