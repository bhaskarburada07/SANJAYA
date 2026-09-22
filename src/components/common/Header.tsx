import React, { useState } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  Video, 
  AlertTriangle, 
  Sparkles, 
  ChevronDown, 
  User, 
  Radio,
  Bot,
  Package,
  Clock,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NavScreen } from './Sidebar';

interface HeaderProps {
  currentScreen?: NavScreen;
  onNavigate?: (screen: NavScreen) => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNavigate, 
  onOpenNotifications, 
  onOpenProfile 
}) => {
  const { user } = useAuth();
  const { 
    trustedPeople,
    unreadNotificationCount, 
    activateSos, 
    triggerSimulatedKnown, 
    triggerSimulatedUnknown, 
    triggerSimulatedDoorbell,
    triggerSimulatedPackage,
    triggerSimulatedLoitering,
    triggerSimulatedTamper,
    setAiAssistantOpen,
    activeCamera,
    securityMode
  } = useData();

  const displayName = user?.full_name || user?.name || 'Homeowner';
  const homeSubtitle = user?.home_name ? `${user.home_name} is protected` : 'Your home is protected';

  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  const handleNotificationsClick = () => {
    if (onNavigate) {
      onNavigate('notifications');
    } else if (onOpenNotifications) {
      onOpenNotifications();
    }
  };

  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate('profile');
    } else if (onOpenProfile) {
      onOpenProfile();
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
      {/* Title & Status Bar matching Screen 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h1 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs text-zinc-500">{homeSubtitle}</p>
        </div>

        {/* Live Status Indicators matching Screen 2 */}
        <div className="mt-1 flex items-center gap-2 sm:mt-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            System Online
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Camera Connected
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Security Assistant Button */}
        <button
          onClick={() => setAiAssistantOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 transition"
          title="Open AI Security Investigator"
        >
          <Bot className="h-3.5 w-3.5 text-zinc-900" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        {/* Simulator Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setShowSimulateMenu(!showSimulateMenu)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition"
            title="Simulate detection events"
          >
            <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
            <span className="hidden md:inline">Simulate</span>
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </button>

          {showSimulateMenu && (
            <div 
              className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setShowSimulateMenu(false)}
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Autonomous AI Simulators
              </div>

              <button
                onClick={() => triggerSimulatedUnknown()}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 text-left transition"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div>
                  <div className="font-semibold text-zinc-900">Unknown Person (45s)</div>
                  <div className="text-[10px] text-zinc-500">Loiters without chime</div>
                </div>
              </button>

              <button
                onClick={() => triggerSimulatedKnown()}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 text-left transition"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-zinc-900">
                    {trustedPeople.length > 0
                      ? `Known (${trustedPeople[0].name})`
                      : 'Known Person Arrival'}
                  </div>
                  <div className="text-[10px] text-zinc-500">Autonomous face match</div>
                </div>
              </button>

              <button
                onClick={() => triggerSimulatedPackage()}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 text-left transition"
              >
                <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <div>
                  <div className="font-semibold text-zinc-900">Package Delivery</div>
                  <div className="text-[10px] text-zinc-500">Carrier drops parcel safely</div>
                </div>
              </button>

              <button
                onClick={() => triggerSimulatedLoitering()}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 text-left transition"
              >
                <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <div>
                  <div className="font-semibold text-zinc-900">Extended Loitering (120s)</div>
                  <div className="text-[10px] text-zinc-500">Handle touch & perimeter check</div>
                </div>
              </button>

              <button
                onClick={() => triggerSimulatedDoorbell()}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 text-left transition"
              >
                <Bell className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                <div>
                  <div className="font-semibold text-zinc-900">Doorbell Chime</div>
                  <div className="text-[10px] text-zinc-500">Visitor presses chime</div>
                </div>
              </button>

              <button
                onClick={() => triggerSimulatedTamper(activeCamera.id)}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50 text-left transition"
              >
                <EyeOff className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <div>
                  <div className="font-semibold text-red-900">Camera Tamper Event</div>
                  <div className="text-[10px] text-red-500">Lens obscured / displaced</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={handleNotificationsClick}
          className="relative rounded-xl border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Quick SOS Panic Button */}
        <button
          onClick={() => activateSos()}
          className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-red-700 active:scale-95 transition"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>SOS</span>
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white pl-1.5 pr-2.5 py-1 text-zinc-700 hover:bg-zinc-50 transition"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className="h-6 w-6 rounded-full object-cover ring-1 ring-zinc-300"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden sm:inline text-xs font-medium text-zinc-800">{displayName}</span>
        </button>
      </div>
    </header>
  );
};
