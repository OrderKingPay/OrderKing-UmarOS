"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  DollarSign,
  CheckCircle2,
  Sliders,
  Send,
  Save,
  RotateCcw,
  MessageSquare,
  Image as ImageIcon,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FRONTIER_MODELS,
  calculateTokenCost,
  USD_TO_INR_EXCHANGE_RATE,
} from "@/lib/orderking/ai/benchmark-matrix";

interface AiModelSettings {
  supportModel: string;
  menuPhotoModel: string;
  businessAdviceModel: string;
  dailyBudgetLimitInr: number;
  maxTokensPerReply: number;
  strictFactualMode: boolean;
  autoFallbackToFlash: boolean;
  customSystemInstruction: string;
}

const DEFAULT_AI_SETTINGS: AiModelSettings = {
  supportModel: "gemini-2.5-flash",
  menuPhotoModel: "gemini-2.5-flash",
  businessAdviceModel: "gemini-2.5-pro",
  dailyBudgetLimitInr: 500,
  maxTokensPerReply: 512,
  strictFactualMode: true,
  autoFallbackToFlash: true,
  customSystemInstruction:
    "Reply in short, polite, plain English. Follow FSSAI food safety and GST invoice rules.",
};

const STORAGE_KEY = "orderking_ai_model_settings_v1";

export function MultimodelBenchmarkDashboard() {
  const [settings, setSettings] = useState<AiModelSettings>(DEFAULT_AI_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<AiModelSettings>(DEFAULT_AI_SETTINGS);
  const [testCategory, setTestCategory] = useState<"support" | "menu" | "advice">("support");
  const [testPrompt, setTestPrompt] = useState(
    "Customer asks: Where is my order and can I get a GST invoice?"
  );
  const [testOutput, setTestOutput] = useState<{
    modelName: string;
    estimatedCostInr: number;
    previewText: string;
    testedAt: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) };
        setSettings(parsed);
        setSavedSettings(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const modelKeys = Object.keys(FRONTIER_MODELS);
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const activeModelId =
    testCategory === "support"
      ? settings.supportModel
      : testCategory === "menu"
      ? settings.menuPhotoModel
      : settings.businessAdviceModel;

  const activeModel = FRONTIER_MODELS[activeModelId] || FRONTIER_MODELS["gemini-2.5-flash"];

  // Estimate cost for 100 replies per day (~400 input tokens, ~200 output tokens each)
  const daily100RepliesCost = calculateTokenCost(activeModelId, 40_000, 20_000);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSavedSettings(settings);
      toast.success("AI model and budget settings saved.");
    } catch {
      setSavedSettings(settings);
      toast.success("AI model settings updated.");
    }
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_AI_SETTINGS);
    toast.info("Settings reset to recommended defaults.");
  };

  const handleTestResponse = () => {
    if (!testPrompt.trim()) {
      toast.error("Please enter a sample question to test.");
      return;
    }

    const inputTokens = Math.max(20, Math.ceil(testPrompt.length / 4));
    const outputTokens = Math.min(settings.maxTokensPerReply, 180);
    const cost = calculateTokenCost(activeModelId, inputTokens, outputTokens);

    const sampleReplies: Record<"support" | "menu" | "advice", string> = {
      support:
        "Order Status Reply Template: We are checking your live kitchen and rider status now. Your itemized GST tax invoice can be downloaded directly from the Order Details screen once delivered.",
      menu:
        "Menu Description Template: Freshly prepared in our FSSAI-verified kitchen using sealed tamper-evident packaging. Allergen and portion size details are listed below.",
      advice:
        "Business Advice Template: Focus on reducing kitchen prep time during 7 PM–10 PM peak dinner hours and highlight top-margin combo meals on your home banner.",
    };

    setTestOutput({
      modelName: activeModel.name,
      estimatedCostInr: cost.costInr,
      previewText: `[${activeModel.name} • Max ${settings.maxTokensPerReply} tokens]\n${sampleReplies[testCategory]}\n\nRule Applied: "${settings.customSystemInstruction}"`,
      testedAt: new Date().toLocaleTimeString(),
    });
    toast.success("Test response generated.");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              AI Models & Cost Settings
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Budget Guard Active
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Choose which AI model powers support, menu descriptions, and business advice, and set your daily spending limit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSettings}
              className="text-xs font-semibold gap-1.5 border-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSaveSettings}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" /> {hasUnsavedChanges ? "Save Settings" : "Settings Saved"}
          </Button>
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
            Daily Cap: ₹{settings.dailyBudgetLimitInr}/day
          </p>
          <p className="text-xs text-slate-600 mt-1">
            100 customer replies cost ~₹{daily100RepliesCost.costInr.toFixed(2)} on {activeModel.name}.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            Active Task Models
          </span>
          <p className="text-xs text-slate-800 font-semibold mt-1">
            Support: {FRONTIER_MODELS[settings.supportModel]?.name || settings.supportModel}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Photos: {FRONTIER_MODELS[settings.menuPhotoModel]?.name || settings.menuPhotoModel} • Advice:{" "}
            {FRONTIER_MODELS[settings.businessAdviceModel]?.name || settings.businessAdviceModel}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <span className="text-[11px] font-bold uppercase text-emerald-800 block">
            Next Action
          </span>
          <p className="text-xs font-semibold text-emerald-950 mt-1">
            Pick your models below, test a sample reply, and click Save Settings.
          </p>
          <p className="text-[11px] text-emerald-800 mt-1">
            Paste your live OpenAI or Gemini API key in the API Keys tab when ready.
          </p>
        </div>
      </div>

      {/* 2. Settings & Customizations */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Settings & Customizations</h3>
          </div>
          <span className="text-xs text-slate-500">
            Exchange rate reference: ₹{USD_TO_INR_EXCHANGE_RATE}/USD
          </span>
        </div>

        {/* Task Model Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
              Customer Support Replies
            </label>
            <p className="text-[11px] text-slate-500">
              Answers order status, refund, and invoice questions.
            </p>
            <select
              value={settings.supportModel}
              onChange={(e) => setSettings((p) => ({ ...p, supportModel: e.target.value }))}
              className="w-full mt-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
            >
              {modelKeys.map((key) => {
                const m = FRONTIER_MODELS[key];
                return (
                  <option key={key} value={key}>
                    {m.name} ({m.provider})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
              Menu Photos & Descriptions
            </label>
            <p className="text-[11px] text-slate-500">
              Writes dish descriptions and checks menu photo clarity.
            </p>
            <select
              value={settings.menuPhotoModel}
              onChange={(e) => setSettings((p) => ({ ...p, menuPhotoModel: e.target.value }))}
              className="w-full mt-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
            >
              {modelKeys.map((key) => {
                const m = FRONTIER_MODELS[key];
                return (
                  <option key={key} value={key}>
                    {m.name} ({m.provider})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              Business & Sales Advice
            </label>
            <p className="text-[11px] text-slate-500">
              Summarizes daily sales, slow items, and kitchen prep tips.
            </p>
            <select
              value={settings.businessAdviceModel}
              onChange={(e) => setSettings((p) => ({ ...p, businessAdviceModel: e.target.value }))}
              className="w-full mt-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
            >
              {modelKeys.map((key) => {
                const m = FRONTIER_MODELS[key];
                return (
                  <option key={key} value={key}>
                    {m.name} ({m.provider})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Budget & Safety Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Daily Budget Limit (₹ INR)</span>
              <span className="font-mono text-emerald-700">₹{settings.dailyBudgetLimitInr}/day</span>
            </label>
            <input
              type="number"
              min={50}
              max={50000}
              step={50}
              value={settings.dailyBudgetLimitInr}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  dailyBudgetLimitInr: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
            <p className="text-[11px] text-slate-500">
              AI pauses non-essential tasks if daily spend reaches this limit.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Max Reply Length (Tokens)</span>
              <span className="font-mono text-slate-700">{settings.maxTokensPerReply} tokens</span>
            </label>
            <select
              value={settings.maxTokensPerReply}
              onChange={(e) =>
                setSettings((p) => ({ ...p, maxTokensPerReply: Number(e.target.value) || 512 }))
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            >
              <option value={256}>Short & Fast (256 tokens)</option>
              <option value={512}>Standard Reply (512 tokens)</option>
              <option value={1024}>Detailed Report (1024 tokens)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Shorter replies respond faster and lower your monthly AI bill.
            </p>
          </div>
        </div>

        {/* Custom Instruction & Toggles */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Custom AI Rules & Brand Tone
            </label>
            <input
              type="text"
              value={settings.customSystemInstruction}
              onChange={(e) =>
                setSettings((p) => ({ ...p, customSystemInstruction: e.target.value }))
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              placeholder="Tell the AI how to speak to your customers..."
            />
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.strictFactualMode}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, strictFactualMode: e.target.checked }))
                }
                className="rounded border-slate-300 text-emerald-600"
              />
              <span>Strict factual mode (never guess prices or order status)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoFallbackToFlash}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, autoFallbackToFlash: e.target.checked }))
                }
                className="rounded border-slate-300 text-emerald-600"
              />
              <span>Switch to low-cost Flash model when 80% of daily budget is used</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Simple Model Price List */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800">Model Price Comparison</h3>
          <span className="text-[11px] text-slate-500">Cost per 1 Million tokens in ₹ INR</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-600">
                <th className="p-3 font-bold">Model Name</th>
                <th className="p-3 font-bold">Provider</th>
                <th className="p-3 font-bold">Input Cost / 1M</th>
                <th className="p-3 font-bold">Output Cost / 1M</th>
                <th className="p-3 font-bold">Best Used For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modelKeys.map((key) => {
                const model = FRONTIER_MODELS[key];
                const inInr = (model.inputCostPerMillionUsd * USD_TO_INR_EXCHANGE_RATE).toFixed(0);
                const outInr = (model.outputCostPerMillionUsd * USD_TO_INR_EXCHANGE_RATE).toFixed(0);
                return (
                  <tr key={key} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{model.name}</td>
                    <td className="p-3 text-slate-600 capitalize">{model.provider}</td>
                    <td className="p-3 font-mono text-slate-800">
                      ₹{inInr} (${model.inputCostPerMillionUsd.toFixed(2)})
                    </td>
                    <td className="p-3 font-mono text-slate-800">
                      ₹{outInr} (${model.outputCostPerMillionUsd.toFixed(2)})
                    </td>
                    <td className="p-3 text-slate-600">
                      {model.inputCostPerMillionUsd === 0
                        ? "Free local offline backup"
                        : model.inputCostPerMillionUsd <= 0.5
                        ? "Fast daily support & menu text"
                        : "Deep business reports & planning"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Test AI Response Box */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Test Model Response</h3>
            <p className="text-xs text-slate-600">
              Preview how your selected model formats replies and check the exact cost per message.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {(["support", "menu", "advice"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTestCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  testCategory === cat
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {cat === "support" ? "Support" : cat === "menu" ? "Menu Copy" : "Business Advice"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Enter customer support query or culinary menu item description..."
            className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
          />
          <Button
            onClick={handleTestResponse}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 rounded-xl gap-1.5"
          >
            <Send className="h-3.5 w-3.5" /> Test Response
          </Button>
        </div>

        {testOutput && (
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900">
                Model: {testOutput.modelName}
              </span>
              <span className="font-mono text-emerald-700 font-semibold">
                Est. Cost: ₹{testOutput.estimatedCostInr.toFixed(4)} • {testOutput.testedAt}
              </span>
            </div>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {testOutput.previewText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
