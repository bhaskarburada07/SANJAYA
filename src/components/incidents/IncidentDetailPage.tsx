import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  UserPlus, 
  Info,
  Sparkles,
  Camera as CameraIcon,
  Shield,
  Activity,
  Layers,
  HelpCircle,
  Footprints
} from 'lucide-react';
import { Incident } from '../../types';
import { useData } from '../../context/DataContext';
import { NavScreen } from '../common/Sidebar';

interface IncidentDetailPageProps {
  incident: Incident | null;
  onBack: () => void;
  onNavigate: (screen: NavScreen) => void;
}

export const IncidentDetailPage: React.FC<IncidentDetailPageProps> = ({
  incident,
  onBack,
  onNavigate,
}) => {
  const { resolveIncident, detections, activateSos, addTrustedPerson, cameras, trustedPeople } = useData();
  const [activeTab, setActiveTab] = useState<'brain' | 'timeline' | 'details' | 'actions'>('brain');
  const [resolvedNotes, setResolvedNotes] = useState('');
  const [isAddingTrusted, setIsAddingTrusted] = useState(false);
  const [trustedName, setTrustedName] = useState('');

  if (!incident) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="text-zinc-900 font-semibold">No incident selected</div>
        <button
          onClick={onBack}
          className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
        >
          Return to Incidents
        </button>
      </div>
    );
  }

  const linkedDetection = incident.detection || detections.find(d => d.id === incident.detection_id);
  const linkedCamera = cameras.find(c => c.id === incident.camera_id || c.id === linkedDetection?.camera_id);
  const linkedPerson = linkedDetection?.person_id
    ? trustedPeople.find(p => p.id === linkedDetection.person_id)
    : (linkedDetection?.person_name ? trustedPeople.find(p => p.name.toLowerCase() === linkedDetection.person_name?.toLowerCase()) : null);

  const displayWho = linkedPerson?.name || linkedDetection?.person_name || incident.who || 'Unknown Person';
  const displayWhere = linkedCamera?.name || linkedCamera?.location || incident.where || linkedDetection?.zone || 'Main Entrance';

  const handleResolve = () => {
    resolveIncident(incident.id, resolvedNotes || 'Verified and marked safe by homeowner');
  };

  const handleQuickAddTrusted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trustedName.trim()) return;

    await addTrustedPerson({
      name: trustedName.trim(),
      relationship: 'Friend',
      photo_url: linkedDetection?.snapshot_url,
      face_reference: `emb-${trustedName.toLowerCase().replace(/\s+/g, '-')}`,
    });
    setIsAddingTrusted(false);
    resolveIncident(incident.id, `Enrolled ${trustedName} into trusted registry and closed incident.`);
  };

  const riskLevel = incident.risk_level || 'MEDIUM';
  const classification = incident.classification || 'UNUSUAL';

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl">
      {/* Top Bar with Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Incident Brain Analysis</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                riskLevel === 'CRITICAL'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : riskLevel === 'HIGH'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : riskLevel === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              Risk: {riskLevel}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">Incident #{incident.id}</p>
        </div>
      </div>

      {/* Primary Card with Snapshot and Context Header */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                riskLevel === 'CRITICAL'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : riskLevel === 'HIGH'
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">
                  {incident.what || (incident.type === 'unknown_detection' ? 'Unidentified Visitor' : 'Security Event')}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    incident.status === 'active'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : incident.status === 'escalated'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {incident.status}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1 font-medium text-zinc-700">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  {displayWhere}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  {new Date(incident.started_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {incident.dwell_time_seconds && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-zinc-700">{incident.dwell_time_seconds}s dwell time</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Snapshot Preview */}
          {linkedDetection?.snapshot_url && (
            <div className="relative h-18 w-28 rounded-xl overflow-hidden border border-zinc-200 shrink-0 bg-zinc-100">
              <img
                src={linkedDetection.snapshot_url}
                alt="Incident Snapshot"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 right-1 rounded-sm bg-black/70 px-1 py-0.2 text-[9px] font-mono text-white">
                {linkedCamera?.name || 'Live Cam'}
              </span>
            </div>
          )}
        </div>

        {/* 6-Factor Intelligence Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-4 pt-4 border-t border-zinc-100 text-xs">
          <div className="rounded-xl bg-zinc-50 p-2.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">WHO</span>
            <span className="font-semibold text-zinc-900 truncate block mt-0.5">
              {displayWho}
            </span>
          </div>

          <div className="rounded-xl bg-zinc-50 p-2.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">WHERE</span>
            <span className="font-semibold text-zinc-900 truncate block mt-0.5">
              {displayWhere}
            </span>
          </div>

          <div className="rounded-xl bg-zinc-50 p-2.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">WHEN</span>
            <span className="font-semibold text-zinc-900 truncate block mt-0.5">
              {incident.when || 'Just now'}
            </span>
          </div>

          <div className="rounded-xl bg-zinc-50 p-2.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">DWELL TIME</span>
            <span className="font-semibold text-zinc-900 truncate block mt-0.5">
              {incident.dwell_time_seconds ? `${incident.dwell_time_seconds}s` : '45s'}
            </span>
          </div>

          <div className="rounded-xl bg-zinc-50 p-2.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">MODE</span>
            <span className="font-semibold text-zinc-900 uppercase truncate block mt-0.5">
              {incident.home_mode_at_time || 'HOME'}
            </span>
          </div>

          <div className="rounded-xl bg-zinc-50 p-2.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">CATEGORY</span>
            <span className="font-semibold text-zinc-900 uppercase truncate block mt-0.5">
              {classification}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('brain')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'brain'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Incident Brain</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'timeline'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          Timeline
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'details'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          Forensics
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'actions'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          Responses
        </button>
      </div>

      {/* Tab 1: Incident Brain Analysis */}
      {activeTab === 'brain' && (
        <div className="space-y-4">
          {/* AI Explanation Callout */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-900 text-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" />
              <span>AI Neural Reasoning</span>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed font-sans">
              {incident.ai_explanation ||
                'An unknown visitor approached the front entrance and was observed dwelling near the porch. Facial embeddings do not match any enrolled family or trusted member. Verification is recommended.'}
            </p>
          </div>

          {/* Risk Factors Breakdown */}
          {incident.risk_factors && incident.risk_factors.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Calculated Risk Factors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {incident.risk_factors.map((factor, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl bg-amber-50/60 border border-amber-200/70 p-2.5 text-xs text-amber-900"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behaviour Sequence Movement Flow */}
          {incident.behaviour_sequence && incident.behaviour_sequence.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Footprints className="h-4 w-4 text-zinc-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Reconstructed Movement Sequence
                </h3>
              </div>
              <div className="space-y-2">
                {incident.behaviour_sequence.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200/70 p-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-zinc-900">{step.action}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
                      <span>{step.zone}</span>
                      <span>•</span>
                      <span className="font-mono">{step.dwell_seconds}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Autonomous Actions */}
          {incident.recommended_actions && incident.recommended_actions.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Recommended Actions
              </h3>
              <div className="space-y-2">
                {incident.recommended_actions.map((act, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 text-zinc-800 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{act}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Timeline */}
      {activeTab === 'timeline' && (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 space-y-6 shadow-xs">
          <div className="relative border-l-2 border-zinc-200 pl-6 ml-2 space-y-6">
            {incident.timeline.map((event, idx) => (
              <div key={event.id || idx} className="relative group">
                <div
                  className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                    event.type === 'resolved' || event.type === 'cancelled'
                      ? 'bg-emerald-500'
                      : event.type === 'escalated'
                      ? 'bg-red-500'
                      : 'bg-zinc-800'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-400">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <span className="text-xs font-bold text-zinc-900">{event.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Details */}
      {activeTab === 'details' && (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 space-y-4 text-xs shadow-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-zinc-50 border border-zinc-200/60 p-3">
              <span className="text-zinc-500 block mb-1">GPS Coordinates</span>
              <span className="font-mono text-zinc-900 font-semibold">
                {incident.latitude ? `${incident.latitude}, ${incident.longitude}` : '12.9716, 77.5946'}
              </span>
            </div>
            <div className="rounded-xl bg-zinc-50 border border-zinc-200/60 p-3">
              <span className="text-zinc-500 block mb-1">Confidence Score</span>
              <span className="font-mono text-emerald-600 font-semibold">
                {linkedDetection?.confidence ? `${(linkedDetection.confidence * 100).toFixed(0)}%` : 'N/A'}
              </span>
            </div>
            <div className="rounded-xl bg-zinc-50 border border-zinc-200/60 p-3">
              <span className="text-zinc-500 block mb-1">Camera Feed</span>
              <span className="font-mono text-zinc-900">
                {linkedCamera ? `${linkedCamera.name} (${linkedCamera.location || displayWhere})` : `cam-1 (${displayWhere})`}
              </span>
            </div>
            <div className="rounded-xl bg-zinc-50 border border-zinc-200/60 p-3">
              <span className="text-zinc-500 block mb-1">Homeowner Status</span>
              <span className="text-zinc-900 font-semibold capitalize">{incident.status}</span>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 border border-zinc-200/60 p-3">
            <span className="text-zinc-500 block mb-1">Notes / Log Entry</span>
            <p className="text-zinc-700">{incident.notes || 'No custom notes logged.'}</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-zinc-600">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-zinc-400" />
            <p>
              Incident logs are stored securely under your private profile. Snapshots are scrubbed according to your 30-day retention rule.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Actions */}
      {activeTab === 'actions' && (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 space-y-4 shadow-xs">
          <div className="space-y-3">
            {incident.status === 'active' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Resolve & Close Incident</span>
                </div>
                <p className="text-xs text-emerald-900/80">
                  Did you verify the visitor (e.g. friendly neighbor, package courier, delivery)? Mark this event as safe and resolved.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resolvedNotes}
                    onChange={(e) => setResolvedNotes(e.target.value)}
                    placeholder="Optional resolution note (e.g. Courier delivered food)"
                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                  <button
                    onClick={handleResolve}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            )}

            {/* Quick Add to Trusted Registry */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                <UserPlus className="h-4 w-4 text-zinc-700" />
                <span>Enroll Person as Trusted</span>
              </div>
              <p className="text-xs text-zinc-500">
                If this person is a regular visitor or family member, enroll their face so future arrivals are recognized automatically.
              </p>

              {isAddingTrusted ? (
                <form onSubmit={handleQuickAddTrusted} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={trustedName}
                    onChange={(e) => setTrustedName(e.target.value)}
                    placeholder="Enter person's full name"
                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    Enroll
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTrusted(false)}
                    className="rounded-xl px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingTrusted(true)}
                  className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Enroll as Trusted Member
                </button>
              )}
            </div>

            {/* Manual SOS Panic Escalation */}
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <span>Escalate Incident via SOS</span>
              </div>
              <p className="text-xs text-red-900/80">
                Trigger emergency escalation immediately. This will dispatch your GPS coordinates and this entrance snapshot to your emergency contacts.
              </p>
              <button
                onClick={() => activateSos()}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
              >
                Activate SOS Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
