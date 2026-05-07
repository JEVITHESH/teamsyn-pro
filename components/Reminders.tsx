import React, { useState, useEffect } from 'react';
import { User, Reminder, UserRole, ScheduleEvent } from '../types.ts';
import { api } from '../services/api';
import { CheckCircle2, Circle, Clock, Plus, Trash2, X, Calendar, Bell, Target, Layers, ChevronRight, Check } from 'lucide-react';

interface RemindersProps {
  user: User;
}

const Reminders: React.FC<RemindersProps> = ({ user }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const isAuthorized =
    user.role === UserRole.ADMIN ||
    user.role === 'ADMIN' ||
    user.role === UserRole.TEAM_LEADER ||
    user.role === 'TEAM_LEADER';

  useEffect(() => {
    const unsubReminders = api.subscribeToReminders((data: any[]) => setReminders(data));
    const unsubSchedule = api.subscribeToSchedule((events: any[]) => {
      const now = new Date();
      const upcoming = events.filter((ev: ScheduleEvent) => {
        const evDate = new Date(ev.date);
        return evDate >= now || evDate.toDateString() === now.toDateString();
      });
      setUpcomingEvents(upcoming);
    });

    return () => {
      unsubReminders();
      unsubSchedule();
    };
  }, []);

  const activeReminders = [
    ...reminders.map(r => ({ ...r, type: 'task' })),
    ...upcomingEvents.map(e => ({
      id: e.id,
      title: e.title,
      location: e.location,
      completed: false,
      dueDate: e.date,
      userId: 'system',
      type: 'event'
    }))
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const toggleReminder = async (id: string) => {
    if (!isAuthorized) return;
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const updated = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    setReminders(updated);

    try {
      await api.updateReminder(id, { completed: !reminder.completed });
    } catch (e) {
      console.error("Failed to toggle reminder", e);
      setReminders(reminders);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!isAuthorized) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await api.deleteReminder(id);
        setReminders(prev => prev.filter(r => r.id !== id));
      } catch (e) {
        console.error("Failed to delete reminder", e);
      }
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized || !newTitle.trim()) return;

    try {
      await api.createReminder({
        title: newTitle,
        dueDate: new Date().toISOString().split('T')[0]
      });
      setNewTitle('');
      setShowAddForm(false);
    } catch (e) {
      console.error("Failed to create reminder", e);
    }
  };

  const activeCount = reminders.filter(r => !r.completed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* SaaS Reminders Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold  text-foreground">Status & Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage global workspace objectives and upcoming deadlines.</p>
        </div>

        {isAuthorized && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="saas-button-primary"
          >
            {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showAddForm ? 'Cancel Entry' : 'New Task'}
          </button>
        )}
      </div>

      {isAuthorized && showAddForm && (
        <div className="saas-card p-8 animate-in slide-in-from-top-4 duration-200 border-accent/20 bg-accent/[0.02]">
          <form onSubmit={handleAddReminder} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[11px] font-bold text-muted-foreground   pl-1">New Objective</label>
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Briefly describe the task..."
                className="saas-input h-11"
              />
            </div>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="saas-button-primary h-11 px-8 shadow-lg shadow-accent/20 flex-shrink-0"
            >
              Add Objective
            </button>
          </form>
        </div>
      )}

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="saas-card p-4 flex items-center gap-4 bg-card/50">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
               <Target className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-muted-foreground  tracking-wider leading-none">Pending Tasks</p>
               <h4 className="text-xl font-bold text-foreground mt-1">{activeCount} Items</h4>
            </div>
         </div>
         <div className="saas-card p-4 flex items-center gap-4 bg-card/50">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
               <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-muted-foreground  tracking-wider leading-none">Global Alerts</p>
               <h4 className="text-xl font-bold text-foreground mt-1">None Active</h4>
            </div>
         </div>
         <div className="saas-card p-4 flex items-center gap-4 bg-card/50">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
               <Layers className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-muted-foreground  tracking-wider leading-none">Deployment Status</p>
               <h4 className="text-xl font-bold text-foreground mt-1 text-emerald-500">Synchronized</h4>
            </div>
         </div>
      </div>

      {/* Tasks List */}
      <div className="saas-card overflow-hidden divide-y divide-border/50">
        {activeReminders.length > 0 ? activeReminders.map((item) => (
          <div key={item.id} className={`flex items-center gap-4 p-5 transition-all group ${item.completed ? 'opacity-40 grayscale' : 'hover:bg-muted/30'}`}>
            <button
               disabled={!isAuthorized || item.type === 'event'}
               onClick={() => item.type === 'task' && toggleReminder(item.id)}
               className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                 item.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                 item.type === 'event' ? 'bg-indigo-500 border-indigo-500 text-white' : 
                 'bg-card border-border text-muted-foreground hover:border-accent/40'
               }`}
            >
               {item.type === 'event' ? <Calendar className="w-4 h-4" /> : (item.completed ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-border group-hover:bg-accent/40 transition-colors" />)}
            </button>

            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                 <h4 className={`text-sm font-semibold truncate  transition-all ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                   {item.title}
                 </h4>
                 {item.type === 'event' && (
                   <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Event Marker</span>
                 )}
               </div>
               <div className="flex items-center gap-4 mt-0.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Due {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                  {item.location && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> {item.location}
                    </span>
                  )}
               </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               {isAuthorized && item.type === 'task' && (
                 <button 
                   onClick={() => deleteReminder(item.id)}
                   className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-400/10 rounded-md transition-all"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
               <ChevronRight className="w-4 h-4 text-muted-foreground/20" />
            </div>
          </div>
        )) : (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
               <Check className="w-8 h-8 text-emerald-500/50" />
            </div>
            <p className="text-sm font-semibold text-foreground">All targets cleared</p>
            <p className="text-xs text-muted-foreground mt-1">Currently no active objectives require attention.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reminders;
