import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { Mail, Lock, Shield, Users, User as UserIcon, Loader2, AlertTriangle, Zap, Terminal, ShieldCheck, Activity, Target, Cpu, Fingerprint, Key, ArrowRight, ChevronRight, Globe, ShieldAlert, X, Check } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MEMBER);
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

    if (mode === 'REGISTER' && step === 1) {
      if (!name || !email || !password) {
        setError("Please complete all fields");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      setStep(2);
      return;
    }

    setIsVerifying(true);

    try {
      if (mode === 'LOGIN') {
        const data = await api.login({ email, password, teamPasskey: '' });
        localStorage.setItem('teamsync_access_token', data.accessToken);
        localStorage.setItem('teamsync_refresh_token', data.refreshToken);
        onLogin(data.user);
      } else {
        if (selectedRole === UserRole.TEAM_LEADER && !adminPasskey) {
          throw new Error("Admin authorization key required");
        }
        if (selectedRole === UserRole.MEMBER && !teamPasskey) {
          throw new Error("Team access key required");
        }
        if (selectedRole === UserRole.ADMIN && !branchName) {
           throw new Error("Organization name required");
        }

        await api.register({
          email,
          password,
          role: selectedRole,
          name: name || email.split('@')[0],
          teamPasskey: selectedRole === UserRole.MEMBER ? teamPasskey : undefined,
          adminPasskey: selectedRole === UserRole.TEAM_LEADER ? adminPasskey : undefined,
          branchName: selectedRole === UserRole.ADMIN ? branchName : undefined
        });

        setMode('LOGIN');
        setStep(1);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "Authentication failed";
      if (typeof msg === 'string') {
        if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
          msg = "Invalid email or password";
        } else if (msg.includes('auth/email-already-in-use')) {
          msg = "This email is already in use";
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
    { id: UserRole.MEMBER, icon: UserIcon, label: 'Standard Member', desc: 'Join an existing team node' },
    { id: UserRole.TEAM_LEADER, icon: Users, label: 'Team Manager', desc: 'Oversee and coordinate units' },
    { id: UserRole.ADMIN, icon: Shield, label: 'System Admin', desc: 'Global workspace control' },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background selection:bg-accent/30">
      
      {/* SaaS Subtle Background Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.03),transparent_40%)] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        
        {/* Modern SaaS Branding */}
        <div className="text-center mb-10 space-y-4">
           <div className="w-16 h-16 bg-accent rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-accent/20 border border-white/10 mb-6">
              <Zap className="w-8 h-8 text-white fill-white" />
           </div>
           <h1 className="text-4xl font-bold  text-foreground">
              TeamSync<span className="text-accent underline decoration-accent/20 decoration-4 underline-offset-4"> Pro</span>
           </h1>
           <p className="text-sm font-medium text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
              The professional standard for high-performance team coordination.
           </p>
        </div>

        {/* Auth Content Card */}
        <div className="saas-card p-10 animate-in fade-in zoom-in-95 duration-500 bg-card/80 backdrop-blur-xl border-border/50 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.1)]">
           
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-foreground">
                 {mode === 'LOGIN' ? 'Sign In' : 'Create Account'}
              </h2>
              {mode === 'REGISTER' && (
                 <div className="flex gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${step === 1 ? 'bg-accent' : 'bg-muted'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${step === 2 ? 'bg-accent' : 'bg-muted'}`} />
                 </div>
              )}
           </div>

           <form onSubmit={handleAuth} className="space-y-6">
              
              {/* Login / Reg Step 1 Fields */}
              {(mode === 'LOGIN' || step === 1) && (
                <div className="space-y-4 animate-in fade-in duration-300">
                   {mode === 'REGISTER' && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground   pl-1">Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="saas-input h-12"
                          placeholder="Morgan Stanley"
                          required={mode === 'REGISTER'}
                        />
                      </div>
                   )}

                   <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground   pl-1">Work Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="saas-input h-12"
                        placeholder="analyst@teamsync.pro"
                        required
                      />
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center justify-between">
                         <label className="text-[11px] font-bold text-muted-foreground   pl-1">Password</label>
                         {mode === 'LOGIN' && <button type="button" className="text-[10px] text-accent font-bold hover:underline">Forgot?</button>}
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="saas-input h-12 font-mono"
                        placeholder="••••••••"
                        required
                      />
                   </div>
                </div>
              )}

              {/* Reg Step 2: Roles */}
              {mode === 'REGISTER' && step === 2 && (
                 <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-muted-foreground   pl-1">Select Your Role</label>
                       <div className="grid grid-cols-1 gap-2">
                          {roles.map((role) => (
                             <button
                                key={role.id}
                                type="button"
                                onClick={() => setSelectedRole(role.id as UserRole)}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${selectedRole === role.id ? 'bg-accent/5 border-accent/40 ring-1 ring-accent/20' : 'bg-muted/10 border-border/50 hover:bg-muted/20'}`}
                             >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${selectedRole === role.id ? 'bg-accent text-white shadow-lg' : 'bg-card text-muted-foreground border border-border'}`}>
                                   <role.icon className="w-4 h-4" />
                                </div>
                                <div>
                                   <p className={`text-sm font-bold ${selectedRole === role.id ? 'text-foreground' : 'text-muted-foreground'}`}>{role.label}</p>
                                   <p className="text-[10px] text-muted-foreground/60 leading-none mt-0.5">{role.desc}</p>
                                </div>
                                {selectedRole === role.id && <Check className="w-4 h-4 ml-auto text-accent" />}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border/50">
                       <label className="text-[11px] font-bold text-accent   pl-1">Authorization</label>
                       {selectedRole === UserRole.TEAM_LEADER && (
                          <input type="password" value={adminPasskey} onChange={(e) => setAdminPasskey(e.target.value)} className="saas-input h-12 font-mono border-accent/20" placeholder="Admin Authorization Key" />
                       )}
                       {selectedRole === UserRole.MEMBER && (
                          <input type="password" value={teamPasskey} onChange={(e) => setTeamPasskey(e.target.value)} className="saas-input h-12 font-mono border-accent/20" placeholder="Team Invitation Key" />
                       )}
                       {selectedRole === UserRole.ADMIN && (
                          <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} className="saas-input h-12 border-accent/20" placeholder="Organization Branch ID" />
                       )}
                    </div>
                 </div>
              )}

              {error && (
                 <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-[11px] font-bold text-red-500  tracking-wider">{error}</span>
                 </div>
              )}

              <div className="flex flex-col gap-4 pt-2">
                 <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all duration-300 shadow-xl shadow-accent/10 flex items-center justify-center gap-3"
                 >
                    {isVerifying ? (
                       <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                       <>
                          <span>{mode === 'LOGIN' ? 'Sign In' : (step === 1 ? 'Next' : 'Complete Registration')}</span>
                          <ArrowRight className="w-4 h-4" />
                       </>
                    )}
                 </button>

                 {mode === 'REGISTER' && step === 2 && (
                    <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-muted-foreground hover:text-foreground   transition-colors flex items-center justify-center gap-2">
                       <ChevronRight className="w-3 h-3 rotate-180" /> Back to identity
                    </button>
                 )}
              </div>
           </form>
        </div>

        {/* Auth Toggle Link */}
        <div className="text-center mt-8">
           <button onClick={toggleMode} className="text-[11px] font-bold text-muted-foreground hover:text-accent transition-all group flex items-center justify-center gap-2 mx-auto  ">
              {mode === 'LOGIN' ? (
                <>Need an account? <span className="text-accent underline decoration-accent/20 decoration-2 underline-offset-4">Create one</span></>
              ) : (
                <>Already have an account? <span className="text-accent underline decoration-accent/20 decoration-2 underline-offset-4">Sign in</span></>
              )}
           </button>
        </div>

        {/* Security Footer Badge */}
        <div className="mt-16 flex items-center justify-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
           <ShieldCheck className="w-4 h-4" />
           <span className="text-[10px] font-bold  tracking-[0.2em]">Enterprise Grade Security Active</span>
        </div>

      </div>
    </div>
  );
};

export default Login;
