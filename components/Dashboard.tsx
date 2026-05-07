import React, { useState, useEffect } from 'react';
import { User, Poll, ScheduleEvent, UserRole } from '../types.ts';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  ArrowUpRight,
  Clock,
  Zap,
  X,
  Search,
  CheckCircle,
  Ticket,
  Activity,
  Calendar,
  ChevronRight,
  TrendingUp,
  Globe,
  MoreHorizontal,
  Plus,
  Sparkles,
  Command,
  Layout,
  Layers,
  Target,
  ShieldAlert,
  RotateCcw,
  Copy,
  Loader2,
  Key,
  Lock,
  Mail,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]); 

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ users: 0, openTickets: 0, messages: 0 });
  const [myTeam, setMyTeam] = useState<any | null>(null);
  const [branch, setBranch] = useState<{ name: string, passkey: string } | null>(null);

  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPasskey, setNewTeamPasskey] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const isLeader = user.role === UserRole.TEAM_LEADER || user.role === 'TEAM_LEADER';

  useEffect(() => {
    const unsubUsers = api.subscribeToUsers((users: any[]) => {
      setAllUsers(users);
      setStats(prev => ({ ...prev, users: users.length }));
    });

    const unsubSchedule = api.subscribeToSchedule((events: any[]) => {
      const sorted = events.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setSchedules(sorted);
    });

    const unsubTickets = api.subscribeToTickets((tickets: any[]) => {
      const openCount = tickets.filter((t: any) => t.status !== 'COMPLETE').length;
      setStats(prev => ({ ...prev, openTickets: openCount }));
    });

    const unsubMessages = api.subscribeToMessages((msgs: any[]) => {
      setStats(prev => ({ ...prev, messages: msgs.length }));
    });

    const unsubPolls = api.subscribeToPolls((p: any[]) => {
      setPolls(p);
    });

    if (isLeader) {
      api.getMyTeam().then(setMyTeam).catch(() => { });
      api.getMyBranch().then(setBranch).catch(() => { });
    }

    return () => {
      unsubUsers();
      unsubSchedule();
      unsubTickets();
      unsubMessages();
      unsubPolls();
    };
  }, [user.role, user.teamId, isLeader]);

  useEffect(() => {
    if (user.role === UserRole.TEAM_LEADER && !user.teamId) {
      setShowCreateTeam(true);
    }
  }, [user]);

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;

    try {
      await api.createTeam(newTeamName, newTeamPasskey);
      window.location.reload();
    } catch (err: any) {
      console.error(err.message);
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
    try {
      await api.approveMemberRequest(memberId);
      setAllUsers(prev => prev.map(u => u.id === memberId ? { ...u, isApproved: true } : u));
    } catch (e: any) {
      console.error("Approval failed: " + e.message);
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
    } catch (e: any) {
      console.error("Update failed: " + e.message);
    } finally {
      setIsUpdatingKey(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4 px-1">
        <div className="space-y-2 text-center md:text-left">
           <div className="flex items-center gap-2 justify-center md:justify-start">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Operational Overview</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground leading-tight tracking-tight">
              Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}</span>.
           </h1>
           <p className="text-muted-foreground text-base max-w-md">Your workspace is performing at <span className="text-foreground font-semibold">98.4% efficiency</span>. Ready for new insights?</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
           <button onClick={() => navigate('/chat')} className="saas-button-outline shadow-sm group">
              <Command className="w-3.5 h-3.5 mr-2 text-muted-foreground group-hover:text-accent transition-colors" />
              Quick Command
           </button>
           <button className="saas-button-primary shadow-xl shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              New Deployment
           </button>
        </div>
      </div>

      {/* Stunning Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Verified Personnel', value: `${stats.users}`, icon: Users, color: 'text-primary', bg: 'bg-primary/10', trend: '+12%' },
          { label: 'Open Objectives', value: `${stats.openTickets}`, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'Live' },
          { label: 'System Pulsar', value: `${stats.messages}`, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '9ms' },
          { label: 'Sync Status', value: 'NOMINAL', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-500/10', trend: 'Online' },
        ].map((item, i) => (
          <div key={i} className="saas-card p-6 flex flex-col justify-between min-h-[160px] group cursor-pointer overflow-hidden transition-all duration-500 relative">
            <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} blur-3xl rounded-full translate-x-12 -translate-y-12 opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-center justify-between relative z-10">
              <div className={`w-12 h-12 ${item.bg} border border-${item.color}/10 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <span className={`text-[10px] font-bold ${item.color} bg-${item.color}/5 px-2 py-1 rounded-lg border border-${item.color}/10`}>{item.trend}</span>
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">{item.label}</p>
              <h2 className="text-3xl font-display font-bold text-foreground mt-1 group-hover:translate-x-1 transition-transform duration-500">{item.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Team Access Key Banner */}
      {isLeader && (
        <div className="saas-card p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 border-accent/20 bg-accent/[0.02]">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
              <Key className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Workspace Access Key</h3>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Global key required for new members to join this workspace branch.</p>
            </div>
          </div>

          <div className="flex w-full lg:w-auto items-center gap-2 bg-background border border-border rounded-lg p-1.5 shadow-sm ml-auto">
            <input
              type="text"
              value={myTeam ? teamPasskeyInput : ''}
              onChange={(e) => myTeam && setTeamPasskeyInput(e.target.value.toUpperCase())}
              placeholder={myTeam ? "KEY_..." : "Requires Node Init..."}
              disabled={!myTeam}
              className="bg-transparent border-none text-sm font-mono font-bold text-foreground focus:ring-0 px-4 w-48 disabled:opacity-50"
            />
            <button
              onClick={myTeam ? handleUpdateKey : () => setShowCreateTeam(true)}
              disabled={isUpdatingKey || (myTeam && teamPasskeyInput === myTeam.passkey)}
              className="saas-button-primary h-8 px-4 text-xs font-bold whitespace-nowrap"
            >
              {isUpdatingKey ? 'Updating...' : myTeam ? 'Update Key' : 'Generate Key'}
            </button>
          </div>
        </div>
      )}

      {/* Advanced Dashboard Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Core Timeline Activity */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
               <Layers className="w-5 h-5 text-accent" />
               <h3 className="text-2xl font-display font-bold text-foreground">Operational Nodes</h3>
            </div>
            <Link to="/schedule" className="saas-button-outline text-xs h-8">View Master List</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.slice(0, 4).map((s, i) => (
              <div key={s.id} className="saas-card p-6 border-transparent bg-gradient-to-br from-card to-muted/30 hover:to-accent/5 hover:border-accent/10 transition-all duration-300 group">
                 <div className="flex items-start justify-between mb-6">
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-background border border-border shadow-sm rounded-2xl group-hover:border-accent/30 transition-colors">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(s.date).toLocaleString('default', { month: 'short' })}</span>
                       <span className="text-xl font-display font-bold text-foreground leading-none">{new Date(s.date).getDate()}</span>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl border border-emerald-500/10">
                       <CheckCircle className="w-4 h-4" />
                    </div>
                 </div>
                 <h4 className="text-lg font-bold text-foreground group-hover:gradient-text transition-all duration-300">{s.title}</h4>
                 <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                       <Clock className="w-3.5 h-3.5" />
                       {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                       <Globe className="w-3.5 h-3.5" />
                       {s.location}
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Console Side Panel */}
        <div className="xl:col-span-4 space-y-8">
           <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                 <h3 className="text-xl font-display font-bold text-foreground">Unit Configuration</h3>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Secure Link</span>
                 </div>
              </div>

              {myTeam ? (
                 <div className="saas-card p-8 border-transparent bg-gradient-to-b from-card to-accent/[0.03] relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
                    <div className="space-y-8 relative z-10">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/10">
                             <Command className="w-7 h-7 text-accent" />
                          </div>
                          <div>
                             <h4 className="text-xl font-display font-bold text-foreground">{myTeam.name}</h4>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Primary Cell Node</p>
                          </div>
                       </div>
                       
                    </div>
                 </div>
              ) : (
                 <div className="saas-card p-12 flex flex-col items-center justify-center text-center border-dashed border-accent/20 bg-accent/[0.02]">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                       <Globe className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-bold text-foreground mb-2">Unlinked Session</p>
                    <p className="text-xs text-muted-foreground mb-8 max-w-[200px]">Your identity is not currently bound to an operational unit.</p>
                    <button onClick={() => setShowCreateTeam(true)} className="saas-button-outline w-full h-12">Initialize Primary Node</button>
                 </div>
              )}
           </div>

           <button onClick={() => setShowPersonnelModal(true)} className="saas-button-secondary w-full h-14 bg-muted/40 hover:bg-muted/60 border border-border/40 group">
             <div className="flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-card rounded-xl border border-border group-hover:border-accent/40 transition-colors">
                      <Users className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
                   </div>
                   <span className="text-sm font-bold">Personnel Manifest</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
             </div>
           </button>
        </div>
      </div>

      {/* Critical Alerts Strip */}
      {pendingMembers.length > 0 && (
        <div className="saas-card p-1 mt-10 border-transparent bg-linear-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 animate-pulse">
           <div className="bg-card w-full p-6 flex flex-col md:flex-row items-center justify-between gap-6 rounded-[calc(var(--radius-xl)-1px)] overflow-hidden relative">
              <div className="absolute left-0 inset-y-0 w-1 bg-amber-500" />
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                    <ShieldAlert className="w-8 h-8 text-amber-500" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-lg font-bold text-foreground">Pending Authorization</p>
                    <p className="text-sm text-muted-foreground"><span className="text-amber-500 font-bold">{pendingMembers.length} recruits</span> are awaiting clearance to join the workspace.</p>
                 </div>
              </div>
               <div className="flex items-center gap-3">
                 <button onClick={() => setShowPersonnelModal(true)} className="saas-button-outline h-11 border-border/50 text-foreground bg-transparent">Review Files</button>
                 <button onClick={() => handleApproveMember(pendingMembers[0].id, pendingMembers[0].name)} className="saas-button-primary h-11 bg-amber-500 hover:bg-orange-600 border-none px-8">Quick Approve</button>
              </div>
           </div>
        </div>
      )}

      {/* Advanced Personnel Modal */}
       {showPersonnelModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="relative saas-card w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in-95 overflow-hidden shadow-2xl border-accent/20">
              <div className="p-10 border-b border-border/50 flex items-center justify-between bg-card/10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl" />
                 <div className="relative z-10">
                    <h2 className="text-4xl font-display font-bold text-foreground leading-none">Personnel Registry</h2>
                    <p className="text-sm text-muted-foreground mt-4 font-medium flex items-center gap-2">
                       <Globe className="w-4 h-4" /> Global biometric verified identity manifest.
                    </p>
                 </div>
                 <button onClick={() => setShowPersonnelModal(false)} className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted/80 backdrop-blur-md rounded-2xl border border-border/50 transition-all">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="p-6 bg-muted/5 border-b border-border/50">
                 <div className="relative group max-w-lg mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search biometric nodes or designations..."
                      className="saas-input pl-12 h-14 rounded-2xl text-base border-border/50 bg-background/80 shadow-inner"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-500/5">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((u, i) => (
                      <div key={u.id} className="saas-card overflow-hidden hover:border-accent/30 group/card p-2 bg-gradient-to-br from-card to-muted/20">
                         <div className="p-6 flex flex-col items-center text-center space-y-5">
                            <div className="relative cursor-pointer group/avatar" onClick={() => setSelectedUser(u)}>
                               <div className="absolute inset-0 bg-accent blur-xl opacity-0 group-hover/card:opacity-20 transition-opacity" />
                               <img src={u.avatar} className="w-20 h-20 rounded-3xl object-cover relative z-10 border-2 border-border group-hover/card:border-accent/40 transition-all duration-500" alt="" />
                               <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-card ${u.isApproved ? (u.isActive ? 'bg-emerald-500' : 'bg-muted-foreground') : 'bg-amber-500 animate-pulse'} z-20`} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-lg font-bold text-foreground truncate flex items-center justify-center gap-2">
                                  {u.name}
                                  <div className="flex gap-1">
                                     {u.linkedinId && <Globe className="w-3 h-3 text-[#0077b5]" />}
                                     {u.githubId && <Briefcase className="w-3 h-3 text-muted-foreground" />}
                                  </div>
                               </h4>
                               <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mt-2 bg-accent/5 px-3 py-1 rounded-full border border-accent/10 inline-block">{u.role}</p>
                            </div>
                            <div className="w-full h-px bg-border/50" />
                            <div className="flex items-center justify-between w-full px-2">
                               <span className="text-[10px] font-bold text-muted-foreground">{u.email.split('@')[0]}@**</span>
                               {!u.isApproved && isLeader && u.role === UserRole.MEMBER ? (
                                  <button onClick={() => handleApproveMember(u.id, u.name)} className="text-[10px] font-bold text-amber-500 px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all">Approve</button>
                               ) : (
                                  <button onClick={() => setSelectedUser(u)} className="text-[10px] font-bold text-accent px-4 py-2 bg-accent/5 rounded-xl border border-accent/10 hover:bg-accent hover:text-white transition-all">Node File</button>
                               )}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* NEW: Create Team Node Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="relative saas-card w-full max-w-md animate-in zoom-in-95 overflow-hidden shadow-2xl border-accent/20 p-8">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-2xl font-display font-bold text-foreground">Initialize Node</h3>
                    <p className="text-xs text-muted-foreground mt-1">Bind your identity to a primary operational unit.</p>
                 </div>
                 <button onClick={() => setShowCreateTeam(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <form onSubmit={handleCreateTeamSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Team Designation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ALPHA NODE"
                      required
                      className="saas-input h-12"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Initial Access Passkey</label>
                    <input 
                      type="text" 
                      placeholder="SET_SECURE_KEY_01"
                      required
                      className="saas-input h-12 font-mono"
                      value={newTeamPasskey}
                      onChange={(e) => setNewTeamPasskey(e.target.value.toUpperCase())}
                    />
                    <p className="text-[10px] text-muted-foreground px-1">Members will need this key to join your unit.</p>
                 </div>

                 <button type="submit" className="saas-button-primary w-full h-12 shadow-xl shadow-accent/20">
                    Establish Connection
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Selected User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="relative saas-card w-full max-w-2xl animate-in zoom-in-95 overflow-hidden shadow-2xl border-accent/20">
              <div className="p-8 border-b border-border/50 flex items-center justify-between bg-card/10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl" />
                 <div className="relative z-10 flex items-center gap-6">
                    <img src={selectedUser.avatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-border" alt="" />
                    <div>
                       <h2 className="text-3xl font-display font-bold text-foreground">{selectedUser.name}</h2>
                       <p className="text-sm font-bold text-accent uppercase tracking-widest mt-1 bg-accent/10 px-3 py-1 rounded-full inline-block border border-accent/20">{selectedUser.role}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 backdrop-blur-md rounded-xl border border-border/50 transition-all z-20">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 space-y-6 bg-muted/5">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1 p-4 bg-card rounded-xl border border-border shadow-sm">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Designation</span>
                       <span className="text-sm font-bold text-foreground flex items-center gap-2">
                         <Mail className="w-4 h-4 text-muted-foreground" />
                         {selectedUser.email}
                       </span>
                    </div>
                    <div className="flex flex-col gap-1 p-4 bg-card rounded-xl border border-border shadow-sm">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Clearance Level</span>
                       <span className="text-sm font-bold text-foreground flex items-center gap-2">
                         <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                         {selectedUser.isApproved ? 'Authorized' : 'Pending Review'}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-border/50">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Connected Networks</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-xl">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#0077b5]/10 rounded-lg flex items-center justify-center border border-[#0077b5]/20 shadow-sm">
                             <Globe className="w-5 h-5 text-[#0077b5]" />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-muted-foreground tracking-wider leading-none">LinkedIn Profile</p>
                             {selectedUser.linkedinId ? (
                                <a href={`https://${selectedUser.linkedinId.replace('https://', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground mt-1 hover:text-[#0077b5] transition-colors">{selectedUser.linkedinId}</a>
                             ) : (
                                <p className="text-sm font-medium text-muted-foreground mt-1">Not connected</p>
                             )}
                          </div>
                       </div>
                       {selectedUser.linkedinId && <ChevronRight className="w-4 h-4 text-muted-foreground/20" />}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-xl">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border shadow-sm">
                             <Briefcase className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-muted-foreground tracking-wider leading-none">GitHub Profile</p>
                             {selectedUser.githubId ? (
                                <a href={`https://${selectedUser.githubId.replace('https://', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground mt-1 hover:text-accent transition-colors">{selectedUser.githubId}</a>
                             ) : (
                                <p className="text-sm font-medium text-muted-foreground mt-1">Not connected</p>
                             )}
                          </div>
                       </div>
                       {selectedUser.githubId && <ChevronRight className="w-4 h-4 text-muted-foreground/20" />}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
