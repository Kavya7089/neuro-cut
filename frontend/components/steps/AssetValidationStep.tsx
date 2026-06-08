"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ImageIcon, Check, ArrowLeft, RefreshCw, Sparkles, Cpu, Film, Copy, Edit3, X
} from "lucide-react";

interface AssetItem {
  id: number;
  prompt: string;
  regenerating: boolean;
  seed?: number;
}

interface AssetValidationStepProps {
  assetImages: AssetItem[];
  onRegenerateAsset: (id: number) => void;
  onApproveGate3: () => void;
  onBackStep: () => void;
  pipelineState: "idle" | "running" | "gate1_script" | "gate2_storyboard" | "gate3_assets" | "synthesizing" | "completed";
  selectedArtStyle: string;
  onUpdateAssetPrompt?: (id: number, newPrompt: string) => void;
  loadedUrls: Record<number, string>;
  setLoadedUrls: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}

export default function AssetValidationStep({
  assetImages,
  onRegenerateAsset,
  onApproveGate3,
  onBackStep,
  pipelineState,
  selectedArtStyle,
  onUpdateAssetPrompt,
  loadedUrls,
  setLoadedUrls,
}: AssetValidationStepProps) {

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
  const [failedStates, setFailedStates] = useState<Record<number, boolean>>({});
  const loadedRef = useRef<Record<number, { url: string, blobUrl: string }>>({});

  useEffect(() => {
    let active = true;
    
    async function loadImagesSequentially() {
      for (const asset of assetImages) {
        if (!active) break;
        
        // Use a prompt that includes the seed to ensure cache busting when seed changes
        const seedValue = encodeURIComponent(asset.prompt) + (asset.seed ? asset.seed : '');
        // Use our new backend proxy that uses g4f to fetch real images
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/v1/image?prompt=${encodeURIComponent(asset.prompt)}`;
        
        // If this exact URL is already loaded and is valid, skip
        if (loadedRef.current[asset.id] && loadedRef.current[asset.id].url === url) {
          setLoadedUrls(prev => {
            if (prev[asset.id] === loadedRef.current[asset.id].blobUrl) return prev;
            return { ...prev, [asset.id]: loadedRef.current[asset.id].blobUrl };
          });
          continue;
        }
        
        setLoadingStates(prev => ({ ...prev, [asset.id]: true }));
        setFailedStates(prev => ({ ...prev, [asset.id]: false }));
        
        let success = false;
        let retries = 3;
        let blobUrl = "";
        
        while (retries > 0 && !success && active) {
          try {
            const response = await fetch(url);
            if (response.status === 200) {
              const blob = await response.blob();
              blobUrl = URL.createObjectURL(blob);
              success = true;
            } else if (response.status === 402) {
              console.warn(`Rate limited (402) for asset ${asset.id}, waiting and retrying...`);
              await new Promise(resolve => setTimeout(resolve, 1500));
              retries--;
            } else {
              console.error(`Error loading asset ${asset.id}: status ${response.status}`);
              break;
            }
          } catch (err) {
            console.error(`Fetch failed for asset ${asset.id}:`, err);
            await new Promise(resolve => setTimeout(resolve, 1500));
            retries--;
          }
        }
        
        if (!active) {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          break;
        }
        
        setLoadingStates(prev => ({ ...prev, [asset.id]: false }));
        
        if (success && blobUrl) {
          // Revoke old blob URL for this asset if it exists
          if (loadedRef.current[asset.id]) {
            URL.revokeObjectURL(loadedRef.current[asset.id].blobUrl);
          }
          
          loadedRef.current[asset.id] = { url, blobUrl };
          setLoadedUrls(prev => ({ ...prev, [asset.id]: blobUrl }));
          setFailedStates(prev => ({ ...prev, [asset.id]: false }));
        } else {
          setFailedStates(prev => ({ ...prev, [asset.id]: true }));
        }
      }
    }
    
    loadImagesSequentially();
    
    return () => {
      active = false;
    };
  }, [assetImages]);



  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStyleGradient = (styleId: string) => {
    switch (styleId) {
      case "ghibli":
        return "from-emerald-500/20 via-teal-800/10 to-emerald-900/40 border-teal-500/20";
      case "pixar":
        return "from-blue-600/20 via-indigo-800/10 to-blue-900/40 border-blue-500/20";
      case "cinematic":
        return "from-amber-600/20 via-rose-900/10 to-orange-950/40 border-amber-500/20";
      case "noir":
      default:
        return "from-zinc-700/20 via-zinc-900/10 to-zinc-950/40 border-white/10";
    }
  };

  const getStyleLabel = (styleId: string) => {
    const labels: Record<string, string> = {
      ghibli: "Ghibli Paint",
      pixar: "Pixar 3D",
      cinematic: "Cinematic 8K",
      noir: "Charcoal Ink"
    };
    return labels[styleId] || "SDXL";
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-10 flex flex-col gap-8">
      
      {/* Celery Asynchronous Rendering Full Screen Loader Overlay */}
      <AnimatePresence>
        {pipelineState === "synthesizing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="p-4 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-full mb-6 shadow-lg shadow-cyan-500/15"
            >
              <Cpu className="w-8 h-8 text-black" />
            </motion.div>

            <h3 className="text-lg font-mono font-black uppercase tracking-widest text-cyan-400">
              Agent 4: Media Synthesis Engine
            </h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-md leading-relaxed">
              Celery workers active. Compiling SSML breath intervals, aligning Whisper timings, and applying ease-in camera matrices with FFmpeg.
            </p>

            {/* Simulated Progress bar */}
            <div className="w-full max-w-md mt-6 space-y-2">
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.0, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400" 
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                <span>Task ID: celery-ffmpeg-ae809</span>
                <span>Traversing...</span>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Asset Validation Panel */}
      <div className="glass-panel-heavy p-8 sm:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col items-center text-center gap-1.5 mb-4">
          <div className="p-3.5 rounded bg-primary/10 border border-primary/20 text-primary">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-zinc-200 font-geist">
            Agent 3: Asset Validation Forger
          </h2>
          <p className="text-xs text-zinc-500 max-w-md">
            Review and validate AI visual assets (Human-in-the-Loop Gate 3). Hover over any frame to regenerate or fix assets individually.
          </p>
        </div>

        {/* Grid display of frame thumbnails with visual prompts aligned below */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-left">
          {assetImages.map((asset) => {
            const isEditing = editingId === asset.id;
            const isCopied = copiedId === asset.id;

            return (
              <div 
                key={asset.id} 
                className={`glass-panel p-3 flex flex-col gap-3 shadow-xl transition-all duration-300 group animate-fade-in ${
                  isEditing ? "border-primary/50 neon-cyan-glow" : "border-white/10 hover:border-primary/30"
                }`}
              >
                {/* Asset Image/Thumbnail Card */}
                <div 
                  className={`relative rounded-xl border overflow-hidden bg-zinc-950 flex flex-col justify-between aspect-video ${getStyleGradient(selectedArtStyle)}`}
                >
                  
                  {/* Asset Frame Proxy */}
                  <div className="relative w-full h-full bg-zinc-900/60 overflow-hidden flex items-center justify-center">
                    {/* Shimmer Loading Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse bg-[length:200%_100%]" />
                    {asset.regenerating || loadingStates[asset.id] ? (
                      <div className="absolute inset-0 bg-black/85 z-20 flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
                        <span className="text-[9px] font-mono text-cyan-400">
                          {asset.regenerating ? "Regenerating..." : "Forging Asset..."}
                        </span>
                      </div>
                    ) : loadedUrls[asset.id] ? (
                      <img 
                        src={loadedUrls[asset.id]} 
                        alt={`Frame ${asset.id}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
                      />
                    ) : failedStates[asset.id] ? (
                      <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-4 text-center z-10">
                        <span className="text-[10px] text-zinc-550 font-mono mb-1 font-bold">Failed to load</span>
                        <span className="text-[8px] text-zinc-650 font-mono leading-tight">IP limit hit. Hover to retry.</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-4 text-center z-10">
                        <RefreshCw className="w-4 h-4 text-zinc-700 mb-1 animate-pulse" />
                        <span className="text-[9px] text-zinc-600 font-mono">Queueing frame request...</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                    {/* Styled details layout overlay on top of the image */}
                    <div className="w-full h-full p-4 flex flex-col justify-between relative z-10 pointer-events-none">
                      <span className="self-start text-[8px] font-mono bg-black/60 border border-white/10 text-zinc-350 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        FRAME 0{asset.id}
                      </span>

                      <span className="self-end text-[8px] font-mono text-primary tracking-widest uppercase bg-black/60 px-2 py-0.5 rounded border border-primary/20 font-bold">
                        {getStyleLabel(selectedArtStyle)}
                      </span>
                    </div>

                    {/* Hover overlay button */}
                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center z-20 pointer-events-none group-hover:pointer-events-auto">
                      <button
                        onClick={() => onRegenerateAsset(asset.id)}
                        disabled={asset.regenerating}
                        className="flex items-center gap-1.5 btn-primary text-xs px-4 py-2 rounded transition active:scale-[0.98]"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-black animate-spin-once" />
                        Regenerate Frame
                      </button>
                    </div>

                  </div>

                </div>

                {/* Unified prompt box below */}
                <div className="bg-black/35 rounded-xl border border-white/5 p-3.5 flex-1 flex flex-col justify-between gap-3 backdrop-blur-xl relative">
                  
                  {/* Prompt Box Header */}
                  <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-zinc-550 font-bold">
                    <span>Visual Prompt (SDXL Spec)</span>
                    
                    {/* Prompt Box Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(asset.id, asset.prompt)}
                        className={`hover:text-primary transition-colors p-1 ${isCopied ? "text-emerald-400 hover:text-emerald-450" : ""}`}
                        title="Copy Prompt"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </button>
                      
                      {onUpdateAssetPrompt && (
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingId(null);
                            } else {
                              setEditingId(asset.id);
                              setEditingText(asset.prompt);
                            }
                          }}
                          className={`hover:text-primary transition-colors p-1 ${isEditing ? "text-primary" : ""}`}
                          title="Edit Prompt Inline"
                        >
                          {isEditing ? (
                            <X className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prompt Text / Editor Inline */}
                  {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full h-20 bg-zinc-950/90 border border-white/10 focus:border-primary/50 text-zinc-200 text-xs p-2.5 rounded-lg focus:outline-none resize-none leading-relaxed transition-colors duration-200"
                        placeholder="Edit frame visual prompt..."
                      />
                      <button
                        onClick={() => {
                          if (onUpdateAssetPrompt) {
                            onUpdateAssetPrompt(asset.id, editingText);
                          }
                          setEditingId(null);
                        }}
                        className="self-end px-3 py-1 btn-primary text-[10px] rounded-md"
                      >
                        Save Prompt
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-inter min-h-[36px] line-clamp-2 selection:bg-primary/20">
                      {asset.prompt}
                    </p>
                  )}
                  
                </div>

              </div>
            );
          })}
        </div>

        {/* Action Controls / Bottom Validation Status Bar */}
        <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-white/5 pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackStep}
              className="flex items-center gap-1.5 px-4 py-2 btn-secondary text-xs rounded transition active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            {/* Ready for Synthesis Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{assetImages.length}/{assetImages.length} Scenes Validated • 4K • 60fps</span>
            </div>
          </div>

          <button
            onClick={onApproveGate3}
            disabled={pipelineState === "synthesizing"}
            className="flex items-center gap-1.5 px-5 py-2 btn-primary text-xs rounded transition duration-200 active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5px] text-black" />
            Approve Assets & Synthesize Video
          </button>
        </div>

      </div>

    </div>
  );
}
