import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types.ts';
import { Bell, Sun, Moon, Menu, Search, HelpCircle, ChevronRight, Hash, Command } from 'lucide-react';

interface HeaderProps {
  user: User;
  toggleTheme: () => void;
  isDarkMode: boolean;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user: initialUser, toggleTheme, isDarkMode, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User>(initialUser);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('teamsync_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getBreadcrumbs = () => {
    const path = location.pathname.split('/').filter(Boolean);
    if (path.length === 0) return ['Operational Node'];
    return ['HQ', ...path.map(p => p.charAt(0).toUpperCase() + p.slice(1))];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-card/40 backdrop-blur-xl border-b border-border/40 h-16 flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-[100] shadow-sm">
      <div className="flex items-center gap-6">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2.5 bg-muted/50 rounded-xl text-muted-foreground hover:text-foreground transition-all border border-border/50"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Advanced Breadcrumb System */}
        <nav className="hidden md:flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-xl border border-border/40 shadow-inner">
              <Hash className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Voxel-7</span>
           </div>
           <div className="h-4 w-px bg-border/60 mx-1" />
           <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <ChevronRight className="w-3 h-3 opacity-30 mx-0.5" />}
                <button 
                  onClick={() => idx === 0 && navigate('/')}
                  className={`transition-all hover:text-accent ${idx === breadcrumbs.length - 1 ? "text-foreground font-bold" : "text-muted-foreground/60"}`}
                >
                  {crumb}
                </button>
              </React.Fragment>
            ))}
           </div>
        </nav>
      </div>

      <div className="flex items-center gap-4">


        <div className="flex items-center gap-1.5 p-1 bg-muted/20 rounded-2xl border border-border/40">
          <button className="p-2.5 text-muted-foreground hover:text-accent hover:bg-background rounded-xl transition-all border border-transparent hover:border-border/40 group">
            <HelpCircle className="w-4.5 h-4.5" />
          </button>
          
          <button onClick={toggleTheme} className="p-2.5 text-muted-foreground hover:text-accent hover:bg-background rounded-xl transition-all border border-transparent hover:border-border/40 group relative">
             <div className="absolute inset-0 bg-accent/5 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            {isDarkMode ? <Sun className="w-4.5 h-4.5 relative z-10" /> : <Moon className="w-4.5 h-4.5 relative z-10" />}
          </button>

          <button onClick={() => navigate('/reminders')} className="p-2.5 text-muted-foreground hover:text-accent hover:bg-background rounded-xl transition-all border border-transparent hover:border-border/40 group relative">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-card shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
          </button>
        </div>

        <div className="h-8 w-px bg-border/40 mx-2 hidden sm:block"></div>

        <div 
          className="flex items-center gap-3 hover:bg-muted/40 p-1.5 pr-4 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-border/40 group" 
          onClick={() => navigate('/profile')}
        >
           <div className="relative">
              <img 
                src={user.avatar} 
                className="w-8 h-8 rounded-xl border border-border object-cover bg-background shadow-sm group-hover:border-accent/40 transition-all" 
                alt={user.name} 
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
           </div>
           <div className="hidden sm:block">
              <p className="text-xs font-bold text-foreground leading-none">{user.name.split(' ')[0]}</p>
              <p className="text-[10px] font-bold text-accent uppercase tracking-tighter mt-1">Operator</p>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
