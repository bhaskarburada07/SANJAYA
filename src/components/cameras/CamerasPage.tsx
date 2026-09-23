import React, { useState } from 'react';
import { 
  Camera as CameraIcon, 
  Plus, 
  Radio, 
  MoreVertical, 
  Trash2, 
  Sparkles, 
  Power, 
  Video,
  CheckCircle2,
  AlertCircle,
  Edit3,
  EyeOff,
  ShieldAlert,
  WifiOff
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AddCameraModal } from '../modals/AddCameraModal';
import { EditCameraModal } from '../modals/EditCameraModal';
import { NavScreen } from '../common/Sidebar';
import { Camera } from '../../types';

interface CamerasPageProps {
  onNavigate: (screen: NavScreen) => void;
}

export const CamerasPage: React.FC<CamerasPageProps> = ({ onNavigate }) => {
  const { 
    cameras, 
    activeCamera, 
    setActiveCameraId, 
    updateCamera, 
    deleteCamera,
    triggerCameraObstruction,
    clearCameraObstruction,
    restoreCameraFromTamper,
    forceConfirmTampering
  } = useData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const toggleCameraStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    updateCamera(id, { status: newStatus as any });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <CameraIcon className="h-5 w-5 text-zinc-900" />
            Camera Devices
          </h1>
          <p className="text-xs text-zinc-500">
            Manage outdoor and entrance cameras, stream endpoints, and vision scanning zones.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Camera</span>
        </button>
      </div>

      {/* Camera Devices Grid */}
      {cameras.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center space-y-3 shadow-xs">
          <CameraIcon className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="text-base font-bold text-zinc-900">No cameras yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Add a camera device to start monitoring your entrance and recognizing visitors.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Add Camera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((cam) => {
            const isOffline = cam.status === 'offline';
            const isVerifying = !isOffline && cam.view_status === 'possible_obstruction' && !!cam.obstruction_verification;
            const isTampered = !isOffline && (cam.status === 'tampered' || cam.view_status === 'obstructed_confirmed' || cam.is_tampered);
            const isNormalOnline = !isOffline && !isVerifying && !isTampered;
            const isSelected = cam.id === activeCamera.id;

            return (
              <div
                key={cam.id}
                className={`relative flex flex-col rounded-3xl border bg-white overflow-hidden shadow-xs transition ${
                  isTampered 
                    ? 'border-red-400 ring-1 ring-red-400' 
                    : isVerifying
                    ? 'border-amber-400 ring-1 ring-amber-400'
                    : isSelected 
                    ? 'border-zinc-900 ring-1 ring-zinc-900' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {/* Simulated Camera Preview Thumbnail */}
                <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                  {isOffline ? (
                    <div className="flex flex-col items-center gap-1 text-zinc-500 z-10 text-center px-4">
                      <WifiOff className="h-7 w-7 text-zinc-500" />
                      <span className="text-xs font-bold text-zinc-400">Camera Disconnected</span>
                      <span className="text-[10px] text-zinc-500">Offline · Not classified as tampering</span>
                    </div>
                  ) : isVerifying ? (
                    <div className="flex flex-col items-center gap-1 text-amber-400 z-10 text-center px-4 animate-pulse">
                      <EyeOff className="h-7 w-7 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">Checking Camera ({cam.obstruction_verification?.remainingSeconds}s)</span>
                      <span className="text-[10px] text-amber-200/80">Verifying 30s view obstruction</span>
                    </div>
                  ) : isTampered ? (
                    <div className="flex flex-col items-center gap-1 text-red-400 z-10 text-center px-4">
                      <ShieldAlert className="h-7 w-7 text-red-500 animate-bounce" />
                      <span className="text-xs font-bold text-red-400">Tampering / Block Confirmed</span>
                      <span className="text-[10px] text-red-300">Obstruction persisted for 30s</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-400 z-10 text-center">
                      <Radio className="h-7 w-7 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-zinc-300">RTSP Stream Active</span>
                      <span className="text-[10px] text-zinc-500">Normal Visual Field</span>
                    </div>
                  )}

                  {/* Badges on preview */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-xs shadow-xs">
                    {isOffline ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-zinc-800/90 border border-zinc-700 px-2 py-0.5 text-zinc-300">
                        <span className="h-2 w-2 rounded-full bg-zinc-500" />
                        Disconnected
                      </span>
                    ) : isVerifying ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-amber-950/90 border border-amber-500/80 px-2 py-0.5 text-amber-200">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                        Checking ({cam.obstruction_verification?.remainingSeconds}s)
                      </span>
                    ) : isTampered ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-red-950/90 border border-red-500 px-2 py-0.5 text-red-200">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                        Tampered
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-0.5 text-zinc-800">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    )}
                  </div>

                  {cam.is_simulation && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-zinc-800/80 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-medium text-zinc-200 backdrop-blur-xs">
                      <Sparkles className="h-3 w-3 text-zinc-300" />
                      Simulation
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-3 z-10 text-[11px] font-mono text-zinc-300">
                    {cam.location}
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{cam.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono truncate max-w-[170px]">
                      {cam.stream_url || 'rtsp://edge.local'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Live Feed button */}
                    <button
                      onClick={() => {
                        setActiveCameraId(cam.id);
                        onNavigate('live');
                      }}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 shadow-xs transition"
                    >
                      View Live
                    </button>

                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === cam.id ? null : cam.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === cam.id && (
                        <>
                          {/* Click-away backdrop */}
                          <div 
                            className="fixed inset-0 z-20 cursor-default" 
                            onClick={() => setActiveMenuId(null)} 
                          />
                          <div className="absolute right-0 mt-1 w-56 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl z-30 space-y-1">
                            {/* Required Option 1: Edit Camera */}
                            <button
                              onClick={() => {
                                setEditingCamera(cam);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 hover:bg-zinc-100 text-left font-medium transition"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-zinc-600" />
                              <span>Edit Camera</span>
                            </button>

                            {/* Required Option 2: Delete Camera (Triggers confirmation dialog) */}
                            <button
                              onClick={() => {
                                setCameraToDelete(cam);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium transition"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              <span>Delete Camera</span>
                            </button>

                            <div className="border-t border-zinc-100 my-1" />

                            <button
                              onClick={() => {
                                toggleCameraStatus(cam.id, cam.status);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 text-left transition"
                            >
                              <Power className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{!isOffline ? 'Disconnect Camera' : 'Reconnect Camera'}</span>
                            </button>

                            {/* Obstruction Simulation Options */}
                            {isVerifying ? (
                              <>
                                <button
                                  onClick={() => {
                                    clearCameraObstruction(cam.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 text-left font-semibold"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Clear Obstruction (Normal)</span>
                                </button>
                                <button
                                  onClick={() => {
                                    forceConfirmTampering(cam.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-amber-700 hover:bg-amber-50 text-left"
                                >
                                  <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Confirm Tampering (30s)</span>
                                </button>
                              </>
                            ) : isTampered ? (
                              <button
                                onClick={() => {
                                  restoreCameraFromTamper(cam.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 text-left font-semibold"
                              >
                                <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                                <span>Clear & Restore Camera</span>
                              </button>
                            ) : !isOffline ? (
                              <button
                                onClick={() => {
                                  triggerCameraObstruction(cam.id, 'lens_covered');
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 text-left"
                              >
                                <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                                <span>Simulate Obstruction (30s)</span>
                              </button>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Camera Modal */}
      {editingCamera && (
        <EditCameraModal 
          camera={editingCamera}
          onClose={() => setEditingCamera(null)}
          onSuccess={() => setEditingCamera(null)}
        />
      )}

      {/* Add Camera Modal */}
      {isAddModalOpen && (
        <AddCameraModal 
          onClose={() => setIsAddModalOpen(false)} 
        />
      )}

      {/* Delete Camera Confirmation Dialog */}
      {cameraToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Delete Camera</h3>
                <p className="text-xs text-zinc-500">{cameraToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 mb-5 leading-relaxed">
              Are you sure you want to delete this camera?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCameraToDelete(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCamera(cameraToDelete.id);
                  setCameraToDelete(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
