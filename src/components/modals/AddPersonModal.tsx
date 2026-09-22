import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { TrustedPerson } from '../../types';
import { trustedPeopleService } from '../../services/trustedPeopleService';

interface AddPersonModalProps {
  onClose: () => void;
  personToEdit?: TrustedPerson | null;
  onSuccess?: (message: string) => void;
}

const RELATIONSHIP_OPTIONS = [
  'Brother',
  'Sister',
  'Father',
  'Mother',
  'Friend',
  'Other',
];

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  onClose,
  personToEdit,
  onSuccess,
}) => {
  const { addTrustedPerson, updateTrustedPerson } = useData();
  const { user } = useAuth();
  const userId = user?.id || 'usr-bhaskar-101';

  const isEditMode = Boolean(personToEdit);

  // Form State
  const [name, setName] = useState<string>(personToEdit?.name || '');
  const [relationship, setRelationship] = useState<string>(
    personToEdit?.relationship || 'Brother'
  );
  const [phone, setPhone] = useState<string>(personToEdit?.phone || '');
  const [notes, setNotes] = useState<string>(personToEdit?.notes || '');
  const [isConfirmedTrusted, setIsConfirmedTrusted] = useState<boolean>(true);

  // Photo State
  const [photoPreview, setPhotoPreview] = useState<string>(
    personToEdit?.photo_url || ''
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Image file must be under 10MB.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      const objectUrl = URL.createObjectURL(file);
      setPhotoPreview(objectUrl);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPhotoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate Name
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    // Validate Phone (optional, but if provided check standard format)
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^[+0-9\s\-()]{7,20}$/.test(trimmedPhone)) {
      setErrorMessage('Please enter a valid phone number (e.g. +91 98765 43210).');
      return;
    }

    // Validate Confirmation
    if (!isConfirmedTrusted) {
      setErrorMessage('Please confirm adding this person as a trusted person.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalPhotoUrl = photoPreview;

      // If user selected a new file, upload to Supabase Storage
      if (selectedFile) {
        try {
          finalPhotoUrl = await trustedPeopleService.uploadPhoto(selectedFile, userId);
        } catch (uploadErr) {
          console.warn('Storage upload fallback:', uploadErr);
        }
      }

      if (isEditMode && personToEdit) {
        // Update existing record
        await updateTrustedPerson(personToEdit.id, {
          name: trimmedName,
          relationship,
          phone: trimmedPhone || undefined,
          notes: notes.trim() || undefined,
          photo_url: finalPhotoUrl || undefined,
        });

        onSuccess?.('Changes saved.');
      } else {
        // Create new record
        await addTrustedPerson({
          name: trimmedName,
          relationship,
          phone: trimmedPhone || undefined,
          notes: notes.trim() || undefined,
          photo_url: finalPhotoUrl || undefined,
        });

        onSuccess?.('Person added successfully.');
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving trusted person:', err);
      setErrorMessage(err?.message || 'Failed to save person to database. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="person-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="person-modal-container"
        className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
          <div>
            <h2 id="person-modal-title" className="text-lg font-bold text-zinc-900">
              {isEditMode ? 'Edit trusted person' : 'Add trusted person'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEditMode
                ? 'Update member details in the trusted database.'
                : 'Enroll a family member or friend in the trusted database.'}
            </p>
          </div>
          <button
            id="close-person-modal-btn"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="person-modal-error"
            className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Profile Photo
            </label>

            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-6 w-6 text-zinc-400" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="profile-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  id="add-photo-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50 transition"
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5 text-zinc-500" />
                  <span>{photoPreview ? 'Change Photo' : 'Add Photo'}</span>
                </button>

                {photoPreview && (
                  <button
                    id="remove-photo-btn"
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs font-medium text-zinc-500 hover:text-rose-600 transition px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-400">
              Upload a clear face photo. Stored securely in database storage.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="person-full-name-input"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="person-full-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              autoFocus={!isEditMode}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs"
            />
          </div>

          {/* Relationship */}
          <div>
            <label
              htmlFor="person-relationship-select"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Relationship <span className="text-rose-500">*</span>
            </label>
            <select
              id="person-relationship-select"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs"
            >
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number (optional) */}
          <div>
            <label
              htmlFor="person-phone-input"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Phone Number <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              id="person-phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label
              htmlFor="person-notes-input"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Notes <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="person-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Key holder, authorized entry on weekdays"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs resize-none"
            />
          </div>

          {/* Trusted Person Confirmation */}
          <div className="pt-1 pb-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="trusted-person-confirmation-checkbox"
                type="checkbox"
                checked={isConfirmedTrusted}
                onChange={(e) => setIsConfirmedTrusted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="text-xs text-zinc-700 select-none">
                Add this person as a trusted person
              </span>
            </label>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              id="cancel-person-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="save-person-btn"
              type="submit"
              disabled={isSubmitting || !name.trim() || !isConfirmedTrusted}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditMode ? 'Save Changes' : 'Save Person'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
