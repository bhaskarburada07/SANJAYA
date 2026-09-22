import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  CornerDownLeft,
  Clock
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AIAssistantService, AssistantMessage } from '../../services/aiAssistantService';
import { Incident } from '../../types';

interface AIAssistantModalProps {
  onNavigateIncident?: (incident: Incident) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ onNavigateIncident }) => {
  const { user } = useAuth();
  const { 
    aiAssistantOpen, 
    setAiAssistantOpen, 
    incidents, 
    detections, 
    trustedPeople, 
    securityMode, 
    zones, 
    sensors, 
    dailyBrief,
    setSelectedIncident
  } = useData();

  const homeownerName = user?.full_name || user?.name || 'Bhaskar';
  const homeName = user?.home_name || 'Bhaskar Home';

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `Hello ${homeownerName}, I am SANJAYA's AI Security Investigator. ${homeName} is currently in ${securityMode.toUpperCase()} mode. You can ask me what happened while you were away, who arrived, or query any specific room or perimeter zone.`,
      suggestedPrompts: [
        'What happened while I was away?',
        'Who came home today?',
        'Show unusual activity',
        'Did anyone enter the backyard?',
        'What happened last night?'
      ],
    },
  ]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 0 && prev[0].id === 'init-1') {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          text: `Hello ${homeownerName}, I am SANJAYA's AI Security Investigator. ${homeName} is currently in ${securityMode.toUpperCase()} mode. You can ask me what happened while you were away, who arrived, or query any specific room or perimeter zone.`
        };
        return updated;
      }
      return prev;
    });
  }, [homeownerName, homeName, securityMode]);

  if (!aiAssistantOpen) return null;

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text: text.trim(),
    };

    const response = AIAssistantService.respond(text, {
      incidents,
      detections,
      trustedPeople,
      securityMode,
      zones,
      sensors,
      dailyBrief,
      homeownerName,
      homeName,
    });

    setMessages((prev) => [...prev, userMsg, response]);
    setInputQuery('');
  };

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">SANJAYA Security Investigator</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Neural Agent Ready
                </span>
              </div>
              <p className="text-xs text-zinc-500">Forensic incident audit & natural language query engine</p>
            </div>
          </div>

          <button
            onClick={() => setAiAssistantOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conversation Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isAssistant = msg.sender === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAssistant ? 'items-start' : 'items-end justify-end'}`}
              >
                {isAssistant && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  </div>
                )}

                <div className={`space-y-3 max-w-[85%] ${isAssistant ? '' : 'text-right'}`}>
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed ${
                      isAssistant
                        ? 'bg-zinc-100/90 text-zinc-800 border border-zinc-200/70'
                        : 'bg-zinc-900 text-white'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Data Points if available */}
                    {msg.dataPoints && msg.dataPoints.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-200/60 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {msg.dataPoints.map((dp, i) => (
                          <div key={i} className="rounded-lg bg-white/80 border border-zinc-200/50 p-2">
                            <span className="text-[10px] text-zinc-400 font-medium block">{dp.label}</span>
                            <span className="text-xs font-bold text-zinc-900">{dp.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Referenced Incident Cards */}
                    {msg.referencedIncidents && msg.referencedIncidents.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <span className="text-[11px] font-bold text-zinc-600 block">
                          Associated Incident Evidence:
                        </span>
                        {msg.referencedIncidents.map((inc, idx) => (
                          <div
                            key={`ref-inc-${inc.id}-${idx}`}
                            className="flex items-center justify-between rounded-xl bg-white border border-zinc-200 p-2.5 text-left hover:border-zinc-300 transition"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-zinc-900 text-xs truncate">
                                {inc.what || inc.notes || 'Incident Event'}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                {inc.where || 'Main Entrance'} · Risk: {inc.risk_level || 'MEDIUM'}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedIncident(inc);
                                setAiAssistantOpen(false);
                                if (onNavigateIncident) onNavigateIncident(inc);
                              }}
                              className="flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white shrink-0 hover:bg-zinc-800 transition"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Suggested Prompts Pills */}
                  {msg.suggestedPrompts && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedPrompts.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handlePromptClick(p)}
                          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 hover:text-zinc-900 transition"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputQuery);
            }}
            className="flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white p-1.5 focus-within:ring-2 focus-within:ring-zinc-900/10 focus-within:border-zinc-400 transition"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask SANJAYA (e.g. 'What happened while I was away?')"
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white disabled:opacity-40 hover:bg-zinc-800 transition shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
