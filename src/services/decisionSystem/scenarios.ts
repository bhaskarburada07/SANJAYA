import { Camera, Zone, TrustedPerson, SecuritySensor } from '../../types';
import { RawObservationInput } from './contextEngine';
import { SanjayaDecisionSystem } from './sanjayaDecisionSystem';

export interface PredefinedScenario {
  id: string;
  code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  title: string;
  subtitle: string;
  expectedDecision: 'OBSERVE' | 'INFORM' | 'WARN' | 'ESCALATE' | 'EMERGENCY_RESPONSE';
  expectedRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  inputGenerator: (ctx: {
    cameras: Camera[];
    zones: Zone[];
    trustedPeople: TrustedPerson[];
    sensors: SecuritySensor[];
  }) => RawObservationInput;
}

export const PREDEFINED_SCENARIOS: PredefinedScenario[] = [
  {
    id: 'scenario-a',
    code: 'A',
    title: 'Normal Unknown Visitor',
    subtitle: 'Home Mode + Brief Approach + Departure',
    expectedDecision: 'OBSERVE',
    expectedRisk: 'LOW',
    description: 'Unknown person briefly walks up to entrance, does not interact with doors, and departs within 20 seconds. Situation is calm; no threat classification or police escalation.',
    inputGenerator: ({ cameras, zones, trustedPeople, sensors }) => {
      const camera = cameras[0] || {
        id: 'cam-1',
        name: 'Main Entrance Doorbell',
        location: 'Front Porch',
        status: 'online',
        is_simulation: true,
      };
      const zone = zones.find(z => z.type === 'entrance') || {
        id: 'zone-1',
        name: 'Main Entrance',
        type: 'entrance',
        sensitivity: 'high',
        privacy_level: 'standard',
        is_monitored: true,
        camera_ids: [camera.id],
        sensor_ids: [],
      };
      return {
        personType: 'unknown',
        camera,
        zone,
        securityMode: 'home',
        dwellTimeSeconds: 18,
        movement: 'leaving',
        behaviourTags: ['walking_past', 'leaving'],
        doorInteraction: false,
        trustedPeople,
        sensors,
      };
    },
  },
  {
    id: 'scenario-b',
    code: 'B',
    title: 'Unknown Person Waiting',
    subtitle: 'Home Mode + Prolonged Waiting Outside',
    expectedDecision: 'INFORM',
    expectedRisk: 'MEDIUM',
    description: 'Unknown visitor waiting outside for an extended period (>90s). SANJAYA observes context and issues an informational notification rather than declaring danger or contacting emergency services.',
    inputGenerator: ({ cameras, zones, trustedPeople, sensors }) => {
      const camera = cameras[0] || {
        id: 'cam-1',
        name: 'Main Entrance Doorbell',
        location: 'Front Porch',
        status: 'online',
        is_simulation: true,
      };
      const zone = zones.find(z => z.type === 'entrance') || {
        id: 'zone-1',
        name: 'Main Entrance',
        type: 'entrance',
        sensitivity: 'high',
        privacy_level: 'standard',
        is_monitored: true,
        camera_ids: [camera.id],
        sensor_ids: [],
      };
      return {
        personType: 'unknown',
        camera,
        zone,
        securityMode: 'home',
        dwellTimeSeconds: 110,
        movement: 'waiting',
        behaviourTags: ['waiting', 'stationary'],
        doorInteraction: false,
        trustedPeople,
        sensors,
      };
    },
  },
  {
    id: 'scenario-c',
    code: 'C',
    title: 'Away Mode + Door Interaction',
    subtitle: 'Away Mode + Repeated Door Checking',
    expectedDecision: 'ESCALATE',
    expectedRisk: 'HIGH',
    description: 'Home is in AWAY mode while an unknown person repeatedly tests the door handle. Risk increases, incident is created, and homeowner receives high-priority notification.',
    inputGenerator: ({ cameras, zones, trustedPeople, sensors }) => {
      const camera = cameras[0] || {
        id: 'cam-1',
        name: 'Main Entrance Doorbell',
        location: 'Front Porch',
        status: 'online',
        is_simulation: true,
      };
      const zone = zones.find(z => z.type === 'entrance') || {
        id: 'zone-1',
        name: 'Main Entrance',
        type: 'entrance',
        sensitivity: 'high',
        privacy_level: 'standard',
        is_monitored: true,
        camera_ids: [camera.id],
        sensor_ids: [],
      };
      return {
        personType: 'unknown',
        camera,
        zone,
        securityMode: 'away',
        dwellTimeSeconds: 65,
        movement: 'returning',
        repeatedApproachesCount: 2,
        behaviourTags: ['touches_handle', 'attempting_door'],
        doorInteraction: true,
        trustedPeople,
        sensors,
      };
    },
  },
  {
    id: 'scenario-d',
    code: 'D',
    title: 'Multiple Confirming Signals',
    subtitle: 'Away Mode + Restricted Zone + Door Sensor Tripped',
    expectedDecision: 'EMERGENCY_RESPONSE',
    expectedRisk: 'CRITICAL',
    description: 'Away mode active, unverified person enters restricted zone, interacts with door, and hardware magnetic door sensor confirms door opened. Multi-sensor fusion escalates to critical protocol.',
    inputGenerator: ({ cameras, zones, trustedPeople, sensors }) => {
      const camera = cameras[0] || {
        id: 'cam-1',
        name: 'Main Entrance Doorbell',
        location: 'Front Porch',
        status: 'online',
        is_simulation: true,
      };
      const zone = zones.find(z => z.type === 'backyard' || z.type === 'entrance') || {
        id: 'zone-1',
        name: 'Main Entrance',
        type: 'entrance',
        sensitivity: 'high',
        privacy_level: 'standard',
        is_monitored: true,
        camera_ids: [camera.id],
        sensor_ids: [],
      };
      const activeDoorSensors: SecuritySensor[] = [
        {
          id: 'sens-door-breach',
          name: 'Front Entry Door Sensor',
          type: 'door_window',
          status: 'open',
          battery_percent: 95,
          zone: zone.name,
          last_activity: new Date().toISOString(),
        },
      ];
      return {
        personType: 'unknown',
        camera,
        zone,
        securityMode: 'away',
        dwellTimeSeconds: 140,
        movement: 'loitering',
        repeatedApproachesCount: 3,
        behaviourTags: ['touches_handle', 'attempting_door', 'breach'],
        doorInteraction: true,
        restrictedZoneEntry: true,
        sensors: [...sensors, ...activeDoorSensors],
        trustedPeople,
      };
    },
  },
  {
    id: 'scenario-e',
    code: 'E',
    title: 'Known Family Arrival',
    subtitle: 'Known Person + Normal Routine',
    expectedDecision: 'OBSERVE',
    expectedRisk: 'LOW',
    description: 'Enrolled family member or trusted friend arrives during daytime under normal routine. Classified as LOW risk with zero false alarms.',
    inputGenerator: ({ cameras, zones, trustedPeople, sensors }) => {
      const person = trustedPeople[0] || {
        id: 'tp-arjun',
        user_id: 'usr-bhaskar-101',
        name: 'Arjun',
        relationship: 'Son',
        is_restricted: false,
      };
      const camera = cameras[0] || {
        id: 'cam-1',
        name: 'Main Entrance Doorbell',
        location: 'Front Porch',
        status: 'online',
        is_simulation: true,
      };
      const zone = zones.find(z => z.type === 'entrance') || {
        id: 'zone-1',
        name: 'Main Entrance',
        type: 'entrance',
        sensitivity: 'high',
        privacy_level: 'standard',
        is_monitored: true,
        camera_ids: [camera.id],
        sensor_ids: [],
      };
      return {
        personType: 'known',
        personId: person.id,
        personName: person.name,
        confidence: 0.97,
        camera,
        zone,
        securityMode: 'home',
        dwellTimeSeconds: 15,
        movement: 'approaching',
        behaviourTags: ['family_arrival'],
        doorInteraction: false,
        trustedPeople,
        sensors,
      };
    },
  },
  {
    id: 'scenario-f',
    code: 'F',
    title: 'Unknown Person, Normal Behaviour',
    subtitle: 'Unknown Identity + Public Perimeter Walk',
    expectedDecision: 'OBSERVE',
    expectedRisk: 'LOW',
    description: 'Unrecognized person in front public area briefly walking by. No restricted entry or door checking. SANJAYA observes and does NOT label as dangerous or escalate.',
    inputGenerator: ({ cameras, zones, trustedPeople, sensors }) => {
      const camera = cameras[0] || {
        id: 'cam-1',
        name: 'Main Entrance Doorbell',
        location: 'Front Porch',
        status: 'online',
        is_simulation: true,
      };
      const zone = zones.find(z => z.type === 'entrance') || {
        id: 'zone-1',
        name: 'Main Entrance',
        type: 'entrance',
        sensitivity: 'high',
        privacy_level: 'standard',
        is_monitored: true,
        camera_ids: [camera.id],
        sensor_ids: [],
      };
      return {
        personType: 'unknown',
        camera,
        zone,
        securityMode: 'home',
        dwellTimeSeconds: 22,
        movement: 'walking_past',
        behaviourTags: ['walking_past', 'normal_visitor'],
        doorInteraction: false,
        trustedPeople,
        sensors,
      };
    },
  },
];
