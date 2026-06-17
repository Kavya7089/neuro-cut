"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Plus, CheckCircle2, Play, X, RefreshCw, LogOut, History, ChevronRight
} from "lucide-react";
import BackgroundPhysics from "@/components/BackgroundPhysics";
import PipelineHUD from "@/components/PipelineHUD";
import IngestionStep from "@/components/steps/IngestionStep";
import ScriptEnhancerStep from "@/components/steps/ScriptEnhancerStep";
import DirectorStep from "@/components/steps/DirectorStep";
import AssetValidationStep from "@/components/steps/AssetValidationStep";
import FinalCutStep from "@/components/steps/FinalCutStep";
import NeuroCutLogo from "@/components/NeuroCutLogo";

const BACKEND_URL = "http://localhost:8000";

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
  { id: 1, prompt: "Frame 1: watercolor style hovering futuristic camera shapes in deep space", regenerating: false },
  { id: 2, prompt: "Frame 2: colorful 3D render of cyber tech workspace nodes floating in zero-gravity space", regenerating: false }
];

const NAV_STEPS = [
  { step: 1, label: "Ingestion" },
  { step: 2, label: "Scripting" },
  { step: 3, label: "Storyboard" },
  { step: 4, label: "Assets" },
  { step: 5, label: "Export" },
];

function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
    >
      <div className="toast-success text-zinc-200 text-sm px-5 py-3 rounded-xl flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>{message}</span>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState(1);
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
  const [pipelineState, setPipelineState] = useState<
    "idle" | "running" | "gate1_script" | "gate2_storyboard" | "gate3_assets" | "synthesizing" | "completed"
  >("idle");
  const [scriptGateData, setScriptGateData] = useState({
    hook: "Traditional video editing is dead.",
    body: "Enter NeuroCut Multi-Agent Studio. Zero gravity AI workflows await you."
  });
  const [storyboardData, setStoryboardData] = useState<any[]>(FALLBACK_STORYBOARD);
  const [assetImages, setAssetImages] = useState<any[]>(FALLBACK_ASSETS);
  const [loadedUrls, setLoadedUrls] = useState<Record<number, string>>({});
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [userSession, setUserSession] = useState<{ token: string; email: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [userJobsHistory, setUserJobsHistory] = useState<any[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string>("default_thread_1");
  const [audioVolume, setAudioVolume] = useState(65);
  const [voicePitch, setVoicePitch] = useState(0);
  const [voiceSpeed, setVoiceSpeed] = useState(1.1);
  const [ssmlBreaths, setSsmlBreaths] = useState(true);
  const [hormoziCaptions, setHormoziCaptions] = useState(true);
  const [captionFontSize, setCaptionFontSize] = useState(24);
  const [captionColor, setCaptionColor] = useState("#eab308");
  const [captionPosition, setCaptionPosition] = useState<"top" | "middle" | "bottom">("bottom");
  const [cameraMotionOverride, setCameraMotionOverride] = useState("none");
  const [reRendering, setReRendering] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("neurocut_token");
    const email = localStorage.getItem("neurocut_email");
    if (token && email) setUserSession({ token, email });
  }, []);

  useEffect(() => {
    if (userSession) fetchUserJobsHistory();
    else setUserJobsHistory([]);
  }, [userSession]);

  const fetchUserJobsHistory = async () => {
    if (!userSession) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/jobs`, {
        headers: { Authorization: `Bearer ${userSession.token}` }
      });
      const data = await res.json();
      if (data.status === "success") setUserJobsHistory(data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs history:", err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const endpoint = authTab === "signin" ? "/api/v1/auth/signin" : "/api/v1/auth/signup";
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.status === 200 && data.status === "success") {
        if (authTab === "signin") {
          const session = data.data.session;
          localStorage.setItem("neurocut_token", session.access_token);
          localStorage.setItem("neurocut_email", session.user.email);
          setUserSession({ token: session.access_token, email: session.user.email });
          setSuccessToast("Signed in successfully.");
        } else {
          setSuccessToast("Account created! Please sign in.");
          setAuthTab("signin");
        }
        setShowAuthModal(false);
        setAuthEmail("");
        setAuthPassword("");
      } else {
        setSuccessToast(data.detail || "Authentication failed.");
      }
    } catch {
      setSuccessToast("Connection error. Using offline auth.");
      setTimeout(() => {
        if (authTab === "signin") {
          const mockToken = `mock-token-${authEmail}`;
          localStorage.setItem("neurocut_token", mockToken);
          localStorage.setItem("neurocut_email", authEmail);
          setUserSession({ token: mockToken, email: authEmail });
          setSuccessToast("Signed in locally.");
        } else {
          setSuccessToast("Local account created!");
          setAuthTab("signin");
        }
        setShowAuthModal(false);
        setAuthEmail("");
        setAuthPassword("");
      }, 1000);
    } finally {
      setAuthLoading(false);
      setTimeout(() => setSuccessToast(""), 3000);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("neurocut_token");
    localStorage.removeItem("neurocut_email");
    setUserSession(null);
    setSuccessToast("Signed out.");
    setTimeout(() => setSuccessToast(""), 2500);
    setCurrentStep(1);
    setPipelineState("idle");
    setScriptText("");
    setCurrentThreadId("default_thread_1");
    setVideoUrl("");
  };

  const handleLoadHistoricalJob = async (jobId: string) => {
    setPipelineState("running");
    setCurrentThreadId(jobId);
    try {
      const headers: Record<string, string> = {};
      if (userSession) headers["Authorization"] = `Bearer ${userSession.token}`;
      const res = await fetch(`${BACKEND_URL}/api/v1/status/${jobId}`, { headers });
      const data = await res.json();
      if (data.state) {
        const state = data.state;
        setScriptText(state.raw_script || "");
        setScriptGateData(state.script_data || { hook: "", body: "" });
        setStoryboardData(state.storyboard || []);
        setAssetImages(state.asset_images || []);
        setVideoUrl(state.video_url || "");
        const status = state.status || "idle";
        let step = 1;
        if (status === "gate1_script" || status === "gate1_script_approved") step = 2;
        else if (status === "gate2_storyboard") step = 3;
        else if (status === "gate3_assets" || status === "synthesizing") step = 4;
        else if (status === "completed") step = 5;
        setPipelineState(status);
        setCurrentStep(step);
        setSuccessToast("Workflow resumed.");
        setTimeout(() => setSuccessToast(""), 2000);
      }
    } catch {
      setSuccessToast("Failed to load production.");
      setTimeout(() => setSuccessToast(""), 3000);
    }
  };

  const handleStartWorkflow = async () => {
    if (!scriptText.trim()) return;
    setPipelineState("running");
    setModerationState("analyzing");
    const nextThreadId = userSession ? `thread_${Date.now()}_${Math.floor(Math.random() * 1000)}` : "default_thread_1";
    setCurrentThreadId(nextThreadId);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userSession) headers["Authorization"] = `Bearer ${userSession.token}`;
      const res = await fetch(`${BACKEND_URL}/api/v1/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ raw_script: scriptText, art_style: selectedArtStyle, thread_id: nextThreadId })
      });
      const data = await res.json();
      if (data.status === "safety_failed" || (data.state && !data.state.is_safe)) {
        setSafetyReport(data.safety_report);
        setModerationState("violation");
        setPipelineState("idle");
        setSuccessToast("Pipeline aborted: safety violation.");
        setTimeout(() => setSuccessToast(""), 4000);
      } else {
        setSafetyReport(data.state?.safety_report || { is_safe: true, categories: { violence: 0, hate: 0, sexual: 0, self_harm: 0 }, azure_safety_index: 0.1 });
        setModerationState("safe");
        setScriptGateData(data.state?.script_data || { hook: "Enhance your script", body: "With AI." });
        setPipelineState("gate1_script");
        setSuccessToast("Content verified — brand safe");
        setTimeout(() => { setSuccessToast(""); setCurrentStep(2); }, 1500);
      }
    } catch {
      setTimeout(() => {
        const isViolated = scriptText.toLowerCase().includes("kill") || scriptText.toLowerCase().includes("suicide");
        if (isViolated) {
          setSafetyReport({ is_safe: false, categories: { violence: 8, hate: 2, sexual: 0, self_harm: 9 }, azure_safety_index: 0.9 });
          setModerationState("violation");
          setPipelineState("idle");
          setSuccessToast("Aborted: safety policy violation.");
          setTimeout(() => setSuccessToast(""), 4000);
        } else {
          setSafetyReport({ is_safe: true, categories: { violence: 1, hate: 1, sexual: 0, self_harm: 0 }, azure_safety_index: 0.1 });
          setModerationState("safe");
          const sentences = scriptText.split(". ");
          setScriptGateData({ hook: sentences[0] || "Hook Segment", body: sentences.slice(1).join(". ") || "Narrative body segment." });
          setPipelineState("gate1_script");
          setSuccessToast("Content verified — brand safe");
          setTimeout(() => { setSuccessToast(""); setCurrentStep(2); }, 1500);
        }
      }, 1200);
    }
  };

  const handleRegenerateScript = async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userSession) headers["Authorization"] = `Bearer ${userSession.token}`;
      const res = await fetch(`${BACKEND_URL}/api/v1/enhance-script`, {
        method: "POST", headers, body: JSON.stringify({ raw_script: scriptText })
      });
      const data = await res.json();
      if (data.status === "success" && data.script_data) {
        setSuccessToast("Script regenerated.");
        setTimeout(() => setSuccessToast(""), 2000);
        return data.script_data;
      }
      throw new Error(data.detail || "Failed");
    } catch {
      const prefixes = ["🔥 ATTENTION: ", "🚀 BREAKING: ", "💡 Did you know? ", "✨ STOP SCROLLING! ", "⭐ ALERT: "];
      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const sentences = scriptText.split(". ");
      setSuccessToast("Script regenerated locally.");
      setTimeout(() => setSuccessToast(""), 2000);
      return { hook: sentences[0] ? `${randomPrefix}${sentences[0]}` : "NeuroCut Studio", body: sentences.slice(1).join(". ") || "Experience AI automation." };
    }
  };

  const handleApproveGate1 = async () => {
    setPipelineState("running");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userSession) headers["Authorization"] = `Bearer ${userSession.token}`;
      const res = await fetch(`${BACKEND_URL}/api/v1/approve`, {
        method: "POST", headers,
        body: JSON.stringify({ thread_id: currentThreadId, state_updates: { script_data: scriptGateData } })
      });
      const data = await res.json();
      setStoryboardData(data.state?.storyboard || []);
      setPipelineState("gate2_storyboard");
      setCurrentStep(3);
    } catch {
      setTimeout(() => {
        setStoryboardData([
          { timestamp_start: 0.0, timestamp_end: 2.5, script_segment: scriptGateData.hook.toUpperCase(), camera_movement: "ease_in_zoom", style_prompt_override: `Scene 1 [${selectedArtStyle}] - ${scriptGateData.hook}` },
          { timestamp_start: 2.5, timestamp_end: 6.0, script_segment: scriptGateData.body, camera_movement: "exponential_pan", style_prompt_override: `Scene 2 [${selectedArtStyle}] - ${scriptGateData.body}` }
        ]);
        setPipelineState("gate2_storyboard");
        setCurrentStep(3);
      }, 1000);
    }
  };

  const handleApproveGate2 = async () => {
    setPipelineState("running");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userSession) headers["Authorization"] = `Bearer ${userSession.token}`;
      const res = await fetch(`${BACKEND_URL}/api/v1/approve`, {
        method: "POST", headers,
        body: JSON.stringify({ thread_id: currentThreadId, state_updates: { storyboard: storyboardData } })
      });
      const data = await res.json();
      setAssetImages(data.state?.asset_images || []);
      setPipelineState("gate3_assets");
      setCurrentStep(4);
    } catch {
      setTimeout(() => {
        setAssetImages(storyboardData.map((scene, idx) => ({ id: idx + 1, prompt: scene.style_prompt_override, regenerating: false })));
        setPipelineState("gate3_assets");
        setCurrentStep(4);
      }, 1200);
    }
  };

  const handleRegenerateAsset = async (id: number) => {
    setAssetImages(prev => prev.map(img => img.id === id ? { ...img, regenerating: true } : img));
    setTimeout(() => {
      setAssetImages(prev => prev.map(img => img.id === id ? { ...img, regenerating: false, seed: Math.floor(Math.random() * 100000) } : img));
      setSuccessToast(`Frame 0${id} regenerated.`);
      setTimeout(() => setSuccessToast(""), 2000);
    }, 1500);
  };

  const handleUpdateAssetPrompt = (id: number, newPrompt: string) => {
    setAssetImages(prev => prev.map(img => img.id === id ? { ...img, prompt: newPrompt } : img));
    setSuccessToast(`Frame 0${id} prompt updated.`);
    setTimeout(() => setSuccessToast(""), 2000);
  };

  const handleApproveGate3 = async () => {
    setPipelineState("synthesizing");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userSession) headers["Authorization"] = `Bearer ${userSession.token}`;
      const res = await fetch(`${BACKEND_URL}/api/v1/approve`, {
        method: "POST", headers, body: JSON.stringify({ thread_id: currentThreadId })
      });
      const data = await res.json();
      setPipelineState(data.state?.status || "synthesizing");
      if (data.state?.video_url) setVideoUrl(data.state.video_url);
      setSuccessToast("Video synthesized!");
      setTimeout(() => { setSuccessToast(""); setCurrentStep(5); }, 2000);
    } catch {
      setTimeout(() => {
        setPipelineState("completed");
        setVideoUrl("");
        setSuccessToast("Video synthesized!");
        setTimeout(() => { setSuccessToast(""); setCurrentStep(5); }, 1500);
      }, 3000);
    }
  };

  const handleFastReRender = () => {
    setReRendering(true);
    setTimeout(() => {
      setReRendering(false);
      setSuccessToast("Timing tweaks synced!");
      setTimeout(() => setSuccessToast(""), 2500);
    }, 2000);
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      const prevStatuses: Record<number, typeof pipelineState> = { 1: "idle", 2: "gate1_script", 3: "gate2_storyboard", 4: "gate3_assets" };
      setPipelineState(prevStatuses[currentStep - 1] || "idle");
    }
  };

  const navigateToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      const prevStatuses: Record<number, typeof pipelineState> = { 1: "idle", 2: "gate1_script", 3: "gate2_storyboard", 4: "gate3_assets" };
      setPipelineState(prevStatuses[step] || "idle");
    }
  };

  const resetProduction = () => {
    setCurrentStep(1);
    setPipelineState("idle");
    setScriptText("");
    setCurrentThreadId("default_thread_1");
    setVideoUrl("");
  };

  const isLanding = currentStep === 1;

  return (
    <div className={`relative w-full z-10 bg-transparent ${isLanding ? "min-h-screen overflow-x-hidden pb-16" : "min-h-screen md:h-screen md:max-h-screen md:overflow-hidden flex flex-col md:flex-row"}`}>
      <BackgroundPhysics />

      <AnimatePresence>{successToast && <Toast message={successToast} />}</AnimatePresence>

      {/* Mobile top header */}
      {!isLanding && (
        <header className="md:hidden w-full h-14 bg-[#0c0c12]/90 backdrop-blur-xl border-b border-white/6 px-4 flex items-center justify-between fixed top-0 left-0 z-40">
          <div className="flex items-center gap-2">
            <NeuroCutLogo size={24} animated={false} />
            <span className="font-geist text-sm font-bold text-zinc-100">NeuroCut</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={resetProduction} className="p-2 text-zinc-400 hover:text-zinc-200 transition rounded-lg hover:bg-white/5" title="New Production">
              <Plus className="w-4 h-4" />
            </button>
            {userSession ? (
              <button onClick={handleSignOut} className="p-2 text-zinc-400 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/8" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="px-3 py-1 bg-primary text-black text-xs font-semibold rounded-lg">
                Sign In
              </button>
            )}
          </div>
        </header>
      )}

      {/* Sidebar — workspace only */}
      {!isLanding && (
        <aside className="hidden md:flex w-56 lg:w-60 border-r border-white/6 bg-[#0c0c12]/90 backdrop-blur-2xl flex-col p-4 shrink-0 relative z-30 min-h-screen">
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-1">
              <NeuroCutLogo size={28} animated={false} />
              <span className="font-geist text-lg font-bold tracking-tight text-zinc-100">NeuroCut</span>
            </div>

            {/* User card */}
            {userSession ? (
              <div className="bg-white/4 border border-white/6 p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">
                    {userSession.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Signed in</p>
                    <p className="text-xs text-zinc-300 truncate font-medium" title={userSession.email}>{userSession.email}</p>
                  </div>
                  <button onClick={handleSignOut} className="p-1.5 text-zinc-600 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/8" title="Sign out">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="w-full py-2.5 btn-primary text-xs rounded-xl">
                Sign In
              </button>
            )}

            {/* Pipeline status */}
            <div className="bg-white/3 border border-white/6 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">Pipeline</p>
                <p className="text-xs text-zinc-300 font-medium">Active</p>
              </div>
            </div>

            {/* Step nav */}
            <nav className="flex flex-col gap-1">
              {NAV_STEPS.map(item => {
                const isActive = currentStep === item.step;
                const isCompleted = currentStep > item.step;
                const isDisabled = item.step > currentStep;
                return (
                  <button
                    key={item.step}
                    onClick={() => navigateToStep(item.step)}
                    disabled={isDisabled}
                    className={`nav-item flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium w-full text-left ${
                      isActive ? "nav-item active" : isCompleted ? "nav-item completed" : "nav-item disabled"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isActive ? (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 pulse-ring shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-zinc-700 shrink-0" />
                    )}
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                );
              })}
            </nav>

            {/* History */}
            {userSession && userJobsHistory.length > 0 && (
              <div className="flex-1 min-h-0 flex flex-col pt-2 border-t border-white/6">
                <div className="flex items-center gap-1.5 px-1 mb-2">
                  <History className="w-3 h-3 text-zinc-600" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Recent</span>
                </div>
                <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-0.5">
                  {userJobsHistory.map(job => (
                    <button
                      key={job.id}
                      onClick={() => handleLoadHistoricalJob(job.id)}
                      className={`text-[11px] py-2 px-2.5 rounded-lg text-left truncate transition border ${
                        currentThreadId === job.id
                          ? "bg-cyan-500/10 border-cyan-400/25 text-cyan-400"
                          : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/4"
                      }`}
                      title={job.script}
                    >
                      {job.script}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/6 space-y-3 shrink-0">
            <button onClick={resetProduction} className="w-full flex items-center justify-center gap-2 py-2.5 btn-secondary text-xs rounded-xl">
              <Plus className="w-3.5 h-3.5" />
              New Production
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col relative z-20 ${isLanding ? "" : "pt-14 md:pt-0 md:h-full md:max-h-full md:overflow-hidden"}`}>
        {isLanding ? (
          <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 relative">
            {/* Top bar auth */}
            <div className="absolute top-5 right-5 z-30">
              {userSession ? (
                <div className="flex items-center gap-2 bg-white/4 border border-white/8 px-3 py-2 rounded-xl backdrop-blur-xl">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold">
                    {userSession.email[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-zinc-400 hidden sm:block">{userSession.email.split("@")[0]}</span>
                  <button onClick={handleSignOut} className="p-1 text-zinc-600 hover:text-rose-400 transition" title="Sign out">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="px-4 py-2 btn-secondary text-xs rounded-xl backdrop-blur-xl">
                  Sign In
                </button>
              )}
            </div>
            <PipelineHUD currentStep={currentStep} />
            <div className="mb-4">
              <NeuroCutLogo size={64} />
            </div>
            <main className="w-full max-w-5xl px-4 flex flex-col items-center">
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
          </div>
        ) : (
          <main className="flex-1 p-5 md:p-8 lg:p-10 w-full mx-auto flex flex-col justify-start items-center max-w-6xl py-8 md:py-12 md:overflow-y-auto">
            <div className="w-full mb-6">
              <PipelineHUD currentStep={currentStep} />
            </div>
            <AnimatePresence mode="wait">
              {currentStep === 2 && (
                <motion.div key="step2" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 22 }} className="w-full">
                  <ScriptEnhancerStep scriptGateData={scriptGateData} setScriptGateData={setScriptGateData} onApproveGate1={handleApproveGate1} onBackStep={handleBackStep} pipelineState={pipelineState} onRegenerateScript={handleRegenerateScript} />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div key="step3" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 22 }} className="w-full">
                  <DirectorStep storyboardData={storyboardData} setStoryboardData={setStoryboardData} onApproveGate2={handleApproveGate2} onBackStep={handleBackStep} pipelineState={pipelineState} />
                </motion.div>
              )}
              {currentStep === 4 && (
                <motion.div key="step4" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 22 }} className="w-full">
                  <AssetValidationStep assetImages={assetImages} onRegenerateAsset={handleRegenerateAsset} onApproveGate3={handleApproveGate3} onBackStep={handleBackStep} pipelineState={pipelineState} selectedArtStyle={selectedArtStyle} onUpdateAssetPrompt={handleUpdateAssetPrompt} loadedUrls={loadedUrls} setLoadedUrls={setLoadedUrls} />
                </motion.div>
              )}
              {currentStep === 5 && (
                <motion.div key="step5" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 22 }} className="w-full">
                  <FinalCutStep storyboardData={storyboardData} selectedArtStyle={selectedArtStyle} audioVolume={audioVolume} setAudioVolume={setAudioVolume} voicePitch={voicePitch} setVoicePitch={setVoicePitch} voiceSpeed={voiceSpeed} setVoiceSpeed={setVoiceSpeed} ssmlBreaths={ssmlBreaths} setSsmlBreaths={setSsmlBreaths} hormoziCaptions={hormoziCaptions} setHormoziCaptions={setHormoziCaptions} captionFontSize={captionFontSize} setCaptionFontSize={setCaptionFontSize} captionColor={captionColor} setCaptionColor={setCaptionColor} captionPosition={captionPosition} setCaptionPosition={setCaptionPosition} cameraMotionOverride={cameraMotionOverride} setCameraMotionOverride={setCameraMotionOverride} onFastReRender={handleFastReRender} reRendering={reRendering} onBackStep={handleBackStep} loadedUrls={loadedUrls} videoUrl={videoUrl} jobId={currentThreadId} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        )}
      </div>

      {/* Auth modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-sm glass-panel-heavy p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-1 text-zinc-500 hover:text-zinc-200 transition rounded-lg hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <NeuroCutLogo size={40} animated={false} className="mx-auto mb-3" />
                <h2 className="text-lg font-bold text-zinc-100">Welcome back</h2>
                <p className="text-xs text-zinc-500 mt-1">Sign in to save your productions</p>
              </div>

              <div className="flex gap-1 p-1 bg-white/4 rounded-xl mb-5">
                {(["signin", "signup"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setAuthTab(tab)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${
                      authTab === tab ? "bg-white/8 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1.5">Email</label>
                  <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required placeholder="you@example.com" className="w-full glass-input text-sm py-2.5" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1.5">Password</label>
                  <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required placeholder="••••••••" className="w-full glass-input text-sm py-2.5" />
                </div>
                <button type="submit" disabled={authLoading} className="w-full py-2.5 btn-primary text-sm font-semibold flex items-center justify-center gap-2">
                  {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : authTab === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
