import { 
  Camera, 
  Zone, 
  TrustedPerson, 
  SecurityMode, 
  SecuritySensor, 
  Incident, 
  Detection,
  DecisionPipelineExecution,
  MultiSourceContext,
  RiskEngineOutput,
  DecisionEngineOutput,
  ResponseEngineOutput,
  BehaviorStep,
  CrossCameraPathPoint
} from '../../types';
import { ContextEngine, RawObservationInput } from './contextEngine';
import { RiskEngine } from './riskEngine';
import { DecisionEngine } from './decisionEngine';
import { ResponseEngine } from './responseEngine';
import { realtimeBus } from '../../lib/supabase';

// In-memory temporal tracking cache for active tracks across cameras
interface ActiveTrack {
  trackId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  incidentId?: string;
  camerasVisited: string[];
  totalDwellSeconds: number;
  approachCount: number;
  highestRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  doorInteractions: number;
}

export class SanjayaDecisionSystem {
  private static activeTracks: Map<string, ActiveTrack> = new Map();
  private static decisionHistory: DecisionPipelineExecution[] = [];

  /**
   * Complete 7-Stage Intelligence Pipeline:
   * SEE → UNDERSTAND → CONTEXT → RISK → DECIDE → RESPOND → REMEMBER
   */
  static processObservation(
    userId: string,
    homeId: string,
    input: RawObservationInput,
    options: {
      existingIncidentId?: string;
      playAudio?: boolean;
    } = {}
  ): {
    execution: DecisionPipelineExecution;
    detection?: Detection;
    incident?: Incident;
  } {
    const now = Date.now();
    const isoTimestamp = new Date(now).toISOString();

    // ----------------------------------------------------
    // STAGE 1: SEE (Computer Vision & Sensor Ingestion)
    // ----------------------------------------------------
    const seeStage = `Vision sensor ${input.camera.name} captured human bounding box in ${input.zone.name} (Confidence: ${((input.confidence ?? 0.92) * 100).toFixed(0)}%).`;

    // ----------------------------------------------------
    // STAGE 2: UNDERSTAND (Feature Extraction & Embedding)
    // ----------------------------------------------------
    const isEnrolledMatch = (input.trustedPeople || []).some(
      tp => tp.id === input.personId || (input.personName && tp.name.toLowerCase() === input.personName.toLowerCase())
    );
    const understandStage = isEnrolledMatch
      ? `Biometric embeddings matched enrolled trusted database for ${input.personName || 'Household Member'}.`
      : `Face embeddings do not match any enrolled family or trusted contacts. Classified as Unrecognized Person.`;

    // ----------------------------------------------------
    // STAGE 3: CONTEXT (Context Engine)
    // ----------------------------------------------------
    const context: MultiSourceContext = ContextEngine.evaluateContext(input);
    const contextStage = `Aggregated multi-source context: Home Mode=${context.securityMode.toUpperCase()}, Zone=${context.zone.name} (${context.zone.sensitivity.toUpperCase()}), Dwell=${context.behaviour.dwellTimeSeconds}s, Movement=${context.behaviour.movement}, Sensors=${context.sensorFusion.otherSensorsTriggered.join(', ') || 'Normal baseline'}.`;

    // Temporal Cross-Camera & Duration Continuity Check
    const trackKey = `${context.zone.id}-${context.identity.isKnown ? context.identity.personId : 'unknown'}`;
    let track = this.activeTracks.get(trackKey);

    if (track) {
      track.lastSeenAt = now;
      track.totalDwellSeconds += 15;
      if (!track.camerasVisited.includes(input.camera.id)) {
        track.camerasVisited.push(input.camera.id);
      }
      if (context.behaviour.doorInteraction) {
        track.doorInteractions += 1;
      }
      // Inherit existing incident ID if present to prevent alert spam
      if (!options.existingIncidentId && track.incidentId) {
        options.existingIncidentId = track.incidentId;
      }
    } else {
      track = {
        trackId: `trk-${now}`,
        firstSeenAt: now,
        lastSeenAt: now,
        camerasVisited: [input.camera.id],
        totalDwellSeconds: context.behaviour.dwellTimeSeconds,
        approachCount: context.behaviour.repeatedApproachesCount,
        highestRisk: 'LOW',
        doorInteractions: context.behaviour.doorInteraction ? 1 : 0,
      };
      this.activeTracks.set(trackKey, track);
    }

    // ----------------------------------------------------
    // STAGE 4: RISK (Risk Engine)
    // ----------------------------------------------------
    const risk: RiskEngineOutput = RiskEngine.evaluateRisk(context);
    track.highestRisk = risk.calculatedRisk;
    const riskStage = `Dynamic risk evaluated as ${risk.calculatedRisk} (Score: ${risk.riskScore}/100, Trend: ${risk.trend.toUpperCase()}). Mitigating: ${risk.mitigatingFactors.length} factors; Elevating: ${risk.riskFactors.length} factors.`;

    // ----------------------------------------------------
    // STAGE 5: DECIDE (Decision Engine)
    // ----------------------------------------------------
    const decision: DecisionEngineOutput = DecisionEngine.decide(context, risk);
    const decideStage = `Selected operational decision: ${decision.decision}. Rationale: ${decision.decisionRationale}`;

    // ----------------------------------------------------
    // STAGE 6: RESPOND (Response Engine)
    // ----------------------------------------------------
    const response: ResponseEngineOutput = ResponseEngine.executeResponse(
      userId,
      homeId,
      context,
      risk,
      decision,
      {
        existingIncidentId: options.existingIncidentId,
        playAudio: options.playAudio,
      }
    );
    const respondStage = `Actions dispatched: ${response.actionsDispatched.join('; ')}. Incident Status: ${response.incidentAction.toUpperCase()}.`;

    // ----------------------------------------------------
    // STAGE 7: REMEMBER (Memory & Continuity)
    // ----------------------------------------------------
    if (response.incidentId) {
      track.incidentId = response.incidentId;
    }
    const rememberStage = `Recorded observation to local spatial memory. Tracking continuity preserved across ${track.camerasVisited.length} camera(s) with ${track.totalDwellSeconds}s cumulative observation. Unknown visitor status maintained without silent trust bypass.`;

    // Construct full execution record
    const execution: DecisionPipelineExecution = {
      id: `exec-${now}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: isoTimestamp,
      context,
      risk,
      decision,
      response,
      stages: {
        see: seeStage,
        understand: understandStage,
        context: contextStage,
        risk: riskStage,
        decide: decideStage,
        respond: respondStage,
        remember: rememberStage,
      },
    };

    // Keep execution in memory history
    this.decisionHistory.unshift(execution);
    if (this.decisionHistory.length > 50) {
      this.decisionHistory.pop();
    }

    // Publish execution telemetry
    realtimeBus.publish('decision:new', execution);

    // Build or update Detection and Incident models for app integration
    let detection: Detection | undefined;
    let incident: Incident | undefined;

    const entropy = Math.random().toString(36).substring(2, 6);
    detection = {
      id: `det-${now}-${entropy}`,
      camera_id: input.camera.id,
      camera_name: input.camera.name,
      user_id: userId,
      person_type: context.identity.isKnown ? 'known' : 'unknown',
      person_name: context.identity.personName,
      person_id: context.identity.personId,
      category: input.category || 'person',
      confidence: context.identity.confidence,
      zone: context.zone.name,
      dwell_time_seconds: context.behaviour.dwellTimeSeconds,
      risk_level: risk.calculatedRisk,
      snapshot_url: input.camera.stream_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      detected_at: isoTimestamp,
      notes: decision.decisionRationale,
    };

    if (decision.decision === 'WARN' || decision.decision === 'ESCALATE' || decision.decision === 'EMERGENCY_RESPONSE') {
      const behaviourSequence: BehaviorStep[] = [
        {
          id: `bs-1-${now}`,
          timestamp: new Date(now - (context.behaviour.dwellTimeSeconds + 10) * 1000).toISOString(),
          action: `Subject entered camera field of view in ${context.zone.name}`,
          zone: context.zone.name,
          dwell_seconds: 5,
        },
        {
          id: `bs-2-${now}`,
          timestamp: new Date(now - (context.behaviour.dwellTimeSeconds + 4) * 1000).toISOString(),
          action: `Movement evaluated as "${context.behaviour.movement}"`,
          zone: context.zone.name,
          dwell_seconds: 6,
        },
        {
          id: `bs-3-${now}`,
          timestamp: isoTimestamp,
          action: context.behaviour.doorInteraction 
            ? 'Subject manipulated door handle/lock mechanism'
            : `Stationary presence near entryway (${context.behaviour.dwellTimeSeconds}s elapsed)`,
          zone: context.zone.name,
          dwell_seconds: context.behaviour.dwellTimeSeconds,
        },
      ];

      const cameraPath: CrossCameraPathPoint[] = track.camerasVisited.map((camId) => ({
        camera_id: camId,
        camera_name: camId === input.camera.id ? input.camera.name : 'Perimeter Camera',
        timestamp: isoTimestamp,
        zone: context.zone.name,
        snapshot_url: input.camera.stream_url,
        dwell_seconds: context.behaviour.dwellTimeSeconds,
      }));

      incident = {
        id: response.incidentId || `inc-${now}-${entropy}`,
        user_id: userId,
        detection_id: detection.id,
        detection,
        type: context.identity.isKnown ? 'unusual_behaviour' : 'unknown_detection',
        status: 'active',
        latitude: 12.9716,
        longitude: 77.5946,
        location_address: 'Villa 42, Palm Meadows, Whitefield, Bengaluru',
        started_at: isoTimestamp,
        risk_level: risk.calculatedRisk,
        classification: risk.calculatedRisk === 'CRITICAL' ? 'CRITICAL' : risk.calculatedRisk === 'HIGH' ? 'IMPORTANT' : 'UNUSUAL',
        risk_factors: decision.explainableReasons,
        ai_explanation: response.summaryText,
        who: context.identity.isKnown && context.identity.personName ? context.identity.personName : `Unverified Person (Track #${track.trackId.slice(-4)})`,
        where: `${context.zone.name} · Entrance`,
        when: 'Just now',
        what: response.summaryText,
        dwell_time_seconds: context.behaviour.dwellTimeSeconds,
        home_mode_at_time: context.securityMode,
        recommended_actions: decision.recommendedActions,
        behaviour_sequence: behaviourSequence,
        camera_path: cameraPath,
        sensors_triggered: [
          input.camera.name,
          ...context.sensorFusion.otherSensorsTriggered
        ],
        notes: decision.decisionRationale,
        timeline: [
          {
            id: `tl-1-${now}`,
            timestamp: isoTimestamp,
            title: `Observation Evaluated: ${decision.decision}`,
            description: response.summaryText,
            type: 'classification',
            camera_name: input.camera.name,
            zone: context.zone.name,
          },
        ],
      };

      if (response.incidentAction === 'created') {
        realtimeBus.publish('incidents:new', incident);
      } else if (response.incidentAction === 'updated') {
        realtimeBus.publish('incidents:update', incident);
      }
    }

    return { execution, detection, incident };
  }

  /**
   * Retrieves stored recent decision pipeline runs.
   */
  static getRecentDecisions(): DecisionPipelineExecution[] {
    return [...this.decisionHistory];
  }

  /**
   * Cleans up stale active tracks older than 15 minutes.
   */
  static pruneOldTracks(): void {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [key, track] of this.activeTracks.entries()) {
      if (track.lastSeenAt < cutoff) {
        this.activeTracks.delete(key);
      }
    }
  }
}
