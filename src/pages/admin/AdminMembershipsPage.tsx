import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import AdminNavbar from '../../components/admin/AdminNavbar';
import ApiErrorAlert from '../../components/alter_box/ApiErrorAlert';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import {
    Sparkles,
    Shield,
    CheckCircle2,
    PlusCircle,
    Trash2,
    Calendar,
    IndianRupee,
    Layers,
    MapPin,
    AlertCircle,
    X,
    Users,
    Check,
    RefreshCw,
    UserCheck,
    CreditCard
} from 'lucide-react';

export interface MembershipPlan {
    id: string;
    name: string;
    plan_type: 'AGENT' | 'ADMIN';
    description: string;
    price: string | number;
    duration_days: number;
    max_ventures: number;
    max_plots: number;
    features: string[];
    is_active: boolean;
    created_by_name?: string;
    created_at?: string;
}

export interface UserMembershipRecord {
    id: string;
    user: string;
    user_name: string;
    user_email: string;
    user_type: string;
    plan: string;
    plan_name: string;
    plan_type: 'AGENT' | 'ADMIN';
    status: string;
    start_date: string;
    end_date: string;
    is_valid: boolean;
}

export default function AdminMembershipsPage() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [subscriptions, setSubscriptions] = useState<UserMembershipRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'AGENT' | 'ADMIN' | 'SUBSCRIPTIONS'>('AGENT');
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Create Plan Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [featureInput, setFeatureInput] = useState('');
    const [planForm, setPlanForm] = useState<{
        name: string;
        plan_type: 'AGENT' | 'ADMIN';
        description: string;
        price: number;
        duration_days: number;
        max_ventures: number;
        max_plots: number;
        features: string[];
        is_active: boolean;
    }>({
        name: '',
        plan_type: 'AGENT',
        description: '',
        price: 999,
        duration_days: 30,
        max_ventures: 5,
        max_plots: 50,
        features: ['Upload plots & ventures', 'Customer Call Query reception', 'Verified Agent badge'],
        is_active: true,
    });

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    // Load plans & subscriptions
    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [plansRes, subsRes] = await Promise.allSettled([
                apiFetch(ENDPOINTS.membershipPlans()),
                apiFetch(ENDPOINTS.userMemberships)
            ]);

            if (plansRes.status === 'fulfilled') {
                const list = Array.isArray(plansRes.value) ? plansRes.value : plansRes.value?.results || [];
                setPlans(list);
            }

            if (subsRes.status === 'fulfilled') {
                const subsList = Array.isArray(subsRes.value) ? subsRes.value : subsRes.value?.results || [];
                setSubscriptions(subsList);
            }
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to load memberships data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 4000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    const agentPlans = useMemo(() => plans.filter(p => p.plan_type === 'AGENT'), [plans]);
    const adminPlans = useMemo(() => plans.filter(p => p.plan_type === 'ADMIN'), [plans]);

    // Handle Create Plan
    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const newPlan = await apiFetch(ENDPOINTS.membershipPlans(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planForm),
            });

            setPlans(prev => [...prev, newPlan]);
            setShowCreateModal(false);
            setToastMessage({
                type: 'success',
                text: `Plan "${newPlan.name}" created successfully!`,
            });
            // Reset form
            setPlanForm({
                name: '',
                plan_type: 'AGENT',
                description: '',
                price: 999,
                duration_days: 30,
                max_ventures: 5,
                max_plots: 50,
                features: ['Upload plots & ventures', 'Customer Call Query reception'],
                is_active: true,
            });
        } catch (err: any) {
            setToastMessage({
                type: 'error',
                text: formatApiErrorMessage(err) || 'Failed to create plan.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle Plan Active
    const handleTogglePlan = async (plan: MembershipPlan) => {
        try {
            const updated = await apiFetch(ENDPOINTS.membershipPlanDetail(plan.id), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !plan.is_active }),
            });

            setPlans(prev => prev.map(p => (p.id === plan.id ? { ...p, is_active: updated.is_active } : p)));
            setToastMessage({
                type: 'success',
                text: `Plan status updated.`,
            });
        } catch (err: any) {
            setToastMessage({
                type: 'error',
                text: formatApiErrorMessage(err) || 'Failed to update plan status.',
            });
        }
    };

    // Add feature tag
    const handleAddFeature = () => {
        if (!featureInput.trim()) return;
        setPlanForm(prev => ({
            ...prev,
            features: [...prev.features, featureInput.trim()],
        }));
        setFeatureInput('');
    };

    const handleRemoveFeature = (index: number) => {
        setPlanForm(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
            <AdminNavbar />

            {/* Notification Toast */}
            {toastMessage && (
                <div
                    className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold transition-all animate-bounce ${toastMessage.type === 'success'
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                        : 'bg-rose-950 border border-rose-500 text-rose-200'
                        }`}
                >
                    {toastMessage.type === 'success' ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    ) : (
                        <AlertCircle size={18} className="text-rose-400 shrink-0" />
                    )}
                    <span>{toastMessage.text}</span>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        className="ml-2 text-gray-400 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                Memberships & Premiums
                            </h1>
                            <span className="bg-purple-950/80 text-purple-400 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-800/80">
                                Super Admin Engine
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                            Configure agent membership paywalls and exclusive admin premium packages.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fetchData}
                            disabled={loading}
                            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
                        >
                            <PlusCircle size={16} />
                            Create Plan
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="max-w-2xl">
                        <ApiErrorAlert message={error} onRetry={fetchData} onClose={() => setError('')} />
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('AGENT')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === 'AGENT'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                            }`}
                    >
                        <Shield size={16} />
                        Agent Memberships ({agentPlans.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('ADMIN')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === 'ADMIN'
                            ? 'bg-amber-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                            }`}
                    >
                        <Sparkles size={16} />
                        Admin Premiums ({adminPlans.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('SUBSCRIPTIONS')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === 'SUBSCRIPTIONS'
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                            }`}
                    >
                        <Users size={16} />
                        Active Subscriptions ({subscriptions.length})
                    </button>
                </div>

                {/* Plans List View */}
                {activeTab !== 'SUBSCRIPTIONS' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(activeTab === 'AGENT' ? agentPlans : adminPlans).map(plan => (
                            <div
                                key={plan.id}
                                className={`bg-gray-900 border rounded-2xl p-6 flex flex-col justify-between transition-all relative overflow-hidden ${plan.is_active
                                    ? 'border-gray-800 hover:border-gray-700 shadow-xl'
                                    : 'border-gray-800/50 opacity-60'
                                    }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${plan.plan_type === 'AGENT'
                                                ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                                                : 'bg-amber-950/80 text-amber-300 border-amber-800'
                                                }`}
                                        >
                                            {plan.plan_type === 'AGENT' ? 'Agent Membership' : 'Admin Premium Only'}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleTogglePlan(plan)}
                                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${plan.is_active
                                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                                                }`}
                                        >
                                            {plan.is_active ? 'Active' : 'Disabled'}
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                            {plan.description || 'Access to listing and upload capabilities.'}
                                        </p>
                                    </div>

                                    <div className="flex items-baseline gap-1 py-2 border-y border-gray-800/80">
                                        <span className="text-2xl sm:text-3xl font-extrabold text-white">
                                            ₹{Number(plan.price).toLocaleString()}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            / {plan.duration_days} days
                                        </span>
                                    </div>

                                    {/* Limits */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                                            <span className="text-gray-500 block">Max Ventures</span>
                                            <span className="font-bold text-gray-200">
                                                {plan.max_ventures === 0 ? 'Unlimited' : plan.max_ventures}
                                            </span>
                                        </div>
                                        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                                            <span className="text-gray-500 block">Max Plots</span>
                                            <span className="font-bold text-gray-200">
                                                {plan.max_plots === 0 ? 'Unlimited' : plan.max_plots}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Features Checklist */}
                                    <div className="space-y-2 pt-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                                            Included Privileges
                                        </span>
                                        {Array.isArray(plan.features) && plan.features.length > 0 ? (
                                            plan.features.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                                                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                                                    <span>{f}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-500">Standard privileges</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-800 text-[11px] text-gray-500 flex items-center justify-between">
                                    <span>Plan ID: #{plan.id.slice(0, 8)}</span>
                                    <span>Created: {new Date(plan.created_at || '').toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Active Subscriptions Table */
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                        {subscriptions.length === 0 ? (
                            <div className="py-20 text-center text-gray-400">
                                <Users size={36} className="mx-auto text-gray-600 mb-3" />
                                <h3 className="text-base font-bold text-white">No Active Subscriptions Yet</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    When agents or admins subscribe to membership plans, they will appear here.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-400 bg-gray-950/40">
                                        <th className="py-4 px-6 font-bold">Subscriber</th>
                                        <th className="py-4 px-6 font-bold">Role</th>
                                        <th className="py-4 px-6 font-bold">Plan</th>
                                        <th className="py-4 px-6 font-bold">Status</th>
                                        <th className="py-4 px-6 font-bold">Validity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/80">
                                    {subscriptions.map(sub => (
                                        <tr key={sub.id} className="hover:bg-gray-800/30">
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-white">{sub.user_name || sub.user_email}</div>
                                                <div className="text-xs text-gray-400">{sub.user_email}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-xs uppercase font-bold text-blue-400">
                                                    {sub.user_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-gray-200">{sub.plan_name}</div>
                                                <span className="text-[10px] uppercase font-bold text-gray-500">
                                                    {sub.plan_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${sub.is_valid
                                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                                                        }`}
                                                >
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-gray-400">
                                                {new Date(sub.start_date).toLocaleDateString()} →{' '}
                                                {new Date(sub.end_date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </main>

            {/* Create Membership Plan Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                                ✦
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Create Membership Plan</h3>
                                <p className="text-xs text-gray-400">
                                    Configure subscription rules and upload limits for agents or admins.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleCreatePlan} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                    Plan Type *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPlanForm(p => ({ ...p, plan_type: 'AGENT' }))}
                                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${planForm.plan_type === 'AGENT'
                                            ? 'bg-blue-950/60 border-blue-500 text-white'
                                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                                            }`}
                                    >
                                        <div className="font-bold text-sm">Agent Membership</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5">
                                            Required for agents to upload ventures/plots.
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPlanForm(p => ({ ...p, plan_type: 'ADMIN' }))}
                                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${planForm.plan_type === 'ADMIN'
                                            ? 'bg-amber-950/60 border-amber-500 text-white'
                                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                                            }`}
                                    >
                                        <div className="font-bold text-sm">Admin Premium</div>
                                        <div className="text-[11px] text-amber-400/80 mt-0.5">
                                            Applicable only for Admin accounts.
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                    Plan Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={planForm.name}
                                    onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                                    placeholder="e.g. Agent Pro Tier or Admin Gold Premium"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                        Price (₹ INR) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={planForm.price}
                                        onChange={e => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                        Duration (Days) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={planForm.duration_days}
                                        onChange={e => setPlanForm({ ...planForm, duration_days: parseInt(e.target.value, 10) || 30 })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                        Max Ventures (0 = Unlimited)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={planForm.max_ventures}
                                        onChange={e => setPlanForm({ ...planForm, max_ventures: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                        Max Plots (0 = Unlimited)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={planForm.max_plots}
                                        onChange={e => setPlanForm({ ...planForm, max_plots: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={planForm.description}
                                    onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                                    placeholder="Brief summary of benefits..."
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Features list */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                    Features / Perks
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={featureInput}
                                        onChange={e => setFeatureInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddFeature();
                                            }
                                        }}
                                        placeholder="Add a perk (press Enter)..."
                                        className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddFeature}
                                        className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                    {planForm.features.map((f, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-lg text-xs text-gray-200"
                                        >
                                            {f}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFeature(i)}
                                                className="text-gray-400 hover:text-rose-400"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting ? 'Creating Plan...' : 'Save & Publish Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
