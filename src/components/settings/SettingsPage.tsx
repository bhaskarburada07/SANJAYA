import React, { useState } from 'react';
import { 
  Shield, 
  Eye, 
  Bell, 
  Lock, 
  Check, 
  Trash2, 
  Download, 
  Volume2, 
  Tv,
  LogOut,
  User,
  Mail,
  Key,
  Clock
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, clearAllDetections, setIndoorMonitorMode } = useData();
  const { user, profile, logout } = useAuth();
  const activeUser = user || profile;
  const [activeSection, setActiveSection] = useState<'privacy' | 'recognition' | 'notifications' | 'emergency'>('privacy');
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleToggle = (key: keyof typeof settings, value: any) => {
    updateSettings({ [key]: value });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            Settings
          </h1>
          <p className="text-xs text-zinc-500">
            Configure privacy preferences, AI detection thresholds, and emergency policies.
          </p>
        </div>

        {showSavedToast && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 animate-in fade-in">
            <Check className="h-3.5 w-3.5" />
            <span>Saved</span>
          </div>
        )}
      </div>

      {/* Category Tabs matching Screen 8 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveSection('privacy')}
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold border transition ${
            activeSection === 'privacy'
              ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Privacy</span>
        </button>

        <button
          onClick={() => setActiveSection('recognition')}
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold border transition ${
            activeSection === 'recognition'
              ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Recognition</span>
        </button>

        <button
          onClick={() => setActiveSection('notifications')}
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold border transition ${
            activeSection === 'notifications'
              ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveSection('emergency')}
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold border transition ${
            activeSection === 'emergency'
              ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Emergency</span>
        </button>
      </div>

      {/* Section 1: Privacy matching Screen 8 */}
      {activeSection === 'privacy' && (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 space-y-5 shadow-xs">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-base font-bold text-zinc-900">Privacy Controls</h2>
            <p className="text-xs text-zinc-500">
              Manage how visitor imagery, face embeddings, and telemetry are processed and stored.
            </p>
          </div>

          <div className="space-y-4">
            {/* Face recognition on-device */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-xs font-bold text-zinc-900">Enable On-Device Face Recognition</div>
                <div className="text-[11px] text-zinc-500">
                  Embeddings are extracted locally. No raw face photos are sent to third-party AI APIs.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.face_recognition_enabled}
                onChange={(e) => handleToggle('face_recognition_enabled', e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 accent-zinc-900"
              />
            </div>

            {/* Video Storage */}
            <div className="flex items-center justify-between py-2 border-t border-zinc-100">
              <div>
                <div className="text-xs font-bold text-zinc-900">Store Video Locally On Your Device</div>
                <div className="text-[11px] text-zinc-500">
                  Continuous video streams remain inside your local edge bridge or private storage.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.local_storage_only}
                onChange={(e) => handleToggle('local_storage_only', e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 accent-zinc-900"
              />
            </div>

            {/* Snapshot retention */}
            <div className="flex items-center justify-between py-2 border-t border-zinc-100">
              <div>
                <div className="text-xs font-bold text-zinc-900">Snapshot Retention Window</div>
                <div className="text-[11px] text-zinc-500">
                  Automatically purge historical visitor snapshots after specified days.
                </div>
              </div>
              <select
                value={settings.snapshot_retention_days}
                onChange={(e) => handleToggle('snapshot_retention_days', Number(e.target.value))}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none shadow-xs"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days (Recommended)</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            {/* Location sharing */}
            <div className="flex items-center justify-between py-2 border-t border-zinc-100">
              <div>
                <div className="text-xs font-bold text-zinc-900">Share Location During SOS</div>
                <div className="text-[11px] text-zinc-500">
                  Embed home GPS coordinates in alert messages sent to emergency contacts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.location_sharing_enabled}
                onChange={(e) => handleToggle('location_sharing_enabled', e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 accent-zinc-900"
              />
            </div>

            {/* Indoor Monitor Mode */}
            <div className="flex items-center justify-between py-2 border-t border-zinc-100">
              <div className="flex items-start gap-2">
                <Tv className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-zinc-900">Indoor Monitor Tablet Mode</div>
                  <div className="text-[11px] text-zinc-500">
                    Optimizes the UI layout for stationary wall-mounted touch monitors.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.indoor_monitor_mode}
                onChange={(e) => setIndoorMonitorMode(e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 accent-zinc-900"
              />
            </div>
          </div>

          {/* Privacy Actions */}
          <div className="pt-4 border-t border-zinc-100 flex flex-wrap gap-3">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sanjaya-privacy-export.json';
                a.click();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
            >
              <Download className="h-4 w-4" />
              <span>Download My Data (GDPR)</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Clear all visitor detection records and snapshots?')) {
                  clearAllDetections();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs transition"
            >
              <Trash2 className="h-4 w-4" />
              <span>Purge Visitor History</span>
            </button>
          </div>
        </div>
      )}

      {/* Section 2: Recognition */}
      {activeSection === 'recognition' && (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 space-y-5 shadow-xs">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-base font-bold text-zinc-900">AI Vision & Recognition</h2>
            <p className="text-xs text-zinc-500">
              Tune sensitivity and thresholds for human presence detection and facial recognition.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-zinc-900">Face Matching Confidence Threshold</span>
                <span className="text-zinc-900 font-mono font-bold">{(settings.confidence_threshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={settings.confidence_threshold}
                onChange={(e) => handleToggle('confidence_threshold', parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Higher threshold prevents false recognitions. Lower threshold improves detection in low light.
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-zinc-100">
              <div>
                <div className="text-xs font-bold text-zinc-900">Unknown Person Awareness Alerts</div>
                <div className="text-[11px] text-zinc-500">
                  Display real-time visual alerts whenever an unclassified visitor is detected.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.unknown_person_alert}
                onChange={(e) => handleToggle('unknown_person_alert', e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 accent-zinc-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Notifications */}
      {activeSection === 'notifications' && (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 space-y-5 shadow-xs">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-base font-bold text-zinc-900">Notification & Chime Settings</h2>
            <p className="text-xs text-zinc-500">
              Customize sounds and tones for entrance arrivals and security warnings.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-start gap-2">
                <Volume2 className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-zinc-900">Chime & Alert Audio Synthesis</div>
                  <div className="text-[11px] text-zinc-500">
                    Play gentle two-tone chimes for known visitors and pulsating alerts for SOS countdowns.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.alert_audio_enabled}
                onChange={(e) => handleToggle('alert_audio_enabled', e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 accent-zinc-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Emergency */}
      {activeSection === 'emergency' && (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 space-y-5 shadow-xs">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-base font-bold text-zinc-900">Emergency SOS & Escalation Policy</h2>
            <p className="text-xs text-zinc-500">
              Configure grace periods before automated escalation alerts are dispatched.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-zinc-900">SOS Verification Countdown Duration</span>
                <span className="text-rose-600 font-mono font-bold">{settings.sos_countdown_seconds} seconds</span>
              </div>
              <select
                value={settings.sos_countdown_seconds}
                onChange={(e) => handleToggle('sos_countdown_seconds', Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none shadow-xs"
              >
                <option value={15}>15 seconds (High urgency)</option>
                <option value={30}>30 seconds (Standard SANJAYA default)</option>
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds (Extended verification)</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">
                Homeowners have this amount of time to hit "Cancel SOS" if triggered inadvertently before emergency contacts receive text alerts.
              </p>
            </div>

            {/* Emergency Contact Response Waiting Time (5 min / 10 min) */}
            <div className="pt-3 border-t border-zinc-100">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-zinc-900">Emergency Contact Response Waiting Time</span>
                <span className="text-zinc-900 font-mono font-bold">{settings.escalation_wait_minutes || 5} minutes</span>
              </div>
              <select
                value={settings.escalation_wait_minutes || 5}
                onChange={(e) => handleToggle('escalation_wait_minutes', Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none shadow-xs"
              >
                <option value={5}>5 minutes (Standard Emergency Escalation)</option>
                <option value={10}>10 minutes (Extended Escalation Window)</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">
                After the primary emergency contact is notified, SANJAYA starts this response timer. If unacknowledged within this window, the SANJAYA AI Brain automatically begins secondary escalation to identify the nearest verified emergency authority.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account & Authentication Session Area */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-600" />
              Account & Authentication Session
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Current signed-in homeowner account and session security controls.
            </p>
          </div>

          <button
            id="settings-logout-btn"
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition shadow-xs cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 block">Homeowner Name</span>
            <span className="font-semibold text-zinc-900">{activeUser?.full_name || activeUser?.name || 'Homeowner'}</span>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 block">Email Address</span>
            <span className="font-semibold text-zinc-900">{activeUser?.email || 'N/A'}</span>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 block">User Identifier</span>
            <span className="font-mono text-[11px] text-zinc-600 truncate block">{activeUser?.id || 'usr-local'}</span>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 block">Last Session Activity</span>
            <span className="text-zinc-700">
              {activeUser?.last_login_at 
                ? new Date(activeUser.last_login_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Current session active'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
