"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, ShieldCheck, ShieldAlert, Cpu, 
  Sparkles, Play, RefreshCw, AlertTriangle, Info, Zap
} from "lucide-react";

interface AzureSafetyCategories {
  violence: number;
  hate: number;
  sexual: number;
  self_harm: number;
}

interface ControlHubProps {
  scriptText: string;
  setScriptText: (text: string) => void;
  selectedArtStyle: string;
  setSelectedArtStyle: (style: string) => void;
  pipelineState: "idle" | "running" | "gate1_script" | "gate2_storyboard" | "gate3_assets" | "synthesizing" | "completed";
  onStartWorkflow: () => void;
  safetyReport: {
    is_safe: boolean;
    categories: AzureSafetyCategories;
    azure_safety_index: number;
  } | null;
  moderationState: "idle" | "analyzing" | "safe" | "violation";
}

const ART_STYLES = [
  {
    id: "ghibli",
    name: "Studio Ghibli",
    desc: "Soft whimsical watercolor textures, lush hand-painted scenery.",
    colors: "from-emerald-500/20 to-teal-500/10 border-teal-500/20",
    badge: "Dreamy Paint"
  },
  {
    id: "pixar",
    name: "3D Pixar",
    desc: "Clean sub-surface scattering, plastic clay figures.",
    colors: "from-blue-500/20 to-cyan-500/10 border-blue-500/20",
    badge: "Octane 3D"
  },
  {
    id: "cinematic",
    name: "Cinematic Realism",
    desc: "Anamorphic lenses, hyper-detailed 8K lighting grids.",
    colors: "from-amber-500/20 to-orange-500/10 border-amber-500/20",
    badge: "Cinematic 8K"
  },
  {
    id: "noir",
    name: "Noir Sketching",
    desc: "High-contrast line art sketches, rich cross-hatches.",
    colors: "from-purple-500/20 to-pink-500/10 border-purple-500/20",
    badge: "Charcoal Ink"
  }
];

export default function ControlHub({
  scriptText,
  setScriptText,
  selectedArtStyle,
  setSelectedArtStyle,
  pipelineState,
  onStartWorkflow,
  safetyReport,
  moderationState,
}: ControlHubProps) {
  
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(scriptText.length);
  }, [scriptText]);

  // Map execution HUD states based on graph pipeline state
  const getHudStatus = () => {
    switch (pipelineState) {
      case "running":
        return {
          label: "Deploying Pipeline...",
          color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        };
      case "gate1_script":
      case "gate2_storyboard":
      case "gate3_assets":
        return {
          label: "Awaiting HITL Verification",
          color: "bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
        };
      case "synthesizing":
        return {
          label: "Synthesizing Render Engine...",
          color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
        };
      case "completed":
        return {
          label: "Compilation Complete",
          color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        };
      case "idle":
      default:
        return {
          label: "Pipeline Engine Ready",
          color: "bg-zinc-800/40 text-zinc-400 border-white/5",
          icon: <Zap className="w-3.5 h-3.5 text-zinc-500" />
        };
    }
  };

  const hud = getHudStatus();

  return (
    <div className="flex flex-col gap-6 w-full lg:max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
      
      {/* Script Ingestion Panel */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="glass-panel p-5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Script Ingestion Gateway
          </h2>
        </div>

        <textarea
          value={scriptText}
          onChange={(e) => {
            if (pipelineState === "idle" || pipelineState === "completed") {
              setScriptText(e.target.value);
            }
          }}
          disabled={pipelineState !== "idle" && pipelineState !== "completed"}
          placeholder="Enter raw scripts here to feed into Azure AI content firewalls..."
          className="w-full h-36 px-3.5 py-2.5 text-xs bg-zinc-950/50 border border-white/5 rounded-xl focus:outline-none focus:border-cyan-500/30 text-zinc-200 placeholder-zinc-700 resize-none transition-all duration-300"
        />

        <div className="flex justify-between items-center mt-3">
          <span className="text-[10px] text-zinc-500 font-mono">
            {charCount} / 2000 characters
          </span>
          
          <button
            onClick={onStartWorkflow}
            disabled={(pipelineState !== "idle" && pipelineState !== "completed") || !scriptText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black shadow-lg shadow-cyan-500/15 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            Ingest Script
          </button>
        </div>
      </motion.div>

      {/* Execution HUD Module */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`glass-panel p-4 border text-left flex items-center justify-between transition-all duration-300 ${hud.color}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black/40 rounded-lg border border-white/5">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 block uppercase">
              Execution HUD Gateway
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
              {hud.label}
            </span>
          </div>
        </div>
        {hud.icon}
      </motion.div>

      {/* Theme Style Engine Grid Selector */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Agent 3 Theme Selection Engine
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {ART_STYLES.map((style) => {
            const isSelected = selectedArtStyle === style.id;
            return (
              <motion.div
                key={style.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (pipelineState === "idle" || pipelineState === "completed") {
                    setSelectedArtStyle(style.id);
                  }
                }}
                className={`glass-panel p-3.5 border text-left cursor-pointer transition-all duration-300 relative select-none ${
                  isSelected 
                    ? "neon-border-cyan bg-cyan-950/20 border-cyan-500/40" 
                    : "border-white/5 hover:border-white/20"
                }`}
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none rounded-xl" />
                )}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-mono font-black text-zinc-500 uppercase">
                    {style.badge}
                  </span>
                  {isSelected && (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  )}
                </div>
                <h4 className={`text-xs font-black mb-1 ${isSelected ? "text-cyan-400" : "text-zinc-200"}`}>
                  {style.name}
                </h4>
                <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2">
                  {style.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Azure Content Safety Monitor */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`glass-panel p-5 border relative overflow-hidden transition-all duration-500 ${
          moderationState === "violation" 
            ? "border-rose-500/30 bg-rose-500/5 text-rose-400" 
            : moderationState === "safe"
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
            : "border-zinc-800 bg-zinc-950/60 text-zinc-400"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold bg-black/60 px-2 py-0.5 rounded border border-white/10">
              AGENT 0 FIREWALL
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Azure Content Safety
            </h3>
          </div>
          
          {moderationState === "analyzing" ? (
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          ) : moderationState === "safe" ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : moderationState === "violation" ? (
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          ) : (
            <Info className="w-4 h-4 text-zinc-500" />
          )}
        </div>

        {moderationState === "idle" && (
          <div className="text-center py-2">
            <p className="text-xs text-zinc-500">
              Ingest a script to trigger Azure Content Safety radar scan.
            </p>
          </div>
        )}

        {moderationState === "analyzing" && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-cyan-400 animate-pulse">Scanning script triggers...</h4>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Forwarding script payload to Azure Cognitive Services Content API gateway...
            </p>
          </div>
        )}

        {(moderationState === "safe" || moderationState === "violation") && safetyReport && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>Safety Rating Score:</span>
              <span className={`font-mono ${safetyReport.is_safe ? "text-emerald-400" : "text-rose-400"}`}>
                {(safetyReport.azure_safety_index * 100).toFixed(0)}% Threat Index
              </span>
            </div>

            {/* Visual threat scores radars */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              {[
                { label: "Violence & Harassment", score: safetyReport.categories.violence },
                { label: "Hate Speech Categories", score: safetyReport.categories.hate },
                { label: "Sexual Severity Index", score: safetyReport.categories.sexual },
                { label: "Self-Harm Indicators", score: safetyReport.categories.self_harm }
              ].map((cat) => (
                <div key={cat.label} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                    <span>{cat.label}</span>
                    <span>{cat.score} / 10</span>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        cat.score >= 7 ? "bg-rose-500" : cat.score >= 4 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${cat.score * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {!safetyReport.is_safe && (
              <div className="mt-3 bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-lg text-[10px] leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 inline mr-1 -mt-0.5" />
                <strong>Compliance violation alert:</strong> Script contents exceed Azure Safety firewall indices (threshold: 7/10 max). Prompt refinement required.
              </div>
            )}
          </div>
        )}
      </motion.div>
      
    </div>
  );
}
