import { useEffect, useRef } from "react";

export function useNewOrderAlert(orderCount: number) {
  const prevRef = useRef(orderCount);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (orderCount > prevRef.current) {
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch { /* audio not available */ }

      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    }
    prevRef.current = orderCount;
  }, [orderCount]);
}
