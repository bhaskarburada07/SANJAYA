import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Package, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  Bot
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const DailySecurityBriefCard: React.FC = () => {
  const { dailyBrief, setAiAssistantOpen, incidents } = useData();
  const activeAlertsCount = incidents.filter(i => i.status === 'active' && i.risk_level !== 'LOW').length;

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs transition hover:border-zinc-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">Daily Security Brief</h3>
              <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {dailyBrief.overall_status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{dailyBrief.headline}</p>
          </div>
        </div>

        {/* AI Investigator Button */}
        <button
          onClick={() => setAiAssistantOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 transition self-start sm:self-center"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Ask Investigator</span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
        <div className="rounded-xl bg-zinc-50/80 border border-zinc-100 p-3">
          <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Normal Events</span>
          </div>
          <div className="mt-1 text-lg font-bold text-zinc-900">{dailyBrief.normal_events_count}</div>
        </div>

        <div className="rounded-xl bg-zinc-50/80 border border-zinc-100 p-3">
          <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium">
            <Package className="h-3.5 w-3.5 text-blue-600" />
            <span>Deliveries</span>
          </div>
          <div className="mt-1 text-lg font-bold text-zinc-900">{dailyBrief.deliveries_count}</div>
        </div>

        <div className="rounded-xl bg-zinc-50/80 border border-zinc-100 p-3">
          <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium">
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            <span>Family Arrivals</span>
          </div>
          <div className="mt-1 text-lg font-bold text-zinc-900">{dailyBrief.family_arrivals_count}</div>
        </div>

        <div className="rounded-xl bg-zinc-50/80 border border-zinc-100 p-3">
          <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium">
            <AlertTriangle className={`h-3.5 w-3.5 ${activeAlertsCount > 0 ? 'text-amber-500' : 'text-zinc-400'}`} />
            <span>Unresolved Alerts</span>
          </div>
          <div className="mt-1 text-lg font-bold text-zinc-900">{activeAlertsCount}</div>
        </div>
      </div>

      {/* Highlights */}
      <div className="space-y-1.5 pt-1">
        {dailyBrief.highlights.map((highlight, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{highlight}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
