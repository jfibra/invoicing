"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Layers,
  Palette,
  Type,
  Sliders,
  Image as ImageIcon,
  RotateCcw,
  ShieldCheck,
  Award,
  Crown,
  Star,
  Building,
  CheckCircle2,
  Lock,
  Bookmark,
  Printer,
  ChevronRight,
  ArrowLeft,
  Stamp,
  SlidersHorizontal,
} from "lucide-react";

export type StampTemplateId =
  | "slanted_banner"
  | "royal_crown"
  | "serrated_badge"
  | "pill_ribbon"
  | "star_medallion"
  | "rubber_stamp"
  | "luxury_gold";

interface StampConfig {
  template: StampTemplateId;
  topText: string;
  bottomText: string;
  centerText: string;
  subText: string;
  iconType: "crown" | "star" | "shield" | "building" | "check" | "lock" | "diamond" | "custom_logo" | "none";
  colorPreset: string;
  customColor: string;
  bannerAngle: number;
  grungeIntensity: number; // 0 to 100
  outerRingStyle: "double" | "serrated" | "dashed" | "solid" | "dots";
  starCount: number;
  letterSpacing: number;
  fontSizeScale: number;
  ringThickness: number;
  customLogoUrl: string | null;
  invertColors: boolean;
  transparentBackground: boolean;
}

const DEFAULT_CONFIG: StampConfig = {
  template: "slanted_banner",
  topText: "GOLD MEMBER",
  bottomText: "GOLD MEMBER",
  centerText: "GOLD MEMBER",
  subText: "OFFICIAL 2026",
  iconType: "star",
  colorPreset: "#0F172A",
  customColor: "#0F172A",
  bannerAngle: -6,
  grungeIntensity: 0,
  outerRingStyle: "double",
  starCount: 6,
  letterSpacing: 2.2,
  fontSizeScale: 1.0,
  ringThickness: 5,
  customLogoUrl: "/fhi.png",
  invertColors: false,
  transparentBackground: true,
};

const TEMPLATE_PRESETS: {
  id: StampTemplateId;
  name: string;
  subtitle: string;
  badge: string;
  defaultConfig: Partial<StampConfig>;
}[] = [
  {
    id: "slanted_banner",
    name: "Slanted Banner Member",
    subtitle: "Dynamic angled ribbon with circular star rim",
    badge: "Most Popular",
    defaultConfig: {
      template: "slanted_banner",
      topText: "GOLD MEMBER",
      bottomText: "GOLD MEMBER",
      centerText: "GOLD MEMBER",
      subText: "FHI DUBAI",
      iconType: "star",
      bannerAngle: -8,
      outerRingStyle: "double",
      starCount: 6,
      colorPreset: "#0F172A",
    },
  },
  {
    id: "royal_crown",
    name: "Royal Crown VIP Seal",
    subtitle: "Ornate crown seal with circular VIP text & stars",
    badge: "Executive",
    defaultConfig: {
      template: "royal_crown",
      topText: "VIP MEMBER",
      bottomText: "VIP MEMBER",
      centerText: "VIP",
      subText: "MEMBERS ONLY",
      iconType: "crown",
      bannerAngle: 0,
      outerRingStyle: "double",
      starCount: 8,
      colorPreset: "#0F172A",
    },
  },
  {
    id: "serrated_badge",
    name: "Serrated Starburst Badge",
    subtitle: "Notched starburst ribbon edge with dual concentric rings",
    badge: "Official Certificate",
    defaultConfig: {
      template: "serrated_badge",
      topText: "VIP MEMBER",
      bottomText: "VIP MEMBER",
      centerText: "VIP MEMBER",
      subText: "CERTIFIED 2026",
      iconType: "star",
      bannerAngle: 0,
      outerRingStyle: "serrated",
      starCount: 6,
      colorPreset: "#DC2626",
    },
  },
  {
    id: "pill_ribbon",
    name: "Pill Ribbon Overlay",
    subtitle: "Smooth rounded rectangular banner crossing circular seal",
    badge: "Corporate",
    defaultConfig: {
      template: "pill_ribbon",
      topText: "GOLD MEMBER",
      bottomText: "GOLD MEMBER",
      centerText: "GOLD MEMBER",
      subText: "AUTHENTICATED",
      iconType: "star",
      bannerAngle: 0,
      outerRingStyle: "double",
      starCount: 6,
      colorPreset: "#0F172A",
    },
  },
  {
    id: "star_medallion",
    name: "Five-Star Medallion",
    subtitle: "Bold circular badge with central prominent star symbol",
    badge: "Award Badge",
    defaultConfig: {
      template: "star_medallion",
      topText: "GOLD MEMBER",
      bottomText: "GOLD MEMBER",
      centerText: "★",
      subText: "TOP PERFORMER",
      iconType: "star",
      bannerAngle: 0,
      outerRingStyle: "serrated",
      starCount: 4,
      colorPreset: "#D97706",
    },
  },
  {
    id: "rubber_stamp",
    name: "Official Ink Rubber Stamp",
    subtitle: "Distressed office stamp with date & reference lines",
    badge: "Verification",
    defaultConfig: {
      template: "rubber_stamp",
      topText: "FHI GLOBAL PROPERTY",
      bottomText: "OFFICIAL APPROVAL • DUBAI",
      centerText: "PAID",
      subText: "18 AUG 2026",
      iconType: "check",
      bannerAngle: -10,
      grungeIntensity: 35,
      outerRingStyle: "double",
      starCount: 4,
      colorPreset: "#DC2626",
    },
  },
  {
    id: "luxury_gold",
    name: "Luxury Gold Foil Seal",
    subtitle: "Golden luxury seal with official company logo center",
    badge: "Premium Foil",
    defaultConfig: {
      template: "luxury_gold",
      topText: "FHI GLOBAL PROPERTY DUBAI",
      bottomText: "COMMISSION CLEARED • 2026",
      centerText: "VERIFIED",
      subText: "VIP PARTNER",
      iconType: "custom_logo",
      bannerAngle: 0,
      outerRingStyle: "double",
      starCount: 8,
      colorPreset: "#D97706",
    },
  },
];

const COLOR_PRESETS = [
  { label: "Deep Navy", hex: "#0F172A" },
  { label: "Crimson Red", hex: "#DC2626" },
  { label: "Luxury Gold", hex: "#D97706" },
  { label: "Emerald Green", hex: "#059669" },
  { label: "Royal Blue", hex: "#2563EB" },
  { label: "Classic Black", hex: "#111827" },
  { label: "Burgundy", hex: "#831843" },
  { label: "Vintage Cyan", hex: "#0891B2" },
];

export default function StampGeneratorPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [config, setConfig] = useState<StampConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);
  const [loadedCustomLogo, setLoadedCustomLogo] = useState<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "text" | "graphics" | "style">("templates");

  // Load custom logo image when customLogoUrl changes
  useEffect(() => {
    if (!config.customLogoUrl) {
      setLoadedCustomLogo(null);
      return;
    }
    const img = new (window as any).Image();
    img.src = config.customLogoUrl;
    img.onload = () => setLoadedCustomLogo(img);
    img.onerror = () => setLoadedCustomLogo(null);
  }, [config.customLogoUrl]);

  // Canvas Drawing Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 1000;
    canvas.width = size;
    canvas.height = size;

    // Clear Canvas
    ctx.clearRect(0, 0, size, size);

    if (!config.transparentBackground) {
      ctx.fillStyle = config.invertColors ? config.customColor : "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
    }

    const cx = size / 2;
    const cy = size / 2;
    const primaryColor = config.invertColors ? "#FFFFFF" : config.customColor;
    const contrastColor = config.invertColors ? config.customColor : "#FFFFFF";

    ctx.fillStyle = primaryColor;
    ctx.strokeStyle = primaryColor;

    // Helper: Draw Star
    const drawStar = (
      x: number,
      y: number,
      spikes: number,
      outerR: number,
      innerR: number,
      fill: boolean = true
    ) => {
      let rot = (Math.PI / 2) * 3;
      let step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(x, y - outerR);
      for (let i = 0; i < spikes; i++) {
        let sx = x + Math.cos(rot) * outerR;
        let sy = y + Math.sin(rot) * outerR;
        ctx.lineTo(sx, sy);
        rot += step;

        sx = x + Math.cos(rot) * innerR;
        sy = y + Math.sin(rot) * innerR;
        ctx.lineTo(sx, sy);
        rot += step;
      }
      ctx.lineTo(x, y - outerR);
      ctx.closePath();
      if (fill) ctx.fill();
      else ctx.stroke();
    };

    // Helper: Draw Serrated Saw-Tooth Starburst Rim
    const drawSerratedRim = (x: number, y: number, points: number, outerR: number, innerR: number) => {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    };

    // Helper: Draw Curved Text Along Circle Path
    const drawCurvedText = (
      text: string,
      radius: number,
      isTop: boolean,
      font: string = "bold 44px sans-serif"
    ) => {
      if (!text || text.trim() === "") return;
      ctx.save();
      ctx.font = font;
      ctx.fillStyle = primaryColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const chars = text.split("");
      const spacingMultiplier = (config.letterSpacing || 2.0) * 0.04;
      const charWidths = chars.map((c) => ctx.measureText(c).width + 8);
      const totalArcLength = charWidths.reduce((a, b) => a + b, 0) * spacingMultiplier;
      const totalAngle = totalArcLength / radius;

      let currentAngle = isTop
        ? -Math.PI / 2 - totalAngle / 2
        : Math.PI / 2 + totalAngle / 2;

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const charArc = (charWidths[i] * spacingMultiplier) / radius;

        if (isTop) {
          currentAngle += charArc / 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(currentAngle + Math.PI / 2);
          ctx.fillText(char, 0, -radius);
          ctx.restore();
          currentAngle += charArc / 2;
        } else {
          currentAngle -= charArc / 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(currentAngle - Math.PI / 2);
          ctx.fillText(char, 0, radius);
          ctx.restore();
          currentAngle -= charArc / 2;
        }
      }
      ctx.restore();
    };

    // 1. Draw Outer Border & Background Shapes
    const maxRadius = 450;

    if (config.outerRingStyle === "serrated" || config.template === "serrated_badge" || config.template === "star_medallion") {
      drawSerratedRim(cx, cy, 40, maxRadius, maxRadius - 25);
      // Inner cut out circle
      ctx.fillStyle = contrastColor;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius - 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = primaryColor;
    }

    // Outer Thick Ring
    ctx.lineWidth = config.ringThickness * 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius - 40, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Secondary Ring
    ctx.lineWidth = Math.max(2, config.ringThickness * 0.8);
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius - 60, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Medallion Border
    const innerMedallionR = 250;
    ctx.lineWidth = config.ringThickness * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, innerMedallionR, 0, Math.PI * 2);
    ctx.stroke();

    // Ring of Orbiting Stars
    if (config.starCount > 0) {
      const starOrbitR = 300;
      const numStars = config.starCount;
      const starPositions = [
        ...Array.from({ length: numStars / 2 }).map((_, i) => -Math.PI + (i + 1) * (Math.PI / (numStars / 2 + 1))),
        ...Array.from({ length: numStars / 2 }).map((_, i) => 0 + (i + 1) * (Math.PI / (numStars / 2 + 1))),
      ];
      starPositions.forEach((ang) => {
        const sx = cx + Math.cos(ang) * starOrbitR;
        const sy = cy + Math.sin(ang) * starOrbitR;
        drawStar(sx, sy, 5, 14, 6, true);
      });
    }

    // 2. Render Curved Top & Bottom Texts
    const textR = 350;
    const curvedFont = `900 ${Math.round(42 * config.fontSizeScale)}px "Arial Black", Impact, sans-serif`;
    drawCurvedText(config.topText, textR, true, curvedFont);
    drawCurvedText(config.bottomText, textR, false, curvedFont);

    // Flanking Stars around curved text
    drawStar(cx - 370, cy, 5, 18, 8, true);
    drawStar(cx - 405, cy, 5, 12, 5, true);
    drawStar(cx + 370, cy, 5, 18, 8, true);
    drawStar(cx + 405, cy, 5, 12, 5, true);

    // 3. Center Medallion Graphics / Banner Handling
    if (config.template === "slanted_banner" || config.template === "pill_ribbon" || config.bannerAngle !== 0) {
      // Draw Angled or Straight Horizontal Banner
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((config.bannerAngle * Math.PI) / 180);

      const bannerW = 880;
      const bannerH = 130;
      const cornerR = config.template === "pill_ribbon" ? 45 : 12;

      // Banner Outer Mask / Cutout Background
      ctx.fillStyle = contrastColor;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2 - 12, -bannerH / 2 - 12, bannerW + 24, bannerH + 24, [cornerR + 6]);
      ctx.fill();

      // Banner Solid Fill
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, [cornerR]);
      ctx.fill();

      // Banner Inner Border Line
      ctx.strokeStyle = contrastColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2 + 10, -bannerH / 2 + 10, bannerW - 20, bannerH - 20, [Math.max(4, cornerR - 6)]);
      ctx.stroke();

      // Banner Headline Text
      ctx.fillStyle = contrastColor;
      ctx.font = `900 ${Math.round(64 * config.fontSizeScale)}px "Arial Black", Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.centerText, 0, 0);

      ctx.restore();
    } else if (config.template === "royal_crown" || config.iconType === "crown") {
      // Royal Crown & Big VIP Text
      ctx.save();
      ctx.fillStyle = primaryColor;

      // Draw Vector Crown
      const crownY = cy - 80;
      ctx.beginPath();
      ctx.moveTo(cx - 80, crownY + 40);
      ctx.lineTo(cx - 100, crownY - 20);
      ctx.lineTo(cx - 40, crownY);
      ctx.lineTo(cx, crownY - 45);
      ctx.lineTo(cx + 40, crownY);
      ctx.lineTo(cx + 100, crownY - 20);
      ctx.lineTo(cx + 80, crownY + 40);
      ctx.closePath();
      ctx.fill();

      // Crown Jewels / Circles on tips
      ctx.beginPath();
      ctx.arc(cx - 100, crownY - 25, 7, 0, Math.PI * 2);
      ctx.arc(cx, crownY - 52, 9, 0, Math.PI * 2);
      ctx.arc(cx + 100, crownY - 25, 7, 0, Math.PI * 2);
      ctx.fill();

      // Crown Band Jewels
      ctx.fillStyle = contrastColor;
      ctx.fillRect(cx - 65, crownY + 22, 130, 8);

      // Center VIP Headline
      ctx.fillStyle = primaryColor;
      ctx.font = `900 ${Math.round(92 * config.fontSizeScale)}px "Arial Black", Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.centerText, cx, cy + 45);

      // Subtext
      if (config.subText) {
        ctx.font = `bold 22px sans-serif`;
        ctx.fillText(config.subText, cx, cy + 115);
      }
      ctx.restore();
    } else if (config.template === "star_medallion") {
      // Big 5-Point Center Star
      ctx.fillStyle = primaryColor;
      drawStar(cx, cy - 10, 5, 120, 52, true);

      // Center Subtext below star
      if (config.subText) {
        ctx.font = `bold 24px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(config.subText, cx, cy + 140);
      }
    } else if (config.iconType === "custom_logo" && loadedCustomLogo) {
      // Custom Uploaded Logo Medallion
      const maxLogoSize = 260;
      const aspect = loadedCustomLogo.width / loadedCustomLogo.height;
      let lw = maxLogoSize;
      let lh = maxLogoSize / aspect;
      if (lh > maxLogoSize) {
        lh = maxLogoSize;
        lw = maxLogoSize * aspect;
      }
      ctx.drawImage(loadedCustomLogo, cx - lw / 2, cy - lh / 2 - 20, lw, lh);

      // Center Headline below Logo
      ctx.fillStyle = primaryColor;
      ctx.font = `900 ${Math.round(38 * config.fontSizeScale)}px "Arial Black", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(config.centerText, cx, cy + 130);
    } else {
      // Default Center Layout: Center Headline + Subtext
      ctx.fillStyle = primaryColor;
      ctx.font = `900 ${Math.round(72 * config.fontSizeScale)}px "Arial Black", Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.centerText, cx, cy - 10);

      // Subtext Divider Line
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 140, cy + 55);
      ctx.lineTo(cx + 140, cy + 55);
      ctx.stroke();

      if (config.subText) {
        ctx.font = `bold 24px monospace`;
        ctx.fillText(config.subText, cx, cy + 90);
      }
    }

    // 4. Distressed / Vintage Ink Rubber Stamp Grunge Effect
    if (config.grungeIntensity > 0) {
      ctx.save();
      const intensity = config.grungeIntensity / 100;
      const numSpecks = Math.floor(600 * intensity);
      ctx.fillStyle = contrastColor;

      // Random ink voids / specks
      for (let i = 0; i < numSpecks; i++) {
        const gx = Math.random() * size;
        const gy = Math.random() * size;
        const gw = Math.random() * 6 + 1;
        const gh = Math.random() * 6 + 1;
        ctx.beginPath();
        ctx.arc(gx, gy, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Horizontal micro scratch lines
      for (let i = 0; i < Math.floor(40 * intensity); i++) {
        const lx = Math.random() * (size - 100) + 50;
        const ly = Math.random() * (size - 100) + 50;
        const len = Math.random() * 60 + 10;
        ctx.fillRect(lx, ly, len, Math.random() * 2 + 1);
      }
      ctx.restore();
    }
  }, [config, loadedCustomLogo]);

  // Handle Preset Select
  const handleSelectTemplate = (preset: (typeof TEMPLATE_PRESETS)[0]) => {
    setConfig((prev) => ({
      ...prev,
      ...preset.defaultConfig,
      template: preset.id,
      customColor: preset.defaultConfig.colorPreset || prev.customColor,
    }));
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setConfig((prev) => ({
          ...prev,
          customLogoUrl: event.target?.result as string,
          iconType: "custom_logo",
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Download Transparent PNG
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `stamp_${config.template}_${Date.now()}.png`;
    a.click();
  };

  // Copy Canvas Image to Clipboard
  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) {
      console.error("Copy to clipboard failed:", e);
      alert("Please right click the stamp and choose 'Copy Image'.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <HeaderNav />

      {/* SUB-HEADER BREADCRUMB */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kiosk Hub</span>
            </Link>
            <div className="h-4 w-px bg-slate-300 mx-1" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                <Stamp className="w-4 h-4" />
              </div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Stamp & Seal Badge Generator
              </h1>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Interactive Canvas
              </span>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyToClipboard}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied PNG!" : "Copy Image"}</span>
            </button>
            <button
              onClick={handleDownloadPNG}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download High-Res PNG</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN TWO-COLUMN STUDIO WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: LIVE CANVAS PREVIEW & PRESET CAROUSEL (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Canvas Display Card with Checkerboard Transparency Backdrop */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                1000 × 1000 px • Transparent PNG
              </span>
            </div>

            {/* Checkerboard Background for Transparency Viewing */}
            <div
              className="w-full max-w-[420px] aspect-square rounded-2xl p-4 flex items-center justify-center shadow-inner border border-slate-200 relative"
              style={{
                backgroundImage:
                  "radial-gradient(#CBD5E1 1px, transparent 1px), radial-gradient(#CBD5E1 1px, #F8FAFC 1px)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px",
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain drop-shadow-xl transition-all"
                style={{ imageRendering: "crisp-edges" }}
              />
            </div>

            {/* Canvas Quick Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                onClick={handleDownloadPNG}
                className="flex-1 min-w-[140px] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-red-400" />
                <span>Save Transparent PNG</span>
              </button>
              <button
                onClick={() => setConfig(DEFAULT_CONFIG)}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* TEMPLATE PRESET PICKER */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-sm text-slate-900">Choose Stamp / Seal Style</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">7 Presets Available</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATE_PRESETS.map((p) => {
                const isSelected = config.template === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectTemplate(p)}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-red-600 bg-red-50/50 shadow-xs ring-2 ring-red-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{p.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CUSTOMIZATION STUDIO (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            {/* Customization Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <button
                onClick={() => setActiveTab("text")}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "text"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Text & Labels</span>
              </button>
              <button
                onClick={() => setActiveTab("graphics")}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "graphics"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Logo & Icons</span>
              </button>
              <button
                onClick={() => setActiveTab("style")}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "style"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Color & Effects</span>
              </button>
            </div>

            {/* TAB 1: TEXT & LABELS */}
            {activeTab === "text" && (
              <div className="space-y-5">
                {/* Top Curved Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Curved Top Header Text</span>
                    <span className="text-[11px] text-slate-400 font-normal">Upper Circular Arc</span>
                  </label>
                  <input
                    type="text"
                    value={config.topText}
                    onChange={(e) => setConfig({ ...config, topText: e.target.value })}
                    placeholder="e.g. GOLD MEMBER / FHI GLOBAL PROPERTY"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Center Main Headline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Center Banner / Main Text</span>
                    <span className="text-[11px] text-slate-400 font-normal">Primary Headline</span>
                  </label>
                  <input
                    type="text"
                    value={config.centerText}
                    onChange={(e) => setConfig({ ...config, centerText: e.target.value })}
                    placeholder="e.g. VIP MEMBER / PAID / APPROVED"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Bottom Curved Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Curved Bottom Footer Text</span>
                    <span className="text-[11px] text-slate-400 font-normal">Lower Circular Arc</span>
                  </label>
                  <input
                    type="text"
                    value={config.bottomText}
                    onChange={(e) => setConfig({ ...config, bottomText: e.target.value })}
                    placeholder="e.g. MEMBERS ONLY / DUBAI UAE / 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Center Subtext / Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Center Subtext / Ref / Date</span>
                    <span className="text-[11px] text-slate-400 font-normal">Secondary Line</span>
                  </label>
                  <input
                    type="text"
                    value={config.subText}
                    onChange={(e) => setConfig({ ...config, subText: e.target.value })}
                    placeholder="e.g. 18 AUG 2026 / REF: LR-DXB-3627"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Font Scaling & Letter Spacing Sliders */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Font Size Scale</span>
                      <span>{Math.round(config.fontSizeScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.05"
                      value={config.fontSizeScale}
                      onChange={(e) => setConfig({ ...config, fontSizeScale: parseFloat(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Curved Letter Spacing</span>
                      <span>{config.letterSpacing.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="4.5"
                      step="0.1"
                      value={config.letterSpacing}
                      onChange={(e) => setConfig({ ...config, letterSpacing: parseFloat(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOGO & ICONS */}
            {activeTab === "graphics" && (
              <div className="space-y-5">
                
                {/* Center Graphic Mode Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Center Icon / Graphic Style</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { id: "star", label: "Star", icon: Star },
                      { id: "crown", label: "Crown", icon: Crown },
                      { id: "shield", label: "Shield", icon: ShieldCheck },
                      { id: "building", label: "Building", icon: Building },
                      { id: "check", label: "Approved", icon: CheckCircle2 },
                      { id: "lock", label: "Lock", icon: Lock },
                      { id: "custom_logo", label: "Custom Logo", icon: ImageIcon },
                      { id: "none", label: "Text Only", icon: Type },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setConfig({ ...config, iconType: item.id as any })}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          config.iconType === item.id
                            ? "bg-red-50 border-red-500 text-red-600 font-bold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-[11px]">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Logo Upload Section */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Company / Agent Logo Upload</span>
                    <button
                      onClick={() => setConfig({ ...config, customLogoUrl: "/fhi.png", iconType: "custom_logo" })}
                      className="text-[11px] text-red-600 hover:underline font-bold"
                    >
                      Use Official FHI Logo
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Logo PNG/JPG</span>
                    </button>

                    {config.customLogoUrl && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Logo Loaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Outer Ring Stars Counter */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Orbiting Decorative Stars</span>
                    <span>{config.starCount} Stars</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="16"
                    step="2"
                    value={config.starCount}
                    onChange={(e) => setConfig({ ...config, starCount: parseInt(e.target.value) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: COLOR & EFFECTS */}
            {activeTab === "style" && (
              <div className="space-y-6">
                
                {/* Color Swatches */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-700">Ink Color Palette</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setConfig({ ...config, customColor: c.hex, colorPreset: c.hex })}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                          config.customColor === c.hex
                            ? "border-slate-900 bg-slate-50 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-xs shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[11px] font-bold text-slate-800 truncate">{c.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Hex Color Input */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-slate-500 font-medium">Custom Color:</span>
                    <input
                      type="color"
                      value={config.customColor}
                      onChange={(e) => setConfig({ ...config, customColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={config.customColor}
                      onChange={(e) => setConfig({ ...config, customColor: e.target.value })}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                {/* Banner Angle Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Banner Slant / Tilt Angle</span>
                    <span>{config.bannerAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="1"
                    value={config.bannerAngle}
                    onChange={(e) => setConfig({ ...config, bannerAngle: parseInt(e.target.value) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Vintage Ink Rubber Stamp Grunge Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Distressed Vintage Ink / Grunge Texture</span>
                    <span>{config.grungeIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={config.grungeIntensity}
                    onChange={(e) => setConfig({ ...config, grungeIntensity: parseInt(e.target.value) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400">
                    Simulates authentic weathered rubber stamp ink specks and vintage paper transfer voids.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
