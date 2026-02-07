
import React, { useState } from 'react';
import { User } from '../types.ts';
import {
    Globe,
    Moon,
    Sun,
    Monitor,
    HelpCircle,
    ToggleLeft,
    ToggleRight,
    ChevronRight,
    LogOut
} from 'lucide-react';

interface SettingsProps {
    user: User;
    isDarkMode: boolean;
    toggleTheme: () => void;
    onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, isDarkMode, toggleTheme, onLogout }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [language, setLanguage] = useState(() => localStorage.getItem('teamsync_language') || 'English (US)');
    const [timezone, setTimezone] = useState(() => localStorage.getItem('teamsync_timezone') || 'Auto (UTC-05:00)');
    const [highContrast, setHighContrast] = useState(() => localStorage.getItem('teamsync_highcontrast') === 'true');

    const updateLanguage = (val: string) => {
        setLanguage(val);
        localStorage.setItem('teamsync_language', val);
    };

    const updateTimezone = (val: string) => {
        setTimezone(val);
        localStorage.setItem('teamsync_timezone', val);
    };

    const updateHighContrast = () => {
        const newVal = !highContrast;
        setHighContrast(newVal);
        localStorage.setItem('teamsync_highcontrast', String(newVal));
        // Apply high contrast class if needed in global styles (optional future enhancement)
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'appearance', label: 'Appearance', icon: Monitor },
        { id: 'about', label: 'About', icon: HelpCircle },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-20 no-scrollbar">
            <div className="flex flex-col md:flex-row gap-8">

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-6">
                        <h2 className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Settings</h2>
                        <div className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${activeTab === tab.id
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                                            : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
                  `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="text-xs font-medium">{tab.label}</span>
                                    {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto text-zinc-400" />}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-xs font-bold">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-6">

                    {/* Header */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-white">
                                {tabs.find(t => t.id === activeTab)?.icon && React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "w-8 h-8" })}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter mb-1">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h1>
                                <p className="text-zinc-500 text-xs font-medium">Manage your {activeTab} preferences</p>
                            </div>
                        </div>
                    </div>

                    {/* Settings Content */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[500px]">

                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid gap-6">
                                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <Globe className="w-5 h-5 text-zinc-400" />
                                            <div>
                                                <p className="font-bold text-zinc-900 dark:text-white text-sm">Language</p>
                                                <p className="text-[10px] text-zinc-500 font-medium">Select your interface language</p>
                                            </div>
                                        </div>
                                        <select
                                            value={language}
                                            onChange={(e) => updateLanguage(e.target.value)}
                                            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold py-2 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none cursor-pointer dark:text-white"
                                        >
                                            <option>English (US)</option>
                                            <option>English (UK)</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                            <option>German</option>
                                            <option>Japanese</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <HelpCircle className="w-5 h-5 text-zinc-400" />
                                            <div>
                                                <p className="font-bold text-zinc-900 dark:text-white text-sm">Timezone</p>
                                                <p className="text-[10px] text-zinc-500 font-medium">Current local time: {new Date().toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <select
                                            value={timezone}
                                            onChange={(e) => updateTimezone(e.target.value)}
                                            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold py-2 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none cursor-pointer dark:text-white"
                                        >
                                            <option>Auto (UTC-05:00)</option>
                                            <option>UTC-08:00 (Pacific Time)</option>
                                            <option>UTC+00:00 (London)</option>
                                            <option>UTC+01:00 (Paris)</option>
                                            <option>UTC+01:00 (Berlin, Germany)</option>
                                            <option>UTC+05:30 (New Delhi, India)</option>
                                            <option>UTC+09:00 (Tokyo)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        {isDarkMode ? <Moon className="w-5 h-5 text-zinc-400" /> : <Sun className="w-5 h-5 text-zinc-400" />}
                                        <div>
                                            <p className="font-bold text-zinc-900 dark:text-white text-sm">Theme Preference</p>
                                            <p className="text-[10px] text-zinc-500 font-medium">Switch between light and dark mode</p>
                                        </div>
                                    </div>
                                    <button onClick={toggleTheme} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-900 text-white dark:bg-white dark:border-white dark:text-black rounded-xl shadow-lg hover:opacity-90 transition-all text-xs font-black uppercase tracking-widest">
                                        {isDarkMode ? 'Current: Dark Mode' : 'Current: Light Mode'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <Monitor className="w-5 h-5 text-zinc-400" />
                                        <div>
                                            <p className="font-bold text-zinc-900 dark:text-white text-sm">High Contrast</p>
                                            <p className="text-[10px] text-zinc-500 font-medium">Increase contrast for better visibility</p>
                                        </div>
                                    </div>
                                    <button onClick={updateHighContrast}>
                                        {highContrast ? <ToggleRight className="w-8 h-8 text-zinc-900 dark:text-white" /> : <ToggleLeft className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-12">
                                <div className="w-20 h-20 bg-zinc-900 dark:bg-white rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-2xl">
                                    <span className="text-3xl font-black text-white dark:text-black">TS</span>
                                </div>

                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter mb-2">TeamSync Pro</h2>
                                    <p className="text-zinc-400 font-medium">Version 2.4.0 (Build 8933)</p>
                                </div>

                                <div className="flex justify-center gap-4 pt-8">
                                    <button className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Privacy Policy</button>
                                    <span className="text-zinc-300">•</span>
                                    <button className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Terms of Service</button>
                                    <span className="text-zinc-300">•</span>
                                    <button className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Licenses</button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
