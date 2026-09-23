import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Camera as CameraIcon, 
  Maximize, 
  Minimize, 
  Radio, 
  AlertTriangle,
  Sparkles,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  BellRing,
  CircleDot,
  ShieldAlert,
  EyeOff,
  WifiOff
} from 'lucide-react';
import { Camera } from '../../types';
import { useData } from '../../context/DataContext';

interface CameraPlayerProps {
  camera: Camera;
  onSnapshotTaken?: (dataUrl: string) => void;
  interactive?: boolean;
}

export const CameraPlayer: React.FC<CameraPlayerProps> = ({ 
  camera, 
  onSnapshotTaken,
  interactive = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { 
    detections, 
    activateSos, 
    triggerSimulatedUnknown, 
    triggerSimulatedKnown,
    toggleSiren,
    toggleSpotlight,
    toggleRecording,
    triggerCameraObstruction,
    clearCameraObstruction,
    restoreCameraFromTamper,
    forceConfirmTampering,
    updateCamera 
  } = useData();

  const [isMuted, setIsMuted] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolution, setResolution] = useState<'HD' | '4K'>('HD');
  const [simulatedPersonIndex, setSimulatedPersonIndex] = useState<number>(0);
  const [lastSnapshotMsg, setLastSnapshotMsg] = useState<string | null>(null);

  // Get most recent detection for this camera
  const latestDetection = detections.find(d => d.camera_id === camera.id);

  // Canvas drawing loop to simulate real camera video stream with moving noise, timecode, and visitor tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      t += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Dark porch background / night ambient lighting gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#101726');
      bgGradient.addColorStop(0.5, '#182234');
      bgGradient.addColorStop(1, '#0c1017');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Structural architectural lines (porch columns, front door, pathway)
      ctx.strokeStyle = '#233047';
      ctx.lineWidth = 1.5;

      // Doorframe
      ctx.strokeRect(width * 0.35, height * 0.15, width * 0.30, height * 0.85);

      // Porch steps
      ctx.beginPath();
      ctx.moveTo(width * 0.1, height * 0.85);
      ctx.lineTo(width * 0.9, height * 0.85);
      ctx.moveTo(width * 0.05, height * 0.95);
      ctx.lineTo(width * 0.95, height * 0.95);
      ctx.stroke();

      // Subtle warm doorway light
      const doorLight = ctx.createRadialGradient(
        width * 0.5, height * 0.35, 10,
        width * 0.5, height * 0.35, width * 0.4
      );
      doorLight.addColorStop(0, 'rgba(255, 230, 180, 0.15)');
      doorLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = doorLight;
      ctx.fillRect(width * 0.2, height * 0.1, width * 0.6, height * 0.8);

      // 3. Ambient motion / Visitor figure rendering
      // Oscillating visitor position
      const personX = width * 0.44 + Math.sin(t * 0.8) * 8;
      const personY = height * 0.26 + Math.cos(t * 0.8) * 3;
      const personW = width * 0.14;
      const personH = height * 0.52;

      // Draw silhouette figure of approaching person
      ctx.fillStyle = '#0f172a';
      // Head
      ctx.beginPath();
      ctx.arc(personX + personW / 2, personY + personH * 0.15, personW * 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Body / Torso
      ctx.beginPath();
      ctx.ellipse(personX + personW / 2, personY + personH * 0.55, personW * 0.5, personH * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. AI Edge Bounding Box Overlay
      const isKnown = latestDetection?.person_type === 'known';
      const boxColor = isKnown ? '#10b981' : '#f59e0b'; // Emerald if known, Amber if unknown

      ctx.save();
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(personX - 10, personY - 10, personW + 20, personH + 20);

      // Bounding box corner ticks
      ctx.lineWidth = 3;
      const tick = 12;
      // Top Left
      ctx.beginPath();
      ctx.moveTo(personX - 10, personY - 10 + tick);
      ctx.lineTo(personX - 10, personY - 10);
      ctx.lineTo(personX - 10 + tick, personY - 10);
      ctx.stroke();

      // Top Right
      ctx.beginPath();
      ctx.moveTo(personX + personW + 10 - tick, personY - 10);
      ctx.lineTo(personX + personW + 10, personY - 10);
      ctx.lineTo(personX + personW + 10, personY - 10 + tick);
      ctx.stroke();

      // Detection Tag Banner
      ctx.fillStyle = isKnown ? 'rgba(6, 78, 59, 0.85)' : 'rgba(120, 53, 15, 0.85)';
      ctx.fillRect(personX - 10, personY - 34, personW + 20, 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      const tagText = isKnown 
        ? `${latestDetection?.person_name || 'Known Person'} (96%)`
        : `Unknown Person (${latestDetection?.confidence ? Math.round(latestDetection.confidence * 100) : 91}%)`;
      ctx.fillText(tagText, personX - 4, personY - 18);
      ctx.restore();

      // 5. Digital CCTV scanline & subtle grain
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1.5);
      }

      // 6. Camera Obstruction / Covering visual field effect
      const isObstructed = camera.view_status === 'possible_obstruction';
      const isConfirmedTampered = camera.is_tampered || camera.view_status === 'obstructed_confirmed' || camera.status === 'tampered';

      if (isObstructed || isConfirmedTampered) {
        // Create dark occluding vignette/smudge layer covering lens
        const occlusionGrad = ctx.createRadialGradient(
          width * 0.45, height * 0.5, 40,
          width * 0.5, height * 0.5, width * 0.75
        );
        if (isConfirmedTampered) {
          occlusionGrad.addColorStop(0, 'rgba(18, 8, 8, 0.94)');
          occlusionGrad.addColorStop(0.5, 'rgba(32, 10, 10, 0.97)');
          occlusionGrad.addColorStop(1, 'rgba(6, 6, 6, 0.99)');
        } else {
          occlusionGrad.addColorStop(0, 'rgba(28, 22, 14, 0.88)');
          occlusionGrad.addColorStop(0.5, 'rgba(42, 30, 16, 0.94)');
          occlusionGrad.addColorStop(1, 'rgba(12, 10, 8, 0.98)');
        }
        ctx.fillStyle = occlusionGrad;
        ctx.fillRect(0, 0, width, height);

        // Simulated optical occlusion particle smudge texture
        ctx.fillStyle = isConfirmedTampered ? 'rgba(239, 68, 68, 0.07)' : 'rgba(245, 158, 11, 0.07)';
        for (let i = 0; i < 20; i++) {
          const bx = (Math.sin(i * 77 + t * 0.02) * 0.5 + 0.5) * width;
          const by = (Math.cos(i * 44 + t * 0.02) * 0.5 + 0.5) * height;
          const br = 45 + (i % 6) * 18;
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fill();
        }

        // HUD diagnostics text on stream
        ctx.fillStyle = isConfirmedTampered ? '#f87171' : '#fbbf24';
        ctx.font = 'bold 12px monospace';
        const statusHeader = isConfirmedTampered
          ? '● [ALERT] PHYSICAL TAMPERING CONFIRMED (> 30s PERSISTENT OCCLUSION)'
          : `● [SANJAYA VISION] VIEW OBSTRUCTION DETECTED (${camera.obstruction_verification?.remainingSeconds ?? 30}s VERIFICATION TIMER)`;
        ctx.fillText(statusHeader, 24, height - 52);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px monospace';
        const detailText = isConfirmedTampered
          ? 'Camera stream online · Continuous 30s lens blockage logged · Incident dispatched'
          : 'Transmitting video · Evaluating persistent optical obstruction vs transient motion';
        ctx.fillText(detailText, 24, height - 34);
      }

      // 7. Offline / Disconnected State Check
      // Camera Disconnected: video unavailable, NOT tampering!
      if (camera.status === 'offline') {
        ctx.fillStyle = '#0a0b10';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CAMERA DISCONNECTED / STREAM OFFLINE', width / 2, height / 2 - 10);
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#475569';
        ctx.fillText('Video signal unavailable · Disconnected cameras are not classified as tampered', width / 2, height / 2 + 16);
        ctx.textAlign = 'start';
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [latestDetection, camera]);

  // Current real-time clock timestamp
  const [timecode, setTimecode] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const hr = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      const se = String(d.getSeconds()).padStart(2, '0');
      setTimecode(`${yr}-${mo}-${da} ${hr}:${mi}:${se}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Snapshot capture handler
  const handleSnapshot = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    setLastSnapshotMsg('Snapshot saved to memory');
    setTimeout(() => setLastSnapshotMsg(null), 3000);
    if (onSnapshotTaken) {
      onSnapshotTaken(dataUrl);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col rounded-2xl border border-zinc-800/90 bg-[#0c0d10] overflow-hidden shadow-lg transition-all ${
        isFullscreen ? 'h-screen w-screen rounded-none' : 'w-full'
      }`}
    >
      {/* Top Overlay Bar matching Screen 2 & 3 */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </div>

          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            {camera.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {camera.is_simulation && (
            <span className="flex items-center gap-1 rounded-full bg-black/60 border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-zinc-400" />
              Simulation Mode
            </span>
          )}

          <button
            onClick={() => setResolution(resolution === 'HD' ? '4K' : 'HD')}
            className="rounded-lg bg-black/50 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-300 hover:text-white"
          >
            {resolution}
          </button>
        </div>
      </div>

      {/* Camera Obstruction Verification in Progress (30-second window) */}
      {camera.status !== 'offline' && camera.view_status === 'possible_obstruction' && camera.obstruction_verification && (
        <div className="absolute top-14 inset-x-3 sm:inset-x-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-950/95 border border-amber-500/80 p-3.5 text-white backdrop-blur-md shadow-2xl animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <EyeOff className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-amber-300">Checking Camera · Possible Obstruction</span>
                <span className="rounded-full bg-amber-500/30 border border-amber-400/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-200 animate-pulse">
                  Verifying: {camera.obstruction_verification.remainingSeconds}s
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 mt-0.5">
                Camera is connected & streaming, but lens view is obstructed. Continuously verifying for 30s before generating alert.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => clearCameraObstruction(camera.id)}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/80 px-3 py-1.5 text-xs font-bold text-white transition shadow-xs"
              title="Obstruction clears within 30s: returns to normal view, no alert created"
            >
              Clear Obstruction (Normal)
            </button>
            <button
              onClick={() => forceConfirmTampering(camera.id)}
              className="rounded-xl bg-amber-600/80 hover:bg-amber-500 border border-amber-400 px-2.5 py-1.5 text-xs font-bold text-white transition"
              title="Fast-forward full 30s window to confirm tampering immediately"
            >
              Fast-Forward 30s
            </button>
          </div>
        </div>
      )}

      {/* Confirmed Tampering / Persistent Obstruction Alert Banner */}
      {camera.status !== 'offline' && (camera.is_tampered || camera.view_status === 'obstructed_confirmed' || camera.status === 'tampered') && (
        <div className="absolute top-14 inset-x-3 sm:inset-x-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-red-950/95 border border-red-500 p-3.5 text-white backdrop-blur-md shadow-2xl animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-red-300">🚨 Camera Tampering Detected</span>
                <span className="rounded-full bg-red-800 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  Incident Logged
                </span>
              </div>
              <p className="text-[11px] text-red-200 mt-0.5">
                {camera.name} view remained blocked for 30 seconds while online. Please check camera physically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => restoreCameraFromTamper(camera.id)}
              className="rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 px-3.5 py-1.5 text-xs font-bold transition shadow-xs"
            >
              Clear & Restore Camera
            </button>
          </div>
        </div>
      )}

      {/* Disconnected Camera Banner (Offline State Check) */}
      {camera.status === 'offline' && (
        <div className="absolute top-14 inset-x-3 sm:inset-x-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-zinc-900/95 border border-zinc-700 p-3.5 text-white backdrop-blur-md shadow-2xl">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 shrink-0">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-zinc-200">Camera Disconnected</span>
                <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[9px] font-bold text-zinc-400 uppercase">
                  Offline
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Video stream unavailable. Connection lost or powered down. (Note: Disconnection is not classified as tampering).
              </p>
            </div>
          </div>
          <button
            onClick={() => updateCamera(camera.id, { status: 'online' })}
            className="rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1.5 text-xs font-bold transition shrink-0 self-end sm:self-auto"
          >
            Reconnect Camera
          </button>
        </div>
      )}

      {/* Snapshot feedback pill */}
      {lastSnapshotMsg && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-emerald-950/90 border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-300 shadow-lg animate-in fade-in">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          {lastSnapshotMsg}
        </div>
      )}

      {/* Canvas Live Stream */}
      <div className="relative aspect-video w-full bg-[#0c0d10] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="h-full w-full object-contain"
        />

        {/* Live HUD Timestamp bottom-left */}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex items-center gap-2 font-mono text-[10px] sm:text-xs text-zinc-300 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{timecode || '2026-09-17 13:01:47'}</span>
          <span className="text-zinc-400 hidden sm:inline">| {camera.location}</span>
          {camera.is_recording && (
            <span className="flex items-center gap-1 font-bold text-red-400 bg-red-950/80 px-1.5 py-0.2 rounded border border-red-800 ml-1">
              <CircleDot className="h-2.5 w-2.5 animate-pulse" />
              REC
            </span>
          )}
        </div>

        {/* Siren Active Indicator Banner */}
        {camera.siren_active && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xl animate-pulse">
            <BellRing className="h-4 w-4" />
            <span>Deterrent Siren Active (85dB)</span>
          </div>
        )}

        {/* Spotlight Active Indicator */}
        {camera.spotlight_active && (
          <div className="absolute top-12 right-4 z-20 flex items-center gap-1.5 rounded-full bg-amber-400/90 text-zinc-950 px-2.5 py-1 text-[11px] font-bold shadow-lg">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Spotlight ON</span>
          </div>
        )}

        {/* Two-Way Audio Indicator Banner */}
        {isTalking && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 rounded-2xl bg-zinc-900/90 border border-white/20 p-4 shadow-2xl backdrop-blur-md animate-pulse">
            <Mic className="h-7 w-7 text-white" />
            <div className="text-xs font-bold text-white">Two-Way Talk Active</div>
            <div className="text-[11px] text-zinc-400">Front Door Audio Streaming</div>
          </div>
        )}
      </div>

      {/* Interactive Bottom Control Toolbar matching Screen 3 */}
      {interactive && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 bg-[#121316] px-3 py-2 sm:px-6">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Talk Button */}
            <button
              onClick={() => setIsTalking(!isTalking)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
                isTalking
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {isTalking ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5 text-zinc-400" />}
              <span>{isTalking ? 'Speaking...' : 'Talk'}</span>
            </button>

            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
              title={isMuted ? 'Unmute camera audio' : 'Mute camera audio'}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-zinc-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
            </button>

            {/* Snapshot Button */}
            <button
              onClick={handleSnapshot}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
              title="Capture snapshot"
            >
              <CameraIcon className="h-3.5 w-3.5 text-zinc-300" />
              <span className="hidden md:inline">Snapshot</span>
            </button>

            {/* Spotlight Deterrent Toggle */}
            <button
              onClick={() => toggleSpotlight(camera.id)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
                camera.spotlight_active
                  ? 'bg-amber-400 text-zinc-950 shadow-xs'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
              title="Toggle entrance spotlight"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Light</span>
            </button>

            {/* Siren Deterrent Toggle */}
            <button
              onClick={() => toggleSiren(camera.id)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
                camera.siren_active
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
              title="Trigger deterrent siren"
            >
              <BellRing className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Siren</span>
            </button>

            {/* Manual Clip Record Toggle */}
            <button
              onClick={() => toggleRecording(camera.id)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
                camera.is_recording
                  ? 'bg-red-950 border border-red-500 text-red-200'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
              title="Record manual clip"
            >
              <CircleDot className={`h-3.5 w-3.5 ${camera.is_recording ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`} />
              <span className="hidden md:inline">{camera.is_recording ? 'Recording' : 'Record'}</span>
            </button>

            {/* Obstruction / Tamper Test Action */}
            {camera.status !== 'offline' && (
              camera.view_status === 'possible_obstruction' ? (
                <button
                  onClick={() => clearCameraObstruction(camera.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-800 border border-emerald-500/80 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-700 transition"
                  title="Test Obstruction Disappearing within 30s (Returns to normal, no alert)"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Clear Obstruction</span>
                </button>
              ) : camera.status === 'tampered' || camera.view_status === 'obstructed_confirmed' || camera.is_tampered ? (
                <button
                  onClick={() => restoreCameraFromTamper(camera.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-red-900 border border-red-500 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-800 transition"
                  title="Restore camera to normal online operation"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Restore Feed</span>
                </button>
              ) : (
                <button
                  onClick={() => triggerCameraObstruction(camera.id, 'lens_covered')}
                  className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                  title="Simulate lens obstruction / covering (starts 30s verification timer)"
                >
                  <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden md:inline">Cover Lens (30s)</span>
                </button>
              )
            )}

            {/* Connection Toggle (Online vs Offline check) */}
            <button
              onClick={() => updateCamera(camera.id, { status: camera.status === 'offline' ? 'online' : 'offline' })}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
                camera.status === 'offline'
                  ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
              title={camera.status === 'offline' ? 'Reconnect camera' : 'Simulate disconnect (Note: Disconnection is not tampering)'}
            >
              <WifiOff className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{camera.status === 'offline' ? 'Reconnect' : 'Disconnect'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* In-view SOS Trigger */}
            <button
              onClick={() => activateSos()}
              className="flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition active:scale-95 shadow-sm"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>SOS</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="rounded-xl border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
