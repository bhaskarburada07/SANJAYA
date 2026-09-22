import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Clock, 
  Trash2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AppNotification } from '../../types';
import { DeleteNotificationModal } from '../modals/DeleteNotificationModal';

type NotificationFilter = 'all' | 'security' | 'system' | 'emergency';

export const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    deleteNotification 
  } = useData();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [notificationToDelete, setNotificationToDelete] = useState<AppNotification | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;
    try {
      await deleteNotification(notificationToDelete.id);
      setNotificationToDelete(null);
      setToast({ type: 'success', message: 'Notification deleted' });
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw new Error('Unable to delete notification. Please try again.');
    }
  };

  const filteredNotifications = React.useMemo(() => {
    const seen = new Set<string>();
    return notifications.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      if (filter === 'all') return true;
      return item.category === filter;
    });
  }, [notifications, filter]);

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-2xl">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          id="notification-toast-message"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl ${
            toast.type === 'error' ? 'bg-rose-900 text-white' : 'bg-zinc-900 text-white'
          } px-4 py-3 text-xs font-semibold shadow-xl ring-1 ring-white/10 animate-in slide-in-from-bottom-5 duration-200`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-zinc-900" />
            Notifications
          </h1>
          <p className="text-xs text-zinc-500">
            Stay updated on your home safety, visitor arrivals, and alert events.
          </p>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'security', 'system', 'emergency'] as NotificationFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
              filter === tab
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center space-y-3 shadow-xs">
          <Bell className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="text-base font-bold text-zinc-900">No notifications</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You're all caught up! Detections and camera updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((item) => {
            const isEmergency = item.category === 'emergency';
            const isSecurity = item.category === 'security';
            const isSystem = item.category === 'system';

            return (
              <div
                key={item.id}
                onClick={() => markNotificationRead(item.id)}
                className={`cursor-pointer flex items-start justify-between rounded-2xl border p-4 transition ${
                  item.read
                    ? 'border-zinc-200 bg-white/60 opacity-75'
                    : 'border-zinc-200 bg-white shadow-xs'
                } hover:border-zinc-300`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Category icon */}
                  <div
                    className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                      isEmergency
                        ? 'bg-rose-50 text-rose-600'
                        : isSecurity
                        ? 'bg-amber-50 text-amber-600'
                        : isSystem
                        ? 'bg-zinc-100 text-zinc-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {isEmergency ? (
                      <ShieldAlert className="h-4 w-4" />
                    ) : isSecurity ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : isSystem ? (
                      <Info className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-900">{item.title}</h4>
                      {!item.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {!item.read && (
                    <span className="text-[10px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                  <button
                    id={`delete-notification-${item.id}`}
                    type="button"
                    aria-label={`Delete notification: ${item.title}`}
                    title="Delete notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificationToDelete(item);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100 focus:outline-hidden"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {notificationToDelete && (
        <DeleteNotificationModal
          notification={notificationToDelete}
          onConfirm={handleDeleteNotification}
          onCancel={() => setNotificationToDelete(null)}
        />
      )}
    </div>
  );
};
