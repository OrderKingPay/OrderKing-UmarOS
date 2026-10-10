import { useState } from "react";
import { Camera, CheckCircle2, ShieldCheck, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export interface DeliveryProofCameraProps {
  orderCode?: string;
  onProofCaptured?: (proofUrl: string) => void;
  onComplete?: () => void;
}

export function DeliveryProofCamera({
  orderCode = "OK-94281",
  onProofCaptured,
  onComplete,
}: DeliveryProofCameraProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [customerNote, setCustomerNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateCapture = () => {
    // Simulated camera capture of doorstep package
    const simulatedPhoto =
      "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=400&q=80";
    setPhotoPreview(simulatedPhoto);
    toast.success("Doorstep photo captured!");
  };

  const handleConfirmProof = () => {
    if (!photoPreview) {
      toast.error("Please snap a photo of the delivered food package at the door");
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onProofCaptured?.(photoPreview);
      toast.success("Contactless delivery proof verified!");
      onComplete?.();
    }, 700);
  };

  return (
    <Card className="p-4 space-y-3 max-w-sm">
      <div>
        <h4 className="text-xs font-bold text-fg flex items-center gap-1.5">
          <Camera className="size-4 text-primary" /> Contactless Delivery Photo Proof
        </h4>
        <p className="text-[11px] text-muted">
          Order #{orderCode}. Snap photo of the delivered food packet at the customer's doorstep or reception.
        </p>
      </div>

      {/* Viewfinder Preview */}
      <div className="relative aspect-4/3 w-full rounded-xl border border-dashed border-border bg-surface-2 flex items-center justify-center overflow-hidden">
        {photoPreview ? (
          <>
            <img src={photoPreview} alt="Delivery Proof" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => setPhotoPreview(null)}
              className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
            >
              <X className="size-4" />
            </button>
            <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white font-mono">
              GPS Verified · {new Date().toLocaleTimeString()}
            </div>
          </>
        ) : (
          <div className="text-center p-4 space-y-2">
            <Camera className="size-8 mx-auto text-muted/60" />
            <p className="text-xs text-muted">No photo captured yet</p>
            <Button size="sm" onClick={handleSimulateCapture} className="text-xs gap-1.5">
              <Camera className="size-3.5" /> Capture Doorstep Photo
            </Button>
          </div>
        )}
      </div>

      {/* Optional Note */}
      <div>
        <label className="text-[11px] text-muted block mb-1">Drop-off Note (Optional)</label>
        <input
          type="text"
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          placeholder="e.g. Handed to security guard / Left at doorstep"
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs"
        />
      </div>

      <Button
        onClick={handleConfirmProof}
        disabled={!photoPreview || isUploading}
        className="w-full text-xs gap-1.5"
      >
        <CheckCircle2 className="size-3.5" />
        {isUploading ? "Verifying..." : "Confirm & Complete Drop-off"}
      </Button>
    </Card>
  );
}
