
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types.ts';
import { Bell, Sun, Moon, X, Clock, Menu } from 'lucide-react';

interface HeaderProps {
  user: User;
  toggleTheme: () => void;
  isDarkMode: boolean;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user: initialUser, toggleTheme, isDarkMode, onMenuClick }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState<User>(initialUser);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('teamsync_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 h-20 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-50">
      <div className="flex items-center gap-4 md:gap-6">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hidden lg:block">System Status: Active</span>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={toggleTheme} className="p-2.5 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button onClick={() => navigate('/reminders')} className="p-2.5 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-zinc-900 dark:bg-white rounded-full"></span>
          </button>
        </div>

        <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800"></div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">{user.name}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">{user.role}</p>
          </div>
          <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-zinc-50 dark:ring-zinc-800" alt={user.name} />
        </div>
      </div>
    </header>
  );
};

export default Header;
