import React, { useState } from 'react';
import { User, UserRole, Team } from '../types';
import { ShieldCheck, Shield, Users, CircuitBoard, ChevronDown, Activity, Target, Zap, Cpu, Landmark, Briefcase, Anchor, Globe, User as UserIcon, Layout, ChevronRight, MoreHorizontal, CheckCircle } from 'lucide-react';

interface TeamHierarchyProps {
    users: User[];
    teams: Team[];
    onNodeClick?: (user: User) => void;
}

const TeamHierarchy: React.FC<TeamHierarchyProps> = ({ users, teams, onNodeClick }) => {
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

    const unassignedUsers = users.filter(u => !u.teamId && u.role !== UserRole.ADMIN);

    return (
        <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            
            {/* SaaS Hierarchy Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
                <div>
                    <h1 className="text-3xl font-bold  text-foreground">Team Directory</h1>
                    <p className="text-muted-foreground text-sm mt-1">Explore organization structure, team assignments, and member availability.</p>
                </div>
                <div className="flex items-center gap-6 px-6 py-3 bg-muted/20 border border-border/50 rounded-2xl">
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-bold text-muted-foreground   leading-none">Total Teams</p>
                        <p className="text-lg font-bold text-foreground mt-1">{teams.length}</p>
                    </div>
                    <div className="w-px h-8 bg-border/50" />
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-bold text-muted-foreground   leading-none">Total Members</p>
                        <p className="text-lg font-bold text-foreground mt-1">{users.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {teams.map(team => {
                    const teamMembers = users.filter(u => u.teamId === team.id);
                    const leader = teamMembers.find(u => u.role === UserRole.TEAM_LEADER);
                    const membersOnly = teamMembers.filter(u => u.role !== UserRole.TEAM_LEADER);
                    const isExpanded = expandedTeamId === team.id;

                    return (
                        <div 
                            key={team.id} 
                            className={`saas-card group overflow-hidden transition-all duration-300 ${isExpanded ? 'border-accent/40 shadow-xl shadow-accent/5' : 'hover:border-accent/20'}`}
                        >
                            <div
                                onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                                className="p-6 cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg transition-all border shadow-sm ${isExpanded ? 'bg-accent text-white border-accent' : 'bg-muted/50 text-muted-foreground border-border group-hover:bg-accent/5 group-hover:text-accent group-hover:border-accent/20'}`}>
                                        {team.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground  group-hover:text-accent transition-colors">{team.name}</h3>
                                        <p className="text-[11px] font-bold text-muted-foreground mt-1  ">{teamMembers.length} Members Assigned</p>
                                    </div>
                                </div>
                                <div className={`w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center border border-border/50 transition-all ${isExpanded ? 'rotate-180 bg-accent/10 border-accent/20 text-accent' : 'text-muted-foreground'}`}>
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Expanded Section */}
                            {isExpanded && (
                                <div className="px-6 pb-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                                    <div className="h-px bg-border/50" />
                                    
                                    {/* Team Lead */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-[10px] font-bold text-muted-foreground  ">Team Leadership</span>
                                        </div>
                                        {leader ? (
                                            <div
                                                onClick={(e) => { e.stopPropagation(); onNodeClick?.(leader); }}
                                                className="flex items-center justify-between p-4 bg-muted/10 border border-border/50 rounded-xl cursor-pointer hover:border-accent/30 hover:bg-muted/20 transition-all group/leader"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <img src={leader.avatar} className="w-12 h-12 rounded-lg object-cover border border-border shadow-sm group-hover/leader:border-accent/40" />
                                                        <div className="absolute -bottom-1 -right-1 bg-accent p-1 rounded-md border-2 border-card shadow-lg shadow-accent/20">
                                                            <CheckCircle className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground ">{leader.name}</p>
                                                        <p className="text-[10px] font-bold text-accent   mt-0.5">Primary Lead</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover/leader:text-accent" />
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-muted/10 border border-dashed border-border rounded-xl text-center">
                                                <p className="text-[10px] font-bold text-muted-foreground/40  ">Leadership Slot Open</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Team Members */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-[10px] font-bold text-muted-foreground  ">Engineers & Staff</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {membersOnly.map(member => (
                                                <div
                                                    key={member.id}
                                                    onClick={(e) => { e.stopPropagation(); onNodeClick?.(member); }}
                                                    className="flex items-center justify-between p-3 bg-card border border-border/30 rounded-lg cursor-pointer hover:border-accent/20 hover:bg-muted/5 transition-all group/member"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <img src={member.avatar} className="w-10 h-10 rounded-lg object-cover border border-border/50 group-hover/member:border-accent/20 transition-all" />
                                                            {member.isActive && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-foreground  group-hover/member:text-accent transition-colors">{member.name}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground/60   mt-0.5">{member.email}</p>
                                                        </div>
                                                    </div>
                                                    <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground/20 group-hover/member:text-muted-foreground/60" />
                                                </div>
                                            ))}
                                            {membersOnly.length === 0 && (
                                                <p className="text-center py-4 text-[10px] font-bold text-muted-foreground/30  ">No staff assigned</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Awaiting Assignment */}
            {unassignedUsers.length > 0 && (
                <div className="mt-16 pt-10 border-t border-border/50">
                    <div className="flex items-center gap-3 mb-6 px-4">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-xs font-bold  text-muted-foreground ">Awaiting Assignment</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                        {unassignedUsers.map(u => (
                            <div 
                                key={u.id} 
                                onClick={() => onNodeClick?.(u)} 
                                className="saas-card p-4 hover:border-accent/30 transition-all duration-300 group cursor-pointer bg-card/40"
                            >
                                <div className="flex items-center gap-4">
                                    <img src={u.avatar} className="w-12 h-12 rounded-xl object-cover border border-border shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">{u.name}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground   mt-1">Pending Node</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {teams.length === 0 && (
                <div className="text-center py-32 space-y-6 saas-card bg-card/20 border-dashed">
                    <CircuitBoard className="w-16 h-16 text-muted-foreground/20 mx-auto" />
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold text-muted-foreground  tracking-[0.2em]">Hierarchy Void</h2>
                        <p className="text-xs text-muted-foreground/60 font-medium">No teams are currently defined in the workspace.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamHierarchy;
