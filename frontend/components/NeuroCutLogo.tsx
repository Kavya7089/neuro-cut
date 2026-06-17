"use client";

import React from "react";

interface NeuroCutLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function NeuroCutLogo({ className = "", size = 48, animated = true }: NeuroCutLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${animated ? "animate-float" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      {animated && (
        <div
          className="absolute inset-0 rounded-full logo-orbit opacity-30"
          style={{
            background: "conic-gradient(from 0deg, transparent, rgba(34,211,238,0.4), transparent, rgba(167,139,250,0.3), transparent)",
            transform: "scale(1.35)",
          }}
        />
      )}
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
        style={{ filter: "drop-shadow(0 0 12px rgba(34,211,238,0.35))" }}
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <path
          d="M30 20 L70 20 L80 50 L70 80 L30 80 L20 50 Z"
          fill="none"
          stroke="url(#logoGrad)"
          strokeWidth="3.5"
        />
        <path d="M42 38 L65 50 L42 62 Z" fill="url(#logoGrad)" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" />
      </svg>
    </div>
  );
}
