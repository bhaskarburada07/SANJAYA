import React from 'react';
import { 
  CheckCircle2, 
  X, 
  UserCheck, 
  Phone, 
  Shield, 
  Clock, 
  MapPin 
} from 'lucide-react';
import { Detection } from '../../types';
import { useData } from '../../context/DataContext';

interface PersonDetailsModalProps {
  detection: Detection;
  onClose: () => void;
  onViewPeople: () => void;
}

export const PersonDetailsModal: React.FC<PersonDetailsModalProps> = ({
  detection,
  onClose,
  onViewPeople,
}) => {
  const { trustedPeople } = useData();
  const matchedPerson = trustedPeople.find((p) => p.name.toLowerCase() === (detection.person_name || '').toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-sm rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Top Green Banner */}
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/80 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Known Person Detected
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-emerald-100 hover:text-zinc-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          {/* Avatar & Trusted Badge */}
          <div className="relative mx-auto h-24 w-24">
            <img
              src={matchedPerson?.photo_url || detection.snapshot_url}
              alt={detection.person_name || 'Known Person'}
              className="h-full w-full rounded-full object-cover ring-4 ring-emerald-500/20 shadow-md"
            />
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white">
              <Shield className="h-3.5 w-3.5 fill-current" />
            </span>
          </div>

          {/* Name & Relationship */}
          <div>
            <h3 className="text-xl font-bold text-zinc-900">
              {detection.person_name || 'Family Member'}
            </h3>
            <p className="text-sm font-semibold text-emerald-700">
              {matchedPerson?.relationship || 'Trusted Profile'}
            </p>

            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {detection.zone}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Just now
              </span>
            </div>
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Trusted Member • Confidence {(detection.confidence * 100).toFixed(0)}%
          </div>

          <p className="text-xs text-zinc-500">
            No emergency escalation required. Access event is recorded in your activity timeline.
          </p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                onViewPeople();
                onClose();
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 px-3 text-xs font-semibold text-white hover:bg-zinc-800 shadow-xs transition"
            >
              <UserCheck className="h-4 w-4" />
              <span>View Profile</span>
            </button>

            <a
              href="tel:+919876543210"
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
            >
              <Phone className="h-4 w-4 text-zinc-600" />
              <span>Call</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
