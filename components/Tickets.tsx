import React, { useState, useEffect } from 'react';
import { User, UserRole, Ticket, TicketStatus } from '../types.ts';
import {
  Plus, Trash2, ChevronRight, Hash, User as UserIcon, AlertTriangle,
  X, CheckCircle2, MoreHorizontal, Clock, ArrowRight, Layout, ListFilter
} from 'lucide-react';
import { api } from '../services/api';

interface TicketsProps {
  user: User;
}

const Tickets: React.FC<TicketsProps> = ({ user }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [activeTab, setActiveTab] = useState<TicketStatus>(TicketStatus.STARTED);

  const isAdmin =
    user.role === UserRole.ADMIN ||
    user.role === 'ADMIN' ||
    user.role === UserRole.TEAM_LEADER ||
    user.role === 'TEAM_LEADER';

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await api.getTickets();
      setTickets(data);
    } catch (e) {
      console.error("Failed to load tickets", e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newTitle.trim()) return;

    try {
      await api.createTicket({ title: newTitle, description: newDesc, priority: newPriority });
      resetForm();
      fetchTickets();
    } catch (e) {
      console.error("Create ticket failed", e);
      alert("Failed to create ticket");
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewPriority('Medium');
    setShowAddForm(false);
  };

  const moveTicket = async (id: string, newStatus: TicketStatus) => {
    // Optimistic Update
    const oldTickets = [...tickets];
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      await api.updateTicketStatus(id, newStatus);
    } catch (e) {
      console.error("Update status failed", e);
      setTickets(oldTickets); // Revert
    }
  };

  const deleteTicket = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Permanently erase this operational ticket from the registry?")) {
      try {
        await api.deleteTicket(id);
        setTickets(prev => prev.filter(t => t.id !== id));
      } catch (e) {
        console.error("Failed to delete ticket", e);
        alert("Failed to delete ticket");
      }
    }
  };

  const columns = [
    { id: TicketStatus.STARTED, label: 'Pending', icon: <Clock className="w-4 h-4" /> },
    { id: TicketStatus.WORK_DONE, label: 'In Progress', icon: <Layout className="w-4 h-4" /> },
    { id: TicketStatus.REVIEW, label: 'Review', icon: <ListFilter className="w-4 h-4" /> },
    { id: TicketStatus.COMPLETE, label: 'Complete', icon: <CheckCircle2 className="w-4 h-4" /> }
  ];

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30';
      case 'Medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30';
      case 'Low': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
      default: return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800';
    }
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => (
    <div className="group bg-white dark:bg-zinc-900/50 p-5 rounded-2xl shadow-sm hover:shadow-lg dark:shadow-none border border-zinc-100 dark:border-zinc-800/60 hover:border-indigo-500/30 transition-all duration-300 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getPriorityColor(ticket.priority)}`}>
          {ticket.priority}
        </span>
        {isAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteTicket(ticket.id); }}
            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-2">{ticket.title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-3">{ticket.description}</p>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800/60 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
            <UserIcon className="w-3 h-3" />
          </div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[100px]">
            {ticket.assignedTo || ticket.creator_name || 'System'}
          </span>
        </div>

        <div className="flex gap-1">
          {columns.findIndex(c => c.id === ticket.status) > 0 && (
            <button
              onClick={() => moveTicket(ticket.id, columns[columns.findIndex(c => c.id === ticket.status) - 1].id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          {columns.findIndex(c => c.id === ticket.status) < columns.length - 1 && (
            <button
              onClick={() => moveTicket(ticket.id, columns[columns.findIndex(c => c.id === ticket.status) + 1].id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {ticket.status === TicketStatus.COMPLETE && (
            <div className="text-emerald-500 p-1.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pb-20 md:pb-0">
      {/* Header Area */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 bg-white/50 dark:bg-black/20 backdrop-blur-xl border-b border-zinc-100 dark:border-white/5 sticky top-0 z-40">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
              <Hash className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Mission Control</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium pl-14 hidden md:block">
            Operational Directives & Task Management
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xl hover:translate-y-[-2px] hover:shadow-2xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Directive</span>
          </button>
        )}
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden px-4 pt-4 pb-2 sticky top-[88px] z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {columns.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activeTab === col.id
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-transparent dark:border-zinc-800'
                }`}
            >
              {col.icon}
              {col.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === col.id ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                {tickets.filter(t => t.status === col.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Desktop View: Grid/Kanban */}
        <div className="hidden md:flex gap-6 h-full overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.id} className="min-w-[320px] max-w-[360px] flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/20 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  {col.icon}
                  <span className="text-xs font-bold uppercase tracking-wider">{col.label}</span>
                </div>
                <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold px-2 py-1 rounded-md">
                  {tickets.filter(t => t.status === col.id).length}
                </span>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {tickets.filter(t => t.status === col.id).length > 0 ? (
                  tickets.filter(t => t.status === col.id).map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-zinc-400/50 dashed-border rounded-xl">
                    <p className="text-xs font-medium">No tickets</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View: List filtered by Tab */}
        <div className="md:hidden space-y-4">
          {tickets.filter(t => t.status === activeTab).length > 0 ? (
            tickets.filter(t => t.status === activeTab).map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Layout className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-70">No Tasks Here</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
            onClick={resetForm}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wide text-zinc-900 dark:text-white">New Directive</h2>
              <button
                onClick={resetForm}
                className="p-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Title</label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task Header"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Priority Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Low', 'Medium', 'High'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p as any)}
                      className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border ${newPriority === p
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-md'
                          : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Operational details..."
                  className="w-full h-32 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02]"
              >
                Create Directive
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Read Only Warning for non-admins */}
      {!isAdmin && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
          <div className="bg-zinc-800/90 backdrop-blur-md p-3 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-zinc-200 border border-white/10">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Read Only Mode</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
