import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Search,
  Key,
  Download,
  Loader2,
  Trash2,
  Filter,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  List,
  LayoutGrid,
  X,
  Zap,
  Briefcase,
  Globe,
  Plus,
  CheckCircle,
  AlertCircle
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
  const [userModalMode, setUserModalMode] = useState<'details' | 'create_team'>('details');
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

  const toggleUserApproval = async (targetUser: User) => {
    try {
      await api.toggleApproval(targetUser.id, !targetUser.isApproved);
    } catch (err) {
      console.error("Approval toggle failed", err);
    }
  };

  const handlePersonnelDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Approved'];
      const rows = users.map(u => [
        u.id,
        u.name,
        u.email,
        u.role,
        u.isActive ? 'Active' : 'Disabled',
        u.isApproved ? 'Yes' : 'No'
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Registry_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }, 1000);
  };

  const handleUpdatePasskey = async () => {
    setIsUpdatingKey(true);
    try {
      await api.updateBranchPasskey(systemPasskey);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const processedUsers = useMemo(() => {
    let result = users.filter(u => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(searchStr) ||
        u.email.toLowerCase().includes(searchStr) ||
        u.role.toLowerCase().includes(searchStr);

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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* SaaS Admin Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold  text-foreground">Administration</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage global workspace configuration, users, and team structures.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePersonnelDownload}
            disabled={isExporting}
            className="saas-button-outline"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Download className="w-4 h-4 mr-2" />}
            Export Registry
          </button>
        </div>
      </div>

      {/* Workspace Access Config */}
      <div className="saas-card p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 border-accent/20 bg-accent/[0.02]">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
            <Key className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground ">Workspace Access Key</h3>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Global key required for new members to join this workspace branch.</p>
          </div>
        </div>

          <div className="flex w-full lg:w-auto items-center gap-2 bg-background border border-border rounded-lg p-1.5 shadow-sm ml-auto">
            <input
              type="text"
              value={systemPasskey}
              onChange={(e) => setSystemPasskey(e.target.value.toUpperCase())}
              placeholder="CONFIG_KEY_..."
              className="bg-transparent border-none text-sm font-mono font-bold text-foreground focus:ring-0 px-4 w-48"
            />
            <button
              onClick={handleUpdatePasskey}
              disabled={isUpdatingKey}
              className="saas-button-primary h-8 px-4 text-xs font-bold"
            >
              {isUpdatingKey ? 'Updating...' : 'Update Key'}
            </button>
          </div>
      </div>

      {/* Actionable Queues */}
      {users.some(u => u.role === UserRole.TEAM_LEADER && !u.isApproved) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="text-sm font-bold   text-muted-foreground/80">Pending Authorizations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u => u.role === UserRole.TEAM_LEADER && !u.isApproved).map(user => (
              <div key={user.id} className="saas-card p-5 group flex flex-col justify-between h-full bg-card/50">
                <div className="flex items-center gap-4 mb-6">
                  <img src={user.avatar} className="w-12 h-12 rounded-lg object-cover bg-muted border border-border" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{user.name}</h4>
                    <p className="text-[10px] font-medium text-muted-foreground mt-0.5  tracking-wider">{user.requestedTeamName ? `Req: ${user.requestedTeamName}` : 'Leader Identity Check'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (user.requestedTeamName) {
                        await api.approveLeaderRequest(user.id, user.requestedTeamName);
                        fetchUsers();
                        fetchTeams();
                      } else {
                        toggleUserApproval(user);
                      }
                    }}
                    className="flex-1 saas-button-primary h-9 text-xs font-bold bg-amber-500 hover:bg-amber-600"
                  >
                    {user.requestedTeamName ? 'Authorize & Create' : 'Grant Access'}
                  </button>
                  <button className="p-2 saas-button-outline border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold   text-muted-foreground/80">Workspace Teams</h3>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{teams.length} Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map(team => (
            <div
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="saas-card p-5 hover:border-accent/40 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center border border-border group-hover:bg-accent/10 group-hover:border-accent/30 transition-all font-bold text-lg text-muted-foreground group-hover:text-accent">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{team.name}</h4>
                <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60">ID: {team.id.substring(0, 8)}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-border/50">
                <Key className="w-3 h-3 text-emerald-500" />
                <code className="text-xs font-mono font-bold text-emerald-500 tracking-wider flex-1 ml-1">{team.passkey}</code>
              </div>
            </div>
          ))}
          <div 
            onClick={() => {
              setNewTeamName('');
              setSystemPasskey('KEY_' + Math.random().toString(36).substring(2, 8).toUpperCase());
              setUserModalMode('create_team');
            }}
            className="saas-card border-dashed flex flex-col items-center justify-center p-6 text-center group hover:bg-muted/30 cursor-pointer min-h-[160px]"
          >
            <Plus className="w-6 h-6 text-muted-foreground/40 mb-2 group-hover:text-accent transition-colors" />
            <span className="text-xs font-bold text-muted-foreground">New Team Node</span>
          </div>
        </div>
      </div>

      {/* Personnel Registry Section */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold  text-foreground">Personnel Registry</h3>
            <div className="flex items-center bg-muted p-1 rounded-md border border-border">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('hierarchy')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'hierarchy' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                <Shield className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-foreground transition-all" />
              <input
                type="text"
                placeholder="Search personnel..."
                className="saas-input pl-9 h-9 w-[240px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={resetFilters} className="saas-button-outline w-9 p-0 h-9">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {viewMode === 'hierarchy' ? (
          <div className="saas-card p-8 bg-card/40">
            <TeamHierarchy users={users} teams={teams} onNodeClick={u => { setSelectedUser(u); setUserModalMode('details'); }} />
          </div>
        ) : (
          <div className="saas-card overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground  tracking-wider">User</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground  tracking-wider">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground  tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground  tracking-wider">Team</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground  tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {processedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} className="w-8 h-8 rounded-full border border-border" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold  tracking-wider px-2 py-0.5 rounded-md border ${u.role === UserRole.ADMIN ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          u.role === UserRole.TEAM_LEADER ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-muted text-muted-foreground border-border'
                          }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-muted-foreground/30'}`} />
                          <span className="text-[11px] font-medium text-foreground">{u.isActive ? 'Active' : 'Disabled'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-medium text-muted-foreground">{u.teamId ? teams.find(t => t.id === u.teamId)?.name || 'Default' : 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { setSelectedUser(u); setUserModalMode('details'); }}
                          className="saas-button-outline h-8 py-0 px-3 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Edit Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Overlays Redesign (Standard SaaS Modals) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedUser(null)} />
          <div className="relative saas-card w-full max-w-lg animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Personnel Profile</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-8 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <img src={selectedUser.avatar} className="w-24 h-24 rounded-2xl object-cover border border-border bg-muted shadow-lg" />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-card ${selectedUser.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              </div>
              <h2 className="text-xl font-bold text-foreground">{selectedUser.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{selectedUser.email}</p>

              <div className="grid grid-cols-2 gap-3 w-full mt-10">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground   mb-1">Auth Level</p>
                  <p className="text-sm font-bold text-foreground">{selectedUser.role}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground   mb-1">Status</p>
                  <p className={`text-sm font-bold ${selectedUser.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>{selectedUser.isActive ? 'Active' : 'Disabled'}</p>
                </div>
              </div>

              <div className="w-full h-px bg-border/50 my-8" />

              <div className="w-full flex gap-3">
                <button
                  onClick={() => toggleUserApproval(selectedUser)}
                  className={`flex-1 saas-button-outline ${selectedUser.isApproved ? 'border-amber-500/30 text-amber-500' : 'border-indigo-500/30 text-indigo-500'} font-bold`}
                >
                  {selectedUser.isApproved ? 'Revoke Approval' : 'Grant Approval'}
                </button>
                <button className="saas-button-outline w-11 p-0 border-red-500/30 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Oversight Overlay */}
      {selectedTeam && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedTeam(null)} />
          <div className="relative saas-card w-full max-w-4xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-lg">{selectedTeam.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-none">{selectedTeam.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">UUID: {selectedTeam.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTeam(null)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
              <div className="w-full md:w-1/2 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted-foreground   pl-1">Configuration</h4>
                  <div className="saas-card p-6 bg-accent/[0.02] border-accent/20">
                    <p className="text-[10px] font-bold text-muted-foreground   mb-3">Encryption Passkey</p>
                    <div className="flex items-center justify-between bg-background border border-border/50 p-4 rounded-lg">
                      <code className="text-lg font-mono font-bold text-emerald-500 tracking-wider">{selectedTeam.passkey}</code>
                      <Key className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-10">
                  <h4 className="text-xs font-bold text-muted-foreground   pl-1">Danger Zone</h4>
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete "${selectedTeam.name}"? This will detach all members.`)) {
                        await api.deleteTeam(selectedTeam.id);
                        fetchTeams();
                        setSelectedTeam(null);
                      }
                    }}
                    className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red-500/5"
                  >
                    Decommission Team Node
                  </button>
                </div>
              </div>

              <div className="w-full md:w-1/2 p-8 bg-muted/5 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-bold text-muted-foreground   pl-1">Team Roster</h4>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{users.filter(u => u.teamId === selectedTeam.id).length} Members</span>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  {users.filter(u => u.teamId === selectedTeam.id).map(member => (
                    <div key={member.id} className="flex items-center gap-4 p-4 saas-card bg-card/50 border-border/40 hover:border-accent/40 transition-all cursor-pointer">
                      <img src={member.avatar} className="w-10 h-10 rounded-lg object-cover bg-muted border border-border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{member.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate  ">{member.role}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  ))}
                  {users.filter(u => u.teamId === selectedTeam.id).length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-2xl">
                      <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-xs text-muted-foreground">No members assigned to this team.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Team Creation Modal */}
      {userModalMode === 'create_team' && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setUserModalMode('details')} />
          <div className="relative saas-card w-full max-w-md animate-in zoom-in-95 overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-foreground">Launch New Team</h3>
              <button onClick={() => setUserModalMode('details')} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Team Designation</label>
                <input 
                  type="text" 
                  value={newTeamName} 
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="e.g. CORE ANALYTICS"
                  className="saas-input h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Access Passkey</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={systemPasskey} 
                    onChange={e => setSystemPasskey(e.target.value.toUpperCase())}
                    className="saas-input h-12 font-mono flex-1 text-center font-bold tracking-widest bg-muted/20"
                  />
                  <button 
                    onClick={() => setSystemPasskey('KEY_' + Math.random().toString(36).substring(2, 8).toUpperCase())}
                    className="saas-button-outline w-12 p-0 flex items-center justify-center"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (!newTeamName) return;
                  setIsCreatingTeam(true);
                  try {
                    await api.createTeam(newTeamName, systemPasskey);
                    const branch = await api.getMyBranch();
                     if (branch) {
                        const teamsData = await api.getTeams();
                        setTeams(teamsData);
                     }
                    setUserModalMode('details');
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsCreatingTeam(false);
                  }
                }}
                disabled={isCreatingTeam || !newTeamName}
                className="saas-button-primary w-full h-12 shadow-xl shadow-accent/20"
              >
                {isCreatingTeam ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Establish Team Node'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
