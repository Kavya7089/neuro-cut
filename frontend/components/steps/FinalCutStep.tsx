"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Sliders, Type, Zap, RefreshCw, Volume2, ArrowLeft, ChevronDown, ChevronUp
} from "lucide-react";

interface StoryboardScene {
  timestamp_start: number;
  timestamp_end: number;
  script_segment: string;
  camera_movement: string;
  style_prompt_override: string;
}

interface FinalCutStepProps {
  storyboardData: StoryboardScene[];
  selectedArtStyle: string;
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
  onBackStep: () => void;
}

export default function FinalCutStep({
  storyboardData,
  selectedArtStyle,
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
  onBackStep,
}: FinalCutStepProps) {

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [totalDuration, setTotalDuration] = useState(6.0);
  const [isDeckOpen, setIsDeckOpen] = useState(true); // Collapsible drawer

  useEffect(() => {
    if (storyboardData.length > 0) {
      setTotalDuration(storyboardData[storyboardData.length - 1].timestamp_end || 6.0);
    }
  }, [storyboardData]);

  // Video looping playback logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !reRendering) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            return 0; // loop
          }
          return next;
        });
      }, 100);
    } else {
      setIsPlaying(false);
      window.speechSynthesis.cancel();
    }
    return () => {
      clearInterval(interval);
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, totalDuration, reRendering]);

  // Map currentTime to active scene boundaries
  useEffect(() => {
    for (let i = 0; i < storyboardData.length; i++) {
      const scene = storyboardData[i];
      if (currentTime >= scene.timestamp_start && currentTime <= scene.timestamp_end) {
        if (currentSceneIdx !== i) {
          setCurrentSceneIdx(i);
          if (isPlaying) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(scene.script_segment);
            utterance.rate = voiceSpeed;
            utterance.pitch = 1.0 + (voicePitch / 10.0);
            utterance.volume = audioVolume / 100.0;
            window.speechSynthesis.speak(utterance);
          }
        }
        break;
      }
    }
  }, [currentTime, storyboardData, currentSceneIdx, isPlaying, voiceSpeed, voicePitch, audioVolume]);

  const activeScene = storyboardData[currentSceneIdx] || { 
    script_segment: "NeuroCut Render Port", 
    camera_movement: "ease_in_zoom" 
  };

  // Art Theme Styles
  const getStylePalette = () => {
    switch (selectedArtStyle) {
      case "ghibli":
        return {
          bg: "from-emerald-950 via-teal-900 to-emerald-900",
          glow: "rgba(16, 185, 129, 0.2)",
          label: "Studio Ghibli Watercolor"
        };
      case "pixar":
        return {
          bg: "from-blue-950 via-indigo-900 to-blue-900",
          glow: "rgba(59, 130, 246, 0.2)",
          label: "3D Pixar Subsurface"
        };
      case "cinematic":
        return {
          bg: "from-amber-950 via-rose-950 to-orange-950",
          glow: "rgba(245, 158, 11, 0.2)",
          label: "8K Cinematic Realism"
        };
      case "noir":
      default:
        return {
          bg: "from-zinc-800 via-zinc-900 to-zinc-950",
          glow: "rgba(255, 255, 255, 0.1)",
          label: "Noir Charcoal Sketching"
        };
    }
  };

  const palette = getStylePalette();

  // Camera Ease zoom/pan transforms
  const getCameraEasingStyle = () => {
    const motionMode = cameraMotionOverride !== "none" ? cameraMotionOverride : activeScene.camera_movement;
    
    if (motionMode === "ease_in_zoom") {
      return isPlaying ? "scale-125 duration-[3000ms] ease-[cubic-bezier(0.4,0,0.2,1)]" : "scale-100";
    }
    if (motionMode === "exponential_pan") {
      return isPlaying ? "translate-x-6 duration-[3500ms] ease-[cubic-bezier(0.9,0,0.1,1)]" : "translate-x-0";
    }
    if (motionMode === "tilt_shake") {
      return isPlaying ? "translate-y-2 rotate-1 duration-[2000ms] ease-in-out" : "translate-y-0";
    }
    if (motionMode === "dolly") {
      return isPlaying ? "scale-110 -translate-x-3 duration-[4000ms] ease-in-out" : "scale-100";
    }
    return "scale-105";
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-6 flex flex-col gap-6">
      
      {/* Centered Large Cinematic Floating Player Card */}
      <div className="glass-panel-heavy p-6 sm:p-8 relative overflow-hidden shadow-2xl text-center">
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-mono text-zinc-500 uppercase bg-zinc-950 border border-white/5 px-2 py-0.5 rounded">
            16:9 Cinematic Cut
          </span>
          <span className="text-xs font-black text-zinc-300 uppercase tracking-widest font-mono">
            {palette.label}
          </span>
        </div>

        {/* Cinematic Landscape 16:9 Screen */}
        <div className="w-full aspect-video rounded-xl bg-zinc-950 border border-white/10 relative overflow-hidden flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(0,240,255,0.15)]">
          
          {reRendering ? (
            <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
              <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest">
                Re-Compiling FFmpeg...
              </h4>
              <span className="text-[8px] font-mono text-zinc-500 mt-2">
                Recalculating audio tracks and SSML alignment matrices
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <img 
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/v1/image?prompt=${encodeURIComponent(activeScene.style_prompt_override || activeScene.script_segment || "watercolor cinematic Tech")}`} 
                alt="Active scene preview"
                className={`absolute inset-0 w-full h-full object-cover transition-all transform ${getCameraEasingStyle()}`} 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60 pointer-events-none" />
              
              {/* Vector Grid Overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%">
                  <pattern id="wizardGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#wizardGrid)" />
                </svg>
              </div>

              {/* Responsive Audio Waves Visualizer overlay */}
              {isPlaying && (
                <div className="absolute bottom-4 right-4 flex items-end gap-1 h-6 pointer-events-none z-20 bg-black/60 px-2 py-1.5 rounded border border-white/10 backdrop-blur-md">
                  <span className="text-[7px] font-mono text-primary uppercase mr-1.5 self-center">Vocals Live</span>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [4, 18, 4],
                      }}
                      transition={{
                        duration: 0.4 + i * 0.08,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-0.5 bg-primary rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* Subtitles Overlay */}
              <div
                className={`absolute inset-x-4 z-20 flex justify-center pointer-events-none ${
                  captionPosition === "top" ? "top-6" :
                  captionPosition === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-10"
                }`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentSceneIdx}-${activeScene.script_segment}`}
                    initial={hormoziCaptions ? { scale: 0.85, y: 8, opacity: 0 } : { opacity: 0 }}
                    animate={hormoziCaptions ? { scale: 1.15, y: 0, opacity: 1 } : { opacity: 1 }}
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

              {/* Toggle playback mask */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/45 z-10 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="p-3 bg-primary rounded-full text-black hover:scale-105 transition shadow-lg shadow-primary/20"
                  >
                    <Play className="w-4 h-4 fill-black" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Media Timeline controls */}
        {!reRendering && (
          <div className="mt-3 bg-zinc-950/60 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-zinc-400 hover:text-cyan-400 transition"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-zinc-400 hover:fill-cyan-400" />}
            </button>
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* Collapsible Glass drawer deck */}
      <div className="glass-panel-heavy border-white/5 overflow-hidden mt-1">
        
        {/* Toggle header */}
        <button
          onClick={() => setIsDeckOpen(!isDeckOpen)}
          className="w-full px-4 py-2.5 flex justify-between items-center hover:bg-white/2 transition"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-geist">
              Post-Render Customization Deck
            </h3>
          </div>
          {isDeckOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {/* Expandable Tweak deck content */}
        <AnimatePresence>
          {isDeckOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="p-4 space-y-3.5 text-left">
                
                {/* Two-Column Layout: Sliders on Left, Switches/Toggles on Right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                  
                  {/* Left Column: Sliders */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold">
                        <span className="text-zinc-500 uppercase font-mono">BGM Volume</span>
                        <span className="font-mono text-primary">{audioVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={audioVolume}
                        onChange={(e) => setAudioVolume(parseInt(e.target.value))}
                        className="w-full accent-primary h-1 bg-zinc-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold">
                        <span className="text-zinc-500 uppercase font-mono">Voice Pitch Shift</span>
                        <span className="font-mono text-secondary">+{voicePitch} hz</span>
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        value={voicePitch}
                        onChange={(e) => setVoicePitch(parseInt(e.target.value))}
                        className="w-full accent-secondary h-1 bg-zinc-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold">
                        <span className="text-zinc-500 uppercase font-mono">Caption Font Scale</span>
                        <span className="font-mono text-zinc-400">{captionFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="48"
                        value={captionFontSize}
                        onChange={(e) => setCaptionFontSize(parseInt(e.target.value))}
                        className="w-full accent-primary h-1 bg-zinc-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Right Column: Switches / Toggles */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] text-zinc-400 font-bold uppercase font-mono">
                      <span>SSML Breaths</span>
                      <button
                        onClick={() => setSsmlBreaths(!ssmlBreaths)}
                        className={`w-7 h-4 rounded-full p-0.5 transition-colors ${ssmlBreaths ? "bg-primary" : "bg-zinc-700"}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-black transition-transform ${ssmlBreaths ? "translate-x-3" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] text-zinc-400 font-bold uppercase font-mono">
                      <span>Cinematic Captions</span>
                      <button
                        onClick={() => setHormoziCaptions(!hormoziCaptions)}
                        className={`w-7 h-4 rounded-full p-0.5 transition-colors ${hormoziCaptions ? "bg-primary" : "bg-zinc-700"}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-black transition-transform ${hormoziCaptions ? "translate-x-3" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-1.5 uppercase font-mono font-bold">
                          Overlay Color Theme
                        </span>
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
                              className={`w-5 h-5 rounded-full border transition-all ${
                                captionColor === color.hex ? "scale-110 border-white" : "border-white/10 opacity-70"
                              }`}
                              style={{ backgroundColor: color.hex }}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-1.5 uppercase font-mono font-bold">
                          Caption Alignment
                        </span>
                        <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded border border-white/5 text-center">
                          {(["top", "middle", "bottom"] as const).map((pos) => (
                            <button
                              key={pos}
                              onClick={() => setCaptionPosition(pos)}
                              className={`text-[9px] font-bold py-1 rounded transition-colors uppercase ${
                                captionPosition === pos 
                                  ? "bg-primary text-black" 
                                  : "text-zinc-450 hover:bg-white/5"
                              }`}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] text-zinc-500 block mb-1.5 uppercase font-mono font-bold">
                        Camera ease-in override
                      </span>
                      <select
                        value={cameraMotionOverride}
                        onChange={(e) => setCameraMotionOverride(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 text-[10px] py-1.5 px-2.5 rounded focus:outline-none focus:border-primary/40 text-zinc-350"
                      >
                        <option value="none">Auto (LangGraph default)</option>
                        <option value="ease_in_zoom">Sigmoid Ease Zoom</option>
                        <option value="exponential_pan">Exponential Pan</option>
                        <option value="tilt_shake">Tilt Shake</option>
                        <option value="dolly">Parallax Dolly</option>
                      </select>
                    </div>

                  </div>

                </div>

                {/* Fast re-render button */}
                <div className="pt-3 border-t border-white/5">
                  <button
                    onClick={onFastReRender}
                    disabled={reRendering}
                    className="w-full flex items-center justify-center gap-2 btn-primary text-xs py-2 rounded-xl transition active:scale-[0.96] neon-cyan-glow"
                  >
                    <Zap className="w-4 h-4 text-black" fill="currentColor" />
                    Apply Tweaks (Fast Re-Render)
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Back button */}
      <div className="flex justify-start">
        <button
          onClick={onBackStep}
          className="flex items-center gap-1.5 px-4 py-2 btn-secondary text-xs rounded transition active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Asset Validation
        </button>
      </div>

    </div>
  );
}
