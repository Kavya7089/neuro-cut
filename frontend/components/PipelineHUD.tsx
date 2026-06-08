"use client";

import React from "react";
import { motion } from "framer-motion";

interface PipelineHUDProps {
  currentStep: number; // 1 to 5
}

const PIPELINE_STAGES = [
  { step: 1, label: "INGESTION" },
  { step: 2, label: "SCRIPTING" },
  { step: 3, label: "STORYBOARDING" },
  { step: 4, label: "ASSET FORGING" },
  { step: 5, label: "SYNTHESIS" }
];

export default function PipelineHUD({ currentStep }: PipelineHUDProps) {
  return (
    <div className="w-full flex justify-center py-6 relative z-30">
      
      {/* Floating weightless glass bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="glass-panel px-8 py-5 flex flex-wrap justify-center items-center gap-4 sm:gap-6 shadow-xl"
      >
        
        {PIPELINE_STAGES.map((stage, idx) => {
          const isActive = currentStep === stage.step;
          const isCompleted = currentStep > stage.step;

          return (
            <React.Fragment key={stage.step}>
              
              {/* Connector line between chips */}
              {idx > 0 && (
                <div className={`w-4 ${isCompleted || isActive ? 'h-0.5 bg-primary/60' : 'h-px bg-white/10'}`} />
              )}

              {/* Stage Chip */}
              <div 
                className={`flex items-center gap-2.5 font-mono text-[10px] sm:text-xs tracking-widest uppercase transition-all duration-300 ${
                  isCompleted 
                    ? "text-success" 
                    : isActive 
                    ? "text-neon-cyan font-bold" 
                    : "text-zinc-600"
                }`}
              >
                {/* Status Dot */}
                {isCompleted ? (
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)] rotate-45" />
                ) : isActive ? (
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-primary shadow-[0_0_15px_rgba(0,240,255,0.8)] rotate-45 animate-pulse" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-[2px] border border-white/10 rotate-45" />
                )}
                
                <span>{stage.label}</span>
              </div>

            </React.Fragment>
          );
        })}

      </motion.div>
      
    </div>
  );
}
