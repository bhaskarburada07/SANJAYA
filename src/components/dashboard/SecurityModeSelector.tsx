import React from 'react';
import { Shield, Home, Lock, Moon } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { SecurityMode } from '../../types';

export const SecurityModeSelector: React.FC = () => {
  const { securityMode, setSecurityMode } = useData();

  const modes: Array<{
    id: SecurityMode;
    label: string;
    icon: React.FC<{ className?: string }>;
    desc: string;
  }> = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      desc: 'Perimeter active · Indoor privacy on',
    },
    {
      id: 'away',
      label: 'Away',
      icon: Lock,
      desc: 'Maximum defense · Full sensor arm',
    },
    {
      id: 'night',
      label: 'Night Guard',
      icon: Moon,
      desc: 'Perimeter armed · Sleep zones quiet',
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 shadow-xs">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-zinc-900" />
          <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Security State</span>
        </div>
        <span className="text-[11px] text-zinc-500 font-medium">
          Current: <strong className="text-zinc-900 uppercase">{securityMode}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = securityMode === m.id;

          return (
            <button
              key={m.id}
              onClick={() => setSecurityMode(m.id)}
              className={`flex items-start gap-3 rounded-xl p-3 text-left transition border ${
                isActive
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                  : 'border-zinc-200/80 bg-zinc-50/60 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white border border-zinc-200 text-zinc-600'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                    {m.label}
                  </span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <p className={`text-[11px] mt-0.5 truncate ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {m.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
