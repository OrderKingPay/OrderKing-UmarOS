"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  type SocialChannel,
  CHANNEL_CONSTRAINTS,
} from "@/lib/orderking/connectors/social-publisher";

interface PlannedSocialPost {
  id: string;
  channel: SocialChannel;
  title: string;
  caption: string;
  hashtags: string;
  orderUrl: string;
  neighborhood: string;
  scheduledFor: string;
  createdAt: string;
}

const STORAGE_KEY = "orderking_social_post_planner_v1";

export function SocialPublishingStudio() {
  const [selectedChannel, setSelectedChannel] = useState<SocialChannel>("instagram_reels");
  const [title, setTitle] = useState("Weekend Family Biryani Combo");
  const [caption, setCaption] = useState(
    "Ordering dinner for the family? Get fresh handi biryani delivered hot from verified neighborhood kitchens with zero surge fee."
  );
  const [hashtags, setHashtags] = useState("#OrderKing #FoodDelivery #DirectFromKitchen");
  const [orderUrl, setOrderUrl] = useState("https://orderking.in");
  const [neighborhood, setNeighborhood] = useState("Indiranagar, Bengaluru");
  const [scheduledFor, setScheduledFor] = useState("Today, 7:00 PM");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [plannedPosts, setPlannedPosts] = useState<PlannedSocialPost[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPlannedPosts(JSON.parse(raw));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const constraints = CHANNEL_CONSTRAINTS[selectedChannel];
  const fullPostText = `${title}\n\n${caption}\n\nOrder here: ${orderUrl}\nArea: ${neighborhood}\n\n${hashtags}`.trim();
  const isWithinLimit = fullPostText.length <= constraints.maxCaptionLength;

  const saveQueue = (next: PlannedSocialPost[]) => {
    setPlannedPosts(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const handleCopyText = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(`Copied ${label}`);
  };

  const handleAddPostToPlanner = () => {
    if (!title.trim() || !caption.trim()) {
      toast.error("Please enter a title and caption.");
      return;
    }
    if (!isWithinLimit) {
      toast.error(`Text exceeds ${constraints.maxCaptionLength} character limit for this channel.`);
      return;
    }

    const newItem: PlannedSocialPost = {
      id: `post_${Date.now()}`,
      channel: selectedChannel,
      title: title.trim(),
      caption: caption.trim(),
      hashtags: hashtags.trim(),
      orderUrl: orderUrl.trim(),
      neighborhood: neighborhood.trim(),
      scheduledFor: scheduledFor.trim() || "Unscheduled",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    saveQueue([newItem, ...plannedPosts]);
    toast.success("Saved post to your planner queue.");
  };

  const handleDeletePost = (id: string) => {
    saveQueue(plannedPosts.filter((p) => p.id !== id));
    toast.info("Removed post from planner.");
  };

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(fullPostText)}`;
  const xShareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    fullPostText.slice(0, 275)
  )}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Social Post Planner
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              1-Click Copy & Share
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Plan social media posts, check character limits, and copy or share directly to WhatsApp, Instagram, YouTube, or X.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyText(fullPostText, "header_copy", "full post text")}
            className="text-xs font-semibold gap-1.5 border-slate-300"
          >
            {copiedId === "header_copy" ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedId === "header_copy" ? "Copied Post" : "Copy Current Post"}
          </Button>
          <a
            href={whatsappShareHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 shadow-sm"
          >
            Share on WhatsApp <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 1. Current Status / Result & Next Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            Current Status / Result
          </span>
          <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            {plannedPosts.length} Planned {plannedPosts.length === 1 ? "Post" : "Posts"} Saved
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Length: {fullPostText.length} / {constraints.maxCaptionLength} chars ({isWithinLimit ? "Fits channel" : "Too long"})
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            Selected Channel Format
          </span>
          <p className="text-xs font-semibold text-slate-900 mt-1 uppercase">
            {selectedChannel.replace("_", " ")}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Aspect Ratio: {constraints.allowedAspectRatios.join(" or ")} • Max Hashtags: {constraints.maxHashtags}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <span className="text-[11px] font-bold uppercase text-emerald-800 block">
            Next Action
          </span>
          <p className="text-xs font-semibold text-emerald-950 mt-1">
            Customize your caption below, then click Save to Planner or Share on WhatsApp.
          </p>
        </div>
      </div>

      {/* 2. Settings & Customizations + Saved Post Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Composer & Customizations */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Settings & Customizations</h3>
          </div>

          {/* Channel Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Choose Platform</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: "instagram_reels", label: "Instagram Reels" },
                  { id: "whatsapp_broadcast", label: "WhatsApp Status" },
                  { id: "youtube_shorts", label: "YouTube Shorts" },
                  { id: "x_twitter", label: "X / Twitter" },
                  { id: "facebook_page", label: "Facebook Page" },
                ] as const
              ).map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChannel(ch.id)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                    selectedChannel === ch.id
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Post Headline</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Caption</label>
                <span
                  className={`text-[11px] font-mono ${
                    !isWithinLimit ? "text-rose-600 font-bold" : "text-slate-500"
                  }`}
                >
                  {fullPostText.length} / {constraints.maxCaptionLength}
                </span>
              </div>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Hashtags</label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Order Link</label>
                <input
                  type="text"
                  value={orderUrl}
                  onChange={(e) => setOrderUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Local Area / City</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Planned Time</label>
                <input
                  type="text"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  placeholder="e.g. Friday, 6:30 PM"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              onClick={handleAddPostToPlanner}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl gap-1.5"
            >
              <Plus className="h-4 w-4" /> Save to Planner
            </Button>
            <a
              href={xShareHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-800"
            >
              Post on X <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Right Side: Live Preview & Saved Queue */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">Ready-to-Paste Post Preview</h4>
              <button
                type="button"
                onClick={() => handleCopyText(fullPostText, "preview_copy", "post preview")}
                className="flex items-center gap-1 rounded-lg bg-white border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                {copiedId === "preview_copy" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedId === "preview_copy" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="rounded-lg bg-white border border-slate-200 p-3.5 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
              {fullPostText}
            </pre>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600" /> Saved Post Queue ({plannedPosts.length})
              </span>
            </div>

            {plannedPosts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                No saved posts yet. Click &ldquo;Save to Planner&rdquo; to keep your upcoming social posts organized here.
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {plannedPosts.map((post) => {
                  const text = `${post.title}\n\n${post.caption}\n\nOrder here: ${post.orderUrl}\nArea: ${post.neighborhood}\n\n${post.hashtags}`;
                  return (
                    <div
                      key={post.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                            {post.channel.replace("_", " ")}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            Planned: {post.scheduledFor}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 mt-1">{post.title}</h5>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyText(text, post.id, post.title)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            title="Copy post"
                          >
                            {copiedId === post.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50"
                            title="Remove post"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{post.caption}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
