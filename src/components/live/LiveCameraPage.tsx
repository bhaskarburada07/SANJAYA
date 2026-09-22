import React, { useState } from 'react';
import { 
  Camera as CameraIcon, 
  Sparkles, 
  Activity,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CameraPlayer } from './CameraPlayer';

export const LiveCameraPage: React.FC = () => {
  const { 
    trustedPeople,
    cameras, 
    activeCamera, 
    setActiveCameraId, 
    triggerSimulatedUnknown, 
    triggerSimulatedKnown, 
    triggerSimulatedDoorbell
  } = useData();

  const [savedSnapshots, setSavedSnapshots] = useState<string[]>([]);

  const handleSnapshot = (dataUrl: string) => {
    setSavedSnapshots(prev => [dataUrl, ...prev.slice(0, 5)]);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Camera Monitor
          </h1>
          <p className="text-xs text-zinc-500">
            Real-time feed with on-device computer vision & visitor awareness
          </p>
        </div>

        {/* Camera Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {cameras.map((cam) => (
            <button
              key={cam.id}
              onClick={() => setActiveCameraId(cam.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border transition shrink-0 ${
                cam.id === activeCamera.id
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  cam.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-400'
                }`}
              />
              <span>{cam.name}</span>
              <span className={`text-[10px] font-normal ${cam.id === activeCamera.id ? 'text-zinc-300' : 'text-zinc-400'}`}>
                ({cam.location})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Video Player Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <CameraPlayer 
            camera={activeCamera} 
            interactive={true} 
            onSnapshotTaken={handleSnapshot}
          />

          {/* Quick Simulation Bar for testing camera response */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-900">Interactive Video Simulator:</span>
              <span className="text-xs text-zinc-500 hidden sm:inline">Trigger approach events to test AI detection</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerSimulatedUnknown()}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
              >
                + Unknown Person
              </button>
              <button
                onClick={() => triggerSimulatedKnown()}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition"
              >
                + Known ({trustedPeople.length > 0 ? trustedPeople[0].name : 'Simulation'})
              </button>
              <button
                onClick={() => triggerSimulatedDoorbell()}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 transition"
              >
                Ring Chime
              </button>
            </div>
          </div>
        </div>

        {/* Right Info Column: Telemetry & Snapshot Gallery */}
        <div className="lg:col-span-4 space-y-4">
          {/* Hardware & Edge AI Telemetry */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Activity className="h-4 w-4 text-zinc-700" />
              <span>Edge Vision Telemetry</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Resolution</span>
                <span className="font-mono font-semibold text-zinc-900">1080p @ 30fps</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Inference Latency</span>
                <span className="font-mono font-semibold text-emerald-600">27.6 ms</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Neural Model</span>
                <span className="font-mono font-semibold text-zinc-800">YOLOv8-EdgeTPU</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Privacy Mode</span>
                <span className="font-semibold text-emerald-600">Local Only (Private)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Stream Protocol</span>
                <span className="font-mono text-zinc-700">WebRTC / RTSP</span>
              </div>
            </div>
          </div>

          {/* Captured Snapshots Gallery */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span className="flex items-center gap-2">
                <CameraIcon className="h-4 w-4 text-zinc-700" />
                Session Snapshots
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">{savedSnapshots.length}</span>
            </div>

            {savedSnapshots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-xs text-zinc-400">
                Click "Snapshot" on the camera player to capture frames.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {savedSnapshots.map((url, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200">
                    <img src={url} alt={`Snapshot ${i}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
