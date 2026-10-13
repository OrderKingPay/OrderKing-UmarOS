"use client";

import React, { useState } from "react";
import {
  Share2,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Flame,
  Radio,
  Lock,
  MessageSquare,
  Video,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  type SocialChannel,
  type SocialPostPayload,
  CHANNEL_CONSTRAINTS,
  SocialRateLimiter,
  dispatchSocialCampaign,
  validateSocialPost,
} from "@/lib/orderking/connectors/social-publisher";

const rateLimiterInstance = new SocialRateLimiter();

export function SocialPublishingStudio() {
  const [selectedChannel, setSelectedChannel] = useState<SocialChannel>("instagram_reels");
  const [title, setTitle] = useState("OrderKing Midnight Biryani Rush");
  const [caption, setCaption] = useState(
    "Craving steaming hot dum biryani at 1 AM? OrderKing delivers in under 15 minutes across your city. Zero convenience fee tonight! 🍲🚀 #OrderKing #MidnightFood #FoodDelivery"
  );
  const [targetCatchment, setTargetCatchment] = useState("Indiranagar, BLR");
  const [mediaUrl, setMediaUrl] = useState("https://cdn.orderking.in/campaigns/biryani_reel_1080p.mp4");
  const [mediaType, setMediaType] = useState<"video" | "image">("video");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchedHistory, setDispatchedHistory] = useState<SocialPostPayload[]>([
    {
      id: "camp_hist_01",
      channel: "youtube_shorts",
      title: "12-Minute Instant Delivery Challenge",
      caption: "Can we deliver hot pizza in under 12 minutes? Watch this live GPS run! #OrderKing #Shorts",
      hashtags: ["#OrderKing", "#Shorts"],
      mediaUrl: "https://cdn.orderking.in/campaigns/delivery_challenge.mp4",
      mediaType: "video",
      aspectRatio: "9:16",
      status: "PUBLISHED",
      retryCount: 0,
      maxRetries: 3,
      signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      dispatchedAt: "10 mins ago",
      publishedUrl: "https://youtube.shorts.com/share/ok_camp_hist_01",
      analytics: {
        estimatedReach: 24500,
        impressions: 33075,
        clicks: 1587,
        conversions: 190,
        estimatedRoas: 7.98,
      },
    },
  ]);

  const constraints = CHANNEL_CONSTRAINTS[selectedChannel];
  const remainingTokens = rateLimiterInstance.getAvailableTokens(selectedChannel);

  const handleChannelSelect = (ch: SocialChannel) => {
    setSelectedChannel(ch);
    const cons = CHANNEL_CONSTRAINTS[ch];
    if (cons.requiresVideo) {
      setMediaType("video");
      setAspectRatio("9:16");
    } else {
      setAspectRatio(cons.allowedAspectRatios[0]);
    }
  };

  const handleDispatch = () => {
    setIsDispatching(true);

    const postPayload: SocialPostPayload = {
      id: `camp_${Date.now()}`,
      channel: selectedChannel,
      title,
      caption,
      hashtags: ["#OrderKing", "#FoodDelivery", "#KingPay"],
      mediaUrl,
      mediaType,
      aspectRatio,
      targetCatchment,
      status: "SCHEDULED",
      retryCount: 0,
      maxRetries: 3,
    };

    const secretKey = "sovereign_production_vault_secret";
    const result = dispatchSocialCampaign(postPayload, secretKey, rateLimiterInstance);

    setTimeout(() => {
      setIsDispatching(false);
      if (result.success) {
        setDispatchedHistory((prev) => [result.post, ...prev]);
        toast.success(`Campaign published to ${selectedChannel.replace("_", " ")}!`);
      } else {
        toast.error(`Dispatch failed: ${result.message}`);
      }
    }, 900);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Social Publishing & MCP Connectors (DEMO D & E)
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              MULTI-CHANNEL DISPATCH
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Autonomous multi-channel marketing engine. Dispatches cryptographically signed payloads to Instagram Reels, YouTube Shorts, X, Facebook, and WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 bg-white border border-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
            <Lock className="h-3.5 w-3.5 text-emerald-600" /> HMAC-SHA256 SIGNED
          </span>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Side: Campaign Composer */}
        <div className="lg:col-span-6 border-r border-slate-200 p-6 space-y-5 bg-white">
          {/* Channel Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 font-mono">
              Target Distribution Channel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleChannelSelect("instagram_reels")}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  selectedChannel === "instagram_reels"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-bold">Instagram Reels</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">9:16 Video</div>
              </button>

              <button
                onClick={() => handleChannelSelect("youtube_shorts")}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  selectedChannel === "youtube_shorts"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-bold">YouTube Shorts</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">9:16 Video</div>
              </button>

              <button
                onClick={() => handleChannelSelect("x_twitter")}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  selectedChannel === "x_twitter"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-bold">X / Twitter</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">280 Char Post</div>
              </button>

              <button
                onClick={() => handleChannelSelect("whatsapp_broadcast")}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  selectedChannel === "whatsapp_broadcast"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-bold">WhatsApp Business</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Direct Broadcast</div>
              </button>

              <button
                onClick={() => handleChannelSelect("facebook_page")}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  selectedChannel === "facebook_page"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-bold">Facebook Page</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Rich Post</div>
              </button>
            </div>
          </div>

          {/* Title & Caption */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 font-mono">
                Campaign Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-sans"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Post Caption & Call-to-Action
                </label>
                <span className={`text-[10px] font-mono ${caption.length > constraints.maxCaptionLength ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                  {caption.length} / {constraints.maxCaptionLength}
                </span>
              </div>
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Catchment & Media Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 font-mono">
                Geotarget Catchment
              </label>
              <select
                value={targetCatchment}
                onChange={(e) => setTargetCatchment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              >
                <option value="Connaught Place, DL">Connaught Place, Delhi</option>
                <option value="Indiranagar, BLR">Indiranagar, Bengaluru</option>
                <option value="Bandra BKC, BOM">Bandra BKC, Mumbai</option>
                <option value="CyberHub, GGN">CyberHub, Gurugram</option>
                <option value="HITEC City, HYD">HITEC City, Hyderabad</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 font-mono">
                Hourly Rate Quota
              </label>
              <div className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 flex items-center justify-between">
                <span>AVAILABLE:</span>
                <span className="font-bold text-emerald-700">{remainingTokens} POSTS</span>
              </div>
            </div>
          </div>

          {/* Dispatch Button */}
          <Button
            onClick={handleDispatch}
            disabled={isDispatching}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl gap-2 shadow-sm"
          >
            {isDispatching ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Verifying & Broadcasting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Dispatch Signed Campaign Now
              </>
            )}
          </Button>
        </div>

        {/* Right Side: Dispatched Campaigns & Analytics Stream */}
        <div className="lg:col-span-6 p-6 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Dispatched Campaign Telemetry
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                LIVE MCP BROADCAST
              </span>
            </div>

            <div className="space-y-4">
              {dispatchedHistory.map((post) => (
                <div
                  key={post.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                          {post.channel.replace("_", " ")}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs">{post.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {post.caption}
                      </p>
                    </div>

                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                      {post.status}
                    </span>
                  </div>

                  {post.analytics && (
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[10px] font-mono">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block">REACH</span>
                        <span className="font-bold text-slate-800">{post.analytics.estimatedReach.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block">IMPRESSIONS</span>
                        <span className="font-bold text-slate-800">{post.analytics.impressions.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block">CLICKS</span>
                        <span className="font-bold text-slate-800">{post.analytics.clicks.toLocaleString()}</span>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <span className="text-emerald-600 block">ROAS</span>
                        <span className="font-bold text-emerald-800">{post.analytics.estimatedRoas}x</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-slate-400">
                    <span className="truncate max-w-[200px]">SIG: {post.signature?.slice(0, 16)}...</span>
                    {post.publishedUrl && (
                      <a
                        href={post.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        View Broadcast <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>DISPATCH PROTOCOL: MCP REST / WEBSOCKET</span>
            <span>ENCRYPTION: TLS 1.3 / HMAC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
