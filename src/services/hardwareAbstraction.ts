import { SecurityEvent, SecurityMode, Camera, Zone, SecuritySensor } from '../types';

export interface RawHardwarePayload {
  sourceType: 'camera' | 'sensor' | 'manual' | 'system';
  deviceId: string;
  deviceName?: string;
  eventType: string; // 'motion', 'person_detected', 'door_opened', 'tamper', 'loiter', 'package_drop'
  zone?: string;
  timestamp?: string;
  personType?: 'known' | 'unknown';
  personId?: string;
  personName?: string;
  snapshotUrl?: string;
  dwellTimeSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface HardwareAdapterConfig {
  userId: string;
  homeId: string;
  cameras: Camera[];
  zones: Zone[];
  sensors: SecuritySensor[];
  securityMode: SecurityMode;
}

/**
 * SecurityHardwareAdapter
 * Decouples raw hardware signals (cameras, ONVIF/RTSP streams, door sensors, motion detectors)
 * from the Sanjaya AI Brain, ensuring future physical IoT hardware can be plugged in seamlessly.
 */
export class SecurityHardwareAdapter {
  /**
   * Normalizes any raw hardware event or edge alert into the standard Sanjaya SecurityEvent schema.
   */
  static normalizeEvent(
    raw: RawHardwarePayload,
    config: HardwareAdapterConfig
  ): SecurityEvent {
    // 1. Resolve Camera or Sensor
    let resolvedName = raw.deviceName;
    let resolvedZoneName = raw.zone;
    let resolvedZoneId: string | undefined;

    if (raw.sourceType === 'camera') {
      const matchedCam = config.cameras.find(c => c.id === raw.deviceId);
      if (matchedCam) {
        resolvedName = matchedCam.name;
        resolvedZoneName = matchedCam.zone || matchedCam.location || resolvedZoneName;
      }
    } else if (raw.sourceType === 'sensor') {
      const matchedSensor = config.sensors.find(s => s.id === raw.deviceId);
      if (matchedSensor) {
        resolvedName = matchedSensor.name;
        resolvedZoneName = matchedSensor.zone || resolvedZoneName;
      }
    }

    // 2. Resolve Zone ID if zone name matched
    if (resolvedZoneName) {
      const matchedZone = config.zones.find(
        z => z.name.toLowerCase() === resolvedZoneName?.toLowerCase()
      );
      if (matchedZone) {
        resolvedZoneId = matchedZone.id;
      }
    }

    const eventId = `sec-evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    return {
      id: eventId,
      userId: config.userId,
      homeId: config.homeId,
      sourceType: raw.sourceType,
      sourceId: raw.deviceId,
      sourceName: resolvedName || 'Security Device',
      zoneId: resolvedZoneId,
      zoneName: resolvedZoneName || 'General Perimeter',
      timestamp: raw.timestamp || new Date().toISOString(),
      eventType: raw.eventType,
      personType: raw.personType,
      personId: raw.personId,
      personName: raw.personName,
      securityModeAtTime: config.securityMode,
      snapshotUrl: raw.snapshotUrl,
      dwellTimeSeconds: raw.dwellTimeSeconds,
      metadata: raw.metadata || {},
    };
  }
}
