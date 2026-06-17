"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Check, ArrowRight, ArrowLeft, RefreshCw, Undo, Redo, Compass, AlignLeft, Megaphone, Zap
} from "lucide-react";

interface ScriptEnhancerStepProps {
  scriptGateData: { hook: string; body: string };
  setScriptGateData: (data: { hook: string; body: string }) => void;
  onApproveGate1: () => void;
  onBackStep: () => void;
  pipelineState: "idle" | "running" | "gate1_script" | "gate2_storyboard" | "gate3_assets" | "synthesizing" | "completed";
  onRegenerateScript?: () => Promise<{ hook: string; body: string }>;
}

export default function ScriptEnhancerStep({
  scriptGateData,
  setScriptGateData,
  onApproveGate1,
  onBackStep,
  pipelineState,
  onRegenerateScript,
}: ScriptEnhancerStepProps) {

  // Local editable text hooks
  const [hookText, setHookText] = useState(scriptGateData?.hook || "");
  const [bodyText, setBodyText] = useState(scriptGateData?.body || "");
  const [ctaText, setCtaText] = useState("Tap follow to unlock neuro-cut.");

  useEffect(() => {
    if (scriptGateData) {
      setHookText(scriptGateData.hook || "");
      setBodyText(scriptGateData.body || "");
    }
  }, [scriptGateData]);

  // Micro-animation for auto-save data stream
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => setIsSaving(false), 800);
    return () => clearTimeout(timer);
  }, [hookText, bodyText, ctaText]);

  // Synchronise edits back to parent state
  const handleSaveAndApprove = () => {
    setScriptGateData({
      hook: hookText,
      body: bodyText + " " + ctaText
    });
    onApproveGate1();
  };

  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenScript = async () => {
    if (onRegenerateScript) {
      setIsRegenerating(true);
      try {
        const result = await onRegenerateScript();
        setHookText(result.hook);
        setBodyText(result.body);
        setCtaText("Tap follow to unlock neuro-cut.");
      } catch (err) {
        console.error("Error regenerating script:", err);
      } finally {
        setIsRegenerating(false);
      }
    } else {
      // Simulated script re-write
      setHookText("🚀 STOP SCROLLING! Traditional video editing is dead.");
      setBodyText("With NeuroCut Multi-Agent framework, models compose, storyboard and render assets in real-time.");
      setCtaText("Follow to experience the future.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <span className="step-badge mb-2">Step 2 of 5</span>
          <h2 className="text-2xl font-bold text-zinc-100 font-geist mt-2">Script Enhancer</h2>
          <p className="text-sm text-zinc-500 mt-1">Refine your hook, body, and call-to-action</p>
        </div>
        <div className="flex gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 bg-white/4 border border-white/6 px-3 py-1.5 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>4,209 tokens</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/4 border border-white/6 px-3 py-1.5 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span>Neuro-7B</span>
          </div>
        </div>
      </div>

      <div className="glass-panel-heavy p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/6 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center pb-4 border-b border-white/6 mb-5">
          <div className="flex items-center gap-3 text-zinc-500">
            <button className="p-1.5 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition"><Undo className="w-4 h-4" /></button>
            <button className="p-1.5 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition"><Redo className="w-4 h-4" /></button>
            <span className="text-xs flex items-center gap-1.5 text-emerald-400/80">
              <Check className={`w-3.5 h-3.5 ${isSaving ? "opacity-40" : ""}`} />
              {isSaving ? "Saving..." : "Auto-saved"}
            </span>
          </div>
          <span className="text-xs text-zinc-500">Target: <strong className="text-cyan-400">60s</strong></span>
        </div>

        {/* Narrative segments inputs with timeline */}
        <div className="space-y-4 text-left">

          <div className="terminal-pane p-4 relative overflow-hidden group">
            <div className={`absolute left-0 top-0 w-0.5 bg-emerald-400 h-full ${isSaving ? "animate-data-stream" : "opacity-0"}`} />
            <div className="flex justify-between items-center text-xs text-zinc-500 mb-2">
              <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                <Compass className="w-4 h-4 text-cyan-400" />
                Hook
              </span>
              <span className="text-[10px] bg-white/4 px-2 py-0.5 rounded-md">0:00 – 0:05</span>
            </div>
            <input
              type="text"
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none focus:text-primary caret-primary transition-all duration-300 font-mono"
            />
          </div>

          <div className="terminal-pane p-4 relative overflow-hidden group">
            <div className={`absolute left-0 top-0 w-0.5 bg-emerald-400 h-full ${isSaving ? "animate-data-stream" : "opacity-0"}`} />
            <div className="flex justify-between items-center text-xs text-zinc-500 mb-2">
              <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                <AlignLeft className="w-4 h-4 text-zinc-400" />
                Body
              </span>
              <span className="text-[10px] bg-white/4 px-2 py-0.5 rounded-md">0:05 – 0:45</span>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full h-20 bg-transparent text-sm text-zinc-200 focus:outline-none focus:text-primary caret-primary resize-none leading-relaxed transition-all duration-300 font-mono"
            />
          </div>

          <div className="terminal-pane p-4 relative overflow-hidden group">
            <div className={`absolute left-0 top-0 w-0.5 bg-emerald-400 h-full ${isSaving ? "animate-data-stream" : "opacity-0"}`} />
            <div className="flex justify-between items-center text-xs text-zinc-500 mb-2">
              <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                <Megaphone className="w-4 h-4 text-zinc-400" />
                Call to Action
              </span>
              <span className="text-[10px] bg-white/4 px-2 py-0.5 rounded-md">0:45 – 1:00</span>
            </div>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none focus:text-primary caret-primary transition-all duration-300 font-mono"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/6 pt-5">
          <button onClick={onBackStep} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 btn-secondary text-sm rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button onClick={handleRegenScript} disabled={isRegenerating} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 btn-secondary text-sm rounded-xl disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </button>
            <button onClick={handleSaveAndApprove} disabled={pipelineState === "running"} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 btn-primary text-sm rounded-xl disabled:opacity-40">
              {pipelineState === "running" ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Updating...</>
              ) : (
                <>Approve & Continue<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
