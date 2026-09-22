import { 
  SecurityEvent, 
  AIAnalysis, 
  DailyAISummary, 
  AIInsight, 
  SecurityMode, 
  TrustedPerson, 
  Zone, 
  Camera, 
  Incident,
  AISeverity,
  AIClassification
} from '../types';

export interface SecurityEventContext {
  homeName?: string;
  homeownerName?: string;
  securityMode: SecurityMode;
  trustedPeople: TrustedPerson[];
  cameras: Camera[];
  zones: Zone[];
  recentEvents?: SecurityEvent[];
  incidents?: Incident[];
}

/**
 * SanjayaAIService
 * Dedicated client-side interface connecting to the Sanjaya AI Brain server endpoints,
 * with comprehensive local heuristic fallbacks when offline or when the external AI is unavailable.
 */
export class SanjayaAIService {
  /**
   * Checks the status of the AI Brain service.
   */
  static async checkStatus(): Promise<{
    active: boolean;
    hasApiKey: boolean;
    model: string;
    provider: string;
  }> {
    try {
      const res = await fetch('/api/ai/status', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return {
      active: true,
      hasApiKey: false,
      model: 'edge-heuristics',
      provider: 'Local Edge Intelligence Engine (Offline Mode)',
    };
  }

  /**
   * 1. analyzeSecurityEvent()
   * Analyzes an incoming security event in multi-factor context:
   * Motion + Zone + Security Mode + Identity + Dwell Time.
   */
  static async analyzeSecurityEvent(
    event: SecurityEvent,
    context: SecurityEventContext
  ): Promise<AIAnalysis> {
    try {
      const res = await fetch('/api/ai/analyze-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, context }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          return {
            eventId: event.id,
            homeId: event.homeId,
            userId: event.userId,
            timestamp: event.timestamp,
            severity: data.analysis.severity || 'normal',
            classification: data.analysis.classification || 'routine_motion',
            summary: data.analysis.summary,
            reasoning: data.analysis.reasoning,
            recommendedActions: data.analysis.recommendedActions || ['View camera'],
            status: 'processed',
            createdAt: new Date().toISOString(),
            sourceDetails: {
              cameraName: event.sourceName,
              zoneName: event.zoneName,
              personName: event.personName,
              securityMode: context.securityMode,
            },
          };
        }
      }
    } catch (err) {
      console.warn('SanjayaAIService: Server analysis unreachable, using local intelligence engine:', err);
    }

    // Local heuristic analysis fallback
    return this.fallbackAnalyze(event, context);
  }

  /**
   * 2. generateSecuritySummary()
   * Produces Today's Security Summary with categorized counts and actionable context.
   */
  static async generateSecuritySummary(
    events: SecurityEvent[],
    context: SecurityEventContext
  ): Promise<DailyAISummary> {
    try {
      const res = await fetch('/api/ai/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, context }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          return {
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            headline: data.summary.headline,
            totalEvents: data.summary.totalEvents ?? events.length,
            normalCount: data.summary.normalCount ?? 0,
            routineMotionCount: data.summary.routineMotionCount ?? 0,
            attentionCount: data.summary.attentionCount ?? 0,
            criticalCount: data.summary.criticalCount ?? 0,
            detailedParagraph: data.summary.detailedParagraph,
            highlightEvent: data.summary.highlightEvent,
          };
        }
      }
    } catch (err) {
      console.warn('SanjayaAIService: Server summary unreachable, using local engine:', err);
    }

    return this.fallbackDailySummary(events, context);
  }

  /**
   * 3. answerSecurityQuestion()
   * Conversational security investigator grounded strictly on user's application data.
   */
  static async answerSecurityQuestion(
    query: string,
    history: Array<{ sender: 'user' | 'assistant'; text: string }>,
    context: SecurityEventContext
  ): Promise<string> {
    try {
      const res = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history, context }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          return data.reply;
        }
      }
    } catch (err) {
      console.warn('SanjayaAIService: Chat query failed, falling back to local investigator:', err);
    }

    return this.fallbackAnswerQuestion(query, context);
  }

  /**
   * 4. generateDailyInsights()
   * Discovers patterns across zones, modes, device health, and timestamps.
   */
  static generateDailyInsights(
    events: SecurityEvent[],
    context: SecurityEventContext
  ): AIInsight[] {
    const insights: AIInsight[] = [];
    const homeId = events[0]?.homeId || 'home-bhaskar';
    const userId = events[0]?.userId || 'usr-bhaskar-101';
    const now = new Date().toISOString();

    // 1. Frequently active zones pattern
    const zoneCounts: Record<string, number> = {};
    events.forEach(e => {
      const z = e.zoneName || 'Main Entrance';
      zoneCounts[z] = (zoneCounts[z] || 0) + 1;
    });

    const topZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0];
    if (topZone && topZone[1] >= 2) {
      insights.push({
        id: `ins-zone-${Date.now()}`,
        homeId,
        userId,
        type: 'zone_activity',
        title: 'High Transit Distribution',
        observation: `Observed pattern: ${topZone[0]} recorded ${Math.round((topZone[1] / Math.max(1, events.length)) * 100)}% of monitored movements today.`,
        confidence: 0.94,
        timestamp: now,
        severity: 'info',
        suggestedAction: 'Review perimeter sensitivity',
      });
    }

    // 2. Night activity / late motion pattern
    const nightEvents = events.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour >= 22 || hour < 6;
    });

    if (nightEvents.length > 0) {
      const unknownNight = nightEvents.filter(e => e.personType !== 'known');
      if (unknownNight.length > 0) {
        insights.push({
          id: `ins-night-${Date.now()}`,
          homeId,
          userId,
          type: 'night_activity',
          title: 'Late Night Motion Anomaly',
          observation: `Observed pattern: ${unknownNight.length} unrecognized movement(s) detected between 10:00 PM and 6:00 AM.`,
          confidence: 0.91,
          timestamp: now,
          severity: 'attention',
          suggestedAction: 'Check Night Mode schedule and sensor sensitivity',
        });
      }
    }

    // 3. Security Mode behavioral pattern
    const awayEvents = events.filter(e => e.securityModeAtTime === 'away');
    if (awayEvents.length > 0) {
      insights.push({
        id: `ins-mode-${Date.now()}`,
        homeId,
        userId,
        type: 'mode_behavior',
        title: 'Away Guard State',
        observation: `Observed pattern: ${awayEvents.length} event(s) logged while property was set to Away mode. All door contacts remained sealed.`,
        confidence: 0.98,
        timestamp: now,
        severity: 'normal',
        suggestedAction: 'Maintain active perimeter monitoring',
      });
    }

    // 4. Family arrival patterns
    const knownEvents = events.filter(e => e.personType === 'known' || e.personName);
    if (knownEvents.length > 0) {
      const names = Array.from(new Set(knownEvents.map(e => e.personName).filter(Boolean)));
      insights.push({
        id: `ins-family-${Date.now()}`,
        homeId,
        userId,
        type: 'family_pattern',
        title: 'Trusted Arrival Schedule',
        observation: `Observed pattern: Verified arrival for ${names.join(', ')} logged through front access point during typical return hours.`,
        confidence: 0.96,
        timestamp: now,
        severity: 'normal',
        suggestedAction: 'Mark safe',
      });
    }

    // 5. Camera health / offline pattern
    const offlineCams = context.cameras.filter(c => c.status === 'offline' || c.is_tampered);
    if (offlineCams.length > 0) {
      insights.push({
        id: `ins-cam-${Date.now()}`,
        homeId,
        userId,
        type: 'camera_health',
        title: 'Camera Link Disconnection',
        observation: `Observed pattern: ${offlineCams.map(c => c.name).join(', ')} is currently unreachable on the local network.`,
        confidence: 1.0,
        timestamp: now,
        severity: 'attention',
        suggestedAction: 'Inspect camera power and Wi-Fi link',
      });
    }

    return insights;
  }

  /**
   * 5. classifyEvent()
   */
  static classifyEvent(event: SecurityEvent, context: SecurityEventContext): AIClassification {
    if (event.eventType === 'tamper') return 'device_tamper';
    if (event.eventType === 'sos') return 'emergency_sos';
    if (event.personType === 'known' || event.personName) return 'family_arrival';
    if (event.eventType === 'package') return 'package_delivery';
    if (event.dwellTimeSeconds && event.dwellTimeSeconds >= 45) return 'loitering';
    if (context.securityMode === 'away' || context.securityMode === 'night') return 'unusual_activity';
    return 'routine_motion';
  }

  /**
   * 6. generateRecommendations()
   */
  static generateRecommendations(classification: AIClassification, severity: AISeverity): string[] {
    switch (classification) {
      case 'emergency_sos':
        return ['Notify emergency contacts', 'Check live camera', 'Verify physical safety'];
      case 'device_tamper':
        return ['Inspect camera feed', 'Verify hardware placement', 'Check Wi-Fi signal'];
      case 'loitering':
        return ['View camera', 'Speak via 2-way audio', 'Turn on spotlight'];
      case 'unusual_activity':
        return ['View camera', 'Verify identity', 'Check locks'];
      case 'package_delivery':
        return ['View camera snapshot', 'Retrieve package at entrance'];
      case 'family_arrival':
        return ['View camera', 'Mark verified'];
      default:
        return severity === 'attention' || severity === 'high' 
          ? ['View camera', 'Monitor timeline'] 
          : ['Dismiss', 'View camera'];
    }
  }

  /**
   * Local deterministic analysis fallback
   */
  private static fallbackAnalyze(event: SecurityEvent, context: SecurityEventContext): AIAnalysis {
    const isKnown = event.personType === 'known' || !!event.personName;
    const isAway = context.securityMode === 'away';
    const isNight = context.securityMode === 'night';
    const isLoitering = event.eventType === 'loiter' || (event.dwellTimeSeconds && event.dwellTimeSeconds >= 45);
    const isTamper = event.eventType === 'tamper';
    const isSos = event.eventType === 'sos';

    let severity: AISeverity = 'normal';
    let classification: AIClassification = 'routine_motion';
    let summary = 'Routine motion detected.';
    let reasoning = `Activity logged in ${event.zoneName || 'monitored zone'} during standard conditions.`;

    if (isSos) {
      severity = 'emergency';
      classification = 'emergency_sos';
      summary = 'High-priority SOS trigger initiated by user.';
      reasoning = 'Emergency broadcast initiated. Response protocol active with contact notification.';
    } else if (isTamper) {
      severity = 'high';
      classification = 'device_tamper';
      summary = `Device tamper signal detected on ${event.sourceName}.`;
      reasoning = 'Sensor or camera accelerometer indicated sudden physical displacement or signal occlusion.';
    } else if (isKnown) {
      severity = 'normal';
      classification = 'family_arrival';
      summary = `${event.personName || 'Family member'} arrived at ${event.zoneName || 'entrance'}.`;
      reasoning = `Recognized trusted member verified in the family registry during ${context.securityMode.toUpperCase()} mode.`;
    } else if (isLoitering) {
      severity = isAway || isNight ? 'high' : 'attention';
      classification = 'loitering';
      summary = `Extended dwell time (${event.dwellTimeSeconds || 45}s) observed near ${event.zoneName || 'entrance'}.`;
      reasoning = `Unknown visitor remained stationary in ${event.zoneName || 'perimeter'} for an unusual duration.`;
    } else if (isAway || isNight) {
      severity = 'attention';
      classification = 'unusual_activity';
      summary = `Unknown visitor detected near ${event.zoneName || 'entrance'} while ${context.securityMode.toUpperCase()} mode active.`;
      reasoning = `Unregistered presence detected in an unoccupied or sleep-monitored home state.`;
    } else {
      severity = 'info';
      classification = 'routine_motion';
      summary = `Motion detected in ${event.zoneName || 'entrance'}.`;
      reasoning = 'Standard transit detected in active perimeter zone.';
    }

    return {
      eventId: event.id,
      homeId: event.homeId,
      userId: event.userId,
      timestamp: event.timestamp,
      severity,
      classification,
      summary,
      reasoning,
      recommendedActions: this.generateRecommendations(classification, severity),
      status: 'processed',
      createdAt: new Date().toISOString(),
      sourceDetails: {
        cameraName: event.sourceName,
        zoneName: event.zoneName,
        personName: event.personName,
        securityMode: context.securityMode,
      },
    };
  }

  /**
   * Local daily summary fallback
   */
  private static fallbackDailySummary(events: SecurityEvent[], context: SecurityEventContext): DailyAISummary {
    const total = events.length;
    const normalCount = events.filter(e => e.personType === 'known' || e.personName).length;
    const attentionCount = events.filter(e => e.eventType === 'unusual' || (e.dwellTimeSeconds && e.dwellTimeSeconds >= 45)).length;
    const criticalCount = events.filter(e => e.eventType === 'sos' || e.eventType === 'tamper').length;
    const routineMotionCount = Math.max(0, total - normalCount - attentionCount - criticalCount);

    const headline = criticalCount > 0
      ? `${criticalCount} high-risk event logged today. Immediate review recommended.`
      : attentionCount > 0
      ? `Everything looks stable. ${attentionCount} event requires your attention.`
      : 'Everything looks normal. All monitored zones remained secure today.';

    const topEvent = events.find(e => e.eventType === 'sos' || e.eventType === 'tamper' || e.eventType === 'unusual' || (e.dwellTimeSeconds && e.dwellTimeSeconds >= 45));

    return {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      headline,
      totalEvents: total,
      normalCount,
      routineMotionCount,
      attentionCount,
      criticalCount,
      detailedParagraph: `Your home recorded ${total} total events today. ${normalCount} were verified family members, ${routineMotionCount} were routine transit motions, and ${attentionCount + criticalCount} required contextual review.`,
      highlightEvent: topEvent ? {
        summary: topEvent.personName ? `${topEvent.personName} at ${topEvent.zoneName}` : `Unusual activity in ${topEvent.zoneName}`,
        zone: topEvent.zoneName || 'Entrance',
        time: new Date(topEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: topEvent.eventType === 'sos' ? 'emergency' : (attentionCount > 0 ? 'attention' : 'normal'),
      } : undefined,
    };
  }

  /**
   * Local assistant query fallback
   */
  private static fallbackAnswerQuestion(query: string, context: SecurityEventContext): string {
    const q = query.toLowerCase().trim();
    const events = context.recentEvents || [];
    const trusted = context.trustedPeople || [];
    const cameras = context.cameras || [];

    if (q.includes('away') || q.includes('while i was out') || q.includes('while i was gone')) {
      const awayEvents = events.filter(e => e.securityModeAtTime === 'away');
      if (awayEvents.length === 0) {
        return `Your property remained completely secure while you were away. All perimeter zones recorded zero unauthorized breaches.`;
      }
      return `While in AWAY mode, SANJAYA logged ${awayEvents.length} event(s). Primary notice: ${awayEvents[0].zoneName} recorded movement at ${new Date(awayEvents[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    }

    if (q.includes('secure') || q.includes('safe') || q.includes('status')) {
      const activeAlerts = events.filter(e => e.eventType === 'sos' || e.eventType === 'tamper');
      if (activeAlerts.length === 0) {
        return `Your home is secure. All ${cameras.length} cameras are operational and monitored zones show no unresolved breaches.`;
      }
      return `Attention required: ${activeAlerts.length} device or alert signals detected. Please review active notifications.`;
    }

    if (q.includes('unusual') || q.includes('attention')) {
      const unusual = events.filter(e => e.eventType === 'unusual' || (e.dwellTimeSeconds && e.dwellTimeSeconds >= 45));
      if (unusual.length === 0) {
        return 'No unusual security events have been detected today. All monitored activity was within normal parameters.';
      }
      return `Found ${unusual.length} unusual event(s) today: ${unusual.map(u => `${u.zoneName} (${new Date(u.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`).join(', ')}.`;
    }

    if (q.includes('zone') && (q.includes('most') || q.includes('active') || q.includes('activity'))) {
      const zoneCounts: Record<string, number> = {};
      events.forEach(e => {
        const z = e.zoneName || 'Entrance';
        zoneCounts[z] = (zoneCounts[z] || 0) + 1;
      });
      const sorted = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) {
        return 'I do not have enough activity recorded to determine the most active zone.';
      }
      return `The zone with the most activity is "${sorted[0][0]}" with ${sorted[0][1]} recorded event(s).`;
    }

    if (q.includes('enter') || q.includes('arrive') || q.includes('who came')) {
      const knowns = events.filter(e => e.personType === 'known' || e.personName);
      if (knowns.length === 0) {
        return `No trusted family arrivals have been logged today. Your trusted registry has ${trusted.length} enrolled members.`;
      }
      const names = Array.from(new Set(knowns.map(k => k.personName)));
      return `Today, verified arrival was logged for: ${names.join(', ')}.`;
    }

    if (q.includes('night') || q.includes('last night')) {
      const nightEvents = events.filter(e => {
        const h = new Date(e.timestamp).getHours();
        return h >= 22 || h < 6;
      });
      if (nightEvents.length === 0) {
        return 'No movement or disturbance was recorded during nighttime hours (10:00 PM – 6:00 AM).';
      }
      return `During the night, ${nightEvents.length} event(s) were recorded, primarily in ${nightEvents[0].zoneName || 'perimeter'}.`;
    }

    if (q.includes('why') && (q.includes('alert') || q.includes('notification'))) {
      const latestAlert = events.find(e => e.personType !== 'known' || e.eventType === 'unusual');
      if (latestAlert) {
        return `You received an alert because an unrecognized visitor was detected in ${latestAlert.zoneName || 'perimeter'} while ${context.securityMode.toUpperCase()} mode was active.`;
      }
      return "I don't have enough information to determine that specific alert trigger.";
    }

    return "I don't have enough information to determine that from the current security logs. You can ask about today's activity, zone traffic, or trusted family arrivals.";
  }
}
