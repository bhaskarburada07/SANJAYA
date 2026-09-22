import React, { useState } from 'react';
import { Trash2, Loader2, Clock } from 'lucide-react';
import { AppNotification } from '../../types';

interface DeleteNotificationModalProps {
  notification: AppNotification;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeleteNotificationModal: React.FC<DeleteNotificationModalProps> = ({
  notification,
  onConfirm,
  onCancel,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: unknown) {
      console.error('Failed to delete notification:', err);
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Unable to delete notification. Please try again.';
      setError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-notification-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div
        id="delete-notification-modal"
        className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-4 ring-rose-50">
          <Trash2 className="h-6 w-6" />
        </div>

        <h3 id="delete-notification-title" className="text-base font-bold text-zinc-900">
          Delete notification?
        </h3>

        <p id="delete-notification-description" className="mt-2 text-xs text-zinc-500 leading-relaxed">
          Are you sure you want to delete this notification?
        </p>

        {/* Selected notification preview */}
        {notification.title && (
          <div className="mt-3.5 rounded-xl bg-zinc-50 p-3 border border-zinc-200 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-900 truncate">{notification.title}</span>
              <span className="text-[10px] text-zinc-400 font-mono shrink-0 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {new Date(notification.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200 text-left">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            id="cancel-delete-notification-btn"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-notification-btn"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
