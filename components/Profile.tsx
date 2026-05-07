import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types.ts';
import { api } from '../services/api';
import { Mail, Shield, Camera, Save, Edit3, CheckCircle, UploadCloud, LogOut, User as UserIcon, Wallet, CreditCard, Award, ArrowRight, Settings, Bell, Briefcase, Globe, Lock, ShieldCheck, ChevronRight, Check } from 'lucide-react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedEmail, setEditedEmail] = useState(user.email);
  const [editedLinkedinId, setEditedLinkedinId] = useState(user.linkedinId || '');
  const [editedGithubId, setEditedGithubId] = useState(user.githubId || '');
  const [avatarImage, setAvatarImage] = useState(user.avatar);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedName(user.name);
    setEditedEmail(user.email);
    setEditedLinkedinId(user.linkedinId || '');
    setEditedGithubId(user.githubId || '');
    setAvatarImage(user.avatar);
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaveFeedback(false);
      await api.updateUser(user.id, {
        name: editedName,
        email: editedEmail,
        avatar: avatarImage,
        linkedinId: editedLinkedinId,
        githubId: editedGithubId
      });

      const updatedUser = { ...user, name: editedName, email: editedEmail, avatar: avatarImage, linkedinId: editedLinkedinId, githubId: editedGithubId };
      localStorage.setItem('teamsync_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      setIsEditing(false);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 3000);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      
      {/* SaaS Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold  text-foreground">Account Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your personal information, security, and workspace preferences.</p>
        </div>
        {!isEditing && (
           <button onClick={() => setIsEditing(true)} className="saas-button-primary h-10 px-6">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
           </button>
        )}
      </div>

      {/* Main Profile Info Card */}
      <div className="saas-card overflow-hidden">
         <div className="h-24 bg-gradient-to-r from-accent/20 via-indigo-500/20 to-accent/10 border-b border-border/50" />
         <div className="px-8 pb-10">
            <div className="relative -mt-10 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card shadow-xl overflow-hidden">
                     <img src={avatarImage} className="w-full h-full object-cover" alt={editedName} />
                  </div>
                  {isEditing && (
                    <button 
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  )}
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
               </div>
               
               {isEditing && (
                 <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="saas-button-secondary h-9 px-4">Cancel</button>
                    <button onClick={handleSave} className="saas-button-primary h-9 px-6 shadow-md shadow-accent/20">Save Changes</button>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {isEditing ? (
                 <>
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground   pl-1">Full Identity</label>
                        <input 
                          type="text" 
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="saas-input h-11"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground   pl-1">Sync Email</label>
                        <input 
                          type="email" 
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          className="saas-input h-11"
                          placeholder="email@example.com"
                        />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground   pl-1">LinkedIn ID</label>
                        <input 
                          type="text" 
                          value={editedLinkedinId}
                          onChange={(e) => setEditedLinkedinId(e.target.value)}
                          className="saas-input h-11"
                          placeholder="e.g. linkedin.com/in/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground   pl-1">GitHub ID</label>
                        <input 
                          type="text" 
                          value={editedGithubId}
                          onChange={(e) => setEditedGithubId(e.target.value)}
                          className="saas-input h-11"
                          placeholder="e.g. github.com/username"
                        />
                      </div>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground ">{editedName}</h2>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                          <Mail className="w-3.5 h-3.5" /> {editedEmail}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                         <span className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold  rounded-md tracking-wider">{user.role}</span>
                         <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold  rounded-md tracking-wider">Verified Identity</span>
                      </div>
                   </div>

                   <div className="flex flex-col gap-4">
                         <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-xl">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-[#0077b5]/10 rounded-lg flex items-center justify-center border border-[#0077b5]/20 shadow-sm">
                                  <Globe className="w-5 h-5 text-[#0077b5]" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-muted-foreground  tracking-wider leading-none">LinkedIn Profile</p>
                                  {user.linkedinId ? (
                                     <a href={`https://${user.linkedinId.replace('https://', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground mt-1 hover:text-[#0077b5] transition-colors">{user.linkedinId}</a>
                                  ) : (
                                     <p className="text-sm font-medium text-muted-foreground mt-1">Not connected</p>
                                  )}
                               </div>
                            </div>
                            {user.linkedinId && <ChevronRight className="w-4 h-4 text-muted-foreground/20" />}
                         </div>
                      
                         <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-xl">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border shadow-sm">
                                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-muted-foreground  tracking-wider leading-none">GitHub Profile</p>
                                  {user.githubId ? (
                                     <a href={`https://${user.githubId.replace('https://', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground mt-1 hover:text-accent transition-colors">{user.githubId}</a>
                                  ) : (
                                     <p className="text-sm font-medium text-muted-foreground mt-1">Not connected</p>
                                  )}
                               </div>
                            </div>
                            {user.githubId && <ChevronRight className="w-4 h-4 text-muted-foreground/20" />}
                         </div>
                   </div>
                 </>
               )}
            </div>
         </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="saas-card p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
               <Settings className="w-5 h-5 text-muted-foreground" />
               <h3 className="text-sm font-bold   text-muted-foreground/80">System Preferences</h3>
            </div>
            
            <div className="space-y-2">
               {[
                 { label: "Notification Sync", info: "Push & Email enabled", active: true },
                 { label: "Biometric Auth", info: "Fingerprint ID required", active: false },
                 { label: "Real-time Analytics", info: "Stream metrics 24/7", active: true }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-all group cursor-pointer">
                    <div>
                       <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{item.label}</p>
                       <p className="text-[10px] text-muted-foreground font-medium">{item.info}</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-all ${item.active ? 'bg-accent' : 'bg-muted border border-border'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full transition-all ${item.active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="saas-card p-6 flex flex-col justify-between">
             <div className="space-y-6">
             </div>

             <div className="pt-6 mt-6 border-t border-border/50">
               <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red-500/5 transition-all duration-300"
               >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out of Sync Mode</span>
               </button>
            </div>
         </div>
      </div>

      {saveFeedback && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-5 duration-300">
           <div className="bg-foreground text-background px-6 py-3 rounded-full flex items-center gap-3 font-bold shadow-2xl border border-border/20">
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                 <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm">Profile synchronized successfully.</span>
           </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
