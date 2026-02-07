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
    BellRing
} from 'lucide-react';

interface StandupProps {
    user: User;
}

const Standup: React.FC<StandupProps> = ({ user }) => {
    // State
    const [activeStandup, setActiveStandup] = useState<StandupSession | null>(null);
    const [responses, setResponses] = useState<StandupResponse[]>([]);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Leader Actions
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    // Member Actions
    const [responseMessage, setResponseMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingResponseId, setEditingResponseId] = useState<string | null>(null);

    const isLeader = user.role === UserRole.TEAM_LEADER || user.role === UserRole.ADMIN;

    // Initial Data Load
    useEffect(() => {
        loadData();
    }, [user.teamId, user.role]);

    // Construct Pending List
    const submittedUserIds = new Set(responses.map(r => r.userId));
    const pendingMembers = teamMembers.filter(member => !submittedUserIds.has(member.id));

    const loadData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                loadActiveStandup(),
                loadTeamMembers()
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTeamMembers = async () => {
        try {
            const members = await api.getUsers();
            setTeamMembers(members);
        } catch (e) {
            console.error("Failed to load members", e);
        }
    };

    const loadActiveStandup = async () => {
        try {
            const teamId = user.teamId || (user.role === UserRole.ADMIN ? 'admin_global' : null);
            if (teamId) {
                const session = await api.getActiveStandup(teamId);
                setActiveStandup(session);
                // Pre-fill form if editing
                if (session) {
                    setSessionTitle(session.title);
                    setSessionDate(session.selectedDate);
                }
            }
        } catch (e) {
            console.error("Failed to load standup", e);
        }
    };

    // Real-time responses
    useEffect(() => {
        if (!activeStandup) return;
        const unsubscribe = api.subscribeToStandupResponses(activeStandup.id, (data) => {
            setResponses(data);
        });
        return () => unsubscribe();
    }, [activeStandup]);

    // Handlers
    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const teamId = user.teamId || (user.role === UserRole.ADMIN ? 'admin_global' : null);
            if (!teamId) return;

            // If active standup exists, we are essentially 'updating' or 'overwriting' it for this logic
            // But API might support update. Let's check API capabilities.
            // existing code used createStandupSession for new.

            await api.createStandupSession({
                teamId,
                title: sessionTitle || 'Daily Standup',
                selectedDate: sessionDate
            });

            await loadActiveStandup();
            setShowCreateModal(false);
            setSessionTitle('');
        } catch (e) {
            alert("Failed to schedule standup");
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
            alert("Failed to send update");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteResponse = async (responseId: string) => {
        if (!activeStandup || !confirm("Delete this update?")) return;
        await api.deleteStandupResponse(activeStandup.id, responseId);
    };

    const myResponse = responses.find(r => r.userId === user.id);

    // Edit Logic
    const startEditResponse = (r: StandupResponse) => {
        setResponseMessage(r.message);
        setEditingResponseId(r.id);
    };

    if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-emerald-500 rounded-full border-t-transparent"></div></div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 min-h-screen">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Daily Standup</h1>
                    <p className="text-zinc-500 font-medium text-sm">Sync with your team, track progress, and unblock blockers.</p>
                </div>

                {isLeader && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        {activeStandup ? 'Schedule New' : 'Create Standup'}
                    </button>
                )}
            </div>

            {/* Create Standup Modal (Leader Only) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black uppercase tracking-tight">Schedule Standup</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full w-fit">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSession} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={sessionTitle}
                                    onChange={(e) => setSessionTitle(e.target.value)}
                                    placeholder="e.g. Morning Sync"
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Publish Date</label>
                                <input
                                    type="date"
                                    value={sessionDate}
                                    onChange={(e) => setSessionDate(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Scheduling...' : 'Confirm Schedule'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Interface */}
            {!activeStandup ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                        <Calendar className="w-10 h-10 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-black uppercase text-zinc-400 tracking-widest">No Active Standup</h3>
                    <p className="text-zinc-500 mt-2 text-sm font-medium">
                        {isLeader ? "Create a new session to get started." : "Waiting for the team leader to schedule a standup."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Input & Feed */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Session Header Card */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2 opacity-80">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        Scheduled For: {activeStandup.selectedDate ? new Date(activeStandup.selectedDate).toLocaleDateString() : 'Today'}
                                    </span>
                                </div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{activeStandup.title}</h2>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold">
                                        {responses.length} / {teamMembers.length} Submitted
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold">
                                        {pendingMembers.length} Pending
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                        </div>

                        {/* Submission Area (If user hasn't submitted OR is editing) */}
                        {(!myResponse || editingResponseId) && (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <Edit2 className="w-4 h-4 text-emerald-500" />
                                    {editingResponseId ? 'Edit Response' : 'Submit Your Update'}
                                </h3>
                                <textarea
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    placeholder="What did you work on yesterday? What are you working on today? Any blockers?"
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 min-h-[120px] mb-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-y text-zinc-900 dark:text-white"
                                />
                                <div className="flex justify-end gap-3">
                                    {editingResponseId && (
                                        <button
                                            onClick={() => { setEditingResponseId(null); setResponseMessage(''); }}
                                            className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSubmitResponse}
                                        disabled={isSubmitting || !responseMessage.trim()}
                                        className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Posting...' : 'Post Update'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Responses Feed */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-2">Team Responses</h3>
                            {responses.length === 0 ? (
                                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                    <p className="text-zinc-400 text-sm font-medium">No updates posted yet.</p>
                                </div>
                            ) : (
                                responses.map(response => (
                                    <div key={response.id} className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-[2rem] hover:shadow-lg hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                                        <div className="flex items-start gap-4">
                                            <img src={response.userAvatar || `https://ui-avatars.com/api/?name=${response.userName}`} alt="avatar" className="w-12 h-12 rounded-full object-cover bg-zinc-100" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-zinc-900 dark:text-white">{response.userName}</h4>
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                                            {new Date(response.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    {user.id === response.userId && (
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditResponse(response)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDeleteResponse(response.id)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-3 text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl">
                                                    {response.message}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Stats & Missing - Only Visible to Leader for detailed view, but everyone can see basic stats */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Leader Notification Box for Missing Responses */}
                        {isLeader && pendingMembers.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-500/20 rounded-[2rem] p-6 animate-pulse-slow">
                                <div className="flex items-center gap-3 mb-4 text-red-500">
                                    <BellRing className="w-6 h-6 fill-current" />
                                    <h3 className="text-sm font-black uppercase tracking-widest">Action Required</h3>
                                </div>
                                <p className="text-xs font-bold text-red-400 mb-6 uppercase tracking-wider leading-relaxed">
                                    The following members have not submitted their daily update yet.
                                </p>
                                <div className="space-y-3">
                                    {pendingMembers.map(member => (
                                        <div key={member.id} className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{member.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Approved / Completed List */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Completed ({responses.length})
                            </h3>
                            <div className="space-y-3">
                                {responses.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                        <img src={r.userAvatar} className="w-6 h-6 rounded-full" alt="" />
                                        <span className="text-xs font-bold truncate text-zinc-900 dark:text-white">{r.userName}</span>
                                    </div>
                                ))}
                                {responses.length === 0 && <span className="text-xs text-zinc-400">No submissions yet.</span>}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Standup;
