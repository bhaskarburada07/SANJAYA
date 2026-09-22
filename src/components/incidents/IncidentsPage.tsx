import React, { useState, useMemo } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ChevronRight, 
  Clock, 
  MapPin, 
  ShieldCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Incident } from '../../types';
import { NavScreen } from '../common/Sidebar';

interface IncidentsPageProps {
  onNavigate: (screen: NavScreen) => void;
}

type IncidentFilter = 'all' | 'known' | 'unknown' | 'sos';

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ onNavigate }) => {
  const { incidents, detections, setSelectedIncident } = useData();
  const [filter, setFilter] = useState<IncidentFilter>('all');

  // Filter logic with deduplication
  const filteredIncidents = useMemo(() => {
    const seen = new Set<string>();
    return incidents.filter((inc) => {
      if (!inc.id || seen.has(inc.id)) return false;
      seen.add(inc.id);

      if (filter === 'sos') return inc.type === 'sos_activated';
      if (filter === 'unknown') return inc.type === 'unknown_detection';
      if (filter === 'known') {
        const det = detections.find((d) => d.id === inc.detection_id);
        return det?.person_type === 'known';
      }
      return true;
    });
  }, [incidents, filter, detections]);

  // Group by Today vs Yesterday / Earlier
  const today = new Date().toDateString();
  const todayIncidents = useMemo(() => {
    return filteredIncidents.filter(
      (inc) => new Date(inc.started_at).toDateString() === today
    );
  }, [filteredIncidents, today]);

  const earlierIncidents = useMemo(() => {
    return filteredIncidents.filter(
      (inc) => new Date(inc.started_at).toDateString() !== today
    );
  }, [filteredIncidents, today]);

  const handleSelectIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    onNavigate('incident-detail');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          Incidents
        </h1>
        <p className="text-xs text-zinc-500">
          Audited log of entrance detections, homeowner verification, and emergency alerts.
        </p>
      </div>

      {/* Filter Tabs matching Screen 4 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'known', 'unknown', 'sos'] as IncidentFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${
              filter === tab
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {tab === 'sos' ? 'SOS' : tab}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredIncidents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">No incidents found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Your home has been quiet and protected. No security events match your current filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today Group */}
          {todayIncidents.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                Today
              </div>
              <div className="space-y-2.5">
                {todayIncidents.map((inc) => (
                  <IncidentRowItem 
                    key={`today-${inc.id}`} 
                    incident={inc} 
                    onSelect={() => handleSelectIncident(inc)} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Earlier / Yesterday Group */}
          {earlierIncidents.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                Yesterday & Earlier
              </div>
              <div className="space-y-2.5">
                {earlierIncidents.map((inc) => (
                  <IncidentRowItem 
                    key={`earlier-${inc.id}`} 
                    incident={inc} 
                    onSelect={() => handleSelectIncident(inc)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface IncidentRowItemProps {
  incident: Incident;
  onSelect: () => void;
}

const IncidentRowItem: React.FC<IncidentRowItemProps> = ({ incident, onSelect }) => {
  const { cameras, detections, trustedPeople } = useData();
  const isUnknown = incident.type === 'unknown_detection';
  const isSos = incident.type === 'sos_activated';
  const isCancelled = incident.status === 'cancelled';
  const isEscalated = incident.status === 'escalated';

  const linkedDetection = detections.find((d) => d.id === incident.detection_id);
  const linkedCamera = cameras.find((c) => c.id === incident.camera_id || c.id === linkedDetection?.camera_id);
  const linkedPerson = linkedDetection?.person_id
    ? trustedPeople.find((p) => p.id === linkedDetection.person_id)
    : (linkedDetection?.person_name ? trustedPeople.find((p) => p.name.toLowerCase() === linkedDetection.person_name?.toLowerCase()) : null);

  const personName = linkedPerson?.name || linkedDetection?.person_name || (incident.who && !incident.who.toLowerCase().includes('unknown') ? incident.who : null);
  const locationName = linkedCamera?.name ? `${linkedCamera.name}` : (linkedCamera?.location || incident.where || linkedDetection?.zone || 'Main Entrance');

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer flex items-center justify-between rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs hover:border-zinc-300 hover:shadow-sm transition group"
    >
      <div className="flex items-center gap-3.5">
        {/* Status Icon */}
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
            isEscalated
              ? 'bg-red-50 text-red-600 border border-red-200'
              : isCancelled
              ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
              : isUnknown
              ? 'bg-amber-50 text-amber-600 border border-amber-200'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}
        >
          {isEscalated ? (
            <ShieldAlert className="h-5 w-5" />
          ) : isCancelled ? (
            <AlertOctagon className="h-5 w-5" />
          ) : isUnknown ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-zinc-900 group-hover:text-zinc-700 transition">
              {isSos
                ? isCancelled
                  ? 'SOS cancelled'
                  : 'SOS Emergency Activated'
                : isUnknown
                ? 'Unknown person detected'
                : personName
                ? `Known person: ${personName}`
                : 'Known person detected'}
            </h4>

            {/* Status pill */}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                incident.status === 'active'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : incident.status === 'escalated'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : incident.status === 'cancelled'
                  ? 'bg-zinc-100 text-zinc-600'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {incident.status}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {locationName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(incident.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-zinc-700 transition" />
    </div>
  );
};
