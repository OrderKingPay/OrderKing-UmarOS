import { useEffect, useRef, useState, useCallback } from "react";

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
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays a 2-tone melodic dispatch notification chime (A5 880Hz -> D6 1175Hz).
   */
  public playDispatchChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: 1175Hz (D6) - delayed slightly for authentic mobile alert chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1175, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.48);
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

      osc.type = "triangle";
      osc.frequency.setValueAtTime(critical ? 1200 : 750, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(critical ? 0.2 : 0.1, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
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
      return next;
    });
  }, []);

  useEffect(() => {
    dispatchAudioSynthesizer.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    if (!isActive || remainingSeconds <= 0 || muted) {
      if (chimeIntervalRef.current) {
        window.clearInterval(chimeIntervalRef.current);
        chimeIntervalRef.current = null;
      }
      return;
    }

    // Play initial alert chime when offer activates
    dispatchAudioSynthesizer.playDispatchChime();

    // Pulse melodic chime every 4 seconds while timer is > 10s
    if (!chimeIntervalRef.current) {
      chimeIntervalRef.current = window.setInterval(() => {
        if (remainingSeconds > 10) {
          dispatchAudioSynthesizer.playDispatchChime();
        }
      }, 4000);
    }

    return () => {
      if (chimeIntervalRef.current) {
        window.clearInterval(chimeIntervalRef.current);
        chimeIntervalRef.current = null;
      }
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
