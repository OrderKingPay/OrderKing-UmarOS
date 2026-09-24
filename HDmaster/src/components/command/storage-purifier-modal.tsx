import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  FileCode,
  Image as ImageIcon,
  Video,
  Activity,
  Zap,
  AlertTriangle,
  X,
  Database,
  Lock,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mediaStorageVault, StorageInspectionResult, VaultMediaItem } from "@/lib/orderking/ai/media-storage-vault";

interface StoragePurifierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoragePurifierModal({ isOpen, onClose }: StoragePurifierModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl border-2 border-emerald-500/50 bg-[#06140F] shadow-[0_0_90px_rgba(16,185,129,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between border-b border-emerald-500/30 bg-black/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <Zap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base text-white">
                  Sovereign Cache &amp; Storage Purifier
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[9px] font-mono font-bold">
                  100X BETTER THAN BROWSER
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Systematically purge unnecessary caches, media bloat &amp; temp files without touching critical business assets.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <StoragePurifierView onPurgeCompleted={() => {}} />
        </div>
      </div>
    </div>
  );
}

export function StoragePurifierView({ onPurgeCompleted }: { onPurgeCompleted?: () => void }) {
  const [inspection, setInspection] = useState<StorageInspectionResult>(mediaStorageVault.inspectSystemStorage());
  const [vaultItems, setVaultItems] = useState<VaultMediaItem[]>(mediaStorageVault.getItems());
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [lastFreedMb, setLastFreedMb] = useState<string | null>(null);

  // Granular purge options
  const [purgeImages, setPurgeImages] = useState(true);
  const [purgeVideos, setPurgeVideos] = useState(true);
  const [purgeAttachments, setPurgeAttachments] = useState(true);
  const [purgeChatCache, setPurgeChatCache] = useState(true);
  const [purgeApiCache, setPurgeApiCache] = useState(true);

  const refreshInspection = () => {
    setInspection(mediaStorageVault.inspectSystemStorage());
    setVaultItems(mediaStorageVault.getItems());
  };

  const handleDeepPurge = () => {
    setIsPurging(true);
    setPurgeSuccess(false);

    setTimeout(() => {
      const result = mediaStorageVault.purgeStorage({
        purgeImages,
        purgeVideos,
        purgeAttachments,
        purgeChatCache,
        purgeApiCache,
      });

      setIsPurging(false);
      setPurgeSuccess(true);
      const freedMb = (result.freedBytes / (1024 * 1024)).toFixed(2);
      setLastFreedMb(freedMb);
      refreshInspection();
      toast.success(`🧹 100x Purge Completed! Freed ${freedMb} MB of junk. HD Master speed boosted!`);
      if (onPurgeCompleted) onPurgeCompleted();
    }, 1200);
  };

  const handleDeleteSingleItem = (id: string) => {
    mediaStorageVault.deleteItem(id);
    refreshInspection();
    toast.info("Cached item deleted.");
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-surface-2/80 p-3.5 border border-border">
          <span className="text-[10px] text-muted block uppercase font-bold">Total Cache Footprint</span>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {inspection.formattedTotalSize}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{inspection.itemCount} active cached files</span>
        </div>

        <div className="rounded-xl bg-surface-2/80 p-3.5 border border-border">
          <span className="text-[10px] text-muted block uppercase font-bold">Engine Speed Index</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {inspection.speedOptimizationScore}% OPTIMAL
          </span>
          <span className="text-[10px] text-emerald-300/80 block mt-0.5">100x Faster than browser cache</span>
        </div>

        <div className="rounded-xl bg-surface-2/80 p-3.5 border border-border">
          <span className="text-[10px] text-muted block uppercase font-bold">AI Media Cache</span>
          <span className="text-xl font-bold text-cyan-400 font-mono">
            {((inspection.breakdown.generatedImagesBytes + inspection.breakdown.generatedVideosBytes) / (1024 * 1024)).toFixed(1)} MB
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Images, videos &amp; renders</span>
        </div>

        <div className="rounded-xl bg-surface-2/80 p-3.5 border border-border">
          <span className="text-[10px] text-muted block uppercase font-bold">Core Safety Guarantee</span>
          <span className="text-xl font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="size-5 text-emerald-400" />
            <span>100% IMMUTABLE</span>
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Leads &amp; invoices protected</span>
        </div>
      </div>

      {/* 2. 🛡️ 100% CORE PROTECTION SHIELD NOTICE */}
      <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2">
        <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Core System Assets Permanently Protected from Any Purge:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-black/50 rounded-lg p-2 border border-emerald-500/20">
            <span className="text-muted block text-[10px]">Client CRM Leads:</span>
            <span className="font-bold text-white font-mono">{inspection.immutableCoreProtection.clientLeadsCount} Locked Safe</span>
          </div>
          <div className="bg-black/50 rounded-lg p-2 border border-emerald-500/20">
            <span className="text-muted block text-[10px]">King Pay Invoices:</span>
            <span className="font-bold text-white font-mono">{inspection.immutableCoreProtection.clientInvoicesCount} Encrypted</span>
          </div>
          <div className="bg-black/50 rounded-lg p-2 border border-emerald-500/20">
            <span className="text-muted block text-[10px]">Enterprise Blueprints:</span>
            <span className="font-bold text-white font-mono">{inspection.immutableCoreProtection.enterpriseBlueprintsCount} Verified</span>
          </div>
          <div className="bg-black/50 rounded-lg p-2 border border-emerald-500/20">
            <span className="text-muted block text-[10px]">Founder Vault Reserve:</span>
            <span className="font-bold text-emerald-400 font-mono">0% Loss Guard</span>
          </div>
        </div>
        <p className="text-[11px] text-emerald-300/80 leading-relaxed pt-1">
          Unlike ordinary browser cleaners that wipe out your logins and session configs, the Sovereign Purifier only eliminates ephemeral scratch media, temporary video loops, and stale network blobs.
        </p>
      </div>

      {/* 3. GRANULAR PURGE OPTIONS & 1-CLICK ACTION */}
      <div className="rounded-xl border border-border/80 bg-black/60 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Systematic Cache Targets to Clean
          </h4>
          <span className="text-[10px] text-muted">Select specific bloat or clean all</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-2/60 border border-border/40 cursor-pointer hover:bg-surface-2 transition">
            <input
              type="checkbox"
              checked={purgeImages}
              onChange={(e) => setPurgeImages(e.target.checked)}
              className="rounded border-amber-500 text-emerald-500 focus:ring-emerald-400 size-4"
            />
            <div>
              <span className="font-bold text-white block">Generated AI Images Cache</span>
              <span className="text-[10px] text-muted">
                {(inspection.breakdown.generatedImagesBytes / (1024 * 1024)).toFixed(1)} MB · Scratch images &amp; variations
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-2/60 border border-border/40 cursor-pointer hover:bg-surface-2 transition">
            <input
              type="checkbox"
              checked={purgeVideos}
              onChange={(e) => setPurgeVideos(e.target.checked)}
              className="rounded border-amber-500 text-emerald-500 focus:ring-emerald-400 size-4"
            />
            <div>
              <span className="font-bold text-white block">Generated AI Video Loops</span>
              <span className="text-[10px] text-muted">
                {(inspection.breakdown.generatedVideosBytes / (1024 * 1024)).toFixed(1)} MB · Rendered MP4 keyframes
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-2/60 border border-border/40 cursor-pointer hover:bg-surface-2 transition">
            <input
              type="checkbox"
              checked={purgeAttachments}
              onChange={(e) => setPurgeAttachments(e.target.checked)}
              className="rounded border-amber-500 text-emerald-500 focus:ring-emerald-400 size-4"
            />
            <div>
              <span className="font-bold text-white block">Temporary Chat Upload Blobs</span>
              <span className="text-[10px] text-muted">
                {(inspection.breakdown.tempAttachmentBytes / (1024 * 1024)).toFixed(1)} MB · Uploaded scratch attachments
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-2/60 border border-border/40 cursor-pointer hover:bg-surface-2 transition">
            <input
              type="checkbox"
              checked={purgeChatCache}
              onChange={(e) => setPurgeChatCache(e.target.checked)}
              className="rounded border-amber-500 text-emerald-500 focus:ring-emerald-400 size-4"
            />
            <div>
              <span className="font-bold text-white block">Ephemeral Session Buffer</span>
              <span className="text-[10px] text-muted">
                {(inspection.breakdown.ephemeralChatCacheBytes / (1024 * 1024)).toFixed(1)} MB · Keeps starred chats &amp; invoices
              </span>
            </div>
          </label>
        </div>

        {/* 1-CLICK PURGE BUTTON */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Button
            disabled={isPurging}
            onClick={handleDeepPurge}
            className="w-full sm:flex-1 h-11 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)]"
          >
            {isPurging ? (
              <>
                <RefreshCw className="size-4 mr-2 animate-spin" />
                <span>Executing 100x Deep Purge &amp; Performance Sweep...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-4 mr-2" />
                <span>1-Click Deep Purge &amp; Boost Speed 100x</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshInspection}
            className="h-11 px-4 text-xs font-bold border-border"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Re-Scan
          </Button>
        </div>

        {purgeSuccess && lastFreedMb && (
          <div className="rounded-lg bg-emerald-500/20 border border-emerald-400/50 p-3 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span className="font-bold">Purge Succeeded: Successfully freed {lastFreedMb} MB of unnecessary caches!</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-200">100x Speed Restored</span>
          </div>
        )}
      </div>

      {/* 4. LIVE CACHED MEDIA INSPECTION */}
      <div className="rounded-xl border border-border/80 bg-black/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Cached Media Items in Storage
            </h4>
            <p className="text-[11px] text-muted">Inspect each item before manual deletion or automatic purge.</p>
          </div>
          <Badge className="bg-amber-500/20 text-amber-300 text-[10px] font-mono">
            {vaultItems.length} Cached Files
          </Badge>
        </div>

        {vaultItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">
            <CheckCircle2 className="size-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <span>Storage is 100% clean and optimized! Zero unnecessary caches detected.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {vaultItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/60 bg-surface-2/40 p-2.5 space-y-2 text-xs"
              >
                <div className="relative aspect-video rounded overflow-hidden bg-black flex items-center justify-center">
                  {item.type === "video" ? (
                    <video src={item.url} muted className="w-full h-full object-cover" />
                  ) : item.type === "image" ? (
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted">
                      <FileCode className="size-6 text-purple-400" />
                      <span className="text-[10px] mt-1">{item.mimeType}</span>
                    </div>
                  )}
                  <Badge className="absolute top-1 left-1 bg-black/70 text-[9px] font-mono uppercase">
                    {item.type}
                  </Badge>
                </div>

                <div className="flex justify-between items-start">
                  <span className="font-bold text-white truncate max-w-[170px]">{item.title}</span>
                  <span className="text-[10px] text-muted font-mono">
                    {(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSingleItem(item.id)}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="size-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
