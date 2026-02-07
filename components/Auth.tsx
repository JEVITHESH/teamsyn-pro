import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { Mail, Lock, Shield, Users, User as UserIcon, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MEMBER);
  const [teamName, setTeamName] = useState('');
  const [teamPasskey, setTeamPasskey] = useState('');
  const [adminPasskey, setAdminPasskey] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [step, setStep] = useState<1 | 2>(1);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Step 1: Identity (Common)
    if (mode === 'REGISTER' && step === 1) {
      if (!name || !email || !password) {
        setError("Please fill in all identity fields.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      // Force Step 2 for Role & Team details
      setStep(2);
      return;
    }

    setIsVerifying(true);

    try {
      if (mode === 'LOGIN') {
        const data = await api.login({ email, password, teamPasskey: '' });

        // Check if user is pending approval
        if (data.user.role === UserRole.TEAM_LEADER && !data.user.isApproved) {
          alert("Your account is pending Admin approval. You cannot access the team dashboard yet.");
        }

        localStorage.setItem('teamsync_access_token', data.accessToken);
        localStorage.setItem('teamsync_refresh_token', data.refreshToken);
        onLogin(data.user);
      } else {
        // REGISTER

        if (selectedRole === UserRole.TEAM_LEADER && !adminPasskey) {
          throw new Error("Admin Passkey is required.");
        }
        if (selectedRole === UserRole.MEMBER && !teamPasskey) {
          throw new Error("Team Passkey is required.");
        }
        if (selectedRole === UserRole.ADMIN && !branchName) {
          throw new Error("Organization/Branch Name is required.");
        }

        await api.register({
          email,
          password,
          role: selectedRole,
          name: name || email.split('@')[0],
          teamName: selectedRole === UserRole.TEAM_LEADER ? undefined : undefined,
          teamPasskey: selectedRole === UserRole.MEMBER ? teamPasskey : undefined,
          adminPasskey: selectedRole === UserRole.TEAM_LEADER ? adminPasskey : undefined,
          branchName: selectedRole === UserRole.ADMIN ? branchName : undefined
        });

        if (selectedRole === UserRole.TEAM_LEADER) {
          alert("Registration Submitted! Waiting for Admin Approval.");
        } else if (selectedRole === UserRole.MEMBER) {
          alert("Registration Submitted! Request sent to Team Leader. Please wait for approval.");
        } else {
          alert("Registration Successful! Welcome to the team.");
        }

        setMode('LOGIN');
        setStep(1);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "Authentication failed";
      // ... same error mapping ...
      if (typeof msg === 'string') {
        if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
          msg = "Invalid email or password. If you are new, please Register first.";
        } else if (msg.includes('auth/email-already-in-use')) {
          msg = "This email is already registered. Please log in.";
        }
      }
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'LOGIN' ? 'REGISTER' : 'LOGIN');
    setStep(1);
    setError('');
  };

  const roles = [
    { id: UserRole.MEMBER, icon: UserIcon, label: 'Member' },
    { id: UserRole.TEAM_LEADER, icon: Users, label: 'Leader' },
    { id: UserRole.ADMIN, icon: Shield, label: 'Admin' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      <div className="w-full max-w-[420px] p-4 flex flex-col items-center">

        {/* Header Section */}
        <div className="text-center mb-10 space-y-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">TeamSync Pro</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              {mode === 'REGISTER'
                ? (step === 1 ? 'New Personnel Registration (1/2)' : 'Finalize Authorization (2/2)')
                : 'System Access Portal'}
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full bg-[#0E0E10] border border-[#1F1F22] rounded-[2.5rem] p-2">
          <div className="bg-[#131315] rounded-[2rem] p-6 border border-white/5 space-y-8">

            <form onSubmit={handleAuth} className="space-y-8">

              {/* STEP 1: Identification */}
              {(mode === 'LOGIN' || step === 1) && (
                <div className="space-y-8 animate-in slide-in-from-left-4 fade-in duration-500">

                  {/* Fields */}
                  <div className="space-y-3">
                    {/* Name - Register Only */}
                    {mode === 'REGISTER' && (
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><UserIcon className="h-4 w-4 text-[#52525B]" /></div>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#1C1C1F] text-white text-sm font-bold border-none rounded-2xl py-4 pl-11 pr-4 placeholder:text-[#3F3F46]" placeholder="Full Name" required={mode === 'REGISTER'} autoFocus />
                      </div>
                    )}

                    {/* Email */}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-[#52525B]" /></div>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#1C1C1F] text-white text-sm font-bold border-none rounded-2xl py-4 pl-11 pr-4 placeholder:text-[#3F3F46]" placeholder="Email Address" required />
                    </div>

                    {/* Password */}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-[#52525B]" /></div>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#1C1C1F] text-white text-sm font-bold border-none rounded-2xl py-4 pl-11 pr-4 placeholder:text-[#3F3F46]" placeholder="Password" required />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Authorization (Register Only) */}
              {mode === 'REGISTER' && step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500">
                  {/* Role Selector */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <button type="button" onClick={() => setSelectedRole(UserRole.TEAM_LEADER)} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedRole === UserRole.TEAM_LEADER ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800'}`}>
                      <Users className="w-5 h-5 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-center">Create Team</span>
                    </button>
                    <button type="button" onClick={() => setSelectedRole(UserRole.MEMBER)} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedRole === UserRole.MEMBER ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800'}`}>
                      <UserIcon className="w-5 h-5 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-center">Join Team</span>
                    </button>
                    <button type="button" onClick={() => setSelectedRole(UserRole.ADMIN)} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedRole === UserRole.ADMIN ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800'}`}>
                      <Shield className="w-5 h-5 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-center">Admin</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Leader: Admin Passkey Only */}
                    {selectedRole === UserRole.TEAM_LEADER && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-extrabold text-[#52525B] uppercase tracking-widest ml-1">Admin Authorization</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Shield className="h-4 w-4 text-[#52525B]" /></div>
                            <input type="password" value={adminPasskey} onChange={(e) => setAdminPasskey(e.target.value)} className="w-full bg-[#1C1C1F] text-white text-sm font-bold border-none rounded-2xl py-4 pl-11 pr-4 placeholder:text-[#3F3F46]" placeholder="Admin Passkey" autoFocus />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Member: Passkey */}
                    {selectedRole === UserRole.MEMBER && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-extrabold text-[#52525B] uppercase tracking-widest ml-1">Access Credentials</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-[#52525B]" /></div>
                          <input type="password" value={teamPasskey} onChange={(e) => setTeamPasskey(e.target.value)} className="w-full bg-[#1C1C1F] text-white text-sm font-bold border-none rounded-2xl py-4 pl-11 pr-4 placeholder:text-[#3F3F46]" placeholder="Team Passkey" autoFocus />
                        </div>
                        <p className="text-[9px] text-zinc-500 px-1">Request will be sent to Team Leader for approval.</p>
                      </div>
                    )}

                    {/* Admin: Branch Name */}
                    {selectedRole === UserRole.ADMIN && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-extrabold text-[#52525B] uppercase tracking-widest ml-1">Establish Headquarters</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Shield className="h-4 w-4 text-[#52525B]" /></div>
                          <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} className="w-full bg-[#1C1C1F] text-white text-sm font-bold border-none rounded-2xl py-4 pl-11 pr-4 placeholder:text-[#3F3F46]" placeholder="Organization Name" autoFocus />
                        </div>
                        <p className="text-[9px] text-zinc-500 px-1">This will create a new isolated command branch.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wide animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button type="submit" disabled={isVerifying} className="w-full bg-white text-black font-black uppercase tracking-[0.15em] text-xs py-5 rounded-2xl hover:opacity-90 transition-all disabled:opacity-50">
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
                    (mode === 'LOGIN' ? 'Access System' :
                      (step === 1 ? 'Continue' :
                        (selectedRole === UserRole.TEAM_LEADER ? 'Complete Registration' : 'Complete Registration')
                      )
                    )
                  }
                </button>

                {mode === 'REGISTER' && step === 2 && (
                  <button type="button" onClick={() => setStep(1)} className="w-full text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest py-3">Back to Identity</button>
                )}
              </div>
            </form>
          </div>

          <div className="text-center mt-6">
            <button onClick={toggleMode} className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-bold">
              {mode === 'LOGIN' ? 'New Personnel? Initialize Registration' : 'Already Authorized? System Login'}
            </button>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Login;