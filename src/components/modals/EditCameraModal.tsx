import React, { useState } from 'react';
import { 
  X, 
  Camera as CameraIcon, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Layers, 
  MapPin, 
  Link as LinkIcon, 
  Video, 
  FileText,
  Radio
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Camera } from '../../types';

interface EditCameraModalProps {
  camera: Camera;
  onClose: () => void;
  onSuccess?: (updated: Camera) => void;
}

export const EditCameraModal: React.FC<EditCameraModalProps> = ({ 
  camera, 
  onClose,
  onSuccess 
}) => {
  const { updateCamera, zones } = useData();

  // Form State initialized with existing camera values (pre-filled)
  const [name, setName] = useState<string>(camera.name || '');
  const [location, setLocation] = useState<string>(camera.location || '');
  const [zone, setZone] = useState<string>(camera.zone || camera.location || 'Main Entrance');
  const [cameraType, setCameraType] = useState<'doorbell' | 'dome' | 'bullet' | 'ptz'>(
    camera.camera_type || 'doorbell'
  );
  const [connectionType, setConnectionType] = useState<'wifi' | 'onvif' | 'rtsp' | 'sanjaya_cam'>(
    camera.connection_type || 'rtsp'
  );
  const [brand, setBrand] = useState<string>(camera.brand || 'SANJAYA Vision');
  const [streamUrl, setStreamUrl] = useState<string>(camera.stream_url || '');
  const [description, setDescription] = useState<string>(camera.description || '');
  const [isSimulation, setIsSimulation] = useState<boolean>(camera.is_simulation ?? true);

  // Validation & UI States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Validate fields before saving
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 1. Camera Name validation
    if (!name.trim()) {
      newErrors.name = 'Camera name cannot be empty.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Camera name must be at least 2 characters.';
    }

    // 2. Camera Location validation
    if (!location.trim()) {
      newErrors.location = 'Camera location cannot be empty.';
    }

    // 3. Home Zone validation
    if (!zone.trim()) {
      newErrors.zone = 'Home zone cannot be empty.';
    }

    // 4. Stream URL / RTSP validation (if provided or if not in pure simulation)
    const trimmedStream = streamUrl.trim();
    if (trimmedStream) {
      const validProtocol = /^(rtsp:\/\/|rtsps:\/\/|http:\/\/|https:\/\/|webrtc:\/\/|ws:\/\/|wss:\/\/|[a-zA-Z0-9.-]+(?::[0-9]+)?\/.*)/i;
      if (!validProtocol.test(trimmedStream)) {
        newErrors.streamUrl = 'Enter a valid stream URL (e.g., rtsp://192.168.1.100/stream or https://...)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (isSaving) return; // Prevent duplicate Save clicks

    if (!validate()) {
      return;
    }

    setIsSaving(true);

    try {
      // NOTE: Strictly preserve the camera's real-time connection status (online, offline, tampered)
      // and do NOT overwrite it merely by editing metadata.
      const updated = await updateCamera(camera.id, {
        name: name.trim(),
        location: location.trim(),
        zone: zone.trim(),
        camera_type: cameraType,
        connection_type: connectionType,
        brand: brand.trim() || undefined,
        stream_url: streamUrl.trim(),
        description: description.trim() || undefined,
        is_simulation: isSimulation,
        // Status and view_status remain untouched (sourced from device telemetry)
      });

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err: any) {
      console.error('[EditCameraModal] Error saving camera:', err);
      setServerError(err?.message || 'Failed to save camera changes. Please try again.');
      setIsSaving(false);
    }
  };

  // Distinct list of available zones for quick selection
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-2xl animate-in zoom-in-95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <CameraIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Edit Camera</h2>
              <p className="text-xs text-zinc-500">
                Updating camera settings for <span className="font-semibold text-zinc-700">{camera.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Server / Save Error Banner */}
          {serverError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Connection Telemetry Notice (Read-only status info) */}
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200/80 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-zinc-500" />
              <span className="text-[11px] font-medium text-zinc-600">Hardware Connection Status:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  camera.status === 'online'
                    ? 'bg-emerald-500'
                    : camera.status === 'tampered'
                    ? 'bg-red-500'
                    : 'bg-zinc-400'
                }`}
              />
              <span className="font-semibold text-zinc-800 capitalize text-[11px]">
                {camera.status === 'online' ? 'Online & Transmitting' : camera.status}
              </span>
            </div>
          </div>

          {/* Field 1: Camera Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              Camera Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g., Main Entrance Doorbell, Backyard Bullet"
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition shadow-xs ${
                errors.name ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400' : 'border-zinc-300 focus:border-zinc-500'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Grid: Location & Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Field 2: Camera Location */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                <span>Physical Location <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                }}
                placeholder="e.g., Front Porch, Driveway North"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition shadow-xs ${
                  errors.location ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400' : 'border-zinc-300 focus:border-zinc-500'
                }`}
              />
              {errors.location && (
                <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.location}
                </p>
              )}
            </div>

            {/* Field 3: Home Zone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-zinc-500" />
                <span>Home Zone <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                list="zone-options"
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  if (errors.zone) setErrors((prev) => ({ ...prev, zone: '' }));
                }}
                placeholder="e.g., Main Entrance, Living Room"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition shadow-xs ${
                  errors.zone ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400' : 'border-zinc-300 focus:border-zinc-500'
                }`}
              />
              <datalist id="zone-options">
                {availableZoneNames.map((zName) => (
                  <option key={zName} value={zName} />
                ))}
              </datalist>
              {errors.zone && (
                <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.zone}
                </p>
              )}
            </div>
          </div>

          {/* Grid: Camera Type & Connection Protocol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Field 4: Camera Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5 flex items-center gap-1">
                <Video className="h-3.5 w-3.5 text-zinc-500" />
                <span>Camera Type</span>
              </label>
              <select
                value={cameraType}
                onChange={(e) => setCameraType(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none shadow-xs"
              >
                <option value="doorbell">Doorbell Camera</option>
                <option value="dome">Dome Camera (Indoor/Ceiling)</option>
                <option value="bullet">Bullet Camera (Outdoor Long-Range)</option>
                <option value="ptz">PTZ Camera (Pan-Tilt-Zoom)</option>
              </select>
            </div>

            {/* Field: Connection Protocol */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Protocol / Hardware
              </label>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none shadow-xs"
              >
                <option value="sanjaya_cam">SANJAYA Cam (Direct Neural Stream)</option>
                <option value="rtsp">RTSP IP Stream</option>
                <option value="onvif">ONVIF Profile S/T</option>
                <option value="wifi">WiFi Direct IP Cam</option>
              </select>
            </div>
          </div>

          {/* Field 5: Stream URL / RTSP Endpoint */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5 flex items-center gap-1">
              <LinkIcon className="h-3.5 w-3.5 text-zinc-500" />
              <span>Stream URL / RTSP Endpoint</span>
            </label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => {
                setStreamUrl(e.target.value);
                if (errors.streamUrl) setErrors((prev) => ({ ...prev, streamUrl: '' }));
              }}
              placeholder="rtsp://192.168.1.100/live/ch1 or https://..."
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none transition shadow-xs ${
                errors.streamUrl ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400' : 'border-zinc-300 focus:border-zinc-500'
              }`}
            />
            {errors.streamUrl && (
              <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.streamUrl}
              </p>
            )}
          </div>

          {/* Field 6: Camera Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-zinc-500" />
              <span>Description / Notes (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Primary view of main entry gate, visitor walkway, and package delivery ledge."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none shadow-xs resize-none"
            />
          </div>

          {/* Simulation Mode Toggle Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-zinc-700" />
                <div>
                  <span className="text-xs font-semibold text-zinc-900">Synthetic AI Simulation</span>
                  <p className="text-[11px] text-zinc-500">
                    Generates real-time detection events and canvas overlays when physical RTSP stream is unavailable.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isSimulation}
                onChange={(e) => setIsSimulation(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 accent-zinc-900"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition disabled:opacity-60 active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-zinc-200" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
