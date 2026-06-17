"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Film, Check, ArrowLeft, ArrowRight, RefreshCw, Camera, Clock, Edit, Image as ImageIcon
} from "lucide-react";

interface StoryboardScene {
  timestamp_start: number;
  timestamp_end: number;
  script_segment: string;
  camera_movement: string;
  style_prompt_override: string;
}

interface DirectorStepProps {
  storyboardData: StoryboardScene[];
  setStoryboardData: (data: StoryboardScene[]) => void;
  onApproveGate2: () => void;
  onBackStep: () => void;
  pipelineState: "idle" | "running" | "gate1_script" | "gate2_storyboard" | "gate3_assets" | "synthesizing" | "completed";
}

export default function DirectorStep({
  storyboardData,
  setStoryboardData,
  onApproveGate2,
  onBackStep,
  pipelineState,
}: DirectorStepProps) {

  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  const handleScenePromptChange = (idx: number, text: string) => {
    const next = [...storyboardData];
    next[idx].style_prompt_override = text;
    setStoryboardData(next);
  };

  const handleSceneScriptChange = (idx: number, text: string) => {
    const next = [...storyboardData];
    next[idx].script_segment = text;
    setStoryboardData(next);
  };

  const handleCameraChange = (idx: number, movement: string) => {
    const next = [...storyboardData];
    next[idx].camera_movement = movement;
    setStoryboardData(next);
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-10 flex flex-col gap-8">
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-6">
        <div>
          <span className="step-badge mb-2">Step 3 of 5</span>
          <h2 className="text-2xl font-bold text-zinc-100 font-geist mt-2">Storyboard Director</h2>
          <p className="text-sm text-zinc-500 mt-1">Review scenes, adjust camera moves, and edit visual prompts</p>
        </div>
        <div className="flex gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 bg-white/4 border border-white/6 px-3 py-1.5 rounded-lg text-emerald-400">
             <Check className="w-3.5 h-3.5" />
             <span>{storyboardData.length} Scenes Generated</span>
          </div>
        </div>
      </div>

      {/* Storyboard Container Panel */}
      <div className="glass-panel-heavy p-8 sm:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Storyboard Scenes Grid */}
        <div className="flex flex-row gap-5 overflow-x-auto pb-5 pt-2 text-left scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {storyboardData.map((scene, idx) => {
            const isActive = idx === activeSceneIdx;
            return (
              <motion.div
                key={idx}
                onClick={() => setActiveSceneIdx(idx)}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
                className={`w-[300px] shrink-0 border rounded-xl p-4.5 space-y-4 relative flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? "border-primary neon-cyan-glow bg-zinc-900/60" 
                    : "border-white/10 hover:border-primary/40 bg-zinc-950/40 hover:bg-zinc-900/50 glass-panel"
                }`}
              >
                
                {/* Header timings */}
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className={`text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                    isActive ? "text-primary animate-pulse" : "text-zinc-400"
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    SCENE 0{idx+1} ({scene.timestamp_start.toFixed(1)}s - {scene.timestamp_end.toFixed(1)}s)
                  </span>
                  
                  {/* Camera easing selectors */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Camera className="w-3.5 h-3.5 text-zinc-550" />
                    <select
                      value={scene.camera_movement}
                      onChange={(e) => handleCameraChange(idx, e.target.value)}
                      className="bg-black/60 border border-white/10 text-[10px] font-mono rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                    >
                      <option value="ease_in_zoom">ease_in_zoom</option>
                      <option value="exponential_pan">exponential_pan</option>
                      <option value="tilt_shake">tilt_shake</option>
                      <option value="dolly">dolly</option>
                    </select>
                  </div>
                </div>

                {/* Thumbnail / Frame Preview Placeholder */}
                <div className={`relative aspect-video w-full rounded-xl border overflow-hidden ${
                  isActive 
                    ? "border-primary/40 neon-cyan-glow bg-zinc-950" 
                    : "border-white/5 bg-zinc-950"
                } flex flex-col items-center justify-center`}>
                  {/* Shimmer Loading Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse bg-[length:200%_100%]" />
                  <img 
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/v1/image?prompt=${encodeURIComponent((scene.style_prompt_override || scene.script_segment || "watercolor cinematic Tech"))}`} 
                    alt={`Scene ${idx + 1}`}
                    className={`w-full h-full object-cover transition-all duration-500 relative z-10 ${
                      isActive ? "scale-105 opacity-100" : "opacity-60 hover:opacity-85 hover:scale-105"
                    }`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />
                  
                  {isActive ? (
                    <div className="absolute top-2 right-2 bg-primary/80 border border-primary text-black text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                      Visual Prompt (Editing)
                    </div>
                  ) : (
                    <div className="absolute bottom-2 left-2 text-[9px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded border border-white/5">
                      Ready to Forge
                    </div>
                  )}
                </div>

                {/* Text voiceover inputs */}
                <div className="space-y-2.5 flex-1 mt-4" onClick={(e) => e.stopPropagation()}>
                  <label className="text-[9px] font-mono text-zinc-555 uppercase block font-bold tracking-wider">
                    Voiceover Segment Text
                  </label>
                  <input
                    type="text"
                    value={scene.script_segment}
                    onChange={(e) => handleSceneScriptChange(idx, e.target.value)}
                    className="w-full glass-input text-sm py-2 px-3 focus:outline-none"
                  />
                </div>

                {/* Visual Prompt Inputs */}
                <div className="space-y-2.5 mt-4" onClick={(e) => e.stopPropagation()}>
                  <label className="text-[9px] font-mono text-zinc-555 uppercase block font-bold tracking-wider">
                    AI Visual Prompt override
                  </label>
                  <textarea
                    value={scene.style_prompt_override}
                    onChange={(e) => handleScenePromptChange(idx, e.target.value)}
                    className="w-full h-16 glass-input text-sm py-2 px-3 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/5 pt-5">
          <button
            onClick={onBackStep}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 btn-secondary text-sm rounded-xl transition active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={onApproveGate2}
            disabled={pipelineState === "running"}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 btn-primary text-sm rounded-xl transition duration-200 active:scale-[0.98] disabled:opacity-40"
          >
            {pipelineState === "running" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                Compiling...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5px] text-black" />
                Approve & Forge Assets
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
