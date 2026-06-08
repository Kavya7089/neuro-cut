"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Sliders, Type, Zap, RefreshCw, 
  Volume2, Eye, RefreshCw as RegenIcon, Camera
} from "lucide-react";

interface StoryboardScene {
  timestamp_start: number;
  timestamp_end: number;
  script_segment: string;
  camera_movement: string;
  style_prompt_override: string;
}

interface PostRenderEditorProps {
  pipelineState: "idle" | "running" | "gate1_script" | "gate2_storyboard" | "gate3_assets" | "synthesizing" | "completed";
  selectedArtStyle: string;
  storyboardData: StoryboardScene[];
  audioVolume: number;
  setAudioVolume: (v: number) => void;
  voicePitch: number;
  setVoicePitch: (v: number) => void;
  voiceSpeed: number;
  setVoiceSpeed: (v: number) => void;
  ssmlBreaths: boolean;
  setSsmlBreaths: (v: boolean) => void;
  hormoziCaptions: boolean;
  setHormoziCaptions: (v: boolean) => void;
  captionFontSize: number;
  setCaptionFontSize: (v: number) => void;
  captionColor: string;
  setCaptionColor: (v: string) => void;
  captionPosition: "top" | "middle" | "bottom";
  setCaptionPosition: (v: "top" | "middle" | "bottom") => void;
  cameraMotionOverride: string;
  setCameraMotionOverride: (v: string) => void;
  onFastReRender: () => void;
  reRendering: boolean;
  onSwapAsset: (idx: number) => void;
}

export default function PostRenderEditor({
  pipelineState,
  selectedArtStyle,
  storyboardData,
  audioVolume,
  setAudioVolume,
  voicePitch,
  setVoicePitch,
  voiceSpeed,
  setVoiceSpeed,
  ssmlBreaths,
  setSsmlBreaths,
  hormoziCaptions,
  setHormoziCaptions,
  captionFontSize,
  setCaptionFontSize,
  captionColor,
  setCaptionColor,
  captionPosition,
  setCaptionPosition,
  cameraMotionOverride,
  setCameraMotionOverride,
  onFastReRender,
  reRendering,
  onSwapAsset,
}: PostRenderEditorProps) {
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [totalDuration, setTotalDuration] = useState(6.0);

  // Calculate total duration based on timing metadata
  useEffect(() => {
    if (storyboardData.length > 0) {
      const maxTime = storyboardData[storyboardData.length - 1].timestamp_end;
      setTotalDuration(maxTime || 6.0);
    }
  }, [storyboardData]);

  // Video looping playback logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && pipelineState === "completed" && !reRendering) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            return 0; // loop back
          }
          return next;
        });
      }, 100);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, pipelineState, totalDuration, reRendering]);

  // Map currentTime to active scene boundaries
  useEffect(() => {
    for (let i = 0; i < storyboardData.length; i++) {
      const scene = storyboardData[i];
      if (currentTime >= scene.timestamp_start && currentTime <= scene.timestamp_end) {
        setCurrentSceneIdx(i);
        break;
      }
    }
  }, [currentTime, storyboardData]);

  const activeScene = storyboardData[currentSceneIdx] || { 
    script_segment: "NeuroCut Render Port", 
    camera_movement: "ease_in_zoom" 
  };

  // Themed visual background variables
  const getStylePalette = () => {
    switch (selectedArtStyle) {
      case "ghibli":
        return {
          bg: "from-emerald-950 via-teal-900 to-emerald-900",
          glow: "rgba(16, 185, 129, 0.15)",
          label: "Studio Ghibli Watercolor"
        };
      case "pixar":
        return {
          bg: "from-blue-950 via-indigo-900 to-blue-900",
          glow: "rgba(59, 130, 246, 0.15)",
          label: "3D Pixar Subsurface"
        };
      case "cinematic":
        return {
          bg: "from-amber-950 via-rose-950 to-orange-950",
          glow: "rgba(245, 158, 11, 0.15)",
          label: "8K Cinematic Realism"
        };
      case "noir":
      default:
        return {
          bg: "from-zinc-800 via-zinc-900 to-zinc-950",
          glow: "rgba(255, 255, 255, 0.08)",
          label: "Noir Charcoal Sketching"
        };
    }
  };

  const palette = getStylePalette();

  // Handle active camera zoom/pan easing interpolations
  const getCameraEasingStyle = () => {
    const motion = cameraMotionOverride !== "none" ? cameraMotionOverride : activeScene.camera_movement;
    
    if (motion === "ease_in_zoom") {
      return isPlaying ? "scale-125 duration-[3000ms] ease-[cubic-bezier(0.4,0,0.2,1)]" : "scale-100";
    }
    if (motion === "exponential_pan") {
      return isPlaying ? "translate-x-6 duration-[3500ms] ease-[cubic-bezier(0.9,0,0.1,1)]" : "translate-x-0";
    }
    if (motion === "tilt_shake") {
      return isPlaying ? "translate-y-2 rotate-1 duration-[2000ms] ease-in-out" : "translate-y-0";
    }
    if (motion === "dolly") {
      return isPlaying ? "scale-110 -translate-x-3 duration-[4000ms] ease-in-out" : "scale-100";
    }
    return "scale-105";
  };

  return (
    <div className="flex flex-col gap-6 w-full lg:max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
      
      {/* 9:16 Mobile looping video output container */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="glass-panel p-4 border-white/5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Simulated Studio Render (.mp4)
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase bg-zinc-950 border border-white/5 px-2 py-0.5 rounded">
            9:16 Vertical Export
          </span>
        </div>

        {/* Vertical Viewport container */}
        <div className="w-full aspect-[9/16] max-h-[300px] rounded-xl bg-zinc-950 border border-white/5 relative overflow-hidden flex items-center justify-center mx-auto shadow-2xl">
          
          {pipelineState !== "completed" ? (
            <div className="absolute inset-0 z-30 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
              <Sliders className="w-8 h-8 text-zinc-700 animate-bounce mb-2" />
              <h4 className="text-xs font-black text-zinc-400">Timeline Locked</h4>
              <p className="text-[9px] text-zinc-600 mt-1 leading-normal max-w-[180px]">
                Complete the LangGraph multi-agent nodes in the state timeline to synthesize output.
              </p>
            </div>
          ) : reRendering ? (
            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
              <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest">
                Re-Compiling FFmpeg...
              </h4>
              <span className="text-[8px] font-mono text-zinc-500 mt-2">
                SSML pause boundaries & audio waveforms re-aligning
              </span>
            </div>
          ) : (
            // Output looping canvas
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${palette.bg} transition-all transform ${getCameraEasingStyle()}`} 
              />
              
              {/* Animated mesh overlay */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <svg width="100%" height="100%">
                  <pattern id="gridOverlay" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#gridOverlay)" />
                </svg>
              </div>

              {/* Floating vector geometry element */}
              <motion.div
                animate={{
                  y: isPlaying ? [6, -6, 6] : 0,
                  rotate: isPlaying ? [0, 360] : 0
                }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                className="w-20 h-20 rounded-xl border border-white/10 flex items-center justify-center z-10"
                style={{ boxShadow: `0 0 25px ${palette.glow}` }}
              >
                <div className="w-10 h-10 bg-white/5 rounded-full border border-white/5" />
              </motion.div>

              {/* Subtitles caption overlays (Hormozi dynamic sizing) */}
              <div
                className={`absolute inset-x-3 z-20 flex justify-center pointer-events-none ${
                  captionPosition === "top" ? "top-6" :
                  captionPosition === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-10"
                }`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentSceneIdx}-${activeScene.script_segment}`}
                    initial={hormoziCaptions ? { scale: 0.85, y: 8, opacity: 0 } : { opacity: 0 }}
                    animate={hormoziCaptions ? { scale: 1.1, y: 0, opacity: 1 } : { opacity: 1 }}
                    exit={hormoziCaptions ? { scale: 0.85, y: -8, opacity: 0 } : { opacity: 0 }}
                    transition={hormoziCaptions ? { type: "spring", stiffness: 350, damping: 16 } : { duration: 0.15 }}
                    className="text-center font-black uppercase tracking-tight"
                    style={{
                      fontSize: `${captionFontSize}px`,
                      color: captionColor,
                      textShadow: hormoziCaptions 
                        ? `3px 3px 0px #000, 0px 0px 8px ${captionColor}50` 
                        : "1px 1px 2px #000"
                    }}
                  >
                    {activeScene.script_segment}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Loop overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/45 z-10 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="p-3 bg-cyan-500 rounded-full text-black hover:scale-105 transition shadow-lg shadow-cyan-500/20"
                  >
                    <Play className="w-4 h-4 fill-black" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video timelines play controller */}
        {pipelineState === "completed" && !reRendering && (
          <div className="mt-3 bg-zinc-950/60 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-zinc-400 hover:text-cyan-400 transition"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-zinc-400 hover:fill-cyan-400" />}
            </button>
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all duration-100"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
            </span>
          </div>
        )}
      </motion.div>

      {/* Storyboard strict timing metadata grid */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="glass-panel p-5 border-white/5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Interactive JSON Storyboard Grid
          </h3>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {storyboardData.map((scene, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-2 rounded-lg border text-left transition ${
                currentSceneIdx === idx && isPlaying
                  ? "border-cyan-500/30 bg-cyan-500/5 text-zinc-200" 
                  : "border-white/5 bg-zinc-950/30 text-zinc-400"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono font-bold text-zinc-500">
                  SCENE 0{idx+1} — [{scene.timestamp_start.toFixed(1)}s - {scene.timestamp_end.toFixed(1)}s]
                </span>
                <span className="text-[10px] line-clamp-1 max-w-[200px] leading-tight">
                  {scene.script_segment}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={scene.camera_movement}
                  onChange={(e) => {
                    scene.camera_movement = e.target.value;
                  }}
                  disabled={pipelineState !== "completed"}
                  className="bg-zinc-900 border border-white/5 rounded text-[8px] font-mono py-0.5 px-1.5 focus:outline-none"
                >
                  <option value="ease_in_zoom">ease_in_zoom</option>
                  <option value="exponential_pan">exponential_pan</option>
                  <option value="tilt_shake">tilt_shake</option>
                  <option value="dolly">dolly</option>
                </select>

                <button
                  onClick={() => onSwapAsset(idx)}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-cyan-400"
                  title="Swap Frame Asset"
                >
                  <RegenIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Manual JSON parameter tweak sliders deck */}
      <div className="glass-panel p-5 border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Post-Generation Tweak Deck
          </h3>
        </div>

        <div className="space-y-4 text-left">
          
          {/* Audio Engine */}
          <div className="space-y-3 pb-3 border-b border-white/5">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase font-black">
              1. Audio Synthesis & Pauses
            </span>

            <div>
              <div className="flex justify-between items-center text-[10px] mb-1">
                <span className="text-zinc-500">Music Ducking volume</span>
                <span className="font-mono text-cyan-400">{audioVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseInt(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-zinc-500">Voice Pitch</span>
                  <span className="font-mono text-purple-400">+{voicePitch}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseInt(e.target.value))}
                  className="w-full accent-purple-500 h-1 bg-zinc-800 rounded"
                />
              </div>
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-zinc-500">Voice Speed</span>
                  <span className="font-mono text-purple-400">{voiceSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-1 bg-zinc-800 rounded"
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded-lg text-[10px] text-zinc-400">
              <span>SSML Natural breath intervals</span>
              <button
                onClick={() => setSsmlBreaths(!ssmlBreaths)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors ${ssmlBreaths ? "bg-cyan-500" : "bg-zinc-700"}`}
              >
                <div className={`w-3 h-3 rounded-full bg-black transition-transform ${ssmlBreaths ? "translate-x-3" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          {/* Caption Style Engine */}
          <div className="space-y-3 pb-3 border-b border-white/5">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase font-black">
              2. Dynamic Caption Engine
            </span>

            <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded-lg text-[10px] text-zinc-400">
              <span>Hormozi-Style Kinetic captions</span>
              <button
                onClick={() => setHormoziCaptions(!hormoziCaptions)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors ${hormoziCaptions ? "bg-cyan-500" : "bg-zinc-700"}`}
              >
                <div className={`w-3 h-3 rounded-full bg-black transition-transform ${hormoziCaptions ? "translate-x-3" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-zinc-500">Caption Font Size</span>
                  <span className="font-mono text-zinc-400">{captionFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={captionFontSize}
                  onChange={(e) => setCaptionFontSize(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block mb-1">Overlay color bubble</span>
                <div className="flex gap-2">
                  {[
                    { hex: "#eab308" }, // yellow
                    { hex: "#06b6d4" }, // cyan
                    { hex: "#a855f7" }, // purple
                    { hex: "#ffffff" }  // white
                  ].map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setCaptionColor(color.hex)}
                      className={`w-4.5 h-4.5 rounded-full border transition-all ${
                        captionColor === color.hex ? "scale-110 border-white" : "border-white/10 opacity-70"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 block mb-1">Screen Position Layout</span>
              <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-lg border border-white/5 text-center">
                {(["top", "middle", "bottom"] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setCaptionPosition(pos)}
                    className={`text-[9px] font-bold py-1 rounded transition-colors uppercase ${
                      captionPosition === pos 
                        ? "bg-cyan-500 text-black" 
                        : "text-zinc-400 hover:bg-white/5"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kinetic Motion Overrides */}
          <div>
            <span className="text-[9px] font-mono text-zinc-400 block mb-1 uppercase font-black">
              3. Dynamic camera overrides
            </span>
            <select
              value={cameraMotionOverride}
              onChange={(e) => setCameraMotionOverride(e.target.value)}
              className="w-full bg-black border border-white/5 text-[11px] text-zinc-400 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-cyan-500/30"
            >
              <option value="none">Auto (Let LangGraph Agent Decide)</option>
              <option value="ease_in_zoom">Sigmoid Ease-in Zoom</option>
              <option value="exponential_pan">Exponential Pan</option>
              <option value="tilt_shake">Tilt Shaking</option>
              <option value="dolly">Parallax Dolly</option>
            </select>
          </div>

        </div>

        {pipelineState === "completed" && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              onClick={onFastReRender}
              disabled={reRendering}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black font-bold text-xs py-2.5 rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-black" />
              Apply Tweaks (Fast Render)
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
