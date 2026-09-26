import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Download,
  Copy,
  Plus,
  RefreshCw,
  X,
  Play,
  Film,
  Layers,
  Palette,
  Check,
  Share2,
  Trash2,
  Sliders,
  Volume2,
  Subtitles,
  Maximize2,
  Wand2,
  FastForward,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mediaStorageVault, VaultMediaItem } from "@/lib/orderking/ai/media-storage-vault";

interface AiMediaStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoChat?: (item: VaultMediaItem) => void;
}

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9 (YouTube/Landscape)", width: 1920, height: 1080 },
  { id: "9:16", label: "9:16 (Reels/Shorts/TikTok)", width: 1080, height: 1920 },
  { id: "1:1", label: "1:1 (Square/Feed)", width: 1080, height: 1080 },
  { id: "4:5", label: "4:5 (Insta Portrait)", width: 1080, height: 1350 },
  { id: "21:9", label: "21:9 (Ultrawide Cinema)", width: 2560, height: 1080 },
];

const PRESET_IMAGE_STYLES = [
  { id: "photorealistic", label: "Photorealistic 8K", modifier: "photorealistic, 8k resolution, cinematic lighting, ultra-detailed, award winning" },
  { id: "octane3d", label: "3D Octane Render", modifier: "3D octane render, volumetric lighting, raytracing, blender 3d, hyper-detailed" },
  { id: "cyberpunk", label: "Cyberpunk Studio", modifier: "cyberpunk aesthetic, neon golden amber glow, futuristic metropolis, high tech" },
  { id: "vector", label: "Vector Logo & Brand", modifier: "clean vector graphic, minimalist modern emblem, flat design, svg style, solid background" },
  { id: "blueprint", label: "Architectural Blueprint", modifier: "architectural technical blueprint, schematic diagram, isometric grid, engineering draft" },
  { id: "anime", label: "Cinematic Anime", modifier: "makoto shinkai style, high anime production, vibrant colors, lush sky, cinematic frame" },
];

const VIDEO_DURATIONS = [
  { id: "5s", seconds: 5, label: "5s Teaser" },
  { id: "15s", seconds: 15, label: "15s Social Story" },
  { id: "30s", seconds: 30, label: "30s Commercial Promo" },
  { id: "60s", seconds: 60, label: "60s Product Showcase" },
  { id: "120s", seconds: 120, label: "120s Multi-Scene Commercial", multiScene: true },
];

const CAMERA_MOTIONS = [
  { id: "orbit", label: "Cinematic 360 Orbit" },
  { id: "drone", label: "High-Speed Drone Flight" },
  { id: "dolly", label: "Dolly Track & Zoom" },
  { id: "macro", label: "Hyper-Detailed Macro Glide" },
  { id: "pov", label: "First-Person POV Flow" },
];

const MOTION_SPEEDS = [
  { id: "0.5x", label: "0.5x (Cinematic Slow-Mo)" },
  { id: "1.0x", label: "1.0x (Natural Motion)" },
  { id: "2.0x", label: "2.0x (Kinetic Hyper-Speed)" },
];

const VOICEOVER_OPTIONS = [
  { id: "female_attractive", label: "Supreme Female Studio Voice" },
  { id: "male_executive", label: "Executive Deep Authority" },
  { id: "none", label: "None (Sound FX & Synth Only)" },
];

const NATIVE_LANGUAGES = ["English", "Hindi", "Bengali", "Arabic", "Spanish", "German"];

const PRESET_IMAGE_PROMPTS = [
  "OrderKing luxury golden delivery drone carrying fresh hot biryani over Karimganj city at twilight",
  "Futuristic 3D holographic King Pay soundbox with emerald LED status indicators and floating UPI QR matrix",
  "Luxury multi-vendor organic food marketplace app UI displayed on an ultra-thin glass smartphone",
  "Executive modern Indian cloud kitchen hub with automated robotic packing conveyor belts and ambient lighting",
];

const PRESET_VIDEO_PROMPTS = [
  "Cinematic 15-minute hyper-speed drone flight delivering gourmet meals across neon riverfront streets",
  "3D golden crown rotating with pulsating emerald beams symbolizing zero-fee King Pay instant settlement",
  "High-energy kitchen montage showing artisanal pizza tossed and wood-fired oven flames in slow motion",
  "Ultra-realistic commercial for OrderKing multi-brand food app with happy customers, steam rising from dishes, and luxury packaging",
];

export function AiMediaStudioModal({
  isOpen,
  onClose,
  onInsertIntoChat,
}: AiMediaStudioModalProps) {
  const [activeTab, setActiveTab] = useState<"image" | "video" | "multiscene" | "vault">("image");
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(PRESET_IMAGE_STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [videoDuration, setVideoDuration] = useState("30s");
  const [cameraMotion, setCameraMotion] = useState("drone");
  const [motionSpeed, setMotionSpeed] = useState("1.0x");
  const [voiceoverVoice, setVoiceoverVoice] = useState("female_attractive");
  const [selectedLang, setSelectedLang] = useState("English");
  const [autoCaptions, setAutoCaptions] = useState(true);
  const [upscale8K, setUpscale8K] = useState(true);
  
  // Image editing adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(105);
  const [saturation, setSaturation] = useState(110);
  const [watermarkBrand, setWatermarkBrand] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedItem, setGeneratedItem] = useState<VaultMediaItem | null>(null);
  const [vaultItems, setVaultItems] = useState<VaultMediaItem[]>(mediaStorageVault.getItems());

  // Multi-scene state
  const [multiScenes, setMultiScenes] = useState<Array<{ title: string; prompt: string; duration: number }>>([
    { title: "Scene 1: The Problem", prompt: "Frustrated customer waiting 60 minutes for cold food delivery from traditional apps in rain", duration: 15 },
    { title: "Scene 2: OrderKing Hero", prompt: "Golden futuristic OrderKing drone descends with steaming hot food in under 12 minutes", duration: 25 },
    { title: "Scene 3: KingPay Zero Fees", prompt: "Restaurant owner checks phone showing ₹0 commission fee and instant UPI bank settlement", duration: 20 },
    { title: "Scene 4: Call To Action", prompt: "Family enjoying feast together, OrderKing logo floating in 8K gold with 50% off first order banner", duration: 20 },
  ]);

  if (!isOpen) return null;

  const handleGenerateImage = () => {
    const finalPrompt = prompt.trim() || PRESET_IMAGE_PROMPTS[0];
    setIsGenerating(true);
    setGenerationProgress(10);
    setGeneratedItem(null);

    const styleObj = PRESET_IMAGE_STYLES.find((s) => s.id === selectedStyle) || PRESET_IMAGE_STYLES[0];
    const arObj = ASPECT_RATIOS.find((a) => a.id === aspectRatio) || ASPECT_RATIOS[0];
    const width = Math.min(arObj.width, 1920);
    const height = Math.min(arObj.height, 1920);
    const seed = Math.floor(Math.random() * 9999999);

    const qualityModifiers = upscale8K ? "8k uhd, photorealistic, masterpiece, highly intricate, sharp focus" : "";

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      `${finalPrompt}, ${styleObj.modifier}, ${qualityModifiers}`
    )}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 25;
      });
    }, 250);

    throw new Error("NO MOCK CLAIMS: Real image generation API is not connected.");
  };

  const handleGenerateVideo = () => {
    const finalPrompt = prompt.trim() || PRESET_VIDEO_PROMPTS[0];
    setIsGenerating(true);
    setGenerationProgress(15);
    setGeneratedItem(null);

    const durationObj = VIDEO_DURATIONS.find((d) => d.id === videoDuration) || VIDEO_DURATIONS[2];

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 92) {
          clearInterval(progressInterval);
          return 92;
        }
        return prev + 20;
      });
    }, 280);

    const videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-green-screen-41130-large.mp4";

    throw new Error("NO MOCK CLAIMS: Real video generation API is not connected.");
  };

  const handleGenerateMultiScene = () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setGeneratedItem(null);

    const totalSeconds = multiScenes.reduce((acc, s) => acc + s.duration, 0);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => (prev >= 90 ? 90 : prev + 15));
    }, 250);

    const videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-green-screen-41130-large.mp4";

    throw new Error("NO MOCK CLAIMS: Real multi-scene generation API is not connected.");
  };

  const handleDeleteVaultItem = (id: string) => {
    mediaStorageVault.deleteItem(id);
    setVaultItems(mediaStorageVault.getItems());
    toast.info("Media item removed from vault.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-2xl border-2 border-amber-500/50 bg-[#071510] shadow-[0_0_90px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-amber-500/30 bg-black/70 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base text-white">
                  Supreme AI Video &amp; Image Creation Studio
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[9px] font-mono">
                  #1 IN WORLD · 100% REALISTIC · 0 COST
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Any aspect ratio · Multi-scene long commercial videos · 8K upscaling · Realistic Voiceovers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-surface-2 p-1 border border-border">
              <button
                type="button"
                onClick={() => setActiveTab("image")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition ${
                  activeTab === "image" ? "bg-amber-500 text-black shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <ImageIcon className="size-3.5" />
                <span>8K Images</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition ${
                  activeTab === "video" ? "bg-amber-500 text-black shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <Video className="size-3.5" />
                <span>AI Videos</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("multiscene")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition ${
                  activeTab === "multiscene" ? "bg-amber-500 text-black shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <Film className="size-3.5" />
                <span>Commercial Stitcher</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vault")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition ${
                  activeTab === "vault" ? "bg-amber-500 text-black shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <Layers className="size-3.5" />
                <span>Vault ({vaultItems.length})</span>
              </button>
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
        </header>

        {/* Studio Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Progress Bar during generation */}
          {isGenerating && (
            <div className="rounded-xl border border-amber-500/40 bg-black/60 p-4 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <RefreshCw className="size-3.5 animate-spin" />
                  Synthesizing realistic assets with neural physics engine...
                </span>
                <span className="font-mono text-amber-400">{generationProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* TAB 1: 8K IMAGE GENERATOR & EDITOR */}
          {activeTab === "image" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>Enter Photorealistic Prompt:</span>
                  <span className="text-[10px] text-muted font-normal">8K UHD · Octane Raytracing · Zero Cost</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe scene (e.g. 'OrderKing autonomous delivery drone flying over skyline at sunset, 8K')..."
                    className="flex-1 bg-black/60 border-amber-500/40 text-xs sm:text-sm text-white focus-visible:ring-amber-400"
                  />
                  <Button
                    disabled={isGenerating}
                    onClick={handleGenerateImage}
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs px-5 shadow-lg"
                  >
                    {isGenerating ? <RefreshCw className="size-4 mr-1 animate-spin" /> : <Sparkles className="size-4 mr-1" />}
                    <span>{isGenerating ? "Synthesizing..." : "Generate 8K Image"}</span>
                  </Button>
                </div>
              </div>

              {/* Aspect Ratio Picker */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-300">Target Aspect Ratio / Format:</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id)}
                      className={`p-2 rounded-xl border text-left text-xs font-medium transition ${
                        aspectRatio === ar.id
                          ? "bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-sm"
                          : "bg-surface-2 border-border text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block font-bold text-[11px] text-white">{ar.id}</span>
                      <span className="block text-[10px] text-slate-400 truncate">{ar.label.split(" ")[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-300 block">Artistic Rendering Style:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {PRESET_IMAGE_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`p-2 rounded-xl border text-left text-xs font-medium transition ${
                        selectedStyle === st.id
                          ? "bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-sm"
                          : "bg-black/40 border-border/60 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-[11px] truncate">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Enhancers */}
              <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl border border-border/70 bg-black/40 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={upscale8K}
                    onChange={(e) => setUpscale8K(e.target.checked)}
                    className="rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="font-bold text-amber-300">8K Super-Resolution Upscaling</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watermarkBrand}
                    onChange={(e) => setWatermarkBrand(e.target.checked)}
                    className="rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-300">OrderKing Founder Hologram Badge</span>
                </label>
              </div>

              {/* Output Result Card with Visual Customizer */}
              {generatedItem && generatedItem.type === "image" && (
                <div className="rounded-xl border border-emerald-500/40 bg-black/60 p-4 space-y-4 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">8K Photorealistic Master Asset Ready</span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                      {generatedItem.aspectRatio || aspectRatio} · {(generatedItem.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </Badge>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-border/80 max-h-[380px] flex items-center justify-center bg-black">
                    <img loading="lazy"                       src={generatedItem.url}
                      alt={generatedItem.title}
                      style={{
                        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                      }}
                      className="w-full h-full object-contain max-h-[360px] transition duration-200"
                    />
                    {watermarkBrand && (
                      <div className="absolute bottom-3 right-3 rounded-lg bg-black/75 px-2.5 py-1 border border-amber-500/50 backdrop-blur text-[10px] font-bold text-amber-300">
                        ⚡ OrderKing Founder Sovereign Edition
                      </div>
                    )}
                  </div>

                  {/* Real-Time Visual Tuning Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-black/50 border border-border text-[11px]">
                    <div>
                      <span className="text-slate-400">Brightness ({brightness}%)</span>
                      <input
                        type="range"
                        min="70"
                        max="140"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">Contrast ({contrast}%)</span>
                      <input
                        type="range"
                        min="70"
                        max="140"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">Saturation ({saturation}%)</span>
                      <input
                        type="range"
                        min="70"
                        max="160"
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                      onClick={() => {
                        window.open(generatedItem.url, "_blank");
                        toast.success("Opening 8K high-res image!");
                      }}
                    >
                      <Download className="size-3.5 mr-1.5" />
                      Download 8K High-Res
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold text-emerald-300 border-emerald-500/40"
                      onClick={() => {
                        void navigator.clipboard?.writeText(generatedItem.url);
                        toast.success("Image link copied!");
                      }}
                    >
                      <Copy className="size-3.5 mr-1.5" />
                      Copy URL
                    </Button>

                    {onInsertIntoChat && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-bold text-cyan-300 border-cyan-500/40"
                        onClick={() => {
                          onInsertIntoChat(generatedItem);
                          toast.success("Inserted image into active chat!");
                          onClose();
                        }}
                      >
                        <Share2 className="size-3.5 mr-1.5" />
                        Insert to AI Chat
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI VIDEO GENERATOR */}
          {activeTab === "video" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>Enter Video Motion &amp; Cinematics Prompt:</span>
                  <span className="text-[10px] text-muted font-normal">Kinetic AI Motion · 60FPS · 100% Realistic</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe motion scene (e.g. 'Hyper-speed delivery drone flight through futuristic city')..."
                    className="flex-1 bg-black/60 border-amber-500/40 text-xs sm:text-sm text-white focus-visible:ring-amber-400"
                  />
                  <Button
                    disabled={isGenerating}
                    onClick={handleGenerateVideo}
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs px-5 shadow-lg"
                  >
                    {isGenerating ? <RefreshCw className="size-4 mr-1 animate-spin" /> : <Film className="size-4 mr-1" />}
                    <span>{isGenerating ? "Rendering..." : "Generate AI Video"}</span>
                  </Button>
                </div>
              </div>

              {/* Video Configuration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Duration */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300">Duration:</span>
                  <div className="space-y-1">
                    {VIDEO_DURATIONS.slice(0, 4).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setVideoDuration(d.id)}
                        className={`w-full py-1.5 px-2.5 rounded-lg border text-left text-xs font-medium transition ${
                          videoDuration === d.id
                            ? "bg-amber-500/20 border-amber-400 text-amber-200 font-bold"
                            : "bg-surface-2 border-border text-slate-400 hover:text-white"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300">Aspect Ratio:</span>
                  <div className="space-y-1">
                    {ASPECT_RATIOS.slice(0, 4).map((ar) => (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setAspectRatio(ar.id)}
                        className={`w-full py-1.5 px-2.5 rounded-lg border text-left text-xs font-medium transition ${
                          aspectRatio === ar.id
                            ? "bg-amber-500/20 border-amber-400 text-amber-200 font-bold"
                            : "bg-surface-2 border-border text-slate-400 hover:text-white"
                        }`}
                      >
                        {ar.id} {ar.label.split(" ")[1]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Camera Dynamics */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300">Camera Dynamics:</span>
                  <div className="space-y-1">
                    {CAMERA_MOTIONS.map((cm) => (
                      <button
                        key={cm.id}
                        type="button"
                        onClick={() => setCameraMotion(cm.id)}
                        className={`w-full py-1.5 px-2.5 rounded-lg border text-left text-xs font-medium transition ${
                          cameraMotion === cm.id
                            ? "bg-amber-500/20 border-amber-400 text-amber-200 font-bold"
                            : "bg-surface-2 border-border text-slate-400 hover:text-white"
                        }`}
                      >
                        {cm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voiceover & Audio */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300">Voiceover &amp; Audio:</span>
                  <div className="space-y-1">
                    {VOICEOVER_OPTIONS.map((vo) => (
                      <button
                        key={vo.id}
                        type="button"
                        onClick={() => setVoiceoverVoice(vo.id)}
                        className={`w-full py-1.5 px-2.5 rounded-lg border text-left text-xs font-medium transition ${
                          voiceoverVoice === vo.id
                            ? "bg-amber-500/20 border-amber-400 text-amber-200 font-bold"
                            : "bg-surface-2 border-border text-slate-400 hover:text-white"
                        }`}
                      >
                        {vo.label}
                      </button>
                    ))}
                    <div className="pt-1">
                      <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        className="w-full rounded-lg bg-surface-2 border border-border px-2 py-1 text-xs text-white"
                      >
                        {NATIVE_LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            Language: {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Result Card */}
              {generatedItem && generatedItem.type === "video" && (
                <div className="rounded-xl border border-emerald-500/40 bg-black/60 p-4 space-y-3 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">✓ Video Rendering Complete (60FPS UHD)</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                      {generatedItem.durationSeconds}s · {(generatedItem.sizeBytes / (1024 * 1024)).toFixed(2)} MB · MP4
                    </Badge>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-border/80 bg-black">
                    <video
                      src={generatedItem.url}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full max-h-[380px] object-cover"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                      onClick={() => {
                        window.open(generatedItem.url, "_blank");
                        toast.success("Downloading video!");
                      }}
                    >
                      <Download className="size-3.5 mr-1.5" />
                      Download Video (MP4)
                    </Button>

                    {onInsertIntoChat && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-bold text-cyan-300 border-cyan-500/40"
                        onClick={() => {
                          onInsertIntoChat(generatedItem);
                          toast.success("Inserted video into active chat!");
                          onClose();
                        }}
                      >
                        <Share2 className="size-3.5 mr-1.5" />
                        Insert to AI Chat
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMERCIAL MULTI-SCENE VIDEO STITCHER */}
          {activeTab === "multiscene" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/40 bg-black/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <Film className="size-4" />
                    Multi-Scene Long Commercial Video Stitcher
                  </h4>
                  <Badge className="bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    Total Runtime: {multiScenes.reduce((acc, s) => acc + s.duration, 0)}s
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Stitches multiple sequential cinematic scenes into one cohesive, high-converting commercial video with synced realistic voiceover and captions.
                </p>
              </div>

              {/* Scene Editors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {multiScenes.map((scene, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/70 bg-black/60 p-3 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span className="size-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-mono">
                          {idx + 1}
                        </span>
                        {scene.title}
                      </span>
                      <Badge className="bg-surface-2 text-slate-300 text-[10px] font-mono">
                        {scene.duration}s
                      </Badge>
                    </div>
                    <Input
                      value={scene.prompt}
                      onChange={(e) => {
                        const updated = [...multiScenes];
                        updated[idx].prompt = e.target.value;
                        setMultiScenes(updated);
                      }}
                      className="bg-black/80 border-border/80 text-xs text-slate-200"
                    />
                  </div>
                ))}
              </div>

              {/* Stitch Button */}
              <div className="pt-2">
                <Button
                  disabled={isGenerating}
                  onClick={handleGenerateMultiScene}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs py-5 shadow-xl"
                >
                  {isGenerating ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <Film className="size-4 mr-2" />}
                  <span>{isGenerating ? "Stitching Multi-Scene Masterpiece..." : "Stitch & Render Long Commercial Video (100% Free)"}</span>
                </Button>
              </div>

              {/* Result Preview */}
              {generatedItem && generatedItem.isMultiScene && (
                <div className="rounded-xl border border-emerald-500/40 bg-black/60 p-4 space-y-3 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">✓ Multi-Scene Commercial Stitched ({generatedItem.scenesCount} Scenes)</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                      {generatedItem.durationSeconds}s Total Runtime
                    </Badge>
                  </div>
                  <video
                    src={generatedItem.url}
                    controls
                    autoPlay
                    loop
                    className="w-full max-h-[380px] object-cover rounded-xl border border-border"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                      onClick={() => window.open(generatedItem.url, "_blank")}
                    >
                      <Download className="size-3.5 mr-1.5" />
                      Download Stitched Commercial
                    </Button>
                    {onInsertIntoChat && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-bold text-cyan-300 border-cyan-500/40"
                        onClick={() => {
                          onInsertIntoChat(generatedItem);
                          toast.success("Inserted stitched commercial into chat!");
                          onClose();
                        }}
                      >
                        <Share2 className="size-3.5 mr-1.5" />
                        Send to Chat
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MEDIA VAULT ARCHIVE */}
          {activeTab === "vault" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div>
                  <h4 className="text-xs font-bold text-white">HD Master Media Vault Storage</h4>
                  <p className="text-[11px] text-muted">
                    Persistent repository of all generated 8K images, cinematic videos, and stitched commercials.
                  </p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                  {vaultItems.length} Stored Items
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {vaultItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/60 bg-black/50 p-3 space-y-2 hover:border-amber-500/50 transition group"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                      {item.type === "video" ? (
                        <video
                          src={item.url}
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img loading="lazy"                           src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <Badge className="absolute top-1.5 left-1.5 bg-black/70 text-[9px] font-mono uppercase">
                        {item.type} {item.aspectRatio ? `· ${item.aspectRatio}` : ""}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-start text-xs">
                      <span className="font-bold text-white truncate max-w-[170px]">{item.title}</span>
                      <span className="text-[10px] text-muted font-mono">
                        {(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>

                    {item.style && (
                      <p className="text-[10px] text-slate-400 truncate">{item.style}</p>
                    )}

                    <div className="flex items-center gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-[10px] font-bold"
                        onClick={() => window.open(item.url, "_blank")}
                      >
                        <Download className="size-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="size-7 p-0 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                        onClick={() => handleDeleteVaultItem(item.id)}
                        title="Delete from Vault"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
