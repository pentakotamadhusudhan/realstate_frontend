import React from "react";
import { useNavigate } from "react-router-dom";
import "../../UnverifiedSeller.css";
import { getUserProfile, logout } from "../../lib/auth";
import { apiFetch, ENDPOINTS } from "../../lib/api";
import { formatApiErrorMessage } from "../../utils/formatApiError";

const steps = [
    {
        number: "1",
        title: "Personal Details & Identity Proof",
        description: "Verify your identity and real estate accreditation documents.",
    },
    {
        number: "2",
        title: "Nominal Accreditation Fee (₹999)",
        description: "Official agent onboarding fee to accredit your profile on platform.",
    },
    {
        number: "3",
        title: "Super Admin Review",
        description: "Our compliance team validates your credentials.",
    },
    {
        number: "4",
        title: "Approval & Listing Activation",
        description: "Start listing ventures and unlocking prospective buyer leads.",
    },
];

const benefits = [
    { icon: "✓", title: "Build Trust", text: "Verified Accredited Agent badge" },
    { icon: "◎", title: "Lead Access", text: "Unlock buyer call queries with lead packs" },
    { icon: "♙", title: "Venture Uploads", text: "Showcase plots and township projects" },
    { icon: "★", title: "Priority Support", text: "Dedicated platform mediator support" },
];

export default function Unverifiedagent() {
    const navigate = useNavigate();
    const user = getUserProfile();
    const [feeStatus, setFeeStatus] = React.useState<boolean>(Boolean(user?.is_onboarding_fee_paid));
    const [paying, setPaying] = React.useState(false);
    const [feeMsg, setFeeMsg] = React.useState("");

    React.useEffect(() => {
        apiFetch(ENDPOINTS.agentOnboardingFee, { silent: true })
            .then((data) => {
                if (data && typeof data.is_onboarding_fee_paid === "boolean") {
                    setFeeStatus(data.is_onboarding_fee_paid);
                }
            })
            .catch(() => {});
    }, []);

    const handlePayOnboardingFee = async () => {
        setPaying(true);
        setFeeMsg("");
        try {
            await apiFetch(ENDPOINTS.agentOnboardingFee, {
                method: "POST",
                body: JSON.stringify({ transaction_reference: "TXN-AG-" + Date.now() }),
            });
            setFeeStatus(true);
            setFeeMsg("Onboarding accreditation fee completed successfully! Agent accredited.");
        } catch (err: any) {
            setFeeMsg(formatApiErrorMessage(err) || "Failed to process onboarding fee.");
        } finally {
            setPaying(false);
        }
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                        {feeMsg && (
                            <div style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px', background: feeStatus ? '#ecfdf5' : '#fef2f2', color: feeStatus ? '#065f46' : '#991b1b', border: `1px solid ${feeStatus ? '#a7f3d0' : '#fecaca'}` }}>
                                {feeMsg}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                className="verify-button"
                                onClick={() => navigate('/agent-register')}
                                style={{ flex: 1 }}
                            >
                                ⛨ Submit Verification Documents
                            </button>

                            {!feeStatus ? (
                                <button
                                    className="verify-button"
                                    onClick={handlePayOnboardingFee}
                                    disabled={paying}
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    }}
                                >
                                    {paying ? "Processing Payment…" : "💳 Pay Onboarding Fee (₹999)"}
                                </button>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', background: '#ecfdf5', color: '#059669', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', border: '1px solid #10b981' }}>
                                    ✓ Onboarding Fee Paid (₹999)
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="review-note">
                        Your account will be reviewed by Super Admin after you submit the required details and accreditation fee.
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
