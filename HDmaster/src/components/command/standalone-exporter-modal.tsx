import { useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Download,
  Copy,
  Check,
  Code2,
  Globe,
  Share2,
  X,
  Layers,
  Sparkles,
  Users,
  QrCode,
  DollarSign,
  Crown,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  standaloneSectionExporter,
  ExportableSection,
  ExportableSectionId,
} from "@/lib/orderking/ai/standalone-section-exporter";

interface StandaloneExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSectionId?: ExportableSectionId;
}

export function StandaloneExporterModal({
  isOpen,
  onClose,
  defaultSectionId = "crm",
}: StandaloneExporterModalProps) {
  const sections = standaloneSectionExporter.listSections();
  const [selectedSection, setSelectedSection] = useState<ExportableSection>(
    standaloneSectionExporter.getSection(defaultSectionId) || sections[0]
  );
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const pkg = standaloneSectionExporter.generateStandalonePackage(selectedSection.id);

  const handleCopyEmbed = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(pkg.embedIframeCode);
      setCopiedCode(true);
      toast.success("Embed <iframe> code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownload = () => {
    standaloneSectionExporter.downloadStandalonePackage(selectedSection.id);
    toast.success(`Standalone app bundle downloaded: ${selectedSection.id}-standalone-app.html`);
  };

  const handleLaunchWindow = () => {
    if (typeof window !== "undefined") {
      window.open(pkg.directStandaloneUrl, "_blank", "width=1200,height=800");
    }
  };

  const getSectionIcon = (id: ExportableSectionId) => {
    switch (id) {
      case "crm": return <Users className="size-5 text-amber-400" />;
      case "app_factory": return <Code2 className="size-5 text-cyan-400" />;
      case "kingpay": return <QrCode className="size-5 text-emerald-400" />;
      case "media_studio": return <Sparkles className="size-5 text-purple-400" />;
      case "revenue_os": return <DollarSign className="size-5 text-yellow-400" />;
      case "chat": return <Crown className="size-5 text-amber-400" />;
      case "integrations": return <Plug className="size-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl border-2 border-amber-500/40 bg-[#070e0b] shadow-[0_0_90px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 bg-black/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <ExternalLink className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base text-white">
                  Standalone Section Separation &amp; App Exporter
                </h3>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-[9px] font-mono font-bold">
                  1-CLICK SEPARATION
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Extract any tool or section into an independent standalone website, downloadable web app, or PWA package.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Left: Section Picker */}
          <div className="p-3 overflow-y-auto space-y-1.5 bg-black/30">
            <div className="px-2 py-1 text-[11px] font-mono text-amber-400 uppercase tracking-wider font-bold">
              Select Section to Extract ({sections.length})
            </div>
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSection(s)}
                className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 border ${
                  selectedSection.id === s.id
                    ? "bg-amber-950/40 border-amber-500/50 text-white shadow-sm"
                    : "bg-[#0a1812] border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="p-2 rounded-lg bg-black/40 shrink-0">
                  {getSectionIcon(s.id)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">{s.title}</div>
                  <div className="text-[10px] text-slate-400">{s.category}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Section Inspector & Exporter */}
          <div className="p-5 overflow-y-auto space-y-4 md:col-span-2 bg-[#050c09]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="font-bold text-white text-base">{selectedSection.title}</h4>
                <div className="text-xs text-amber-400 font-mono mt-0.5">
                  Suggested Domain: https://{selectedSection.suggestedDomain}
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                READY TO DETACH
              </Badge>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedSection.description}
            </p>

            {/* Features Checklist */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300">Included Independent Features:</span>
              <div className="grid grid-cols-2 gap-2">
                {selectedSection.features.map((f, i) => (
                  <div key={i} className="text-xs text-slate-300 bg-white/5 p-2 rounded-lg flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                onClick={handleLaunchWindow}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-10"
              >
                <ExternalLink className="size-4 mr-2" />
                Launch Standalone App
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold text-xs h-10"
              >
                <Download className="size-4 mr-2" />
                Download Standalone HTML Bundle
              </Button>
            </div>

            {/* Embed Code Snippet */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Embeddable Widget &lt;iframe&gt;:</span>
                <button
                  type="button"
                  onClick={handleCopyEmbed}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                >
                  {copiedCode ? <Check className="size-3" /> : <Copy className="size-3" />}
                  <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                </button>
              </div>
              <pre className="bg-black/60 border border-white/10 p-2.5 rounded-xl text-[11px] text-slate-300 font-mono overflow-x-auto">
                {pkg.embedIframeCode}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
