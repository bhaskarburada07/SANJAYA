import { 
  RiskLevel, 
  EventClassification, 
  SecurityMode, 
  Zone, 
  TrustedPerson, 
  BehaviorStep, 
  CrossCameraPathPoint,
  Camera
} from '../types';
import { ContextEngine } from './decisionSystem/contextEngine';
import { RiskEngine } from './decisionSystem/riskEngine';
import { DecisionEngine } from './decisionSystem/decisionEngine';
import { ResponseEngine } from './decisionSystem/responseEngine';

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
  doorInteraction?: boolean;
  windowInteraction?: boolean;
}

export interface IntelligenceResult {
  risk_level: RiskLevel;
  classification: EventClassification;
  risk_factors: string[];
  ai_explanation: string;
  recommended_actions: string[];
  behaviour_sequence: BehaviorStep[];
  camera_path: CrossCameraPathPoint[];
  decision?: 'OBSERVE' | 'INFORM' | 'WARN' | 'ESCALATE' | 'EMERGENCY_RESPONSE';
  pipeline_stages?: {
    see: string;
    understand: string;
    context: string;
    risk: string;
    decide: string;
    respond: string;
    remember: string;
  };
}

export class IntelligenceEngine {
  /**
   * Upgraded Multi-Signal Contextual Evaluator
   * Connects Context Engine + Risk Engine + Decision Engine + Response Engine
   * 
   * Strict Rule: UNKNOWN PERSON DOES NOT EQUAL THREAT.
   */
  static evaluate(input: EvaluationInput): IntelligenceResult {
    const now = new Date();
    const currentHour = input.hour ?? now.getHours();

    // 1. Context Engine
    const context = ContextEngine.evaluateContext({
      personType: input.personType,
      personId: input.person?.id,
      personName: input.person?.name,
      confidence: input.personType === 'known' ? 0.96 : 0.90,
      camera: input.camera,
      zone: input.zone,
      securityMode: input.securityMode,
      dwellTimeSeconds: input.dwellTimeSeconds,
      behaviourTags: input.behaviourTags,
      doorInteraction: input.doorInteraction,
      windowInteraction: input.windowInteraction,
      hour: currentHour,
      category: input.category,
      trustedPeople: input.person ? [input.person] : [],
    });

    // 2. Risk Engine
    const riskOutput = RiskEngine.evaluateRisk(context);

    // 3. Decision Engine
    const decisionOutput = DecisionEngine.decide(context, riskOutput);

    // 4. Map to EventClassification & RiskLevel
    const risk_level: RiskLevel = riskOutput.calculatedRisk;
    let classification: EventClassification = 'NORMAL';
    if (risk_level === 'CRITICAL') {
      classification = 'CRITICAL';
    } else if (risk_level === 'HIGH') {
      classification = 'UNUSUAL';
    } else if (risk_level === 'MEDIUM') {
      classification = 'IMPORTANT';
    } else {
      classification = 'NORMAL';
    }

    // High quality explainable message
    const ai_explanation = ResponseEngine.formatNotificationMessage(context, riskOutput, decisionOutput);

    // Behaviour sequence
    const nowTime = now.getTime();
    const behaviour_sequence: BehaviorStep[] = [
      {
        id: `bs-1-${nowTime}`,
        timestamp: new Date(nowTime - (input.dwellTimeSeconds + 15) * 1000).toISOString(),
        action: `Visual motion detected by ${input.camera.name} at ${input.zone.name}`,
        zone: input.zone.name,
        dwell_seconds: 5,
      },
      {
        id: `bs-2-${nowTime}`,
        timestamp: new Date(nowTime - (input.dwellTimeSeconds + 8) * 1000).toISOString(),
        action: `Evaluated movement: "${context.behaviour.movement}"`,
        zone: input.zone.name,
        dwell_seconds: 8,
      },
      {
        id: `bs-3-${nowTime}`,
        timestamp: new Date(nowTime - input.dwellTimeSeconds * 1000).toISOString(),
        action: context.identity.isKnown 
          ? `Routine entrance approach by verified contact ${context.identity.personName}`
          : context.behaviour.doorInteraction
          ? 'Physical entrance interaction (checked door handle / lock mechanism)'
          : `Stationary presence near entryway (${input.dwellTimeSeconds}s elapsed)`,
        zone: input.zone.name,
        dwell_seconds: input.dwellTimeSeconds,
      },
    ];

    // Cross-Camera Tracking Path
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
      risk_factors: decisionOutput.explainableReasons,
      ai_explanation,
      recommended_actions: decisionOutput.recommendedActions,
      behaviour_sequence,
      camera_path,
      decision: decisionOutput.decision,
      pipeline_stages: {
        see: `Camera sensor ${input.camera.name} captured person bounding box in ${input.zone.name}.`,
        understand: context.identity.isKnown 
          ? `Biometric embedding match: ${context.identity.personName} (${context.identity.relationship || 'Household'}).`
          : 'Biometric embeddings do not match enrolled database. Unrecognized visitor.',
        context: `Context: Mode=${input.securityMode.toUpperCase()}, Dwell=${input.dwellTimeSeconds}s, Movement=${context.behaviour.movement}.`,
        risk: `Dynamic Risk=${riskOutput.calculatedRisk} (Score: ${riskOutput.riskScore}/100, Trend: ${riskOutput.trend.toUpperCase()}).`,
        decide: `Decision=${decisionOutput.decision}: ${decisionOutput.decisionRationale}`,
        respond: `Recommended: ${decisionOutput.recommendedActions.join('; ')}`,
        remember: `Logged to local spatial memory. Tracking continuity preserved across zones.`,
      },
    };
  }
}
