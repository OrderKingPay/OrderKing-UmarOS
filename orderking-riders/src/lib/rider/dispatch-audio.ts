import { useEffect, useRef, useState, useCallback } from "react";

export const VIBRATION_PATTERN_RADAR_SIREN = [400, 150, 400, 150, 600] as const;

export function triggerRadarVibration() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([400, 150, 400, 150, 600]);
    } catch {
      // Haptics not allowed or unsupported
    }
  }
}

export function cancelRadarVibration() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // Ignore
    }
  }
}

class AudioAlertSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazily initialized on first user interaction or alert
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      cancelRadarVibration();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays an authentic piercing high-decibel dispatch radar siren horn pattern
   * (Zomato/Swiggy dual-tone klaxon horn with harmonic overtone & native vibration).
   */
  public playDispatchChime() {
    this.playPiercingRadarSiren();
  }

  public playPiercingRadarSiren() {
    if (this.isMuted) return;

    // Trigger authentic native hardware vibration pattern
    triggerRadarVibration();

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master gain for high-decibel acoustic penetration through traffic noise
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.85, now + 0.02);
      masterGain.gain.setValueAtTime(0.85, now + 0.85);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      masterGain.connect(ctx.destination);

      // Primary Horn Oscillator: Sawtooth wave sweeping 850Hz -> 1450Hz -> 920Hz (Piercing Klaxon)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(850, now);
      osc1.frequency.exponentialRampToValueAtTime(1450, now + 0.25);
      osc1.frequency.exponentialRampToValueAtTime(920, now + 0.55);
      osc1.frequency.exponentialRampToValueAtTime(1600, now + 0.85);

      gain1.gain.setValueAtTime(0.5, now);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 1.1);

      // Secondary Overtone Oscillator: Square wave for harsh acoustic harmonics (1150Hz -> 1750Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(1150, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1750, now + 0.35);
      osc2.frequency.exponentialRampToValueAtTime(1250, now + 0.65);
      osc2.frequency.exponentialRampToValueAtTime(1880, now + 0.95);

      gain2.gain.setValueAtTime(0.35, now + 0.08);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.08);
      osc2.stop(now + 1.1);
    } catch {
      // Audio playback errors are non-fatal (e.g. autoplay restrictions)
    }
  }

  /**
   * Plays a tick pulse for countdown timer warning (last 10 seconds).
   */
  public playCountdownTick(critical: boolean = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(critical ? 1400 : 950, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(critical ? 0.35 : 0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);

      if (critical && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(80);
        } catch {
          // Ignore
        }
      }
    } catch {
      // Ignore audio error
    }
  }
}

export const dispatchAudioSynthesizer = new AudioAlertSynthesizer();

const MUTE_STORAGE_KEY = "ok_rider_audio_muted_v1";

export function useDispatchAudioAlert(isActive: boolean, remainingSeconds: number) {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const lastPlayedSecondRef = useRef<number>(-1);
  const chimeIntervalRef = useRef<number | null>(null);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      dispatchAudioSynthesizer.setMuted(next);
      if (next) {
        cancelRadarVibration();
      }
      return next;
    });
  }, []);

  useEffect(() => {
    dispatchAudioSynthesizer.setMuted(muted);
    if (muted) {
      cancelRadarVibration();
    }
  }, [muted]);

  useEffect(() => {
    if (!isActive || remainingSeconds <= 0 || muted) {
      if (chimeIntervalRef.current) {
        window.clearInterval(chimeIntervalRef.current);
        chimeIntervalRef.current = null;
      }
      cancelRadarVibration();
      return;
    }

    // Play initial piercing siren horn & native vibration immediately
    dispatchAudioSynthesizer.playPiercingRadarSiren();

    // Loop siren horn & vibration every 2.8 seconds while offer is active
    chimeIntervalRef.current = window.setInterval(() => {
      dispatchAudioSynthesizer.playPiercingRadarSiren();
    }, 2800);

    return () => {
      if (chimeIntervalRef.current) {
        window.clearInterval(chimeIntervalRef.current);
        chimeIntervalRef.current = null;
      }
      cancelRadarVibration();
    };
  }, [isActive, muted]);

  // Tick every second during the final 10 seconds of urgency
  useEffect(() => {
    if (!isActive || remainingSeconds <= 0 || muted) return;

    if (remainingSeconds <= 10 && remainingSeconds !== lastPlayedSecondRef.current) {
      lastPlayedSecondRef.current = remainingSeconds;
      dispatchAudioSynthesizer.playCountdownTick(remainingSeconds <= 5);
    }
  }, [isActive, remainingSeconds, muted]);

  return { muted, toggleMute };
}
