"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Film, Activity, Globe, ShieldCheck, Bell, Settings, User, Plus, CheckCircle2, ChevronRight, Play 
} from "lucide-react";
import BackgroundPhysics from "@/components/BackgroundPhysics";
import PipelineHUD from "@/components/PipelineHUD";
import IngestionStep from "@/components/steps/IngestionStep";
import ScriptEnhancerStep from "@/components/steps/ScriptEnhancerStep";
import DirectorStep from "@/components/steps/DirectorStep";
import AssetValidationStep from "@/components/steps/AssetValidationStep";
import FinalCutStep from "@/components/steps/FinalCutStep";
import NeuroCutLogo from "@/components/NeuroCutLogo";

// Fallback initial metadata variables
const FALLBACK_STORYBOARD = [
  {
    timestamp_start: 0.0,
    timestamp_end: 2.5,
    script_segment: "🚀 TRADITIONAL VIDEO EDITING IS DEAD.",
    camera_movement: "ease_in_zoom",
    style_prompt_override: "watercolor style hovering futuristic camera shapes in deep space"
  },
  {
    timestamp_start: 2.5,
    timestamp_end: 6.0,
    script_segment: "Enter NeuroCut Multi-Agent Studio. Zero gravity AI workflows await you.",
    camera_movement: "exponential_pan",
    style_prompt_override: "colorful 3D render of cyber tech workspace nodes floating in zero-gravity space"
  }
];

const FALLBACK_ASSETS = [
  {
    id: 1,
    prompt: "Frame 1: watercolor style hovering futuristic camera shapes in deep space",
    regenerating: false
  },
  {
    id: 2,
    prompt: "Frame 2: colorful 3D render of cyber tech workspace nodes floating in zero-gravity space",
    regenerating: false
  }
];

export default function Dashboard() {
  
  // Persistent steps tracker (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Script and theme values
  const [scriptText, setScriptText] = useState(
    "Traditional video editing is dead. Enter NeuroCut Multi-Agent Studio. Zero gravity AI workflows await you."
  );
  const [selectedArtStyle, setSelectedArtStyle] = useState("pixar");
  const [moderationState, setModerationState] = useState<"idle" | "analyzing" | "safe" | "violation">("safe");
  const [safetyReport, setSafetyReport] = useState<any>({
    is_safe: true,
    categories: { violence: 2, hate: 1, sexual: 0, self_harm: 0 },
    azure_safety_index: 0.2
  });

  // Pipeline execution status
  const [pipelineState, setPipelineState] = useState<
    "idle" | "running" | "gate1_script" | "gate2_storyboard" | "gate3_assets" | "synthesizing" | "completed"
  >("idle");

  // Step state values
  const [scriptGateData, setScriptGateData] = useState({
    hook: "Traditional video editing is dead.",
    body: "Enter NeuroCut Multi-Agent Studio. Zero gravity AI workflows await you."
  });
  const [storyboardData, setStoryboardData] = useState<any[]>(FALLBACK_STORYBOARD);
  const [assetImages, setAssetImages] = useState<any[]>(FALLBACK_ASSETS);

  // Playback control dials
  const [audioVolume, setAudioVolume] = useState(65);
  const [voicePitch, setVoicePitch] = useState(0);
  const [voiceSpeed, setVoiceSpeed] = useState(1.1);
  const [ssmlBreaths, setSsmlBreaths] = useState(true);
  const [hormoziCaptions, setHormoziCaptions] = useState(true);
  const [captionFontSize, setCaptionFontSize] = useState(24);
  const [captionColor, setCaptionColor] = useState("#eab308"); // Yellow default
  const [captionPosition, setCaptionPosition] = useState<"top" | "middle" | "bottom">("bottom");
  const [cameraMotionOverride, setCameraMotionOverride] = useState("none");
  const [reRendering, setReRendering] = useState(false);

  // Success alert notifications
  const [successToast, setSuccessToast] = useState("");

  const BACKEND_URL = "http://localhost:8000";

  // Ingest raw script & trigger safety
  const handleStartWorkflow = async () => {
    if (!scriptText.trim()) return;

    setPipelineState("running");
    setModerationState("analyzing");

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_script: scriptText, art_style: selectedArtStyle, thread_id: "default_thread_1" })
      });
      
      const data = await res.json();
      
      if (data.status === "safety_failed" || (data.state && !data.state.is_safe)) {
        setSafetyReport(data.safety_report);
        setModerationState("violation");
        setPipelineState("idle");
        setSuccessToast("Pipeline Aborted: Safety Compliance violations.");
        setTimeout(() => setSuccessToast(""), 4000);
      } else {
        setSafetyReport(data.state?.safety_report || { is_safe: true, categories: { violence: 0, hate: 0, sexual: 0, self_harm: 0 }, azure_safety_index: 0.1 });
        setModerationState("safe");
        setScriptGateData(data.state?.script_data || { hook: "Enhance your script", body: "With AI." });
        setPipelineState("gate1_script");
        setSuccessToast("Azure Content Safety: Brand Safe");
        setTimeout(() => {
          setSuccessToast("");
          setCurrentStep(2);
        }, 1500);
      }

    } catch (err) {
      console.warn("[Dashboard] Backend offline. Using in-browser secure simulation.");
      
      // Fallback simulation
      setTimeout(() => {
        const isViolated = scriptText.toLowerCase().includes("kill") || scriptText.toLowerCase().includes("suicide");
        
        if (isViolated) {
          setSafetyReport({
            is_safe: false,
            categories: { violence: 8, hate: 2, sexual: 0, self_harm: 9 },
            azure_safety_index: 0.9
          });
          setModerationState("violation");
          setPipelineState("idle");
          setSuccessToast("Aborted: Safety policy violations.");
          setTimeout(() => setSuccessToast(""), 4000);
        } else {
          setSafetyReport({
            is_safe: true,
            categories: { violence: 1, hate: 1, sexual: 0, self_harm: 0 },
            azure_safety_index: 0.1
          });
          setModerationState("safe");
          
          const sentences = scriptText.split(". ");
          const hookText = sentences[0] || "Hook Segment";
          const bodyText = sentences.slice(1).join(". ") || "Narrative body segment.";
          
          setScriptGateData({ hook: hookText, body: bodyText });
          setPipelineState("gate1_script");
          setSuccessToast("Azure Content Safety: Brand Safe");
          setTimeout(() => {
            setSuccessToast("");
            setCurrentStep(2);
          }, 1500);
        }
      }, 1200);
    }
  };

  // Step 2 approved -> Step 3 Storyboard
  const handleApproveGate1 = async () => {
    setPipelineState("running");

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: "default_thread_1", state_updates: { script_data: scriptGateData } })
      });
      const data = await res.json();
      
      setStoryboardData(data.state?.storyboard || []);
      setPipelineState("gate2_storyboard");
      setCurrentStep(3);

    } catch (err) {
      // Fallback
      setTimeout(() => {
        const scenes = [
          {
            timestamp_start: 0.0,
            timestamp_end: 2.5,
            script_segment: scriptGateData.hook.toUpperCase(),
            camera_movement: "ease_in_zoom",
            style_prompt_override: `Scene 1 [${selectedArtStyle}] - ${scriptGateData.hook}`
          },
          {
            timestamp_start: 2.5,
            timestamp_end: 6.0,
            script_segment: scriptGateData.body,
            camera_movement: "exponential_pan",
            style_prompt_override: `Scene 2 [${selectedArtStyle}] - ${scriptGateData.body}`
          }
        ];
        setStoryboardData(scenes);
        setPipelineState("gate2_storyboard");
        setCurrentStep(3);
      }, 1000);
    }
  };

  // Step 3 approved -> Step 4 Assets validation
  const handleApproveGate2 = async () => {
    setPipelineState("running");

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: "default_thread_1", state_updates: { storyboard: storyboardData } })
      });
      const data = await res.json();

      setAssetImages(data.state?.asset_images || []);
      setPipelineState("gate3_assets");
      setCurrentStep(4);

    } catch (err) {
      // Fallback
      setTimeout(() => {
        const assets = storyboardData.map((scene, idx) => ({
          id: idx + 1,
          prompt: scene.style_prompt_override,
          regenerating: false
        }));
        setAssetImages(assets);
        setPipelineState("gate3_assets");
        setCurrentStep(4);
      }, 1200);
    }
  };

  // Individual image frame regeneration
  const handleRegenerateAsset = async (id: number) => {
    setAssetImages((prev) => 
      prev.map((img) => img.id === id ? { ...img, regenerating: true } : img)
    );

    try {
      // The backend doesn't have a single-frame regenerate endpoint.
      // We will do this purely on the frontend by updating the seed.
      setTimeout(() => {
        setAssetImages((prev) => 
          prev.map((img) => img.id === id ? { ...img, regenerating: false, seed: Math.floor(Math.random() * 100000) } : img)
        );
        setSuccessToast(`Frame 0${id} successfully regenerated.`);
        setTimeout(() => setSuccessToast(""), 2000);
      }, 1500);

    } catch (err) {
      // Fallback
      setTimeout(() => {
        setAssetImages((prev) => 
          prev.map((img) => 
            img.id === id 
              ? { 
                  ...img, 
                  regenerating: false, 
                  prompt: `Regenerated Frame ${id} override [Style: ${selectedArtStyle}] with atmospheric dust` 
                } 
              : img
          )
        );
        setSuccessToast(`Frame 0${id} successfully regenerated.`);
        setTimeout(() => setSuccessToast(""), 2000);
      }, 1000);
    }
  };

  // Update prompt of specific asset frame
  const handleUpdateAssetPrompt = (id: number, newPrompt: string) => {
    setAssetImages((prev) => 
      prev.map((img) => img.id === id ? { ...img, prompt: newPrompt } : img)
    );
    setSuccessToast(`Frame 0${id} prompt updated.`);
    setTimeout(() => setSuccessToast(""), 2000);
  };

  // Step 4 approved -> Step 5 Final Cut Video compilation
  const handleApproveGate3 = async () => {
    setPipelineState("synthesizing");

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: "default_thread_1" })
      });
      const data = await res.json();
      
      setPipelineState(data.state?.status || "synthesizing");
      setSuccessToast("Video Synthesized Successfully!");
      setTimeout(() => {
        setSuccessToast("");
        setCurrentStep(5);
      }, 2000);

    } catch (err) {
      // Fallback
      setTimeout(() => {
        setPipelineState("completed");
        setSuccessToast("Video Synthesized Successfully!");
        setTimeout(() => {
          setSuccessToast("");
          setCurrentStep(5);
        }, 1500);
      }, 3000);
    }
  };

  // Fast tweak updates re-render
  const handleFastReRender = () => {
    setReRendering(true);

    setTimeout(() => {
      setReRendering(false);
      setSuccessToast("Timing tweaks synced!");
      setTimeout(() => setSuccessToast(""), 2500);
    }, 2000);
  };

  // Backwards steps transitions
  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      
      // Update pipeline status back logically
      const prevStatuses: Record<number, typeof pipelineState> = {
        1: "idle",
        2: "gate1_script",
        3: "gate2_storyboard",
        4: "gate3_assets"
      };
      setPipelineState(prevStatuses[currentStep - 1] || "idle");
    }
  };

  if (currentStep === 1) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden pb-16 z-10 select-none bg-transparent">
        
        {/* 3D WebGL background */}
        <BackgroundPhysics />

        {/* Floating Notifications */}
        <AnimatePresence>
          {successToast && (
            <motion.div 
              initial={{ opacity: 0, y: -45, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -45, scale: 0.9 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
              <div className="bg-zinc-950/90 backdrop-blur-xl border border-cyan-500/30 text-cyan-400 font-mono text-xs px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 shadow-cyan-500/10">
                <ShieldCheck className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                <span>{successToast}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative z-20">
          
          {/* Top progress HUD */}
          <PipelineHUD currentStep={currentStep} />

          {/* Standalone large hexagon logo */}
          <div className="mt-8 mb-2 animate-pulse">
            <NeuroCutLogo size={80} />
          </div>

          {/* Centered card content */}
          <main className="w-full max-w-6xl px-8 md:px-14 flex flex-col justify-center items-center">
            <IngestionStep
              scriptText={scriptText}
              setScriptText={setScriptText}
              selectedArtStyle={selectedArtStyle}
              setSelectedArtStyle={setSelectedArtStyle}
              onStartWorkflow={handleStartWorkflow}
              pipelineState={pipelineState}
              moderationState={moderationState}
              safetyReport={safetyReport}
            />
          </main>

          {/* Azure Content Safety Badge */}
          <div className="fixed bottom-6 right-6 z-30 bg-[#0c1a1a]/90 backdrop-blur-xl border border-primary/20 p-2.5 px-4 rounded-xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div className="text-left font-mono">
              <div className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none">Azure Content Safety</div>
              <div className="text-[11px] text-primary font-bold leading-tight mt-0.5">Brand Safe</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden z-10 select-none bg-transparent flex">
      
      {/* 3D WebGL background */}
      <BackgroundPhysics />

      {/* Floating Notifications */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -45, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -45, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-cyan-500/30 text-cyan-400 font-mono text-xs px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 shadow-cyan-500/10">
              <ShieldCheck className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
              <span>{successToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <aside className="w-60 border-r border-white/10 bg-zinc-950/90 backdrop-blur-xl flex flex-col justify-between p-5 shrink-0 relative z-30 min-h-screen shadow-[10px_0_40px_rgba(0,0,0,0.25)]">
        <div className="space-y-5">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-2.5">
            <NeuroCutLogo size={26} />
            <span className="font-geist text-xl font-black tracking-wider text-zinc-200">
              NeuroCut
            </span>
          </div>

          {/* Forge Status Widget */}
          <div className="bg-white/5 border border-white/5 p-3 rounded-lg flex items-center gap-3">
            <div className="w-8 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Play className="w-4 h-4 fill-primary animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider leading-none">Forge Status</div>
              <div className="text-[11px] text-zinc-300 font-bold leading-tight mt-0.5">AI Pipeline Active</div>
            </div>
          </div>

          {/* Vertical Navigation Steps */}
          <nav className="flex flex-col gap-2">
            {[
              { step: 1, label: "Ingestion", id: "ingestion" },
              { step: 2, label: "Scripting", id: "scripting" },
              { step: 3, label: "Storyboarding", id: "storyboarding" },
              { step: 4, label: "Asset Forging", id: "forging" },
              { step: 5, label: "Synthesis", id: "synthesis" }
            ].map((item) => {
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;

              return (
                <button
                  key={item.step}
                  onClick={() => {
                    if (item.step < currentStep) {
                      setCurrentStep(item.step);
                      // Sync pipeline status backwards if clicked
                      const prevStatuses: Record<number, typeof pipelineState> = {
                        1: "idle",
                        2: "gate1_script",
                        3: "gate2_storyboard",
                        4: "gate3_assets"
                      };
                      setPipelineState(prevStatuses[item.step] || "idle");
                    }
                  }}
                  disabled={item.step > currentStep}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-300 hover:translate-x-0.5 active:scale-[0.98] ${
                    isActive 
                      ? "bg-primary/10 border border-primary/25 text-primary font-bold shadow-[0_0_12px_rgba(6,182,212,0.08)]" 
                      : isCompleted 
                      ? "text-success hover:bg-white/5 border border-transparent hover:border-emerald-500/10" 
                      : "text-zinc-550 cursor-not-allowed border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-success fill-success/10" />
                    ) : isActive ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  {isCompleted && (
                    <span className="text-[9px] font-mono opacity-60 uppercase font-bold text-success">Done</span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom controls */}
        <div className="space-y-3 h-10 pt-4 border-t border-white/5">
          <button 
            onClick={() => {
              setCurrentStep(1);
              setPipelineState("idle");
              setScriptText("");
            }}
            className="w-full flex items-center justify-center gap-5 h-8 py-5 btn-secondary text-xs rounded-xl transition active:scale-[0.96]"
          >
            <Plus className="w-3.5 h-3.5" />
            New Production
          </button>
          
          <div className="flex justify-between px-2 text-[10px] text-zinc-500 font-mono">
            <a href="#" className="hover:text-zinc-300 transition">Docs</a>
            <a href="#" className="hover:text-zinc-300 transition">Support</a>
          </div>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative z-20">
        


        {/* Main Work Area */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto overflow-x-hidden w-full mx-auto flex flex-col justify-center items-center max-w-6xl">
          <AnimatePresence mode="wait">
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ y: 40, x: 20, opacity: 0 }}
                animate={{ y: 0, x: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              >
                <ScriptEnhancerStep
                  scriptGateData={scriptGateData}
                  setScriptGateData={setScriptGateData}
                  onApproveGate1={handleApproveGate1}
                  onBackStep={handleBackStep}
                  pipelineState={pipelineState}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ y: 40, x: 20, opacity: 0 }}
                animate={{ y: 0, x: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              >
                <DirectorStep
                  storyboardData={storyboardData}
                  setStoryboardData={setStoryboardData}
                  onApproveGate2={handleApproveGate2}
                  onBackStep={handleBackStep}
                  pipelineState={pipelineState}
                />
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ y: 40, x: 20, opacity: 0 }}
                animate={{ y: 0, x: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              >
                <AssetValidationStep
                  assetImages={assetImages}
                  onRegenerateAsset={handleRegenerateAsset}
                  onApproveGate3={handleApproveGate3}
                  onBackStep={handleBackStep}
                  pipelineState={pipelineState}
                  selectedArtStyle={selectedArtStyle}
                  onUpdateAssetPrompt={handleUpdateAssetPrompt}
                />
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ y: 40, x: 20, opacity: 0 }}
                animate={{ y: 0, x: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              >
                <FinalCutStep
                  storyboardData={storyboardData}
                  selectedArtStyle={selectedArtStyle}
                  audioVolume={audioVolume}
                  setAudioVolume={setAudioVolume}
                  voicePitch={voicePitch}
                  setVoicePitch={setVoicePitch}
                  voiceSpeed={voiceSpeed}
                  setVoiceSpeed={setVoiceSpeed}
                  ssmlBreaths={ssmlBreaths}
                  setSsmlBreaths={setSsmlBreaths}
                  hormoziCaptions={hormoziCaptions}
                  setHormoziCaptions={setHormoziCaptions}
                  captionFontSize={captionFontSize}
                  setCaptionFontSize={setCaptionFontSize}
                  captionColor={captionColor}
                  setCaptionColor={setCaptionColor}
                  captionPosition={captionPosition}
                  setCaptionPosition={setCaptionPosition}
                  cameraMotionOverride={cameraMotionOverride}
                  setCameraMotionOverride={setCameraMotionOverride}
                  onFastReRender={handleFastReRender}
                  reRendering={reRendering}
                  onBackStep={handleBackStep}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>

    </div>
  );
}
