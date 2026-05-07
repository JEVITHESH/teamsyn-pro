import React, { useState, useEffect } from 'react';
import { User, UserRole, Project, ProjectStatus } from '../types';
import { api } from '../services/api';
import { 
  FolderKanban, Plus, Search, MoreVertical, FileSpreadsheet, 
  Trash2, Edit2, Github, Calendar, Users, X, CheckCircle, Clock
} from 'lucide-react';

interface ProjectsProps {
  user: User;
}

const Projects: React.FC<ProjectsProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Active');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [progress, setProgress] = useState<number>(0);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // File State
  const [excelFileData, setExcelFileData] = useState<string | undefined>(undefined);
  const [excelFileName, setExcelFileName] = useState<string | undefined>(undefined);

  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.TEAM_LEADER;

  useEffect(() => {
    const targetTeamId = user.role === UserRole.ADMIN ? `admin_global_${user.branchId}` : (user.teamId || 'no-team');
    const unsub = api.subscribeToProjects(targetTeamId, (data) => {
      setProjects(data);
    });
    
    const unsubUsers = api.subscribeToUsers((users) => {
      setAvailableUsers(users);
    });

    return () => {
       unsub();
       unsubUsers();
    };
  }, [user.teamId, user.role]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setExcelFileData(event.target?.result as string);
        setExcelFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mappedMembers = availableUsers
        .filter(u => selectedMembers.includes(u.id))
        .map(u => ({ userId: u.id, name: u.name, avatar: u.avatar, role: u.role }));

    const data = {
      name, description, detailedDescription, githubLink, status, startDate, deadline,
      priority, progress,
      teamId: user.role === UserRole.ADMIN ? `admin_global_${user.branchId}` : user.teamId,
      excelFileData, excelFileName,
      teamMembers: mappedMembers
    };

    if (editingId) {
      await api.updateProject(editingId, data);
    } else {
      await api.createProject(data);
    }

    closeModal();
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingId(null);
    setName(''); setDescription(''); setDetailedDescription('');
    setGithubLink(''); setStatus('Active'); setStartDate(''); setDeadline('');
    setPriority('Medium'); setProgress(0); setSelectedMembers([]);
    setExcelFileData(undefined); setExcelFileName(undefined);
  };

  const openEditModal = (p: Project) => {
    setEditingId(p.id);
    setName(p.name); setDescription(p.description); setDetailedDescription(p.detailedDescription);
    setGithubLink(p.githubLink); setStatus(p.status); setStartDate(p.startDate); setDeadline(p.deadline);
    setPriority(p.priority || 'Medium'); setProgress(p.progress || 0);
    setSelectedMembers(p.teamMembers?.map(m => m.userId) || []);
    setExcelFileData(p.excelFileData); setExcelFileName(p.excelFileName);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await api.deleteProject(id);
      if (activeProject?.id === id) setActiveProject(null);
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStatusColor = (s: string) => {
    if (s === 'Active') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (s === 'Completed') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500 gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-accent" />
            Project Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Track milestones, documentation, and progress.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input 
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="saas-input pl-9 h-10 text-sm w-full"
             />
          </div>
          {canEdit && (
            <button onClick={() => setShowCreateModal(true)} className="saas-button-primary h-10 px-4 whitespace-nowrap">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline ml-2">New Project</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Project List */}
        <div className={`lg:col-span-4 flex flex-col saas-card overflow-hidden bg-card/40 ${activeProject ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border/50 bg-muted/10 font-bold text-sm text-muted-foreground">ALL PROJECTS</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filteredProjects.map(p => (
              <div 
                key={p.id} 
                onClick={() => setActiveProject(p)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${activeProject?.id === p.id ? 'bg-accent/10 border-accent/40 shadow-sm' : 'bg-background border-border/50 hover:border-accent/30 hover:bg-muted/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-foreground text-base truncate">{p.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(p.status)}`}>{p.status}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground/70">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.deadline || 'No Deadline'}</span>
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-10 opacity-60">No projects found.</div>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className={`lg:col-span-8 flex flex-col saas-card overflow-hidden ${!activeProject ? 'hidden lg:flex items-center justify-center bg-card/20' : 'flex bg-card/60'}`}>
          {!activeProject ? (
            <div className="text-center opacity-40">
               <FolderKanban className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
               <p className="text-sm font-medium">Select a project to view details</p>
            </div>
          ) : (
            <>
              <div className="p-6 md:p-8 border-b border-border/50 relative">
                <button className="lg:hidden absolute top-4 right-4 p-2 bg-muted rounded-full" onClick={() => setActiveProject(null)}>
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">{activeProject.name}</h2>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(activeProject.status)}`}>{activeProject.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl">{activeProject.description}</p>
                  </div>
                  {canEdit && (
                    <div className="hidden lg:flex items-center gap-2">
                      <button onClick={() => openEditModal(activeProject)} className="p-2 saas-button-outline text-xs h-9 w-9"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(activeProject.id)} className="p-2 saas-button-outline text-xs h-9 w-9 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                
                {/* Meta Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background border border-border/50 rounded-xl p-4">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Start Date</span>
                     <span className="text-sm font-medium text-foreground">{activeProject.startDate || 'TBD'}</span>
                  </div>
                  <div className="bg-background border border-border/50 rounded-xl p-4">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Deadline</span>
                     <span className="text-sm font-medium text-foreground">{activeProject.deadline || 'TBD'}</span>
                  </div>
                  <div className="bg-background border border-border/50 rounded-xl p-4">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Repository</span>
                     {activeProject.githubLink ? (
                       <a href={activeProject.githubLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent flex items-center gap-1 hover:underline"><Github className="w-3.5 h-3.5" /> View Code</a>
                     ) : (
                       <span className="text-sm font-medium text-muted-foreground">Not linked</span>
                     )}
                  </div>
                  <div className="bg-background border border-border/50 rounded-xl p-4">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Priority</span>
                     <span className={`text-sm font-medium ${activeProject.priority === 'High' ? 'text-red-500' : activeProject.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`}>{activeProject.priority || 'Medium'}</span>
                  </div>
                  <div className="bg-background border border-border/50 rounded-xl p-4">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Members</span>
                     <span className="text-sm font-medium text-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {activeProject.teamMembers?.length || 0} Assigned</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
                     <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /> Project Progress</span>
                     <span>{activeProject.progress || 0}%</span>
                  </h3>
                  <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                     <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${activeProject.progress || 0}%` }} />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent" /> Detailed Scope</h3>
                  <div className="bg-muted/10 border border-border/50 rounded-xl p-5 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {activeProject.detailedDescription || <span className="opacity-50 italic">No detailed scope provided.</span>}
                  </div>
                </div>

                {/* Excel Integration */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Work Tracking (Excel)</h3>
                  {activeProject.excelFileData ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                             <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-foreground">{activeProject.excelFileName || 'Project_Tracking.xlsx'}</h4>
                             <p className="text-xs text-muted-foreground mt-0.5">Spreadsheet tracker attached</p>
                          </div>
                       </div>
                       <a 
                          href={activeProject.excelFileData} 
                          download={activeProject.excelFileName || 'Project_Tracking.xlsx'}
                          className="saas-button-outline border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 text-xs px-4"
                        >
                          Download
                       </a>
                    </div>
                  ) : (
                    <div className="bg-muted/10 border border-dashed border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                       <FileSpreadsheet className="w-8 h-8 text-muted-foreground mb-3 opacity-40" />
                       <p className="text-sm font-medium text-foreground">No tracking sheet attached.</p>
                       <p className="text-xs text-muted-foreground mt-1">Upload an Excel tracker to manage team milestones.</p>
                    </div>
                  )}
                </div>

                {/* Mobile Actions */}
                {canEdit && (
                  <div className="flex lg:hidden items-center gap-3 pt-6 border-t border-border/50">
                    <button onClick={() => openEditModal(activeProject)} className="flex-1 saas-button-outline h-11"><Edit2 className="w-4 h-4 mr-2" /> Edit</button>
                    <button onClick={() => handleDelete(activeProject.id)} className="flex-1 saas-button-outline h-11 border-red-500/20 text-red-500 bg-red-500/5"><Trash2 className="w-4 h-4 mr-2" /> Delete</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="saas-card w-full max-w-2xl bg-card border-border shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{editingId ? 'Edit Project' : 'Create New Project'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Project Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="saas-input w-full" placeholder="e.g., Core Engine V2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)} className="saas-input w-full">
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Priority</label>
                      <select value={priority} onChange={e => setPriority(e.target.value as any)} className="saas-input w-full">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Github Repo Link</label>
                      <input type="url" value={githubLink} onChange={e => setGithubLink(e.target.value)} className="saas-input w-full" placeholder="https://github.com/..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Progress (%)</label>
                      <input type="number" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} className="saas-input w-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Start Date</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="saas-input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Deadline</label>
                      <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="saas-input w-full" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Short Description</label>
                    <input required value={description} onChange={e => setDescription(e.target.value)} className="saas-input w-full" placeholder="Brief summary of the project goals" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Detailed Scope</label>
                    <textarea required value={detailedDescription} onChange={e => setDetailedDescription(e.target.value)} className="saas-input w-full h-32 py-3 resize-none" placeholder="Provide full details, milestones, and requirements..." />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Assign Team Members</label>
                    <div className="saas-card bg-muted/5 border-border/50 max-h-40 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {availableUsers.map(u => (
                        <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded-lg cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedMembers.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedMembers([...selectedMembers, u.id]);
                              else setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                            }}
                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                          />
                          <img src={u.avatar} alt="" className="w-6 h-6 rounded-full" />
                          <span className="text-sm font-medium">{u.name} <span className="text-xs text-muted-foreground">({u.role})</span></span>
                        </label>
                      ))}
                      {availableUsers.length === 0 && <div className="text-xs text-muted-foreground p-2 text-center">No team members found.</div>}
                    </div>
                  </div>

                  <div className="bg-muted/10 border border-border/50 rounded-xl p-4">
                    <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Work Tracking (Excel)</label>
                    <div className="flex items-center gap-4">
                       <label className="saas-button-outline px-4 h-9 cursor-pointer">
                          <FileSpreadsheet className="w-4 h-4 mr-2" /> {excelFileName ? 'Change Sheet' : 'Upload Sheet'}
                          <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
                       </label>
                       {excelFileName && <span className="text-xs font-medium text-emerald-500 truncate">{excelFileName}</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-border/50 bg-muted/5 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="saas-button-outline px-6">Cancel</button>
                <button type="submit" className="saas-button-primary px-8">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
