"use client";

import React from "react";
import Image from "next/image";

interface PageLoaderProps {
  label?: string;
}

export default function PageLoader({ label = "Loading system portal..." }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none delay-700" />

      {/* Main Animated Loader Card */}
      <div className="relative bg-white/90 border-2 border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)] backdrop-blur-md flex flex-col items-center justify-center gap-6 max-w-sm w-full text-center">
        
        {/* Animated Brand Graphic */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer Multi-color Rotating Orbit Rings */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 border-r-amber-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-blue-600 border-l-emerald-500 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
          
          {/* Center Pulsing Logo Container */}
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center p-2 transform animate-bounce [animation-duration:2s]">
            <Image
              src="/fhi.png"
              alt="Filipino Homes"
              width={50}
              height={50}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Fun Bouncing Typing Loader Dots & Label */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-bounce [animation-delay:0ms]" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce [animation-delay:450ms]" />
          </div>

          <p className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
            {label}
          </p>
          <span className="text-[11px] font-semibold text-slate-400 block">
            FHI Global Property LLC
          </span>
        </div>
      </div>
    </div>
  );
}
