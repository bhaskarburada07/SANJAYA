import React from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Package, 
  Users, 
  AlertTriangle,
  ArrowRight,
  Home
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const AwaySummaryModal: React.FC = () => {
  const { showAwaySummaryModal, closeAwaySummaryModal, incidents } = useData();

  if (!showAwaySummaryModal) return null;

  const activeIncidents = incidents.filter(i => i.status === 'active');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xs">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Welcome Home</h3>
              <p className="text-xs text-zinc-500">Away Mode Security Summary</p>
            </div>
          </div>
          <button
            onClick={closeAwaySummaryModal}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status card */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>Perimeter Kept Fully Secure</span>
          </div>
          <p className="text-xs text-emerald-900/80 leading-relaxed">
            While you were away, SANJAYA maintained 24/7 autonomous edge monitoring across all entrance and garden zones.
          </p>
        </div>

        {/* Key Event Tally */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-100 p-3">
            <div className="flex items-center gap-2.5 text-zinc-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Unauthorized Breaches</span>
            </div>
            <span className="font-bold text-zinc-900">0</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-100 p-3">
            <div className="flex items-center gap-2.5 text-zinc-700">
              <Package className="h-4 w-4 text-blue-600" />
              <span>Verified Deliveries</span>
            </div>
            <span className="font-bold text-zinc-900">2 Packages</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-100 p-3">
            <div className="flex items-center gap-2.5 text-zinc-700">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Pending Verifications</span>
            </div>
            <span className="font-bold text-zinc-900">{activeIncidents.length} Events</span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={closeAwaySummaryModal}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-xs font-bold text-white hover:bg-zinc-800 active:scale-[0.98] transition shadow-xs"
        >
          <span>Confirm Home Mode</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
