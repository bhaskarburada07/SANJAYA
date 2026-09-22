import React from 'react';
import { 
  AlertTriangle, 
  X, 
  Video, 
  Mic, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Info 
} from 'lucide-react';
import { Detection, Incident } from '../../types';
import { useData } from '../../context/DataContext';

interface DetectionAlertModalProps {
  detection: Detection;
  incident?: Incident;
  onClose: () => void;
  onViewLive: () => void;
  onTalk: () => void;
}

export const DetectionAlertModal: React.FC<DetectionAlertModalProps> = ({
  detection,
  onClose,
  onViewLive,
  onTalk,
}) => {
  const { activateSos } = useData();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Top Warning Banner */}
        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/80 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Visitor Awareness
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-amber-100 hover:text-zinc-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Header Description */}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              Someone is at your entrance.
            </h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {detection.zone}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Detected just now
              </span>
            </div>
          </div>

          {/* Snapshot with Bounding Box Overlay */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-900 shadow-inner">
            <img
              src={detection.snapshot_url}
              alt="Visitor Snapshot"
              className="h-full w-full object-cover"
            />
            {/* Simulated Bounding Box */}
            <div 
              className="absolute border-2 border-amber-400 rounded-sm pointer-events-none shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              style={{
                left: `${(detection.bounding_box?.x ?? 0.35) * 100}%`,
                top: `${(detection.bounding_box?.y ?? 0.20) * 100}%`,
                width: `${(detection.bounding_box?.width ?? 0.30) * 100}%`,
                height: `${(detection.bounding_box?.height ?? 0.60) * 100}%`,
              }}
            >
              <span className="absolute -top-5 left-0 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-zinc-950">
                {(detection.confidence * 100).toFixed(0)}% Match
              </span>
            </div>

            <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] text-zinc-200">
              HD Snapshot
            </div>
          </div>

          {/* Ethical AI Disclaimer / Objective Awareness Notice */}
          <div className="flex items-start gap-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 text-xs text-zinc-600">
            <Info className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-zinc-900">Privacy-First Principle:</strong> SANJAYA does not classify unknown visitors as threats. Inspect the live feed or use two-way talk before taking any action.
            </p>
          </div>

          {/* Actions: View Live, Talk, SOS */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={() => {
                onViewLive();
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-3 px-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition"
            >
              <Video className="h-4 w-4" />
              <span>View Live</span>
            </button>

            <button
              onClick={() => {
                onTalk();
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-3 px-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
            >
              <Mic className="h-4 w-4 text-zinc-700" />
              <span>Talk</span>
            </button>

            <button
              onClick={() => {
                onClose();
                activateSos();
              }}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-3 px-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-rose-700 transition"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>SOS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
