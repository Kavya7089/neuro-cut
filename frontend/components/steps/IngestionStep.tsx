"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, ShieldCheck, ShieldAlert, Play, Sparkles, AlertTriangle, RefreshCw, Paintbrush, Box, Film, ArrowRight, Check
} from "lucide-react";

interface IngestionStepProps {
  scriptText: string;
  setScriptText: (text: string) => void;
  selectedArtStyle: string;
  setSelectedArtStyle: (style: string) => void;
  onStartWorkflow: () => void;
  pipelineState: "idle" | "running" | "gate1_script" | "gate2_storyboard" | "gate3_assets" | "synthesizing" | "completed";
  moderationState: "idle" | "analyzing" | "safe" | "violation";
  safetyReport: any;
}

const ART_STYLES = [
  { id: "ghibli", name: "STUDIO GHIBLI", icon: Paintbrush },
  { id: "pixar", name: "3D PIXAR", icon: Box },
  { id: "cinematic", name: "CINEMATIC", icon: Film }
];

export default function IngestionStep({
  scriptText,
  setScriptText,
  selectedArtStyle,
  setSelectedArtStyle,
  onStartWorkflow,
  pipelineState,
  moderationState,
  safetyReport,
}: IngestionStepProps) {

  const charCount = scriptText.length;

  return (
    <motion.div
      initial={{ y: 40, x: 20, opacity: 0 }}
      animate={{ y: 0, x: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="w-full max-w-2xl mx-auto mt-8 flex flex-col gap-6 "
    >
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-6">
        <div>
          <span className="step-badge mb-2">Step 1 of 5</span>
          <h2 className="text-2xl font-bold text-zinc-100 font-geist mt-2">Ingestion & Setup</h2>
          <p className="text-sm text-zinc-500 mt-1">Provide raw script data to initialize the production pipeline.</p>
        </div>
      </div>

      {/* Centered Ingestion Panel */}
      <div className="glass-panel-heavy sm:p-12 relative overflow-hidden text-left p-10">
        <div className="absolute top-0 right-0 p-30 w-50 h-60 bg-gradient-to-br from-cyan-700/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Script Review Textarea */}
        <div className="relative space-y-2.5 bg-black/20 p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors duration-300">
          <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">
            RAW CONTENT PAYLOAD
          </span>
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            disabled={pipelineState === "running"}
            placeholder="Paste your script, article, or prompt here..."
            className="w-full h-40 px-5 py-4  bg-zinc-950/75 border border-white/10 hover:border-white/20 rounded-xl focus:outline-none focus:border-primary/50 focus:bg-black/90 focus:shadow-[0_0_20px_rgba(6,182,212,0.12)] text-zinc-200 placeholder-zinc-700 resize-none transition-all duration-300 text-sm leading-relaxed caret-[#06b6d4]"
          />
          <div className="absolute bottom-6 right-8 text-[10px] text-zinc-500 font-mono">
            {charCount} / 2000 characters
          </div>
        </div>

        {/* Art style selector */}
        <div className="mt-6 text-left">
          <span className="text-[9px] font-mono text-zinc-500 block uppercase mb-3 font-bold tracking-wider">
            VISUAL SYNTHESIS THEME
          </span>
          <div className="grid grid-cols-3 gap-4">
            {ART_STYLES.map((style) => {
              const isSelected = selectedArtStyle === style.id;
              const IconComp = style.icon;
              
              // Custom colors & visual glows based on the art style selections
              const getStyleThemeClasses = () => {
                if (style.id === "ghibli") {
                  return isSelected 
                    ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-400 neon-emerald-glow pulsing-dot-emerald"
                    : "border-white/10 bg-zinc-950/40 text-zinc-500 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-950/10";
                } else if (style.id === "pixar") {
                  return isSelected
                    ? "border-cyan-500/50 bg-cyan-950/20 text-gray-800 neon-cyan-glow pulsing-dot"
                    : "border-white/10 bg-zinc-950/40 text-zinc-500 hover:border-cyan-500/30 hover:text-cyan-400 hover:bg-cyan-950/10";
                } else {
                  return isSelected
                    ? "border-amber-500/50 bg-amber-950/20 text-amber-400 neon-amber-glow pulsing-dot-amber"
                    : "border-white/10 bg-zinc-950/40 text-zinc-500 hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-950/10";
                }
              };

              return (
                <div
                  key={style.id}
                  onClick={() => {
                    if (pipelineState === "idle") {
                      setSelectedArtStyle(style.id);
                    }
                  }}
                  className={`relative p-4 rounded-xl border backdrop-blur-md text-center cursor-pointer transition-all duration-500 select-none flex flex-col items-center justify-center min-h-[90px] hover:scale-[1.03] active:scale-[0.97] ${getStyleThemeClasses()}`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-current flex items-center justify-center shadow-md">
                      <Check className="w-2.5 h-2.5 text-[#020204] stroke-[3.5px]" />
                    </div>
                  )}
                  <IconComp className="w-5 h-5 mb-2 transition-transform duration-350" />
                  <span className="text-[9px] font-bold tracking-wider font-mono">
                    {style.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Warning if violation */}
        {moderationState === "violation" && safetyReport && (
          <div className="mt-8 bg-rose-950/20 border border-rose-500/20 p-5 rounded text-left text-rose-400 text-xs">
            <div className="flex items-center gap-2 font-bold mb-2 font-geist">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Azure Content safety intercept: Compliance violation</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Prompt exceeds policy guidelines (Violence/Hate triggers indexed at {(safetyReport.azure_safety_index*10).toFixed(0)}/10). Correct the script to deploy the state timeline.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-white/6 pt-5">
          <button
            onClick={onStartWorkflow}
            disabled={pipelineState === "running" || !scriptText.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 btn-primary transition duration-200 active:scale-[0.98] disabled:opacity-40 text-sm rounded-xl"
          >
            {pipelineState === "running" ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-black" />
                Initializing Pipeline...
              </>
            ) : (
              <>
                Initialize Pipeline
                <ArrowRight className="w-5 h-5 text-black" />
              </>
            )}
          </button>
        </div>

      </div>

    </motion.div>
  );
}
