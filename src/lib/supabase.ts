import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Event emitter for real-time reactivity in standalone demo / preview mode
 */
type Listener = (payload: any) => void;

class RealtimeEventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(topic: string, listener: Listener) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(listener);

    return () => {
      this.listeners.get(topic)?.delete(listener);
    };
  }

  publish(topic: string, payload: any) {
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.forEach(listener => {
        try {
          listener(payload);
        } catch (err) {
          console.error(`Error in realtime bus subscriber for ${topic}:`, err);
        }
      });
    }
  }
}

export const realtimeBus = new RealtimeEventBus();
