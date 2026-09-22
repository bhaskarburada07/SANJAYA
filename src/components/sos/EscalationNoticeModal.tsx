import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Info, 
  Clock, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const EscalationNoticeModal: React.FC = () => {
  const { 
    escalationNotice, 
    dismissEscalationNotice, 
    emergencyContacts, 
    currentSosIncident,
    setSelectedIncident,
    escalationSession,
    respondToEmergencyContact,
    triggerSecondaryEscalationManual,
    resolveEmergencySession
  } = useData();

  const [copiedPackage, setCopiedPackage] = useState(false);
  const [showFullPackage, setShowFullPackage] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // If neither escalation notice nor active escalation session, don't show
  if (!escalationNotice && !escalationSession) return null;

  const session = escalationSession;
  const timerMins = session ? Math.floor(session.timerRemainingSeconds / 60) : 0;
  const timerSecs = session ? session.timerRemainingSeconds % 60 : 0;
  const formattedTimer = `${String(timerMins).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;

  const primaryContact = session?.primaryContact || emergencyContacts[0];

  const handleCopyDispatchPackage = () => {
    if (session?.dispatchPackage?.fullSummary) {
      navigator.clipboard.writeText(session.dispatchPackage.fullSummary);
      setCopiedPackage(true);
      setTimeout(() => setCopiedPackage(false), 2500);
    }
  };

  const handleResolve = () => {
    resolveEmergencySession(resolveNote.trim() || 'Homeowner confirmed situation resolved and safe.');
    setIsResolving(false);
    dismissEscalationNotice();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
              session?.escalationStatus === 'contact_responded' 
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}>
              {session?.escalationStatus === 'contact_responded' ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900">Emergency Escalation System</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  session?.escalationStatus === 'contact_responded'
                    ? 'bg-emerald-100 text-emerald-800'
                    : session?.escalationStatus === 'secondary_manual_action_required'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {session?.escalationStatus === 'contact_responded'
                    ? 'Contact Responded'
                    : session?.escalationStatus === 'secondary_manual_action_required'
                    ? 'Secondary Escalation'
                    : 'Timer Active'}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                SANJAYA AI Brain Automated Incident Escalation Protocol
              </p>
            </div>
          </div>
          <button
            onClick={dismissEscalationNotice}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
            title="Minimize modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STAGE 1: Emergency Contact Notified & Timer Active */}
        {session && session.escalationStatus === 'waiting_contact_response' && (
          <div className="space-y-4">
            {/* Primary Contact Dispatch Card */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-rose-600" />
                  Primary Emergency Contact Alerted First
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Delivered
                </span>
              </div>

              {primaryContact ? (
                <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-rose-100 shadow-2xs">
                  <div>
                    <div className="text-xs font-bold text-zinc-900">{primaryContact.name}</div>
                    <div className="text-[11px] text-zinc-500">{primaryContact.relationship} • {primaryContact.phone}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-rose-700 font-medium">Awaiting Response</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-rose-800">No emergency contact configured. Escalating to emergency authorities.</div>
              )}
            </div>

            {/* Response Timer Card */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 text-center space-y-2">
              <div className="text-xs font-semibold text-zinc-500 flex items-center justify-center gap-1.5">
                <Clock className="h-4 w-4 text-zinc-600" />
                Emergency Contact Response Timer ({session.timerDurationMinutes} Minutes Window)
              </div>
              <div className="text-4xl font-mono font-extrabold tracking-tight text-zinc-900">
                {formattedTimer}
              </div>
              <p className="text-[11px] text-zinc-600 max-w-md mx-auto">
                If {primaryContact?.name || 'your emergency contact'} does not respond within this window, the SANJAYA AI Brain automatically initiates secondary escalation to identify the nearest verified emergency service.
              </p>

              {/* Simulation/Quick Action Controls */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-200/80">
                <button
                  onClick={() => respondToEmergencyContact('Primary contact acknowledged alert')}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Simulate: Contact Responded
                </button>
                <button
                  onClick={() => triggerSecondaryEscalationManual()}
                  className="rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-2xs"
                >
                  Simulate: No Response (Escalate Now)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: Emergency Contact Responded */}
        {session && session.escalationStatus === 'contact_responded' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Emergency Contact Responded
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {primaryContact?.name || 'Your primary emergency contact'} has responded and confirmed awareness of this emergency.
                The automated escalation timer has been stopped. The emergency remains active and continuously monitored until you mark it as resolved.
              </p>
              {session.contactRespondedAt && (
                <div className="text-[11px] text-emerald-700 font-medium">
                  Acknowledged at: {new Date(session.contactRespondedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAGE 3: Emergency Contact Did Not Respond -> Secondary Escalation */}
        {session && (session.escalationStatus === 'secondary_manual_action_required' || session.escalationStatus === 'secondary_escalating' || session.escalationStatus === 'secondary_escalated') && (
          <div className="space-y-4">
            {/* Status Alert Banner */}
            <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-950 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Emergency Contact Did Not Respond
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                The configured {session.timerDurationMinutes}-minute waiting period elapsed without acknowledgment from {primaryContact?.name || 'the emergency contact'}.
                SANJAYA AI Brain has activated secondary emergency escalation.
              </p>
            </div>

            {/* Verified Location Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-700" />
                  Verified Current Location
                </span>
                <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                  {session.userLocation?.source === 'device_gps' ? 'Live GPS Pin' : 'Home Profile'}
                </span>
              </div>
              <div className="text-xs font-semibold text-zinc-900">
                {session.userLocation?.address}
              </div>
              {session.userLocation && (
                <div className="text-[11px] font-mono text-zinc-500">
                  {session.userLocation.latitude.toFixed(5)}° N, {session.userLocation.longitude.toFixed(5)}° E 
                  {session.userLocation.accuracy ? ` (Accuracy: ±${session.userLocation.accuracy}m)` : ''}
                </div>
              )}
            </div>

            {/* Nearest Verified Emergency Authority */}
            {session.nearestEmergencyService && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    Nearest Verified Emergency Service
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Verified Public Authority
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-zinc-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-zinc-900">{session.nearestEmergencyService.name}</div>
                    <div className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      Dial {session.nearestEmergencyService.helpline}
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-500">{session.nearestEmergencyService.address}</div>
                  <div className="text-[10px] text-zinc-400 font-medium">
                    Jurisdiction: {session.nearestEmergencyService.jurisdiction} • {session.nearestEmergencyService.distanceKm} km away
                  </div>
                </div>

                {/* Direct Dial Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="tel:112"
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call 112 (ERSS)</span>
                  </a>
                  <a
                    href="tel:100"
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition"
                  >
                    <Phone className="h-3.5 w-3.5 text-zinc-600" />
                    <span>Call 100 (Police)</span>
                  </a>
                </div>
              </div>
            )}

            {/* Official Integration Compliance Notice (Rule 7, 8, 10) */}
            <div className="flex items-start gap-2.5 rounded-xl bg-zinc-100 border border-zinc-200 p-3 text-xs text-zinc-700">
              <Info className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-900">Official Integration Status: </span>
                <span className="text-zinc-600">
                  {session.integrationStatus?.message || 
                   'Automated police dispatch API is restricted in this municipal jurisdiction. Direct calling and the verified dispatch packet below are activated.'}
                </span>
              </div>
            </div>

            {/* Emergency Information Package */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFullPackage(!showFullPackage)}
                  className="flex items-center gap-1 text-xs font-bold text-zinc-900 hover:text-zinc-700"
                >
                  <span>Verified Incident Dispatch Packet</span>
                  {showFullPackage ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={handleCopyDispatchPackage}
                  className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg transition"
                >
                  {copiedPackage ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Packet</span>
                    </>
                  )}
                </button>
              </div>

              {showFullPackage && session.dispatchPackage && (
                <div className="rounded-xl bg-zinc-950 p-3 text-zinc-100 text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {session.dispatchPackage.fullSummary}
                </div>
              )}
            </div>
          </div>
        )}

        {/* If no session, fallback to simple notice */}
        {!session && escalationNotice && (
          <div className="flex items-start gap-2.5 rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-600">
            <Info className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-900">System Notification: </span>
              <span>{escalationNotice}</span>
            </div>
          </div>
        )}

        {/* Resolution Input Drawer */}
        {isResolving && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2.5 animate-in fade-in">
            <div className="text-xs font-bold text-emerald-950">Resolve & Close Emergency</div>
            <input
              type="text"
              placeholder="Resolution note (e.g. All safe, false alarm, or police arrived)"
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsResolving(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                Confirm Resolve
              </button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-100">
          <div>
            {currentSosIncident && (
              <button
                onClick={() => {
                  setSelectedIncident(currentSosIncident);
                  dismissEscalationNotice();
                }}
                className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition"
              >
                View Incident Details
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isResolving && (
              <button
                onClick={() => setIsResolving(true)}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs transition"
              >
                Resolve Emergency
              </button>
            )}
            <button
              onClick={dismissEscalationNotice}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition"
            >
              Minimize
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
