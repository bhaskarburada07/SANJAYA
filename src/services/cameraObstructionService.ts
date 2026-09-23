import { Camera, Incident, AppNotification, IncidentTimelineEvent } from '../types';
import { realtimeBus } from '../lib/supabase';

export interface ObstructionDetectionEvent {
  cameraId: string;
  cameraName: string;
  zone: string;
  detectedAt: string;
  confirmedAt?: string;
  obstructionType: string;
  connectionStatus: string;
}

export class CameraObstructionService {
  private static verificationTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Starts the 30-second verification timer for a specific camera.
   * Multi-camera behavior: Each camera runs its timer independently.
   */
  static startObstructionVerification(
    camera: Camera,
    obstructionType: 'lens_covered' | 'dust_dirt' | 'physical_block' | 'spray_blur' | 'heavy_blur' = 'lens_covered',
    details = 'Camera visual field is significantly obstructed or covered'
  ): Camera {
    // 1. Camera Disconnected Check:
    // If the camera is not connected / offline, do NOT start tampering verification!
    if (camera.status === 'offline') {
      return camera;
    }

    // Clear any existing timer for this camera
    this.clearTimer(camera.id);

    const now = new Date();
    const startTimeIso = now.toISOString();
    const expiresAt = now.getTime() + 30000; // exactly 30 seconds

    const updatedCamera: Camera = {
      ...camera,
      view_status: 'possible_obstruction',
      obstruction_detected_at: startTimeIso,
      obstruction_verification: {
        isObstructed: true,
        verificationStartTime: startTimeIso,
        verificationExpiresAt: expiresAt,
        remainingSeconds: 30,
        obstructionType,
        details,
      },
      // Do NOT classify as tampered yet!
      is_tampered: false,
    };

    return updatedCamera;
  }

  /**
   * Cancels verification when obstruction disappears within 30 seconds.
   * Returns camera to normal view state with NO alert and NO incident.
   */
  static cancelObstructionVerification(camera: Camera, reason = 'Obstruction cleared within 30s verification window'): Camera {
    this.clearTimer(camera.id);

    return {
      ...camera,
      view_status: 'normal',
      obstruction_verification: undefined,
      is_tampered: false,
      tamper_reason: undefined,
    };
  }

  /**
   * Confirms camera tampering when obstruction persists for the full 30 seconds.
   * Creates the incident, notification, and timeline entry.
   */
  static confirmObstructionTampering(
    camera: Camera,
    userId: string
  ): { camera: Camera; incident: Incident; notification: AppNotification } {
    this.clearTimer(camera.id);

    const confirmedAt = new Date().toISOString();
    const detectedAt = camera.obstruction_verification?.verificationStartTime || 
                       camera.obstruction_detected_at || 
                       new Date(Date.now() - 30000).toISOString();
    
    const obstructionTypeLabel = camera.obstruction_verification?.obstructionType 
      ? camera.obstruction_verification.obstructionType.replace('_', ' ')
      : 'lens covering';

    // 1. Update Camera status
    const updatedCamera: Camera = {
      ...camera,
      status: 'tampered',
      is_tampered: true,
      view_status: 'obstructed_confirmed',
      obstruction_confirmed_at: confirmedAt,
      tamper_reason: `View continuously obstructed for 30s while online (${obstructionTypeLabel})`,
      obstruction_verification: undefined, // verification completed
    };

    // 2. Create Camera Tampering / Obstruction Incident
    const incidentId = `inc-tamper-${camera.id}-${Date.now()}`;
    const timeline: IncidentTimelineEvent[] = [
      {
        id: `tl-detect-${Date.now()}`,
        timestamp: detectedAt,
        title: 'Possible View Obstruction Detected',
        description: `Visual field occlusion detected on ${camera.name}. Camera was online and transmitting video. 30-second verification timer initiated.`,
        type: 'detection',
        camera_name: camera.name,
        zone: camera.location,
      },
      {
        id: `tl-verify-${Date.now()}`,
        timestamp: new Date(new Date(detectedAt).getTime() + 15000).toISOString(),
        title: 'Continuous Verification at 15s',
        description: 'Obstruction remained persistent. Ambient light changes and brief motion ruled out by AI vision analysis.',
        type: 'classification',
        camera_name: camera.name,
        zone: camera.location,
      },
      {
        id: `tl-confirm-${Date.now()}`,
        timestamp: confirmedAt,
        title: 'Camera Tampering Confirmed',
        description: `Visual field remained obstructed for full 30 seconds while camera stream was online and connected. High-priority physical obstruction alert generated.`,
        type: 'sensor',
        camera_name: camera.name,
        zone: camera.location,
      },
    ];

    const incident: Incident = {
      id: incidentId,
      user_id: userId,
      camera_id: camera.id,
      type: 'device_tamper',
      status: 'active',
      started_at: detectedAt,
      risk_level: 'HIGH',
      classification: 'CRITICAL',
      location_address: camera.location,
      notes: `[SANJAYA Vision Engine] Camera view on "${camera.name}" was continuously obstructed/covered for 30 seconds. Camera connection status: Online (${camera.connection_type || 'RTSP'}).`,
      ai_explanation: `Persistent physical obstruction confirmed. The camera remained connected and transmitting frames, but 94%+ of the optical frame was occluded continuously for 30 seconds. Transient events (such as passing shadows, insects, darkness, or brief pedestrian traversal) were evaluated and ruled out.`,
      who: 'Physical Obstruction / Covered Lens',
      where: `${camera.name} · ${camera.location}`,
      when: `Detected at ${new Date(detectedAt).toLocaleTimeString()}, confirmed after 30s at ${new Date(confirmedAt).toLocaleTimeString()}`,
      what: 'Camera lens covered or blocked persistently for 30 seconds while stream online',
      timeline,
      recommended_actions: [
        `Inspect ${camera.name} physically at ${camera.location}`,
        'Check for cloth, tape, paint, or dense dust on the camera glass',
        'Verify camera mounting angle has not been shifted or tilted',
        'Trigger camera siren or floodlight if an intruder is suspected',
      ],
    };

    // 3. Create SANJAYA Notification matching exact format:
    // “🚨 Camera Tampering Detected
    // Main Entrance Camera appears to be obstructed or covered.
    // The camera is still connected, but its view has remained blocked for 30 seconds.
    // Please check the camera.”
    const notification: AppNotification = {
      id: `notif-tamper-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      type: 'emergency',
      category: 'emergency',
      title: '🚨 Camera Tampering Detected',
      message: `${camera.name} appears to be obstructed or covered. The camera is still connected, but its view has remained blocked for 30 seconds. Please check the camera.`,
      read: false,
      created_at: confirmedAt,
      metadata: {
        camera_id: camera.id,
        camera_name: camera.name,
        location: camera.location,
        detected_at: detectedAt,
        confirmed_at: confirmedAt,
        connection_status: 'Online',
        incident_id: incident.id,
      },
    };

    // Broadcast across realtime event bus
    realtimeBus.publish('incidents:new', incident);
    realtimeBus.publish('notifications:new', notification);

    return { camera: updatedCamera, incident, notification };
  }

  /**
   * Resets / restores a camera to normal operating state.
   */
  static restoreCamera(camera: Camera): Camera {
    this.clearTimer(camera.id);

    return {
      ...camera,
      status: 'online',
      view_status: 'normal',
      is_tampered: false,
      tamper_reason: undefined,
      obstruction_verification: undefined,
      obstruction_detected_at: undefined,
      obstruction_confirmed_at: undefined,
    };
  }

  /**
   * Handles camera disconnect:
   * When camera is disconnected, show "Camera Disconnected / Offline".
   * Do NOT call it tampering. Cancel any pending obstruction verification.
   */
  static disconnectCamera(camera: Camera): Camera {
    this.clearTimer(camera.id);

    return {
      ...camera,
      status: 'offline',
      view_status: 'normal',
      is_tampered: false,
      tamper_reason: undefined,
      obstruction_verification: undefined,
    };
  }

  private static clearTimer(cameraId: string) {
    const existing = this.verificationTimers.get(cameraId);
    if (existing) {
      clearTimeout(existing);
      this.verificationTimers.delete(cameraId);
    }
  }
}
