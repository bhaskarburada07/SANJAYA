import { MultiSourceContext, RiskEngineOutput } from '../../types';

export class RiskEngine {
  /**
   * Dynamically evaluates risk using a multi-signal context matrix.
   * 
   * Strict Rules:
   * 1. UNKNOWN PERSON IS NOT AUTOMATICALLY HIGH RISK.
   * 2. Risk can increase or decrease dynamically based on movement and duration.
   * 3. Combinations of signals drive the risk score.
   */
  static evaluateRisk(context: MultiSourceContext): RiskEngineOutput {
    const riskFactors: string[] = [];
    const mitigatingFactors: string[] = [];
    let score = 10; // Baseline normal presence
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';

    const { identity, zone, securityMode, behaviour, sensorFusion, timeOfDay, falsePositiveCheck } = context;

    // 1. False Positive Pre-Check (Shadows, Glare, Single Frame)
    if (!falsePositiveCheck.passedFilter) {
      mitigatingFactors.push('Transient visual anomaly or single-frame spike');
      return {
        calculatedRisk: 'LOW',
        riskScore: 5,
        trend: 'decreasing',
        riskFactors: ['Potential optical artifact or single-frame detection'],
        mitigatingFactors: ['Filtered out by false-positive suppressor'],
        reasoning: 'Observation suppressed due to single-frame or transient lighting artifact.',
      };
    }

    // 2. Identity Baseline
    if (identity.isKnown) {
      if (identity.isRestricted) {
        score += 55;
        riskFactors.push(`Restricted Contact: Enrolled person "${identity.personName}" has active access restriction`);
        trend = 'increasing';
      } else {
        score -= 10;
        mitigatingFactors.push(`Trusted Member: Verified match with "${identity.personName}" (${identity.relationship || 'Household'})`);
      }
    } else {
      // Unknown person: NOT an automatic threat!
      mitigatingFactors.push('Unrecognized visitor (unknown identity does not imply malicious intent)');
    }

    // 3. Movement Context & Dynamic Trend
    switch (behaviour.movement) {
      case 'walking_past':
        score -= 5;
        mitigatingFactors.push('Subject is merely walking past the perimeter pathway');
        trend = 'decreasing';
        break;

      case 'leaving':
        score -= 15;
        mitigatingFactors.push('Subject has concluded visit and is departing the property');
        trend = 'decreasing';
        break;

      case 'waiting':
        if (behaviour.dwellTimeSeconds < 60) {
          mitigatingFactors.push(`Standard visitor waiting behavior (${behaviour.dwellTimeSeconds}s elapsed)`);
        } else {
          score += 15;
          riskFactors.push(`Extended waiting without entry (${behaviour.dwellTimeSeconds}s)`);
          trend = 'increasing';
        }
        break;

      case 'pacing':
        score += 20;
        riskFactors.push('Subject observed pacing back and forth near entry');
        trend = 'increasing';
        break;

      case 'loitering':
        score += 25;
        riskFactors.push(`Prolonged loitering in ${zone.name} (${behaviour.dwellTimeSeconds}s duration)`);
        trend = 'increasing';
        break;

      case 'returning':
        score += 25;
        riskFactors.push(`Repeated approach: Subject returned to ${zone.name} (${behaviour.repeatedApproachesCount} visits)`);
        trend = 'increasing';
        break;

      case 'approaching':
      default:
        // Normal baseline approach
        if (behaviour.dwellTimeSeconds < 30) {
          mitigatingFactors.push('Brief initial approach');
        }
        break;
    }

    // 4. Behavioural Actions (Physical Interaction)
    if (behaviour.doorInteraction) {
      score += 35;
      riskFactors.push('Physical Interaction: Subject touched or manipulated the door handle/lock');
      trend = 'increasing';
    }

    if (behaviour.windowInteraction) {
      score += 35;
      riskFactors.push('Perimeter Inspection: Subject observed inspecting or peering into windows');
      trend = 'increasing';
    }

    if (behaviour.restrictedZoneEntry && !identity.isKnown) {
      score += 30;
      riskFactors.push(`Restricted Area Entry: Unverified presence inside private ${zone.name}`);
      trend = 'increasing';
    }

    // 5. Security Mode Multiplier
    if (securityMode === 'away') {
      if (!identity.isKnown && behaviour.doorInteraction) {
        score += 25;
        riskFactors.push('Away Mode Active: Homeowner is away while unrecognized person interacts with entrance');
        trend = 'increasing';
      } else if (!identity.isKnown && behaviour.movement !== 'walking_past' && behaviour.movement !== 'leaving') {
        score += 10;
        riskFactors.push('Away Mode Active: Unoccupied property monitoring active');
      } else {
        mitigatingFactors.push('Away Mode Active: Baseline perimeter watch maintained');
      }
    } else if (securityMode === 'night') {
      if (!identity.isKnown && timeOfDay.isNight && behaviour.movement !== 'walking_past') {
        score += 15;
        riskFactors.push(`Night Mode Guard: Unexpected activity during quiet hours (${timeOfDay.hour}:00)`);
      }
    } else {
      // Home mode
      mitigatingFactors.push('Home Mode Active: Resident is present inside');
    }

    // 6. Multi-Sensor Fusion Reinforcement
    if (sensorFusion.doorSensorState === 'open') {
      if (securityMode === 'away' && !identity.isKnown) {
        score += 35;
        riskFactors.push('Sensor Confirmation: Perimeter door opened while Away Mode is active');
        trend = 'increasing';
      }
    } else if (sensorFusion.doorSensorState === 'tamper') {
      score += 40;
      riskFactors.push('Hardware Tamper Alert: Magnetic door reed switch tamper circuit triggered');
      trend = 'increasing';
    }

    if (sensorFusion.windowSensorState === 'open' || sensorFusion.windowSensorState === 'tamper') {
      score += 40;
      riskFactors.push('Window Sensor Breach: Perimeter window open or tampered');
      trend = 'increasing';
    }

    if (sensorFusion.cameraHealthStatus === 'tampered' || sensorFusion.cameraHealthStatus === 'obstructed') {
      score += 20;
      riskFactors.push(`Camera Impairment: Camera sensor is ${sensorFusion.cameraHealthStatus}`);
    }

    // 7. Parcel / Courier Delivery Exception
    if (falsePositiveCheck.isDeliveryParcel) {
      score = Math.min(score, 20);
      mitigatingFactors.push('Classified as standard courier parcel dropoff');
      trend = 'decreasing';
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine Final Calculated Risk
    let calculatedRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 75) {
      calculatedRisk = 'CRITICAL';
    } else if (score >= 50) {
      calculatedRisk = 'HIGH';
    } else if (score >= 25) {
      calculatedRisk = 'MEDIUM';
    } else {
      calculatedRisk = 'LOW';
    }

    // Generate Contextual Reasoning
    const actor = identity.isKnown && identity.personName 
      ? `Trusted member "${identity.personName}"` 
      : 'An unrecognized person';
    
    let reasoning = '';
    if (calculatedRisk === 'LOW') {
      reasoning = `${actor} observed in ${zone.name}. Activity is consistent with benign visitor behavior or family routine under ${securityMode.toUpperCase()} mode.`;
    } else if (calculatedRisk === 'MEDIUM') {
      reasoning = `${actor} present in ${zone.name} with elevated attention signals (${behaviour.movement}, dwell ${behaviour.dwellTimeSeconds}s). Ongoing observation recommended.`;
    } else if (calculatedRisk === 'HIGH') {
      reasoning = `${actor} detected in ${zone.name} during ${securityMode.toUpperCase()} mode exhibiting concerning behavior (${riskFactors.slice(0, 2).join(', ')}). Immediate verification advised.`;
    } else {
      reasoning = `High-confidence breach event in ${zone.name}: Multiple confirming physical or sensor indicators present (${riskFactors.slice(0, 3).join('; ')}).`;
    }

    return {
      calculatedRisk,
      riskScore: score,
      trend,
      riskFactors,
      mitigatingFactors,
      reasoning,
    };
  }
}
