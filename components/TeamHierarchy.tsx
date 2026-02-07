
import React, { useState } from 'react';
import { User, UserRole, Team } from '../types';
import { ShieldCheck, Shield, Users, CircuitBoard, ChevronDown, ChevronUp } from 'lucide-react';

interface TeamHierarchyProps {
    users: User[];
    teams: Team[];
    onNodeClick?: (user: User) => void;
}

const HierarchyNode: React.FC<{ user: User; type: 'admin' | 'leader' | 'member'; onClick?: (user: User) => void }> = ({ user, type, onClick }) => {
    const getColors = () => {
        switch (type) {
            case 'admin': return 'bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-900 dark:border-white';
            case 'leader': return 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700';
            case 'member': return 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'admin': return <ShieldCheck className="w-3 h-3" />;
            case 'leader': return <Shield className="w-3 h-3" />;
            case 'member': return <Users className="w-3 h-3" />;
        }
    };

    return (
        <div
            onClick={() => onClick?.(user)}
            className={`
                relative flex flex-col items-center p-3 rounded-2xl border-2 shadow-xl hover:scale-105 transition-transform duration-300 z-10 min-w-[120px] max-w-[160px] cursor-pointer
                ${getColors()}
            `}
        >
            <div className="relative mb-2">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-current transition-all" />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${type === 'admin' ? 'bg-amber-400 text-black' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}>
                    {getIcon()}
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-tight text-center leading-tight truncate w-full">{user.name}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 text-center">{type}</p>

            {/* Node Connection Point Top - Only for non-admins */}
            {type !== 'admin' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-zinc-300 dark:bg-zinc-700"></div>
            )}

            {/* Node Connection Point Bottom - Only for non-members (if we had specific children) or admins/leaders connected to next layer */}
            {type !== 'member' && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-zinc-300 dark:bg-zinc-700"></div>
            )}
        </div>
    );
};

const TeamHierarchy: React.FC<TeamHierarchyProps> = ({ users, teams, onNodeClick }) => {
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

    // Filter out Admins to show separately or ignore? 
    // Usually Admins are global. Let's just focus on Teams as requested.

    // Unassigned users (excluding Admins)
    const unassignedUsers = users.filter(u => !u.teamId && u.role !== UserRole.ADMIN);

    return (
        <div className="w-full py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header/Legend (Optional) */}
                <div className="flex items-center justify-between mb-8 opacity-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Operational Units: {teams.length}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map(team => {
                        const teamMembers = users.filter(u => u.teamId === team.id);
                        const leader = teamMembers.find(u => u.role === UserRole.TEAM_LEADER);
                        const membersOnly = teamMembers.filter(u => u.role !== UserRole.TEAM_LEADER);
                        const isExpanded = expandedTeamId === team.id;

                        return (
                            <div key={team.id} className={`bg-zinc-900 border ${isExpanded ? 'border-zinc-700 ring-1 ring-zinc-700' : 'border-zinc-800'} rounded-[1.5rem] overflow-hidden transition-all duration-300`}>
                                <div
                                    onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                                    className="p-6 cursor-pointer hover:bg-zinc-800/30 transition-colors flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black uppercase ${isExpanded ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300'} transition-colors`}>
                                                {team.name.substring(0, 2)}
                                            </div>
                                            <h3 className="font-black text-white uppercase tracking-widest text-sm">{team.name}</h3>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase pl-1">{teamMembers.length} Personnel Attached</p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                                    </div>
                                </div>

                                {/* EXPANDED CONTENT */}
                                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="p-4 bg-black/20 border-t border-zinc-800/50 space-y-2">

                                            {/* LEADER */}
                                            {leader ? (
                                                <div
                                                    onClick={() => onNodeClick?.(leader)}
                                                    className="flex items-center gap-3 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20 transition-colors"
                                                >
                                                    <img src={leader.avatar} className="w-8 h-8 rounded-lg" />
                                                    <div>
                                                        <p className="text-xs font-bold text-indigo-100">{leader.name}</p>
                                                        <p className="text-[9px] font-black uppercase text-indigo-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Unit Commander</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase text-center">
                                                    No Commander Assigned
                                                </div>
                                            )}

                                            {/* MEMBERS LIST */}
                                            {membersOnly.length > 0 && (
                                                <div className="space-y-1 pt-2">
                                                    <p className="text-[9px] font-black uppercase text-zinc-500 px-2 mb-1">Operatives</p>
                                                    {membersOnly.map(member => (
                                                        <div
                                                            key={member.id}
                                                            onClick={() => onNodeClick?.(member)}
                                                            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                                                        >
                                                            <div className="relative">
                                                                <img src={member.avatar} className="w-8 h-8 rounded-full bg-zinc-800 object-cover" />
                                                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${member.isActive ? 'bg-emerald-500' : 'bg-zinc-500'}`}></div>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-zinc-300">{member.name}</p>
                                                                <p className="text-[9px] text-zinc-600 uppercase tracking-wider">{member.email}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {teamMembers.length === 0 && (
                                                <div className="text-center py-4">
                                                    <p className="text-[9px] text-zinc-600 italic">Unit Empty</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Unassigned Section */}
                {unassignedUsers.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-zinc-800 border-dashed">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-4 h-4 text-zinc-500" />
                            <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest">Unassigned Personnel</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {unassignedUsers.map(u => (
                                <div key={u.id} onClick={() => onNodeClick?.(u)} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                                    <img src={u.avatar} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className="text-xs font-bold text-zinc-400">{u.name}</p>
                                        <p className="text-[9px] text-zinc-600 uppercase">Awaiting Assignment</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {teams.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <CircuitBoard className="w-16 h-16 text-zinc-300 mx-auto" />
                        <p className="mt-4 text-sm uppercase font-black text-zinc-400">No Active Units</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamHierarchy;
