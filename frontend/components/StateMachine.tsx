"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, Circle, AlertCircle, RefreshCw, 
  ArrowRight, Edit3, FileCode, ImageIcon, Video, ShieldCheck
} from "lucide-react";

interface StoryboardScene {
  timestamp_start: number;
  timestamp_end: number;
  script_segment: string;
  camera_movement: string;
  style_prompt_override: string;
}

interface AssetItem {
  id: number;
  prompt: string;
  regenerating: boolean;
}

interface StateMachineProps {
  pipelineState: "idle" | "running" | "gate1_script" | "gate2_storyboard" | "gate3_assets" | "synthesizing" | "completed";
  scriptGateData: { hook: string; body: string };
  setScriptGateData: (data: { hook: string; body: string }) => void;
  storyboardData: StoryboardScene[];
  setStoryboardData: (data: StoryboardScene[]) => void;
  assetImages: AssetItem[];
  onRegenerateAsset: (id: number) => void;
  onApproveGate1: () => void;
  onApproveGate2: () => void;
  onApproveGate3: () => void;
  selectedArtStyle: string;
}

export default function StateMachine({
  pipelineState,
  scriptGateData,
  setScriptGateData,
  storyboardData,
  setStoryboardData,
  assetImages,
  onRegenerateAsset,
  onApproveGate1,
  onApproveGate2,
  onApproveGate3,
  selectedArtStyle,
}: StateMachineProps) {
  
  // Custom hook and body text editor states
  const [hookText, setHookText] = useState(scriptGateData.hook);
  const [bodyText, setBodyText] = useState(scriptGateData.body);

  useEffect(() => {
    setHookText(scriptGateData.hook);
    setBodyText(scriptGateData.body);
  }, [scriptGateData]);

  // Determine individual LangGraph node state
  const getNodeStatus = (nodeIndex: number) => {
    switch (pipelineState) {
      case "idle":
        return "idle";
      case "running":
        if (nodeIndex === 0) return "processing";
        return "idle";
      case "gate1_script":
        if (nodeIndex === 0) return "completed";
        if (nodeIndex === 1) return "awaiting_approval";
        return "idle";
      case "gate2_storyboard":
        if (nodeIndex <= 1) return "completed";
        if (nodeIndex === 2) return "awaiting_approval";
        return "idle";
      case "gate3_assets":
        if (nodeIndex <= 2) return "completed";
        if (nodeIndex === 3) return "awaiting_approval";
        return "idle";
      case "synthesizing":
        if (nodeIndex <= 3) return "completed";
        if (nodeIndex === 4) return "processing";
        return "idle";
      case "completed":
        return "completed";
      default:
        return "idle";
    }
  };

  const statusStyles = {
    idle: {
      border: "border-zinc-800 bg-zinc-950/60 text-zinc-600",
      icon: <Circle className="w-5 h-5" />,
      glow: ""
    },
    processing: {
      border: "border-cyan-500 bg-cyan-950/30 text-cyan-400 neon-border-cyan animate-pulse",
      icon: <RefreshCw className="w-5 h-5 animate-spin" />,
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.25)]"
    },
    awaiting_approval: {
      border: "border-purple-500 bg-purple-950/30 text-purple-400 neon-border-purple",
      icon: <AlertCircle className="w-5 h-5 text-purple-400 animate-bounce" />,
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.35)]"
    },
    completed: {
      border: "border-emerald-500 bg-emerald-950/20 text-emerald-400",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />,
      glow: ""
    }
  };

  const getStyleGradient = (styleId: string) => {
    const gradients: Record<string, string> = {
      ghibli: "from-emerald-500 to-teal-800",
      pixar: "from-blue-600 to-indigo-800",
      cinematic: "from-amber-600 to-rose-900",
      noir: "from-zinc-700 to-zinc-950"
    };
    return gradients[styleId] || "from-cyan-600 to-purple-800";
  };

  return (
    <div className="flex flex-col gap-6 w-full lg:max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
      
      {/* Node workflow header */}
      <div className="glass-panel p-4 flex justify-between items-center border-white/5">
        <div>
          <span className="text-[9px] font-mono text-zinc-500 block uppercase">
            LangGraph Router Core
          </span>
          <span className="text-xs font-bold text-zinc-300">
            {pipelineState === "idle" && "Workflow Engine Offline. Ingest a script."}
            {pipelineState === "running" && "Node 0: Safety firewall scanning compliance parameters..."}
            {pipelineState === "gate1_script" && "Node 1: Hook script enhancement paused for review."}
            {pipelineState === "gate2_storyboard" && "Node 2: JSON Storyboard metadata paused for review."}
            {pipelineState === "gate3_assets" && "Node 3: Frame visual assets paused for approval."}
            {pipelineState === "synthesizing" && "Node 4: Programmatic FFmpeg timeline assembling active..."}
            {pipelineState === "completed" && "Video pipeline completed and cached in checkpointer."}
          </span>
        </div>
        <span className="text-[9px] font-mono bg-zinc-950 border border-white/5 px-2 py-0.5 rounded text-cyan-400">
          Redis checkpoint: active
        </span>
      </div>

      {/* Stateful vertical graph timeline */}
      <div className="relative pl-7 space-y-6">
        
        {/* Animated connection path line */}
        <div className="absolute left-[18px] top-6 bottom-6 w-[2px] bg-zinc-800">
          {pipelineState !== "idle" && (
            <div 
              className="absolute top-0 w-full bg-gradient-to-b from-cyan-400 via-purple-500 to-emerald-400 transition-all duration-700"
              style={{
                height: 
                  pipelineState === "running" ? "10%" :
                  pipelineState === "gate1_script" ? "25%" :
                  pipelineState === "gate2_storyboard" ? "50%" :
                  pipelineState === "gate3_assets" ? "75%" : "100%"
              }}
            />
          )}
        </div>

        {/* Node 0: Ingestion Firewall (Azure Safety Score check) */}
        <div className="relative">
          <div className="absolute -left-[28px] top-0 z-10">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${statusStyles[getNodeStatus(0)].border} ${statusStyles[getNodeStatus(0)].glow}`}>
              {statusStyles[getNodeStatus(0)].icon}
            </div>
          </div>

          <div className="glass-panel p-4 border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 block">NODE 0 — FIREWALL</span>
                <h4 className="text-xs font-black text-zinc-300">Ingestion Content Security Gateway</h4>
              </div>
              <ShieldCheck className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
        </div>

        {/* Node 1: Hook Analyzer Agent (AI Script correction) */}
        <div className="relative">
          <div className="absolute -left-[28px] top-0 z-10">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${statusStyles[getNodeStatus(1)].border} ${statusStyles[getNodeStatus(1)].glow}`}>
              {statusStyles[getNodeStatus(1)].icon}
            </div>
          </div>

          <div className="glass-panel p-4 border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 block">NODE 1 — SCRIPT ENHANCER</span>
                <h4 className="text-xs font-black text-zinc-300">Hook & Emotional Narrative Analyzer</h4>
              </div>
              <Edit3 className="w-4 h-4 text-zinc-500" />
            </div>

            {/* Expandable HITL Script approval Gate */}
            <AnimatePresence>
              {pipelineState === "gate1_script" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 border-t border-purple-500/20 pt-4 overflow-hidden"
                >
                  <div className="bg-purple-950/15 border border-purple-900/20 p-3.5 rounded-xl space-y-3">
                    <div className="flex items-center gap-1 text-[11px] text-purple-400 font-bold">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Pausing at redis:checkpointer. Correct script segments below:</span>
                    </div>

                    <div className="space-y-3 text-left">
                      <div>
                        <span className="text-[9px] text-zinc-500 block mb-1 uppercase font-mono">Hook Segment (First 3s):</span>
                        <input
                          type="text"
                          value={hookText}
                          onChange={(e) => setHookText(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/30"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block mb-1 uppercase font-mono">Body Script segment:</span>
                        <textarea
                          value={bodyText}
                          onChange={(e) => setBodyText(e.target.value)}
                          className="w-full h-20 bg-zinc-950 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/30 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setScriptGateData({ hook: hookText, body: bodyText });
                          onApproveGate1();
                        }}
                        className="flex items-center gap-1.5 btn-primary text-xs px-4 py-2 rounded transition active:scale-[0.97]"
                      >
                        Approve Script Node
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Node 2: Director Agent (Storyboard Compiler) */}
        <div className="relative">
          <div className="absolute -left-[28px] top-0 z-10">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${statusStyles[getNodeStatus(2)].border} ${statusStyles[getNodeStatus(2)].glow}`}>
              {statusStyles[getNodeStatus(2)].icon}
            </div>
          </div>

          <div className="glass-panel p-4 border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 block">NODE 2 — DIRECTOR AGENT</span>
                <h4 className="text-xs font-black text-zinc-300">Pydantic Storyboard JSON Validator</h4>
              </div>
              <FileCode className="w-4 h-4 text-zinc-500" />
            </div>

            {/* Storyboard Approval Gate */}
            <AnimatePresence>
              {pipelineState === "gate2_storyboard" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 border-t border-purple-500/20 pt-4 overflow-hidden"
                >
                  <div className="bg-purple-950/15 border border-purple-900/20 p-3.5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-[11px] text-purple-400 font-bold">
                      <div className="flex items-center gap-1">
                        <FileCode className="w-3.5 h-3.5" />
                        <span>HITL: Storyboard JSON schema editor</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500">pydantic:validated</span>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {storyboardData.map((scene, idx) => (
                        <div key={idx} className="bg-zinc-950/70 border border-white/5 p-2 rounded-lg text-left space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-mono text-cyan-400">
                            <strong>Scene #{idx+1} ({scene.timestamp_start}s - {scene.timestamp_end}s)</strong>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[8px] text-zinc-600 block">Camera movement easing</span>
                              <input
                                type="text"
                                value={scene.camera_movement}
                                onChange={(e) => {
                                  const next = [...storyboardData];
                                  next[idx].camera_movement = e.target.value;
                                  setStoryboardData(next);
                                }}
                                className="w-full bg-zinc-900 border border-white/5 rounded px-2 py-0.5 text-[10px] text-zinc-300 focus:outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] text-zinc-600 block">Style prompt override</span>
                              <input
                                type="text"
                                value={scene.style_prompt_override}
                                onChange={(e) => {
                                  const next = [...storyboardData];
                                  next[idx].style_prompt_override = e.target.value;
                                  setStoryboardData(next);
                                }}
                                className="w-full bg-zinc-900 border border-white/5 rounded px-2 py-0.5 text-[10px] text-zinc-300 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-600 block">Script Segment voiceover text</span>
                            <input
                              type="text"
                              value={scene.script_segment}
                              onChange={(e) => {
                                const next = [...storyboardData];
                                next[idx].script_segment = e.target.value;
                                setStoryboardData(next);
                              }}
                              className="w-full bg-zinc-900 border border-white/5 rounded px-2 py-0.5 text-[10px] text-zinc-300 focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={onApproveGate2}
                        className="flex items-center gap-1.5 btn-primary text-xs px-4 py-2 rounded transition active:scale-[0.97]"
                      >
                        Approve Storyboard
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Node 3: Visualist Agent (Frame Generator Asset Forger) */}
        <div className="relative">
          <div className="absolute -left-[28px] top-0 z-10">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${statusStyles[getNodeStatus(3)].border} ${statusStyles[getNodeStatus(3)].glow}`}>
              {statusStyles[getNodeStatus(3)].icon}
            </div>
          </div>

          <div className="glass-panel p-4 border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 block">NODE 3 — VISUALIST</span>
                <h4 className="text-xs font-black text-zinc-300">Visualist: Frame & Asset Forger</h4>
              </div>
              <ImageIcon className="w-4 h-4 text-zinc-500" />
            </div>

            {/* Assets Approval Gate */}
            <AnimatePresence>
              {pipelineState === "gate3_assets" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 border-t border-purple-500/20 pt-4 overflow-hidden"
                >
                  <div className="bg-purple-950/15 border border-purple-900/20 p-3.5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-[11px] text-purple-400 font-bold">
                      <div className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>HITL: Generated Frame Asset reviewer</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500">SDXL:v2.1</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left">
                      {assetImages.map((asset) => (
                        <div key={asset.id} className="relative bg-zinc-950 border border-white/5 rounded-xl overflow-hidden group">
                          
                          {/* Rendering Vector Frame Previews */}
                          <div className="h-24 relative bg-zinc-900 overflow-hidden">
                            {asset.regenerating ? (
                              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                                <RefreshCw className="w-5 h-5 animate-spin text-purple-400 mb-1" />
                                <span className="text-[8px] font-mono text-purple-400">Forging Frame...</span>
                              </div>
                            ) : null}

                            {/* Stylised Vector overlays inside zero-gravity grid */}
                            <div className={`w-full h-full bg-gradient-to-tr ${getStyleGradient(selectedArtStyle)} relative flex flex-col justify-end p-2`}>
                              <div className="absolute inset-0 opacity-15">
                                <svg width="100%" height="100%">
                                  <line x1="0" y1="30" x2="100%" y2="70" stroke="white" strokeWidth="0.5" />
                                  <rect x="20%" y="20%" width="30" height="30" fill="none" stroke="white" strokeWidth="0.5" />
                                </svg>
                              </div>
                              <span className="bg-black/60 border border-white/5 text-[7px] font-mono text-zinc-400 px-1 py-0.5 rounded uppercase tracking-tighter">
                                Frame {asset.id} ({selectedArtStyle})
                              </span>
                            </div>

                          </div>

                          <div className="p-2 space-y-1.5">
                            <p className="text-[9px] text-zinc-500 line-clamp-2 leading-relaxed">
                              {asset.prompt}
                            </p>
                            <button
                              onClick={() => onRegenerateAsset(asset.id)}
                              disabled={asset.regenerating}
                              className="w-full flex items-center justify-center gap-1.5 btn-secondary text-[9px] py-1 rounded transition disabled:opacity-50"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              Regen Frame
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={onApproveGate3}
                        className="flex items-center gap-1.5 btn-primary text-xs px-4 py-2 rounded transition active:scale-[0.97]"
                      >
                        Approve Assets & Synthesise
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Node 4: MediaSynthesizer (FFmpeg Render) */}
        <div className="relative">
          <div className="absolute -left-[28px] top-0 z-10">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${statusStyles[getNodeStatus(4)].border} ${statusStyles[getNodeStatus(4)].glow}`}>
              {statusStyles[getNodeStatus(4)].icon}
            </div>
          </div>

          <div className="glass-panel p-4 border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 block">NODE 4 — MEDIA SYNTHESIS</span>
                <h4 className="text-xs font-black text-zinc-300">Synthesizer Programmatic FFmpeg Engine</h4>
              </div>
              <Video className="w-4 h-4 text-zinc-500" />
            </div>

            {pipelineState === "synthesizing" && (
              <div className="mt-4 space-y-2.5 border-t border-cyan-500/20 pt-3">
                <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400">
                  <span>Compiling SSML & aligning Whisper frames...</span>
                  <span className="font-bold">67% complete</span>
                </div>
                <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-[dash_2s_infinite]" style={{ width: "67%" }} />
                </div>
                <p className="text-[9px] text-zinc-500 font-mono leading-none">
                  [Celery task: calculating sigmoid camera scale matrices]
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
