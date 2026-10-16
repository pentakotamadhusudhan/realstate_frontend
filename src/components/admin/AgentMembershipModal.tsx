import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import { getUserProfile, saveSession } from '../../lib/auth';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import {
    Shield,
    CheckCircle2,
    Sparkles,
    RefreshCw,
    X,
    Lock,
    ArrowRight
} from 'lucide-react';

interface AgentMembershipModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
}

export interface AgentPlan {
    id: string;
    name: string;
    description: string;
    price: number | string;
    duration_days: number;
    max_ventures: number;
    max_plots: number;
    features: string[];
    is_active: boolean;
}

export default function AgentMembershipModal({
    open,
    onClose,
    onSuccess,
    title = 'Agent Membership Required',
    description = 'An active Agent Membership is required to create ventures and upload plot maps. Choose a plan to continue.',
}: AgentMembershipModalProps) {
    const [plans, setPlans] = useState<AgentPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribingId, setSubscribingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const user = getUserProfile();

    useEffect(() => {
        if (!open) return;
        async function fetchAgentPlans() {
            setLoading(true);
            setError('');
            try {
                const data = await apiFetch(ENDPOINTS.membershipPlans('plan_type=AGENT&is_active=true'));
                const list = Array.isArray(data) ? data : data?.results || [];
                setPlans(list);
            } catch (err: any) {
                setError(formatApiErrorMessage(err) || 'Failed to load membership plans.');
            } finally {
                setLoading(false);
            }
        }
        fetchAgentPlans();
    }, [open]);

    if (!open) return null;

    const handleSubscribe = async (plan: AgentPlan) => {
        setSubscribingId(plan.id);
        setError('');
        try {
            const subscription = await apiFetch(ENDPOINTS.userMemberships, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: plan.id }),
            });

            // Update user profile in local storage to reflect active membership
            if (user) {
                const updatedUser = {
                    ...user,
                    has_active_membership: true,
                    active_membership: {
                        id: subscription.id,
                        plan_id: plan.id,
                        plan_name: plan.name,
                        plan_type: 'AGENT' as const,
                        status: 'ACTIVE',
                        start_date: subscription.start_date || new Date().toISOString(),
                        end_date: subscription.end_date,
                        is_valid: true,
                    },
                };
                localStorage.setItem('user_profile', JSON.stringify(updatedUser));
            }

            onSuccess();
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to activate membership.');
        } finally {
            setSubscribingId(null);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition cursor-pointer"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xl shrink-0">
                        <Lock size={22} />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                            Membership Paywall
                        </span>
                        <h3 className="text-xl font-bold text-white mt-1">{title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-16 text-center text-gray-400">
                        <RefreshCw size={28} className="animate-spin text-blue-500 mx-auto mb-3" />
                        <p className="text-sm font-semibold">Loading Membership Plans...</p>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 bg-gray-950 rounded-2xl border border-gray-800 p-6">
                        <Shield size={36} className="mx-auto text-gray-600 mb-3" />
                        <h4 className="text-base font-bold text-white">No Membership Plans Configured</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                            Please contact the Super Admin to configure Agent Membership plans for your account.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {plans.map(plan => {
                            const isSubscribing = subscribingId === plan.id;

                            return (
                                <div
                                    key={plan.id}
                                    className="bg-gray-950 border border-gray-800 hover:border-blue-500/60 rounded-2xl p-5 flex flex-col justify-between transition-all group relative"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">
                                                {plan.name}
                                            </h4>
                                            <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800">
                                                {plan.duration_days} Days
                                            </span>
                                        </div>

                                        <div className="flex items-baseline gap-1 py-1">
                                            <span className="text-2xl font-extrabold text-white">
                                                ₹{Number(plan.price).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-400">/ period</span>
                                        </div>

                                        <p className="text-xs text-gray-400 line-clamp-2">
                                            {plan.description || 'Full venture & plot management privileges.'}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                            <div className="bg-gray-900 p-2 rounded-lg border border-gray-800">
                                                <span className="text-gray-500 block">Ventures</span>
                                                <span className="font-bold text-gray-200">
                                                    {plan.max_ventures === 0 ? 'Unlimited' : plan.max_ventures}
                                                </span>
                                            </div>
                                            <div className="bg-gray-900 p-2 rounded-lg border border-gray-800">
                                                <span className="text-gray-500 block">Plots</span>
                                                <span className="font-bold text-gray-200">
                                                    {plan.max_plots === 0 ? 'Unlimited' : plan.max_plots}
                                                </span>
                                            </div>
                                        </div>

                                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t border-gray-900">
                                                {plan.features.slice(0, 3).map((f, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                                                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                                        <span className="truncate">{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        disabled={Boolean(subscribingId)}
                                        onClick={() => handleSubscribe(plan)}
                                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {isSubscribing ? (
                                            <>
                                                <RefreshCw size={13} className="animate-spin" />
                                                Activating...
                                            </>
                                        ) : (
                                            <>
                                                Subscribe & Unlock
                                                <ArrowRight size={13} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
