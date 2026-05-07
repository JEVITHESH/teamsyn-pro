import React, { useState } from 'react';
import { User } from '../types.ts';
import {
    Moon,
    Sun,
    Monitor,
    HelpCircle,
    ToggleLeft,
    ToggleRight,
    ChevronRight,
    LogOut,
    Shield,
    Info,
    Layout,
    Globe,
    Bell,
    Lock,
    Cpu,
    Zap,
    ChevronLeft,
    Check,
    ShieldCheck
} from 'lucide-react';

interface SettingsProps {
    user: User;
    isDarkMode: boolean;
    toggleTheme: () => void;
    onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, isDarkMode, toggleTheme, onLogout }) => {
    const [activeTab, setActiveTab] = useState('appearance');
    const [highContrast, setHighContrast] = useState(() => localStorage.getItem('teamsync_highcontrast') === 'true');

    const updateHighContrast = () => {
        const newVal = !highContrast;
        setHighContrast(newVal);
        localStorage.setItem('teamsync_highcontrast', String(newVal));
    };

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: Monitor, desc: 'Customize the visual experience' },
        { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Manage your alert preferences' },
        { id: 'security', label: 'Privacy & Security', icon: Lock, desc: 'Configure access and data control' },
        { id: 'about', label: 'Platform Info', icon: Info, desc: 'System version and licenses' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            
            {/* SaaS Settings Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
                <div>
                    <h1 className="text-3xl font-bold  text-foreground">Workspace Settings</h1>
                    <p className="text-muted-foreground text-sm mt-1">Configure your personal preferences and workspace environment.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Vertical Navigation Tabs */}
                <div className="w-full lg:w-72 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left
                                ${activeTab === tab.id
                                    ? 'bg-accent text-white shadow-lg shadow-accent/10 font-bold'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                            `}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground'}`} />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm truncate">{tab.label}</p>
                                {activeTab === tab.id && <p className="text-[10px] text-white/60 font-medium truncate mt-0.5">{tab.desc}</p>}
                            </div>
                            {activeTab === tab.id && <ChevronRight className="w-4 h-4 text-white/40" />}
                        </button>
                    ))}

                    <div className="pt-8 mt-8 border-t border-border/50">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-4 p-4 rounded-xl text-red-500 font-bold hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Sign Out of Workspace</span>
                        </button>
                    </div>
                </div>

                {/* Settings Content Panels */}
                <div className="flex-1 saas-card bg-card/60 backdrop-blur-md border-border/50 overflow-hidden min-h-[500px]">
                    
                    {/* Panel Header */}
                    <div className="p-8 border-b border-border/50 bg-muted/10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-accent">
                           {tabs.find(t => t.id === activeTab)?.icon && React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "w-6 h-6" })}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground ">{tabs.find(t => t.id === activeTab)?.label}</h2>
                            <p className="text-[11px] font-bold text-muted-foreground   mt-1">Parameters Registry • Sync Active</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 space-y-10">
                        
                        {activeTab === 'appearance' && (
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between gap-6 p-6 rounded-2xl bg-muted/10 border border-border/50">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-card rounded-xl border border-border shadow-sm flex items-center justify-center text-accent">
                                                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-foreground">Theme Preference</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Toggle between light and dark interface modes.</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-muted p-1 rounded-xl border border-border/50 shadow-inner">
                                            <button onClick={() => !isDarkMode && toggleTheme()} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isDarkMode ? 'bg-card text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Light</button>
                                            <button onClick={() => isDarkMode && toggleTheme()} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isDarkMode ? 'bg-card text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Dark</button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-6 p-6 rounded-2xl bg-muted/10 border border-border/50">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-card rounded-xl border border-border shadow-sm flex items-center justify-center text-accent">
                                                <Monitor className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-foreground">Visual Consistency</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Force high contrast for improved legibility across nodes.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={updateHighContrast} 
                                            className={`w-12 h-7 rounded-full p-1 transition-all ${highContrast ? 'bg-accent' : 'bg-muted border border-border'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full transition-all shadow-sm ${highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-4">
                                   <Zap className="w-5 h-5 text-indigo-500 shrink-0" />
                                   <p className="text-xs text-indigo-500/80 font-medium leading-relaxed">System-wide typography is currently locked to **Inter** to maintain organizational consistency standards.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { label: "Internal Node Alerts", desc: "Push notifications for important events" },
                                        { label: "Email Digests", desc: "Weekly summaries of team progress" },
                                        { label: "Chat Mentions", desc: "Alerts when you are @referenced" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-muted/10 border border-border/50 hover:bg-muted/20 transition-all cursor-pointer">
                                            <div>
                                                <p className="text-base font-bold text-foreground">{item.label}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                            </div>
                                            <div className="w-12 h-7 rounded-full p-1 bg-accent bg-opacity-10 border border-accent/20">
                                                <div className="w-5 h-5 bg-accent rounded-full translate-x-5 shadow-sm" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-12">
                                <div className="text-center space-y-6 py-4">
                                    <div className="w-20 h-20 bg-accent rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-accent/20 border border-white/10 group">
                                        <Zap className="w-10 h-10 text-white fill-white group-hover:scale-110 transition-transform" />
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold  text-foreground">TeamSync Pro</h2>
                                        <p className="text-[10px] font-bold text-accent  tracking-[0.4em] mt-2">Scaleable Workspace v5.0_LTS</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 saas-card bg-muted/5">
                                        <p className="text-[10px] font-bold text-muted-foreground  mb-4  pl-1">Environment Specs</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground font-medium">Core Engine</span>
                                                <span className="text-foreground font-bold">V-Stream 9.2</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground font-medium">Security</span>
                                                <span className="text-foreground font-bold">AES-GCM-256</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground font-medium">Latency</span>
                                                <span className="text-emerald-500 font-bold">Optimal (12ms)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 saas-card bg-muted/5">
                                        <p className="text-[10px] font-bold text-muted-foreground  mb-4  pl-1">Resource Center</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="p-3 bg-card border border-border rounded-xl text-[10px] font-bold   text-muted-foreground hover:text-accent hover:border-accent/30 transition-all">Documentation</button>
                                            <button className="p-3 bg-card border border-border rounded-xl text-[10px] font-bold   text-muted-foreground hover:text-accent hover:border-accent/30 transition-all">Support API</button>
                                            <button className="p-3 bg-card border border-border rounded-xl text-[10px] font-bold   text-muted-foreground hover:text-accent hover:border-accent/30 transition-all">Legal Node</button>
                                            <button className="p-3 bg-card border border-border rounded-xl text-[10px] font-bold   text-muted-foreground hover:text-accent hover:border-accent/30 transition-all">Whitepaper</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Platform Compliance Footer */}
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-10 opacity-10">
               <ShieldCheck className="w-12 h-12 text-foreground" />
               <Globe className="w-12 h-12 text-foreground" />
               <Cpu className="w-12 h-12 text-foreground" />
            </div>
        </div>
    );
};

export default Settings;
