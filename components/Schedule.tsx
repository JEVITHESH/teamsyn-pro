
import React, { useState, useEffect } from 'react';
import { MOCK_SCHEDULES } from '../constants.tsx';
import { ScheduleEvent, User, UserRole } from '../types.ts';
import { api } from '../services/api';
import { Calendar as CalendarIcon, MapPin, Clock, ArrowRight, Plus, Trash2, Edit3, X, Check } from 'lucide-react';

interface ScheduleProps {
  user: User;
}

const Schedule: React.FC<ScheduleProps> = ({ user }) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const isAuthorized =
    user.role === UserRole.ADMIN ||
    user.role === 'ADMIN' ||
    user.role === UserRole.TEAM_LEADER ||
    user.role === 'TEAM_LEADER';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await api.getSchedule();
      setEvents(data);
    } catch (e) {
      console.error("Failed to fetch schedule", e);
    }
  };

  const persist = (updated: ScheduleEvent[]) => {
    // Legacy support removal, now purely handled via API refresh
    setEvents(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    try {
      if (editingId) {
        await api.updateScheduleEvent(editingId, { title, date, description, location });
      } else {
        await api.createScheduleEvent({
          title,
          date,
          description,
          location
        });
      }
      resetForm();
      fetchEvents();
    } catch (e) {
      console.error("Failed to save schedule event", e);
    }
  };

  const startEdit = (ev: ScheduleEvent) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setDate(ev.date);
    setDescription(ev.description);
    setLocation(ev.location);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteEvent = async (id: string) => {
    if (window.confirm("Remove this operational node from the timeline?")) {
      try {
        await api.deleteScheduleEvent(id);
        setEvents(prev => prev.filter(ev => ev.id !== id));
      } catch (e) {
        console.error("Delete failed", e);
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setDescription('');
    setLocation('');
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">OPERATIONAL TIMELINE</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium italic mt-1">Strategic roadmap for team synchronization.</p>
        </div>

        {isAuthorized && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${showForm
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
              : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95'
              }`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Event'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-zinc-900 dark:border-white shadow-2xl animate-in zoom-in duration-300 mb-12">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Event Title</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none dark:text-white font-bold"
                  placeholder="Ex: System Migration Phase 1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Registry Date</label>
                <input
                  type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none dark:text-white font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Location / Terminal</label>
              <input
                value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none dark:text-white font-bold"
                placeholder="Ex: Virtual Hub A / Conference Room 4"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Strategic Description</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none dark:text-white font-bold min-h-[100px] resize-none"
                placeholder="Objectives and expected outcomes..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 transition-colors">Discard</button>
              <button type="submit" className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-2">
                <Check className="w-4 h-4" /> {editingId ? 'Update Record' : 'Initialize Node'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {events.map((event) => {
          const eventDate = new Date(event.date);
          return (
            <div key={event.id} className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row overflow-hidden hover:shadow-xl transition-all duration-500">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 md:w-36 flex flex-col items-center justify-center py-8 md:py-0 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-900 dark:text-white font-black text-4xl tracking-tighter">{eventDate.getDate() || '??'}</span>
                <span className="text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest text-[10px] mt-1">
                  {eventDate.toLocaleString('default', { month: 'short' })}
                </span>
              </div>

              <div className="flex-1 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-zinc-900 dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Operational
                    </span>
                    <div className="flex items-center gap-2">
                      {isAuthorized && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(event)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteEvent(event.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">{event.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2 mb-6 leading-relaxed">{event.description}</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-50 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{event.location || 'Undisclosed'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                    <Clock className="w-4 h-4" /> Scheduled Time Logged
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800">
          <CalendarIcon className="w-16 h-16 text-zinc-100 dark:text-zinc-800 mx-auto mb-6" />
          <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Timeline Inactive</h2>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium mt-2">No upcoming operational nodes detected in the registry.</p>
        </div>
      )}
    </div>
  );
};

export default Schedule;
