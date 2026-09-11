// Web Audio API Procedural Chimes & Speech Announcements

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playOrderPlacedSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5

    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch {
    // Ignore audio errors in restricted browser contexts
  }
}

export function playOrderReadyChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Harmonious two-bell chime
    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.6);
    });
  } catch {
    // ignore
  }
}

export function announceTokenVoice(tokenNumber: string, counter: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    playOrderReadyChime();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // stop previous
    const text = `Attention! Token ${tokenNumber}, please collect your food at ${counter}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    // Pick a natural voice if available
    const voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
    const preferredVoice = Array.isArray(voices)
      ? voices.find(v => v && v.lang && v.lang.startsWith('en') && (v.name?.includes('Google') || v.name?.includes('Natural')))
      : undefined;
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
    // Also play chime
    playOrderReadyChime();
  } catch {
    playOrderReadyChime();
  }
}
