import { 
  Detection, 
  Incident, 
  RiskLevel, 
  EventClassification, 
  SecurityMode, 
  Zone, 
  TrustedPerson, 
  BehaviorStep, 
  CrossCameraPathPoint,
  Camera
} from '../types';

export interface EvaluationInput {
  personType: 'known' | 'unknown';
  person?: TrustedPerson | null;
  zone: Zone;
  camera: Camera;
  securityMode: SecurityMode;
  dwellTimeSeconds: number;
  hour?: number; // 0-23
  behaviourTags?: string[];
  category?: 'person' | 'vehicle' | 'package' | 'pet' | 'loitering';
  sensorTriggers?: string[];
}

export interface IntelligenceResult {
  risk_level: RiskLevel;
  classification: EventClassification;
  risk_factors: string[];
  ai_explanation: string;
  recommended_actions: string[];
  behaviour_sequence: BehaviorStep[];
  camera_path: CrossCameraPathPoint[];
}

export class IntelligenceEngine {
  /**
   * Evaluates Risk, Context, and generates AI Explanation following:
   * WHO + WHERE + WHEN + WHAT + HOW LONG + HOME MODE + EXPECTED BEHAVIOUR
   */
  static evaluate(input: EvaluationInput): IntelligenceResult {
    const now = new Date();
    const currentHour = input.hour ?? now.getHours();
    const isNight = currentHour >= 22 || currentHour < 6;
    const isLateEvening = currentHour >= 19 && currentHour < 22;
    const isAway = input.securityMode === 'away';
    const isNightMode = input.securityMode === 'night';
    const isRestrictedZone = input.zone.type === 'bedroom' || input.zone.type === 'backyard';
    const isHighSensitivity = input.zone.sensitivity === 'high';
    const isKnown = input.personType === 'known' && !!input.person;

    const riskFactors: string[] = [];
    const recommendedActions: string[] = [];
    let risk_level: RiskLevel = 'LOW';
    let classification: EventClassification = 'NORMAL';

    // 1. Identity & Permissions Check
    if (isKnown && input.person) {
      if (input.person.is_restricted) {
        riskFactors.push(`Flagged contact: ${input.person.name} has restricted status`);
        risk_level = 'HIGH';
        classification = 'UNUSUAL';
      } else if (input.person.restricted_zones?.includes(input.zone.name)) {
        riskFactors.push(`Restricted zone violation: ${input.person.name} entered ${input.zone.name}`);
        risk_level = 'MEDIUM';
        classification = 'UNUSUAL';
      } else {
        riskFactors.push(`Trusted identity confirmed: ${input.person.name} (${input.person.relationship})`);
        risk_level = 'LOW';
        classification = 'NORMAL';
      }
    } else {
      riskFactors.push('Unrecognized visitor: Face embeddings do not match trusted registry');
      risk_level = 'MEDIUM';
      classification = 'UNUSUAL';
    }

    // 2. Zone Sensitivity & Time Context
    if (isNight) {
      riskFactors.push(`Unusual late-night hour (${currentHour.toString().padStart(2, '0')}:15)`);
      if (!isKnown) {
        risk_level = isAway || isNightMode ? 'CRITICAL' : 'HIGH';
        classification = 'CRITICAL';
      } else {
        if (risk_level === 'LOW') risk_level = 'LOW';
      }
    }

    if (isRestrictedZone && !isKnown) {
      riskFactors.push(`Unauthorized presence in high-sensitivity zone: ${input.zone.name}`);
      if (risk_level !== 'CRITICAL') {
        risk_level = isAway || isNight ? 'CRITICAL' : 'HIGH';
        classification = 'CRITICAL';
      }
    }

    // 3. Security Mode Multiplier
    if (isAway && !isKnown) {
      riskFactors.push('Away Mode active: Home is unoccupied by owner');
      if (risk_level !== 'CRITICAL') risk_level = 'HIGH';
      classification = 'CRITICAL';
    }

    // 4. Dwell Time & Behaviour
    if (input.dwellTimeSeconds > 60) {
      riskFactors.push(`Loitering observed: Visitor has dwelled for ${input.dwellTimeSeconds}s`);
      if (risk_level === 'LOW' && !isKnown) risk_level = 'MEDIUM';
    }

    if (input.behaviourTags?.includes('touches_handle') || input.behaviourTags?.includes('attempting_door')) {
      riskFactors.push('Physical interaction: Observed touching door handle or attempting entry');
      risk_level = 'CRITICAL';
      classification = 'CRITICAL';
    }

    if (input.behaviourTags?.includes('looking_into_windows')) {
      riskFactors.push('Suspicious gaze: Subject observed peering into perimeter windows');
      if (risk_level !== 'CRITICAL') risk_level = 'HIGH';
      classification = 'CRITICAL';
    }

    // 5. Build AI Explanation
    let ai_explanation = '';
    const subject = isKnown && input.person ? input.person.name : 'An unidentified person';
    const timeDesc = isNight ? 'at late night' : isLateEvening ? 'during evening hours' : 'during daytime';
    const modeDesc = isAway ? 'while Away Mode is active' : isNightMode ? 'in Night Guard mode' : 'in Home Secure mode';

    if (isKnown && !input.person?.is_restricted) {
      ai_explanation = `${subject} (${input.person?.relationship}) arrived at ${input.zone.name} ${timeDesc} ${modeDesc}. Behavior is consistent with trusted family routine.`;
      recommendedActions.push('No action required — Routine arrival verified');
    } else if (risk_level === 'CRITICAL') {
      ai_explanation = `${subject} was detected in ${input.zone.name} ${timeDesc} ${modeDesc}. Sequence exhibits high-risk indicators: dwell time ${input.dwellTimeSeconds}s, restricted zone approach, and absence of owner authorization.`;
      recommendedActions.push('Activate Deterrent Spotlight & Two-Way Voice');
      recommendedActions.push('Verify live camera feed immediately');
      recommendedActions.push('Notify enrolled emergency contacts if unverified');
    } else if (risk_level === 'HIGH') {
      ai_explanation = `${subject} detected at ${input.zone.name} ${timeDesc}. Threat assessment evaluated as HIGH due to unexpected presence in ${input.zone.name} with no matching trusted enrollment.`;
      recommendedActions.push('Open Live Video to initiate voice verification');
      recommendedActions.push('Sound 85dB deterrence chime if subject does not depart');
    } else {
      ai_explanation = `${subject} detected at ${input.zone.name}. Subject has been present for ${input.dwellTimeSeconds} seconds. Routine visitor verification is recommended.`;
      recommendedActions.push('Speak with visitor via Two-Way Talk');
      recommendedActions.push('Enroll visitor to Trusted Database if recognized');
    }

    // 6. Build Behavior Sequence
    const nowTime = now.getTime();
    const behaviour_sequence: BehaviorStep[] = [
      {
        id: `bs-1-${nowTime}`,
        timestamp: new Date(nowTime - (input.dwellTimeSeconds + 15) * 1000).toISOString(),
        action: 'Motion detected entering camera field of view',
        zone: input.zone.name,
        dwell_seconds: 5,
      },
      {
        id: `bs-2-${nowTime}`,
        timestamp: new Date(nowTime - (input.dwellTimeSeconds + 8) * 1000).toISOString(),
        action: `Traversed pathway into ${input.zone.name}`,
        zone: input.zone.name,
        dwell_seconds: 8,
      },
      {
        id: `bs-3-${nowTime}`,
        timestamp: new Date(nowTime - input.dwellTimeSeconds * 1000).toISOString(),
        action: isKnown 
          ? `Approach to entrance by ${input.person?.name}`
          : input.behaviourTags?.includes('attempting_door')
          ? 'Approached door and checked handle mechanism'
          : `Stationary presence near entryway (${input.dwellTimeSeconds}s elapsed)`,
        zone: input.zone.name,
        dwell_seconds: input.dwellTimeSeconds,
      },
    ];

    // 7. Cross-Camera Tracking Path
    const camera_path: CrossCameraPathPoint[] = [
      {
        camera_id: input.camera.id,
        camera_name: input.camera.name,
        timestamp: new Date(nowTime - input.dwellTimeSeconds * 1000).toISOString(),
        zone: input.zone.name,
        snapshot_url: input.camera.stream_url,
        dwell_seconds: input.dwellTimeSeconds,
      },
    ];

    return {
      risk_level,
      classification,
      risk_factors: riskFactors,
      ai_explanation,
      recommended_actions: recommendedActions,
      behaviour_sequence,
      camera_path,
    };
  }
}
