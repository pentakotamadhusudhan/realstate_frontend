import React, { useState, useEffect } from 'react';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import type { AgentLeadWallet, LeadPackage } from '../../types/revenue';
import { formatApiErrorMessage } from '../../utils/formatApiError';
import {
    Wallet,
    DollarSign,
    Zap,
    Clock,
    X,
    CheckCircle2,
    ShieldCheck,
    CreditCard,
    ArrowUpRight,
    Lock,
} from 'lucide-react';

interface Props {
    onClose: () => void;
    onWalletUpdated?: (newBalance: number) => void;
}

export default function AgentLeadWalletModal({ onClose, onWalletUpdated }: Props) {
    const [wallet, setWallet] = useState<AgentLeadWallet | null>(null);
    const [packages, setPackages] = useState<LeadPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [walletData, packagesData] = await Promise.all([
                apiFetch(ENDPOINTS.agentLeadWallet),
                apiFetch(ENDPOINTS.agentLeadPackages()),
            ]);
            setWallet(walletData);
            setPackages(Array.isArray(packagesData) ? packagesData : packagesData?.results || []);
            if (onWalletUpdated && walletData) {
                onWalletUpdated(walletData.credits_balance);
            }
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Failed to load lead wallet.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePurchase = async (pkg: LeadPackage) => {
        setPurchasingId(pkg.id);
        setError('');
        setSuccessMsg('');
        try {
            const res = await apiFetch(ENDPOINTS.agentPurchaseLeadPackage(pkg.id), {
                method: 'POST',
            });
            setSuccessMsg(`Successfully purchased ${pkg.name}! ${pkg.credits} credits added.`);
            if (res.wallet) {
                setWallet(res.wallet);
                if (onWalletUpdated) onWalletUpdated(res.wallet.credits_balance);
            } else {
                await fetchData();
            }
        } catch (err: any) {
            setError(formatApiErrorMessage(err) || 'Purchase failed.');
        } finally {
            setPurchasingId(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                Agent Lead Wallet & Unlock Credits
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Pay-per-lead packages to unlock prospective buyer phone numbers and emails.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                    >
                        <X size={16} />
                    </button>
                </div>

                {error && (
                    <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="p-3 mb-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 size={14} />
                        {successMsg}
                    </div>
                )}

                {loading ? (
                    <div className="py-16 text-center text-xs text-gray-500">Loading wallet…</div>
                ) : (
                    <div className="space-y-6">
                        {/* Balance Card */}
                        <div className="bg-gradient-to-r from-emerald-950/60 via-gray-900 to-gray-950 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                    Current Credit Balance
                                </span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-black text-white">
                                        {wallet?.credits_balance ?? 0}
                                    </span>
                                    <span className="text-xs text-gray-400">Unused Lead Credits</span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    1 credit unlocks 1 customer's verified direct contact details.
                                </p>
                            </div>

                            <div className="text-right text-xs space-y-1">
                                <div>
                                    <span className="text-gray-500">Total Purchased:</span>{' '}
                                    <strong className="text-white">{wallet?.total_purchased ?? 0}</strong>
                                </div>
                                <div>
                                    <span className="text-gray-500">Total Unlocked:</span>{' '}
                                    <strong className="text-emerald-400">{wallet?.total_spent ?? 0}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Packages to Buy */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Zap size={15} className="text-amber-400" />
                                    Purchase Lead Packages
                                </h3>
                                <span className="text-[11px] text-gray-500">Instant credit balance top-up</span>
                            </div>

                            {packages.length === 0 ? (
                                <p className="text-xs text-gray-500 py-4 text-center">
                                    No lead packages currently configured.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {packages.map(pkg => (
                                        <div
                                            key={pkg.id}
                                            className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between hover:border-gray-700 transition"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-white text-sm">
                                                        {pkg.name}
                                                    </span>
                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                        {pkg.credits} Leads
                                                    </span>
                                                </div>

                                                <div className="text-xl font-black text-white mb-1.5">
                                                    ₹{Number(pkg.price).toLocaleString('en-IN')}
                                                </div>

                                                <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                                                    {pkg.description || `Unlock ${pkg.credits} high-intent customer inquiries.`}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={purchasingId === pkg.id}
                                                onClick={() => handlePurchase(pkg)}
                                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                                            >
                                                {purchasingId === pkg.id ? 'Processing…' : 'Buy Lead Pack'}
                                                <ArrowUpRight size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Transactions */}
                        {wallet && wallet.recent_transactions && wallet.recent_transactions.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                                    Recent Credit Transactions
                                </h3>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {wallet.recent_transactions.map(tx => (
                                        <div
                                            key={tx.id}
                                            className="bg-gray-950/60 border border-gray-800/80 px-3 py-2 rounded-xl flex items-center justify-between text-xs"
                                        >
                                            <div>
                                                <span className="text-gray-300 font-medium">
                                                    {tx.description}
                                                </span>
                                                <span className="text-[10px] text-gray-500 ml-2">
                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span
                                                className={`font-mono font-bold ${
                                                    tx.credits > 0 ? 'text-emerald-400' : 'text-amber-400'
                                                }`}
                                            >
                                                {tx.credits > 0 ? `+${tx.credits}` : tx.credits}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
