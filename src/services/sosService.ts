import { Incident, EmergencyContact, EscalationRecord, EmergencyEscalationSession } from '../types';
import { realtimeBus } from '../lib/supabase';
import { EmergencyEscalationService } from './emergencyEscalationService';

export interface EscalationResult {
  incident: Incident;
  escalationRecords: EscalationRecord[];
  mockDispatchNotice: string;
  escalationSession?: EmergencyEscalationSession;
}

export class SosEscalationService {
  /**
   * Captures the browser's current geolocation with permission handling
   */
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.warn('Geolocation permission not granted or failed:', error.message);
          // Fallback to configured home coordinates
          resolve({
            latitude: 12.9716,
            longitude: 77.5946,
            accuracy: 50,
          });
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  }

  /**
   * Initiates an SOS incident record in active countdown state
   */
  static createSosIncident(userId: string, locationCoords?: { latitude: number; longitude: number }): Incident {
    const now = new Date();
    const entropy = Math.random().toString(36).substring(2, 7);
    const incident: Incident = {
      id: `inc-sos-${Date.now()}-${entropy}`,
      user_id: userId,
      type: 'sos_activated',
      status: 'active',
      latitude: locationCoords?.latitude || 12.9716,
      longitude: locationCoords?.longitude || 77.5946,
      location_address: '142 Greenview Heights, Bangalore',
      started_at: now.toISOString(),
      notes: 'Emergency SOS activated by homeowner. 30s countdown running.',
      timeline: [
        {
          id: `tl-sos-${Date.now()}-${entropy}-1`,
          timestamp: now.toISOString(),
          title: 'SOS panic triggered',
          description: 'Homeowner activated SOS manual alert',
          type: 'sos',
        },
        {
          id: `tl-sos-${Date.now()}-${entropy}-2`,
          timestamp: now.toISOString(),
          title: 'GPS Coordinates Logged',
          description: `Location captured: ${locationCoords?.latitude || 12.9716}, ${locationCoords?.longitude || 77.5946}`,
          type: 'detection',
        },
      ],
    };

    realtimeBus.publish('incidents:new', incident);
    return incident;
  }

  /**
   * Cancel SOS prior to countdown expiration
   */
  static cancelSos(incident: Incident): Incident {
    const now = new Date();
    const entropy = Math.random().toString(36).substring(2, 6);
    const updated: Incident = {
      ...incident,
      status: 'cancelled',
      resolved_at: now.toISOString(),
      notes: 'SOS countdown cancelled by homeowner.',
      timeline: [
        ...incident.timeline,
        {
          id: `tl-cancel-${Date.now()}-${entropy}`,
          timestamp: now.toISOString(),
          title: 'SOS Cancelled',
          description: 'Homeowner verified false alarm / safe status before countdown elapsed.',
          type: 'cancelled',
        },
      ],
    };

    realtimeBus.publish('incidents:update', updated);
    return updated;
  }

  /**
   * Countdown expired: Escalate incident to emergency contacts
   * [MVP Adapter / Mock Notice] Clearly documented mock adapter for trusted emergency contacts.
   */
  static async escalateSos(
    incident: Incident,
    contacts: EmergencyContact[],
    snapshotUrl?: string,
    homeownerName?: string,
    homeName?: string,
    durationMinutes: 5 | 10 = 5
  ): Promise<EscalationResult> {
    const now = new Date();
    const entropy = Math.random().toString(36).substring(2, 6);
    const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);
    const primary = sortedContacts[0];

    const escalationRecords: EscalationRecord[] = sortedContacts.map((contact, idx) => ({
      id: `esc-${Date.now()}-${entropy}-${contact.id}`,
      incident_id: incident.id,
      contact_id: contact.id,
      contact_name: contact.name,
      phone: contact.phone,
      status: 'delivered',
      dispatched_at: now.toISOString(),
      delivered_at: new Date(now.getTime() + (idx + 1) * 600).toISOString(),
      payload: {
        incident_type: incident.type,
        latitude: incident.latitude,
        longitude: incident.longitude,
        snapshot_url: snapshotUrl || incident.detection?.snapshot_url,
        message: `EMERGENCY ALERT from SANJAYA: ${homeownerName || 'Resident'} has escalated an SOS alert from ${homeName || 'home'}. Location: https://maps.google.com/?q=${incident.latitude},${incident.longitude}. Please check immediately.`,
      },
    }));

    const updatedIncident: Incident = {
      ...incident,
      status: 'escalated',
      notes: `Primary emergency contact notified (${primary?.name || 'Contact'}). Starting ${durationMinutes}-minute response escalation timer.`,
      timeline: [
        ...incident.timeline,
        {
          id: `tl-esc-${Date.now()}-${entropy}-1`,
          timestamp: now.toISOString(),
          title: 'Countdown Expired',
          description: 'Verification countdown elapsed without cancellation.',
          type: 'escalated',
        },
        {
          id: `tl-esc-${Date.now()}-${entropy}-2`,
          timestamp: now.toISOString(),
          title: 'Primary Emergency Contact Notified',
          description: primary 
            ? `Automated SMS & alert package dispatched to primary contact: ${primary.name} (${primary.phone}). Awaiting response (${durationMinutes}m window).`
            : 'No emergency contacts configured; awaiting secondary escalation.',
          type: 'escalated',
        },
      ],
    };

    // Initiate the Background-Resilient Emergency Escalation Session
    const session = await EmergencyEscalationService.startEscalationSession({
      incident: updatedIncident,
      primaryContact: primary,
      allContacts: sortedContacts,
      durationMinutes,
      userName: homeownerName || 'Resident',
      homeName,
    });

    const mockDispatchNotice =
      `[SANJAYA Emergency Response] Notification delivered to primary emergency contact ${primary?.name || ''} (${primary?.phone || ''}). ` +
      `Response timer active: ${durationMinutes} minutes. If unacknowledged, secondary escalation will trigger automatically.`;

    realtimeBus.publish('incidents:update', updatedIncident);
    realtimeBus.publish('escalation:dispatched', {
      incident: updatedIncident,
      records: escalationRecords,
      notice: mockDispatchNotice,
      session,
    });

    return {
      incident: updatedIncident,
      escalationRecords,
      mockDispatchNotice,
      escalationSession: session,
    };
  }
}
