
import React, { useState, useEffect } from 'react';
import { User, Reminder, UserRole, ScheduleEvent } from '../types.ts';
import { api } from '../services/api';
import { CheckCircle2, Circle, Clock, Plus, Trash2, ShieldAlert, X, ChevronRight, AlertTriangle, Calendar } from 'lucide-react';

interface RemindersProps {
  user: User;
}

const Reminders: React.FC<RemindersProps> = ({ user }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Permission: Only Admin and Team Leader can add, delete, or modify
  const isAuthorized =
    user.role === UserRole.ADMIN ||
    user.role === 'ADMIN' ||
    user.role === UserRole.TEAM_LEADER ||
    user.role === 'TEAM_LEADER';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const fetchedReminders = await api.getReminders();
      setReminders(fetchedReminders);

      const fetchedEvents = await api.getSchedule();
      const now = new Date();
      const upcoming = fetchedEvents.filter((ev: ScheduleEvent) => {
        const evDate = new Date(ev.date);
        return evDate >= now || evDate.toDateString() === now.toDateString();
      });
      setUpcomingEvents(upcoming);
    } catch (e) {
      console.error("Failed to fetch reminders/schedule", e);
    }
  };

  const activeReminders = [
    ...reminders.map(r => ({ ...r, type: 'task' })),
    ...upcomingEvents.map(e => ({
      id: e.id,
      title: `EVENT: ${e.title} @ ${e.location}`,
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

    // Optimistic Update
    const updated = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    setReminders(updated);

    try {
      await api.updateReminder(id, { completed: !reminder.completed });
    } catch (e) {
      console.error("Failed to toggle reminder", e);
      fetchData(); // Javascript rollback
    }
  };

  const deleteReminder = async (id: string) => {
    if (!isAuthorized) return;
    if (window.confirm("Permanently remove this operational objective?")) {
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
      fetchData();
    } catch (e) {
      console.error("Failed to create reminder", e);
    }
  };

  const activeCount = reminders.filter(r => !r.completed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">REMINDERS</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium italic mt-1">Operational task management.</p>
        </div>

        {isAuthorized && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${showAddForm
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
              : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95'
              }`}
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add Task'}
          </button>
        )}
      </div>



      {isAuthorized && showAddForm && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-zinc-900 dark:border-white shadow-2xl animate-in zoom-in duration-300">
          <form onSubmit={handleAddReminder} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Objective Title</label>
              <div className="flex gap-4">
                <input
                  autoFocus
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Finalize system architecture..."
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-6 py-4 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none dark:text-white font-bold"
                />
                <button
                  type="submit" disabled={!newTitle.trim()}
                  className={`px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${newTitle.trim() ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300'
                    }`}
                >
                  Confirm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all">
        <div className="p-8 bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Status</span>
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{activeCount} Pending Directives</span>
          </div>
          {!isAuthorized && (
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Read-Only Registry</span>
            </div>
          )}
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {activeReminders.map((item) => (
            <div key={item.id} className={`flex items-center gap-6 p-7 transition-all ${item.completed ? 'bg-zinc-50/30 dark:bg-zinc-950/30 opacity-60' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'} ${item.type === 'event' ? 'border-l-4 border-indigo-500 bg-indigo-50/10' : ''}`}>
              <button
                disabled={!isAuthorized || item.type === 'event'}
                onClick={() => item.type === 'task' && toggleReminder(item.id)}
                className={`transition-all transform active:scale-90 ${item.completed ? 'text-zinc-900 dark:text-white' : item.type === 'event' ? 'text-indigo-500' : 'text-zinc-200 dark:text-zinc-700 hover:text-zinc-400'}`}
              >
                {item.type === 'event' ? <Calendar className="w-8 h-8" /> : (item.completed ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />)}
              </button>

              <div className="flex-1 min-w-0 text-left">
                <p className={`text-base font-bold truncate transition-all ${item.completed ? 'text-zinc-400 dark:text-zinc-600 line-through' : item.type === 'event' ? 'text-indigo-900 dark:text-indigo-100 uppercase tracking-tight' : 'text-zinc-900 dark:text-zinc-100 uppercase tracking-tight'}`}>
                  {item.title}
                </p>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${item.type === 'event' ? 'text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    <Clock className="w-3.5 h-3.5" /> {item.type === 'event' ? 'Scheduled Event:' : 'Logged:'} {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {isAuthorized && item.type === 'task' && (
                <button onClick={() => deleteReminder(item.id)} className="p-3.5 text-zinc-200 dark:text-zinc-700 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          {reminders.length === 0 && (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-zinc-200">
                <CheckCircle2 className="w-10 h-10 text-zinc-200 dark:text-zinc-700" />
              </div>
              <p className="text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">No active operational tasks found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reminders;
