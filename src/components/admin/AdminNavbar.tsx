import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getUserProfile, isSuperAdmin, isAdmin, isAgent } from '../../lib/auth';
import { apiFetch, ENDPOINTS } from '../../lib/api';
import {
    Building2,
    Users,
    LogOut,
    CheckSquare,
    PlusCircle,
    CheckCheck,
    Sparkles,
    Phone,
    CreditCard,
    Clock
} from 'lucide-react';

interface AdminNavbarProps {
    pendingAgentsCount?: number;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ pendingAgentsCount: propPendingAgents }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUserProfile();
    const [pendingAgents, setPendingAgents] = useState(propPendingAgents || 0);
    const [pendingApprovals, setPendingApprovals] = useState(0);

    const isVenturesActive = location.pathname.startsWith('/admin/ventures');
    const isAgentsActive = location.pathname.startsWith('/admin/agents');
    const isApprovalsActive = location.pathname.startsWith('/admin/approvals');
    const isMembershipsActive = location.pathname.startsWith('/admin/memberships');
    const isQueriesActive = location.pathname.startsWith('/admin/queries');

    useEffect(() => {
        // Fetch badge counts safely with silent: true
        if (isAdmin(user)) {
            apiFetch(ENDPOINTS.pendingVentures, { silent: true })
                .then(data => {
                    const list = Array.isArray(data) ? data : data?.results || [];
                    setPendingApprovals(list.length);
                })
                .catch(() => {});
        }

        if (isSuperAdmin(user)) {
            apiFetch(ENDPOINTS.unverifiedAgents, { silent: true })
                .then(data => {
                    const list = Array.isArray(data) ? data : data?.results || [];
                    setPendingAgents(list.length);
                })
                .catch(() => {});
        }
    }, []);

    return (
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Brand & Portal Type */}
                <div className="flex items-center gap-6">
                    <div
                        onClick={() => navigate('/admin/ventures')}
                        className="flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <span className="text-white text-lg">🏢</span>
                        </div>
                        <div>
                            <span className="font-bold text-white tracking-tight text-base sm:text-lg block">
                                PlotVista
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/60">
                                {isSuperAdmin(user) ? 'Super Admin' : isAgent(user) ? 'Agent Portal' : 'Admin Panel'}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="hidden md:flex items-center gap-1.5 ml-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/ventures')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                                isVenturesActive
                                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800/70'
                            }`}
                        >
                            <Building2 size={15} />
                            Ventures
                        </button>

                        {/* Super Admin / Admin Approvals (Drafts to Public) */}
                        {isAdmin(user) && (
                            <button
                                type="button"
                                onClick={() => navigate('/admin/approvals')}
                                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                                    isApprovalsActive
                                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                                        : 'text-gray-300 hover:text-white hover:bg-gray-800/70'
                                }`}
                            >
                                <CheckSquare size={15} />
                                Approvals
                                {pendingApprovals > 0 && (
                                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-extrabold bg-amber-500 text-gray-950 rounded-full animate-pulse shadow-sm">
                                        {pendingApprovals}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Super Admin Agents List */}
                        {isSuperAdmin(user) && (
                            <button
                                type="button"
                                onClick={() => navigate('/admin/agents')}
                                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                                    isAgentsActive
                                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                                        : 'text-gray-300 hover:text-white hover:bg-gray-800/70'
                                }`}
                            >
                                <Users size={15} />
                                Agents
                                {pendingAgents > 0 && (
                                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-extrabold bg-amber-500 text-gray-950 rounded-full animate-pulse shadow-sm">
                                        {pendingAgents}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Memberships & Premiums */}
                        <button
                            type="button"
                            onClick={() => navigate('/admin/memberships')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                                isMembershipsActive
                                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800/70'
                            }`}
                        >
                            <CreditCard size={15} />
                            Memberships
                        </button>

                        {/* Call Queries */}
                        <button
                            type="button"
                            onClick={() => navigate('/admin/queries')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                                isQueriesActive
                                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800/70'
                            }`}
                        >
                            <Phone size={15} />
                            Call Queries
                        </button>
                    </nav>
                </div>

                {/* Right Actions & Profile */}
                <div className="flex items-center gap-3">
                    <a
                        href="/admin/ventures/create"
                        className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                    >
                        <PlusCircle size={14} />
                        New Venture
                    </a>

                    <div className="h-5 w-[1px] bg-gray-800 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                            {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
                        </div>
                        <div className="hidden lg:block text-left">
                            <div className="text-xs font-semibold text-gray-200 leading-tight">
                                {user?.full_name || 'Admin'}
                            </div>
                            <div className="text-[11px] text-gray-400 leading-tight">
                                {user?.email || 'admin@plotvista.com'}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => logout(navigate)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                        title="Sign out"
                    >
                        <LogOut size={15} />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation bar */}
            <div className="md:hidden flex overflow-x-auto border-t border-gray-800/80 px-2 py-2 gap-1.5 bg-gray-950/80">
                <button
                    type="button"
                    onClick={() => navigate('/admin/ventures')}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 whitespace-nowrap ${
                        isVenturesActive ? 'bg-blue-600 text-white' : 'text-gray-400'
                    }`}
                >
                    <Building2 size={13} />
                    Ventures
                </button>

                {isAdmin(user) && (
                    <button
                        type="button"
                        onClick={() => navigate('/admin/approvals')}
                        className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 whitespace-nowrap ${
                            isApprovalsActive ? 'bg-blue-600 text-white' : 'text-gray-400'
                        }`}
                    >
                        <CheckSquare size={13} />
                        Approvals
                        {pendingApprovals > 0 && (
                            <span className="px-1 py-0.2 text-[8px] bg-amber-400 text-gray-900 rounded-full font-bold">
                                {pendingApprovals}
                            </span>
                        )}
                    </button>
                )}

                {isSuperAdmin(user) && (
                    <button
                        type="button"
                        onClick={() => navigate('/admin/agents')}
                        className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 whitespace-nowrap ${
                            isAgentsActive ? 'bg-blue-600 text-white' : 'text-gray-400'
                        }`}
                    >
                        <Users size={13} />
                        Agents
                        {pendingAgents > 0 && (
                            <span className="px-1 py-0.2 text-[8px] bg-amber-400 text-gray-900 rounded-full font-bold">
                                {pendingAgents}
                            </span>
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/admin/memberships')}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 whitespace-nowrap ${
                        isMembershipsActive ? 'bg-blue-600 text-white' : 'text-gray-400'
                    }`}
                >
                    <CreditCard size={13} />
                    Plans
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/admin/queries')}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 whitespace-nowrap ${
                        isQueriesActive ? 'bg-blue-600 text-white' : 'text-gray-400'
                    }`}
                >
                    <Phone size={13} />
                    Leads
                </button>
            </div>
        </header>
    );
};

export default AdminNavbar;
