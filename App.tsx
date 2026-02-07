import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { User, UserRole } from './types.ts';
import Login from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import Chat from './components/Chat.tsx';
import Standup from './components/Standup.tsx';
import Polls from './components/Polls.tsx';
import Reminders from './components/Reminders.tsx';
import Schedule from './components/Schedule.tsx';
import Profile from './components/Profile.tsx';
import AdminPanel from './components/Admin.tsx';
import Tickets from './components/Tickets.tsx';

import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Settings from './components/Settings.tsx';
import SplashScreen from './components/SplashScreen.tsx';
import Logo from './components/Logo.tsx';
import { ShieldAlert, LogOut, Hash, LayoutDashboard, MessageSquare, BarChart2, Ticket, Sparkles, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { api } from './services/api';

const BottomNav: React.FC<{ user: User }> = ({ user }) => {
  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Sync', path: '/standup', icon: CheckCircle2 },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Polls', path: '/polls', icon: BarChart2 },
    { name: 'Tickets', path: '/tickets', icon: Ticket },
    { name: 'Me', path: '/profile', icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 h-16 px-4 flex items-center justify-around z-[100] pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 p-2 transition-all
            ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}
          `}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true); // Splash state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Setup Theme
    const savedTheme = localStorage.getItem('teamsync_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // 2. Setup Auth (Token Check)
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('teamsync_access_token');
        if (token) {
          const user = await api.getMe();
          setCurrentUser(user);
        }
      } catch (err) {
        console.error("Session invalid", err);
        localStorage.removeItem('teamsync_access_token');
        localStorage.removeItem('teamsync_refresh_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // 3. Splash Screen Timer
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(splashTimer);
  }, []);

  // Close sidebar on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      if (newVal) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('teamsync_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('teamsync_theme', 'light');
      }
      return newVal;
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === UserRole.ADMIN) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setCurrentUser(null);
      // Remove tokens explicitly if api.logout didn't (e.g. network error)
      localStorage.removeItem('teamsync_access_token');
      localStorage.removeItem('teamsync_refresh_token');
      navigate('/login');
    }
  };

  // Show Splash Screen if either the timer is running OR auth is validating
  if (showSplash || loading) {
    return <SplashScreen />;
  }

  if (!currentUser && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (currentUser && !currentUser.isApproved && currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-colors">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center p-6 bg-zinc-900 dark:bg-white rounded-[2rem] shadow-2xl">
            <Logo className="w-12 h-12" />
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 p-10 shadow-2xl shadow-zinc-200 dark:shadow-none">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-white">
                <ShieldAlert className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">Awaiting Authorization</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed mb-8">
              Welcome, <span className="text-zinc-900 dark:text-white font-bold">{currentUser.name}</span>. Your request for system access as a <span className="font-bold">{currentUser.role}</span> has been logged.
            </p>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {currentUser && (
        <Sidebar
          user={currentUser}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-300 relative">
        {currentUser && (
          <Header
            user={currentUser}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 pb-24 md:pb-10 no-scrollbar">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/" element={
              currentUser?.role === UserRole.ADMIN
                ? <Navigate to="/admin" replace />
                : <Dashboard user={currentUser!} />
            } />
            <Route path="/chat" element={<Chat user={currentUser!} />} />
            <Route path="/standup" element={<Standup user={currentUser!} />} />

            <Route path="/polls" element={<Polls user={currentUser!} />} />
            <Route path="/reminders" element={<Reminders user={currentUser!} />} />
            <Route path="/schedule" element={<Schedule user={currentUser!} />} />
            <Route path="/tickets" element={<Tickets user={currentUser!} />} />
            <Route path="/profile" element={<Profile user={currentUser!} onLogout={handleLogout} />} />
            <Route path="/settings" element={<Settings user={currentUser!} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onLogout={handleLogout} />} />
            {currentUser?.role === UserRole.ADMIN && (
              <Route path="/admin" element={<AdminPanel user={currentUser} />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {currentUser && <BottomNav user={currentUser} />}
      </div>
    </div>
  );
};

export default App;
