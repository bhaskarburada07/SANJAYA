import React from 'react';
import { 
  Users, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Camera as CameraIcon,
  MoreVertical,
  ShieldCheck,
  Video,
  Sparkles,
  Package,
  Radio,
  EyeOff,
  Bell
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CameraPlayer } from '../live/CameraPlayer';
import { NavScreen } from '../common/Sidebar';
import { SecurityModeSelector } from './SecurityModeSelector';
import { DailySecurityBriefCard } from './DailySecurityBriefCard';
import { DeviceHealthAndSensors } from './DeviceHealthAndSensors';

interface DashboardPageProps {
  onNavigate: (screen: NavScreen) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { 
    trustedPeople, 
    detections, 
    incidents, 
    cameras, 
    activeCamera, 
    setActiveCameraId,
    activateSos, 
    setSelectedIncident,
    settings,
    triggerSimulatedUnknown,
    triggerSimulatedKnown,
    triggerSimulatedPackage,
    triggerSimulatedLoitering,
    triggerSimulatedDoorbell,
    triggerSimulatedTamper,
    escalationSession,
    openEscalationModal,
    respondToEmergencyContact,
    resolveEmergencySession,
  } = useData();

  // Metrics
  const knownCount = trustedPeople.length;
  const camerasCount = cameras.length;
  const incidentsCount = incidents.length;

  const formatRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Security Mode Arming Bar */}
      <SecurityModeSelector />

      {/* Daily Security Brief Card with AI Investigator Trigger */}
      <DailySecurityBriefCard />

      {/* Emergency Escalation Live Status Banner */}
      {escalationSession && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 shadow-sm animate-in fade-in flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-950">
                  {escalationSession.escalationStatus === 'waiting_contact_response'
                    ? 'Emergency Escalation: Waiting for Contact Response'
                    : escalationSession.escalationStatus === 'contact_responded'
                    ? 'Emergency Contact Responded'
                    : 'Secondary Emergency Escalation Active'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-white text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                  {escalationSession.escalationStatus === 'waiting_contact_response'
                    ? `${Math.floor(escalationSession.timerRemainingSeconds / 60)}:${String(escalationSession.timerRemainingSeconds % 60).padStart(2, '0')} remaining`
                    : escalationSession.escalationStatus === 'contact_responded'
                    ? 'Timer Stopped'
                    : 'Dial 112 / 100'}
                </span>
              </div>
              <p className="text-[11px] text-rose-800 mt-0.5">
                {escalationSession.escalationStatus === 'waiting_contact_response'
                  ? `Notification delivered to ${escalationSession.primaryContact?.name || 'primary contact'}. Escalating if no acknowledgment received within ${escalationSession.timerDurationMinutes}m.`
                  : escalationSession.escalationStatus === 'contact_responded'
                  ? `${escalationSession.primaryContact?.name || 'Emergency contact'} confirmed awareness. Active monitoring continues.`
                  : `Nearest emergency service identified: ${escalationSession.nearestEmergencyService?.name || 'ERSS 112'}. Verified dispatch package ready.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {escalationSession.escalationStatus === 'waiting_contact_response' && (
              <button
                onClick={() => respondToEmergencyContact('Primary contact acknowledged via phone')}
                className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-2xs"
              >
                Contact Responded
              </button>
            )}
            <button
              onClick={() => openEscalationModal()}
              className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs"
            >
              View Escalation
            </button>
            <button
              onClick={() => resolveEmergencySession('Resolved from dashboard')}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
            >
              Resolve
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left is Live Camera Feed, Right is Metrics & SOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Camera (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Camera Canvas Component */}
          <CameraPlayer camera={activeCamera} interactive={true} />

          {/* Quick zone switcher pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
            <span className="text-xs text-zinc-400 font-medium shrink-0">Monitored Feeds:</span>
            {cameras.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setActiveCameraId(cam.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition shrink-0 ${
                  cam.id === activeCamera.id
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    cam.status === 'tampered'
                      ? 'bg-red-500 animate-ping'
                      : cam.status === 'online'
                      ? 'bg-emerald-500'
                      : 'bg-zinc-400'
                  }`}
                />
                <span>{cam.name}</span>
                {cam.is_tampered && (
                  <span className="text-[9px] font-bold text-red-300 ml-1">TAMPERED</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Metrics & SOS (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* AI Brain Card */}
          <div 
            onClick={() => onNavigate('ai-brain')}
            className="cursor-pointer rounded-2xl border border-zinc-200/90 bg-white p-4 transition hover:border-zinc-300 hover:shadow-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900">AI Brain</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">Continuous Security Intelligence</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </div>

          {/* Cameras Card */}
          <div 
            onClick={() => onNavigate('cameras')}
            className="cursor-pointer rounded-2xl border border-zinc-200/90 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <CameraIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500">Cameras</div>
                <div className="text-xl font-bold text-zinc-900">{camerasCount}</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </div>

          {/* People Card */}
          <div 
            onClick={() => onNavigate('people')}
            className="cursor-pointer rounded-2xl border border-zinc-200/90 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500">People</div>
                <div className="text-xl font-bold text-zinc-900">{knownCount}</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </div>

          {/* Incidents Card */}
          <div 
            onClick={() => onNavigate('incidents')}
            className="cursor-pointer rounded-2xl border border-zinc-200/90 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500">Incidents</div>
                <div className="text-xl font-bold text-zinc-900">{incidentsCount}</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </div>

          {/* SOS Panic Trigger Button */}
          <button
            onClick={() => activateSos()}
            className="cursor-pointer rounded-2xl border border-red-500/20 bg-red-600 p-4 text-white shadow-sm hover:bg-red-700 active:scale-[0.98] transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase tracking-wider">SOS</div>
                <div className="text-[11px] text-red-100">Emergency protocol</div>
              </div>
            </div>
            <span className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
              Trigger
            </span>
          </button>
        </div>
      </div>

      {/* Device Health and Multi-Sensor Mesh Card */}
      <DeviceHealthAndSensors />

      {/* Interactive Simulation Scenarios Banner */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Autonomous Intelligence Test Scenarios
            </h4>
          </div>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            Simulate realistic security events without physical hardware
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            onClick={() => triggerSimulatedUnknown()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5 hover:bg-zinc-100 hover:border-zinc-300 transition text-center"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-[11px] font-semibold text-zinc-800">Unknown Visitor</span>
          </button>

          <button
            onClick={() => triggerSimulatedKnown()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5 hover:bg-zinc-100 hover:border-zinc-300 transition text-center"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-[11px] font-semibold text-zinc-800">Trusted Arrival</span>
          </button>

          <button
            onClick={() => triggerSimulatedPackage()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5 hover:bg-zinc-100 hover:border-zinc-300 transition text-center"
          >
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-[11px] font-semibold text-zinc-800">Package Drop</span>
          </button>

          <button
            onClick={() => triggerSimulatedLoitering()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5 hover:bg-zinc-100 hover:border-zinc-300 transition text-center"
          >
            <Clock className="h-4 w-4 text-red-500" />
            <span className="text-[11px] font-semibold text-zinc-800">120s Loitering</span>
          </button>

          <button
            onClick={() => triggerSimulatedDoorbell()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5 hover:bg-zinc-100 hover:border-zinc-300 transition text-center"
          >
            <Bell className="h-4 w-4 text-zinc-600" />
            <span className="text-[11px] font-semibold text-zinc-800">Doorbell Chime</span>
          </button>

          <button
            onClick={() => triggerSimulatedTamper(activeCamera.id)}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/40 p-2.5 hover:bg-red-100/60 hover:border-red-300 transition text-center"
          >
            <EyeOff className="h-4 w-4 text-red-600" />
            <span className="text-[11px] font-semibold text-red-700">Tamper Camera</span>
          </button>
        </div>
      </div>

      {/* Latest Activity Section with Risk Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900">
            Latest Security Activity
          </h2>
          <button
            onClick={() => onNavigate('incidents')}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition"
          >
            View all incidents
          </button>
        </div>

        {detections.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center text-xs text-zinc-500">
            No recent activity recorded yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {detections.slice(0, 4).map((det) => {
              const isKnown = det.person_type === 'known';
              const linkedIncident = incidents.find(i => i.detection_id === det.id);
              const linkedPerson = det.person_id 
                ? trustedPeople.find(p => p.id === det.person_id) 
                : (det.person_name ? trustedPeople.find(p => p.name.toLowerCase() === det.person_name?.toLowerCase()) : null);
              const displayName = linkedPerson?.name || det.person_name;
              const linkedCamera = cameras.find(c => c.id === det.camera_id);
              const displayZone = linkedCamera?.name || linkedCamera?.location || det.zone;

              return (
                <div
                  key={det.id}
                  onClick={() => {
                    if (linkedIncident) {
                      setSelectedIncident(linkedIncident);
                      onNavigate('incident-detail');
                    } else {
                      onNavigate('incidents');
                    }
                  }}
                  className="group cursor-pointer flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 hover:border-zinc-300 hover:shadow-xs transition"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-zinc-200/80 bg-zinc-100">
                      <img
                        src={det.snapshot_url}
                        alt={displayName || 'Visitor'}
                        className="h-full w-full object-cover"
                      />
                      <span
                        className={`absolute top-1 right-1 h-2 w-2 rounded-full ring-2 ring-white ${
                          isKnown ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900 truncate">
                          {isKnown ? `Known person: ${displayName}` : 'Unknown person detected'}
                        </span>
                        {det.risk_level && det.risk_level !== 'LOW' && (
                          <span className={`rounded-full px-2 py-0.2 text-[9px] font-bold uppercase ${
                            det.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            det.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {det.risk_level} RISK
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500 flex items-center gap-1.5">
                        <span>{displayZone}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(det.detected_at)}</span>
                        {det.dwell_time_seconds && (
                          <>
                            <span>·</span>
                            <span>{det.dwell_time_seconds}s dwell</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Confidence Match & Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                      {(det.confidence * 100).toFixed(0)}% confidence
                    </span>
                    <button 
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (linkedIncident) {
                          setSelectedIncident(linkedIncident);
                          onNavigate('incident-detail');
                        } else {
                          onNavigate('incidents');
                        }
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
