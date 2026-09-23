import { 
  Camera, 
  Zone, 
  TrustedPerson, 
  SecurityMode, 
  SecuritySensor, 
  Incident, 
  MultiSourceContext, 
  BehaviourContext, 
  SensorFusionContext,
  MovementType 
} from '../../types';

export interface RawObservationInput {
  personType?: 'known' | 'unknown';
  personId?: string;
  personName?: string;
  confidence?: number;
  camera: Camera;
  zone: Zone;
  securityMode: SecurityMode;
  dwellTimeSeconds?: number;
  movement?: MovementType;
  behaviourTags?: string[];
  doorInteraction?: boolean;
  windowInteraction?: boolean;
  restrictedZoneEntry?: boolean;
  repeatedApproachesCount?: number;
  hour?: number;
  sensors?: SecuritySensor[];
  trustedPeople?: TrustedPerson[];
  incidents?: Incident[];
  category?: 'person' | 'vehicle' | 'package' | 'pet' | 'loitering';
  isSingleFrame?: boolean;
  crossCameraTrackId?: string;
}

export class ContextEngine {
  /**
   * Builds an enriched MultiSourceContext aggregating identity, behaviour, 
   * environment, temporal, sensor fusion, and cross-camera signals.
   *
   * CORE PRINCIPLE:
   * UNKNOWN PERSON DOES NOT EQUAL THREAT.
   * Collects all observations before risk calculation.
   */
  static evaluateContext(input: RawObservationInput): MultiSourceContext {
    const now = new Date();
    const currentHour = input.hour ?? now.getHours();
    const isNight = currentHour >= 22 || currentHour < 6;
    const period: 'morning' | 'day' | 'evening' | 'late_night' = 
      isNight ? 'late_night' :
      currentHour >= 18 ? 'evening' :
      currentHour >= 12 ? 'day' : 'morning';

    // 1. Identity Context
    // First query Trusted People database
    let isKnown = false;
    let matchedPerson: TrustedPerson | undefined;
    const confidence = input.confidence ?? 0.92;

    if (input.trustedPeople && input.trustedPeople.length > 0) {
      if (input.personId) {
        matchedPerson = input.trustedPeople.find(p => p.id === input.personId);
      }
      if (!matchedPerson && input.personName) {
        matchedPerson = input.trustedPeople.find(
          p => p.name.toLowerCase() === input.personName?.toLowerCase()
        );
      }
    }

    if (matchedPerson || input.personType === 'known') {
      isKnown = true;
    }

    // 2. Camera & Zone Context
    const camera = {
      id: input.camera.id,
      name: input.camera.name,
      location: input.camera.location,
      status: input.camera.status,
      isSimulation: input.camera.is_simulation,
    };

    const isRestrictedZone = 
      input.zone.type === 'bedroom' || 
      input.zone.type === 'backyard' || 
      input.zone.sensitivity === 'high';

    const zone = {
      id: input.zone.id,
      name: input.zone.name,
      sensitivity: input.zone.sensitivity,
      type: input.zone.type,
      isMonitored: input.zone.is_monitored,
    };

    // 3. Security Mode Context & Homeowner Status
    const securityMode = input.securityMode || 'home';
    const homeownerStatus: 'home' | 'away' = 
      securityMode === 'away' ? 'away' : 'home';

    // 4. Movement & Behaviour Analysis
    const dwellSeconds = Math.max(0, input.dwellTimeSeconds ?? 25);
    const tags = input.behaviourTags || [];

    // Infer movement if not provided
    let movement: MovementType = input.movement || 'approaching';
    if (tags.includes('walking_past') || tags.includes('passerby')) {
      movement = 'walking_past';
    } else if (tags.includes('leaving') || tags.includes('departing')) {
      movement = 'leaving';
    } else if (tags.includes('returning') || (input.repeatedApproachesCount && input.repeatedApproachesCount > 1)) {
      movement = 'returning';
    } else if (tags.includes('waiting')) {
      movement = 'waiting';
    } else if (tags.includes('pacing')) {
      movement = 'pacing';
    } else if (dwellSeconds > 90 || tags.includes('loitering')) {
      movement = 'loitering';
    }

    const hasDoorInteraction = 
      input.doorInteraction === true ||
      tags.includes('touches_handle') ||
      tags.includes('attempting_door') ||
      tags.includes('knocking') ||
      tags.includes('door_interaction');

    const hasWindowInteraction = 
      input.windowInteraction === true ||
      tags.includes('looking_into_windows') ||
      tags.includes('window_interaction');

    const hasRestrictedZoneEntry = 
      input.restrictedZoneEntry === true || 
      (isRestrictedZone && !isKnown);

    const isAbnormalBehaviour = 
      hasDoorInteraction && securityMode === 'away' ||
      hasWindowInteraction ||
      (movement === 'loitering' && dwellSeconds > 120) ||
      (input.repeatedApproachesCount ?? 0) >= 3;

    const behaviour: BehaviourContext = {
      movement,
      dwellTimeSeconds: dwellSeconds,
      doorInteraction: hasDoorInteraction,
      windowInteraction: hasWindowInteraction,
      restrictedZoneEntry: hasRestrictedZoneEntry,
      repeatedApproachesCount: input.repeatedApproachesCount ?? (movement === 'returning' ? 2 : 1),
      isNightActivity: isNight,
      isAbnormal: isAbnormalBehaviour,
      tags,
    };

    // 5. Multi-Sensor Fusion
    // Correlate PIR motion sensors, door sensors, and camera status
    let pirMotionActive = true;
    let doorSensorState: SensorFusionContext['doorSensorState'] = 'closed';
    let windowSensorState: SensorFusionContext['windowSensorState'] = 'closed';
    const otherSensorsTriggered: string[] = [];

    if (input.sensors && input.sensors.length > 0) {
      input.sensors.forEach((s) => {
        const matchesZone = 
          s.zone === input.zone.name || 
          s.zone === input.zone.id || 
          s.name.toLowerCase().includes(input.zone.name.toLowerCase());

        if (matchesZone) {
          if (s.type === 'door_window' || s.type === 'smart_lock') {
            const isWindow = s.name.toLowerCase().includes('window');
            if (s.status === 'open' || s.status === 'triggered') {
              if (isWindow) {
                windowSensorState = 'open';
              } else {
                doorSensorState = 'open';
              }
              otherSensorsTriggered.push(`${s.name} (OPEN)`);
            } else if (s.status === 'tampered') {
              if (isWindow) {
                windowSensorState = 'tamper';
              } else {
                doorSensorState = 'tamper';
              }
              otherSensorsTriggered.push(`${s.name} (TAMPER)`);
            }
          } else if (s.type === 'pir_motion' || s.type === 'radar_mmwave') {
            if (s.status === 'triggered') {
              pirMotionActive = true;
              otherSensorsTriggered.push(`${s.name} (Motion Active)`);
            }
          }
        }
      });
    }

    // Camera hardware health status
    let cameraHealthStatus: SensorFusionContext['cameraHealthStatus'] = 'online';
    if (input.camera.status === 'offline') cameraHealthStatus = 'offline';
    else if (input.camera.status === 'tampered' || input.camera.is_tampered) cameraHealthStatus = 'tampered';
    else if (input.camera.view_status && input.camera.view_status !== 'normal') cameraHealthStatus = 'obstructed';

    const sensorFusion: SensorFusionContext = {
      pirMotionActive,
      doorSensorState,
      windowSensorState,
      cameraHealthStatus,
      otherSensorsTriggered,
      crossCameraTrackId: input.crossCameraTrackId || `track-${input.camera.id}-${now.getTime()}`,
    };

    // 6. Cross-Camera Path Tracking
    const crossCameraPath = [
      {
        cameraId: input.camera.id,
        cameraName: input.camera.name,
        zoneName: input.zone.name,
        timestamp: now.toISOString(),
        dwellSeconds,
      },
    ];

    // 7. History Correlation (Memory Context)
    const recentIncidents = (input.incidents || []).filter(
      inc => inc.where?.toLowerCase().includes(input.zone.name.toLowerCase()) || inc.camera_id === input.camera.id
    );

    const historyCorrelation = {
      previousIncidentsCount: recentIncidents.length,
      repeatedVisitorToday: (input.repeatedApproachesCount ?? 1) > 1,
      lastSeenSecondsAgo: (input.repeatedApproachesCount ?? 1) > 1 ? 180 : undefined,
    };

    // 8. False Positive Reduction Filters
    const isDeliveryParcel = input.category === 'package' || tags.includes('package_delivery');
    const isPotentialShadowOrLighting = tags.includes('shadow') || tags.includes('lighting_glare');
    const isSingleFrame = input.isSingleFrame === true;
    const passedFilter = !isPotentialShadowOrLighting && !isSingleFrame;

    const falsePositiveCheck = {
      isPotentialShadowOrLighting,
      isDeliveryParcel,
      isSingleFrame,
      passedFilter,
    };

    return {
      identity: {
        isKnown,
        personId: matchedPerson?.id || input.personId,
        personName: matchedPerson?.name || input.personName,
        relationship: matchedPerson?.relationship,
        isRestricted: matchedPerson?.is_restricted ?? false,
        confidence,
        rawEmbeddingMatch: !!matchedPerson,
      },
      camera,
      zone,
      securityMode,
      homeownerStatus,
      timeOfDay: {
        hour: currentHour,
        isNight,
        period,
      },
      behaviour,
      sensorFusion,
      crossCameraPath,
      historyCorrelation,
      falsePositiveCheck,
    };
  }
}
