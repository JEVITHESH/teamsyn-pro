import React, { useState, useEffect } from 'react';
import { User, Poll, UserRole, Vote } from '../types.ts';
import { api } from '../services/api';
import { Plus, Trash2, X, Edit, Save, Check, MessageSquare, Quote, BarChart2, PieChart as PieIcon, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PollsProps {
  user: User;
}

// Vibrant Premium Colors
const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

const Polls: React.FC<PollsProps> = ({ user }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);

  // Form State
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<{ id: string, text: string, requiresReason: boolean }[]>([
    { id: '1', text: '', requiresReason: false },
    { id: '2', text: '', requiresReason: false }
  ]);

  // Vote Reason State
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

  // Real-time Polls Subscription
  useEffect(() => {
    const unsubscribe = api.subscribeToPolls((updatedPolls) => {
      setPolls(updatedPolls);
    });
    return () => unsubscribe();
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

    // Remove existing vote if any
    const newVotes = pollToUpdate.votes.filter(v => v.userId !== user.id);
    // Add new vote
    const voteData: any = { userId: user.id, optionId };
    if (reason) voteData.reason = reason;
    newVotes.push(voteData);

    try {
      await api.votePoll(pollId, newVotes);
      setVoteReasonModal({ isOpen: false, pollId: '', optionId: '', text: '' });
    } catch (err) {
      console.error("Failed to vote:", err);
      alert("Failed to submit vote. Please try again.");
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
        // Edit Mode
        await api.updatePoll(editingPoll.id, {
          question,
          options: options.map(o => ({ ...o }))
        });
      } else {
        // Create Mode
        await api.createPoll({
          question,
          options: options.map(o => ({ ...o }))
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save poll:", err);
      alert("Failed to save poll.");
    }
  };

  const handleDeletePoll = async (id: string) => {
    if (confirm('Are you sure you want to delete this poll?')) {
      try {
        await api.deletePoll(id);
      } catch (err) {
        console.error("Failed to delete poll:", err);
        alert("Failed to delete poll.");
      }
    }
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (percent === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-black">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 px-4 sm:px-0">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-2xl ring-1 ring-indigo-500/20">
              <BarChart2 className="w-6 h-6 text-indigo-500" />
            </div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Consensus</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm max-w-md">
            Cast your vote on active unit decisions. Your input directly influences operational strategy.
          </p>
        </div>

        {canManagePolls && (
          <button
            onClick={openCreateModal}
            className="group flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-black pl-5 pr-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-200 dark:shadow-none hover:translate-y-[-2px] transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            Initialize Poll
          </button>
        )}
      </div>

      {polls.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center">
            <PieIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-widest">No Active Vectors</h3>
            <p className="text-zinc-400 text-sm mt-2 font-medium">There are currently no active polls for this unit.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10">
        {polls.map((poll) => {
          const hasVoted = poll.votes.some(v => v.userId === user.id);
          const totalVotes = poll.votes.length;

          const chartData = poll.options.map(opt => ({
            name: opt.text,
            value: poll.votes.filter(v => v.optionId === opt.id).length
          }));

          const votesWithReasons = poll.votes.filter(v => v.reason && v.reason.trim());

          return (
            <div key={poll.id} className="group relative bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 p-8 md:p-10 shadow-sm hover:shadow-xl hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-500 overflow-hidden">

              {/* Card Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex-1 pr-12">
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-tight">
                      {poll.question}
                    </h3>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                        <Users className="w-3 h-3" /> {totalVotes} Votes
                      </span>
                      {hasVoted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3" /> Submitted
                        </span>
                      )}
                    </div>
                  </div>

                  {canManagePolls && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEditModal(poll)} className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-indigo-600 dark:hover:text-white rounded-xl transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeletePoll(poll.id)} className="p-3 bg-red-50 dark:bg-red-900/10 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  {/* Options List */}
                  <div className="space-y-4">
                    {poll.options.map((opt, idx) => {
                      const isSelected = poll.votes.some(v => v.userId === user.id && v.optionId === opt.id);
                      const voteCount = poll.votes.filter(v => v.optionId === opt.id).length;
                      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => initVote(poll.id, opt.id, !!opt.requiresReason)}
                          className={`w-full relative overflow-hidden rounded-2xl border-2 transition-all duration-300 group/btn ${isSelected
                              ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg scale-[1.02]'
                              : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 text-zinc-600 dark:text-zinc-300'
                            }`}
                        >
                          {/* Progress Bar Background */}
                          {!isSelected && totalVotes > 0 && (
                            <div
                              className="absolute inset-y-0 left-0 bg-zinc-50 dark:bg-zinc-800 transition-all duration-1000 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          )}

                          <div className="relative flex items-center justify-between p-5">
                            <div className="flex items-center gap-4 text-left">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isSelected ? 'bg-white/20 text-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                }`}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <div>
                                <span className="block font-bold text-sm uppercase tracking-wide">{opt.text}</span>
                                {opt.requiresReason && (
                                  <span className={`text-[8px] opacity-60 font-black uppercase tracking-wider flex items-center gap-1 mt-1`}>
                                    <MessageSquare className="w-2.5 h-2.5" /> Opinion Required
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="block text-lg font-black">{percentage}%</span>
                              <span className={`text-[9px] font-bold uppercase tracking-widest opacity-60`}>{voteCount} Votes</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Chart Area */}
                  <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-black/20 rounded-[2rem]">
                    {totalVotes > 0 ? (
                      <div className="relative">
                        <PieChart width={240} height={240}>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            dataKey="value"
                            paddingAngle={5}
                            cornerRadius={5}
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(255, 255, 255, 0.9)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          />
                        </PieChart>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{totalVotes}</span>
                          <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Total</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center text-zinc-400">
                        <BarChart2 className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Pending Data</p>
                      </div>
                    )}

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      {chartData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Voter Insights Section */}
                {canManagePolls && votesWithReasons.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">
                      <Quote className="w-4 h-4" />
                      Qualitative Data
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {votesWithReasons.map((vote, i) => {
                        const voteUser = vote.userId === user.id ? user : { name: 'Team Member', avatar: `https://ui-avatars.com/api/?name=${vote.userId}&background=random` };
                        const selectedOption = poll.options.find(o => o.id === vote.optionId);

                        return (
                          <div key={i} className="group/card bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-3xl border border-zinc-100 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                            <div className="flex items-start gap-3">
                              <img src={voteUser.avatar} className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-zinc-700" alt="" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase text-zinc-900 dark:text-white truncate">{voteUser.name}</p>
                                <p className="text-[9px] font-medium text-zinc-400">Selected: <span className="text-indigo-500 font-bold">{selectedOption?.text}</span></p>
                              </div>
                            </div>
                            <div className="mt-3 pl-11 relative">
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                              <p className="text-xs text-zinc-600 dark:text-zinc-300 italic font-medium leading-relaxed pl-3">"{vote.reason}"</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modern Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                    {editingPoll ? 'Modify Vector' : 'Initialize Protocol'}
                  </h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                    {editingPoll ? 'Update parameters' : 'New consensus node'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Core Inquiry</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter the main question..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white placeholder:text-zinc-400"
                  autoFocus
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Variables</label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg"
                  >
                    <Plus className="w-3 h-3" /> Add Variable
                  </button>
                </div>

                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="group flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 pl-4 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0 outline-none dark:text-white"
                        />
                        <div className="flex items-center gap-1 pr-1">
                          <button
                            type="button"
                            onClick={() => toggleOptionReason(idx)}
                            className={`p-2 rounded-xl transition-all ${opt.requiresReason
                              ? 'bg-indigo-500 text-white shadow-md'
                              : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200'
                              }`}
                            title="Require reason for this option"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex gap-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={!question.trim() || options.some(o => !o.text.trim())}
                className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              >
                {editingPoll ? 'Save Configuration' : 'Execute Launch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Improved Vote Reason Modal */}
      {voteReasonModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in duration-300 border border-zinc-200 dark:border-zinc-800">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

            <div className="mb-6">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-4">
                <Quote className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Validation Required</h3>
              <p className="text-xs text-zinc-500 font-medium mt-2 leading-relaxed">
                This selection requires a brief rationale to ensure qualitative data integrity.
              </p>
            </div>

            <textarea
              value={voteReasonModal.text}
              onChange={(e) => setVoteReasonModal({ ...voteReasonModal, text: e.target.value })}
              placeholder="Elaborate on your choice..."
              className="w-full h-32 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white resize-none mb-6 placeholder:text-zinc-400"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setVoteReasonModal({ isOpen: false, pollId: '', optionId: '', text: '' })}
                className="flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => submitVote(voteReasonModal.pollId, voteReasonModal.optionId, voteReasonModal.text)}
                disabled={!voteReasonModal.text.trim()}
                className="flex-[1.5] py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
              >
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Polls;