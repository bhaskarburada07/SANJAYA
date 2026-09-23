import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  TrustedPerson,
  Camera,
  Detection,
  Incident,
  EmergencyContact,
  AppNotification,
  UserSettings,
  SecurityMode,
  Zone,
  SecuritySensor,
  DailySecurityBrief,
  DeviceHealthItem,
  AIBrainState,
  AIBrainStatus,
  AIAnalysis,
  AIInsight,
  AINotification,
  DailyAISummary,
  AIConversationMessage,
  SecurityEvent,
  EmergencyEscalationSession,
  DecisionPipelineExecution,
} from '../types';
import {
  INITIAL_CAMERAS,
  INITIAL_DETECTIONS,
  INITIAL_INCIDENTS,
  INITIAL_EMERGENCY_CONTACTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_ZONES,
  INITIAL_SENSORS,
  INITIAL_DAILY_BRIEF,
  INITIAL_DEVICE_HEALTH,
} from '../services/mockData';
import { supabase, realtimeBus } from '../lib/supabase';
import { CVSimulatorService } from '../services/cvSimulator';
import { SosEscalationService } from '../services/sosService';
import { EmergencyEscalationService } from '../services/emergencyEscalationService';
import { playSosBeep } from '../utils/audio';
import { useAuth } from './AuthContext';
import { trustedPeopleService } from '../services/trustedPeopleService';
import { AIBrainManager } from '../services/aiBrainManager';
import { SanjayaAIService } from '../services/sanjayaAIService';
import { SecurityHardwareAdapter, RawHardwarePayload } from '../services/hardwareAbstraction';
import { CameraObstructionService } from '../services/cameraObstructionService';
import { SanjayaDecisionSystem } from '../services/decisionSystem';


export interface ActiveAlertModalState {
  type: 'known' | 'unknown';
  detection: Detection;
  incident?: Incident;
}

interface DataContextType {
  // Collections
  trustedPeople: TrustedPerson[];
  isTrustedPeopleLoading: boolean;
  cameras: Camera[];
  detections: Detection[];
  incidents: Incident[];
  emergencyContacts: EmergencyContact[];
  notifications: AppNotification[];
  settings: UserSettings;
  zones: Zone[];
  sensors: SecuritySensor[];
  dailyBrief: DailySecurityBrief;
  deviceHealth: DeviceHealthItem[];

  // Security Mode
  securityMode: SecurityMode;
  setSecurityMode: (mode: SecurityMode) => void;
  showAwaySummaryModal: boolean;
  closeAwaySummaryModal: () => void;

  // Trusted People Actions
  refreshTrustedPeople: () => Promise<void>;
  addTrustedPerson: (person: {
    name: string;
    relationship: string;
    phone?: string;
    notes?: string;
    photo_url?: string;
    face_reference?: string;
    role?: any;
    allowed_zones?: string[];
    restricted_zones?: string[];
  }) => Promise<TrustedPerson>;
  updateTrustedPerson: (id: string, updates: Partial<TrustedPerson>) => Promise<TrustedPerson>;
  deleteTrustedPerson: (id: string) => Promise<void>;

  // Camera Actions
  addCamera: (camera: Omit<Camera, 'id' | 'user_id' | 'created_at'>) => void;
  updateCamera: (id: string, updates: Partial<Camera>) => Promise<Camera>;
  deleteCamera: (id: string) => void;
  activeCamera: Camera;
  setActiveCameraId: (id: string) => void;
  toggleSiren: (cameraId: string) => void;
  toggleSpotlight: (cameraId: string) => void;
  toggleRecording: (cameraId: string) => void;

  // Zones & Sensors Actions
  updateZone: (id: string, updates: Partial<Zone>) => void;
  updateSensor: (id: string, updates: Partial<SecuritySensor>) => void;

  // Emergency Contacts Actions
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id' | 'user_id' | 'created_at'>) => void;
  updateEmergencyContact: (id: string, updates: Partial<EmergencyContact>) => void;
  deleteEmergencyContact: (id: string) => void;

  // Incidents Actions
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;
  resolveIncident: (id: string, notes?: string) => void;

  // Notifications Actions
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => Promise<boolean>;
  clearNotifications: () => void;

  // Settings Actions
  updateSettings: (updates: Partial<UserSettings>) => void;
  clearAllDetections: () => void;
  setIndoorMonitorMode: (val: boolean) => void;

  // Alert Modal State
  activeAlertModal: Detection | null;
  setActiveAlertModal: (detection: Detection | null) => void;
  activeKnownModal: Detection | null;
  setActiveKnownModal: (detection: Detection | null) => void;
  closeAlertModal: () => void;

  // SOS State & Actions
  isSosActive: boolean;
  sosSecondsRemaining: number;
  currentSosIncident: Incident | null;
  escalationNotice: string | null;
  activateSos: () => Promise<void>;
  cancelSos: () => void;
  dismissEscalationNotice: () => void;

  // Emergency Escalation Lifecycle
  escalationSession: EmergencyEscalationSession | null;
  respondToEmergencyContact: (responseMsg?: string) => void;
  triggerSecondaryEscalationManual: () => Promise<void>;
  resolveEmergencySession: (notes?: string) => void;
  openEscalationModal: () => void;

  // AI Assistant & Timeline Modals
  aiAssistantOpen: boolean;
  setAiAssistantOpen: (open: boolean) => void;
  timelineModalOpen: boolean;
  setTimelineModalOpen: (open: boolean) => void;

  // Simulation Triggers
  triggerSimulatedKnown: (personId?: string) => void;
  triggerSimulatedUnknown: () => void;
  triggerSimulatedPackage: () => void;
  triggerSimulatedDoorbell: () => void;
  triggerSimulatedLoitering: () => void;
  triggerSimulatedTamper: (cameraId: string) => void;
  triggerCameraObstruction: (
    cameraId: string,
    obstructionType?: 'lens_covered' | 'dust_dirt' | 'physical_block' | 'spray_blur' | 'heavy_blur'
  ) => void;
  clearCameraObstruction: (cameraId: string) => void;
  restoreCameraFromTamper: (cameraId: string) => void;
  forceConfirmTampering: (cameraId: string) => void;

  // SANJAYA AI Brain
  aiBrainState: AIBrainState;
  aiBrainStatus: AIBrainStatus;
  aiAnalyses: AIAnalysis[];
  aiInsights: AIInsight[];
  aiDailySummary: DailyAISummary;
  aiNotifications: AINotification[];
  aiConversation: AIConversationMessage[];
  sendAIAssistantQuery: (query: string) => Promise<string>;
  refreshDailySummary: () => Promise<void>;
  dismissAINotification: (id: string) => void;
  markAINotificationSafe: (id: string) => void;
  ingestHardwareEvent: (raw: RawHardwarePayload) => Promise<void>;

  // SANJAYA Context-Aware Decision System
  recentDecisions: DecisionPipelineExecution[];
  runSecurityScenario: (scenarioCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F') => DecisionPipelineExecution | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'usr-bhaskar-101';

  // Persistence helpers with automatic ID deduplication
  const loadInitial = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`sanjaya_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const deduped = parsed.filter((item) => {
            if (item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
            }
            return true;
          });
          return deduped as unknown as T;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return fallback;
  };

  const [trustedPeople, setTrustedPeople] = useState<TrustedPerson[]>([]);
  const [isTrustedPeopleLoading, setIsTrustedPeopleLoading] = useState<boolean>(true);

  // Security Mode: home, away, night
  const [securityMode, setSecurityModeState] = useState<SecurityMode>(() =>
    loadInitial('security_mode', 'home' as SecurityMode)
  );
  const [showAwaySummaryModal, setShowAwaySummaryModal] = useState<boolean>(false);

  const setSecurityMode = (newMode: SecurityMode) => {
    // If switching from away to home, show the Away Mode summary dialog
    if (securityMode === 'away' && newMode === 'home') {
      setShowAwaySummaryModal(true);
    }
    setSecurityModeState(newMode);
    localStorage.setItem('sanjaya_security_mode', JSON.stringify(newMode));
  };

  const closeAwaySummaryModal = () => {
    setShowAwaySummaryModal(false);
  };

  // Load isolated trusted people for current user
  const refreshTrustedPeople = useCallback(async () => {
    if (!userId) {
      setTrustedPeople([]);
      setIsTrustedPeopleLoading(false);
      return;
    }
    setIsTrustedPeopleLoading(true);
    try {
      const legacy = localStorage.getItem('sanjaya_trusted_people');
      if (legacy && (legacy.includes('Arjun') || legacy.includes('tp-1'))) {
        localStorage.removeItem('sanjaya_trusted_people');
      }
      const people = await trustedPeopleService.getTrustedPeople(userId);
      setTrustedPeople(people);
    } catch (err) {
      console.error('[DataContext] Error fetching trusted people:', err);
    } finally {
      setIsTrustedPeopleLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshTrustedPeople();
  }, [refreshTrustedPeople]);

  const [cameras, setCameras] = useState<Camera[]>(() =>
    loadInitial('cameras', INITIAL_CAMERAS)
  );
  const [detections, setDetections] = useState<Detection[]>(() =>
    loadInitial('detections', INITIAL_DETECTIONS)
  );
  const [incidents, setIncidents] = useState<Incident[]>(() =>
    loadInitial('incidents', INITIAL_INCIDENTS)
  );
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() =>
    loadInitial('emergency_contacts', INITIAL_EMERGENCY_CONTACTS)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadInitial('notifications', INITIAL_NOTIFICATIONS)
  );
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadInitial('settings', INITIAL_SETTINGS)
  );
  const [zones, setZones] = useState<Zone[]>(() =>
    loadInitial('zones', INITIAL_ZONES)
  );
  const [sensors, setSensors] = useState<SecuritySensor[]>(() =>
    loadInitial('sensors', INITIAL_SENSORS)
  );
  const [dailyBrief] = useState<DailySecurityBrief>(INITIAL_DAILY_BRIEF);
  const [deviceHealth, setDeviceHealth] = useState<DeviceHealthItem[]>(() =>
    loadInitial('device_health', INITIAL_DEVICE_HEALTH)
  );

  const [activeCameraId, setActiveCameraId] = useState<string>('cam-1');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeAlertModal, setActiveAlertModal] = useState<Detection | null>(null);
  const [activeKnownModal, setActiveKnownModal] = useState<Detection | null>(null);

  // Modals for AI Assistant & Security Timeline
  const [aiAssistantOpen, setAiAssistantOpen] = useState<boolean>(false);
  const [timelineModalOpen, setTimelineModalOpen] = useState<boolean>(false);

  // SANJAYA AI Brain state
  const homeId = user?.home_name || 'home-bhaskar';
  const [aiBrainState, setAiBrainState] = useState<AIBrainState>(() =>
    AIBrainManager.getInitialState(
      userId,
      homeId,
      loadInitial('detections', INITIAL_DETECTIONS),
      loadInitial('incidents', INITIAL_INCIDENTS),
      loadInitial('cameras', INITIAL_CAMERAS),
      loadInitial('zones', INITIAL_ZONES),
      loadInitial('trusted_people', []),
      loadInitial('security_mode', 'home' as SecurityMode)
    )
  );

  const [recentDecisions, setRecentDecisions] = useState<DecisionPipelineExecution[]>(() =>
    SanjayaDecisionSystem.getRecentDecisions()
  );

  const runSecurityScenario = (scenarioCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F') => {
    const result = CVSimulatorService.runPredefinedScenario(scenarioCode, userId, homeId, {
      cameras,
      zones,
      trustedPeople,
      sensors,
    });
    if (result) {
      setRecentDecisions((prev) => [result.execution, ...prev.filter(d => d.id !== result.execution.id)].slice(0, 30));
      return result.execution;
    }
    return null;
  };


  // Sync security mode changes into AI Brain status
  useEffect(() => {
    setAiBrainState((prev: AIBrainState) => {
      if (!prev || prev.status.currentSecurityMode === securityMode) return prev;
      const updated: AIBrainState = {
        ...prev,
        status: {
          ...prev.status,
          currentSecurityMode: securityMode,
        },
      };
      AIBrainManager.saveState(userId, homeId, updated);
      return updated;
    });
  }, [securityMode, userId, homeId]);

  const sendAIAssistantQuery = async (query: string): Promise<string> => {
    const userMsg: AIConversationMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text: query.trim(),
    };

    setAiBrainState((prev: AIBrainState) => ({
      ...prev,
      conversation: [...prev.conversation, userMsg],
    }));

    const reply = await SanjayaAIService.answerSecurityQuestion(
      query,
      aiBrainState.conversation.map((c: AIConversationMessage) => ({ sender: c.sender, text: c.text })),
      {
        homeName: user?.home_name || 'Bhaskar Home',
        homeownerName: user?.full_name || user?.name || 'Bhaskar',
        securityMode,
        trustedPeople,
        cameras,
        zones,
        recentEvents: aiBrainState.events,
        incidents,
      }
    );

    const assistantMsg: AIConversationMessage = {
      id: `msg-asst-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: reply,
    };

    setAiBrainState((prev: AIBrainState) => {
      const updated: AIBrainState = {
        ...prev,
        conversation: [...prev.conversation, assistantMsg],
      };
      AIBrainManager.saveState(userId, homeId, updated);
      return updated;
    });

    return reply;
  };

  const refreshDailySummary = async () => {
    const summary = await SanjayaAIService.generateSecuritySummary(
      aiBrainState.events,
      {
        homeName: user?.home_name || 'Bhaskar Home',
        homeownerName: user?.full_name || user?.name || 'Bhaskar',
        securityMode,
        trustedPeople,
        cameras,
        zones,
      }
    );
    setAiBrainState((prev: AIBrainState) => {
      const updated: AIBrainState = {
        ...prev,
        dailySummary: summary,
        status: {
          ...prev.status,
          lastAnalysisTime: new Date().toISOString(),
        },
      };
      AIBrainManager.saveState(userId, homeId, updated);
      return updated;
    });
  };

  const dismissAINotification = (id: string) => {
    setAiBrainState((prev: AIBrainState) => {
      const updated: AIBrainState = {
        ...prev,
        notifications: prev.notifications.filter((n: AINotification) => n.id !== id),
      };
      AIBrainManager.saveState(userId, homeId, updated);
      return updated;
    });
  };

  const markAINotificationSafe = (id: string) => {
    setAiBrainState((prev: AIBrainState) => {
      const updated: AIBrainState = {
        ...prev,
        notifications: prev.notifications.filter((n: AINotification) => n.id !== id),
        status: {
          ...prev.status,
          attentionCount: Math.max(0, prev.status.attentionCount - 1),
        },
      };
      AIBrainManager.saveState(userId, homeId, updated);
      return updated;
    });
  };

  const ingestHardwareEvent = async (raw: RawHardwarePayload) => {
    const normalized = SecurityHardwareAdapter.normalizeEvent(raw, {
      userId,
      homeId,
      cameras,
      zones,
      sensors,
      securityMode,
    });

    const { updatedState } = await AIBrainManager.ingestEvent(
      normalized,
      aiBrainState,
      {
        userId,
        homeId,
        securityMode,
        trustedPeople,
        cameras,
        zones,
        sensors,
        homeName: user?.home_name,
        homeownerName: user?.full_name || user?.name,
      }
    );

    setAiBrainState(updatedState);
  };

  // SOS State
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [sosSecondsRemaining, setSosSecondsRemaining] = useState<number>(30);
  const [currentSosIncident, setCurrentSosIncident] = useState<Incident | null>(null);
  const [escalationNotice, setEscalationNotice] = useState<string | null>(null);
  const [escalationSession, setEscalationSession] = useState<EmergencyEscalationSession | null>(() =>
    EmergencyEscalationService.getActiveSession()
  );
  const sosTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-persist on changes
  useEffect(() => {
    localStorage.setItem('sanjaya_cameras', JSON.stringify(cameras));
  }, [cameras]);

  useEffect(() => {
    localStorage.setItem('sanjaya_detections', JSON.stringify(detections));
  }, [detections]);

  useEffect(() => {
    localStorage.setItem('sanjaya_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('sanjaya_emergency_contacts', JSON.stringify(emergencyContacts));
  }, [emergencyContacts]);

  useEffect(() => {
    localStorage.setItem('sanjaya_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('sanjaya_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('sanjaya_zones', JSON.stringify(zones));
  }, [zones]);

  useEffect(() => {
    localStorage.setItem('sanjaya_sensors', JSON.stringify(sensors));
  }, [sensors]);

  useEffect(() => {
    localStorage.setItem('sanjaya_device_health', JSON.stringify(deviceHealth));
  }, [deviceHealth]);

  const selectedIncidentRef = useRef<Incident | null>(selectedIncident);
  selectedIncidentRef.current = selectedIncident;

  // Realtime subscription listeners
  useEffect(() => {
    const unsubDetection = realtimeBus.subscribe('detections:new', (newDet: Detection) => {
      setDetections((prev) => {
        if (prev.some((det) => det.id === newDet.id)) {
          return prev.map((det) => (det.id === newDet.id ? newDet : det));
        }
        return [newDet, ...prev];
      });

      // Ingest into SANJAYA AI Brain
      const secEvent: SecurityEvent = {
        id: `sec-evt-${newDet.id}`,
        userId,
        homeId,
        sourceType: 'camera',
        sourceId: newDet.camera_id,
        sourceName: newDet.camera_name || 'Security Camera',
        zoneName: newDet.zone,
        timestamp: newDet.detected_at,
        eventType: newDet.category === 'package' ? 'package' : (newDet.person_type === 'known' ? 'arrival' : 'motion'),
        personType: newDet.person_type,
        personId: newDet.person_id,
        personName: newDet.person_name,
        securityModeAtTime: securityMode,
        snapshotUrl: newDet.snapshot_url,
        dwellTimeSeconds: newDet.dwell_time_seconds,
      };

      setAiBrainState((currentState: AIBrainState) => {
        AIBrainManager.ingestEvent(secEvent, currentState, {
          userId,
          homeId,
          securityMode,
          trustedPeople,
          cameras,
          zones,
          sensors,
          homeName: user?.home_name,
          homeownerName: user?.full_name || user?.name,
        }).then(({ updatedState }) => {
          setAiBrainState(updatedState);
        }).catch(err => {
          console.warn('AI Brain ingestion error:', err);
        });
        return currentState;
      });
    });

    const unsubIncident = realtimeBus.subscribe('incidents:new', (newInc: Incident) => {
      setIncidents((prev) => {
        if (prev.some((inc) => inc.id === newInc.id)) {
          return prev.map((inc) => (inc.id === newInc.id ? newInc : inc));
        }
        return [newInc, ...prev];
      });
    });

    const unsubIncidentUpdate = realtimeBus.subscribe('incidents:update', (updated: Incident) => {
      setIncidents((prev) => prev.map((inc) => (inc.id === updated.id ? updated : inc)));
      if (selectedIncidentRef.current?.id === updated.id) {
        setSelectedIncident(updated);
      }
    });

    const unsubNotification = realtimeBus.subscribe('notifications:new', (notif: AppNotification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) {
          return prev.map((n) => (n.id === notif.id ? notif : n));
        }
        return [notif, ...prev];
      });
    });

    const unsubAlert = realtimeBus.subscribe('alert:unknown', (data: { detection: Detection; incident: Incident }) => {
      setActiveAlertModal(data.detection);
    });

    const unsubDecision = realtimeBus.subscribe('decision:new', (exec: DecisionPipelineExecution) => {
      setRecentDecisions((prev) => [exec, ...prev.filter((d) => d.id !== exec.id)].slice(0, 30));
    });

    return () => {
      unsubDetection();
      unsubIncident();
      unsubIncidentUpdate();
      unsubNotification();
      unsubAlert();
      unsubDecision();
    };
  }, []);

  // Active camera resolution
  const activeCamera = cameras.find((c) => c.id === activeCameraId) || cameras[0] || INITIAL_CAMERAS[0];

  // Camera Actions: Siren, Spotlight, Recording
  const toggleSiren = (cameraId: string) => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === cameraId) {
          const next = !c.siren_active;
          return { ...c, siren_active: next };
        }
        return c;
      })
    );
  };

  const toggleSpotlight = (cameraId: string) => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === cameraId) {
          const next = !c.spotlight_active;
          return { ...c, spotlight_active: next };
        }
        return c;
      })
    );
  };

  const toggleRecording = (cameraId: string) => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === cameraId) {
          const next = !c.is_recording;
          return { ...c, is_recording: next, recording_seconds: next ? 0 : undefined };
        }
        return c;
      })
    );
  };

  // Trusted people actions
  const addTrustedPerson = async (data: {
    name: string;
    relationship: string;
    phone?: string;
    notes?: string;
    photo_url?: string;
    face_reference?: string;
    role?: any;
    allowed_zones?: string[];
    restricted_zones?: string[];
  }): Promise<TrustedPerson> => {
    const created = await trustedPeopleService.createTrustedPerson(data, userId);
    setTrustedPeople((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
    return created;
  };

  const updateTrustedPerson = async (id: string, updates: Partial<TrustedPerson>): Promise<TrustedPerson> => {
    const updated = await trustedPeopleService.updateTrustedPerson(id, updates, userId);
    setTrustedPeople((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteTrustedPerson = async (id: string): Promise<void> => {
    await trustedPeopleService.deleteTrustedPerson(id, userId);
    setTrustedPeople((prev) => prev.filter((p) => p.id !== id));
  };

  // Camera actions
  const addCamera = (data: Omit<Camera, 'id' | 'user_id' | 'created_at'>) => {
    const newCamera: Camera = {
      ...data,
      id: `cam-${Date.now()}`,
      user_id: userId,
      status: 'online',
      created_at: new Date().toISOString(),
    };
    setCameras((prev) => [...prev, newCamera]);
  };

  const updateCamera = async (id: string, updates: Partial<Camera>): Promise<Camera> => {
    const oldCam = cameras.find((c) => c.id === id);
    if (!oldCam) {
      throw new Error(`Camera with ID ${id} not found.`);
    }

    // Merge updates while strictly preserving real-time connection status
    // unless an explicit connection toggle was performed
    const merged: Camera = {
      ...oldCam,
      ...updates,
      // Status preservation: if updates.status is not explicitly passed, retain old status
      status: updates.status !== undefined ? updates.status : oldCam.status,
      // Retain obstruction / tamper state unless toggled offline
      view_status: updates.status === 'offline' ? 'normal' : (updates.view_status !== undefined ? updates.view_status : oldCam.view_status),
      obstruction_verification: updates.status === 'offline' ? undefined : (updates.obstruction_verification !== undefined ? updates.obstruction_verification : oldCam.obstruction_verification),
      is_tampered: updates.status === 'offline' ? false : (updates.is_tampered !== undefined ? updates.is_tampered : oldCam.is_tampered),
      tamper_reason: updates.status === 'offline' ? undefined : (updates.tamper_reason !== undefined ? updates.tamper_reason : oldCam.tamper_reason),
    };

    // 1. Update camera list
    setCameras((prev) => prev.map((c) => (c.id === id ? merged : c)));

    const newName = updates.name?.trim();
    const newLocation = updates.location?.trim();
    const newZone = updates.zone?.trim() || newLocation;
    const oldName = oldCam.name;
    const oldLocation = oldCam.location;
    const oldZone = oldCam.zone || oldLocation;

    // 2. Sync to Detections
    if (newName || newZone) {
      setDetections((prev) =>
        prev.map((d) => {
          if (d.camera_id === id) {
            return {
              ...d,
              camera_name: newName || d.camera_name,
              zone: newZone || d.zone,
            };
          }
          return d;
        })
      );
    }

    // 3. Sync to Incidents & Timeline
    if (newName || newZone || newLocation) {
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.camera_id === id) {
            const updatedTimeline = inc.timeline.map((evt) => ({
              ...evt,
              camera_name: newName || evt.camera_name,
              zone: newZone || evt.zone,
            }));
            const matchesOldWhere = inc.where === oldLocation || inc.where === oldZone || inc.where === oldName;
            return {
              ...inc,
              camera_name: newName || inc.camera_name,
              location_zone: newZone || inc.location_zone,
              where: matchesOldWhere ? (newLocation || newZone || inc.where) : inc.where,
              timeline: updatedTimeline,
            };
          }
          return inc;
        })
      );

      // Also sync selectedIncident if active
      setSelectedIncident((prev) => {
        if (!prev || prev.camera_id !== id) return prev;
        const matchesOldWhere = prev.where === oldLocation || prev.where === oldZone || prev.where === oldName;
        return {
          ...prev,
          camera_name: newName || prev.camera_name,
          location_zone: newZone || prev.location_zone,
          where: matchesOldWhere ? (newLocation || newZone || prev.where) : prev.where,
          timeline: prev.timeline.map((evt) => ({
            ...evt,
            camera_name: newName || evt.camera_name,
            zone: newZone || evt.zone,
          })),
        };
      });
    }

    // 4. Sync Zone relationships
    if (newZone && newZone !== oldZone) {
      setZones((prev) => {
        return prev.map((z) => {
          // Remove from old zone
          if (z.name.toLowerCase() === oldZone.toLowerCase() || z.camera_ids.includes(id)) {
            return {
              ...z,
              camera_ids: z.camera_ids.filter((cid) => cid !== id),
            };
          }
          // Add to new zone if matches
          if (z.name.toLowerCase() === newZone.toLowerCase()) {
            return {
              ...z,
              camera_ids: z.camera_ids.includes(id) ? z.camera_ids : [...z.camera_ids, id],
            };
          }
          return z;
        });
      });
    }

    // 5. Sync to Device Health
    if (newName || newZone) {
      setDeviceHealth((prev) =>
        prev.map((dev) => {
          if (dev.id === id || dev.device_name === oldName) {
            return {
              ...dev,
              device_name: newName || dev.device_name,
              zone: newZone || dev.zone,
            };
          }
          return dev;
        })
      );
    }

    // 6. Sync Notifications
    if (newName && oldName) {
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.message.includes(oldName) || n.title.includes(oldName)) {
            return {
              ...n,
              title: n.title.replace(new RegExp(oldName, 'g'), newName),
              message: n.message.replace(new RegExp(oldName, 'g'), newName),
            };
          }
          return n;
        })
      );
    }

    // 7. Sync to AI Brain State
    setAiBrainState((prev) => {
      const updatedNotifications = prev.notifications.map((n) => {
        if (newName && oldName && (n.message.includes(oldName) || n.title.includes(oldName))) {
          return {
            ...n,
            title: n.title.replace(new RegExp(oldName, 'g'), newName),
            message: n.message.replace(new RegExp(oldName, 'g'), newName),
          };
        }
        return n;
      });

      const updatedBrain = {
        ...prev,
        notifications: updatedNotifications,
      };
      AIBrainManager.saveState(userId, homeId, updatedBrain);
      return updatedBrain;
    });

    // 8. Publish Realtime update
    realtimeBus.publish('camera:update', { id, camera: merged });

    // 9. Sync to Supabase if configured
    if (supabase) {
      try {
        await supabase
          .from('cameras')
          .update({
            name: merged.name,
            location: merged.location,
            zone: merged.zone,
            camera_type: merged.camera_type,
            stream_url: merged.stream_url,
            is_simulation: merged.is_simulation,
            brand: merged.brand,
            connection_type: merged.connection_type,
            description: merged.description,
          })
          .eq('id', id);
      } catch (err) {
        console.error('[DataContext] Error updating camera in Supabase:', err);
      }
    }

    return merged;
  };

  const deleteCamera = (id: string) => {
    setCameras((prev) => prev.filter((c) => c.id !== id));
    if (activeCameraId === id && cameras.length > 1) {
      const next = cameras.find((c) => c.id !== id);
      if (next) setActiveCameraId(next.id);
    }
    // Remove from zones
    setZones((prev) =>
      prev.map((z) => ({
        ...z,
        camera_ids: z.camera_ids.filter((cid) => cid !== id),
      }))
    );
    // Remove from deviceHealth
    setDeviceHealth((prev) => prev.filter((d) => d.id !== id));
    // Publish Realtime delete
    realtimeBus.publish('camera:delete', { id });
    if (supabase) {
      supabase.from('cameras').delete().eq('id', id).then(() => {}, console.error);
    }
  };

  // Zones & Sensors Actions
  const updateZone = (id: string, updates: Partial<Zone>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...updates } : z)));
  };

  const updateSensor = (id: string, updates: Partial<SecuritySensor>) => {
    setSensors((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Emergency contact actions
  const addEmergencyContact = (data: Omit<EmergencyContact, 'id' | 'user_id' | 'created_at'>) => {
    const newContact: EmergencyContact = {
      ...data,
      id: `ec-${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    setEmergencyContacts((prev) => [...prev, newContact].sort((a, b) => a.priority - b.priority));
  };

  const updateEmergencyContact = (id: string, updates: Partial<EmergencyContact>) => {
    setEmergencyContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)).sort((a, b) => a.priority - b.priority)
    );
  };

  const deleteEmergencyContact = (id: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Incidents
  const resolveIncident = (id: string, notes?: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          const updated: Incident = {
            ...inc,
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            notes: notes || inc.notes,
            timeline: [
              ...inc.timeline,
              {
                id: `tl-resolve-${Date.now()}`,
                timestamp: new Date().toISOString(),
                title: 'Incident Resolved',
                description: notes || 'Marked as safe and resolved by homeowner.',
                type: 'resolved',
              },
            ],
          };
          if (selectedIncident?.id === id) {
            setSelectedIncident(updated);
          }
          return updated;
        }
        return inc;
      })
    );
  };

  // Notifications
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    try {
      setNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        try {
          localStorage.setItem('sanjaya_notifications', JSON.stringify(next));
        } catch (e) {
          console.error('[DataContext] Failed to save notifications to storage:', e);
        }
        return next;
      });
      return true;
    } catch (err) {
      console.error('[DataContext] Failed to delete notification:', err);
      throw err;
    }
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const clearAllDetections = () => {
    setDetections([]);
    localStorage.removeItem('sanjaya_detections');
  };

  const setIndoorMonitorMode = (val: boolean) => {
    updateSettings({ indoor_monitor_mode: val });
  };

  const closeAlertModal = () => {
    setActiveAlertModal(null);
    setActiveKnownModal(null);
  };

  // SOS Countdown & Escalation Logic
  const activateSos = useCallback(async () => {
    setActiveAlertModal(null);
    setActiveKnownModal(null);

    let coords: { latitude: number; longitude: number } | undefined;
    if (settings.location_sharing_sos || settings.location_sharing_enabled) {
      const loc = await SosEscalationService.getCurrentLocation();
      if (loc) {
        coords = { latitude: loc.latitude, longitude: loc.longitude };
      }
    }

    const incident = SosEscalationService.createSosIncident(userId, coords);
    setCurrentSosIncident(incident);
    setIsSosActive(true);
    setSosSecondsRemaining(settings.sos_countdown_seconds || 30);
  }, [userId, settings]);

  const cancelSos = useCallback(() => {
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    if (currentSosIncident) {
      SosEscalationService.cancelSos(currentSosIncident);
    }
    setIsSosActive(false);
    setCurrentSosIncident(null);
    setSosSecondsRemaining(settings.sos_countdown_seconds || 30);
  }, [currentSosIncident, settings.sos_countdown_seconds]);

  // SOS countdown interval effect
  useEffect(() => {
    if (!isSosActive) {
      if (sosTimerRef.current) {
        clearInterval(sosTimerRef.current);
        sosTimerRef.current = null;
      }
      return;
    }

    sosTimerRef.current = setInterval(() => {
      setSosSecondsRemaining((prev) => {
        if (settings.alert_audio_enabled) {
          playSosBeep(prev <= 5);
        }

        if (prev <= 1) {
          if (sosTimerRef.current) {
            clearInterval(sosTimerRef.current);
            sosTimerRef.current = null;
          }
          if (currentSosIncident) {
            const waitMinutes = (settings.escalation_wait_minutes === 10 ? 10 : 5) as 5 | 10;
            SosEscalationService.escalateSos(
              currentSosIncident,
              emergencyContacts,
              activeAlertModal?.snapshot_url,
              user?.full_name || user?.name || 'Bhaskar',
              user?.home_name || 'Bhaskar Home',
              waitMinutes
            ).then((result) => {
              setEscalationNotice(result.mockDispatchNotice);
              setCurrentSosIncident(result.incident);
              if (result.escalationSession) {
                setEscalationSession(result.escalationSession);
              }
            });
          }
          setIsSosActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sosTimerRef.current) {
        clearInterval(sosTimerRef.current);
        sosTimerRef.current = null;
      }
    };
  }, [
    isSosActive,
    currentSosIncident,
    emergencyContacts,
    settings.alert_audio_enabled,
    settings.escalation_wait_minutes,
    activeAlertModal,
    user,
  ]);

  // Background-Resilient Emergency Escalation Synchronization (Rules 3, 4, 5, 6)
  useEffect(() => {
    const syncEscalation = () => {
      const active = EmergencyEscalationService.getActiveSession();
      if (!active) {
        setEscalationSession(null);
        return;
      }

      if (active.escalationStatus === 'waiting_contact_response') {
        const remaining = Math.max(0, Math.ceil((active.timerExpiresAt - Date.now()) / 1000));
        if (remaining <= 0) {
          // Timer expired, even if phone was locked or app was backgrounded
          const inc = incidents.find((i) => i.id === active.incidentId) || currentSosIncident || {
            id: active.incidentId,
            user_id: userId,
            type: (active.emergencyType as any) || 'sos_activated',
            status: 'escalated',
            started_at: active.startedAt,
            timeline: [],
          };

          EmergencyEscalationService.triggerSecondaryEscalation(
            active,
            inc,
            user?.full_name || user?.name || 'Resident'
          ).then((updated) => {
            setEscalationSession(updated);
          });
        } else {
          setEscalationSession((prev) => {
            if (!prev || prev.timerRemainingSeconds !== remaining) {
              return { ...active, timerRemainingSeconds: remaining };
            }
            return prev;
          });
        }
      } else {
        setEscalationSession(active);
      }
    };

    // Immediate check
    syncEscalation();

    // 1-second interval
    const interval = setInterval(syncEscalation, 1000);

    // Event listeners for window focus and document visibility (Rule 3 & 4)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncEscalation();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    const unsubSession = realtimeBus.subscribe('escalation:session_update', (sess: EmergencyEscalationSession | null) => {
      setEscalationSession(sess);
    });

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      unsubSession();
    };
  }, [incidents, currentSosIncident, user, userId]);

  // Action: Emergency Contact Responded
  const respondToEmergencyContact = useCallback((responseMsg?: string) => {
    if (!escalationSession) return;
    const inc = incidents.find((i) => i.id === escalationSession.incidentId) || currentSosIncident || {
      id: escalationSession.incidentId,
      user_id: userId,
      type: (escalationSession.emergencyType as any) || 'sos_activated',
      status: 'active',
      started_at: escalationSession.startedAt,
      timeline: [],
    };
    const updated = EmergencyEscalationService.registerContactResponse(escalationSession, inc, responseMsg);
    setEscalationSession(updated);
  }, [escalationSession, incidents, currentSosIncident, userId]);

  // Action: Manually or programmatically trigger secondary escalation
  const triggerSecondaryEscalationManual = useCallback(async () => {
    if (!escalationSession) return;
    const inc = incidents.find((i) => i.id === escalationSession.incidentId) || currentSosIncident || {
      id: escalationSession.incidentId,
      user_id: userId,
      type: (escalationSession.emergencyType as any) || 'sos_activated',
      status: 'escalated',
      started_at: escalationSession.startedAt,
      timeline: [],
    };
    const updated = await EmergencyEscalationService.triggerSecondaryEscalation(
      escalationSession,
      inc,
      user?.full_name || user?.name || 'Resident'
    );
    setEscalationSession(updated);
  }, [escalationSession, incidents, currentSosIncident, user, userId]);

  // Action: Resolve Emergency Session
  const resolveEmergencySession = useCallback((notes?: string) => {
    if (!escalationSession) return;
    const inc = incidents.find((i) => i.id === escalationSession.incidentId) || currentSosIncident || {
      id: escalationSession.incidentId,
      user_id: userId,
      type: (escalationSession.emergencyType as any) || 'sos_activated',
      status: 'resolved',
      started_at: escalationSession.startedAt,
      timeline: [],
    };
    EmergencyEscalationService.resolveEmergency(escalationSession, inc, notes);
    setEscalationSession(null);
    setEscalationNotice(null);
    setCurrentSosIncident(null);
  }, [escalationSession, incidents, currentSosIncident, userId]);

  const openEscalationModal = useCallback(() => {
    if (escalationSession && !escalationNotice) {
      setEscalationNotice(
        `[SANJAYA Emergency Response] Escalation status active: ${escalationSession.escalationStatus}`
      );
    }
  }, [escalationSession, escalationNotice]);

  const dismissEscalationNotice = () => {
    setEscalationNotice(null);
  };

  // Simulation triggers
  const triggerSimulatedKnown = (personId?: string) => {
    const person = personId
      ? trustedPeople.find((p) => p.id === personId)
      : trustedPeople[0];

    if (!person) {
      const { detection } = CVSimulatorService.generateUnknownDetection(
        userId,
        {
          cameraId: activeCamera.id,
          cameraName: activeCamera.name,
          zone: activeCamera.location,
          securityMode,
        },
        settings.alert_audio_enabled
      );
      setActiveAlertModal(detection);
      return;
    }

    const { detection } = CVSimulatorService.generateKnownDetection(person, {
      cameraId: activeCamera.id,
      cameraName: activeCamera.name,
      zone: activeCamera.location,
      securityMode,
    });

    setActiveKnownModal(detection);
  };

  const triggerSimulatedUnknown = () => {
    CVSimulatorService.generateUnknownDetection(
      userId,
      {
        cameraId: activeCamera.id,
        cameraName: activeCamera.name,
        zone: activeCamera.location,
        securityMode,
        dwellTimeSeconds: 45,
      },
      settings.alert_audio_enabled
    );
  };

  const triggerSimulatedPackage = () => {
    CVSimulatorService.generatePackageDelivery(userId, {
      cameraId: activeCamera.id,
      cameraName: activeCamera.name,
      zone: activeCamera.location,
      securityMode,
    });
  };

  const triggerSimulatedLoitering = () => {
    CVSimulatorService.generateUnknownDetection(
      userId,
      {
        cameraId: activeCamera.id,
        cameraName: activeCamera.name,
        zone: activeCamera.location,
        securityMode,
        dwellTimeSeconds: 120,
        behaviourTags: ['approaching', 'loitering', 'attempting_door'],
      },
      settings.alert_audio_enabled
    );
  };

  // Continuous multi-camera obstruction verification ticker
  useEffect(() => {
    const hasVerifyingCamera = cameras.some(
      (c) => c.view_status === 'possible_obstruction' && c.obstruction_verification
    );
    if (!hasVerifyingCamera) return;

    const interval = setInterval(() => {
      setCameras((prevCameras) => {
        let hasChanges = false;
        const updatedCameras = prevCameras.map((cam) => {
          if (cam.view_status !== 'possible_obstruction' || !cam.obstruction_verification) {
            return cam;
          }

          // 1. Camera Disconnected Check:
          // If camera is offline/disconnected, cancel verification immediately (disconnection is not tampering!)
          if (cam.status === 'offline') {
            hasChanges = true;
            return CameraObstructionService.cancelObstructionVerification(cam, 'Camera disconnected');
          }

          const expiresAt = cam.obstruction_verification.verificationExpiresAt;
          const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

          if (remaining > 0) {
            if (cam.obstruction_verification.remainingSeconds !== remaining) {
              hasChanges = true;
              return {
                ...cam,
                obstruction_verification: {
                  ...cam.obstruction_verification,
                  remainingSeconds: remaining,
                },
              };
            }
            return cam;
          }

          // 2. 30 Seconds Elapsed Continuously:
          // Camera is connected + obstruction remained for full 30 seconds
          // -> Confirm tampering, create incident, publish notification
          hasChanges = true;
          const { camera: tamperedCam } = CameraObstructionService.confirmObstructionTampering(
            cam,
            userId
          );
          return tamperedCam;
        });

        return hasChanges ? updatedCameras : prevCameras;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cameras, userId]);

  /**
   * Starts a 30-second verification process on a specific camera.
   * Multi-camera behavior: other cameras remain normal and unaffected.
   */
  const triggerCameraObstruction = (
    cameraId: string,
    obstructionType: 'lens_covered' | 'dust_dirt' | 'physical_block' | 'spray_blur' | 'heavy_blur' = 'lens_covered'
  ) => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === cameraId) {
          return CameraObstructionService.startObstructionVerification(c, obstructionType);
        }
        return c;
      })
    );
  };

  /**
   * Called if obstruction disappears within 30 seconds:
   * Cancels timer, marks camera as normal, NO notification, NO incident!
   */
  const clearCameraObstruction = (cameraId: string) => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === cameraId) {
          return CameraObstructionService.cancelObstructionVerification(c);
        }
        return c;
      })
    );
  };

  /**
   * Restores a camera that was previously confirmed tampered back to normal online state.
   */
  const restoreCameraFromTamper = (cameraId: string) => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === cameraId) {
          return CameraObstructionService.restoreCamera(c);
        }
        return c;
      })
    );
  };

  /**
   * Fast-forward / force confirm tampering for quick testing without waiting 30 seconds.
   */
  const forceConfirmTampering = (cameraId: string) => {
    const cam = cameras.find((c) => c.id === cameraId);
    if (!cam || cam.status === 'offline') return;
    const { camera: tamperedCam } = CameraObstructionService.confirmObstructionTampering(
      cam,
      userId
    );
    setCameras((prev) => prev.map((c) => (c.id === cameraId ? tamperedCam : c)));
  };

  /**
   * Simulation trigger for camera tamper / obstruction:
   * Starts the 30-second verification process on the selected camera.
   */
  const triggerSimulatedTamper = (cameraId: string) => {
    triggerCameraObstruction(cameraId, 'lens_covered');
  };

  const triggerSimulatedDoorbell = () => {
    CVSimulatorService.triggerDoorbell(activeCamera.location);
  };

  return (
    <DataContext.Provider
      value={{
        trustedPeople,
        isTrustedPeopleLoading,
        refreshTrustedPeople,
        cameras,
        detections,
        incidents,
        emergencyContacts,
        notifications,
        settings,
        zones,
        sensors,
        dailyBrief,
        deviceHealth,

        securityMode,
        setSecurityMode,
        showAwaySummaryModal,
        closeAwaySummaryModal,

        addTrustedPerson,
        updateTrustedPerson,
        deleteTrustedPerson,

        addCamera,
        updateCamera,
        deleteCamera,
        activeCamera,
        setActiveCameraId,
        toggleSiren,
        toggleSpotlight,
        toggleRecording,

        updateZone,
        updateSensor,

        addEmergencyContact,
        updateEmergencyContact,
        deleteEmergencyContact,

        selectedIncident,
        setSelectedIncident,
        resolveIncident,

        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearNotifications,

        updateSettings,
        clearAllDetections,
        setIndoorMonitorMode,

        activeAlertModal,
        setActiveAlertModal,
        activeKnownModal,
        setActiveKnownModal,
        closeAlertModal,

        isSosActive,
        sosSecondsRemaining,
        currentSosIncident,
        escalationNotice,
        activateSos,
        cancelSos,
        dismissEscalationNotice,

        // Emergency Escalation
        escalationSession,
        respondToEmergencyContact,
        triggerSecondaryEscalationManual,
        resolveEmergencySession,
        openEscalationModal,

        aiAssistantOpen,
        setAiAssistantOpen,
        timelineModalOpen,
        setTimelineModalOpen,

        triggerSimulatedKnown,
        triggerSimulatedUnknown,
        triggerSimulatedPackage,
        triggerSimulatedDoorbell,
        triggerSimulatedLoitering,
        triggerSimulatedTamper,
        triggerCameraObstruction,
        clearCameraObstruction,
        restoreCameraFromTamper,
        forceConfirmTampering,

        // SANJAYA AI Brain
        aiBrainState,
        aiBrainStatus: aiBrainState.status,
        aiAnalyses: aiBrainState.analyses,
        aiInsights: aiBrainState.insights,
        aiDailySummary: aiBrainState.dailySummary,
        aiNotifications: aiBrainState.notifications,
        aiConversation: aiBrainState.conversation,
        sendAIAssistantQuery,
        refreshDailySummary,
        dismissAINotification,
        markAINotificationSafe,
        ingestHardwareEvent,

        // SANJAYA Context-Aware Decision System
        recentDecisions,
        runSecurityScenario,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
