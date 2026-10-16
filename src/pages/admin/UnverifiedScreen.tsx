import React from "react";
import { useNavigate } from "react-router-dom";
import "../../UnverifiedSeller.css";
import { getUserProfile, logout } from "../../lib/auth";

const steps = [
    {
        number: "1",
        title: "Personal Details",
        description: "Verify your name, phone number and email address.",
    },
    {
        number: "2",
        title: "Identity Proof",
        description: "Upload a valid government-issued identity document.",
    },
    {
        number: "3",
        title: "Land Documents",
        description: "Submit land ownership documents for verification.",
    },
    {
        number: "4",
        title: "Review & Approval",
        description: "Our team reviews your details before approval.",
    },
];

const benefits = [
    { icon: "✓", title: "Build Trust", text: "Increase buyer confidence" },
    { icon: "◎", title: "Better Visibility", text: "Reach more buyers" },
    { icon: "♙", title: "Secure Listings", text: "Support safer transactions" },
    { icon: "★", title: "More Inquiries", text: "Connect with potential buyers" },
];

export default function Unverifiedagent() {
    const navigate = useNavigate();
    const user = getUserProfile();

    const startVerification = () => {
        // Direct to verification route or show guidance
        window.location.href = "/agent/verification";
    };

    return (
        <div className="agent-layout">
            <aside className="agent-sidebar">
                <div className="brand">
                    <span className="brand-icon">⌂</span>
                    <div>
                        <h2>RealEstate</h2>
                        <small>Find · Buy · Sell</small>
                    </div>
                </div>

                <nav className="agent-nav">
                    <a className="active" href="/agent/dashboard">⌂ Dashboard</a>
                    <a href="/agent/properties">▧ My Properties</a>
                    <a href="/agent/add-property">＋ Add Property</a>
                    <a href="/agent/messages">▢ Messages</a>
                    <a href="/agent/profile">♙ Profile</a>
                </nav>

                <button
                    type="button"
                    className="logout"
                    onClick={() => logout(navigate)}
                    style={{
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        width: '100%',
                    }}
                >
                    ↪ Logout
                </button>
            </aside>

            <main className="agent-main">
                <header className="agent-header">
                    <div>
                        <h2>Agent Dashboard</h2>
                        <p>Manage your land listings and track your sales.</p>
                    </div>

                    <div className="agent-user">
                        <div className="avatar">👤</div>
                        <div>
                            <strong>{user?.full_name || "Land Agent"}</strong>
                            <small>{user?.email || "Unverified Account"}</small>
                        </div>
                    </div>
                </header>

                <section className="verification-alert">
                    <div className="alert-icon">!</div>
                    <div className="alert-content">
                        <span className="status-pill">Verification pending</span>
                        <h1>Your Account Is Not Verified Yet</h1>
                        <p>
                            Complete agent verification to list your land and start
                            connecting with potential buyers.
                        </p>
                    </div>
                    <div className="alert-art" aria-hidden="true">🪪</div>
                </section>

                <section className="verification-card">
                    <h2>Complete Agent Verification</h2>
                    <p className="section-description">
                        Follow these four steps to verify your account.
                    </p>

                    <div className="verification-steps">
                        {steps.map((step) => (
                            <div className="verification-step" key={step.number}>
                                <div className="step-number">{step.number}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        className="verify-button"
                        onClick={startVerification}
                    >
                        ⛨ Start Verification
                    </button>

                    <p className="review-note">
                        Your account will be reviewed after you submit the required details.
                    </p>
                </section>

                <section className="benefits-card">
                    <h2>Why Is Verification Important?</h2>
                    <div className="benefits-grid">
                        {benefits.map((benefit) => (
                            <article className="benefit" key={benefit.title}>
                                <div className="benefit-icon">{benefit.icon}</div>
                                <h3>{benefit.title}</h3>
                                <p>{benefit.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <footer className="agent-footer">
                    Need help? Contact our{" "}
                    <a href="/support">support team</a>.
                </footer>
            </main>
        </div>
    );
}
