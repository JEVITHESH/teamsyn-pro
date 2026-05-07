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
import Settings from './components/Settings.tsx';
import SplashScreen from './components/SplashScreen.tsx';

import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';

import { 
  ShieldAlert, 
  LogOut, 
  LayoutDashboard, 
  MessageSquare, 
  TrendingUp, 
  Ticket, 
  User as UserIcon, 
  UserCheck,
  FolderKanban
} from 'lucide-react';
import { api } from './services/api';
import Projects from './components/Projects.tsx';

const BottomNav: React.FC<{ user: User }> = ({ user }) => {
  const allNavItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Sync', path: '/standup', icon: UserCheck },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Metrics', path: '/polls', icon: TrendingUp },
    { name: 'Tickets', path: '/tickets', icon: Ticket },
    { name: 'Me', path: '/profile', icon: UserIcon },
  ];

  const navItems = user.role === UserRole.ADMIN || user.role === 'ADMIN'
    ? allNavItems.filter(item => ['Home', 'Me'].includes(item.name))
    : allNavItems;

  return (
    <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-card border border-border h-16 flex items-center justify-around z-[100] rounded-2xl shadow-lg ring-1 ring-black/5">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center justify-center gap-1 h-full px-2 transition-all
            ${isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}
          `}
        >
          <item.icon className="w-5 h-5 transition-transform" />
          <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Force modern dark theme as default (often professional SaaS default)
    document.documentElement.classList.add('dark');
    setIsDarkMode(true);

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
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('teamsync_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
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
      localStorage.removeItem('teamsync_access_token');
      localStorage.removeItem('teamsync_refresh_token');
      navigate('/login');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!currentUser && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (currentUser && !currentUser.isApproved && currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-muted/20 border border-border/50 rounded-2xl shadow-sm">
            <ShieldAlert className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="saas-card p-10 space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Pending</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Hello, <span className="text-foreground font-semibold">{currentUser.name}</span>.<br />
              Your account for <span className="font-medium">TeamSync Pro</span> is currently waiting for administrator approval.
            </p>
            <div className="h-px bg-border/50 w-full" />
            <button 
              onClick={handleLogout} 
              className="saas-button-secondary w-full h-11 flex items-center justify-center gap-2 mt-4"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-accent/20">
      {currentUser && (
        <Sidebar
          user={currentUser}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative border-l border-border/50 ml-0 lg:ml-0">
        {currentUser && location.pathname !== '/chat' && (
          <Header
            user={currentUser}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
        )}
        
        <main className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar ${location.pathname === '/chat' ? 'p-0' : 'p-4 md:p-8 lg:p-12 pb-24 md:pb-12'}`}>
          <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col">
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
              <Route path="/projects" element={<Projects user={currentUser!} />} />
              <Route path="/profile" element={<Profile user={currentUser!} onLogout={handleLogout} />} />
              <Route path="/settings" element={<Settings user={currentUser!} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onLogout={handleLogout} />} />
              {currentUser?.role === UserRole.ADMIN && (
                <Route path="/admin" element={<AdminPanel user={currentUser} />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        
        {currentUser && location.pathname !== '/chat' && <BottomNav user={currentUser} />}
      </div>
    </div>
  );
};

export default App;
