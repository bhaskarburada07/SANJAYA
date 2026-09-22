export type PersonType = 'known' | 'unknown';
export type IncidentType = 'unknown_detection' | 'sos_activated' | 'manual_alarm' | 'unusual_behaviour' | 'restricted_zone_entry' | 'device_tamper';
export type IncidentStatus = 'active' | 'escalated' | 'cancelled' | 'resolved';
export type CameraStatus = 'online' | 'offline' | 'disabled' | 'tampered';
export type NotificationType = 'security' | 'system' | 'emergency';

export type SecurityMode = 'home' | 'away' | 'night';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EventClassification = 'NORMAL' | 'IMPORTANT' | 'UNUSUAL' | 'CRITICAL';
export type DetectionCategory = 
  | 'person' 
  | 'vehicle' 
  | 'pet' 
  | 'package' 
  | 'fire' 
  | 'glass_break' 
  | 'door_motion' 
  | 'loitering';

export type PersonRole = 'owner' | 'family' | 'regular_visitor' | 'service_delivery' | 'restricted' | 'unknown';

export interface UserProfile {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  phone: string;
  home_name?: string;
  home_address?: string;
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
}

export interface TrustedPerson {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone?: string;
  notes?: string;
  photo_url?: string;
  face_reference?: string;
  role?: PersonRole;
  allowed_zones?: string[];
  restricted_zones?: string[];
  expected_time_start?: string;
  expected_time_end?: string;
  is_restricted?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Camera {
  id: string;
  user_id: string;
  name: string;
  location: string;
  zone?: string;
  brand?: string;
  camera_type?: 'dome' | 'bullet' | 'doorbell' | 'ptz';
  connection_type?: 'wifi' | 'onvif' | 'rtsp' | 'sanjaya_cam';
  stream_url?: string;
  status: CameraStatus;
  is_simulation: boolean;
  is_tampered?: boolean;
  tamper_reason?: string;
  siren_active?: boolean;
  spotlight_active?: boolean;
  is_recording?: boolean;
  recording_seconds?: number;
  created_at: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  id: string;
  camera_id: string;
  camera_name?: string;
  user_id: string;
  person_type: PersonType;
  person_name?: string;
  person_id?: string;
  confidence: number;
  zone: string;
  category?: DetectionCategory;
  dwell_time_seconds?: number;
  risk_level?: RiskLevel;
  snapshot_url: string;
  detected_at: string;
  bounding_box?: BoundingBox;
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship?: string;
  priority: number; // 1, 2, 3...
  created_at: string;
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'detection' | 'classification' | 'viewed' | 'sos' | 'escalated' | 'cancelled' | 'resolved' | 'deter' | 'sensor';
  camera_name?: string;
  zone?: string;
}

export interface BehaviorStep {
  id: string;
  timestamp: string;
  action: string;
  zone: string;
  dwell_seconds?: number;
}

export interface CrossCameraPathPoint {
  camera_id: string;
  camera_name: string;
  timestamp: string;
  zone: string;
  snapshot_url?: string;
  dwell_seconds?: number;
}

export interface Zone {
  id: string;
  name: string;
  type: 'entrance' | 'living' | 'backyard' | 'perimeter' | 'bedroom' | 'garage';
  sensitivity: 'low' | 'medium' | 'high';
  privacy_level: 'standard' | 'high_privacy';
  is_monitored: boolean;
  camera_ids: string[];
  sensor_ids: string[];
  allowed_roles?: PersonRole[];
  notes?: string;
}

export interface SecuritySensor {
  id: string;
  name: string;
  zone: string;
  type: 'pir_motion' | 'door_window' | 'radar_mmwave' | 'smart_lock' | 'smoke_detector';
  status: 'clear' | 'triggered' | 'open' | 'closed' | 'tampered';
  battery_percent: number;
  last_activity: string;
}

export interface Incident {
  id: string;
  user_id: string;
  detection_id?: string;
  detection?: Detection;
  camera_id?: string;
  person_id?: string;
  type: IncidentType;
  status: IncidentStatus;
  latitude?: number;
  longitude?: number;
  location_address?: string;
  notes?: string;
  started_at: string;
  resolved_at?: string;
  timeline: IncidentTimelineEvent[];
  // Intelligence Extensions
  risk_level?: RiskLevel;
  risk_factors?: string[];
  ai_explanation?: string;
  who?: string;
  where?: string;
  when?: string;
  what?: string;
  dwell_time_seconds?: number;
  home_mode_at_time?: SecurityMode;
  behaviour_sequence?: BehaviorStep[];
  camera_path?: CrossCameraPathPoint[];
  sensors_triggered?: string[];
  recommended_actions?: string[];
  classification?: EventClassification;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  category?: 'security' | 'system' | 'emergency';
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type NotificationItem = AppNotification;

export interface DailySecurityBrief {
  date: string;
  overall_status: 'secure' | 'attention_required' | 'critical';
  headline: string;
  normal_events_count: number;
  deliveries_count: number;
  family_arrivals_count: number;
  critical_incidents_count: number;
  highlights: string[];
  unusual_activity_summary: string;
}

export interface DeviceHealthItem {
  id: string;
  device_name: string;
  device_type: 'camera' | 'sensor' | 'hub';
  status: 'healthy' | 'warning' | 'tampered' | 'offline';
  zone?: string;
  details: string;
  battery_percent?: number;
  last_ping: string;
}

export interface SecurityTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  classification: EventClassification;
  zone: string;
  camera_name?: string;
  risk_level?: RiskLevel;
  snapshot_url?: string;
  incident_id?: string;
  who?: string;
  action_summary?: string;
}

export interface UserSettings {
  user_id: string;
  face_recognition_enabled: boolean;
  detection_history_days: number;
  location_sharing_sos: boolean;
  location_sharing_enabled?: boolean;
  camera_access_enabled: boolean;
  sos_countdown_seconds: number;
  alert_audio_enabled: boolean;
  indoor_monitor_mode: boolean;
  confidence_threshold: number;
  unknown_person_alert: boolean;
  snapshot_retention_days: number;
  local_storage_only: boolean;
  // Privacy Center Extensions
  ai_processing_mode: 'edge' | 'cloud' | 'hybrid';
  guest_privacy_mode: boolean;
  audio_monitoring_enabled: boolean;
  video_retention_days: number;
  tamper_alerts_enabled: boolean;
  // Emergency Escalation
  escalation_wait_minutes?: 5 | 10;
}

export interface EscalationRecord {
  id: string;
  incident_id: string;
  contact_id: string;
  contact_name: string;
  phone: string;
  status: 'sent' | 'delivered' | 'acknowledged' | 'no_response' | 'failed' | 'pending';
  dispatched_at: string;
  delivered_at?: string;
  acknowledged_at?: string;
  response_note?: string;
  payload: {
    incident_type: string;
    latitude?: number;
    longitude?: number;
    snapshot_url?: string;
    message: string;
  };
}

export interface VerifiedEmergencyService {
  name: string;
  type: 'police' | 'erss' | 'medical' | 'fire';
  helpline: string;
  address: string;
  distanceKm?: number;
  jurisdiction: string;
  verified: boolean;
  note?: string;
}

export interface EmergencyEscalationSession {
  incidentId: string;
  emergencyType: string;
  startedAt: string;
  timerDurationMinutes: 5 | 10;
  timerExpiresAt: number; // millisecond timestamp
  timerRemainingSeconds: number;
  primaryContact?: {
    id: string;
    name: string;
    phone: string;
    relationship?: string;
    priority: number;
  };
  contactNotificationStatus: 'sent' | 'delivered' | 'responded' | 'no_response';
  contactSentAt: string;
  contactDeliveredAt?: string;
  contactRespondedAt?: string;
  escalationStatus: 
    | 'waiting_contact_response' 
    | 'contact_responded' 
    | 'contact_no_response' 
    | 'secondary_escalating' 
    | 'secondary_manual_action_required'
    | 'secondary_escalated'
    | 'resolved';
  userLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: 'device_gps' | 'home_profile';
    capturedAt: string;
  };
  nearestEmergencyService?: VerifiedEmergencyService;
  integrationStatus?: {
    providerName: string;
    status: 'unsupported_in_region' | 'failed' | 'submitted' | 'pending';
    message: string;
    supported: boolean;
  };
  dispatchPackage?: {
    userName: string;
    currentLocation: string;
    gpsCoordinates: string;
    emergencyType: string;
    emergencyTime: string;
    incidentDetails: string;
    contactStatus: string;
    elapsedTimeFormatted: string;
    fullSummary: string;
  };
  history: {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    stage: 'primary_contact' | 'timer' | 'contact_response' | 'secondary_escalation' | 'resolution';
  }[];
}

export * from './aiBrain';
