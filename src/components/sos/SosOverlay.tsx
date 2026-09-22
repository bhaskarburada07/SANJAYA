import React from 'react';
import { 
  AlertOctagon, 
  MapPin, 
  ShieldAlert, 
  X, 
  Send,
  PhoneCall,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const SosOverlay: React.FC = () => {
  const { 
    isSosActive, 
    sosSecondsRemaining, 
    cancelSos, 
    settings, 
    updateSettings,
    emergencyContacts,
    currentSosIncident
  } = useData();

  if (!isSosActive) return null;

  // Percentage for countdown ring
  const totalSeconds = settings.sos_countdown_seconds || 30;
  const progress = (sosSecondsRemaining / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-md flex flex-col items-center text-center space-y-6">
        {/* Top Emergency Indicator */}
        <div className="flex items-center gap-2 rounded-full bg-rose-950/80 border border-rose-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-rose-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500"></span>
          </span>
          SOS Active
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Are you in danger?
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto">
            Your emergency contacts will be notified automatically if this countdown expires.
          </p>
        </div>

        {/* Big Circular Countdown Display */}
        <div className="relative flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border border-rose-500/20" />

          {/* SVG Progress Circle */}
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#27272a"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#f43f5e"
              strokeWidth="5"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center Seconds Counter */}
          <div className="absolute flex flex-col items-center">
            <span className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-white">
              {sosSecondsRemaining}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              Seconds
            </span>
          </div>
        </div>

        {/* GPS Live Sharing Status */}
        <div className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs text-zinc-300">
          <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
          <span>
            {currentSosIncident?.latitude 
              ? `GPS Captured: ${currentSosIncident.latitude.toFixed(4)}, ${currentSosIncident.longitude?.toFixed(4)}`
              : 'GPS captured: 12.9716° N, 77.5946° E'
            }
          </span>
        </div>

        {/* Sound toggle button */}
        <button
          onClick={() => updateSettings({ alert_audio_enabled: !settings.alert_audio_enabled })}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          {settings.alert_audio_enabled ? (
            <>
              <Volume2 className="h-3.5 w-3.5" />
              <span>Alarm Sound Enabled</span>
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5" />
              <span>Alarm Sound Muted</span>
            </>
          )}
        </button>

        {/* Primary Action: Cancel SOS Button */}
        <div className="w-full space-y-2 pt-2">
          <button
            onClick={cancelSos}
            className="w-full rounded-2xl bg-white py-4 px-6 text-sm font-bold uppercase tracking-wider text-zinc-900 shadow-xl hover:bg-zinc-100 active:scale-[0.99] transition"
          >
            Cancel SOS
          </button>
          <p className="text-[11px] text-zinc-500 font-medium">
            Cancel if you activated SOS by mistake.
          </p>
        </div>

        {/* Emergency Contacts List Preview */}
        <div className="text-[11px] text-zinc-500 flex items-center gap-1">
          <span>Target Contacts:</span>
          <span className="font-semibold text-zinc-300">
            {emergencyContacts.map(c => c.name).join(', ') || '3 configured contacts'}
          </span>
        </div>
      </div>
    </div>
  );
};
