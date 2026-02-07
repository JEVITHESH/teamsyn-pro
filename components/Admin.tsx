import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  CircleDot,
  Lock,
  RefreshCw,
  Key,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Filter,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Network,
  List,
  LayoutGrid,
  CircuitBoard,
  X
} from 'lucide-react';
import TeamHierarchy from './TeamHierarchy';
import { User, UserRole, Team } from '../types.ts';

interface AdminPanelProps {
  user: User;
}

type SortField = 'name' | 'role' | 'isApproved' | 'isActive';
type SortOrder = 'asc' | 'desc' | null;

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter States
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [accessFilter, setAccessFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Sort States
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const [systemPasskey, setSystemPasskey] = useState('');
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  useEffect(() => {
    let unsubUsers: () => void;
    let unsubTeams: () => void;

    const init = async () => {
      const branch = await api.getMyBranch();
      if (branch) {
        setSystemPasskey(branch.passkey);
        unsubUsers = api.subscribeToBranchUsers(branch.id, (data) => setUsers(data));
        unsubTeams = api.subscribeToBranchTeams(branch.id, (data) => setTeams(data));
      }
    };
    init();

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubTeams) unsubTeams();
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchTeams = async () => {
    try {
      const data = await api.getTeams();
      setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams", err);
    }
  };

  // ...





  const toggleUserApproval = async (targetUser: User) => {
    try {
      const newStatus = !targetUser.isApproved;
      // Optimistic UI Update
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isApproved: newStatus } : u));
      if (selectedUser && selectedUser.id === targetUser.id) {
        setSelectedUser(prev => prev ? { ...prev, isApproved: newStatus } : null);
      }

      await api.toggleApproval(targetUser.id, newStatus);
    } catch (err) {
      console.error("Failed to update user", err);
      fetchUsers(); // Revert on error
    }
  };

  const handlePersonnelDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      const headers = ['Name', 'Email', 'Role', 'Activity Status', 'Authorization Status'];
      const rows = users.map(u => [
        `"${u.name}"`, `"${u.email}"`, `"${u.role}"`,
        u.isActive ? 'Active' : 'Disabled',
        u.isApproved ? 'Approved' : 'Pending'
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Personnel_Registry_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }, 1000);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleUpdatePasskey = async () => {
    setIsUpdatingKey(true);
    try {
      await api.updateBranchPasskey(systemPasskey);
      alert('Branch Authorization Key Updated.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update passkey");
    } finally {
      setIsUpdatingKey(false);
    }
  };

  // Fine Filter Logic: Omni-Search + Dropdowns + Sorting
  const processedUsers = useMemo(() => {
    let result = users.filter(u => {
      // Omni-Search: checks name, email, role, and status text
      const searchStr = searchTerm.toLowerCase();
      const statusText = u.isActive ? 'active' : 'disabled';
      const gateText = u.isApproved ? 'approved' : 'pending';
      const matchesSearch =
        u.name.toLowerCase().includes(searchStr) ||
        u.email.toLowerCase().includes(searchStr) ||
        u.role.toLowerCase().includes(searchStr) ||
        statusText.includes(searchStr) ||
        gateText.includes(searchStr);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesAccess = accessFilter === 'ALL' ||
        (accessFilter === 'APPROVED' && u.isApproved) ||
        (accessFilter === 'PENDING' && !u.isApproved);
      const matchesStatus = statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.isActive) ||
        (statusFilter === 'DISABLED' && !u.isActive);

      return matchesSearch && matchesRole && matchesAccess && matchesStatus;
    });

    if (sortField && sortOrder) {
      result.sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [users, searchTerm, roleFilter, accessFilter, statusFilter, sortField, sortOrder]);

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setAccessFilter('ALL');
    setStatusFilter('ALL');
    setSortField(null);
    setSortOrder(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Command Center</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-[0.2em] text-[10px] mt-2">Registry Management Node v2.0.5</p>
        </div>
        <button
          onClick={handlePersonnelDownload}
          disabled={isExporting}
          className="bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl flex items-center gap-2"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? 'Processing Registry...' : 'Personnel Management download'}
        </button>
      </div>

      {/* SYSTEM SECURITY SECTION */}
      <section className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-500/10 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Branch Authorization Key</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Required for new Team Leaders to register under YOUR branch.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-zinc-800">
          <Key className="w-4 h-4 text-zinc-500 ml-2" />
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={systemPasskey}
              onChange={(e) => setSystemPasskey(e.target.value)}
              placeholder="ENTER KEY"
              className="bg-transparent border-none text-white font-mono font-bold text-sm focus:ring-0 w-32 placeholder:text-zinc-700"
            />
            <button
              onClick={() => setSystemPasskey(Math.random().toString(36).slice(-8).toUpperCase())}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
              title="Generate Random Key"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleUpdatePasskey}
              disabled={isUpdatingKey}
              className="bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
            >
              {isUpdatingKey ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      </section>

      {/* PENDING TEAM LEADER REQUESTS (Verified by Key, Awaiting Admin Click) */}
      {users.some(u => u.role === UserRole.TEAM_LEADER && !u.isApproved && !u.teamId) && (
        <section className="bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl animate-in slide-in-from-top-4 fade-in duration-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500/20 rounded-2xl"><ShieldAlert className="w-6 h-6 text-amber-500 animate-pulse" /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-amber-500">Pending Command Authorization</h2>
              <p className="text-amber-500/60 text-[10px] font-bold uppercase tracking-widest">Leaders Verified. Awaiting Final Approval.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u => u.role === UserRole.TEAM_LEADER && !u.isApproved && !u.teamId).map(leader => (
              <div key={leader.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <img src={leader.avatar} className="w-12 h-12 rounded-2xl grayscale" />
                  <div>
                    <p className="text-sm font-black uppercase text-white">{leader.name}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Awaiting Approval</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleUserApproval(leader)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Authorize Access
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* INCOMPLETE SETUP (Approved but No Team) */}
      {users.some(u => u.role === UserRole.TEAM_LEADER && u.isApproved && !u.teamId) && (
        <section className="bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl animate-in slide-in-from-top-4 fade-in duration-700 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-500/20 rounded-2xl"><ShieldCheck className="w-6 h-6 text-indigo-500 animate-pulse" /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-indigo-500">Active - Pending Initialization</h2>
              <p className="text-indigo-500/60 text-[10px] font-bold uppercase tracking-widest">Authorized. Waiting for Leader to Create Unit.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u => u.role === UserRole.TEAM_LEADER && u.isApproved && !u.teamId).map(leader => (
              <div key={leader.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center gap-4">
                <img src={leader.avatar} className="w-12 h-12 rounded-2xl grayscale" />
                <div>
                  <p className="text-sm font-black uppercase text-white">{leader.name}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Creating Unit...</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PENDING TEAM REQUESTS SECTION (Legacy or Manual) */}
      {users.some(u => u.role === UserRole.TEAM_LEADER && !u.isApproved && u.requestedTeamName) && (
        <section className="bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl animate-in slide-in-from-top-4 fade-in duration-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500/20 rounded-2xl"><ShieldAlert className="w-6 h-6 text-amber-500 animate-pulse" /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-amber-500">Pending Authorization Requests</h2>
              <p className="text-amber-500/60 text-[10px] font-bold uppercase tracking-widest">Action Required</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u => u.role === UserRole.TEAM_LEADER && !u.isApproved && u.requestedTeamName).map(req => (
              <div key={req.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <img src={req.avatar} className="w-12 h-12 rounded-2xl" />
                  <div>
                    <p className="text-sm font-black uppercase text-white">{req.name}</p>
                    <p className="text-[10px] font-bold text-zinc-500">{req.email}</p>
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                  <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">Requested Unit ID</p>
                  <p className="text-lg font-black uppercase text-white tracking-widest">{req.requestedTeamName}</p>
                </div>

                <button
                  onClick={async () => {
                    if (confirm(`Approve Team "${req.requestedTeamName}" for Leader ${req.name}?`)) {
                      try {
                        const res = await api.approveLeaderRequest(req.id, req.requestedTeamName!);
                        alert(`Team Approved! \n\nGenerated Passkey: ${res.passkey}\n\nPlease share this key with the Team Leader.`);
                        fetchUsers();
                        fetchTeams();
                      } catch (e: any) {
                        alert(e.message);
                      }
                    }
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Authorize & Generate Key
                </button>
              </div>
            ))}
          </div>
        </section>
      )}



      {/* ACTIVE UNITS LIST */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 mb-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-zinc-800 rounded-2xl"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <div>
            <h2 className="text-xl font-black uppercase text-white tracking-widest">Active Units</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Operational Teams and Access Keys</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
          <div className="p-6 sticky top-0 bg-zinc-900/90 border-b border-zinc-800 backdrop-blur-md z-10 flex justify-between items-center">
            <p className="text-[10px] font-black uppercase text-zinc-400">Deployed Units</p>
            <span className="bg-zinc-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-700">{teams.length} DETECTED</span>
          </div>

          <div className="p-4 space-y-3">
            {teams.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <CircuitBoard className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                <p className="text-[10px] uppercase font-bold text-zinc-500">No active units found</p>
              </div>
            ) : (
              teams.map(team => (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className="group flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl transition-all border border-zinc-800 hover:border-zinc-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-indigo-500 transition-all font-bold text-xs border border-zinc-800">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-white group-hover:text-indigo-400 transition-colors">{team.name}</p>
                      <p className="text-[9px] text-zinc-500 font-mono">ID: {team.id.substring(0, 6)}...</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Access Key</p>
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-800">
                      <Key className="w-3 h-3 text-emerald-500" />
                      <code className="text-xs font-mono font-bold text-emerald-400 tracking-widest leading-none">{team.passkey}</code>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Fine Filter Interface */}
      < div className="space-y-6" >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between px-2 gap-6">
          <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Users className="w-5 h-5" /> Personnel Registry
          </h2>

          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white dark:bg-black shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
            >
              <List className="w-3 h-3" /> List
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'hierarchy' ? 'bg-white dark:bg-black shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
            >
              <Network className="w-3 h-3" /> Structure
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between px-2 gap-6">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Omni-Search (Name, Role, Status...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-[1.25rem] border border-zinc-200 dark:border-zinc-800">
              <div className="px-2 text-zinc-400"><Filter className="w-3.5 h-3.5" /></div>

              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-[9px] font-black uppercase tracking-widest py-2 px-3 rounded-xl border-none outline-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <option value="ALL">All Levels</option>
                <option value={UserRole.ADMIN}>ADMIN</option>
                <option value={UserRole.TEAM_LEADER}>LEADER</option>
                <option value={UserRole.MEMBER}>MEMBER</option>
              </select>

              <select value={accessFilter} onChange={(e) => setAccessFilter(e.target.value)} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-[9px] font-black uppercase tracking-widest py-2 px-3 rounded-xl border-none outline-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <option value="ALL">All Gates</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-[9px] font-black uppercase tracking-widest py-2 px-3 rounded-xl border-none outline-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <option value="ALL">All States</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
              </select>

              <button onClick={resetFilters} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Clear All Filters">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Registry Table or Hierarchy View */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[600px]">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-8 py-6 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                      <div className="flex items-center gap-2">Name {sortField === 'name' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                    </th>
                    <th className="px-8 py-6 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('role')}>
                      <div className="flex items-center gap-2">Role {sortField === 'role' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                    </th>
                    <th className="px-8 py-6 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('isApproved')}>
                      <div className="flex items-center gap-2">Access Gate {sortField === 'isApproved' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                    </th>
                    <th className="px-8 py-6 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('isActive')}>
                      <div className="flex items-center gap-2">Status {sortField === 'isActive' ? (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                    </th>
                    <th className="px-8 py-6 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {processedUsers.length > 0 ? (
                    processedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-zinc-900 dark:group-hover:ring-white transition-all" />
                            <div>
                              <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">{u.name}</p>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">{u.role}</span>
                        </td>
                        <td className="px-8 py-6">
                          <button
                            onClick={() => toggleUserApproval(u)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${u.isApproved ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}
                          >
                            {u.isApproved ? <ShieldCheck className="w-2.5 h-2.5" /> : <ShieldAlert className="w-2.5 h-2.5" />}
                            {u.isApproved ? 'Approved' : 'Pending'}
                          </button>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            <CircleDot className={`w-2.5 h-2.5 ${u.isActive ? 'animate-pulse' : ''}`} />
                            {u.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                // const updated = users.map(user => user.id === u.id ? { ...user, isActive: !user.isActive } : user);
                                // persistUsers(updated);
                              }}
                              className={`p-3 rounded-xl transition-all ${u.isActive ? 'text-zinc-400 hover:text-red-600 bg-zinc-100 dark:bg-zinc-800' : 'text-emerald-600 bg-emerald-50'}`}
                              title={u.isActive ? "Deactivate" : "Activate"}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (u.id === user.id) return alert("Root protection active.");
                                if (confirm("Delete this record? This action cannot be undone.")) {
                                  try {
                                    // Optimistic update
                                    setUsers(prev => prev.filter(user => user.id !== u.id));
                                    await api.deleteUser(u.id);
                                  } catch (err) {
                                    console.error("Failed to delete user", err);
                                    fetchUsers(); // Revert on error
                                    alert("Failed to delete user.");
                                  }
                                }
                              }}
                              className="p-3 text-zinc-400 hover:text-red-600 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <AlertCircle className="w-12 h-12 text-zinc-200 dark:text-zinc-800" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Registry query returned zero results</p>
                          <button onClick={resetFilters} className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest underline underline-offset-4">Reset Parameters</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <TeamHierarchy users={processedUsers} teams={teams} onNodeClick={setSelectedUser} />
            </div>
          )}
        </div>
      </div >

      {/* Team Details Modal */}
      {
        selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

              {/* Modal Header */}
              <div className="p-8 border-b border-zinc-800 flex justify-between items-start bg-zinc-950">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-xl"><ShieldCheck className="w-6 h-6 text-indigo-400" /></div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedTeam.name}</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Unit ID: <span className="font-mono text-zinc-300">{selectedTeam.id}</span></p>
                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg">
                      <Key className="w-3 h-3 text-amber-400" />
                      <code className="text-[10px] font-mono font-bold text-amber-200 tracking-widest">{selectedTeam.passkey}</code>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedTeam(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content - Hierarchy View */}
              <div className="flex-1 overflow-y-auto p-4 bg-zinc-900">
                <div className="p-4 bg-black/20 rounded-3xl min-h-[400px]">
                  <p className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8">Structural Command View</p>
                  {/** Filter users for this team only */}
                  <TeamHierarchy users={users.filter(u => u.teamId === selectedTeam.id || u.role === UserRole.ADMIN)} teams={[selectedTeam]} onNodeClick={setSelectedUser} />
                </div>
              </div>

              {/* Modal Footer - Member List */}
              {/* Modal Footer - Management & Manifest */}
              <div className="bg-zinc-950 border-t border-zinc-800 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">

                {/* 1. Unit Configuration */}
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Unit Configuration</h3>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      defaultValue={selectedTeam.name}
                      onBlur={(e) => {
                        if (e.target.value !== selectedTeam.name) {
                          if (confirm("Update Unit Identifier?")) {
                            api.updateTeam(selectedTeam.id, { name: e.target.value }).then(() => {
                              setSelectedTeam({ ...selectedTeam, name: e.target.value });
                              fetchTeams();
                            });
                          }
                        }
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                    <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Unit Status</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-500"><CheckCircle className="w-3 h-3" /> Operational</span>
                    </div>
                  </div>
                </div>

                {/* 2. Access Control */}
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Access Control</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                      <code className="font-mono text-amber-400 font-bold">{selectedTeam.passkey}</code>
                      <button
                        onClick={() => {
                          if (confirm("Rotate Security Passkey? Using the old key will no longer work.")) {
                            const newKey = Math.random().toString(36).slice(-8).toUpperCase();
                            api.updateTeam(selectedTeam.id, { passkey: newKey }).then(() => {
                              setSelectedTeam({ ...selectedTeam, passkey: newKey });
                              fetchTeams();
                            });
                          }
                        }}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Rotate Passkey"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 leading-tight">Rolling the passkey will require all unit members to re-authenticate with the new credentials.</p>
                  </div>
                </div>

                {/* 3. Danger Zone */}
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-900" />
                    <h3 className="text-xs font-black uppercase text-red-900 tracking-widest">Danger Zone</h3>
                  </div>
                  <button
                    onClick={() => {
                      const confirmText = prompt(`To confirm deletion, type "${selectedTeam.name}"`);
                      if (confirmText === selectedTeam.name) {
                        api.deleteTeam(selectedTeam.id).then(() => {
                          setSelectedTeam(null);
                          fetchTeams();
                        });
                      }
                    }}
                    className="w-full py-4 bg-red-950/20 border border-red-900/30 text-red-700 hover:bg-red-950/40 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Decommission Unit
                  </button>
                  <p className="text-[10px] text-red-900/50 leading-tight">This action is irreversible. All associated personnel will be detached from command.</p>
                </div>

              </div>

              {/* Personnel Manifest (Below the grid) */}
              <div className="p-8 bg-zinc-950 border-t border-zinc-800">
                <h3 className="text-xs font-black uppercase text-zinc-400 mb-4 tracking-widest">Personnel Manifest</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {users.filter(u => u.teamId === selectedTeam.id).map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                      <img src={member.avatar} className="w-8 h-8 rounded-lg" />
                      <div>
                        <p className="text-xs font-bold text-white">{member.name}</p>
                        <p className="text-[9px] font-black uppercase text-zinc-500">{member.role}</p>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.teamId === selectedTeam.id).length === 0 && (
                    <p className="text-zinc-600 text-xs italic">No personnel assigned to this unit.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* User Details Modal */}
      {
        selectedUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Personnel File</h3>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-8 flex flex-col items-center text-center">
                <img src={selectedUser.avatar} className="w-24 h-24 rounded-3xl object-cover mb-6 ring-4 ring-zinc-800" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{selectedUser.name}</h2>
                <p className="text-xs font-mono text-zinc-500 mb-6">{selectedUser.email}</p>

                <div className="flex gap-2 mb-8">
                  <span className="bg-zinc-800 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg">{selectedUser.role}</span>
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${selectedUser.isActive ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                    {selectedUser.isActive ? 'Active Status' : 'Inactive'}
                  </span>
                </div>

                <div className="w-full bg-zinc-950 rounded-xl p-4 border border-zinc-800 text-left space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Unit ID</span>
                    <span className="text-[10px] font-mono text-zinc-300">{selectedUser.teamId || 'GLOBAL_ADMIN'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">System ID</span>
                    <span className="text-[10px] font-mono text-zinc-300">{selectedUser.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Access Gate</span>
                    <span className={`text-[10px] font-black uppercase ${selectedUser.isApproved ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedUser.isApproved ? 'GRANTED' : 'PENDING'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                  <button
                    onClick={() => toggleUserApproval(selectedUser)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedUser.isApproved ? 'bg-amber-900/20 text-amber-500 hover:bg-amber-900/40' : 'bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40'}`}
                  >
                    {selectedUser.isApproved ? 'Revoke Access' : 'Approve Access'}
                  </button>
                  <button
                    onClick={() => {
                      api.deleteUser(selectedUser.id).then(() => {
                        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
                        setSelectedUser(null);
                      });
                    }}
                    className="py-3 bg-red-900/10 text-red-500 hover:bg-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Delete Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminPanel;
