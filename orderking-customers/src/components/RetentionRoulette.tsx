import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Wallet, 
  Gift, 
  RotateCw, 
  CheckCircle2, 
  Copy, 
  Clock, 
  ArrowRight, 
  Flame,
  Volume2,
  VolumeX,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";

export interface RoulettePrize {
  id: string;
  label: string;
  sub: string;
  color: string;
  textColor: string;
  amount: number;
  type: "CASH" | "DISCOUNT" | "VOUCHER" | "COINS";
  code: string;
  description: string;
}

const PRIZES: RoulettePrize[] = [
  { id: "p0", label: "₹50", sub: "KingPay Cash", color: "#E23744", textColor: "#FFFFFF", amount: 50, type: "CASH", code: "KING50", description: "Flat ₹50 credited straight to your KingPay Wallet" },
  { id: "p1", label: "₹25", sub: "Wallet Credit", color: "#10B981", textColor: "#FFFFFF", amount: 25, type: "CASH", code: "KING25", description: "₹25 Instant Cashback for your next order" },
  { id: "p2", label: "₹100", sub: "Mega Jackpot", color: "#F59E0B", textColor: "#FFFFFF", amount: 100, type: "CASH", code: "JACKPOT100", description: "Bumper ₹100 KingPay Wallet Cash reward!" },
  { id: "p3", label: "₹35", sub: "Instant Cash", color: "#3B82F6", textColor: "#FFFFFF", amount: 35, type: "CASH", code: "KING35", description: "₹35 Instant Cashback credited directly" },
  { id: "p4", label: "20% OFF", sub: "Next Order", color: "#EC4899", textColor: "#FFFFFF", amount: 0, type: "DISCOUNT", code: "STREAK20", description: "Flat 20% discount coupon up to ₹100 on next meal" },
  { id: "p5", label: "Free Dish", sub: "Dessert Box", color: "#06B6D4", textColor: "#FFFFFF", amount: 0, type: "VOUCHER", code: "SWEETKING", description: "Free dessert item on your next local restaurant order" },
  { id: "p6", label: "₹75", sub: "Advanced Cash", color: "#8B5CF6", textColor: "#FFFFFF", amount: 75, type: "CASH", code: "KING75", description: "Advanced ₹75 KingPay Wallet Cash top-up!" },
  { id: "p7", label: "2X Coins", sub: "500 Coins", color: "#F97316", textColor: "#FFFFFF", amount: 0, type: "COINS", code: "COINS500", description: "500 King Coins redeemable for fuel & brand vouchers" },
];

export interface RetentionRouletteProps {
  orderId?: string;
  orderTotalPaise?: number;
  className?: string;
  onRewardClaimed?: (prize: RoulettePrize) => void;
}

// Web Audio API Procedural Sound Synthesizer (Zero external dependencies)
function playSynthesizedSound(type: "tick" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "tick") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === "win") {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
      });
    }
  } catch {
    // Audio context may be restricted by browser autoplay policy until interaction
  }
}

export function RetentionRoulette({
  orderId = "recent_order",
  orderTotalPaise,
  className = "",
  onRewardClaimed,
}: RetentionRouletteProps) {
  const { walletBalance, setWalletBalance } = useRealKingPayWallet();
  const storageKey = `orderking_retention_roulette_${orderId}`;

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonPrize, setWonPrize] = useState<RoulettePrize | null>(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const totalSlices = PRIZES.length;
  const sliceAngle = 360 / totalSlices;

  // Restore existing claimed state for this order
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.prize) {
          setWonPrize(parsed.prize);
          setHasClaimed(true);
        }
      }
    } catch (e) {
      console.warn("Storage check failed", e);
    }
  }, [storageKey]);

  // Confetti Particle Explosion
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 360;
    canvas.height = canvas.parentElement?.clientHeight || 450;

    const colors = ["#E23744", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#D4AF37"];
    const particles: Array<{
      x: number;
      y: number;
      r: number;
      d: number;
      color: string;
      vx: number;
      vy: number;
      tilt: number;
      tiltAngleIncremental: number;
      tiltAngle: number;
    }> = [];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 50,
        y: canvas.height / 2 - 20,
        r: Math.random() * 5 + 3,
        d: Math.random() * 80 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.8) * 9,
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleIncremental: Math.random() * 0.08 + 0.05,
        tiltAngle: 0,
      });
    }

    let frame = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.d);
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity

        ctx.beginPath();
        ctx.lineWidth = p.r / 1.5;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
      });

      frame++;
      if (frame < 120) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    render();
  };

  const spinWheel = () => {
    if (isSpinning || hasClaimed) return;

    setIsSpinning(true);
    setWonPrize(null);

    // Pick a high-delight prize index (Biased towards rewarding cashback)
    // 0: ₹50 Cash, 1: ₹25 Credit, 2: ₹100 Mega, 3: ₹35 Cash
    const targetIndex = Math.floor(Math.random() * totalSlices);
    const selectedPrize = PRIZES[targetIndex];

    // Calculate rotation:
    // To land on targetIndex under the top pointer (at 0 degrees / 12 o'clock):
    // Segment i covers angle [i * sliceAngle, (i + 1) * sliceAngle].
    // Center of segment is at i * sliceAngle + sliceAngle / 2.
    // When wheel rotates by R degrees, original angle θ moves to (θ + R) % 360.
    // We want the target center to end at 270 or 0 degrees (pointing up).
    // In our SVG layout, segment 0 starts at -90 deg (12 o'clock), so:
    const baseRotations = 360 * 6; // 6 full spins
    const segmentCenter = targetIndex * sliceAngle + sliceAngle / 2;
    const finalDegree = baseRotations + (360 - segmentCenter);

    setRotationDegrees(finalDegree);

    // Audio ticking simulation
    if (soundEnabled) {
      let ticks = 0;
      const tickInterval = setInterval(() => {
        playSynthesizedSound("tick");
        ticks++;
        if (ticks > 28) {
          clearInterval(tickInterval);
        }
      }, 110);
    }

    // Stop after 3.8s animation duration
    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(selectedPrize);
      setHasClaimed(true);

      if (soundEnabled) {
        playSynthesizedSound("win");
      }
      triggerConfetti();

      // Persist result
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            prize: selectedPrize,
            claimedAt: new Date().toISOString(),
            orderId,
          })
        );
      } catch (err) {
        console.warn("Error saving roulette prize", err);
      }

      toast.success(`🎉 You won ${selectedPrize.label} ${selectedPrize.sub}!`);
      if (onRewardClaimed) {
        onRewardClaimed(selectedPrize);
      }
    }, 3800);
  };

  const handleClaimToWallet = () => {
    if (!wonPrize) return;

    if (wonPrize.type === "CASH" && wonPrize.amount > 0) {
      try {
        setWalletBalance((prev: number) => prev + wonPrize.amount);
        toast.success(`💰 ₹${wonPrize.amount}.00 added to your KingPay Wallet!`);
      } catch {
        toast.error("Could not credit wallet balance.");
      }
    } else {
      navigator.clipboard.writeText(wonPrize.code);
      setCopiedCode(true);
      toast.success(`Code ${wonPrize.code} copied! Auto-applied on your next order.`);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] text-gray-900 ${className}`}>
      {/* Background Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-30 size-full"
      />

      {/* Header - Zomato Light Mode Parity */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-sm font-bold">
              🎡
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900">
              Retention Roulette
            </h2>
            <Badge tone="warn" className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
              Post-Order Dopamine Spin
            </Badge>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            100% Guaranteed Cash &amp; Dining Rewards on Every Meal Order. Spin to win instant KingPay balance.
          </p>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="size-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 transition"
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
      </div>

      {/* Wheel Stage */}
      <div className="mt-6 flex flex-col items-center justify-center">
        <div className="relative flex size-64 sm:size-72 items-center justify-center">
          {/* Wheel Pointer Needle (Top Position) */}
          <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 drop-shadow-md">
            <div className="size-0 border-x-8 border-x-transparent border-t-[18px] border-t-rose-600 animate-pulse" />
          </div>

          {/* Golden Outer Bezel */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-500/20 via-white to-amber-500/20 shadow-inner" />

          {/* The Spinning SVG Wheel */}
          <svg
            viewBox="0 0 300 300"
            className="size-[94%] rounded-full shadow-lg"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              transition: isSpinning
                ? "transform 3.8s cubic-bezier(0.12, 0.8, 0.33, 1)"
                : "none",
            }}
          >
            {PRIZES.map((prize, i) => {
              const startAngle = i * sliceAngle;
              const endAngle = (i + 1) * sliceAngle;

              // Convert polar to cartesian coordinates
              const x1 = 150 + 150 * Math.cos((Math.PI * (startAngle - 90)) / 180);
              const y1 = 150 + 150 * Math.sin((Math.PI * (startAngle - 90)) / 180);
              const x2 = 150 + 150 * Math.cos((Math.PI * (endAngle - 90)) / 180);
              const y2 = 150 + 150 * Math.sin((Math.PI * (endAngle - 90)) / 180);

              const pathData = `M 150 150 L ${x1} ${y1} A 150 150 0 0 1 ${x2} ${y2} Z`;
              const midAngle = startAngle + sliceAngle / 2;

              return (
                <g key={prize.id}>
                  <path
                    d={pathData}
                    fill={prize.color}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  {/* Prize text label along radial angle */}
                  <g
                    transform={`translate(150, 150) rotate(${midAngle}) translate(0, -95)`}
                  >
                    <text
                      textAnchor="middle"
                      fill={prize.textColor}
                      fontSize="14"
                      fontWeight="900"
                      fontFamily="sans-serif"
                      transform="rotate(90)"
                    >
                      {prize.label}
                    </text>
                    <text
                      textAnchor="middle"
                      fill={prize.textColor}
                      fontSize="7.5"
                      fontWeight="600"
                      opacity="0.9"
                      fontFamily="sans-serif"
                      transform="rotate(90) translate(0, 11)"
                    >
                      {prize.sub}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Central Crown Hub & Spin Trigger */}
          <button
            type="button"
            disabled={isSpinning || hasClaimed}
            onClick={spinWheel}
            className={`absolute z-10 flex size-16 sm:size-18 flex-col items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white shadow-xl transition active:scale-95 cursor-pointer ${
              hasClaimed ? "opacity-90" : "hover:scale-105"
            }`}
          >
            <span className="text-lg">👑</span>
            <span className="text-[10px] font-black uppercase tracking-wider">
              {hasClaimed ? "CLAIMED" : isSpinning ? "ROLLING" : "SPIN"}
            </span>
          </button>
        </div>

        {/* Action Button & Result Display */}
        <div className="mt-6 w-full max-w-sm text-center">
          <AnimatePresence mode="wait">
            {wonPrize ? (
              <motion.div
                key="prize"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/70 p-4 shadow-sm"
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <Sparkles className="size-4 text-emerald-600" />
                  Cashback Prize Unlocked!
                </div>

                <div className="mt-1 text-2xl font-black text-gray-900">
                  {wonPrize.label} {wonPrize.sub}
                </div>
                <p className="mt-0.5 text-xs text-gray-600 leading-snug">
                  {wonPrize.description}
                </p>

                {/* Claim CTA */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleClaimToWallet}
                    className="w-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    {wonPrize.type === "CASH" ? (
                      <>
                        <Wallet className="size-3.5 mr-1" />
                        Credit ₹{wonPrize.amount} to KingPay Wallet
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 mr-1" />
                        {copiedCode ? "Copied!" : `Copy Code (${wonPrize.code})`}
                      </>
                    )}
                  </Button>
                </div>

                {/* 24-Hour Streak Retention Trigger */}
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 rounded-lg py-1.5 px-2">
                  <Flame className="size-3.5 text-rose-500 animate-bounce" />
                  <span>24-Hour Streak Active! Next order doubles your reward!</span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="spin-btn">
                <Button
                  size="lg"
                  variant="primary"
                  disabled={isSpinning || hasClaimed}
                  onClick={spinWheel}
                  className="w-full font-extrabold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95"
                >
                  {isSpinning ? (
                    <>
                      <RotateCw className="size-4 animate-spin mr-1.5" />
                      Spinning Roulette...
                    </>
                  ) : (
                    <>
                      Spin for Guaranteed Cashback ➔
                    </>
                  )}
                </Button>
                <p className="mt-2 text-[11px] text-gray-500">
                  1 free spin allocated for this verified delivery.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
export default RetentionRoulette;
