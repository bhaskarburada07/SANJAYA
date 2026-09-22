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
  Edit3
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AddCameraModal } from '../modals/AddCameraModal';
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
    deleteCamera 
  } = useData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
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
            const isOnline = cam.status === 'online';
            const isSelected = cam.id === activeCamera.id;

            return (
              <div
                key={cam.id}
                className={`relative flex flex-col rounded-3xl border bg-white overflow-hidden shadow-xs transition ${
                  isSelected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {/* Simulated Camera Preview Thumbnail */}
                <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {isOnline ? (
                    <div className="flex flex-col items-center gap-1 text-zinc-400">
                      <Radio className="h-7 w-7 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-zinc-400">RTSP Stream Active</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-600">
                      <AlertCircle className="h-7 w-7" />
                      <span className="text-[10px] font-mono text-zinc-500">Camera Offline</span>
                    </div>
                  )}

                  {/* Badges on preview */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-800 shadow-xs">
                    <span
                      className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    />
                    <span>{isOnline ? 'Online' : 'Offline'}</span>
                  </div>

                  {cam.is_simulation && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-zinc-800/80 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-medium text-zinc-200 backdrop-blur-xs">
                      <Sparkles className="h-3 w-3 text-zinc-300" />
                      Simulation
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-zinc-300">
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
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === cam.id && (
                        <div className="absolute right-0 mt-1 w-44 rounded-2xl border border-zinc-200 bg-white p-1 shadow-lg z-20">
                          <button
                            onClick={() => {
                              setEditingCamera(cam);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 text-left"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                            <span>Edit Camera</span>
                          </button>

                          <button
                            onClick={() => {
                              toggleCameraStatus(cam.id, cam.status);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 text-left"
                          >
                            <Power className="h-3.5 w-3.5 text-zinc-500" />
                            <span>{isOnline ? 'Disable Camera' : 'Enable Camera'}</span>
                          </button>

                          <button
                            onClick={() => {
                              deleteCamera(cam.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 text-left"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove Camera</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Camera Modal */}
      {(isAddModalOpen || editingCamera) && (
        <AddCameraModal 
          cameraToEdit={editingCamera}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingCamera(null);
          }} 
        />
      )}
    </div>
  );
};
