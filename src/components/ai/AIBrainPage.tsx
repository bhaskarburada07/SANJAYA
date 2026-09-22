import React, { useState } from 'react';
import { 
  Sparkles, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Brain, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Send, 
  Camera as CameraIcon, 
  MapPin, 
  Users, 
  Bell, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
  Check,
  Zap,
  CornerDownRight,
  UserCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { NavScreen } from '../common/Sidebar';
import { 
  AISeverity, 
  AIClassification, 
  AINotification, 
  AINotificationAction, 
  SecurityEvent, 
  AIAnalysis, 
  AIInsight, 
  AIConversationMessage 
} from '../../types';

interface AIBrainPageProps {
  onNavigate: (screen: NavScreen) => void;
}

export const AIBrainPage: React.FC<AIBrainPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { 
    aiBrainState, 
    aiBrainStatus, 
    sendAIAssistantQuery, 
    refreshDailySummary,
    dismissAINotification,
    markAINotificationSafe,
    securityMode,
    setSecurityMode,
    cameras,
    zones,
    trustedPeople,
    setActiveCameraId,
    setSelectedIncident,
    incidents
  } = useData();

  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'insights' | 'assistant'>('overview');

  const homeownerName = user?.full_name || user?.name || 'Homeowner';
  const homeName = user?.home_name || (user?.name ? `${user.name}'s Home` : 'Protected Home');

  const status = aiBrainStatus;
  const events = aiBrainState?.events || [];
  const analyses = aiBrainState?.analyses || [];
  const insights = aiBrainState?.insights || [];
  const notifications = aiBrainState?.notifications || [];
  const dailySummary = aiBrainState?.dailySummary;
  const conversation = aiBrainState?.conversation || [];

  const handleSendPrompt = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim() || isSending) return;

    setChatInput('');
    setIsSending(true);
    try {
      await sendAIAssistantQuery(query);
    } finally {
      setIsSending(false);
    }
  };

  const getSeverityBadge = (severity: AISeverity) => {
    switch (severity) {
      case 'emergency':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">EMERGENCY</span>;
      case 'high':
        return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">HIGH RISK</span>;
      case 'attention':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">ATTENTION REQUIRED</span>;
      case 'info':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">INFORMATIONAL</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">NORMAL</span>;
    }
  };

  const getHomeStatusColor = (homeStatus: string) => {
    switch (homeStatus) {
      case 'Emergency':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'High Risk':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Attention Required':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Informational':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  const handleNotificationAction = (actionKey: string, payload?: Record<string, unknown>, notifId?: string) => {
    if (notifId && (actionKey === 'dismiss' || actionKey === 'mark_safe')) {
      if (actionKey === 'mark_safe') markAINotificationSafe(notifId);
      else dismissAINotification(notifId);
      return;
    }

    if (actionKey === 'view_camera') {
      if (payload?.cameraId && typeof payload.cameraId === 'string') {
        setActiveCameraId(payload.cameraId);
      }
      onNavigate('live');
    } else if (actionKey === 'view_event') {
      onNavigate('incidents');
    } else if (actionKey === 'notify_family') {
      onNavigate('emergency');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">SANJAYA AI Brain</h1>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Central Intelligence Layer correlating camera telemetry, perimeter zones, family presence, and security modes.
              </p>
            </div>
          </div>

          {/* Quick Engine & Mode Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700">
              <Cpu className="h-3.5 w-3.5 text-zinc-500" />
              <span className="font-medium text-zinc-500">Engine:</span>
              <span className="font-semibold text-zinc-900">{status?.modelUsed || 'gemini-3.8-flash'}</span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700">
              <Shield className="h-3.5 w-3.5 text-zinc-500" />
              <span className="font-medium text-zinc-500">Mode:</span>
              <span className="font-semibold uppercase text-zinc-900">{securityMode}</span>
            </div>

            <button
              onClick={() => refreshDailySummary()}
              className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
              title="Refresh AI Analysis"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* AI Status Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-zinc-100 pt-5">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Monitoring Status</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-zinc-900 truncate">
                {status?.monitoringStatus || 'Continuous Multi-Zone Guard'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Home Security Status</span>
            <div className="mt-1">
              <span className={`inline-block rounded-lg border px-2 py-0.5 text-xs font-bold ${getHomeStatusColor(status?.currentHomeStatus || 'Normal')}`}>
                {status?.currentHomeStatus || 'Normal'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Events Analyzed Today</span>
            <div className="mt-1 text-sm font-bold text-zinc-900">
              {status?.totalEventsAnalyzedToday || events.length} <span className="text-xs font-normal text-zinc-500">events</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Last Reasoning Cycle</span>
            <div className="mt-1 text-xs font-semibold text-zinc-900 flex items-center gap-1">
              <Clock className="h-3 w-3 text-zinc-400" />
              <span>{status?.lastAnalysisTime ? new Date(status.lastAnalysisTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'overview'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Security Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'timeline'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Security Timeline</span>
          {events.length > 0 && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.2 text-[10px] text-zinc-600 font-bold">
              {events.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'insights'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>AI Insights</span>
          {insights.length > 0 && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.2 text-[10px] text-zinc-600 font-bold">
              {insights.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'assistant'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Brain className="h-4 w-4" />
          <span>AI Security Assistant</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Daily AI Security Summary */}
          {dailySummary && (
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <Sparkles className="h-4 w-4 text-zinc-700" />
                  <span>Today's Security Summary · {dailySummary.date}</span>
                </div>
                <button
                  onClick={() => setActiveTab('assistant')}
                  className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>Ask Sanjaya AI</span>
                </button>
              </div>

              <div className="mt-3">
                <h3 className="text-base font-bold text-zinc-900">{dailySummary.headline}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  {dailySummary.detailedParagraph}
                </p>
              </div>

              {/* Counts metrics */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3">
                  <span className="text-[11px] text-zinc-500">Verified Family</span>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">
                    {dailySummary.normalCount} <span className="text-xs font-normal text-zinc-500">arrivals</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3">
                  <span className="text-[11px] text-zinc-500">Routine Motion</span>
                  <div className="text-base font-bold text-zinc-700 mt-0.5">
                    {dailySummary.routineMotionCount} <span className="text-xs font-normal text-zinc-500">events</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3">
                  <span className="text-[11px] text-zinc-500">Attention Required</span>
                  <div className="text-base font-bold text-amber-700 mt-0.5">
                    {dailySummary.attentionCount} <span className="text-xs font-normal text-zinc-500">events</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3">
                  <span className="text-[11px] text-zinc-500">Critical Alerts</span>
                  <div className="text-base font-bold text-red-700 mt-0.5">
                    {dailySummary.criticalCount} <span className="text-xs font-normal text-zinc-500">events</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Notifications Queue */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Smart Contextual Notifications</h3>
                <p className="text-xs text-zinc-500">Deduplicated, multi-factor alerts generated by the AI Brain.</p>
              </div>
              <span className="text-xs font-medium text-zinc-400">
                {notifications.length} active notice(s)
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-sm font-semibold text-zinc-800">All notifications clear</p>
                <p className="text-xs text-zinc-500">The AI Brain will deliver contextual alerts here when attention is warranted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif: AINotification) => (
                  <div 
                    key={notif.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 hover:border-zinc-300 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(notif.severity)}
                        <span className="text-sm font-bold text-zinc-900">{notif.title}</span>
                      </div>
                      <p className="text-xs text-zinc-600">{notif.message}</p>
                      <span className="text-[10px] text-zinc-400 block">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {notif.actions.map((act: AINotificationAction, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleNotificationAction(act.actionKey, act.payload, notif.id)}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick AI Security Assistant Box */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-5 w-5 text-zinc-800" />
              <h3 className="text-base font-bold text-zinc-900">Ask the AI Security Brain</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Directly interrogate your home's security logs, camera state, or family arrivals without searching through raw feeds.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {[
                'What happened while I was away?',
                'Is my home secure?',
                'Show me today\'s unusual events',
                'Which zone had the most activity?',
                'Did anyone enter the house today?',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(prompt)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                placeholder="Ask e.g. 'What happened last night?' or 'Why did I receive this alert?'"
                className="flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-hidden"
              />
              <button
                onClick={() => handleSendPrompt()}
                disabled={!chatInput.trim() || isSending}
                className="flex items-center gap-1.5 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition"
              >
                {isSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Investigate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900">AI-Powered Security Timeline</h3>
              <p className="text-xs text-zinc-500">Every event linked to its camera, zone, family member, security mode, and AI reasoning.</p>
            </div>
            <span className="text-xs font-medium text-zinc-400">
              {events.length} verified events
            </span>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No security events recorded yet today.
            </div>
          ) : (
            <div className="relative border-l-2 border-zinc-100 ml-4 pl-6 space-y-6">
              {events.map((evt: SecurityEvent, idx: number) => {
                const analysis = analyses.find((a: AIAnalysis) => a.eventId === evt.id);
                const isKnown = evt.personType === 'known' || !!evt.personName;

                return (
                  <div key={evt.id || idx} className="relative group">
                    {/* Dot on timeline */}
                    <div className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white ring-2 ${
                      evt.eventType === 'sos' ? 'bg-red-600 ring-red-200' :
                      evt.eventType === 'tamper' ? 'bg-orange-600 ring-orange-200' :
                      isKnown ? 'bg-emerald-500 ring-emerald-200' : 'bg-zinc-400 ring-zinc-200'
                    }`} />

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 hover:border-zinc-300 transition">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900">
                            {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs text-zinc-400">·</span>
                          <span className="text-xs font-semibold text-zinc-800">
                            {isKnown ? `${evt.personName} arrived` : evt.sourceName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {analysis && getSeverityBadge(analysis.severity)}
                          <span className="rounded-lg bg-zinc-200/70 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-600">
                            Mode: {evt.securityModeAtTime}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-zinc-600 leading-relaxed">
                        {analysis?.summary || 'Movement recorded in monitored zone.'}
                      </div>

                      {/* AI Insight Pill */}
                      {analysis?.reasoning && (
                        <div className="mt-3 rounded-xl bg-white border border-zinc-200 p-2.5 text-xs text-zinc-700 flex items-start gap-2">
                          <Brain className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-zinc-900">AI Context: </span>
                            <span>{analysis.reasoning}</span>
                          </div>
                        </div>
                      )}

                      {/* Source Metadata Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 font-medium text-zinc-700">
                          <CameraIcon className="h-3 w-3 text-zinc-400" />
                          {evt.sourceName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-zinc-700">
                          <MapPin className="h-3 w-3 text-zinc-400" />
                          {evt.zoneName || 'Main Entrance'}
                        </span>
                        {evt.dwellTimeSeconds && (
                          <>
                            <span>•</span>
                            <span>{evt.dwellTimeSeconds}s dwell time</span>
                          </>
                        )}
                        {isKnown && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">Verified Family</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-zinc-900">AI Pattern Discoveries</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Correlated observations derived across active hours, zones, security modes, and trusted arrival schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins: AIInsight) => (
              <div 
                key={ins.id}
                className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">{ins.title}</span>
                  </div>
                  {getSeverityBadge(ins.severity)}
                </div>

                <p className="text-xs leading-relaxed text-zinc-700">
                  {ins.observation}
                </p>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Confidence: {Math.round(ins.confidence * 100)}%</span>
                  {ins.suggestedAction && (
                    <span className="font-semibold text-zinc-800">
                      Recommendation: {ins.suggestedAction}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ASSISTANT */}
      {activeTab === 'assistant' && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <Brain className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Conversational Security Intelligence</h3>
                <p className="text-xs text-zinc-500">Reasons strictly from real application data. Never fabricates events.</p>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="space-y-4 min-h-[300px] max-h-[480px] overflow-y-auto p-2">
            {conversation.map((msg: AIConversationMessage) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white text-xs">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-800'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Data Points cards */}
                  {msg.dataPoints && msg.dataPoints.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-zinc-200/60 pt-2.5">
                      {msg.dataPoints.map((dp: { label: string; value: string }, i: number) => (
                        <div key={i} className="rounded-xl bg-white p-2 border border-zinc-100">
                          <span className="text-[10px] text-zinc-400 font-medium block">{dp.label}</span>
                          <span className="text-xs font-bold text-zinc-900 block mt-0.5">{dp.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested follow-up prompts */}
                  {msg.suggestedPrompts && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-zinc-200/40">
                      {msg.suggestedPrompts.map((p: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleSendPrompt(p)}
                          className="rounded-lg bg-white border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 transition"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 p-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>AI Brain is analyzing security telemetry...</span>
              </div>
            )}
          </div>

          {/* Prompt Bar */}
          <div className="border-t border-zinc-100 pt-4 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
              placeholder="Ask a question about your home's security..."
              className="flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-hidden"
            />
            <button
              onClick={() => handleSendPrompt()}
              disabled={!chatInput.trim() || isSending}
              className="flex items-center gap-1.5 rounded-2xl bg-zinc-900 px-5 py-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition"
            >
              <Send className="h-4 w-4" />
              <span>Ask</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
