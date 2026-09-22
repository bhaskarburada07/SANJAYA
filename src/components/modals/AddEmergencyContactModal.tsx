import React, { useState } from 'react';
import { X, Shield, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { EmergencyContact } from '../../types';

interface AddEmergencyContactModalProps {
  onClose: () => void;
  contactToEdit?: EmergencyContact | null;
}

export const AddEmergencyContactModal: React.FC<AddEmergencyContactModalProps> = ({ onClose, contactToEdit }) => {
  const { addEmergencyContact, updateEmergencyContact, emergencyContacts } = useData();
  const [name, setName] = useState(contactToEdit?.name || '');
  const [relationship, setRelationship] = useState(contactToEdit?.relationship || 'Family');
  const [phone, setPhone] = useState(contactToEdit?.phone || '+91 ');
  const [priority, setPriority] = useState<number>(contactToEdit?.priority || emergencyContacts.length + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (contactToEdit) {
      updateEmergencyContact(contactToEdit.id, {
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        priority: Number(priority),
      });
    } else {
      addEmergencyContact({
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        priority: Number(priority),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-zinc-900" />
            <h2 className="text-lg font-bold text-zinc-900">
              {contactToEdit ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Contact Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Relationship
            </label>
            <input
              type="text"
              required
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Father, Sister, Trusted Neighbor"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Mobile Phone (SMS & Alert)
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:border-zinc-400 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Priority Order
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none shadow-xs"
            >
              <option value={1}>Priority 1 (First Notified)</option>
              <option value={2}>Priority 2</option>
              <option value={3}>Priority 3</option>
              <option value={4}>Priority 4</option>
            </select>
          </div>

          <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 text-xs text-zinc-600">
            During an escalated SOS, this contact will receive an emergency notification with your location and camera snapshot.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition"
            >
              <Check className="h-4 w-4" />
              <span>Save Contact</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
