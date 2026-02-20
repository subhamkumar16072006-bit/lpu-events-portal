import React from 'react';
import {
    Home,
    Ticket,
    User,
    Search,
    Bell,
    Menu,
    GraduationCap,
    LogOut
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

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

const StudentSidebar = ({ activeTab, onTabChange, onLogout }) => {
    return (
        <div className="w-64 h-full bg-[#0A0A0A] border-r border-white/10 flex flex-col">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                        <GraduationCap size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-white leading-none">LPU Events</h1>
                        <p className="text-xs text-gray-500">Student Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1">
                <SidebarItem
                    icon={Home}
                    label="Discover"
                    active={activeTab === 'discover'}
                    onClick={() => onTabChange('discover')}
                />
                <SidebarItem
                    icon={Ticket}
                    label="My Tickets"
                    active={activeTab === 'my-tickets'}
                    onClick={() => onTabChange('my-tickets')}
                />
                <SidebarItem
                    icon={User}
                    label="Profile"
                    active={activeTab === 'profile'}
                    onClick={() => onTabChange('profile')}
                />
            </div>

            {/* Switch to Organizer Action */}
            <div className="px-3 mb-2">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium border border-transparent hover:border-white/10"
                >
                    <LogOut size={20} />
                    <span>Switch to Organizer</span>
                </button>
            </div>

            {/* Student Info Widget */}
            <div className="p-4 mx-3 mb-4 rounded-xl bg-[#111] border border-white/5 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-semibold text-white mb-1">Student Pass</h3>
                    <p className="text-xs text-gray-400 mb-2">Valid for 2025-26</p>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-green-500 rounded-full"></div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            </div>
        </div>
    );
};

const Header = ({ onLogout }) => {
    return (
        <header className="h-16 border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center gap-4 flex-1">
                <button className="lg:hidden text-gray-400">
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden md:block">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="h-10 pl-10 pr-4 rounded-full bg-[#111] border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-white/20 w-64"
                    />
                </div>

                {/* Actions */}
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/5 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-[#0A0A0A]"></span>
                </button>

                <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                {/* Profile / Logout */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#0A0A0A]">
                        ST
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
};

const StudentLayout = ({ children, onLogout, activeTab, onTabChange }) => {
    return (
        <div className="flex h-screen bg-[#0A0A0A] text-white font-sans overflow-hidden">
            <StudentSidebar activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Header onLogout={onLogout} />
                <main className="flex-1 overflow-y-auto p-0 relative">
                    {/* Background Gradient Mesh - Custom for Student */}
                    <div className="fixed inset-0 z-0 pointer-events-none">
                        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[128px]"></div>
                        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[128px]"></div>
                    </div>

                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;
