import { SecurityMode } from './index';

export type AISeverity = 'normal' | 'info' | 'attention' | 'high' | 'emergency';

export type AIClassification = 
  | 'routine_motion' 
  | 'family_arrival' 
  | 'trusted_visitor' 
  | 'unusual_activity' 
  | 'loitering' 
  | 'package_delivery' 
  | 'device_tamper' 
  | 'perimeter_breach' 
  | 'emergency_sos'
  | 'camera_health';

export interface SecurityEvent {
  id: string;
  userId: string;
  homeId: string;
  sourceType: 'camera' | 'sensor' | 'manual' | 'system';
  sourceId: string;
  sourceName: string;
  zoneId?: string;
  zoneName?: string;
  timestamp: string;
  eventType: string;
  personType?: 'known' | 'unknown';
  personId?: string;
  personName?: string;
  securityModeAtTime: SecurityMode;
  snapshotUrl?: string;
  dwellTimeSeconds?: number;
  metadata?: Record<string, unknown>;
}

export type AIEvent = SecurityEvent;

export interface AIAnalysis {
  eventId: string;
  homeId: string;
  userId: string;
  timestamp: string;
  severity: AISeverity;
  classification: AIClassification;
  summary: string;
  reasoning: string;
  recommendedActions: string[];
  status: 'processed' | 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  sourceDetails?: {
    cameraName?: string;
    zoneName?: string;
    personName?: string;
    securityMode?: SecurityMode;
  };
}

export interface AIInsight {
  id: string;
  homeId: string;
  userId: string;
  type: 'zone_activity' | 'unusual_frequency' | 'camera_health' | 'mode_behavior' | 'family_pattern' | 'night_activity';
  title: string;
  observation: string;
  confidence: number;
  timestamp: string;
  severity: AISeverity;
  suggestedAction?: string;
}

export interface AINotificationAction {
  label: string;
  actionKey: 'view_event' | 'view_camera' | 'dismiss' | 'mark_safe' | 'notify_family';
  payload?: Record<string, unknown>;
}

export interface AINotification {
  id: string;
  userId: string;
  homeId: string;
  eventId?: string;
  title: string;
  message: string;
  severity: AISeverity;
  timestamp: string;
  read: boolean;
  actions: AINotificationAction[];
}

export interface AIConversationMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
  dataPoints?: Array<{ label: string; value: string }>;
  referencedEventIds?: string[];
}

export interface AIConversation {
  id: string;
  userId: string;
  homeId: string;
  messages: AIConversationMessage[];
  updatedAt: string;
}

export interface AIBrainStatus {
  isActive: boolean;
  monitoringStatus: string;
  lastAnalysisTime: string;
  currentSecurityMode: SecurityMode;
  currentHomeStatus: 'Normal' | 'Informational' | 'Attention Required' | 'High Risk' | 'Emergency';
  totalEventsAnalyzedToday: number;
  normalCount: number;
  infoCount: number;
  attentionCount: number;
  highRiskCount: number;
  emergencyCount: number;
  modelUsed: string;
  isAiServiceAvailable: boolean;
  processingLatencyMs: number;
}

export interface DailyAISummary {
  date: string;
  headline: string;
  totalEvents: number;
  normalCount: number;
  routineMotionCount: number;
  attentionCount: number;
  criticalCount: number;
  detailedParagraph: string;
  highlightEvent?: {
    summary: string;
    zone: string;
    time: string;
    severity: AISeverity;
  };
}

export type DecisionType = 'OBSERVE' | 'INFORM' | 'WARN' | 'ESCALATE' | 'EMERGENCY_RESPONSE';

export type MovementType = 
  | 'walking_past' 
  | 'approaching' 
  | 'waiting' 
  | 'pacing' 
  | 'loitering' 
  | 'leaving' 
  | 'returning' 
  | 'stationary';

export interface BehaviourContext {
  movement: MovementType;
  dwellTimeSeconds: number;
  doorInteraction: boolean;
  windowInteraction: boolean;
  restrictedZoneEntry: boolean;
  repeatedApproachesCount: number;
  isNightActivity: boolean;
  isAbnormal: boolean;
  tags: string[];
}

export interface SensorFusionContext {
  pirMotionActive: boolean;
  doorSensorState: 'closed' | 'open' | 'tamper' | 'none';
  windowSensorState: 'closed' | 'open' | 'tamper' | 'none';
  cameraHealthStatus: 'online' | 'offline' | 'tampered' | 'obstructed';
  otherSensorsTriggered: string[];
  crossCameraTrackId?: string;
}

export interface MultiSourceContext {
  identity: {
    isKnown: boolean;
    personId?: string;
    personName?: string;
    relationship?: string;
    isRestricted?: boolean;
    confidence: number;
    rawEmbeddingMatch: boolean;
  };
  camera: {
    id: string;
    name: string;
    location: string;
    status: string;
    isSimulation: boolean;
  };
  zone: {
    id: string;
    name: string;
    sensitivity: 'low' | 'medium' | 'high';
    type: string;
    isMonitored: boolean;
  };
  securityMode: SecurityMode;
  homeownerStatus: 'home' | 'away';
  timeOfDay: {
    hour: number;
    isNight: boolean;
    period: 'morning' | 'day' | 'evening' | 'late_night';
  };
  behaviour: BehaviourContext;
  sensorFusion: SensorFusionContext;
  crossCameraPath: Array<{
    cameraId: string;
    cameraName: string;
    zoneName: string;
    timestamp: string;
    dwellSeconds?: number;
  }>;
  historyCorrelation: {
    previousIncidentsCount: number;
    repeatedVisitorToday: boolean;
    lastSeenSecondsAgo?: number;
  };
  falsePositiveCheck: {
    isPotentialShadowOrLighting: boolean;
    isDeliveryParcel: boolean;
    isSingleFrame: boolean;
    passedFilter: boolean;
  };
}

export interface RiskEngineOutput {
  calculatedRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0 - 100
  trend: 'increasing' | 'stable' | 'decreasing';
  riskFactors: string[];
  mitigatingFactors: string[];
  reasoning: string;
}

export interface DecisionEngineOutput {
  decision: DecisionType;
  confidence: number;
  decisionRationale: string;
  explainableReasons: string[];
  recommendedActions: string[];
  requiresHumanConfirmation: boolean;
}

export interface ResponseEngineOutput {
  actionsDispatched: string[];
  notificationCreated?: AINotification;
  incidentAction: 'none' | 'created' | 'updated';
  incidentId?: string;
  sosTriggered: boolean;
  alertTonePlayed: boolean;
  audioDeterrentActive: boolean;
  timelineEntryCreated: boolean;
  summaryText: string;
}

export interface DecisionPipelineExecution {
  id: string;
  timestamp: string;
  context: MultiSourceContext;
  risk: RiskEngineOutput;
  decision: DecisionEngineOutput;
  response: ResponseEngineOutput;
  stages: {
    see: string;
    understand: string;
    context: string;
    risk: string;
    decide: string;
    respond: string;
    remember: string;
  };
}

export interface AIBrainState {
  status: AIBrainStatus;
  events: SecurityEvent[];
  analyses: AIAnalysis[];
  insights: AIInsight[];
  notifications: AINotification[];
  conversation: AIConversationMessage[];
  dailySummary: DailyAISummary;
  recentDecisions?: DecisionPipelineExecution[];
}

