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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Zap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-slate-900">
                  System Cache &amp; Storage Optimizer
                </h3>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono font-semibold">
                  SYSTEM UTILITY
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Systematically purge unnecessary caches, media bloat &amp; temp files without touching critical business assets.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 rounded-lg text-slate-500 hover:text-slate-900 border-slate-200"
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
      toast.success(`Storage optimization completed. Freed ${freedMb} MB of temporary files.`);
      if (onPurgeCompleted) onPurgeCompleted();
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
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Cache Footprint</span>
          <span className="text-2xl font-black text-amber-600 font-mono">
            {inspection.formattedTotalSize}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{inspection.itemCount} active cached files</span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Storage Optimization</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            {inspection.speedOptimizationScore}% OPTIMAL
          </span>
          <span className="text-[10px] text-emerald-700 block mt-0.5">Optimized local storage allocation</span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Media Cache</span>
          <span className="text-xl font-bold text-slate-800 font-mono">
            {((inspection.breakdown.generatedImagesBytes + inspection.breakdown.generatedVideosBytes) / (1024 * 1024)).toFixed(1)} MB
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Images, videos &amp; renders</span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Protected Assets</span>
          <span className="text-xl font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="size-5 text-emerald-600" />
            <span>PROTECTED</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Leads &amp; invoices secured</span>
        </div>
      </div>

      {/* 2. PROTECTED ASSETS NOTICE */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>Core System Assets Permanently Protected from Any Purge:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-white rounded-lg p-2 border border-emerald-200">
            <span className="text-slate-500 block text-[10px]">Client CRM Leads:</span>
            <span className="font-bold text-slate-800 font-mono">{inspection.immutableCoreProtection.clientLeadsCount} Secured</span>
          </div>
          <div className="bg-white rounded-lg p-2 border border-emerald-200">
            <span className="text-slate-500 block text-[10px]">Invoices &amp; Billing:</span>
            <span className="font-bold text-slate-800 font-mono">{inspection.immutableCoreProtection.clientInvoicesCount} Verified</span>
          </div>
          <div className="bg-white rounded-lg p-2 border border-emerald-200">
            <span className="text-slate-500 block text-[10px]">Application Blueprints:</span>
            <span className="font-bold text-slate-800 font-mono">{inspection.immutableCoreProtection.enterpriseBlueprintsCount} Verified</span>
          </div>
          <div className="bg-white rounded-lg p-2 border border-emerald-200">
            <span className="text-slate-500 block text-[10px]">System State Reserve:</span>
            <span className="font-bold text-emerald-700 font-mono">Guaranteed</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
          System optimization preserves authenticated sessions, user profiles, and critical application state while cleaning temporary cache files.
        </p>
      </div>

      {/* 3. GRANULAR PURGE OPTIONS & 1-CLICK ACTION */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Systematic Cache Targets to Clean
          </h4>
          <span className="text-[10px] text-slate-500">Select specific cache types or clean all</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={purgeImages}
              onChange={(e) => setPurgeImages(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 size-4"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Generated AI Images Cache</span>
              <span className="text-[10px] text-slate-500">
                {(inspection.breakdown.generatedImagesBytes / (1024 * 1024)).toFixed(1)} MB · Scratch images &amp; variations
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={purgeVideos}
              onChange={(e) => setPurgeVideos(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 size-4"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Generated AI Video Loops</span>
              <span className="text-[10px] text-slate-500">
                {(inspection.breakdown.generatedVideosBytes / (1024 * 1024)).toFixed(1)} MB · Rendered MP4 keyframes
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={purgeAttachments}
              onChange={(e) => setPurgeAttachments(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 size-4"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Temporary Chat Upload Blobs</span>
              <span className="text-[10px] text-slate-500">
                {(inspection.breakdown.tempAttachmentBytes / (1024 * 1024)).toFixed(1)} MB · Uploaded scratch attachments
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={purgeChatCache}
              onChange={(e) => setPurgeChatCache(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 size-4"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Ephemeral Session Buffer</span>
              <span className="text-[10px] text-slate-500">
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
            className="w-full sm:flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs rounded-lg"
          >
            {isPurging ? (
              <>
                <RefreshCw className="size-4 mr-2 animate-spin" />
                <span>Optimizing storage &amp; clearing temporary files...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-4 mr-2" />
                <span>1-Click Cache Optimization</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshInspection}
            className="h-11 px-4 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Re-Scan
          </Button>
        </div>

        {purgeSuccess && lastFreedMb && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span className="font-bold">Purge Succeeded: Successfully freed {lastFreedMb} MB of temporary files!</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-700 font-semibold">Storage Cleared</span>
          </div>
        )}
      </div>

      {/* 4. LIVE CACHED MEDIA INSPECTION */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cached Media Items in Storage
            </h4>
            <p className="text-[11px] text-slate-500">Inspect each item before manual deletion or automatic purge.</p>
          </div>
          <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono">
            {vaultItems.length} Cached Files
          </Badge>
        </div>

        {vaultItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
            <CheckCircle2 className="size-8 text-emerald-600 mx-auto mb-2 opacity-80" />
            <span>Storage is clean and optimized. Zero temporary caches detected.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {vaultItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-2 text-xs shadow-2xs"
              >
                <div className="relative aspect-video rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                  {item.type === "video" ? (
                    <video src={item.url} muted className="w-full h-full object-cover" />
                  ) : item.type === "image" ? (
                    <img loading="lazy" src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <FileCode className="size-6 text-indigo-500" />
                      <span className="text-[10px] mt-1">{item.mimeType}</span>
                    </div>
                  )}
                  <Badge className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-mono uppercase">
                    {item.type}
                  </Badge>
                </div>

                <div className="flex justify-between items-start">
                  <span className="font-semibold text-slate-800 truncate max-w-[170px]">{item.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSingleItem(item.id)}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
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
