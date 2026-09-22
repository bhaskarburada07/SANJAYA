import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Phone, 
  Info, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AddEmergencyContactModal } from '../modals/AddEmergencyContactModal';
import { EmergencyContact } from '../../types';

export const EmergencyContactsPage: React.FC = () => {
  const { 
    emergencyContacts, 
    deleteEmergencyContact, 
    updateEmergencyContact, 
    activateSos,
    settings,
    updateSettings,
    escalationSession,
    openEscalationModal,
  } = useData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  const movePriority = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === emergencyContacts.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = emergencyContacts[index];
    const target = emergencyContacts[targetIndex];

    updateEmergencyContact(current.id, { priority: target.priority });
    updateEmergencyContact(target.id, { priority: current.priority });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-zinc-900" />
            Emergency Contacts
          </h1>
          <p className="text-xs text-zinc-500">
            People SANJAYA can notify if you activate SOS or if an alert countdown expires.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Contacts List */}
      {emergencyContacts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center space-y-3 shadow-xs">
          <Shield className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="text-base font-bold text-zinc-900">No emergency contacts yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Configure at least one trusted friend, family member, or neighbor who can be reached if an SOS countdown expires.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Add Emergency Contact
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {emergencyContacts.map((contact, index) => (
            <div
              key={contact.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 font-bold text-sm ring-1 ring-zinc-200">
                  {contact.name.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-900">{contact.name}</h3>
                    {contact.relationship && (
                      <span className="text-xs text-zinc-500">({contact.relationship})</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 font-mono">
                    <Phone className="h-3 w-3 text-zinc-400" />
                    {contact.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Priority Badge */}
                <span className="rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700">
                  Priority {contact.priority}
                </span>

                {/* Priority order shifts */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => movePriority(index, 'up')}
                    disabled={index === 0}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-20"
                    title="Increase priority"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => movePriority(index, 'down')}
                    disabled={index === emergencyContacts.length - 1}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-20"
                    title="Decrease priority"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setEditingContact(contact)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                  title="Edit contact"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => deleteEmergencyContact(contact.id)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  title="Remove contact"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Escalation Banner */}
      {escalationSession && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <div>
              <div className="text-xs font-bold text-rose-950">Emergency Escalation Active</div>
              <div className="text-[11px] text-rose-800">
                {escalationSession.escalationStatus === 'waiting_contact_response'
                  ? `Waiting for primary contact response (${Math.floor(escalationSession.timerRemainingSeconds / 60)}:${String(escalationSession.timerRemainingSeconds % 60).padStart(2, '0')})`
                  : escalationSession.escalationStatus === 'contact_responded'
                  ? 'Primary contact acknowledged the alert.'
                  : 'Secondary escalation initiated with nearest emergency services.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => openEscalationModal()}
            className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
          >
            View Details
          </button>
        </div>
      )}

      {/* Escalation Policy Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-900">Emergency Escalation Waiting Window</div>
            <div className="text-[11px] text-zinc-500">
              Grace period for your primary contact to respond before automatic secondary escalation.
            </div>
          </div>
          <select
            value={settings.escalation_wait_minutes || 5}
            onChange={(e) => updateSettings({ escalation_wait_minutes: Number(e.target.value) as 5 | 10 })}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:border-zinc-400 focus:outline-none shadow-xs"
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
          </select>
        </div>
      </div>

      {/* Information Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 shadow-xs">
        <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          During an SOS, the primary contact is notified first and a {settings.escalation_wait_minutes || 5}-minute response timer starts. If unacknowledged, SANJAYA AI Brain automatically begins secondary escalation with verified nearest authorities.
        </p>
      </div>

      {/* Test SOS Button */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-rose-950">Test Emergency Flow</div>
          <div className="text-[11px] text-rose-800">
            Triggers the 30-second countdown with full cancellation ability.
          </div>
        </div>
        <button
          onClick={() => activateSos()}
          className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
        >
          Test SOS Now
        </button>
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingContact) && (
        <AddEmergencyContactModal 
          contactToEdit={editingContact}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingContact(null);
          }} 
        />
      )}
    </div>
  );
};
