import { 
  SecurityEvent, 
  AIAnalysis, 
  AIInsight, 
  AINotification, 
  AIBrainStatus, 
  DailyAISummary, 
  SecurityMode, 
  TrustedPerson, 
  Camera, 
  Zone, 
  SecuritySensor,
  Incident,
  Detection,
  AISeverity,
  AIConversationMessage
} from '../types';
import { SanjayaAIService } from './sanjayaAIService';
import { SecurityHardwareAdapter } from './hardwareAbstraction';

export interface AIBrainState {
  events: SecurityEvent[];
  analyses: AIAnalysis[];
  insights: AIInsight[];
  notifications: AINotification[];
  dailySummary: DailyAISummary;
  status: AIBrainStatus;
  conversation: AIConversationMessage[];
}

export class AIBrainManager {
  /**
   * Initializes or bootstraps AI Brain state for a specific user and home.
   */
  static getInitialState(
    userId: string,
    homeId: string,
    existingDetections: Detection[],
    existingIncidents: Incident[],
    cameras: Camera[],
    zones: Zone[],
    trustedPeople: TrustedPerson[],
    securityMode: SecurityMode
  ): AIBrainState {
    const storageKey = `sanjaya_aibrain_${userId}_${homeId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.events && parsed.status) {
          // Keep status up to date with live security mode
          parsed.status.currentSecurityMode = securityMode;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('AIBrainManager: Failed to parse saved brain state:', err);
    }

    // Seed events from existing detections and incidents
    const seededEvents: SecurityEvent[] = existingDetections.map((det) => ({
      id: `sec-evt-${det.id}`,
      userId,
      homeId,
      sourceType: 'camera',
      sourceId: det.camera_id,
      sourceName: det.camera_name || 'Camera',
      zoneName: det.zone,
      timestamp: det.detected_at,
      eventType: det.category === 'package' ? 'package' : (det.person_type === 'known' ? 'arrival' : 'motion'),
      personType: det.person_type,
      personId: det.person_id,
      personName: det.person_name,
      securityModeAtTime: securityMode,
      snapshotUrl: det.snapshot_url,
      dwellTimeSeconds: det.dwell_time_seconds,
      metadata: { confidence: det.confidence },
    }));

    // Seed initial analyses
    const seededAnalyses: AIAnalysis[] = seededEvents.map((evt) => {
      const isKnown = evt.personType === 'known' || !!evt.personName;
      const severity: AISeverity = isKnown ? 'normal' : (evt.dwellTimeSeconds && evt.dwellTimeSeconds > 60 ? 'attention' : 'info');
      return {
        eventId: evt.id,
        homeId,
        userId,
        timestamp: evt.timestamp,
        severity,
        classification: isKnown ? 'family_arrival' : 'routine_motion',
        summary: isKnown 
          ? `${evt.personName || 'Family member'} arrived at ${evt.zoneName || 'Entrance'}.`
          : `Motion detected in ${evt.zoneName || 'Entrance'}.`,
        reasoning: isKnown 
          ? `Verified trusted member recognized during ${securityMode} mode.`
          : `Motion logged in perimeter zone under baseline conditions.`,
        recommendedActions: isKnown ? ['View camera', 'Mark verified'] : ['Dismiss', 'View camera'],
        status: 'processed',
        createdAt: evt.timestamp,
        sourceDetails: {
          cameraName: evt.sourceName,
          zoneName: evt.zoneName,
          personName: evt.personName,
          securityMode,
        },
      };
    });

    const initialSummary: DailyAISummary = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      headline: 'Everything looks normal. Monitored zones are secure.',
      totalEvents: seededEvents.length,
      normalCount: seededEvents.filter(e => e.personType === 'known').length,
      routineMotionCount: seededEvents.filter(e => e.personType !== 'known').length,
      attentionCount: 0,
      criticalCount: 0,
      detailedParagraph: `Your home recorded ${seededEvents.length} events today. Activity was within routine family and perimeter movement parameters.`,
    };

    const initialInsights = SanjayaAIService.generateDailyInsights(seededEvents, {
      securityMode,
      trustedPeople,
      cameras,
      zones,
    });

    const initialStatus: AIBrainStatus = {
      isActive: true,
      monitoringStatus: 'Continuous Multi-Zone Guard Active',
      lastAnalysisTime: new Date().toISOString(),
      currentSecurityMode: securityMode,
      currentHomeStatus: 'Normal',
      totalEventsAnalyzedToday: seededEvents.length,
      normalCount: seededEvents.filter(e => e.personType === 'known').length,
      infoCount: seededEvents.filter(e => e.personType !== 'known').length,
      attentionCount: 0,
      highRiskCount: 0,
      emergencyCount: 0,
      modelUsed: 'gemini-3.8-flash',
      isAiServiceAvailable: true,
      processingLatencyMs: 34,
    };

    const initialConversations: AIConversationMessage[] = [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: `Hello Bhaskar, I am the SANJAYA AI Security Brain. I continuously correlate camera telemetry, zone sensors, family arrivals, and security modes. How can I assist you with your home's security today?`,
        suggestedPrompts: [
          'What happened while I was away?',
          'Is my home secure?',
          'Show me today\'s unusual events',
          'Which zone had the most activity?',
        ],
        dataPoints: [
          { label: 'Active Cameras', value: `${cameras.length} Online` },
          { label: 'Guarded Zones', value: `${zones.length} Zones` },
          { label: 'Family Enrolled', value: `${trustedPeople.length} Members` },
        ],
      },
    ];

    const seededState: AIBrainState = {
      events: seededEvents,
      analyses: seededAnalyses,
      insights: initialInsights,
      notifications: [],
      dailySummary: initialSummary,
      status: initialStatus,
      conversation: initialConversations,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(seededState));
    } catch {
      // ignore
    }

    return seededState;
  }

  /**
   * Persists state to isolated user/home store.
   */
  static saveState(userId: string, homeId: string, state: AIBrainState): void {
    try {
      localStorage.setItem(`sanjaya_aibrain_${userId}_${homeId}`, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  /**
   * Evaluates and ingests a new raw event into the AI Brain.
   * Performs deduplication and correlation to avoid notification fatigue.
   */
  static async ingestEvent(
    rawEvent: SecurityEvent,
    currentState: AIBrainState,
    context: {
      userId: string;
      homeId: string;
      securityMode: SecurityMode;
      trustedPeople: TrustedPerson[];
      cameras: Camera[];
      zones: Zone[];
      sensors: SecuritySensor[];
      homeName?: string;
      homeownerName?: string;
    }
  ): Promise<{
    updatedState: AIBrainState;
    newNotification?: AINotification;
    isDeduplicated: boolean;
  }> {
    const now = Date.now();
    const eventTime = new Date(rawEvent.timestamp).getTime();

    // 1. Context-Aware Deduplication check (Section 4)
    // Check if there was a recent event in the same zone within 2.5 minutes
    const recentDuplicate = currentState.events.slice(0, 5).find(prev => {
      const prevTime = new Date(prev.timestamp).getTime();
      return (
        prev.zoneName === rawEvent.zoneName &&
        Math.abs(eventTime - prevTime) < 150000 && // 2.5 minutes
        prev.eventType === rawEvent.eventType
      );
    });

    // 2. Perform AI Event Analysis
    const analysis = await SanjayaAIService.analyzeSecurityEvent(rawEvent, {
      homeName: context.homeName,
      homeownerName: context.homeownerName,
      securityMode: context.securityMode,
      trustedPeople: context.trustedPeople,
      cameras: context.cameras,
      zones: context.zones,
      recentEvents: currentState.events.slice(0, 10),
    });

    let newNotification: AINotification | undefined;
    let isDeduplicated = false;

    if (recentDuplicate) {
      // Correlate into single meaningful insight notification
      isDeduplicated = true;
      const combinedMessage = `Repeated activity detected in ${rawEvent.zoneName || 'perimeter'} while ${context.securityMode.toUpperCase()} Mode is active.`;
      
      newNotification = {
        id: `ainotif-dedup-${now}`,
        userId: context.userId,
        homeId: context.homeId,
        eventId: rawEvent.id,
        title: `Repeated Activity in ${rawEvent.zoneName || 'Entrance'}`,
        message: combinedMessage,
        severity: analysis.severity === 'normal' ? 'info' : analysis.severity,
        timestamp: new Date().toISOString(),
        read: false,
        actions: [
          { label: 'View Camera', actionKey: 'view_camera', payload: { cameraId: rawEvent.sourceId } },
          { label: 'View Event', actionKey: 'view_event', payload: { eventId: rawEvent.id } },
          { label: 'Mark Safe', actionKey: 'mark_safe', payload: { eventId: rawEvent.id } },
        ],
      };
    } else {
      // Normal or distinct smart notification
      const actions: AINotification['actions'] = [
        { label: 'View Camera', actionKey: 'view_camera', payload: { cameraId: rawEvent.sourceId } },
        { label: 'View Event', actionKey: 'view_event', payload: { eventId: rawEvent.id } },
      ];

      if (analysis.severity === 'attention' || analysis.severity === 'high') {
        actions.push({ label: 'Mark Safe', actionKey: 'mark_safe', payload: { eventId: rawEvent.id } });
        actions.push({ label: 'Notify Family', actionKey: 'notify_family', payload: { eventId: rawEvent.id } });
      } else {
        actions.push({ label: 'Dismiss', actionKey: 'dismiss', payload: { eventId: rawEvent.id } });
      }

      newNotification = {
        id: `ainotif-${now}`,
        userId: context.userId,
        homeId: context.homeId,
        eventId: rawEvent.id,
        title: analysis.classification === 'family_arrival' 
          ? `Family Arrival: ${rawEvent.personName || 'Member'}`
          : analysis.classification === 'device_tamper'
          ? 'Device Tamper Alert'
          : `Activity: ${rawEvent.zoneName || 'Entrance'}`,
        message: analysis.summary,
        severity: analysis.severity,
        timestamp: new Date().toISOString(),
        read: false,
        actions,
      };
    }

    const updatedEvents = [rawEvent, ...currentState.events].slice(0, 50);
    const updatedAnalyses = [analysis, ...currentState.analyses].slice(0, 50);
    const updatedNotifications = newNotification 
      ? [newNotification, ...currentState.notifications].slice(0, 30)
      : currentState.notifications;

    // Recalculate status
    const attentionTotal = updatedAnalyses.filter(a => a.severity === 'attention').length;
    const highRiskTotal = updatedAnalyses.filter(a => a.severity === 'high').length;
    const emergencyTotal = updatedAnalyses.filter(a => a.severity === 'emergency').length;

    let currentHomeStatus: AIBrainStatus['currentHomeStatus'] = 'Normal';
    if (emergencyTotal > 0) currentHomeStatus = 'Emergency';
    else if (highRiskTotal > 0) currentHomeStatus = 'High Risk';
    else if (attentionTotal > 0) currentHomeStatus = 'Attention Required';
    else if (updatedEvents.some(e => e.personType !== 'known')) currentHomeStatus = 'Informational';

    const updatedStatus: AIBrainStatus = {
      ...currentState.status,
      currentSecurityMode: context.securityMode,
      currentHomeStatus,
      lastAnalysisTime: new Date().toISOString(),
      totalEventsAnalyzedToday: updatedEvents.length,
      normalCount: updatedAnalyses.filter(a => a.severity === 'normal').length,
      infoCount: updatedAnalyses.filter(a => a.severity === 'info').length,
      attentionCount: attentionTotal,
      highRiskCount: highRiskTotal,
      emergencyCount: emergencyTotal,
    };

    // Recalculate insights periodically
    const updatedInsights = SanjayaAIService.generateDailyInsights(updatedEvents, {
      securityMode: context.securityMode,
      trustedPeople: context.trustedPeople,
      cameras: context.cameras,
      zones: context.zones,
    });

    const updatedState: AIBrainState = {
      ...currentState,
      events: updatedEvents,
      analyses: updatedAnalyses,
      insights: updatedInsights,
      notifications: updatedNotifications,
      status: updatedStatus,
    };

    this.saveState(context.userId, context.homeId, updatedState);

    return {
      updatedState,
      newNotification,
      isDeduplicated,
    };
  }
}
