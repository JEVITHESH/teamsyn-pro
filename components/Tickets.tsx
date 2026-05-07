import React, { useState, useEffect } from 'react';
import { User, UserRole, Ticket, TicketStatus } from '../types.ts';
import {
  Plus, Trash2, Clock, CheckCircle2,
  X, Layout, ListFilter, AlertTriangle,
  ArrowRight, Search, Zap, Target, Activity, Cpu, ShieldAlert, ChevronRight, ChevronLeft, BarChart3, TrendingUp, Layers, CheckCircle, MoreHorizontal, User as UserIcon
} from 'lucide-react';
import { api } from '../services/api';

interface TicketsProps {
  user: User;
}

const COLUMNS = [
  {
    id: TicketStatus.STARTED,
    label: 'Backlog',
    icon: <Layers className="w-4 h-4" />,
    color: 'text-muted-foreground',
    borderColor: 'border-border'
  },
  {
    id: TicketStatus.WORK_DONE,
    label: 'In Progress',
    icon: <Activity className="w-4 h-4" />,
    color: 'text-indigo-500',
    borderColor: 'border-indigo-500/30'
  },
  {
    id: TicketStatus.REVIEW,
    label: 'Review',
    icon: <Search className="w-4 h-4" />,
    color: 'text-amber-500',
    borderColor: 'border-amber-500/30'
  },
  {
    id: TicketStatus.COMPLETE,
    label: 'Completed',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-500',
    borderColor: 'border-emerald-500/30'
  }
];

const getPriorityStyle = (p: string) => {
  switch (p) {
    case 'High': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'Medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'Low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    default: return 'text-muted-foreground bg-muted/50 border-border';
  }
};

interface TicketCardProps {
  ticket: Ticket;
  isAdmin: boolean;
  moveTicket: (id: string, newStatus: TicketStatus) => void;
  deleteTicket: (id: string) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, isAdmin, moveTicket, deleteTicket }) => {
  return (
    <div className="group relative saas-card p-4 hover:border-accent/40 transition-all duration-200 cursor-grab active:cursor-grabbing bg-card/80 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-3">
        <span className={`text-[9px] font-bold  tracking-wider px-2 py-0.5 rounded border ${getPriorityStyle(ticket.priority)}`}>
          {ticket.priority}
        </span>
        <div className="flex items-center gap-1">
           {isAdmin && (
             <button
               onClick={(e) => { e.stopPropagation(); deleteTicket(ticket.id); }}
               className="p-1 px-2 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 rounded-md hover:bg-red-500/10"
             >
               <Trash2 className="w-3.5 h-3.5" />
             </button>
           )}
           <button className="p-1 px-2 text-muted-foreground opacity-30 group-hover:opacity-100 hover:bg-muted rounded-md transition-all">
              <MoreHorizontal className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>

      <h4 className="text-sm font-bold text-foreground leading-tight mb-2 group-hover:text-accent transition-colors">
        {ticket.title}
      </h4>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
        {ticket.description || 'No description provided.'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          {ticket.assignedTo ? (
            <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-[9px] font-bold text-accent shadow-sm">
               {ticket.assignedTo?.charAt(0).toUpperCase()}
            </div>
          ) : (
             <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground/40">
                <UserIcon className="w-3 h-3" />
             </div>
          )}
          <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[80px]">
            {ticket.assignedTo || 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {COLUMNS.findIndex(c => c.id === ticket.status) > 0 && (
            <button
               onClick={() => moveTicket(ticket.id, COLUMNS[COLUMNS.findIndex(c => c.id === ticket.status) - 1].id)}
               className="p-1 text-muted-foreground hover:text-foreground transition-all"
            >
               <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {COLUMNS.findIndex(c => c.id === ticket.status) < COLUMNS.length - 1 && (
            <button
               onClick={() => moveTicket(ticket.id, COLUMNS[COLUMNS.findIndex(c => c.id === ticket.status) + 1].id)}
               className="p-1 text-muted-foreground hover:text-foreground transition-all"
            >
               <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Tickets: React.FC<TicketsProps> = ({ user }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<TicketStatus>(TicketStatus.STARTED);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({ title: '', desc: '', priority: 'Medium' as const });

  const isAdmin =
    user.role === UserRole.ADMIN ||
    user.role === 'ADMIN' ||
    user.role === UserRole.TEAM_LEADER ||
    user.role === 'TEAM_LEADER';

  useEffect(() => {
    const Unsubscribe = api.subscribeToTickets((data: any) => setTickets(data));
    return () => Unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      await api.createTicket({
        title: form.title,
        description: form.desc,
        priority: form.priority
      });
      setShowAddForm(false);
      setForm({ title: '', desc: '', priority: 'Medium' });
    } catch (e) {
      console.error("Create task failed", e);
    }
  };

  const moveTicket = async (id: string, newStatus: TicketStatus) => {
    try {
      await api.updateTicketStatus(id, newStatus);
    } catch (e) {
      console.error("Update status failed", e);
    }
  };

  const deleteTicket = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Move this task to the archive?")) {
      try {
        await api.deleteTicket(id);
      } catch (e) {
        console.error("Failed to delete task", e);
      }
    }
  };

  const filteredTickets = tickets.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">

      {/* Modern SaaS Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border/50 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold  text-foreground">Support & Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">Track issues, feature requests, and operational progress.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-all" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="saas-input h-10 pl-10"
            />
          </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="saas-button-primary h-10 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span>Create Task</span>
            </button>
        </div>
      </div>

      {/* Kanban Board Layout */}
      <div className="flex-1 hidden md:flex gap-6 overflow-hidden pb-4">
        {COLUMNS.map((col) => {
          const colTickets = filteredTickets.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="flex-1 flex flex-col h-full min-w-[280px]">
              <div className={`flex items-center justify-between px-2 mb-4 group`}>
                <div className={`flex items-center gap-2.5 font-bold  text-[11px]  ${col.color}`}>
                   <div className={`w-2 h-2 rounded-full bg-current opacity-40`} />
                   {col.label}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted h-5 px-1.5 flex items-center justify-center rounded-md min-w-[20px]">
                   {colTickets.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {colTickets.map(ticket => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    isAdmin={isAdmin}
                    moveTicket={moveTicket}
                    deleteTicket={deleteTicket}
                  />
                ))}
                
                {colTickets.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-border/50 rounded-2xl bg-muted/5 opacity-50">
                      <p className="text-[10px] font-bold text-muted-foreground  ">Empty</p>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile view logic is still useful but we improve its styling */}
      <div className="md:hidden flex-1 flex flex-col bg-card/30 border border-border rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto p-3 gap-2 no-scrollbar border-b border-border/50 bg-muted/20">
          {COLUMNS.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id as TicketStatus)}
              className={`px-4 py-2 rounded-lg font-bold  text-[10px]  transition-all whitespace-nowrap ${activeTab === col.id
                ? 'bg-accent text-white shadow-md'
                : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              {col.label} ({filteredTickets.filter(t => t.status === col.id).length})
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {filteredTickets.filter(t => t.status === activeTab).map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isAdmin={isAdmin}
              moveTicket={moveTicket}
              deleteTicket={deleteTicket}
            />
          ))}
        </div>
      </div>

      {/* Streamlined Create Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAddForm(false)} />
          <div className="relative saas-card w-full max-w-lg animate-in zoom-in-95 overflow-hidden">
             <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Target className="w-5 h-5 text-accent" />
                   <h3 className="text-lg font-bold text-foreground">Create New Task</h3>
                </div>
                <button onClick={() => setShowAddForm(false)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"><X className="w-5 h-5" /></button>
             </div>

             <form onSubmit={handleAdd} className="p-8 space-y-6">
               <div className="space-y-2">
                 <label className="text-[11px] font-bold text-muted-foreground   pl-1">Task Title</label>
                 <input
                   required
                   autoFocus
                   value={form.title}
                   onChange={(e) => setForm({ ...form, title: e.target.value })}
                   className="saas-input h-11"
                   placeholder="Refactor auth components..."
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-[11px] font-bold text-muted-foreground   pl-1">Priority Level</label>
                 <div className="grid grid-cols-3 gap-2">
                   {['Low', 'Medium', 'High'].map((p) => (
                     <button
                       key={p}
                       type="button"
                       onClick={() => setForm({ ...form, priority: p as any })}
                       className={`h-10 rounded-lg font-bold  tracking-wider text-[11px] transition-all border ${form.priority === p
                         ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                         : 'bg-muted/50 border-border text-muted-foreground hover:border-accent/40'
                         }`}
                     >
                       {p}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[11px] font-bold text-muted-foreground   pl-1">Detailed Description</label>
                 <textarea
                   value={form.desc}
                   onChange={(e) => setForm({ ...form, desc: e.target.value })}
                   className="saas-input min-h-[120px] py-4 resize-none"
                   placeholder="Outline the steps or context for this task..."
                 />
               </div>

               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 saas-button-secondary h-11">Cancel</button>
                  <button
                      type="submit"
                      disabled={!form.title.trim()}
                      className="flex-[2] saas-button-primary h-11 shadow-lg shadow-accent/20"
                  >
                      Create Task Action
                  </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
