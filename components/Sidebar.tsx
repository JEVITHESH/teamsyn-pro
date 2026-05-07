import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, UserRole } from '../types.ts';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  Ticket,
  X,
  Shield,
  Zap,
  TrendingUp,
  Activity,
  UserCheck,
  Bell,
  Command,
  HelpCircle,
  Menu,
  Sun,
  Moon,
  Search,
  ChevronRight,
  Hash,
  FolderKanban
} from 'lucide-react';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Standups', path: '/standup', icon: UserCheck },
    { name: 'Messages', path: '/chat', icon: MessageSquare },
    { name: 'Polls', path: '/polls', icon: TrendingUp },
    { name: 'Tickets', path: '/tickets', icon: Ticket },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
  ];

  const adminNavItems = user.role === UserRole.ADMIN || user.role === 'ADMIN' ? [
    { name: 'Admin Console', path: '/admin', icon: Shield },
  ] : [];

  const footerNavItems = [
    { name: 'Profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-background/40 backdrop-blur-sm z-[150] md:hidden transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-card/80 backdrop-blur-xl border-r border-border/50 transition-all duration-500 ease-out z-[200]
        md:relative md:translate-x-0 flex flex-col shadow-2xl shadow-black/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Brand Node */}
        <div className="h-16 flex items-center px-8 border-b border-border/40 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full" />
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform duration-500">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-lg font-display font-bold text-foreground">TeamSync<span className="text-accent"> Pro</span></span>
           </div>
           <button onClick={onClose} className="md:hidden ml-auto p-2 text-muted-foreground hover:text-foreground">
             <X className="w-6 h-6" />
           </button>
        </div>

        {/* Dynamic Navigation */}
        <div className="flex-1 px-4 py-8 space-y-10 overflow-y-auto custom-scrollbar">
          
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] px-4 mb-4">Operations Interface</p>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-4 px-4 py-3 text-sm font-semibold transition-all group rounded-xl relative
                  ${isActive
                    ? 'bg-accent/5 text-accent shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-accent' : 'text-muted-foreground/60 group-hover:text-accent'}`} />
                    <span>{item.name}</span>
                    {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-accent rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {adminNavItems.length > 0 && (
            <div className="space-y-1.5 pt-4">
              <p className="text-[10px] font-bold text-accent/40 uppercase tracking-[0.3em] px-4 mb-4">Core Control</p>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-4 px-4 py-3 text-sm font-semibold transition-all group rounded-xl
                    ${isActive
                      ? 'bg-accent/5 text-accent shadow-sm border border-accent/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                  `}
                >
                  <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Personnel Profile Node */}
        <div className="p-6 border-t border-border/40 bg-muted/10">
           <div className="p-4 bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl shadow-sm space-y-5 transition-all hover:border-accent/30 group">
              <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-border shadow-sm group-hover:border-accent/30 transition-all duration-500">
                   <img src={user.avatar} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground truncate ">{user.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[10px] font-bold text-accent tracking-widest uppercase">{user.role}</span>
                    </div>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                 {footerNavItems.map(item => (
                    <NavLink key={item.path} to={item.path} onClick={onClose} className="p-2 flex items-center justify-center gap-2 bg-muted/40 hover:bg-accent/10 hover:text-accent rounded-xl border border-border/50 text-muted-foreground transition-all">
                       <item.icon className="w-4 h-4" />
                       <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
                    </NavLink>
                 ))}
              </div>

              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-3 w-full h-11 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 text-xs font-bold rounded-xl transition-all border border-red-500/10 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Terminate Session</span>
              </button>
           </div>

           <div className="flex items-center justify-center gap-2 mt-6 opacity-30 grayscale group-hover:grayscale-0 transition-opacity">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground">Secure Uplink v5.2</span>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
