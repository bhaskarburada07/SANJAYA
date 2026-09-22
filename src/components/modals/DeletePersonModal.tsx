import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { TrustedPerson } from '../../types';

interface DeletePersonModalProps {
  person: TrustedPerson;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeletePersonModal: React.FC<DeletePersonModalProps> = ({
  person,
  onConfirm,
  onCancel,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      console.error('Failed to remove person:', err);
      setError(err?.message || 'Failed to remove trusted person.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-person-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div
        id="delete-person-modal"
        className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-4 ring-rose-50">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h3 id="delete-person-title" className="text-base font-bold text-zinc-900">
          Remove this trusted person?
        </h3>

        <p id="delete-person-description" className="mt-2 text-xs text-zinc-500 leading-relaxed">
          This person will no longer be recognized as a trusted person.
        </p>

        {person.name && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-1.5 border border-zinc-200 text-xs font-medium text-zinc-800">
            <span>{person.name}</span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-500">{person.relationship}</span>
          </div>
        )}

        {error && (
          <div className="mt-3 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            id="cancel-delete-person-btn"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-remove-person-btn"
            type="button"
            onClick={handleRemove}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
};
