import React, { useState } from 'react';
import { 
  Activity, 
  Wifi, 
  Battery, 
  AlertCircle, 
  CheckCircle2, 
  DoorClosed, 
  Radio, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const DeviceHealthAndSensors: React.FC = () => {
  const { sensors, deviceHealth, cameras } = useData();
  const [expanded, setExpanded] = useState(false);

  const verifyingCameras = cameras.filter(c => c.status !== 'offline' && c.view_status === 'possible_obstruction');
  const tamperedCameras = cameras.filter(c => c.status !== 'offline' && (c.is_tampered || c.status === 'tampered' || c.view_status === 'obstructed_confirmed'));
  const offlineCameras = cameras.filter(c => c.status === 'offline');

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs">
      {/* Header bar */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
            <Activity className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Sensors & Hardware Health
              </h4>
              {tamperedCameras.length > 0 ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  {tamperedCameras.length} Tampered
                </span>
              ) : verifyingCameras.length > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                  {verifyingCameras.length} Checking View
                </span>
              ) : offlineCameras.length > 0 ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                  {offlineCameras.length} Disconnected
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  All Systems Healthy
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              {cameras.length} cameras · {sensors.length} perimeter sensors connected
            </p>
          </div>
        </div>

        <button className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 p-1">
          <span>{expanded ? 'Collapse' : 'Details'}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4">
          {/* Multi-Sensors Grid */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              IoT Sensor Grid (Multi-Sensor Mesh)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sensors.map((sensor) => {
                const isDoor = sensor.type === 'door_window';
                const isRadar = sensor.type === 'radar_mmwave';
                const isLock = sensor.type === 'smart_lock';

                return (
                  <div
                    key={sensor.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-700 shrink-0">
                        {isDoor ? (
                          <DoorClosed className="h-3.5 w-3.5" />
                        ) : isLock ? (
                          <Lock className="h-3.5 w-3.5" />
                        ) : isRadar ? (
                          <Radio className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Activity className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-900 truncate">{sensor.name}</div>
                        <div className="text-[10px] text-zinc-500">{sensor.zone} · {sensor.last_activity}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sensor.battery_percent !== undefined && (
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <Battery className="h-3 w-3 text-zinc-400" />
                          {sensor.battery_percent}%
                        </span>
                      )}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          sensor.status === 'open' || sensor.status === 'triggered' || sensor.status === 'tampered'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}
                      >
                        {sensor.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Camera Device Health Items */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Cameras & Edge Diagnostic
            </div>
            <div className="space-y-1.5">
              {deviceHealth.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {dev.status === 'healthy' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : dev.status === 'warning' ? (
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-zinc-900">{dev.device_name}</span>
                      <span className="text-zinc-500 ml-2 text-[11px]">{dev.details}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">{dev.last_ping}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
