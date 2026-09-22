import React, { useState } from 'react';
import { X, Camera as CameraIcon, Check, Sparkles } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Camera } from '../../types';

interface AddCameraModalProps {
  onClose: () => void;
  cameraToEdit?: Camera | null;
}

export const AddCameraModal: React.FC<AddCameraModalProps> = ({ onClose, cameraToEdit }) => {
  const { addCamera, updateCamera } = useData();
  const [name, setName] = useState(cameraToEdit?.name || '');
  const [location, setLocation] = useState(cameraToEdit?.location || 'Front Porch');
  const [streamUrl, setStreamUrl] = useState(cameraToEdit?.stream_url || 'rtsp://192.168.1.100/stream');
  const [isSimulation, setIsSimulation] = useState(cameraToEdit ? cameraToEdit.is_simulation : true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (cameraToEdit) {
      updateCamera(cameraToEdit.id, {
        name: name.trim(),
        location: location.trim(),
        zone: location.trim(),
        stream_url: streamUrl.trim(),
        is_simulation: isSimulation,
      });
    } else {
      addCamera({
        name: name.trim(),
        location: location.trim(),
        zone: location.trim(),
        stream_url: streamUrl.trim(),
        status: 'online',
        is_simulation: isSimulation,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <CameraIcon className="h-5 w-5 text-zinc-900" />
            <h2 className="text-lg font-bold text-zinc-900">
              {cameraToEdit ? 'Edit Camera' : 'Add Camera'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Camera Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Front Doorbell, Garage North"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Location / Zone
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Front Door, Backyard, Driveway"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Stream URL (RTSP / WebRTC)
            </label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="rtsp://192.168.1.100/stream"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
            />
          </div>

          {/* Simulation mode card */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5">
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
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
              <span>Save Camera</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
