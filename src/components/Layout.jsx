import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    LayoutDashboard, Calendar, Ticket, Users, QrCode,
    Search, Bell, Settings, Menu, GraduationCap,
    X, Loader2, LogOut, User, ChevronRight, Clock,
    CheckCircle, AlertCircle
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../lib/supabase';

// ── SidebarItem ────────────────────────────────────────────────────────────
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={twMerge(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
            active
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
    >
        <Icon size={20} className={active ? "text-primary" : "text-gray-400 group-hover:text-white"} />
        <span>{label}</span>
    </button>
);

// ── Sidebar ────────────────────────────────────────────────────────────────
const Sidebar = ({ activeTab, onTabChange }) => (
    <div className="w-64 h-full bg-[#0A0A0A] border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                    <GraduationCap size={20} />
                </div>
                <div>
                    <h1 className="font-bold text-white leading-none">LPU Events</h1>
                    <p className="text-xs text-gray-500">Organizer Portal</p>
                </div>
            </div>
        </div>

        {/* Nav */}
        <div className="flex-1 py-6 px-3 space-y-1">
            {[
                { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard' },
                { icon: Calendar, label: 'My Events', tab: 'my-events' },
                { icon: Ticket, label: 'Ticket Management', tab: 'tickets' },
                { icon: Users, label: 'Attendees', tab: 'attendees' },
                { icon: QrCode, label: 'QR Scanner', tab: 'scanner' },
            ].map(({ icon, label, tab }) => (
                <SidebarItem key={tab} icon={icon} label={label}
                    active={activeTab === tab} onClick={() => onTabChange(tab)} />
            ))}
        </div>

        {/* Help Widget */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-[#111] border border-white/5 relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="font-semibold text-white mb-1">Need Help?</h3>
                <p className="text-xs text-gray-400 mb-3">Check our guide for creating events</p>
                <button className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
                    View Guide
                </button>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
        </div>
    </div>
);

// ── Search Panel ───────────────────────────────────────────────────────────
const SearchPanel = ({ onClose, onTabChange }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const categoryIcons = {
        'Hackathon': '👨‍💻', 'Symposium': '📊', 'Cultural': '🎭',
        'Workshop': '📝', 'Seminar': '🎓'
    };

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from('tickets')
                    .select('id, event_name, category, event_date, venue')
                    .ilike('event_name', `%${query}%`)
                    .limit(8);
                setResults(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
            <div className="w-full max-w-xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                    <Search size={18} className="text-gray-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search events by name…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="flex-1 bg-transparent text-white focus:outline-none text-sm placeholder:text-gray-600"
                    />
                    {loading && <Loader2 size={16} className="text-primary animate-spin flex-shrink-0" />}
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                        {results.map(ev => (
                            <button
                                key={ev.id}
                                onClick={() => { onTabChange('dashboard'); onClose(); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                            >
                                <span className="text-xl flex-shrink-0">{categoryIcons[ev.category] || '📅'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{ev.event_name}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {ev.venue && ` · ${ev.venue}`}
                                    </p>
                                </div>
                                <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}

                {query && !loading && results.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No events found for "<span className="text-white">{query}</span>"
                    </div>
                )}

                {!query && (
                    <div className="px-4 py-6 text-center text-gray-600 text-xs">
                        Start typing to search all events
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Notifications Panel ────────────────────────────────────────────────────
const NotificationsPanel = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const { data } = await supabase
                    .from('registrations')
                    .select('id, student_name, created_at, status, tickets(event_name)')
                    .order('created_at', { ascending: false })
                    .limit(15);
                setNotifications(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, []);

    const timeAgo = (dateStr) => {
        const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
        if (diff < 60) return `${Math.floor(diff)}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Bell size={16} className="text-primary" />
                    <h3 className="font-semibold text-white text-sm">Notifications</h3>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-primary" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                    <Bell size={28} className="mx-auto mb-2 opacity-20" />
                    No recent registrations
                </div>
            ) : (
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                    {notifications.map(n => (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.status === 'used'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                {n.status === 'used'
                                    ? <CheckCircle size={15} />
                                    : <User size={15} />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">
                                    {n.student_name || 'A student'} registered
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {n.tickets?.event_name || 'Unknown event'}
                                </p>
                                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                    <Clock size={10} /> {timeAgo(n.created_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="px-4 py-2 border-t border-white/5">
                <p className="text-xs text-gray-600 text-center">Showing last 15 registrations</p>
            </div>
        </div>
    );
};

// ── Settings Panel ─────────────────────────────────────────────────────────
const SettingsPanel = ({ session, onClose, onLogout }) => {
    const email = session?.user?.email || 'Not signed in';
    const initial = email[0]?.toUpperCase() || 'U';
    const joinedDate = session?.user?.created_at
        ? new Date(session.user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Profile */}
            <div className="px-4 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{email}</p>
                        <p className="text-xs text-gray-500">Organizer Account</p>
                        {joinedDate && <p className="text-xs text-gray-600">Member since {joinedDate}</p>}
                    </div>
                </div>
            </div>

            {/* Settings items */}
            <div className="p-2">
                {[
                    { icon: User, label: 'Profile', sub: 'View your account details' },
                    { icon: Bell, label: 'Notification Preferences', sub: 'Manage alerts' },
                    { icon: Settings, label: 'Portal Settings', sub: 'Configure your portal' },
                ].map(({ icon: Icon, label, sub }) => (
                    <button key={label}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                        onClick={onClose}
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            <Icon size={15} className="text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium">{label}</p>
                            <p className="text-xs text-gray-500">{sub}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                    </button>
                ))}
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-white/10">
                <button
                    onClick={() => { onLogout(); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-left group"
                >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <LogOut size={15} className="text-red-400" />
                    </div>
                    <span className="text-sm text-red-400 font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

// ── Header ─────────────────────────────────────────────────────────────────
const Header = ({ session, onLogin, onSignup, onLogout, onTabChange }) => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Close dropdowns on outside click
    const notifRef = useRef(null);
    const settingsRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
            if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Keyboard shortcut: Cmd+K or Ctrl+K opens search
    useEffect(() => {
        const handleKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setNotifOpen(false);
                setSettingsOpen(false);
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <>
            <header className="h-16 border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
                <div className="flex items-center gap-4 flex-1">
                    <button className="lg:hidden text-gray-400">
                        <Menu size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search trigger */}
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="hidden md:flex items-center gap-3 h-10 pl-4 pr-3 rounded-full bg-[#111] border border-white/10 text-sm text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all w-56 group"
                    >
                        <Search size={15} />
                        <span className="flex-1 text-left">Search events…</span>
                        <kbd className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd>
                    </button>
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/5 transition-colors"
                    >
                        <Search size={20} />
                    </button>

                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => { setNotifOpen(o => !o); setSettingsOpen(false); }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${notifOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-[#0A0A0A]" />
                        </button>
                        {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
                    </div>

                    {/* Settings */}
                    <div className="relative" ref={settingsRef}>
                        <button
                            onClick={() => { setSettingsOpen(o => !o); setNotifOpen(false); }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${settingsOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                            <Settings size={20} />
                        </button>
                        {settingsOpen && (
                            <SettingsPanel
                                session={session}
                                onClose={() => setSettingsOpen(false)}
                                onLogout={onLogout}
                            />
                        )}
                    </div>

                    {/* Profile / Auth */}
                    {session ? (
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm cursor-default ml-1">
                            {session.user.email ? session.user.email[0].toUpperCase() : 'U'}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 ml-1">
                            <button onClick={onLogin}
                                className="px-4 py-2 rounded-full hover:bg-white/10 text-white text-sm font-medium transition-all">
                                Login
                            </button>
                            <button onClick={onSignup}
                                className="px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all shadow-lg shadow-orange-500/20">
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Search modal (rendered outside header so it overlays everything) */}
            {searchOpen && (
                <SearchPanel
                    onClose={() => setSearchOpen(false)}
                    onTabChange={onTabChange}
                />
            )}
        </>
    );
};

// ── Layout ─────────────────────────────────────────────────────────────────
const Layout = ({ children, session, onLogin, onSignup, onLogout, activeTab, onTabChange }) => (
    <div className="flex h-screen bg-[#0A0A0A] text-white font-sans overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Header
                session={session}
                onLogin={onLogin}
                onSignup={onSignup}
                onLogout={onLogout}
                onTabChange={onTabChange}
            />
            <main className="flex-1 overflow-y-auto p-8 relative">
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[128px]" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[128px]" />
                </div>
                <div className="relative z-10">{children}</div>
            </main>
        </div>
    </div>
);

export default Layout;
