import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, UserRole } from '../types.ts';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart2,
  Bell,
  Calendar,
  User as UserIcon,
  Settings,
  LogOut,
  Ticket,
  X,
  Shield,
  Sparkles,
  CheckCircle2
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
    { name: 'Priorities', path: '/standup', icon: CheckCircle2 },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Polls', path: '/polls', icon: BarChart2 },
    { name: 'Tickets', path: '/tickets', icon: Ticket },
    { name: 'Reminders', path: '/reminders', icon: Bell },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
    { name: 'Profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (user.role === UserRole.ADMIN) {
    // Admin View: Only Dashboard, Admin Panel, Profile, Settings
    // Filter out Chat, Polls, Tickets, Reminders, Schedule, AI Chat
    const adminAllowed = ['Dashboard', 'Admin', 'Profile', 'Settings'];
    const adminNav = navItems.filter(item => adminAllowed.includes(item.name));
    adminNav.push({ name: 'Admin', path: '/admin', icon: Shield });
    // Wait, navItems already has Dashboard... let's just create a fresh list or filter.
    // Easier to rebuild.
  }

  const finalNavItems = user.role === UserRole.ADMIN
    ? [
      { name: 'Admin', path: '/admin', icon: Shield },
      { name: 'Profile', path: '/profile', icon: UserIcon },
      { name: 'Settings', path: '/settings', icon: Settings }
    ]
    : navItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 z-[200]
        md:relative md:translate-x-0 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center justify-between px-8">
          <div className="w-8 h-1 bg-zinc-900 dark:bg-white rounded-full"></div>
          <button onClick={onClose} className="md:hidden p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {finalNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-5 py-4 rounded-2xl transition-all
                ${isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg font-black'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6">
          <button
            onClick={() => {
              onLogout();
              onClose?.();
            }}
            className="flex items-center gap-3 w-full px-5 py-4 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
