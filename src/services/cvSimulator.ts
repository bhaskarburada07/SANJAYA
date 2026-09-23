import { Detection, Incident, AppNotification, TrustedPerson, SecurityMode, Zone, Camera } from '../types';
import { realtimeBus } from '../lib/supabase';
import { playDoorbellChime, playUnknownAlertTone } from '../utils/audio';
import { IntelligenceEngine } from './intelligenceEngine';
import { SanjayaDecisionSystem, PREDEFINED_SCENARIOS } from './decisionSystem';


// Curated realistic snapshots for simulated video feeds
const UNKNOWN_SNAPSHOTS = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
];

const DELIVERY_SNAPSHOTS = [
  'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=600&q=80',
];

export interface SimulationOptions {
  cameraId?: string;
  cameraName?: string;
  zone?: string;
  securityMode?: SecurityMode;
  dwellTimeSeconds?: number;
  behaviourTags?: string[];
}

export class CVSimulatorService {
  /**
   * Generates a simulated 'known' person detection
   */
  static generateKnownDetection(
    person: TrustedPerson,
    options: SimulationOptions = {}
  ): { detection: Detection; notification: AppNotification } {
    const zoneName = options.zone || 'Main Entrance';
    const cameraId = options.cameraId || 'cam-1';
    const cameraName = options.cameraName || 'Main Entrance Doorbell';
    const now = new Date();

    const detection: Detection = {
      id: `det-${Date.now()}`,
      camera_id: cameraId,
      camera_name: cameraName,
      user_id: person.user_id,
      person_type: 'known',
      person_name: person.name,
      category: 'person',
      confidence: Number((0.93 + Math.random() * 0.06).toFixed(2)),
      zone: zoneName,
      snapshot_url: person.photo_url || UNKNOWN_SNAPSHOTS[0],
      detected_at: now.toISOString(),
      dwell_time_seconds: 18,
      risk_level: 'LOW',
      bounding_box: {
        x: Number((0.35 + Math.random() * 0.08).toFixed(2)),
        y: 0.20,
        width: 0.25,
        height: 0.62,
      },
      notes: `[Intelligence Engine] Verified face match with enrolled trusted person "${person.name}" (${person.relationship}). Allowed in ${zoneName}.`,
    };

    const notification: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: person.user_id,
      type: 'security',
      category: 'security',
      title: `Known person: ${person.name}`,
      message: `${person.name} (${person.relationship}) verified at ${zoneName}. Normal baseline routine.`,
      read: false,
      created_at: now.toISOString(),
      metadata: { detection_id: detection.id, person_name: person.name, zone: zoneName },
    };

    // Broadcast through realtime bus
    realtimeBus.publish('detections:new', detection);
    realtimeBus.publish('notifications:new', notification);

    return { detection, notification };
  }

  /**
   * Generates a simulated 'unknown' person detection evaluated by IntelligenceEngine
   */
  static generateUnknownDetection(
    userId: string,
    options: SimulationOptions = {},
    playAudio = true
  ): { detection: Detection; incident: Incident; notification: AppNotification } {
    const zoneName = options.zone || 'Main Entrance';
    const cameraId = options.cameraId || 'cam-1';
    const cameraName = options.cameraName || 'Main Entrance Doorbell';
    const securityMode = options.securityMode || 'home';
    const dwellSeconds = options.dwellTimeSeconds || 45;
    const now = new Date();
    const snapshot = UNKNOWN_SNAPSHOTS[Math.floor(Math.random() * UNKNOWN_SNAPSHOTS.length)];
    const confidence = Number((0.88 + Math.random() * 0.08).toFixed(2));

    const mockZone: Zone = {
      id: 'zone-1',
      name: zoneName,
      type: zoneName.toLowerCase().includes('backyard') ? 'backyard' : 'entrance',
      sensitivity: 'high',
      privacy_level: 'standard',
      is_monitored: true,
      camera_ids: [cameraId],
      sensor_ids: [],
    };

    const mockCamera: Camera = {
      id: cameraId,
      user_id: userId,
      name: cameraName,
      location: zoneName,
      status: 'online',
      is_simulation: true,
      created_at: now.toISOString(),
    };

    const evalResult = IntelligenceEngine.evaluate({
      personType: 'unknown',
      zone: mockZone,
      camera: mockCamera,
      securityMode,
      dwellTimeSeconds: dwellSeconds,
      behaviourTags: options.behaviourTags || ['approaching', 'loitering'],
    });

    const entropy = Math.random().toString(36).substring(2, 6);
    const detection: Detection = {
      id: `det-${Date.now()}-${entropy}`,
      camera_id: cameraId,
      camera_name: cameraName,
      user_id: userId,
      person_type: 'unknown',
      category: 'person',
      confidence,
      zone: zoneName,
      dwell_time_seconds: dwellSeconds,
      risk_level: evalResult.risk_level,
      snapshot_url: snapshot,
      detected_at: now.toISOString(),
      bounding_box: {
        x: Number((0.32 + Math.random() * 0.12).toFixed(2)),
        y: 0.18,
        width: 0.28,
        height: 0.65,
      },
      notes: `Unrecognized visitor at ${zoneName}. Risk calculated: ${evalResult.risk_level}.`,
    };

    const incident: Incident = {
      id: `inc-${Date.now()}-${entropy}`,
      user_id: userId,
      detection_id: detection.id,
      detection,
      type: 'unknown_detection',
      status: 'active',
      latitude: 12.9716,
      longitude: 77.5946,
      location_address: 'Villa 42, Palm Meadows, Whitefield, Bengaluru',
      started_at: now.toISOString(),
      risk_level: evalResult.risk_level,
      classification: evalResult.classification,
      risk_factors: evalResult.risk_factors,
      ai_explanation: evalResult.ai_explanation,
      who: `Unknown Person (Temporary ID #${Math.floor(10 + Math.random() * 89)})`,
      where: `${zoneName} · Porch`,
      when: 'Just now',
      what: `Visitor observed approaching and dwelling near ${zoneName}`,
      dwell_time_seconds: dwellSeconds,
      home_mode_at_time: securityMode,
      recommended_actions: evalResult.recommended_actions,
      behaviour_sequence: evalResult.behaviour_sequence,
      camera_path: evalResult.camera_path,
      sensors_triggered: ['PIR Motion Detector', cameraName],
      notes: evalResult.ai_explanation,
      timeline: [
        {
          id: `tl-${Date.now()}-${entropy}-1`,
          timestamp: now.toISOString(),
          title: 'Person detected',
          description: `PIR sensor & AI neural vision detected human figure at ${zoneName}`,
          type: 'detection',
          camera_name: cameraName,
          zone: zoneName,
        },
        {
          id: `tl-${Date.now()}-${entropy}-2`,
          timestamp: new Date(now.getTime() + 1000).toISOString(),
          title: 'Classified as unknown',
          description: `Face embeddings did not match trusted registry (Confidence: ${(confidence * 100).toFixed(0)}%)`,
          type: 'classification',
          camera_name: cameraName,
          zone: zoneName,
        },
        {
          id: `tl-${Date.now()}-${entropy}-3`,
          timestamp: new Date(now.getTime() + 1500).toISOString(),
          title: `Contextual risk evaluated: ${evalResult.risk_level}`,
          description: `Evaluated ${dwellSeconds}s dwell time, mode=${securityMode.toUpperCase()}, zone sensitivity=HIGH`,
          type: 'classification',
        },
      ],
    };

    const isHighOrCritical = evalResult.risk_level === 'HIGH' || evalResult.risk_level === 'CRITICAL';
    const isWarnOrAbove = evalResult.decision === 'WARN' || evalResult.decision === 'ESCALATE' || evalResult.decision === 'EMERGENCY_RESPONSE';

    const notification: AppNotification = {
      id: `notif-${Date.now()}-${entropy}`,
      user_id: userId,
      type: 'security',
      category: 'security',
      title: evalResult.decision === 'OBSERVE'
        ? `Visitor Observed at ${zoneName}`
        : evalResult.decision === 'INFORM'
        ? `Visitor Activity: ${zoneName}`
        : `Unknown Person (${evalResult.risk_level} Risk)`,
      message: evalResult.ai_explanation,
      read: false,
      created_at: now.toISOString(),
      metadata: { detection_id: detection.id, incident_id: incident.id, zone: zoneName, risk_level: evalResult.risk_level },
    };

    if (playAudio && isWarnOrAbove) {
      playUnknownAlertTone();
    }

    // Broadcast according to decision level
    realtimeBus.publish('detections:new', detection);

    if (isWarnOrAbove) {
      realtimeBus.publish('incidents:new', incident);
      realtimeBus.publish('notifications:new', notification);
      realtimeBus.publish('alert:unknown', { detection, incident });
    } else if (evalResult.decision === 'INFORM') {
      realtimeBus.publish('notifications:new', notification);
    }
    // For 'OBSERVE': silent observation, no disruptive alert modal

    return { detection, incident, notification };
  }


  /**
   * Generates a package delivery detection
   */
  static generatePackageDelivery(
    userId: string,
    options: SimulationOptions = {}
  ): { detection: Detection; incident: Incident; notification: AppNotification } {
    const zoneName = options.zone || 'Main Entrance';
    const cameraId = options.cameraId || 'cam-1';
    const cameraName = options.cameraName || 'Main Entrance Doorbell';
    const now = new Date();
    const snapshot = DELIVERY_SNAPSHOTS[Math.floor(Math.random() * DELIVERY_SNAPSHOTS.length)];

    const entropy = Math.random().toString(36).substring(2, 6);
    const detection: Detection = {
      id: `det-${Date.now()}-${entropy}`,
      camera_id: cameraId,
      camera_name: cameraName,
      user_id: userId,
      person_type: 'unknown',
      category: 'package',
      confidence: 0.94,
      zone: zoneName,
      dwell_time_seconds: 15,
      risk_level: 'LOW',
      snapshot_url: snapshot,
      detected_at: now.toISOString(),
      bounding_box: { x: 0.35, y: 0.25, width: 0.30, height: 0.55 },
      notes: 'Courier arrived, deposited parcel at porch box, and departed within 15 seconds.',
    };

    const incident: Incident = {
      id: `inc-${Date.now()}-${entropy}`,
      user_id: userId,
      detection_id: detection.id,
      detection,
      type: 'unknown_detection',
      status: 'active',
      latitude: 12.9716,
      longitude: 77.5946,
      location_address: 'Villa 42, Palm Meadows, Whitefield, Bengaluru',
      started_at: now.toISOString(),
      risk_level: 'LOW',
      classification: 'IMPORTANT',
      risk_factors: ['Delivery uniform detected', 'Parcel dropoff motion', 'Quick departure (<20s)'],
      ai_explanation: 'Delivery personnel dropped off a parcel at your front porch. Dwell time 15 seconds. No threat indicators.',
      who: 'Courier / Delivery Service',
      where: `${zoneName} · Porch Drop Box`,
      when: 'Just now',
      what: 'Package safely delivered and verified by AI parcel detection',
      dwell_time_seconds: 15,
      recommended_actions: ['Retrieve package when convenient', 'Verify parcel delivery on door camera'],
      timeline: [
        {
          id: `tl-${Date.now()}-${entropy}-1`,
          timestamp: now.toISOString(),
          title: 'Delivery courier detected',
          description: 'AI neural model classified parcel delivery box at Main Entrance',
          type: 'detection',
        },
      ],
    };

    const notification: AppNotification = {
      id: `notif-${Date.now()}-${entropy}`,
      user_id: userId,
      type: 'security',
      category: 'security',
      title: '📦 Package Delivered',
      message: `Parcel delivered at ${zoneName}. Courier safely departed.`,
      read: false,
      created_at: now.toISOString(),
      metadata: { detection_id: detection.id, incident_id: incident.id },
    };

    realtimeBus.publish('detections:new', detection);
    realtimeBus.publish('incidents:new', incident);
    realtimeBus.publish('notifications:new', notification);

    return { detection, incident, notification };
  }

  /**
   * Ring doorbell chime
   */
  static triggerDoorbell(zone = 'Main Entrance') {
    playDoorbellChime();
    const entropy = Math.random().toString(36).substring(2, 6);
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${entropy}`,
      user_id: 'usr-bhaskar-101',
      type: 'system',
      category: 'system',
      title: 'Doorbell Rang',
      message: `Front door chime pressed at ${zone}.`,
      read: false,
      created_at: new Date().toISOString(),
    };
    realtimeBus.publish('notifications:new', notif);
  }

  /**
   * Runs an end-to-end predefined Scenario (A, B, C, D, E, F)
   */
  static runPredefinedScenario(
    scenarioCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
    userId: string,
    homeId: string,
    ctx: {
      cameras: Camera[];
      zones: Zone[];
      trustedPeople: TrustedPerson[];
      sensors: any[];
    }
  ) {
    const scenario = PREDEFINED_SCENARIOS.find(s => s.code === scenarioCode);
    if (!scenario) return null;

    const observationInput = scenario.inputGenerator(ctx);
    const result = SanjayaDecisionSystem.processObservation(userId, homeId, observationInput, {
      playAudio: true,
    });

    if (result.detection) {
      realtimeBus.publish('detections:new', result.detection);
    }
    if (result.incident && (result.execution.decision.decision === 'WARN' || result.execution.decision.decision === 'ESCALATE' || result.execution.decision.decision === 'EMERGENCY_RESPONSE')) {
      realtimeBus.publish('alert:unknown', { detection: result.detection!, incident: result.incident });
    }

    return result;
  }
}

