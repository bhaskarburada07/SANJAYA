import React, { useState } from 'react';
import { X, Camera as CameraIcon, Check, Sparkles, AlertCircle, Layers, MapPin, Link as LinkIcon, Video } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Camera } from '../../types';
import { EditCameraModal } from './EditCameraModal';

interface AddCameraModalProps {
  onClose: () => void;
  cameraToEdit?: Camera | null;
}

export const AddCameraModal: React.FC<AddCameraModalProps> = ({ onClose, cameraToEdit }) => {
  // If editing an existing camera, delegate cleanly to EditCameraModal
  if (cameraToEdit) {
    return <EditCameraModal camera={cameraToEdit} onClose={onClose} />;
  }

  const { addCamera, zones } = useData();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Front Porch');
  const [zone, setZone] = useState('Main Entrance');
  const [cameraType, setCameraType] = useState<'doorbell' | 'dome' | 'bullet' | 'ptz'>('doorbell');
  const [streamUrl, setStreamUrl] = useState('rtsp://192.168.1.100/stream');
  const [isSimulation, setIsSimulation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Camera name is required.');
      return;
    }
    if (!location.trim()) {
      setError('Camera location is required.');
      return;
    }

    addCamera({
      name: name.trim(),
      location: location.trim(),
      zone: zone.trim() || location.trim(),
      camera_type: cameraType,
      connection_type: 'rtsp',
      brand: 'SANJAYA Vision',
      stream_url: streamUrl.trim(),
      status: 'online',
      is_simulation: isSimulation,
    });
    onClose();
  };

  const availableZoneNames = Array.from(
    new Set([
      'Main Entrance',
      'Front Porch',
      'Living Room',
      'Backyard & Garden',
      'Garage & Driveway',
      ...zones.map((z) => z.name),
    ])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <CameraIcon className="h-5 w-5 text-zinc-900" />
            <h2 className="text-lg font-bold text-zinc-900">Add Camera</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Camera Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Front Doorbell, Garage North"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Location</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Front Porch"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>Zone</span>
              </label>
              <input
                type="text"
                list="add-zone-options"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Main Entrance"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
              />
              <datalist id="add-zone-options">
                {availableZoneNames.map((zn) => (
                  <option key={zn} value={zn} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
              <Video className="h-3 w-3" />
              <span>Camera Type</span>
            </label>
            <select
              value={cameraType}
              onChange={(e) => setCameraType(e.target.value as any)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none shadow-xs"
            >
              <option value="doorbell">Doorbell Camera</option>
              <option value="dome">Dome Camera</option>
              <option value="bullet">Bullet Camera</option>
              <option value="ptz">PTZ Camera</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              <span>Stream URL (RTSP / WebRTC)</span>
            </label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="rtsp://192.168.1.100/stream"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
            />
          </div>

          {/* Simulation mode card */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-zinc-700" />
                <span className="text-xs font-semibold text-zinc-900">Simulation Mode</span>
              </div>
              <input
                type="checkbox"
                checked={isSimulation}
                onChange={(e) => setIsSimulation(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 accent-zinc-900"
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              This camera uses real-time AI simulated detection events if no physical RTSP hardware is plugged in.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition"
            >
              <Check className="h-4 w-4" />
              <span>Add Camera</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
