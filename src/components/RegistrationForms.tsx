import React, { useState } from 'react';

// Explicit interfaces matching your API payload structure
export interface RegisterPayload {
    full_name: string;
    email: string;
    mobile_number: string;
    password: string;
    confirm_password: string;
}

interface RegisterFormProps {
    loading: boolean;
    onSubmit: (payload: RegisterPayload) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ loading, onSubmit }) => {
    const [formData, setFormData] = useState<RegisterPayload>({
        full_name: '',
        email: '',
        mobile_number: '',
        password: '',
        confirm_password: '',
    });
    const [localError, setLocalError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError('');

        // Quick client-side verification check
        if (formData.password !== formData.confirm_password) {
            setLocalError('Passwords do not match.');
            return;
        }

        onSubmit(formData);
    };

    return (
        <div className="login-form-container">
            {/* Brand Header */}
            <div className="brand-meta">
                <span className="brand-logo-icon">✦</span>
                <span className="brand-name">HEARTH & KEY</span>
            </div>

            <div className="form-header">
                <h1>Create Account</h1>
                <p>Discover properties, save listings, and track your home journey.</p>
            </div>

            {localError && <div className="toast-error-banner">{localError}</div>}

            <form onSubmit={handleSubmit} className="modern-form">
                <div className="input-group">
                    <label htmlFor="full_name">Full Name</label>
                    <input
                        id="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="user@example.com"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="mobile_number">Mobile Number</label>
                    <input
                        id="mobile_number"
                        type="tel"
                        value={formData.mobile_number}
                        onChange={handleChange}
                        placeholder="+919988776655"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="confirm_password">Confirm Password</label>
                    <input
                        id="confirm_password"
                        type="password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                    />
                </div>

                <button type="submit" className="prime-submit-btn" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
            </form>
        </div>
    );
};
