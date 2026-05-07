import React, { useState, useEffect } from 'react';
import { ScheduleEvent, User, UserRole } from '../types.ts';
import { api } from '../services/api';
import { Calendar as CalendarIcon, MapPin, Clock, Plus, Trash2, Edit3, X, Check, Globe, HelpCircle } from 'lucide-react';

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
    const unsubscribe = api.subscribeToSchedule((data: any) => {
      setEvents(data);
    });
    return () => unsubscribe();
  }, []);

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
    if (window.confirm("Are you sure you want to remove this event?")) {
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
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* SaaS Schedule Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold  text-foreground">Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and monitor upcoming milestones and operational events.</p>
        </div>

        {isAuthorized && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="saas-button-primary"
          >
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? 'Cancel Entry' : 'Create Event'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="saas-card p-8 md:p-10 animate-in zoom-in-95 duration-200 bg-accent/[0.02] border-accent/20">
          <form onSubmit={handleSave} className="space-y-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold  text-foreground mb-6">{editingId ? 'Edit Event' : 'New Event Registration'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground   pl-1">Event Title</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className="saas-input h-11"
                  placeholder="Operational Goal"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground   pl-1">Registry Date</label>
                <input
                  type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="saas-input h-11"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground   pl-1">Location / Network</label>
              <input
                value={location} onChange={(e) => setLocation(e.target.value)}
                className="saas-input h-11"
                placeholder="Global Workspace"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground   pl-1">Description / Notes</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="saas-input min-h-[100px] py-3 resize-none"
                placeholder="Brief summary of the event objectives."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <button type="button" onClick={resetForm} className="saas-button-secondary h-10 px-6">Discard</button>
              <button type="submit" className="saas-button-primary h-10 px-8 shadow-lg shadow-accent/20">
                <Check className="w-4 h-4 mr-2" /> {editingId ? 'Update Event' : 'Save Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Event Timeline */}
      <div className="space-y-4">
        {events.length > 0 ? events.map((event) => {
          const eventDate = new Date(event.date);
          return (
            <div key={event.id} className="saas-card overflow-hidden hover:border-accent/30 transition-all group">
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/50">
                {/* Date Plate */}
                <div className="bg-muted/10 md:w-32 flex flex-col items-center justify-center py-6 md:py-8 lg:py-10">
                  <span className="text-3xl font-bold text-foreground leading-none">{eventDate.getDate() || '--'}</span>
                  <span className="text-[10px] font-bold text-muted-foreground   mt-1">
                    {eventDate.toLocaleString('default', { month: 'short' })}
                  </span>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded text-[10px] font-bold  tracking-wider">
                          Internal Milestone
                        </span>
                        {isAuthorized && (
                          <div className="flex items-center gap-1.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(event)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteEvent(event.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-400/10 rounded-md transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <Globe className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-2 ">{event.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-6">
                      {event.description || 'No additional details provided for this event.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px] font-medium truncate max-w-[150px]">{event.location || 'Remote Node'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px] font-medium">Synced • 100% Reliability</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : !showForm && (
          <div className="py-32 text-center saas-card bg-muted/5 border-dashed space-y-4">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto border border-border/50">
                <CalendarIcon className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">No events found</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">Your operational timeline is currently clear. Milestones will appear here once registered.</p>
            </div>
            {isAuthorized && (
              <button 
                onClick={() => setShowForm(true)}
                className="saas-button-outline h-9 px-6 text-xs mt-4"
              >
                Add Your First Event
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
