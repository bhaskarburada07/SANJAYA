import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  Camera as CameraIcon, 
  AlertOctagon, 
  Bell, 
  Settings as SettingsIcon,
  Shield,
  Eye,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export type NavScreen = 
  | 'overview' 
  | 'dashboard'
  | 'ai-brain'
  | 'live' 
  | 'people' 
  | 'cameras' 
  | 'incidents' 
  | 'incident-detail'
  | 'notifications' 
  | 'emergency'
  | 'emergency-contacts' 
  | 'settings' 
  | 'profile';

interface SidebarProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate }) => {
  const { logout } = useAuth();
  const { unreadNotificationCount } = useData();

  const isOverview = currentScreen === 'overview' || currentScreen === 'dashboard';
  const isEmergency = currentScreen === 'emergency' || currentScreen === 'emergency-contacts';

  const navItems: Array<{ id: NavScreen; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'ai-brain', label: 'AI Brain', icon: Sparkles },
    { id: 'live', label: 'Live Camera', icon: Video },
    { id: 'people', label: 'People', icon: Users },
    { id: 'cameras', label: 'Cameras', icon: CameraIcon },
    { id: 'incidents', label: 'Activity', icon: AlertOctagon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <aside className="hidden md:flex md:w-60 flex-col justify-between border-r border-zinc-800 bg-[#121316] px-3.5 py-6 shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group px-2 mb-7"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white shadow-sm transition group-hover:bg-white/15">
            <Eye className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">SANJAYA</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Home Safety</p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = (item.id === 'dashboard' && isOverview) || currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-zinc-850 bg-white/10 text-white font-semibold'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.id === 'notifications' && unreadNotificationCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-1 border-t border-zinc-800/80 pt-4">
        <button
          onClick={() => onNavigate('emergency')}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition ${
            isEmergency
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
          }`}
        >
          <Shield className="h-4 w-4 text-zinc-400" />
          <span>Emergency Contacts</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition ${
            currentScreen === 'settings'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
          }`}
        >
          <SettingsIcon className="h-4 w-4 text-zinc-400" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
