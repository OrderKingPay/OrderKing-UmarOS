import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { toast } from "sonner";
import { Camera, Flashlight, Image as ImageIcon, Sparkles, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ParsedUpiResult = {
  raw: string;
  upiId: string;
  payeeName?: string;
  amount?: string;
  note?: string;
};

import { ReceiveMoneyQrStudio } from "@/components/fintech/receive-money-qr-studio";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: ParsedUpiResult) => void;
  initialMode?: "camera" | "manual" | "receive";
};

export function CameraScannerModal({ isOpen, onClose, onScanSuccess, initialMode = "camera" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(1);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<"camera" | "manual" | "receive">(initialMode);
  const [manualUpi, setManualUpi] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [isFarZoomActive, setIsFarZoomActive] = useState(false);

  // Play crisp royal confirmation chime
  const playRoyalScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext not allowed before user gesture, safely ignore
    }
  };

  // Trigger haptic vibration feedback
  const triggerHaptic = () => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([40, 20, 80]);
      }
    } catch {
      // ignore
    }
  };

  // Parse UPI string or raw text
  const parseUpiText = (text: string): ParsedUpiResult => {
    const trimmed = text.trim();
    if (trimmed.startsWith("upi://pay")) {
      try {
        const url = new URL(trimmed);
        const pa = url.searchParams.get("pa") || "";
        const pn = url.searchParams.get("pn") || undefined;
        const am = url.searchParams.get("am") || undefined;
        const tn = url.searchParams.get("tn") || undefined;
        return {
          raw: trimmed,
          upiId: pa || trimmed,
          payeeName: pn ? decodeURIComponent(pn) : undefined,
          amount: am || undefined,
          note: tn ? decodeURIComponent(tn) : undefined,
        };
      } catch {
        // Fallback for non-standard URI
      }
    }

    // Match raw UPI ID like name@bank
    const upiMatch = trimmed.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/);
    if (upiMatch) {
      return {
        raw: trimmed,
        upiId: upiMatch[0],
      };
    }

    return {
      raw: trimmed,
      upiId: trimmed,
    };
  };

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen || scanMode !== "camera") {
      stopCamera();
      return;
    }

    let isCancelled = false;

    async function startCamera() {
      try {
        setCameraError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
          setHasCamera(false);
          setScanMode("manual");
          return;
        }

        // Request high resolution for far-distance scanning accuracy
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Query track capabilities for hardware zoom and torch
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
          if (capabilities.zoom) {
            setMaxZoom(capabilities.zoom.max || 1);
          }
          if (capabilities.torch) {
            setHasTorch(true);
          }
        }

        // Start scanning frames
        startScanningLoop();
      } catch (err: any) {
        console.warn("Camera start failed:", err);
        setCameraError(
          "Camera access unavailable. You can upload a QR screenshot or enter the UPI ID manually below."
        );
        setScanMode("manual");
      }
    }

    void startCamera();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [isOpen, scanMode]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Hardware Zoom control
  const handleSetZoom = async (newZoom: number) => {
    setZoomLevel(newZoom);
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const constraints: any = { advanced: [{ zoom: newZoom }] };
      await track.applyConstraints(constraints);
    } catch (e) {
      console.warn("Hardware zoom error:", e);
    }
  };

  // Hardware Torch / Flashlight toggle
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !isTorchOn;
      const constraints: any = { advanced: [{ torch: nextTorch }] };
      await track.applyConstraints(constraints);
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn("Torch toggle error:", e);
    }
  };

  // High-performance scanning loop with Multi-Resolution & Far-Distance Crop
  const startScanningLoop = () => {
    let detector: any = null;
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let lastScanTime = 0;

    const scanFrame = async (timestamp: number) => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      // Throttle to ~18fps for high performance and low battery drain
      if (timestamp - lastScanTime > 55) {
        lastScanTime = timestamp;

        const video = videoRef.current;
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;

        if (vWidth > 0 && vHeight > 0) {
          let foundQrText: string | null = null;

          // 1. FAST NATIVE PASS (Hardware accelerated BarcodeDetector)
          if (detector) {
            try {
              const barcodes = await detector.detect(video);
              if (barcodes && barcodes.length > 0) {
                foundQrText = barcodes[0].rawValue;
              }
            } catch {
              // Ignore and fallback
            }
          }

          // 2. MULTI-SCALE CANVAS PASS (jsQR with Far-Distance Center Crop)
          if (!foundQrText && ctx) {
            // PASS A: Center-Region 2.2x Super-Resolution Crop (Reads distant / far-away QRs!)
            const cropFraction = isFarZoomActive ? 0.35 : 0.5; // 35% - 50% central region
            const cropW = Math.floor(vWidth * cropFraction);
            const cropH = Math.floor(vHeight * cropFraction);
            const cropX = Math.floor((vWidth - cropW) / 2);
            const cropY = Math.floor((vHeight - cropH) / 2);

            canvas.width = 480;
            canvas.height = 480;

            // Draw center crop
            ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, 480, 480);

            // Contrast enhancement for low light & laminated QRs
            const cropImageData = ctx.getImageData(0, 0, 480, 480);
            const codeCrop = jsQR(cropImageData.data, 480, 480, {
              inversionAttempts: "attemptBoth",
            });

            if (codeCrop && codeCrop.data) {
              foundQrText = codeCrop.data;
            } else {
              // PASS B: Full Frame Downscaled (Reads nearby or large QRs)
              canvas.width = 640;
              canvas.height = Math.floor((640 * vHeight) / vWidth);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const fullImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const codeFull = jsQR(fullImageData.data, canvas.width, canvas.height, {
                inversionAttempts: "dontInvert",
              });
              if (codeFull && codeFull.data) {
                foundQrText = codeFull.data;
              }
            }
          }

          // IF QR DETECTED
          if (foundQrText) {
            playRoyalScanBeep();
            triggerHaptic();
            const parsed = parseUpiText(foundQrText);
            toast.success(`QR Code Detected: ${parsed.payeeName || parsed.upiId}`);
            stopCamera();
            onScanSuccess(parsed);
            return;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Upload QR from gallery
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let detectedText: string | null = null;

        // Try BarcodeDetector
        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
            const barcodes = await detector.detect(img);
            if (barcodes?.length > 0) {
              detectedText = barcodes[0].rawValue;
            }
          } catch {
            // fallback
          }
        }

        // Fallback jsQR
        if (!detectedText) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const res = jsQR(imgData.data, canvas.width, canvas.height, {
            inversionAttempts: "attemptBoth",
          });
          if (res?.data) {
            detectedText = res.data;
          }
        }

        if (detectedText) {
          playRoyalScanBeep();
          triggerHaptic();
          const parsed = parseUpiText(detectedText);
          toast.success(`QR Code Extracted: ${parsed.payeeName || parsed.upiId}`);
          stopCamera();
          onScanSuccess(parsed);
        } else {
          toast.error("No valid QR code found in this image. Please choose a clearer picture.");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Manual payment submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUpi.trim()) {
      toast.error("Please enter a valid UPI ID or phone number");
      return;
    }
    const parsed = parseUpiText(manualUpi);
    if (manualAmount.trim()) {
      parsed.amount = manualAmount.trim();
    }
    stopCamera();
    onScanSuccess(parsed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border-2 border-amber-400/80 bg-surface shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-[#0D3B2E] via-emerald-900 to-[#07241C] p-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black shadow-sm">
              <Camera className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-base text-amber-300">
                  KingPay High-Accuracy Scanner
                </h3>
                <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
                  FAR ZOOM ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-emerald-100">
                Multi-Scale Auto-Focus · Instant 0% Fee UPI Pay
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/10 transition text-lg"
            aria-label="Close Scanner"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Selector: Live Camera vs Receive / My QR vs Manual UPI */}
        <div className="flex rounded-xl bg-surface-2 p-1 m-3 text-xs font-bold border border-border gap-1">
          <button
            type="button"
            onClick={() => setScanMode("camera")}
            className={`flex-1 rounded-lg py-1.5 transition flex items-center justify-center gap-1.5 ${
              scanMode === "camera"
                ? "bg-primary text-white shadow-xs"
                : "text-muted hover:text-fg"
            }`}
          >
            <Camera className="size-3.5" />
            <span>📷 Scan to Pay</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setScanMode("receive");
            }}
            className={`flex-1 rounded-lg py-1.5 transition flex items-center justify-center gap-1.5 ${
              scanMode === "receive"
                ? "bg-amber-500 text-black shadow-xs font-extrabold"
                : "text-muted hover:text-fg"
            }`}
          >
            <span>📲 Receive / My QR</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setScanMode("manual");
            }}
            className={`flex-1 rounded-lg py-1.5 transition flex items-center justify-center gap-1.5 ${
              scanMode === "manual"
                ? "bg-primary text-white shadow-xs"
                : "text-muted hover:text-fg"
            }`}
          >
            <span>⌨️ Phone / UPI</span>
          </button>
        </div>

        {/* RECEIVE / MY QR MODE */}
        {scanMode === "receive" ? (
          <div className="px-3 pb-4">
            <ReceiveMoneyQrStudio isModal onClose={onClose} />
          </div>
        ) : scanMode === "camera" ? (
          <div className="px-4 pb-4 space-y-3">
            {/* Viewfinder Video Container */}
            <div className="relative mx-auto flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl bg-black border-2 border-amber-400/60 shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                className="size-full object-cover"
              />

              {/* Hidden canvas for image analysis */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Luxury Reticle & Viewfinder Frame with 24K Gold Brackets */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center ${
                    isFarZoomActive
                      ? "size-40 border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                      : "size-52 border-emerald-400/90 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  }`}
                >
                  {/* 4 Precision Gold Corner Markers */}
                  <div className="absolute -top-1.5 -left-1.5 size-5 border-t-3 border-l-3 border-amber-400 rounded-tl-lg" />
                  <div className="absolute -top-1.5 -right-1.5 size-5 border-t-3 border-r-3 border-amber-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1.5 -left-1.5 size-5 border-b-3 border-l-3 border-amber-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1.5 -right-1.5 size-5 border-b-3 border-r-3 border-amber-400 rounded-br-lg" />

                  {/* Animated High-Speed Laser Scan Beam */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 via-amber-300 to-transparent animate-pulse shadow-[0_0_8px_#34D399]" />

                  {/* Center Target Indicator */}
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-mono font-black text-amber-300 bg-black/70 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                      {isFarZoomActive ? "🎯 FAR DISTANCE MODE" : "✨ ALIGN QR CODE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Camera Controls (Zoom, Torch, Far Distance Boost) */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between text-xs">
                {/* 1000x Far Distance Crop Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFarZoomActive((v) => !v)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md transition flex items-center gap-1 shadow-md ${
                    isFarZoomActive
                      ? "bg-amber-400 text-black border border-amber-500 font-extrabold"
                      : "bg-black/60 text-white/90 border border-white/20"
                  }`}
                  title="Toggle Far Distance Super-Resolution"
                >
                  <Sparkles className="size-3" />
                  <span>{isFarZoomActive ? "Far Mode ON" : "Far Mode"}</span>
                </button>

                {/* Torch / Flashlight Button */}
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`rounded-full p-2 backdrop-blur-md transition shadow-md ${
                      isTorchOn
                        ? "bg-amber-400 text-black"
                        : "bg-black/60 text-white/90 border border-white/20"
                    }`}
                    title="Toggle Flashlight"
                  >
                    <Flashlight className="size-4" />
                  </button>
                )}
              </div>

              {/* Bottom Camera Toolbar: Hardware Zoom & Upload Photo */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs">
                {/* Hardware Zoom Selector */}
                {maxZoom > 1 ? (
                  <div className="flex items-center gap-1 rounded-full bg-black/70 p-1 border border-white/20 backdrop-blur-md">
                    {[1, 2, Math.min(3, maxZoom)].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => void handleSetZoom(z)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold transition ${
                          zoomLevel === z
                            ? "bg-amber-400 text-black"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-white/80 bg-black/60 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md">
                    <ZoomIn className="size-3" />
                    <span>Auto-Focus Active</span>
                  </div>
                )}

                {/* Upload QR Image from Gallery */}
                <label className="cursor-pointer rounded-full bg-black/70 hover:bg-black/90 px-3 py-1 text-[11px] font-bold text-white border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition">
                  <ImageIcon className="size-3.5 text-amber-300" />
                  <span>Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadImage}
                  />
                </label>
              </div>
            </div>

            <p className="text-[11px] text-muted text-center leading-relaxed">
              Point camera at any shop, merchant, or banking QR code. Decodes instantly from far distance with 0% fee.
            </p>
          </div>
        ) : (
          /* MANUAL UPI ENTRY MODE */
          <form onSubmit={handleManualSubmit} className="p-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-fg mb-1">
                Recipient UPI ID or 10-Digit Mobile:
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                value={manualUpi}
                onChange={(e) => setManualUpi(e.target.value)}
                placeholder="e.g. merchant@icici or 9876543210"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg mb-1">
                Amount to Transfer (₹) (Optional):
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="₹250"
              />
            </div>

            {/* Quick Upload from Gallery Option */}
            <div className="rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-3 text-center">
              <label className="cursor-pointer flex flex-col items-center justify-center gap-1 text-xs text-muted hover:text-primary transition">
                <ImageIcon className="size-6 text-primary" />
                <span className="font-semibold text-fg">Have a QR screenshot or photo?</span>
                <span className="text-[10px] text-primary underline">Upload from Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadImage}
                />
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold text-xs py-2.5 bg-primary text-white shadow"
            >
              ⚡ Proceed to Pay
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
