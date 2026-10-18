/**
 * POS Kitchen Acoustic Alarm Engine
 *
 * Deploys an authentic 880Hz square-wave oscillator alarm via the Web Audio API.
 * High harmonic acoustic saturation engineered specifically to cut through noisy
 * Indian commercial kitchen ambient noise, blender whirrs, and tandoor sizzles.
 */

export interface PosAlarmOptions {
  durationMs?: number;
  pulseCount?: number;
  volume?: number;
}

/**
 * Rings the POS kitchen acoustic alarm with an 880Hz square wave.
 *
 * @param durationMs Overall duration of the alarm sequence in milliseconds (default: 1200ms)
 * @param options Additional customization options (pulseCount, volume)
 */
export async function ringPosAlarm(
  durationMs: number = 1200,
  options?: PosAlarmOptions
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      console.warn("[ringPosAlarm] Web Audio API not supported in this environment.");
      return;
    }

    const audioCtx = new AudioContextClass();

    if (audioCtx.state === "suspended") {
      try {
        await audioCtx.resume();
      } catch {}
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // 880Hz (Concert A5) square wave gives harsh odd harmonics for acoustic penetration
    osc.type = "square";
    osc.frequency.setValueAtTime(880, now);

    const volume = Math.min(1.0, Math.max(0.1, options?.volume ?? 0.7));
    const totalDurationSeconds = Math.max(0.3, durationMs / 1000);
    const pulseCount = options?.pulseCount ?? Math.max(2, Math.floor(totalDurationSeconds / 0.25));
    const cycleDuration = totalDurationSeconds / pulseCount;
    const pulseDuration = cycleDuration * 0.7;

    gainNode.gain.setValueAtTime(0, now);

    for (let i = 0; i < pulseCount; i++) {
      const pulseStart = now + i * cycleDuration;
      const pulseEnd = pulseStart + pulseDuration;

      gainNode.gain.setValueAtTime(0.001, pulseStart);
      gainNode.gain.linearRampToValueAtTime(volume, pulseStart + 0.015);
      gainNode.gain.setValueAtTime(volume, pulseEnd - 0.015);
      gainNode.gain.linearRampToValueAtTime(0.001, pulseEnd);
    }

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + totalDurationSeconds);

    // Trigger haptic vibration if available on kitchen tablet/mobile hardware
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch {}
    }

    return new Promise((resolve) => {
      osc.onended = () => {
        try {
          void audioCtx.close();
        } catch {}
        resolve();
      };

      setTimeout(() => {
        try {
          void audioCtx.close();
        } catch {}
        resolve();
      }, durationMs + 200);
    });
  } catch (err) {
    console.warn("[ringPosAlarm] Failed to ring kitchen acoustic alarm:", err);
  }
}
