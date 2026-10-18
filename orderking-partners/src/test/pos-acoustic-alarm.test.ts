import { describe, it, expect, vi, beforeEach } from "vitest";
import { ringPosAlarm } from "../lib/hardware/pos-alarm";
import { DeadLetterQueueManager, calculateDlqBackoff } from "../lib/realtime/dlq";

class MockAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn((val: number) => {
    this.value = val;
  });
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockOscillatorNode extends MockAudioNode {
  type = "sine";
  frequency = new MockAudioParam();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

let activeMockCtx: MockAudioContext | null = null;

class MockAudioContext {
  state: "suspended" | "running" | "closed" = "running";
  currentTime = 0;
  destination = new MockAudioNode();
  createdOscillators: MockOscillatorNode[] = [];
  createdGains: MockGainNode[] = [];

  constructor() {
    activeMockCtx = this;
  }

  createOscillator = vi.fn(() => {
    const osc = new MockOscillatorNode();
    this.createdOscillators.push(osc);
    return osc as unknown as OscillatorNode;
  });

  createGain = vi.fn(() => {
    const gain = new MockGainNode();
    this.createdGains.push(gain);
    return gain as unknown as GainNode;
  });

  resume = vi.fn().mockImplementation(async () => {
    this.state = "running";
  });

  close = vi.fn().mockImplementation(async () => {
    this.state = "closed";
  });
}

describe("POS Kitchen Acoustic Alarm & Realtime DLQ Engine", () => {
  describe("ringPosAlarm (Web Audio API 880Hz Square Wave Oscillator)", () => {
    beforeEach(() => {
      activeMockCtx = null;
      vi.stubGlobal("window", {
        AudioContext: MockAudioContext,
      });
      vi.stubGlobal("navigator", {
        vibrate: vi.fn(),
      });
    });

    it("creates square wave oscillator configured to 880Hz", async () => {
      const alarmPromise = ringPosAlarm(50);

      // Trigger onended on created oscillator
      if (activeMockCtx && activeMockCtx.createdOscillators.length > 0) {
        const osc = activeMockCtx.createdOscillators[0];
        if (osc.onended) {
          osc.onended();
        }
      }
      await alarmPromise;

      expect(activeMockCtx).not.toBeNull();
      expect(activeMockCtx!.createOscillator).toHaveBeenCalled();
      const osc = activeMockCtx!.createdOscillators[0];
      expect(osc.type).toBe("square");
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(880, 0);
      expect(osc.start).toHaveBeenCalled();
      expect(osc.stop).toHaveBeenCalled();
    });

    it("resumes AudioContext if suspended", async () => {
      class SuspendedMockAudioContext extends MockAudioContext {
        override state: "suspended" | "running" | "closed" = "suspended";
      }

      vi.stubGlobal("window", {
        AudioContext: SuspendedMockAudioContext,
      });

      const alarmPromise = ringPosAlarm(50);
      if (activeMockCtx && activeMockCtx.createdOscillators.length > 0) {
        const osc = activeMockCtx.createdOscillators[0];
        if (osc.onended) {
          osc.onended();
        }
      }
      await alarmPromise;

      expect(activeMockCtx!.resume).toHaveBeenCalled();
    });

    it("triggers hardware vibration alongside acoustic oscillator", async () => {
      const alarmPromise = ringPosAlarm(50);
      if (activeMockCtx && activeMockCtx.createdOscillators.length > 0) {
        const osc = activeMockCtx.createdOscillators[0];
        if (osc.onended) {
          osc.onended();
        }
      }
      await alarmPromise;

      expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200, 100, 400]);
    });
  });

  describe("DeadLetterQueueManager in Partner Operations", () => {
    it("calculates exponential backoff delay accurately", () => {
      const delay0 = calculateDlqBackoff(0, { baseDelayMs: 2000, jitterFactor: 0 });
      const delay1 = calculateDlqBackoff(1, { baseDelayMs: 2000, jitterFactor: 0 });
      const delay2 = calculateDlqBackoff(2, { baseDelayMs: 2000, jitterFactor: 0 });

      expect(delay0).toBe(2000);
      expect(delay1).toBe(4000);
      expect(delay2).toBe(8000);
    });

    it("enqueues and processes mutations cleanly", async () => {
      const dlq = new DeadLetterQueueManager<{ kotId: string }>("kot_sync_dlq", {
        baseDelayMs: 20,
        maxRetries: 3,
        jitterFactor: 0,
      });

      dlq.enqueue({ kotId: "kot-101" }, "Socket timeout");
      expect(dlq.getStats().pending).toBe(1);

      const result = await dlq.processRetries(async () => true);
      expect(result.resolved).toBe(1);
      expect(dlq.getStats().total).toBe(0);
    });
  });
});
