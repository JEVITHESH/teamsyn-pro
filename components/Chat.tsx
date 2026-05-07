import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types.ts';
import { getGroqResponse } from '../services/groqService.ts';
import { api } from '../services/api';
import { Send, User as UserIcon, Bot, Image as ImageIcon, Video as VideoIcon, X, Users, PanelRight, Trash2, Sparkles, Plus, MessageSquare, Terminal, Zap, Activity, Fingerprint, Search, Info, ShieldCheck, Cpu, Hash, Lock, ChevronRight, MoreVertical, Paperclip, Edit2, Reply, Forward, Pin, CornerUpLeft } from 'lucide-react';

interface ChatProps {
  user: User;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: 'welcome',
      senderId: 'ai-bot',
      senderName: 'AI Assistant',
      text: 'Good morning. I am your integrated assistant. How can I help with your tasks or team coordination today?',
      timestamp: Date.now(),
      chatId: 'ai_assistant',
      isBot: true,
      teamId: 'ai_chat_local'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [activeChat, setActiveChat] = useState<'group' | string>('group');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<User[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeMessages = api.subscribeToMessages((msgs: any[]) => {
      const mappedMsgs: Message[] = msgs.map((m: any) => ({
        ...m,
        id: m.id.toString(),
        senderId: m.senderId || m.sender?.id,
        senderName: m.senderName || m.sender?.name,
        timestamp: typeof m.timestamp === 'number' ? m.timestamp : new Date(m.timestamp).getTime(),
        chatId: m.chatId || 'general',
        chatType: m.chatType || 'group',
        teamId: m.teamId || 'group'
      }));
      setMessages(mappedMsgs);
    });

    const unsubscribeUsers = api.subscribeToUsers((users: any) => {
      setContacts(users);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, aiMessages, activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedMedia) return;

    const currentInput = inputText;
    setInputText('');
    setAttachedMedia(null);

    if (activeChat === 'ai_assistant') {
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: user.id.toString(),
        senderName: user.name,
        text: currentInput,
        timestamp: Date.now(),
        chatId: 'ai_assistant',
        teamId: 'ai_chat_local',
        attachment: attachedMedia || undefined
      };
      setAiMessages(prev => [...prev, newMessage]);
      setIsBotLoading(true);

      try {
        const imageUrl = (attachedMedia?.type === 'image') ? attachedMedia.url : undefined;
        const botResponseText = await getGroqResponse(currentInput, imageUrl);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          senderId: 'ai-bot',
          senderName: 'AI Analyst',
          text: botResponseText,
          timestamp: Date.now(),
          isBot: true,
          chatId: 'ai_assistant',
          teamId: 'ai_chat_local'
        };
        setAiMessages(prev => [...prev, botMessage]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsBotLoading(false);
      }
      return;
    }

    try {
      if (editingMessage) {
        await api.editMessage(editingMessage.id, currentInput);
        setEditingMessage(null);
        return;
      }

      const isDM = activeChat !== 'group' && activeChat !== 'ai_assistant';
      const recipientId = isDM ? activeChat : undefined;
      const options: any = {};
      if (replyingTo?.id) options.replyToId = replyingTo.id;
      if (forwardingMessage?.senderName) options.forwardedFrom = forwardingMessage.senderName;
      if (attachedMedia) options.attachment = attachedMedia;

      await api.sendMessage(currentInput, recipientId, options);
      
      setReplyingTo(null);
      setForwardingMessage(null);
    } catch (e: any) {
      console.error("Transmission failed", e);
      alert("Error sending message: " + (e.message || "Unknown error"));
    }
  };

  const handleDeleteForMe = async (msgId: string) => {
      await api.deleteMessageForMe(msgId);
      setActiveMessageMenu(null);
  };

  const handleDeleteForEveryone = async (msgId: string) => {
      await api.deleteMessageForEveryone(msgId);
      setActiveMessageMenu(null);
  };

  const handlePinWithDuration = async (msg: Message, hours?: number) => {
      if (!msg.isPinned && hours) {
          const expiresAt = Date.now() + hours * 3600 * 1000;
          await api.togglePinMessage(msg.id, true, expiresAt);
      } else {
          await api.togglePinMessage(msg.id, !msg.isPinned);
      }
      setActiveMessageMenu(null);
  };

  const handleReplyPrivately = (msg: Message) => {
      setActiveChat(msg.senderId);
      setReplyingTo(msg);
      setActiveMessageMenu(null);
  };

  const currentChatMessages = activeChat === 'ai_assistant'
    ? aiMessages
    : activeChat === 'group'
      ? messages.filter(m => m.chatType !== 'dm' && (m.chatId === 'general' || !m.chatType || m.chatType === 'group'))
      : (() => {
          const dmChatId = [user.id.toString(), activeChat].sort().join('_');
          return messages.filter(m => m.chatId === dmChatId);
        })();

  const chatTitle = activeChat === 'group'
    ? 'General Channel'
    : activeChat === 'ai_assistant'
      ? 'AI Assistant'
      : contacts.find(u => u.id === activeChat)?.name || 'Direct Message';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAttachedMedia({ type, url });
    }
    e.target.value = '';
  };

  return (
    <div className="flex h-full w-full gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
      
      {/* SaaS Chat Sidebar */}
      <div className={`${showContacts ? 'flex absolute inset-0 z-50 bg-background/95 backdrop-blur-xl' : 'hidden'} lg:relative lg:flex w-full lg:w-72 flex-col h-full saas-card border-border/50 overflow-hidden transition-all`}>
         <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Messages</h2>
            <button className="lg:hidden p-2 bg-muted rounded-md text-muted-foreground hover:text-foreground" onClick={() => setShowContacts(false)}>
               <X className="w-5 h-5" />
            </button>
         </div>
         <div className="p-5 pt-0">
            <div className="relative mt-4">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
               <input 
                 type="text" 
                 placeholder="Search chats..." 
                 className="saas-input h-9 pl-9 text-xs"
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <div className="px-3 py-2">
               <span className="text-[10px] font-bold text-muted-foreground  ">Channels</span>
            </div>
            
            <button
               onClick={() => { setActiveChat('group'); setShowContacts(false); }}
               className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${activeChat === 'group' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
               <Hash className="w-4 h-4" />
               <span className="text-sm font-bold">general</span>
               {activeChat === 'group' && <Activity className="w-3 h-3 ml-auto animate-pulse" />}
            </button>

            <button
               onClick={() => { setActiveChat('ai_assistant'); setShowContacts(false); }}
               className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${activeChat === 'ai_assistant' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
               <Sparkles className="w-4 h-4" />
               <span className="text-sm font-bold">AI Assistant</span>
            </button>

            <div className="px-3 py-4 mt-2">
               <span className="text-[10px] font-bold text-muted-foreground  ">Direct Messages</span>
            </div>

            {contacts.filter(u => u.id !== user.id).map(contact => (
               <button
                  key={contact.id}
                  onClick={() => { setActiveChat(contact.id.toString()); setShowContacts(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${activeChat === contact.id.toString() ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
               >
                  <div className="relative">
                     <img src={contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`} className="w-8 h-8 rounded-full border border-border/50" alt="" />
                     {contact.isActive && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />}
                  </div>
                  <span className="text-sm font-bold truncate">{contact.name}</span>
               </button>
            ))}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 saas-card bg-card/60 backdrop-blur-md border-border/50 overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-border/50 bg-muted/10">
           <div className="flex items-center gap-4">
              <div className="lg:hidden">
                 <button onClick={() => setShowContacts(!showContacts)} className="p-2 bg-muted rounded-md text-muted-foreground"><Users className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-3">
                 <h3 className="text-lg font-bold text-foreground ">{chatTitle}</h3>
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <Lock className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-500  ">Encrypted</span>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
              {showSearch ? (
                 <div className="flex items-center bg-background border border-border rounded-md px-2 py-1 relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <input 
                       autoFocus
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       placeholder="Search messages..."
                       className="bg-transparent border-none text-xs text-foreground focus:ring-0 w-32"
                    />
                    <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="ml-1 p-0.5 hover:bg-muted rounded text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                 </div>
              ) : (
                 <button onClick={() => setShowSearch(true)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"><Search className="w-4 h-4" /></button>
              )}
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"><Info className="w-4 h-4" /></button>
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"><MoreVertical className="w-4 h-4" /></button>
           </div>
        </div>

        {/* Pinned Messages Bar */}
        {(() => {
           const pinnedMessages = currentChatMessages.filter(msg => msg.isPinned && (!msg.pinExpiresAt || msg.pinExpiresAt > Date.now()));
           if (pinnedMessages.length > 0) {
              return (
                 <div className="bg-accent/5 border-b border-border/50 px-8 py-2 flex flex-col gap-2 max-h-32 overflow-y-auto shadow-sm z-10 custom-scrollbar shrink-0">
                    {pinnedMessages.map(pinned => (
                       <div key={pinned.id} className="flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                             <Pin className="w-3 h-3 text-accent shrink-0" />
                             <div className="truncate text-muted-foreground">
                                <span className="font-bold text-foreground mr-2">{pinned.senderName}</span>
                                {pinned.text}
                             </div>
                          </div>
                          <button onClick={() => api.togglePinMessage(pinned.id, false)} className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded transition-all shrink-0">
                             <X className="w-3 h-3" />
                          </button>
                       </div>
                    ))}
                 </div>
              );
           }
           return null;
        })()}

        {/* Messages Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-card/5">
           {currentChatMessages
             .filter(msg => !msg.deletedFor?.includes(user.id.toString()))
             .filter(msg => !searchQuery || msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
             .map((msg, idx) => {
              const isMe = msg.senderId.toString() === user.id.toString();
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-3 animate-in fade-in duration-300 relative group`}>
                   {!isMe && (
                      <div className="shrink-0 flex items-end">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} className="w-8 h-8 rounded-full border border-border" alt="" />
                      </div>
                   )}
                   <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%] relative`}>
                      {!isMe && <span className="text-[10px] font-bold text-muted-foreground px-1 mb-1">{msg.senderName}</span>}
                      
                      {(msg.isPinned && (!msg.pinExpiresAt || msg.pinExpiresAt > Date.now())) && (
                        <div className="text-[10px] text-accent font-bold flex items-center gap-1 mb-1 px-1">
                          <Pin className="w-3 h-3" /> Pinned
                        </div>
                      )}

                      {msg.forwardedFrom && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1 px-1 italic">
                          <Forward className="w-3 h-3" /> Forwarded from {msg.forwardedFrom}
                        </div>
                      )}

                      {msg.replyToId && (() => {
                        const repliedMsg = messages.find(m => m.id === msg.replyToId);
                        return (
                          <div className="text-xs bg-muted/30 border-l-2 border-accent/50 rounded-r p-2 mb-1 opacity-70">
                            <span className="font-bold text-accent mr-1">{repliedMsg?.senderName || 'Unknown'}:</span>
                            <span className="truncate inline-block max-w-[150px] md:max-w-[200px] align-bottom">{repliedMsg?.text || 'Original message'}</span>
                          </div>
                        );
                      })()}

                      <div className={`
                         px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group-hover:shadow-md transition-all
                         ${isMe 
                           ? 'bg-accent text-white rounded-br-sm' 
                           : msg.isBot 
                             ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-bl-sm font-medium' 
                             : 'bg-muted/50 text-foreground border border-border/50 rounded-bl-sm'
                         }
                      `}>
                         {msg.isDeleted ? (
                            <span className="italic opacity-70">This message was deleted.</span>
                         ) : (
                            msg.text
                         )}
                         {msg.isEdited && !msg.isDeleted && <span className="text-[10px] opacity-70 ml-2">(edited)</span>}
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground/40 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      
                      {/* Message Actions Menu */}
                      <div className={`absolute top-4 ${isMe ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <button onClick={() => setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-full">
                           <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeMessageMenu === msg.id && !msg.isDeleted && (
                           <div className={`absolute top-8 ${isMe ? 'right-0' : 'left-0'} w-48 saas-card shadow-xl rounded-xl py-2 z-50 text-sm border-border/50`}>
                              <button onClick={() => handleReplyPrivately(msg)} className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"><Reply className="w-3.5 h-3.5" /> Reply Privately</button>
                              <button onClick={() => { setReplyingTo(msg); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"><CornerUpLeft className="w-3.5 h-3.5" /> Reply Here</button>
                              <button onClick={() => { setForwardingMessage(msg); setInputText(`Forwarded: ${msg.text}`); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"><Forward className="w-3.5 h-3.5" /> Forward</button>
                              {(msg.isPinned && (!msg.pinExpiresAt || msg.pinExpiresAt > Date.now())) ? (
                                 <button onClick={() => handlePinWithDuration(msg)} className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"><Pin className="w-3.5 h-3.5" /> Unpin</button>
                              ) : (
                                 <div className="border-t border-b border-border/50 my-1 py-1">
                                    <div className="px-4 py-1 text-[10px] font-bold text-muted-foreground uppercase">Pin Duration</div>
                                    <button onClick={() => handlePinWithDuration(msg, 8)} className="w-full text-left px-4 py-1.5 hover:bg-muted flex items-center gap-2 text-xs"><Pin className="w-3 h-3" /> 8 Hours</button>
                                    <button onClick={() => handlePinWithDuration(msg, 24)} className="w-full text-left px-4 py-1.5 hover:bg-muted flex items-center gap-2 text-xs"><Pin className="w-3 h-3" /> 1 Day</button>
                                    <button onClick={() => handlePinWithDuration(msg, 30 * 24)} className="w-full text-left px-4 py-1.5 hover:bg-muted flex items-center gap-2 text-xs"><Pin className="w-3 h-3" /> 30 Days</button>
                                    <button onClick={() => handlePinWithDuration(msg, 60 * 24)} className="w-full text-left px-4 py-1.5 hover:bg-muted flex items-center gap-2 text-xs"><Pin className="w-3 h-3" /> 2 Months</button>
                                    <button onClick={() => handlePinWithDuration(msg, 24 * 365 * 10)} className="w-full text-left px-4 py-1.5 hover:bg-muted flex items-center gap-2 text-xs"><Pin className="w-3 h-3" /> Forever</button>
                                 </div>
                              )}
                              <button onClick={() => { alert(`Sent by: ${msg.senderName}\nTime: ${new Date(msg.timestamp).toLocaleString()}\nID: ${msg.id}`); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Info</button>
                              {isMe && <button onClick={() => { setEditingMessage(msg); setInputText(msg.text); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"><Edit2 className="w-3.5 h-3.5" /> Edit</button>}
                              <button onClick={() => handleDeleteForMe(msg.id)} className="w-full text-left px-4 py-2 hover:bg-muted text-red-500 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete for Me</button>
                              {isMe && <button onClick={() => handleDeleteForEveryone(msg.id)} className="w-full text-left px-4 py-2 hover:bg-muted text-red-500 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete for Everyone</button>}
                           </div>
                        )}
                      </div>
                   </div>
                </div>
              );
           })}
           {isBotLoading && (
              <div className="flex justify-start gap-3 animate-pulse">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-indigo-500 animate-spin" />
                 </div>
                 <div className="bg-muted/20 border border-border/30 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="h-2 w-16 bg-muted-foreground/30 rounded-full" />
                 </div>
              </div>
           )}
        </div>

        {/* SaaS Chat Input */}
        <div className="p-6 border-t border-border/50 bg-muted/5">
           <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              {(replyingTo || forwardingMessage || editingMessage) && (
                 <div className="flex items-center justify-between bg-accent/10 border border-accent/20 rounded-t-xl px-4 py-2 text-xs text-accent font-bold mb-0">
                    <div className="flex items-center gap-2">
                       {replyingTo && <><CornerUpLeft className="w-3 h-3" /> Replying to {replyingTo.senderName}</>}
                       {forwardingMessage && <><Forward className="w-3 h-3" /> Forwarding message</>}
                       {editingMessage && <><Edit2 className="w-3 h-3" /> Editing message</>}
                    </div>
                    <button type="button" onClick={() => { setReplyingTo(null); setForwardingMessage(null); setEditingMessage(null); setInputText(''); }} className="p-1 hover:bg-accent/20 rounded-full">
                       <X className="w-3 h-3" />
                    </button>
                 </div>
              )}
              <div className={`relative flex items-center bg-background border border-border focus-within:border-accent/40 shadow-sm transition-all pr-2 ${replyingTo || forwardingMessage || editingMessage ? 'rounded-b-xl border-t-0' : 'rounded-xl'}`}>
                 <button 
                   type="button"
                   onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                   className={`p-3 text-muted-foreground hover:text-accent transition-all ${showAttachmentMenu ? 'text-accent' : ''}`}
                 >
                   <Paperclip className="w-4 h-4" />
                 </button>
                 
                 <input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={activeChat === 'ai_assistant' ? "Ask the AI Assistant..." : "Message " + chatTitle + "..."}
                    className="flex-1 bg-transparent border-none py-4 text-sm text-foreground focus:ring-0 placeholder:text-muted-foreground/50"
                 />
                 
                 <button
                    type="submit"
                    disabled={!inputText.trim() && !attachedMedia}
                    className={`p-2 rounded-lg transition-all ${inputText.trim() || attachedMedia ? 'bg-accent text-white shadow-md' : 'text-muted-foreground opacity-30 cursor-not-allowed'}`}
                 >
                    <Send className="w-4 h-4" />
                 </button>
              </div>

              {/* Minimalist Attachment Menu */}
              {showAttachmentMenu && (
                <div className="absolute bottom-24 left-10 saas-card p-2 animate-in slide-in-from-bottom-2 flex gap-1 bg-card shadow-2xl border-accent/20">
                   <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-accent transition-all"><ImageIcon className="w-4 h-4" /></button>
                   <button type="button" onClick={() => videoInputRef.current?.click()} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-accent transition-all"><VideoIcon className="w-4 h-4" /></button>
                   <button type="button" className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-accent transition-all"><Plus className="w-4 h-4" /></button>
                </div>
              )}

              <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
              <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
           </form>
           <p className="text-[10px] text-center text-muted-foreground/30 mt-3 font-bold  ">Workspace Compliance Active • All logs archived</p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
