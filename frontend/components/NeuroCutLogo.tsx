"use client";

import React from "react";

interface NeuroCutLogoProps {
  className?: string;
  size?: number;
}

export default function NeuroCutLogo({ className = "", size = 48 }: NeuroCutLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
      >
        <defs>
          <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#06b6d4", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#22d3ee", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Hexagon Outer Ring */}
        <path
          d="M30 20 L70 20 L80 50 L70 80 L30 80 L20 50 Z"
          fill="none"
          stroke="url(#cyanGrad)"
          strokeWidth="4"
        />
        {/* Inner Play Triangle */}
        <path d="M42 38 L65 50 L42 62 Z" fill="url(#cyanGrad)" />
        {/* Surrounding Thin Circle */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />
      </svg>
    </div>
  );
}
