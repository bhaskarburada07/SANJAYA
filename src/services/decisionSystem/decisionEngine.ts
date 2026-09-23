import { MultiSourceContext, RiskEngineOutput, DecisionEngineOutput, DecisionType } from '../../types';

export class DecisionEngine {
  /**
   * Evaluates the contextual risk output and chooses the appropriate operational decision:
   * OBSERVE, INFORM, WARN, ESCALATE, or EMERGENCY_RESPONSE.
   *
   * Adheres strictly to the Emergency Safety Rule:
   * NEVER escalate to emergency services merely due to unknown identity or night presence.
   */
  static decide(context: MultiSourceContext, risk: RiskEngineOutput): DecisionEngineOutput {
    let decision: DecisionType = 'OBSERVE';
    let confidence = 0.94;
    const explainableReasons: string[] = [];
    const recommendedActions: string[] = [];

    const { identity, zone, securityMode, behaviour, sensorFusion, timeOfDay, falsePositiveCheck } = context;

    // Build user-facing explainable reasons list
    explainableReasons.push(
      identity.isKnown 
        ? `Recognized family member: ${identity.personName} (${identity.relationship || 'Household'})`
        : 'Identity unverified (unknown visitor)'
    );

    explainableReasons.push(`Home mode active: ${securityMode.toUpperCase()}`);
    explainableReasons.push(`Location: ${zone.name} (${zone.sensitivity.toUpperCase()} sensitivity zone)`);

    if (behaviour.dwellTimeSeconds > 0) {
      explainableReasons.push(`Presence duration: ${behaviour.dwellTimeSeconds} seconds (${behaviour.movement})`);
    }

    if (behaviour.doorInteraction) {
      explainableReasons.push('Subject physically checked or interacted with door entrance');
    }

    if (behaviour.windowInteraction) {
      explainableReasons.push('Subject peered into or inspected perimeter windows');
    }

    if (behaviour.repeatedApproachesCount > 1) {
      explainableReasons.push(`Subject returned to entrance ${behaviour.repeatedApproachesCount} times`);
    }

    if (sensorFusion.doorSensorState === 'open') {
      explainableReasons.push('Door sensor hardware confirmed door opened');
    } else if (sensorFusion.doorSensorState === 'tamper') {
      explainableReasons.push('Tamper alert on entry door sensor hardware');
    }

    if (sensorFusion.windowSensorState === 'open' || sensorFusion.windowSensorState === 'tamper') {
      explainableReasons.push('Window sensor hardware state triggered');
    }

    if (timeOfDay.isNight) {
      explainableReasons.push(`Late hour activity recorded (${timeOfDay.hour.toString().padStart(2, '0')}:00)`);
    }

    // False positive suppression
    if (!falsePositiveCheck.passedFilter) {
      return {
        decision: 'OBSERVE',
        confidence: 0.98,
        decisionRationale: 'Filtered transient sensor flicker or single-frame spike. SANJAYA will observe quietly without issuing alerts.',
        explainableReasons: ['Optical anomaly or single-frame spike suppressed by noise gate'],
        recommendedActions: ['Continue ambient background monitoring'],
        requiresHumanConfirmation: false,
      };
    }

    // 1. CRITICAL RISK -> EMERGENCY_RESPONSE or ESCALATE
    if (risk.calculatedRisk === 'CRITICAL') {
      // Must have actual confirming hardware sensors (e.g. door opened while away, or physical breach attempt)
      const hasHardwareBreachConfirmation = 
        sensorFusion.doorSensorState === 'open' || 
        sensorFusion.doorSensorState === 'tamper' ||
        sensorFusion.windowSensorState === 'open' ||
        sensorFusion.windowSensorState === 'tamper';

      if (securityMode === 'away' && hasHardwareBreachConfirmation && !identity.isKnown) {
        decision = 'EMERGENCY_RESPONSE';
        confidence = 0.96;
        recommendedActions.push('Sound deterrent siren (85dB chime/horn)');
        recommendedActions.push('Open Live Camera view to visually inspect perimeter');
        recommendedActions.push('Contact emergency contact list via automated escalation countdown');
      } else {
        // High severity but needs homeowner intervention first
        decision = 'ESCALATE';
        confidence = 0.93;
        recommendedActions.push('Alert homeowner with critical priority push notification');
        recommendedActions.push('Activate deterrent camera spotlight');
        recommendedActions.push('Verify live camera feed before initiating emergency dispatch');
      }
    } 
    // 2. HIGH RISK -> WARN or ESCALATE
    else if (risk.calculatedRisk === 'HIGH') {
      if (securityMode === 'away' && behaviour.doorInteraction) {
        decision = 'ESCALATE';
        confidence = 0.91;
        recommendedActions.push('Notify homeowner immediately of unauthorized entrance access attempt');
        recommendedActions.push('Open 2-Way Audio to question visitor');
        recommendedActions.push('Log security incident with timeline snapshots');
      } else {
        decision = 'WARN';
        confidence = 0.89;
        recommendedActions.push('Send high-priority notification to resident');
        recommendedActions.push('Create security incident record');
        recommendedActions.push('Inspect live camera feed');
      }
    } 
    // 3. MEDIUM RISK -> INFORM
    else if (risk.calculatedRisk === 'MEDIUM') {
      decision = 'INFORM';
      confidence = 0.88;
      recommendedActions.push('Send informational notification to resident');
      recommendedActions.push('Record observation in Daily Activity Timeline');
      if (!identity.isKnown) {
        recommendedActions.push('Prompt homeowner to enroll visitor if known');
      }
    } 
    // 4. LOW RISK -> OBSERVE
    else {
      decision = 'OBSERVE';
      confidence = 0.95;
      recommendedActions.push('Continue continuous baseline observation');
      recommendedActions.push('No notification required for standard visitor or household routine');
    }

    // Build Decision Rationale Text
    let decisionRationale = '';
    switch (decision) {
      case 'OBSERVE':
        decisionRationale = identity.isKnown
          ? `Verified arrival of ${identity.personName}. Activity is normal for ${securityMode} mode. Situation is calm; continuing routine observation.`
          : 'Visitor is present without aggressive or suspicious behavior. SANJAYA maintains observation without disruptive alerts.';
        break;

      case 'INFORM':
        decisionRationale = `Informational event detected. An unrecognized visitor has been present for ${behaviour.dwellTimeSeconds}s in ${zone.name}. No immediate threat detected, logging event to activity timeline.`;
        break;

      case 'WARN':
        decisionRationale = `Elevated risk in ${zone.name}. An unverified visitor is exhibiting unusual presence or prolonged loitering during ${securityMode.toUpperCase()} mode. Immediate homeowner review recommended.`;
        break;

      case 'ESCALATE':
        decisionRationale = `High concern: Unrecognized person interacted with entry points while home is in ${securityMode.toUpperCase()} mode. Escalating to homeowner and preparing secondary notification protocols.`;
        break;

      case 'EMERGENCY_RESPONSE':
        decisionRationale = `Critical perimeter breach confirmed by multiple sensors (camera vision + hardware sensor trigger) during AWAY mode. Engaging emergency escalation protocols.`;
        break;
    }

    return {
      decision,
      confidence,
      decisionRationale,
      explainableReasons,
      recommendedActions,
      requiresHumanConfirmation: decision !== 'EMERGENCY_RESPONSE',
    };
  }
}
