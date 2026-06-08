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
    <div className="w-full max-w-6xl mx-auto mt-10 flex flex-col gap-8">
      
      {/* Workspace Header */}
      <div className="w-full flex justify-between items-end mb-2">
        <div className="text-left">
          <h2 className="text-3xl font-bold uppercase tracking-wider text-zinc-100 font-geist">
            Script Enhancer
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Pipeline Stage 2 / Optimizing semantic structure
          </p>
        </div>
        <div className="flex gap-4 text-[10px] font-mono text-zinc-500 pb-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Tokens Used: <strong className="text-zinc-300">4,209</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>Model: <strong className="text-zinc-300">Neuro-7B-Instruct</strong></span>
          </div>
        </div>
      </div>
 
      {/* Script Review Panel */}
      <div className="glass-panel-heavy p-10 sm:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-50 h-50 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Top toolbar */}
        <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4 text-zinc-500">
          <div className="flex items-center gap-4">
            <button className="hover:text-zinc-300 transition"><Undo className="w-4 h-4" /></button>
            <button className="hover:text-zinc-300 transition"><Redo className="w-4 h-4" /></button>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-[10px] font-mono flex items-center gap-1.5 text-primary">
              <Check className={`w-3 h-3 text-primary ${isSaving ? 'opacity-50' : 'opacity-100'}`} />
              {isSaving ? "Saving..." : "Auto-saved"}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
            Target Length: <strong className="text-primary">60s</strong>
          </span>
        </div>
 
        {/* Narrative segments inputs with timeline */}
        <div className="space-y-4 text-left">
          
          {/* HOOK block */}
          <div className="terminal-pane p-3.5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className={`absolute left-0 top-0 w-1 bg-success h-full ${isSaving ? 'animate-data-stream' : 'opacity-0'}`} />
            <div className="flex justify-between items-center text-[10px] text-zinc-550 uppercase tracking-widest font-bold mb-2">
              <span className="text-zinc-300 flex items-center gap-1.5 group-hover:text-primary transition-colors">
                <Compass className="w-4 h-4 text-primary animate-pulse" />
                [SYS_HOOK_SEGMENT]
              </span>
              <span className="text-zinc-500 bg-zinc-950/60 px-2 py-0.5 rounded border border-white/5">0:00 - 0:05</span>
            </div>
            <input
              type="text"
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none focus:text-primary caret-primary transition-all duration-300 font-mono"
            />
          </div>
 
          {/* BODY block */}
          <div className="terminal-pane p-3.5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className={`absolute left-0 top-0 w-1 bg-success h-full ${isSaving ? 'animate-data-stream' : 'opacity-0'}`} />
            <div className="flex justify-between items-center text-[10px] text-zinc-550 uppercase tracking-widest font-bold mb-2">
              <span className="text-zinc-300 flex items-center gap-1.5 group-hover:text-primary transition-colors">
                <AlignLeft className="w-4 h-4 text-zinc-400" />
                [SYS_BODY_NARRATIVE]
              </span>
              <span className="text-zinc-500 bg-zinc-950/60 px-2 py-0.5 rounded border border-white/5">0:05 - 0:45</span>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full h-20 bg-transparent text-sm text-zinc-200 focus:outline-none focus:text-primary caret-primary resize-none leading-relaxed transition-all duration-300 font-mono"
            />
          </div>
 
          {/* CALL TO ACTION block */}
          <div className="terminal-pane p-3.5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className={`absolute left-0 top-0 w-1 bg-success h-full ${isSaving ? 'animate-data-stream' : 'opacity-0'}`} />
            <div className="flex justify-between items-center text-[10px] text-zinc-550 uppercase tracking-widest font-bold mb-2">
              <span className="text-zinc-300 flex items-center gap-1.5 group-hover:text-primary transition-colors">
                <Megaphone className="w-4 h-4 text-zinc-400" />
                [SYS_CALL_TO_ACTION]
              </span>
              <span className="text-zinc-500 bg-zinc-950/60 px-2 py-0.5 rounded border border-white/5">0:45 - 1:00</span>
            </div>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none focus:text-primary caret-primary transition-all duration-300 font-mono"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex h-10 justify-between items-center border-t border-white/5 pt-5">
          <button
            onClick={onBackStep}
            className="flex items-center gap-2  h-6  btn-secondary text-sm rounded transition active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-4 h-6 ">
            <button
              onClick={handleRegenScript}
              disabled={isRegenerating}
              className="flex items-center gap-2.5 px-6 py-3.5 btn-secondary text-sm rounded transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Regenerating..." : "Regenerate Script"}
            </button>

            <button
              onClick={handleSaveAndApprove}
              disabled={pipelineState === "running"}
              className="flex items-center gap-2 px-8 py-3.5 btn-primary text-sm rounded transition duration-200 active:scale-[0.98] disabled:opacity-40"
            >
              {pipelineState === "running" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <span>Approve & Proceed to Storyboard</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5px] text-black" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
