import React, { useState, useEffect } from 'react';
import { User, Poll, UserRole, Vote } from '../types.ts';
import { api } from '../services/api';
import { Plus, Trash2, X, Edit, Save, Check, MessageSquare, Quote, BarChart2, PieChart as PieIcon, Users, Activity, Target, Zap, Shield, Cpu, Terminal, TrendingUp, Briefcase, ChevronRight, MoreHorizontal, PieChart as LucidePieChart } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PollsProps {
  user: User;
}

const SAAS_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'];

const Polls: React.FC<PollsProps> = ({ user }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<{ id: string, text: string, requiresReason: boolean }[]>([
    { id: '1', text: '', requiresReason: false },
    { id: '2', text: '', requiresReason: false }
  ]);

  const [voteReasonModal, setVoteReasonModal] = useState<{ isOpen: boolean, pollId: string, optionId: string, text: string }>({
    isOpen: false,
    pollId: '',
    optionId: '',
    text: ''
  });

  const canManagePolls =
    user.role === UserRole.ADMIN ||
    user.role === 'ADMIN' ||
    user.role === UserRole.TEAM_LEADER ||
    user.role === 'TEAM_LEADER';

  useEffect(() => {
    const unsubscribe = api.subscribeToPolls((updatedPolls) => {
      setPolls(updatedPolls);
    });
    return unsubscribe;
  }, []);

  const initVote = (pollId: string, optionId: string, requiresReason: boolean) => {
    if (requiresReason) {
      setVoteReasonModal({ isOpen: true, pollId, optionId, text: '' });
    } else {
      submitVote(pollId, optionId);
    }
  };

  const submitVote = async (pollId: string, optionId: string, reason?: string) => {
    const pollToUpdate = polls.find(p => p.id === pollId);
    if (!pollToUpdate) return;

    const newVotes = pollToUpdate.votes.filter(v => v.userId !== user.id);
    const voteData: any = { userId: user.id, optionId };
    if (reason) voteData.reason = reason;
    newVotes.push(voteData);

    try {
      await api.votePoll(pollId, newVotes);
      setVoteReasonModal({ isOpen: false, pollId: '', optionId: '', text: '' });
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, { id: Date.now().toString(), text: '', requiresReason: false }]);
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx].text = val;
    setOptions(newOpts);
  };

  const toggleOptionReason = (idx: number) => {
    const newOpts = [...options];
    newOpts[idx].requiresReason = !newOpts[idx].requiresReason;
    setOptions(newOpts);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const openCreateModal = () => {
    setEditingPoll(null);
    setQuestion('');
    setOptions([{ id: '1', text: '', requiresReason: false }, { id: '2', text: '', requiresReason: false }]);
    setIsModalOpen(true);
  };

  const openEditModal = (poll: Poll) => {
    setEditingPoll(poll);
    setQuestion(poll.question);
    setOptions(poll.options.map(o => ({ id: o.id, text: o.text, requiresReason: o.requiresReason || false })));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || options.some(o => !o.text.trim())) return;

    try {
      if (editingPoll) {
        await api.updatePoll(editingPoll.id, {
          question,
          options: options.map(o => ({ ...o }))
        });
      } else {
        await api.createPoll({
          question,
          options: options.map(o => ({ ...o }))
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save poll:", err);
    }
  };

  const handleDeletePoll = async (id: string) => {
    if (confirm('Archive this decision node?')) {
      try {
        await api.deletePoll(id);
      } catch (err) {
        console.error("Failed to delete poll:", err);
      }
    }
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      
      {/* SaaS Polls Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
        <div>
            <h1 className="text-3xl font-bold  text-foreground">Decision Center</h1>
            <p className="text-muted-foreground text-sm mt-1">Collect feedback, reach consensus, and track team sentiment through active polls.</p>
        </div>
        {canManagePolls && (
            <button
                onClick={openCreateModal}
                className="saas-button-primary h-12 px-8 flex items-center gap-3 shadow-lg shadow-accent/20"
            >
                <Plus className="w-4 h-4" />
                Initiate New Poll
            </button>
        )}
      </div>

      {polls.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 saas-card bg-card/20 border-dashed space-y-6">
            <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center border border-border/50">
                <LucidePieChart className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-muted-foreground  tracking-[0.2em]">Telemetry Offline</h3>
                <p className="text-xs text-muted-foreground/60 font-medium">No active polls or decision nodes detected.</p>
            </div>
        </div>
      )}

      {/* Polls Stack */}
      <div className="grid grid-cols-1 gap-8">
        {polls.map((poll) => {
          const hasVoted = poll.votes.some(v => v.userId === user.id);
          const totalVotes = poll.votes.length;
          const chartData = poll.options.map(opt => ({
            name: opt.text,
            value: poll.votes.filter(v => v.optionId === opt.id).length
          }));
          const voteReasons = poll.votes.filter(v => v.reason && v.reason.trim());

          return (
            <div key={poll.id} className="saas-card overflow-hidden transition-all duration-300 hover:border-accent/30 group">
                
                {/* Poll Header */}
                <div className="p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-10 border-b border-border/50 bg-muted/5">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-accent   bg-accent/5 px-2 py-0.5 rounded-md border border-accent/20 ">Node Source v2.1</span>
                            <span className="text-[10px] font-bold text-muted-foreground/40  ">• UUID: {poll.id.substring(0, 8)}</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold text-foreground  leading-none ">{poll.question}</h2>
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                             <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">
                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[11px] font-bold text-foreground  tracking-wider">{totalVotes} Member Weights</span>
                             </div>
                             {hasVoted && (
                                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-500 shadow-sm shadow-emerald-500/5">
                                    <Check className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold  tracking-wider ">Voter Token Validated</span>
                                </div>
                             )}
                        </div>
                    </div>

                    {canManagePolls && (
                        <div className="flex items-start gap-2">
                            <button onClick={() => openEditModal(poll)} className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-accent hover:border-accent/40 shadow-sm transition-all"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeletePoll(poll.id)} className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 shadow-sm transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>

                {/* Poll Analytics Body */}
                <div className="p-8 md:p-10 grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                    
                    {/* Options Stack */}
                    <div className="xl:col-span-12 space-y-6">
                        <div className="flex items-center gap-3 mb-2 px-1">
                            <Zap className="w-3.5 h-3.5 text-accent" />
                            <span className="text-[10px] font-bold text-muted-foreground  ">Decision Vectors</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {poll.options.map((opt, idx) => {
                                const isSelected = poll.votes.some(v => v.userId === user.id && v.optionId === opt.id);
                                const voteCount = poll.votes.filter(v => v.optionId === opt.id).length;
                                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => initVote(poll.id, opt.id, !!opt.requiresReason)}
                                        className={`w-full group/opt relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden text-left ${isSelected 
                                            ? 'bg-accent/5 border-accent/40 shadow-lg shadow-accent/5' 
                                            : 'bg-card border-border/50 hover:bg-muted/30 hover:border-accent/20'}`}
                                    >
                                        <div className="relative z-10 flex items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all border ${isSelected ? 'bg-accent text-white border-accent shadow-md ' : 'bg-muted/80 text-muted-foreground border-border'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-foreground  ">{opt.text}</p>
                                                    {opt.requiresReason && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <MessageSquare className="w-3 h-3 text-accent" />
                                                            <span className="text-[9px] font-bold text-accent    opacity-80">Qualification Buffer Active</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-2xl font-bold  transition-all ${isSelected ? 'text-accent' : 'text-foreground'}`}>{percentage}%</p>
                                                <p className="text-[10px] font-bold text-muted-foreground  tracking-wider mt-0.5 opacity-60 ">{voteCount} Weights</p>
                                            </div>
                                        </div>
                                        <div className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out bg-accent/5 -z-0`} style={{ width: `${percentage}%` }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Qualification Rationale Section */}
                {voteReasons.length > 0 && (
                    <div className="p-8 md:p-10 border-t border-border/50">
                        <div className="flex items-center gap-3 mb-8 px-1">
                            <Quote className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground  ">Metric Qualification Reports</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {voteReasons.map((vote, i) => {
                                const voteUser = vote.userId === user.id ? user : { name: 'Institutional Observer', avatar: `https://ui-avatars.com/api/?name=${vote.userId}&background=transparent&color=666` };
                                const selectedOption = poll.options.find(o => o.id === vote.optionId);

                                return (
                                    <div key={i} className="saas-card p-6 bg-muted/10 border-border/40 hover:bg-muted/20 transition-all group/reason">
                                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/50">
                                            <img src={voteUser.avatar} className="w-10 h-10 rounded-xl grayscale opacity-60 group-hover/reason:grayscale-0 group-hover/reason:opacity-100 transition-all duration-500 border border-border" />
                                            <div>
                                                <p className="text-xs font-bold text-foreground truncate ">{voteUser.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                                    <p className="text-[9px] font-bold text-accent   truncate max-w-[120px] ">{selectedOption?.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed  line-clamp-3">
                                            "{vote.reason}"
                                        </p>
                                    </div>
                                );
                             })}
                        </div>
                    </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Modern Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl saas-card bg-card p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                     <Shield className="w-4 h-4 text-accent" />
                     <p className="text-[10px] font-bold text-accent   ">Metric Calibration v3.2</p>
                </div>
                <h2 className="text-3xl font-bold text-foreground  ">Poll Configuration</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 rounded-xl hover:bg-muted transition-all text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground   pl-1 ">Decision Objective</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Inquiry or statement..."
                  className="saas-input h-14 text-lg font-bold "
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-bold text-muted-foreground   ">Option Spread</label>
                  <button type="button" onClick={handleAddOption} className="text-[10px] font-bold text-accent   flex items-center gap-2 hover:opacity-70 transition-all">
                    <Plus className="w-3 h-3" /> Expand Spread
                  </button>
                </div>

                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-3 group/row">
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center font-bold text-xs text-muted-foreground  group-hover/row:text-accent transition-colors">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1 saas-input h-12 flex items-center px-0 overflow-hidden focus-within:ring-2 focus-within:ring-accent/20">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Vector 0${idx + 1}`}
                          className="flex-1 bg-transparent px-5 h-full outline-none text-sm font-bold "
                        />
                        <div className="flex items-center gap-1.5 p-1 pr-3">
                            <button
                                type="button"
                                onClick={() => toggleOptionReason(idx)}
                                title="Require Rationale"
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${opt.requiresReason ? 'bg-accent text-white' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            {options.length > 2 && (
                                <button type="button" onClick={() => handleRemoveOption(idx)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!question.trim() || options.some(o => !o.text.trim())}
                className="w-full saas-button-primary h-14 text-sm font-bold  "
              >
                {editingPoll ? 'Commit Calibration' : 'Initialize Node'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rationale Modal */}
      {voteReasonModal.isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg saas-card bg-card p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-accent" />
                <p className="text-[10px] font-bold text-accent   ">Metric Qualification v2.0</p>
              </div>
              <h3 className="text-2xl font-bold text-foreground  ">Rationale Required</h3>
              <p className="text-xs text-muted-foreground  leading-relaxed">
                Mission integrity standards require qualitative justification for this decision vector.
              </p>
            </div>

            <textarea
              value={voteReasonModal.text}
              onChange={(e) => setVoteReasonModal({ ...voteReasonModal, text: e.target.value })}
              placeholder="Justification entry..."
              className="saas-input w-full h-32 p-5 text-sm font-medium  resize-none mb-8"
              autoFocus
            />

            <div className="flex gap-4">
              <button
                onClick={() => setVoteReasonModal({ isOpen: false, pollId: '', optionId: '', text: '' })}
                className="flex-1 saas-button-outline h-12 text-xs font-bold"
              >
                Cancel Token
              </button>
              <button
                onClick={() => submitVote(voteReasonModal.pollId, voteReasonModal.optionId, voteReasonModal.text)}
                disabled={!voteReasonModal.text.trim()}
                className="flex-1 saas-button-primary h-12 text-xs font-bold"
              >
                Commit Auth
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Polls;
