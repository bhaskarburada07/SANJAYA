import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  AlertOctagon, 
  MoreHorizontal,
  Camera as CameraIcon,
  Shield,
  Bell,
  Settings as SettingsIcon,
  User,
  X,
  Sparkles,
  LogOut
} from 'lucide-react';
import { NavScreen } from './Sidebar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentScreen, onNavigate }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { unreadNotificationCount } = useData();
  const { logout } = useAuth();

  const handleSelect = (screen: NavScreen) => {
    onNavigate(screen);
    setShowMoreMenu(false);
  };

  const handleLogout = async () => {
    setShowMoreMenu(false);
    await logout();
  };

  return (
    <>
      {/* Mobile Drawer / Sheet for "More" */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div 
            className="fixed inset-x-0 bottom-16 rounded-t-3xl border-t border-zinc-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">More Destinations</span>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleSelect('ai-brain')}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-left hover:bg-zinc-100 text-zinc-800 transition"
              >
                <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">AI Brain</div>
                  <div className="text-[10px] text-zinc-500">Security Intelligence</div>
                </div>
              </button>

              <button
                onClick={() => handleSelect('cameras')}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-left hover:bg-zinc-100 text-zinc-800 transition"
              >
                <CameraIcon className="h-5 w-5 text-zinc-700 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Cameras</div>
                  <div className="text-[10px] text-zinc-500">Manage streams</div>
                </div>
              </button>

              <button
                onClick={() => handleSelect('emergency-contacts')}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-left hover:bg-zinc-100 text-zinc-800 transition"
              >
                <Shield className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Emergency</div>
                  <div className="text-[10px] text-zinc-500">SOS contacts</div>
                </div>
              </button>

              <button
                onClick={() => handleSelect('notifications')}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-left hover:bg-zinc-100 text-zinc-800 transition"
              >
                <div className="relative">
                  <Bell className="h-5 w-5 text-zinc-700 shrink-0" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-600" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold">Notifications</div>
                  <div className="text-[10px] text-zinc-500">{unreadNotificationCount} unread</div>
                </div>
              </button>

              <button
                onClick={() => handleSelect('settings')}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-left hover:bg-zinc-100 text-zinc-800 transition"
              >
                <SettingsIcon className="h-5 w-5 text-zinc-700 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Settings</div>
                  <div className="text-[10px] text-zinc-500">Privacy & rules</div>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-center hover:bg-rose-100 text-rose-700 font-semibold text-xs transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out of SANJAYA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Tab Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-zinc-200/80 bg-white/95 px-2 backdrop-blur-md md:hidden">
        <button
          onClick={() => handleSelect('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            currentScreen === 'overview' || currentScreen === 'dashboard' ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => handleSelect('live')}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            currentScreen === 'live' ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Video className="h-5 w-5" />
          <span className="text-[10px]">Live</span>
        </button>

        <button
          onClick={() => handleSelect('people')}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            currentScreen === 'people' ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px]">People</span>
        </button>

        <button
          onClick={() => handleSelect('incidents')}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            currentScreen === 'incidents' ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <AlertOctagon className="h-5 w-5" />
          <span className="text-[10px]">Activity</span>
        </button>

        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            showMoreMenu ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>
    </>
  );
};
