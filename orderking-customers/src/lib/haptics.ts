/**
 * OrderKing Micro-Haptic & Sensory Feedback Engine
 * 
 * Provides tactile haptic vibration patterns and low-latency synthesized acoustic cues.
 * Engineered for dopamine reinforcement, tactile confirmation, and psychological reassurance
 * for first-time, elderly, and rural users on low-end and high-end smartphones alike.
 */

export type HapticType =
  | "tap"
  | "add_to_cart"
  | "scratch"
  | "scratch_reveal"
  | "checkout_success"
  | "selection"
  | "error";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass();
      } catch {
        // AudioContext initialization blocked or unavailable
      }
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playSynthesizedSound(type: HapticType) {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("orderking_sounds") === "false") {
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case "add_to_cart": {
        // Warm buoyant upward pop (440Hz -> 660Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case "scratch": {
        // Very subtle micro-click / tick (1200Hz, 8ms)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(800 + Math.random() * 400, now);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.02);
        break;
      }

      case "scratch_reveal": {
        // Golden triumphal arpeggio: C5, E5, G5, C6
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.07;
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.15, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.3);
        });
        break;
      }

      case "checkout_success": {
        // Royal prestige major chord fanfare: E5, G#5, B5, E6
        const chord = [659.25, 830.61, 987.77, 1318.51];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.05;
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.18, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.55);
        });
        break;
      }

      case "error": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(160, now + 0.08);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      default:
        break;
    }
  } catch {
    // Audio synthesis failure safe fallback
  }
}

/**
 * Triggers safe micro-haptic vibration on supported devices and acoustic confirmation.
 */
export function triggerHaptic(type: HapticType = "tap"): void {
  if (typeof window === "undefined") return;

  // Respect user preference if explicitly disabled
  try {
    if (localStorage.getItem("orderking_haptics") === "false") {
      playSynthesizedSound(type);
      return;
    }
  } catch {
    // Storage restricted
  }

  // Web Vibration API
  if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      switch (type) {
        case "tap":
        case "selection":
          navigator.vibrate(10);
          break;
        case "add_to_cart":
          // Tactile satisfying double micro-tap
          navigator.vibrate([15, 25, 18]);
          break;
        case "scratch":
          // Fine micro-pulse
          navigator.vibrate(8);
          break;
        case "scratch_reveal":
          // Celebratory rolling pulse
          navigator.vibrate([30, 40, 50, 40, 60]);
          break;
        case "checkout_success":
          // Solid, confidence-inspiring confirmation pattern
          navigator.vibrate([35, 45, 30, 50, 80]);
          break;
        case "error":
          navigator.vibrate([40, 60, 40]);
          break;
      }
    } catch {
      // Ignore vibration error
    }
  }

  // Complement with soothing micro-audio feedback
  playSynthesizedSound(type);
}
