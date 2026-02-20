import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const tabs = [
    { id: 'all', label: 'All Events', icon: '📅' },
    { id: 'hackathons', label: 'Hackathons', icon: '👨‍💻' },
    { id: 'symposiums', label: 'Symposiums', icon: '📊' },
    { id: 'cultural', label: 'Cultural', icon: '🎭' },
    { id: 'workshops', label: 'Workshops', icon: '📝' },
    { id: 'seminars', label: 'Seminars', icon: '🎓' },
];

const CategoryTabs = ({ activeTab, onTabChange }) => {
    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={twMerge(
                        "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all",
                        activeTab === tab.id
                            ? "bg-primary text-white border-primary"
                            : "bg-[#111] text-gray-400 border-white/10 hover:border-white/20 hover:text-gray-200"
                    )}
                >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default CategoryTabs;
