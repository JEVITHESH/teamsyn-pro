import React, { useState, useEffect } from 'react';
import { User, StandupSession, StandupResponse, UserRole } from '../types';
import { api } from '../services/api';
import {
    Calendar,
    Clock,
    Plus,
    Send,
    AlertCircle,
    CheckCircle2,
    User as UserIcon,
    Trash2,
    Edit2,
    X,
    BellRing,
    Activity,
    ShieldCheck,
    BarChart3,
    ArrowRight,
    Users,
    ChevronRight,
    History,
    MoreHorizontal
} from 'lucide-react';

interface StandupProps {
    user: User;
}

const Standup: React.FC<StandupProps> = ({ user }) => {
    const [activeStandup, setActiveStandup] = useState<StandupSession | null>(null);
    const [responses, setResponses] = useState<StandupResponse[]>([]);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [adminSelectedTeamId, setAdminSelectedTeamId] = useState<string>(`admin_global_${user.branchId}`);
    const [allTeams, setAllTeams] = useState<any[]>([]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    const [responseMessage, setResponseMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingResponseId, setEditingResponseId] = useState<string | null>(null);

    const isLeader = user.role === UserRole.TEAM_LEADER || user.role === UserRole.ADMIN;

    useEffect(() => {
        if (user.role === UserRole.ADMIN) {
            api.getTeams().then(setAllTeams).catch(console.error);
        }
    }, [user.role]);

    useEffect(() => {
        setIsLoading(true);
        const activeTeamId = user.role === UserRole.ADMIN ? adminSelectedTeamId : user.teamId;

        const unsubMembers = api.subscribeToUsers((members: any) => {
            if (activeTeamId === `admin_global_${user.branchId}`) {
               setTeamMembers(members.filter((m: any) => !m.teamId || m.role === UserRole.ADMIN));
            } else {
               setTeamMembers(members.filter((m: any) => m.teamId === activeTeamId));
            }
        });

        let unsubStandup = () => { };

        if (activeTeamId) {
            unsubStandup = api.subscribeToActiveStandup(activeTeamId, (session: any) => {
                setActiveStandup(session);
                if (session) {
                    setSessionTitle(session.title);
                    setSessionDate(session.selectedDate);
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }

        return () => {
            unsubMembers();
            unsubStandup();
        };
    }, [user.teamId, user.role, adminSelectedTeamId]);

    const submittedUserIds = new Set(responses.map(r => r.userId));
    const pendingMembers = teamMembers.filter(member => !submittedUserIds.has(member.id));

    useEffect(() => {
        if (!activeStandup) return;
        const unsubscribe = api.subscribeToStandupResponses(activeStandup.id, (data) => {
            setResponses(data);
        });
        return () => unsubscribe();
    }, [activeStandup]);

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const activeTeamId = user.role === UserRole.ADMIN ? adminSelectedTeamId : user.teamId;
            if (!activeTeamId) return;

            await api.createStandupSession({
                teamId: activeTeamId,
                title: sessionTitle || 'Daily Hub Sync',
                selectedDate: sessionDate
            });

            setShowCreateModal(false);
            setSessionTitle('');
        } catch (e) {
            console.error("Failed to schedule sync", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeStandup || !responseMessage.trim()) return;

        setIsSubmitting(true);
        try {
            if (editingResponseId) {
                await api.updateStandupResponse(activeStandup.id, editingResponseId, responseMessage);
                setEditingResponseId(null);
            } else {
                await api.submitStandupResponse(activeStandup.id, responseMessage);
            }
            setResponseMessage('');
        } catch (e) {
            console.error("Failed to send update", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteResponse = async (responseId: string) => {
        if (!activeStandup || !confirm("Archive this status update?")) return;
        await api.deleteStandupResponse(activeStandup.id, responseId);
    };

    const myResponse = responses.find(r => r.userId === user.id);

    const startEditResponse = (r: StandupResponse) => {
        setResponseMessage(r.message);
        setEditingResponseId(r.id);
    };

    if (isLoading) return <div className="p-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-accent rounded-full border-t-transparent mx-auto"></div></div>;

    return (
        <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            
            {/* SaaS Standup Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
                <div>
                    <h1 className="text-3xl font-bold  text-foreground">Asynchronous Standups</h1>
                    <p className="text-muted-foreground text-sm mt-1">Daily status reports, bottlenecks, and team alignment tracking.</p>
                </div>
                {isLeader && (
                    <div className="flex items-center gap-4">
                        {user.role === UserRole.ADMIN && (
                            <select 
                                value={adminSelectedTeamId}
                                onChange={(e) => setAdminSelectedTeamId(e.target.value)}
                                className="saas-input h-12 px-4 rounded-xl text-sm font-bold max-w-[200px]"
                            >
                                <option value={`admin_global_${user.branchId}`}>Global Ops</option>
                                {allTeams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        )}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="saas-button-primary h-12 px-8 flex items-center justify-center gap-3 shadow-lg shadow-accent/20 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Establish New Session</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-xl saas-card bg-card p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                   <ShieldCheck className="w-4 h-4 text-accent" />
                                   <p className="text-[10px] font-bold text-accent   ">Node Allocation v4.1</p>
                                </div>
                                <h2 className="text-3xl font-bold text-foreground  ">Initialize Standup</h2>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2.5 rounded-xl hover:bg-muted transition-all text-muted-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSession} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-muted-foreground   pl-1 ">Institutional Label</label>
                                <input
                                    type="text"
                                    value={sessionTitle}
                                    onChange={(e) => setSessionTitle(e.target.value)}
                                    placeholder="Briefing Identifier"
                                    className="saas-input h-14 font-bold "
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-muted-foreground   pl-1 ">Operational Date</label>
                                <input
                                    type="date"
                                    value={sessionDate}
                                    onChange={(e) => setSessionDate(e.target.value)}
                                    className="saas-input h-14 font-bold cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full saas-button-primary h-14 text-sm font-bold  "
                            >
                                {isSaving ? 'Processing...' : 'Authorize Session'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!activeStandup ? (
                <div className="flex flex-col items-center justify-center py-32 saas-card bg-card/20 border-dashed space-y-6">
                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center border border-border/50">
                        <Calendar className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-1 text-center">
                        <h3 className="text-lg font-bold text-muted-foreground  tracking-[0.2em] leading-none mb-2">Sync Wave Inactive</h3>
                        <p className="text-xs text-muted-foreground/60 font-medium  max-w-xs mx-auto">
                            {isLeader ? "Establish a new hub session to begin tracking team movements." : "Waiting for institutional node to establish active session."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    <div className="lg:col-span-8 space-y-10">

                        {/* Session Overview Card */}
                        <div className="saas-card p-8 md:p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 font-bold text-foreground/[0.02] text-8xl    leading-none select-none group-hover:text-accent/[0.04] transition-all">SYNC</div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
                                             <Clock className="w-5 h-5" />
                                         </div>
                                         <span className="text-[10px] font-bold text-muted-foreground   ">
                                             {activeStandup.selectedDate ? new Date(activeStandup.selectedDate).toLocaleDateString() : 'Active Window'}
                                         </span>
                                    </div>
                                    {isLeader && (
                                        <button 
                                            onClick={async () => {
                                                if (confirm("Are you sure you want to delete this entire standup session?")) {
                                                    await api.deleteStandupSession(activeStandup.id);
                                                    setActiveStandup(null);
                                                }
                                            }}
                                            className="p-2 bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                                            title="Delete Standup Session"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold text-foreground  leading-none ">{activeStandup.title}</h2>
                                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/30">
                                    <div className="flex items-center gap-4 bg-muted/50 px-4 py-2 rounded-xl border border-border shadow-sm">
                                        <span className="text-[10px] font-bold   text-muted-foreground ">Coverage</span>
                                        <span className="text-sm font-bold text-accent  leading-none">{responses.length} / {teamMembers.length}</span>
                                    </div>
                                    <div className="hidden sm:block w-px h-8 bg-border/50" />
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold   text-muted-foreground ">Node Status</span>
                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-bold   border ${pendingMembers.length === 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-accent/10 text-accent border-accent/20 animate-pulse'}`}>
                                            {pendingMembers.length === 0 ? 'Consensus Reached' : 'Active Calibration'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submission Panel */}
                        {(!myResponse || editingResponseId) && (
                            <div className="saas-card p-8 md:p-10 bg-accent/[0.02] border-accent/20 shadow-xl shadow-accent/[0.02] animate-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-4 mb-8">
                                    <Edit2 className="w-4 h-4 text-accent" />
                                    <h3 className="text-[10px] font-bold text-foreground   ">{editingResponseId ? 'Refine Briefing' : 'Submit Operational Status'}</h3>
                                </div>
                                <textarea
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    placeholder="Report operational progress, blockers, and objective trajectories..."
                                    className="saas-input w-full min-h-[160px] p-8 text-sm font-medium  resize-none"
                                />
                                <div className="flex justify-end gap-6 mt-8">
                                    {editingResponseId && (
                                        <button onClick={() => { setEditingResponseId(null); setResponseMessage(''); }} className="text-muted-foreground hover:text-foreground text-[10px] font-bold   transition-all  underline underline-offset-4 decoration-border">Cancel Update</button>
                                    )}
                                    <button
                                        onClick={handleSubmitResponse}
                                        disabled={isSubmitting || !responseMessage.trim()}
                                        className="saas-button-primary h-12 px-10 text-[10px] font-bold   shadow-lg shadow-accent/20 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Processing...' : 'Deploy Update'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Update Stream */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 px-2 mb-8">
                                <h3 className="text-[10px] font-bold   text-muted-foreground ">Consolidated Reports</h3>
                                <div className="flex-1 h-px bg-border/50" />
                            </div>

                            {responses.length === 0 ? (
                                <div className="text-center py-24 saas-card bg-muted/5 border-dashed border-border/50">
                                    <p className="text-muted-foreground/40 text-[10px] font-bold   ">Awaiting first institutional report</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {responses.map((response) => (
                                        <div key={response.id} className="saas-card p-6 md:p-8 group bg-card transition-all duration-300 hover:border-accent/40 shadow-sm hover:shadow-xl hover:shadow-accent/5">
                                            <div className="flex items-start gap-6">
                                                <div className="shrink-0">
                                                    <img src={response.userAvatar} className="w-12 h-12 rounded-xl object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 border border-border" />
                                                </div>
                                                <div className="flex-1 space-y-5">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-lg font-bold text-foreground   mb-1">{response.userName}</h4>
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span className="text-[9px] font-bold   ">{new Date(response.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                        {user.id === response.userId && (
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => startEditResponse(response)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-accent transition-all"><Edit2 className="w-4 h-4" /></button>
                                                                <button onClick={() => handleDeleteResponse(response.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-[13px] font-medium text-muted-foreground leading-relaxed  border-l-2 border-accent/20 pl-6 py-1">
                                                        {response.message}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Panels */}
                    <div className="lg:col-span-4 space-y-10">

                        {/* Missing Verification Panel */}
                        {isLeader && pendingMembers.length > 0 && (
                            <div className="saas-card bg-accent/[0.02] border-accent/30 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <BellRing className="w-5 h-5 text-accent animate-bounce" />
                                    <h3 className="text-lg font-bold  text-foreground ">Unverified Nodes</h3>
                                </div>
                                <div className="space-y-3">
                                    {pendingMembers.map(member => (
                                        <div key={member.id} className="flex items-center gap-4 bg-muted/40 p-4 rounded-xl border border-border/50 transition-all hover:bg-muted/80 group/member">
                                            <div className="w-8 h-8 rounded-lg bg-card border border-border overflow-hidden grayscale group-hover/member:grayscale-0 transition-all">
                                                <img src={member.avatar} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground    truncate flex-1">{member.name}</span>
                                            <span className="text-[8px] font-bold text-accent  animate-pulse">Pending</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Status Index */}
                        <div className="saas-card p-8">
                            <h3 className="text-[10px] font-bold   text-muted-foreground  mb-10 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                                Coverage Index
                            </h3>
                            <div className="space-y-5">
                                {responses.map(r => (
                                    <div key={r.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <img src={r.userAvatar} className="w-7 h-7 rounded-lg grayscale group-hover:grayscale-0 transition-all border border-border" />
                                            <span className="text-[10px] font-bold text-muted-foreground    group-hover:text-foreground transition-colors">{r.userName}</span>
                                        </div>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shadow-sm" />
                                    </div>
                                ))}
                                {responses.length === 0 && (
                                    <p className="text-[10px] font-bold text-muted-foreground/30    text-center py-4">Index Empty</p>
                                )}
                            </div>

                            <div className="mt-10 pt-8 border-t border-border/50 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground   ">
                                    <span>Sync Progress</span>
                                    <span className="text-accent ">{Math.round((responses.length / (teamMembers.length || 1)) * 100)}%</span>
                                </div>
                                <div className="h-1 bg-muted rounded-full overflow-hidden">
                                     <div className="h-full bg-accent shadow-lg shadow-accent/40 transition-all duration-1000" style={{ width: `${(responses.length / (teamMembers.length || 1)) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Standup;
