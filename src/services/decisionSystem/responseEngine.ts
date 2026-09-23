import { 
  MultiSourceContext, 
  RiskEngineOutput, 
  DecisionEngineOutput, 
  ResponseEngineOutput, 
  AINotification,
  Incident,
  Detection,
  AppNotification
} from '../../types';
import { realtimeBus } from '../../lib/supabase';
import { playDoorbellChime, playUnknownAlertTone } from '../../utils/audio';

export class ResponseEngine {
  /**
   * Executes appropriate action handlers based on the chosen decision level.
   *
   * LOW RISK:
   * -> Continue monitoring, no disruptive emergency notifications.
   *
   * MEDIUM RISK:
   * -> Inform homeowner, add event to Activity/Timeline.
   *
   * HIGH RISK:
   * -> High-priority notification explaining WHY, create/update incident, show Live Camera action.
   *
   * CRITICAL RISK / CONFIRMED EMERGENCY:
   * -> Trigger authorized emergency response workflows (contact primary contact, start countdown).
   * -> STRICT SAFETY: Never fabricate a fake police dispatch.
   */
  static executeResponse(
    userId: string,
    homeId: string,
    context: MultiSourceContext,
    risk: RiskEngineOutput,
    decision: DecisionEngineOutput,
    options: {
      existingIncidentId?: string;
      playAudio?: boolean;
    } = {}
  ): ResponseEngineOutput {
    const now = new Date();
    const actionsDispatched: string[] = [];
    let notificationCreated: AINotification | undefined;
    let incidentAction: 'none' | 'created' | 'updated' = 'none';
    let incidentId: string | undefined = options.existingIncidentId;
    let sosTriggered = false;
    let alertTonePlayed = false;
    let audioDeterrentActive = false;
    let timelineEntryCreated = false;

    const { identity, camera, zone, securityMode, behaviour, sensorFusion } = context;

    // 1. Build Quality Explainable Notification Message
    const explainableNotificationText = ResponseEngine.formatNotificationMessage(context, risk, decision);

    // 2. Branch according to Decision
    switch (decision.decision) {
      case 'OBSERVE': {
        actionsDispatched.push('Maintained continuous silent observation');
        actionsDispatched.push('Suppressed intrusive alert — situation is benign');
        break;
      }

      case 'INFORM': {
        // Send normal informational notification
        actionsDispatched.push('Dispatched informational notification to homeowner');
        actionsDispatched.push('Recorded event in activity timeline');
        timelineEntryCreated = true;

        const notifId = `ainotif-inf-${now.getTime()}`;
        notificationCreated = {
          id: notifId,
          userId,
          homeId,
          title: `Activity at ${zone.name}`,
          message: explainableNotificationText,
          severity: 'info',
          timestamp: now.toISOString(),
          read: false,
          actions: [
            { label: 'View Camera', actionKey: 'view_camera', payload: { cameraId: camera.id } },
            { label: 'View Event', actionKey: 'view_event' },
            { label: 'Dismiss', actionKey: 'dismiss' },
          ],
        };

        // Realtime app notification
        const appNotif: AppNotification = {
          id: `notif-app-${now.getTime()}`,
          user_id: userId,
          type: 'system',
          category: 'security',
          title: `Activity at ${zone.name}`,
          message: explainableNotificationText,
          read: false,
          created_at: now.toISOString(),
          metadata: { zone: zone.name, cameraId: camera.id },
        };
        realtimeBus.publish('notifications:new', appNotif);
        break;
      }

      case 'WARN': {
        actionsDispatched.push('Dispatched High-Priority Security Warning');
        actionsDispatched.push('Created/updated incident record');
        actionsDispatched.push('Enabled Live Camera inspection action');
        timelineEntryCreated = true;

        if (options.playAudio !== false) {
          playUnknownAlertTone();
          alertTonePlayed = true;
        }

        const notifId = `ainotif-warn-${now.getTime()}`;
        notificationCreated = {
          id: notifId,
          userId,
          homeId,
          title: `Security Warning: ${zone.name}`,
          message: explainableNotificationText,
          severity: 'high',
          timestamp: now.toISOString(),
          read: false,
          actions: [
            { label: 'View Live Camera', actionKey: 'view_camera', payload: { cameraId: camera.id } },
            { label: 'Mark Safe', actionKey: 'mark_safe' },
            { label: 'Notify Family', actionKey: 'notify_family' },
          ],
        };

        const appNotif: AppNotification = {
          id: `notif-app-${now.getTime()}`,
          user_id: userId,
          type: 'security',
          category: 'security',
          title: `Warning: ${zone.name} (${risk.calculatedRisk} Risk)`,
          message: explainableNotificationText,
          read: false,
          created_at: now.toISOString(),
          metadata: { zone: zone.name, cameraId: camera.id, risk_level: risk.calculatedRisk },
        };
        realtimeBus.publish('notifications:new', appNotif);

        incidentAction = options.existingIncidentId ? 'updated' : 'created';
        incidentId = options.existingIncidentId || `inc-${now.getTime()}`;
        break;
      }

      case 'ESCALATE': {
        actionsDispatched.push('Dispatched Escalated Alert to Homeowner');
        actionsDispatched.push('Highlighted entry points with live video links');
        actionsDispatched.push('Logged high-severity security incident with multi-sensor telemetry');
        timelineEntryCreated = true;

        if (options.playAudio !== false) {
          playUnknownAlertTone();
          alertTonePlayed = true;
        }

        const notifId = `ainotif-esc-${now.getTime()}`;
        notificationCreated = {
          id: notifId,
          userId,
          homeId,
          title: `ESCALATION: Unusual Activity at ${zone.name}`,
          message: explainableNotificationText,
          severity: 'high',
          timestamp: now.toISOString(),
          read: false,
          actions: [
            { label: 'View Live Stream', actionKey: 'view_camera', payload: { cameraId: camera.id } },
            { label: 'Sound Chime', actionKey: 'view_camera', payload: { cameraId: camera.id, action: 'deter' } },
            { label: 'Emergency Options', actionKey: 'notify_family' },
          ],
        };

        const appNotif: AppNotification = {
          id: `notif-app-${now.getTime()}`,
          user_id: userId,
          type: 'security',
          category: 'security',
          title: `Escalated Alert: ${zone.name}`,
          message: explainableNotificationText,
          read: false,
          created_at: now.toISOString(),
          metadata: { zone: zone.name, cameraId: camera.id, risk_level: 'HIGH' },
        };
        realtimeBus.publish('notifications:new', appNotif);

        incidentAction = options.existingIncidentId ? 'updated' : 'created';
        incidentId = options.existingIncidentId || `inc-${now.getTime()}`;
        break;
      }

      case 'EMERGENCY_RESPONSE': {
        actionsDispatched.push('Triggered Emergency Response Protocol');
        actionsDispatched.push('Initiating primary contact notification sequence');
        actionsDispatched.push('Activating localized deterrent siren');
        audioDeterrentActive = true;
        sosTriggered = true;
        timelineEntryCreated = true;

        if (options.playAudio !== false) {
          playUnknownAlertTone();
          alertTonePlayed = true;
        }

        const notifId = `ainotif-emg-${now.getTime()}`;
        notificationCreated = {
          id: notifId,
          userId,
          homeId,
          title: `CRITICAL EMERGENCY: ${zone.name}`,
          message: explainableNotificationText,
          severity: 'emergency',
          timestamp: now.toISOString(),
          read: false,
          actions: [
            { label: 'Open Live Feed', actionKey: 'view_camera', payload: { cameraId: camera.id } },
            { label: 'Emergency Center', actionKey: 'notify_family' },
          ],
        };

        const appNotif: AppNotification = {
          id: `notif-app-${now.getTime()}`,
          user_id: userId,
          type: 'emergency',
          category: 'emergency',
          title: `CRITICAL ALARM: ${zone.name}`,
          message: explainableNotificationText,
          read: false,
          created_at: now.toISOString(),
          metadata: { zone: zone.name, cameraId: camera.id, risk_level: 'CRITICAL' },
        };
        realtimeBus.publish('notifications:new', appNotif);

        incidentAction = options.existingIncidentId ? 'updated' : 'created';
        incidentId = options.existingIncidentId || `inc-${now.getTime()}`;
        break;
      }
    }

    return {
      actionsDispatched,
      notificationCreated,
      incidentAction,
      incidentId,
      sosTriggered,
      alertTonePlayed,
      audioDeterrentActive,
      timelineEntryCreated,
      summaryText: explainableNotificationText,
    };
  }

  /**
   * Helper that builds rich, explanatory notification text adhering to Rule 12:
   * Explains WHY the alert was generated, not just a blind label.
   */
  static formatNotificationMessage(
    context: MultiSourceContext,
    risk: RiskEngineOutput,
    decision: DecisionEngineOutput
  ): string {
    const { identity, zone, securityMode, behaviour, sensorFusion, timeOfDay } = context;

    if (decision.decision === 'OBSERVE') {
      return identity.isKnown
        ? `${identity.personName} arrived at ${zone.name}. Routine household arrival verified.`
        : `Visitor observed at ${zone.name}. Routine departure without suspicious indicators.`;
    }

    const subject = identity.isKnown && identity.personName
      ? identity.personName
      : 'An unknown person';

    const timePrefix = timeOfDay.isNight 
      ? `during late-night hours (${timeOfDay.hour.toString().padStart(2, '0')}:00)` 
      : `during daytime`;

    // High quality contextual explanation
    const parts: string[] = [];

    if (behaviour.doorInteraction) {
      parts.push(`interacted with or checked the door entrance`);
    } else if (behaviour.windowInteraction) {
      parts.push(`was observed peering into perimeter windows`);
    } else if (behaviour.movement === 'loitering' || behaviour.dwellTimeSeconds > 60) {
      parts.push(`has remained stationary near ${zone.name} for ${behaviour.dwellTimeSeconds}s`);
    } else if (behaviour.movement === 'returning') {
      parts.push(`has repeatedly approached ${zone.name} (${behaviour.repeatedApproachesCount} visits)`);
    } else if (behaviour.movement === 'pacing') {
      parts.push(`was detected pacing outside ${zone.name}`);
    } else {
      parts.push(`approached ${zone.name}`);
    }

    let hardwareConfirmation = '';
    if (sensorFusion.doorSensorState === 'open') {
      hardwareConfirmation = ' Entrance door sensor confirmed door was opened.';
    } else if (sensorFusion.doorSensorState === 'tamper') {
      hardwareConfirmation = ' Door sensor magnetic reed tamper circuit detected.';
    }

    const actionText = decision.recommendedActions[0] || 'Inspect live camera feed.';

    return `Unusual activity detected near ${zone.name}. ${subject} ${parts.join(', ')} while the home is in ${securityMode.toUpperCase()} mode ${timePrefix}.${hardwareConfirmation} Recommended: ${actionText}`;
  }
}
