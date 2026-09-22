/**
 * Web Audio API synthesizer for clean, subtle security chimes and SOS alert beeps.
 * Works offline with zero network latency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playDoorbellChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(659.25, now); // E5
  osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.4); // C5

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(523.25, now + 0.3); // C5
  osc2.frequency.exponentialRampToValueAtTime(392.00, now + 0.9); // G4

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now + 0.3);
  osc1.stop(now + 0.45);
  osc2.stop(now + 1.2);
}

export function playUnknownAlertTone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(330, now + 0.15);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.4);
}

export function playSosBeep(isFinalSeconds = false) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = isFinalSeconds ? 'sawtooth' : 'sine';
  osc.frequency.setValueAtTime(isFinalSeconds ? 880 : 587.33, now); // D5 or A5

  gain.gain.setValueAtTime(isFinalSeconds ? 0.3 : 0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinalSeconds ? 0.25 : 0.15));

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + (isFinalSeconds ? 0.25 : 0.15));
}
