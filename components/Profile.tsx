
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types.ts';
import { api } from '../services/api';
import { Mail, Shield, Camera, Image as ImageIcon, Save, X, Edit3, CheckCircle, UploadCloud } from 'lucide-react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedEmail, setEditedEmail] = useState(user.email);
  const [avatarImage, setAvatarImage] = useState(user.avatar);
  const [bannerImage, setBannerImage] = useState<string | null>(localStorage.getItem(`teamsync_banner_${user.id}`));
  const [saveFeedback, setSaveFeedback] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedName(user.name);
    setEditedEmail(user.email);
    setAvatarImage(user.avatar);
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'avatar') {
          setAvatarImage(base64String);
        } else {
          setBannerImage(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaveFeedback(false);

      // 1. Update Firestore
      await api.updateUser(user.id, {
        name: editedName,
        email: editedEmail,
        avatar: avatarImage
      });

      // 2. Update local storage for immediate session reflection (legacy support)
      const updatedUser = { ...user, name: editedName, email: editedEmail, avatar: avatarImage };
      localStorage.setItem('teamsync_user', JSON.stringify(updatedUser)); // Keep for session restore

      // 3. Save banner locally (client preference)
      if (bannerImage) {
        localStorage.setItem(`teamsync_banner_${user.id}`, bannerImage);
      }

      // 4. Trigger app-wide sync
      window.dispatchEvent(new Event('storage'));

      setIsEditing(false);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 3000);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setEditedName(user.name);
    setEditedEmail(user.email);
    setAvatarImage(user.avatar);
    setBannerImage(localStorage.getItem(`teamsync_banner_${user.id}`));
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 no-scrollbar">
      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">

        {/* Banner Section */}
        <div
          className="h-64 md:h-72 relative bg-zinc-950 group cursor-default"
          style={bannerImage ? { backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent"></div>

          {isEditing && (
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <UploadCloud className="w-10 h-10 text-white mb-2" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Update Workspace Banner</span>
            </button>
          )}
          <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
        </div>

        <div className="pt-24 px-8 md:px-12 pb-12 relative">

          {/* Avatar Section */}
          <div className="absolute -top-16 md:-top-20 left-8 md:left-12 group">
            <div className="relative p-2 bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl">
              <img src={avatarImage} className="w-28 h-28 md:w-40 md:h-40 rounded-[1.5rem] md:rounded-[2.5rem] object-cover" alt={editedName} />

              {isEditing && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-2 flex items-center justify-center bg-black/60 rounded-[1.5rem] md:rounded-[2.5rem] text-white opacity-0 group-hover:opacity-100 transition-opacity border-2 md:border-4 border-white dark:border-zinc-900"
                >
                  <Camera className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              )}
            </div>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'avatar')} />
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Identify Name</label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full text-xl md:text-2xl font-black bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none dark:text-white uppercase tracking-tighter"
                      placeholder="Enter name..."
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2 uppercase leading-none">{editedName}</h1>
                    <p className="text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">Registry Status: Fully Verified</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-zinc-100 dark:bg-zinc-800 px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-500 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-zinc-100 active:scale-95 transition-all"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                  <button onClick={onLogout} className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all">Detach Session</button>
                </>
              )}
            </div>
          </div>

          {/* Identity Fields Section */}
          <div className="mt-16 space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-[3rem] p-8 md:p-12 border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-12">Security Registry</h3>

              <div className="space-y-12">
                <div className="flex items-center gap-6 md:gap-8">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center justify-center text-zinc-400 shadow-sm">
                    <Mail className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Electronic Identity</p>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        className="w-full text-lg md:text-xl font-bold bg-white dark:bg-zinc-900 border-none rounded-2xl px-6 py-3 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none dark:text-white"
                        placeholder="email@company.pro"
                      />
                    ) : (
                      <p className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">{editedEmail}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 md:gap-8">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center justify-center text-zinc-400 shadow-sm">
                    <Shield className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Authorization Level</p>
                    <div className="flex items-center gap-3">
                      <p className="text-lg md:text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{user.role}</p>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {saveFeedback && (
            <div className="fixed bottom-20 md:bottom-12 left-1/2 -translate-x-1/2 bg-zinc-900 text-white dark:bg-white dark:text-black px-6 py-3 md:px-8 md:py-4 rounded-2xl flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4 z-[200]">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Profile Synchronized</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
