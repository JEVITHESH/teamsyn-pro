
import React, { useState, useEffect } from 'react';
import { User, Poll, ScheduleEvent, UserRole } from '../types.ts';
import { MOCK_POLLS, MOCK_SCHEDULES } from '../constants.tsx';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  ArrowUpRight,
  Clock,
  Zap,
  X,
  User as UserIcon,
  Search,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  // We keep polls/schedules mocked for now as user just asked for "functionality", and we prioritized core stack.
  // But we will fetch REAL stats for Users and Messages.
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>(MOCK_POLLS); // Keeping polls mocked/optional validation for now as per requirement focus on tickets/reminders/chat

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ users: 0, openTickets: 0, messages: 0 });
  const [myTeam, setMyTeam] = useState<any | null>(null);

  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPasskey, setNewTeamPasskey] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Stats
        const fetchedStats = await api.getStats();
        setStats(fetchedStats);

        // Fetch Schedules
        const fetchedSchedules = await api.getSchedule();
        // Sort by date upcoming
        const sorted = fetchedSchedules.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSchedules(sorted);

        // Fetch Users for Modal
        const fetchedUsers = await api.getUsers().catch(() => []);
        setAllUsers(fetchedUsers);

        // Fetch My Team (If Leader)
        const isLeader = user.role === UserRole.TEAM_LEADER || user.role === 'TEAM_LEADER';
        if (isLeader) {
          const team = await api.getMyTeam();
          setMyTeam(team);
        }

      } catch (e) {
        console.error("Dashboard fetch error", e);
      }
    };

    fetchData();
    fetchData();
  }, [user.role, user.teamId]); // Re-run if teamId changes (e.g. after creation)

  // Trigger Create Team Modal for Leaders without Team
  useEffect(() => {
    if (user.role === UserRole.TEAM_LEADER && !user.teamId) {
      setShowCreateTeam(true);
    }
  }, [user]);

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;

    try {
      const res = await api.createTeam(newTeamName, newTeamPasskey);
      alert(`Team Created Successfully! your team passkey is ${res.passkey}`);
      // Force reload or update local state could be better, but a reload ensures everything syncs.
      // For now, let's just create a temp updated user object or location.reload()
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingMembers = allUsers.filter(u =>
    !u.isApproved &&
    u.role === UserRole.MEMBER &&
    (myTeam && u.teamId === myTeam.id)
  );

  const handleApproveMember = async (memberId: string, memberName: string) => {
    if (confirm(`Approve access for ${memberName}?`)) {
      try {
        await api.approveMemberRequest(memberId);
        // Optimistic update
        setAllUsers(prev => prev.map(u => u.id === memberId ? { ...u, isApproved: true } : u));
        alert(`${memberName} approved!`);
      } catch (e: any) {
        alert("Approval failed: " + e.message);
      }
    }
  };

  const [teamPasskeyInput, setTeamPasskeyInput] = useState('');
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);

  useEffect(() => {
    if (myTeam) {
      setTeamPasskeyInput(myTeam.passkey);
    }
  }, [myTeam]);

  const handleUpdateKey = async () => {
    if (!myTeam) return;
    setIsUpdatingKey(true);
    try {
      await api.updateTeam(myTeam.id, { passkey: teamPasskeyInput });
      setMyTeam({ ...myTeam, passkey: teamPasskeyInput });
      alert("Unit Access Credential Updated");
    } catch (e: any) {
      alert("Update failed: " + e.message);
    } finally {
      setIsUpdatingKey(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ... header ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase leading-none">Operational Overview</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium italic mt-2">Status: Terminal Connection Verified.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/tickets" className="flex-1 md:flex-none text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-zinc-50 transition-all">
            Tickets
          </Link>
          <Link to="/chat" className="flex-1 md:flex-none text-center bg-zinc-900 dark:bg-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white dark:text-black hover:opacity-90 shadow-xl transition-all">
            Open Comms
          </Link>
        </div>
      </div>

      {/* TEAM LEADER: PENDING APPROVALS */}
      {pendingMembers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl animate-in slide-in-from-top-4 fade-in duration-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500/20 rounded-2xl"><AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse" /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-amber-500">Pending Authorization Requests</h2>
              <p className="text-amber-500/60 text-[10px] font-bold uppercase tracking-widest">{pendingMembers.length} Request(s) Awaiting Review</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingMembers.map(member => (
              <div key={member.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <img src={member.avatar} className="w-12 h-12 rounded-2xl" />
                  <div>
                    <p className="text-sm font-black uppercase text-white">{member.name}</p>
                    <p className="text-[10px] font-bold text-zinc-500">{member.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleApproveMember(member.id, member.name)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Authorize Access
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEAM LEADER: PASSKEY DISPLAY */}
      {myTeam && (user.role === UserRole.TEAM_LEADER || user.role === 'TEAM_LEADER') && (
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl animate-in slide-in-from-top-4 fade-in duration-700">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-indigo-500/20 rounded-2xl"><Users className="w-6 h-6 text-indigo-400" /></div>
                <h2 className="text-3xl font-black uppercase text-white tracking-widest">{myTeam.name}</h2>
              </div>
              <p className="text-zinc-400 text-xs max-w-lg font-medium leading-relaxed">
                Share the secure access credential below with your unit members for immediate system authorization.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 min-w-[280px]">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-3 text-center">Unit Access Credential</p>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={teamPasskeyInput}
                  onChange={e => setTeamPasskeyInput(e.target.value)}
                  className="bg-transparent text-center text-3xl font-mono font-black text-white tracking-widest border-b border-zinc-700 focus:border-indigo-500 outline-none pb-2 w-full uppercase"
                />

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setTeamPasskeyInput(Math.random().toString(36).slice(-8).toUpperCase())}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                    title="Generate Random Key"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleUpdateKey}
                    disabled={isUpdatingKey || teamPasskeyInput === myTeam.passkey}
                    className="bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                  >
                    {isUpdatingKey ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>

              <p className="text-[9px] text-center text-zinc-600 mt-3 font-bold uppercase tracking-wide">Confidential • For Internal Use Only</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* PERSONNEL STAT CARD - REAL DATA */}
        <button
          onClick={() => setShowPersonnelModal(true)}
          className="group relative bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:border-zinc-900 dark:hover:border-white text-left overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Operational Personnel</p>
          <p className="text-5xl font-black text-zinc-900 dark:text-white mt-2 tracking-tighter">{stats.users}</p>
          <div className="mt-4 flex -space-x-2">
            {allUsers.slice(0, 5).map((u, i) => (
              <img key={i} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 object-cover" alt="" />
            ))}
            {allUsers.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-black text-zinc-500">
                +{allUsers.length - 5}
              </div>
            )}
          </div>
        </button>

        {/* MESSAGES STAT CARD - REAL DATA */}
        <Link
          to="/chat"
          className="group relative bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:border-zinc-900 dark:hover:border-white text-left"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 rounded-2xl bg-amber-500 text-white group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Total Messages</p>
          <p className="text-5xl font-black text-zinc-900 dark:text-white mt-2 tracking-tighter">{stats.messages}</p>
          <p className="mt-4 text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Live Communication
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">Timeline Nodes</h2>
              <Link to="/schedule" className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 uppercase tracking-widest transition-colors">View All</Link>
            </div>
            <div className="space-y-4">
              {schedules.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl border border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="text-center min-w-[50px] sm:min-w-[60px]">
                    <p className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{new Date(s.date).getDate() || '??'}</p>
                    <p className="text-[10px] font-black text-zinc-400 uppercase">{new Date(s.date).toLocaleString('default', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight truncate">{s.title}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1 font-medium italic truncate">
                      <Clock className="w-3 h-3" /> {s.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PERSONNEL MODAL */}
      {showPersonnelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setShowPersonnelModal(false)}
          />
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border-4 border-zinc-900 dark:border-white overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Personnel</h2>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Registry access authorized</p>
              </div>
              <button
                onClick={() => setShowPersonnelModal(false)}
                className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-6 h-6 text-zinc-900 dark:text-white" />
              </button>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Filter registry..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-zinc-900 dark:hover:border-white transition-all group">
                  <div className="flex items-center gap-4">
                    <img src={u.avatar} className="w-12 h-12 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-zinc-900 transition-all" alt="" />
                    <div className="min-w-0">
                      <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">{u.name}</h4>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5 truncate">{u.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest hidden sm:inline">{u.isActive ? 'Connected' : 'Offline'}</span>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-20 text-center">
                  <UserIcon className="w-10 h-10 text-zinc-100 dark:text-zinc-800 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">Registry mismatch.</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 text-center shrink-0">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Total Registry: {allUsers.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEAM MODAL (For Leaders without Team) */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-8 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl mb-4 ring-1 ring-indigo-500/20">
                <Users className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Initialize Command</h2>
              <p className="text-zinc-400 text-xs font-medium">Authentication Verified. Please designate a Unit Identifier to proceed with system initialization.</p>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-extrabold text-[#52525B] uppercase tracking-widest ml-1">Proposed Unit ID (Team Name)</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 text-white text-sm font-bold rounded-xl py-4 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-700"
                  placeholder="e.g. ALPHA_SQUAD"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-extrabold text-[#52525B] uppercase tracking-widest ml-1">Set Access Credential (Passkey)</label>
                <input
                  type="text"
                  value={newTeamPasskey}
                  onChange={e => setNewTeamPasskey(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 text-white text-sm font-bold rounded-xl py-4 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-700"
                  placeholder="Custom Key or Leave Blank for Random"
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/20">
                Initialize Unit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
