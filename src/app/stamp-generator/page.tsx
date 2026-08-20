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
  Gem,
  CircleDot,
  Maximize2,
  Minimize2,
  Eye,
  FileCheck,
} from "lucide-react";

export type StampTemplateId =
  | "slanted_banner"
  | "royal_crown"
  | "serrated_badge"
  | "pill_ribbon"
  | "star_medallion"
  | "rubber_stamp"
  | "luxury_gold"
  | "corporate_seal";

interface StampConfig {
  template: StampTemplateId;
  topText: string;
  bottomText: string;
  centerText: string;
  subText: string;
  iconType: "crown" | "star" | "shield" | "building" | "check" | "lock" | "diamond" | "custom_logo" | "none";
  fontFamily: "sans" | "serif" | "mono" | "impact";
  colorPreset: string;
  customColor: string;
  showBanner: boolean;
  bannerAngle: number;
  bannerHeight: number;
  grungeIntensity: number; // 0 to 100
  outerRingStyle: "double" | "serrated" | "dashed" | "solid" | "dots";
  serratedPoints: number;
  starCount: number;
  letterSpacing: number;
  fontSizeScale: number;
  ringThickness: number;
  customLogoUrl: string | null;
  logoScale: number;
  logoColorMode: "original" | "monochrome";
  invertColors: boolean;
  transparentBackground: boolean;
}

const DEFAULT_CONFIG: StampConfig = {
  template: "slanted_banner",
  topText: "GOLD MEMBER",
  bottomText: "GOLD MEMBER",
  centerText: "GOLD MEMBER",
  subText: "FHI DUBAI",
  iconType: "star",
  fontFamily: "impact",
  colorPreset: "#0F172A",
  customColor: "#0F172A",
  showBanner: true,
  bannerAngle: -8,
  bannerHeight: 135,
  grungeIntensity: 0,
  outerRingStyle: "double",
  serratedPoints: 40,
  starCount: 6,
  letterSpacing: 6,
  fontSizeScale: 1.0,
  ringThickness: 5,
  customLogoUrl: "/fhi.png",
  logoScale: 1.0,
  logoColorMode: "monochrome",
  invertColors: false,
  transparentBackground: true,
};

const TEMPLATE_PRESETS: {
  id: StampTemplateId;
  name: string;
  subtitle: string;
  badge: string;
  templateProps: Partial<StampConfig>;
}[] = [
  {
    id: "slanted_banner",
    name: "Slanted Banner Member",
    subtitle: "Dynamic angled ribbon with circular star rim",
    badge: "Most Popular",
    templateProps: {
      template: "slanted_banner",
      showBanner: true,
      bannerAngle: -8,
      outerRingStyle: "double",
      starCount: 6,
      iconType: "star",
      colorPreset: "#0F172A",
    },
  },
  {
    id: "royal_crown",
    name: "Royal Crown VIP Seal",
    subtitle: "Ornate crown seal with circular text & stars",
    badge: "Executive",
    templateProps: {
      template: "royal_crown",
      showBanner: false,
      bannerAngle: 0,
      outerRingStyle: "double",
      starCount: 8,
      iconType: "crown",
      colorPreset: "#0F172A",
    },
  },
  {
    id: "serrated_badge",
    name: "Serrated Starburst Badge",
    subtitle: "Notched starburst ribbon edge with dual concentric rings",
    badge: "Official Certificate",
    templateProps: {
      template: "serrated_badge",
      showBanner: false,
      bannerAngle: 0,
      outerRingStyle: "serrated",
      serratedPoints: 42,
      starCount: 6,
      iconType: "star",
      colorPreset: "#DC2626",
    },
  },
  {
    id: "pill_ribbon",
    name: "Pill Ribbon Overlay",
    subtitle: "Smooth rounded rectangular banner crossing circular seal",
    badge: "Corporate",
    templateProps: {
      template: "pill_ribbon",
      showBanner: true,
      bannerAngle: 0,
      outerRingStyle: "double",
      starCount: 6,
      iconType: "star",
      colorPreset: "#0F172A",
    },
  },
  {
    id: "star_medallion",
    name: "Five-Star Medallion",
    subtitle: "Bold circular badge with central prominent star symbol",
    badge: "Award Badge",
    templateProps: {
      template: "star_medallion",
      showBanner: false,
      bannerAngle: 0,
      outerRingStyle: "serrated",
      serratedPoints: 36,
      starCount: 4,
      iconType: "star",
      colorPreset: "#D97706",
    },
  },
  {
    id: "rubber_stamp",
    name: "Official Ink Rubber Stamp",
    subtitle: "Distressed office stamp with date & reference lines",
    badge: "Verification",
    templateProps: {
      template: "rubber_stamp",
      showBanner: false,
      bannerAngle: -10,
      grungeIntensity: 35,
      outerRingStyle: "double",
      starCount: 4,
      iconType: "check",
      colorPreset: "#DC2626",
    },
  },
  {
    id: "luxury_gold",
    name: "Luxury Gold Foil Seal",
    subtitle: "Golden luxury seal with official company logo center",
    badge: "Premium Foil",
    templateProps: {
      template: "luxury_gold",
      showBanner: false,
      bannerAngle: 0,
      outerRingStyle: "double",
      starCount: 8,
      iconType: "custom_logo",
      colorPreset: "#D97706",
    },
  },
  {
    id: "corporate_seal",
    name: "Corporate Building Seal",
    subtitle: "Real estate headquarters official corporate seal",
    badge: "Corporate HQ",
    templateProps: {
      template: "corporate_seal",
      showBanner: false,
      bannerAngle: 0,
      outerRingStyle: "double",
      starCount: 6,
      iconType: "building",
      colorPreset: "#0F172A",
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
  const [activeTab, setActiveTab] = useState<"text" | "graphics" | "style" | "templates">("templates");

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

  // Main Canvas Drawing Routine
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

    // Determine font family string
    const fontFam =
      config.fontFamily === "serif"
        ? '"Times New Roman", Georgia, serif'
        : config.fontFamily === "mono"
        ? '"Courier New", Courier, monospace'
        : config.fontFamily === "impact"
        ? '"Arial Black", Impact, sans-serif'
        : 'system-ui, -apple-system, sans-serif';

    // Helper: Draw 5-Point Star
    const drawStar = (
      x: number,
      y: number,
      spikes: number = 5,
      outerR: number = 14,
      innerR: number = 6,
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

    // Helper: Draw Vector Icons
    const drawCenterIcon = (iconType: string, ix: number, iy: number, isize: number) => {
      ctx.save();
      ctx.fillStyle = primaryColor;
      ctx.strokeStyle = primaryColor;

      if (iconType === "crown") {
        // Royal Crown
        const w = isize * 1.6;
        const h = isize * 1.0;
        ctx.beginPath();
        ctx.moveTo(ix - w / 2, iy + h / 2);
        ctx.lineTo(ix - w / 2 - 12, iy - h / 3);
        ctx.lineTo(ix - w / 4, iy + h / 4);
        ctx.lineTo(ix, iy - h / 2);
        ctx.lineTo(ix + w / 4, iy + h / 4);
        ctx.lineTo(ix + w / 2 + 12, iy - h / 3);
        ctx.lineTo(ix + w / 2, iy + h / 2);
        ctx.closePath();
        ctx.fill();

        // Jewels on tips
        ctx.beginPath();
        ctx.arc(ix - w / 2 - 12, iy - h / 3 - 6, 6, 0, Math.PI * 2);
        ctx.arc(ix, iy - h / 2 - 7, 8, 0, Math.PI * 2);
        ctx.arc(ix + w / 2 + 12, iy - h / 3 - 6, 6, 0, Math.PI * 2);
        ctx.fill();

        // Crown Headband
        ctx.fillStyle = contrastColor;
        ctx.fillRect(ix - w / 2 + 6, iy + h / 3, w - 12, 6);
      } else if (iconType === "shield") {
        // Shield
        const w = isize * 1.1;
        const h = isize * 1.3;
        ctx.beginPath();
        ctx.moveTo(ix, iy - h / 2);
        ctx.lineTo(ix + w / 2, iy - h / 3);
        ctx.quadraticCurveTo(ix + w / 2, iy + h / 4, ix, iy + h / 2);
        ctx.quadraticCurveTo(ix - w / 2, iy + h / 4, ix - w / 2, iy - h / 3);
        ctx.closePath();
        ctx.fill();

        // Inner Checkmark or Star in shield
        ctx.fillStyle = contrastColor;
        drawStar(ix, iy - 4, 5, 20, 9, true);
      } else if (iconType === "building") {
        // Skyscraper / Corporate Towers
        const bw = isize * 0.45;
        const bh1 = isize * 1.1;
        const bh2 = isize * 0.8;
        const bh3 = isize * 0.65;

        // Center Tall Tower
        ctx.fillRect(ix - bw / 2, iy + 45 - bh1, bw, bh1);
        // Left Tower
        ctx.fillRect(ix - bw * 1.4, iy + 45 - bh2, bw * 0.8, bh2);
        // Right Tower
        ctx.fillRect(ix + bw * 0.6, iy + 45 - bh3, bw * 0.8, bh3);

        // Windows (contrast lines)
        ctx.fillStyle = contrastColor;
        for (let r = 0; r < 5; r++) {
          ctx.fillRect(ix - 12, iy + 25 - r * 16, 8, 8);
          ctx.fillRect(ix + 4, iy + 25 - r * 16, 8, 8);
        }
      } else if (iconType === "check") {
        // Circular Approved Checkmark
        ctx.beginPath();
        ctx.arc(ix, iy, isize * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = contrastColor;
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(ix - 24, iy + 2);
        ctx.lineTo(ix - 6, iy + 20);
        ctx.lineTo(ix + 26, iy - 16);
        ctx.stroke();
      } else if (iconType === "lock") {
        // Security Lock
        const lw = isize * 1.0;
        const lh = isize * 0.8;
        // Shackle
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(ix, iy - lh / 3, 26, Math.PI, 0);
        ctx.stroke();
        // Body
        ctx.beginPath();
        ctx.roundRect(ix - lw / 2, iy - lh / 4, lw, lh, [14]);
        ctx.fill();
        // Keyhole
        ctx.fillStyle = contrastColor;
        ctx.beginPath();
        ctx.arc(ix, iy + 6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(ix - 3.5, iy + 6, 7, 14);
      } else if (iconType === "diamond") {
        // Diamond / Gem
        const dw = isize * 1.2;
        const dh = isize * 0.9;
        ctx.beginPath();
        ctx.moveTo(ix - dw / 2, iy - dh / 4);
        ctx.lineTo(ix - dw / 3, iy - dh / 2);
        ctx.lineTo(ix + dw / 3, iy - dh / 2);
        ctx.lineTo(ix + dw / 2, iy - dh / 4);
        ctx.lineTo(ix, iy + dh / 2);
        ctx.closePath();
        ctx.fill();
      } else if (iconType === "star") {
        // Big 5-Point Center Star
        drawStar(ix, iy, 5, isize * 0.85, isize * 0.38, true);
      }
      ctx.restore();
    };

    // Helper: Draw Crisp Curved Text Along Circle Path
    const drawCurvedText = (
      text: string,
      radius: number,
      isTop: boolean,
      font: string
    ) => {
      if (!text || text.trim() === "") return;
      ctx.save();
      ctx.font = font;
      ctx.fillStyle = primaryColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const chars = text.split("");
      const letterSpacingPx = config.letterSpacing ?? 6;

      const charWidths = chars.map((c) => ctx.measureText(c).width + letterSpacingPx);
      const charArcs = charWidths.map((w) => w / radius);
      const totalAngle = charArcs.reduce((a, b) => a + b, 0);

      if (isTop) {
        // TOP TEXT: centered at 12 o'clock (-PI/2), moving clockwise
        let currentAngle = -Math.PI / 2 - totalAngle / 2;
        for (let i = 0; i < chars.length; i++) {
          const char = chars[i];
          const charArc = charArcs[i];
          const charAngle = currentAngle + charArc / 2;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(charAngle + Math.PI / 2);
          ctx.fillText(char, 0, -radius);
          ctx.restore();

          currentAngle += charArc;
        }
      } else {
        // BOTTOM TEXT: centered at 6 o'clock (PI/2), upright, moving left-to-right
        let currentAngle = Math.PI / 2 + totalAngle / 2;
        for (let i = 0; i < chars.length; i++) {
          const char = chars[i];
          const charArc = charArcs[i];
          const charAngle = currentAngle - charArc / 2;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(charAngle - Math.PI / 2);
          ctx.fillText(char, 0, radius);
          ctx.restore();

          currentAngle -= charArc;
        }
      }
      ctx.restore();
    };

    // ==========================================================
    // 1. OUTER RIMS & CONCENTRIC BORDERS
    // ==========================================================
    const maxRadius = 450;

    if (config.outerRingStyle === "serrated" || config.template === "serrated_badge" || config.template === "star_medallion") {
      const points = config.serratedPoints || 40;
      drawSerratedRim(cx, cy, points, maxRadius, maxRadius - 28);
      // Inner cutout circle
      ctx.fillStyle = contrastColor;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius - 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = primaryColor;
    }

    // Outer Thick Ring (r = 415)
    ctx.lineWidth = config.ringThickness * 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius - 38, 0, Math.PI * 2);
    ctx.stroke();

    // Outer Secondary Thin Ring (r = 398)
    ctx.lineWidth = Math.max(2, config.ringThickness * 0.7);
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius - 55, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Medallion Border (r = 280)
    const innerMedallionR = 280;
    ctx.lineWidth = config.ringThickness * 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, innerMedallionR, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Medallion Secondary Thin Ring (r = 262)
    ctx.lineWidth = Math.max(2, config.ringThickness * 0.7);
    ctx.beginPath();
    ctx.arc(cx, cy, innerMedallionR - 16, 0, Math.PI * 2);
    ctx.stroke();

    // ==========================================================
    // 2. CURVED TEXT RENDERING (Radius = 338)
    // ==========================================================
    const textRadius = 338;
    const curvedFont = `900 ${Math.round(48 * config.fontSizeScale)}px ${fontFam}`;
    drawCurvedText(config.topText, textRadius, true, curvedFont);
    drawCurvedText(config.bottomText, textRadius, false, curvedFont);

    // Flanking Stars on Left & Right at 9 o'clock & 3 o'clock
    drawStar(cx - textRadius, cy, 5, 16, 7, true);
    drawStar(cx - textRadius - 28, cy, 5, 11, 5, true);
    drawStar(cx + textRadius, cy, 5, 16, 7, true);
    drawStar(cx + textRadius + 28, cy, 5, 11, 5, true);

    // ==========================================================
    // 3. INNER MEDALLION GRAPHICS / BANNER / LOGO / ICONS
    // ==========================================================
    const hasBanner = config.showBanner || config.template === "slanted_banner" || config.template === "pill_ribbon";

    if (hasBanner) {
      // Orbiting decorative stars above and below the banner
      if (config.starCount > 0) {
        const numStars = config.starCount;
        const half = Math.floor(numStars / 2);
        for (let i = 0; i < half; i++) {
          const ang = -Math.PI / 2 + (i - (half - 1) / 2) * 0.35;
          const sx = cx + Math.cos(ang) * 215;
          const sy = cy + Math.sin(ang) * 215;
          drawStar(sx, sy, 5, 13, 5.5, true);
        }
        for (let i = 0; i < half; i++) {
          const ang = Math.PI / 2 + (i - (half - 1) / 2) * 0.35;
          const sx = cx + Math.cos(ang) * 215;
          const sy = cy + Math.sin(ang) * 215;
          drawStar(sx, sy, 5, 13, 5.5, true);
        }
      }

      // Draw Slanted or Horizontal Ribbon Banner
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((config.bannerAngle * Math.PI) / 180);

      const bannerW = 880;
      const bannerH = config.bannerHeight || 135;
      const cornerR = config.template === "pill_ribbon" ? 45 : 12;

      // Banner Outer Mask / Cutout Background
      ctx.fillStyle = contrastColor;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2 - 14, -bannerH / 2 - 14, bannerW + 28, bannerH + 28, [cornerR + 6]);
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
      ctx.font = `900 ${Math.round(66 * config.fontSizeScale)}px ${fontFam}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.centerText, 0, 0);

      ctx.restore();
    } else {
      // NON-BANNER MODE: Icon / Custom Logo on Top + Center Headline + Subtext
      // 1. Stars Arc in Medallion
      if (config.starCount > 0) {
        const numStars = config.starCount;
        for (let i = 0; i < numStars; i++) {
          const ang = -Math.PI / 2 + (i - (numStars - 1) / 2) * 0.28;
          const sx = cx + Math.cos(ang) * 225;
          const sy = cy + Math.sin(ang) * 225;
          drawStar(sx, sy, 5, 11, 4.5, true);
        }
      }

      // 2. Custom Logo OR Vector Icon
      if (config.iconType === "custom_logo" && loadedCustomLogo) {
        // Custom Uploaded Logo Medallion
        const baseSize = 180 * (config.logoScale || 1.0);
        const aspect = loadedCustomLogo.width / loadedCustomLogo.height;
        let lw = baseSize;
        let lh = baseSize / aspect;
        if (lh > baseSize) {
          lh = baseSize;
          lw = baseSize * aspect;
        }

        const logoX = cx - lw / 2;
        const logoY = cy - 70 - lh / 2;

        if (config.logoColorMode === "monochrome") {
          // Draw monochrome logo tinted to match stamp color
          ctx.save();
          // Create offscreen canvas to tint logo
          const offCanvas = document.createElement("canvas");
          offCanvas.width = lw;
          offCanvas.height = lh;
          const offCtx = offCanvas.getContext("2d");
          if (offCtx) {
            offCtx.drawImage(loadedCustomLogo, 0, 0, lw, lh);
            offCtx.globalCompositeOperation = "source-in";
            offCtx.fillStyle = primaryColor;
            offCtx.fillRect(0, 0, lw, lh);
            ctx.drawImage(offCanvas, logoX, logoY);
          }
          ctx.restore();
        } else {
          // Original Colors
          ctx.drawImage(loadedCustomLogo, logoX, logoY, lw, lh);
        }

        // Center Headline below Logo
        ctx.fillStyle = primaryColor;
        ctx.font = `900 ${Math.round(52 * config.fontSizeScale)}px ${fontFam}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.centerText, cx, cy + 45);

        // Subtext below headline
        if (config.subText) {
          ctx.font = `bold 22px ${fontFam}`;
          ctx.fillText(config.subText, cx, cy + 105);
        }
      } else if (config.iconType !== "none") {
        // Vector Icon (Crown, Star, Shield, Building, Check, Lock, Diamond)
        const iconSize = 65 * (config.logoScale || 1.0);
        drawCenterIcon(config.iconType, cx, cy - 70, iconSize);

        // Center Headline
        ctx.fillStyle = primaryColor;
        ctx.font = `900 ${Math.round(62 * config.fontSizeScale)}px ${fontFam}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.centerText, cx, cy + 35);

        // Subtext / Date
        if (config.subText) {
          ctx.font = `bold 22px ${fontFam}`;
          ctx.fillText(config.subText, cx, cy + 95);
        }
      } else {
        // Text Only Mode: Big Bold Center Text + Line + Subtext
        ctx.fillStyle = primaryColor;
        ctx.font = `900 ${Math.round(80 * config.fontSizeScale)}px ${fontFam}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.centerText, cx, cy - 15);

        // Subtext Divider Line
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 140, cy + 50);
        ctx.lineTo(cx + 140, cy + 50);
        ctx.stroke();

        if (config.subText) {
          ctx.font = `bold 24px ${fontFam}`;
          ctx.fillText(config.subText, cx, cy + 85);
        }
      }
    }

    // ==========================================================
    // 4. DISTRESSED VINTAGE INK RUBBER STAMP GRUNGE EFFECT
    // ==========================================================
    if (config.grungeIntensity > 0) {
      ctx.save();
      const intensity = config.grungeIntensity / 100;
      const numSpecks = Math.floor(600 * intensity);
      ctx.fillStyle = contrastColor;

      // Random ink voids / specks
      for (let i = 0; i < numSpecks; i++) {
        const gx = Math.random() * size;
        const gy = Math.random() * size;
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

  // Handle Template Preset Switch -> RETAINS USER'S INPUTTED TEXT & LOGO!
  const handleSelectTemplate = (preset: (typeof TEMPLATE_PRESETS)[0]) => {
    setConfig((prev) => ({
      ...prev,
      ...preset.templateProps,
      template: preset.id,
      // Retain existing user text and color if customized
      customColor: preset.templateProps.colorPreset || prev.customColor,
      // Preserve topText, bottomText, centerText, subText, customLogoUrl, fontSizeScale
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
          showBanner: false,
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
                Interactive Studio
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
                <span>Reset All</span>
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
              <span className="text-xs text-slate-400 font-medium">Text is preserved when switching</span>
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
                    value={config.topText ?? ""}
                    onChange={(e) => setConfig({ ...config, topText: e.target.value })}
                    placeholder="e.g. GOLD MEMBER / FHI GLOBAL PROPERTY"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Center Main Headline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Center Headline / Main Text</span>
                    <span className="text-[11px] text-slate-400 font-normal">Primary Headline</span>
                  </label>
                  <input
                    type="text"
                    value={config.centerText ?? ""}
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
                    value={config.bottomText ?? ""}
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
                    value={config.subText ?? ""}
                    onChange={(e) => setConfig({ ...config, subText: e.target.value })}
                    placeholder="e.g. 18 AUG 2026 / REF: LR-DXB-3627"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Font Family Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Typography Font Family</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "impact", label: "Impact Bold" },
                      { id: "sans", label: "Modern Sans" },
                      { id: "serif", label: "Classic Serif" },
                      { id: "mono", label: "Monospace" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setConfig({ ...config, fontFamily: f.id as any })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          config.fontFamily === f.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Scaling & Letter Spacing Sliders */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Font Size Scale</span>
                      <span>{Math.round((config.fontSizeScale ?? 1.0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.05"
                      value={config.fontSizeScale ?? 1.0}
                      onChange={(e) => setConfig({ ...config, fontSizeScale: parseFloat(e.target.value) || 1.0 })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Letter Spacing</span>
                      <span>{config.letterSpacing ?? 6}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={config.letterSpacing ?? 6}
                      onChange={(e) => setConfig({ ...config, letterSpacing: parseInt(e.target.value) || 0 })}
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
                      { id: "building", label: "Real Estate", icon: Building },
                      { id: "check", label: "Approved", icon: CheckCircle2 },
                      { id: "diamond", label: "VIP Gem", icon: Gem },
                      { id: "lock", label: "Security", icon: Lock },
                      { id: "custom_logo", label: "Custom Logo", icon: ImageIcon },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setConfig({ ...config, iconType: item.id as any, showBanner: false })}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          config.iconType === item.id && !config.showBanner
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

                {/* Banner Mode Toggle Button */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Horizontal / Angled Ribbon Banner</span>
                    <span className="text-[11px] text-slate-500">Crosses center medallion with bold cutout bar</span>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, showBanner: !config.showBanner })}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      config.showBanner
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {config.showBanner ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {/* Custom Logo Upload Section */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Company / Agent Logo Upload</span>
                    <button
                      onClick={() => setConfig({ ...config, customLogoUrl: "/fhi.png", iconType: "custom_logo", showBanner: false })}
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

                  {/* Logo Color Mode (Monochrome vs Original) */}
                  {config.customLogoUrl && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Logo Color Treatment:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfig({ ...config, logoColorMode: "monochrome" })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                            config.logoColorMode === "monochrome"
                              ? "bg-slate-900 text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          Stamp Tint
                        </button>
                        <button
                          onClick={() => setConfig({ ...config, logoColorMode: "original" })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                            config.logoColorMode === "original"
                              ? "bg-slate-900 text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          Original Colors
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Logo / Icon Scale Slider */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Icon / Logo Scale</span>
                      <span>{Math.round((config.logoScale ?? 1.0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.6"
                      step="0.05"
                      value={config.logoScale ?? 1.0}
                      onChange={(e) => setConfig({ ...config, logoScale: parseFloat(e.target.value) || 1.0 })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Outer Ring Stars Counter */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Orbiting Decorative Stars</span>
                    <span>{config.starCount ?? 6} Stars</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="16"
                    step="2"
                    value={config.starCount ?? 6}
                    onChange={(e) => setConfig({ ...config, starCount: parseInt(e.target.value) || 0 })}
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
                            ? "border-slate-900 bg-slate-50 shadow-xs ring-2 ring-slate-900/10"
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
                      value={config.customColor ?? "#0F172A"}
                      onChange={(e) => setConfig({ ...config, customColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={config.customColor ?? "#0F172A"}
                      onChange={(e) => setConfig({ ...config, customColor: e.target.value })}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                {/* Outer Rim Border Style Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Outer Rim Border Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "double", label: "Smooth Double Ring" },
                      { id: "serrated", label: "Serrated Starburst" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setConfig({ ...config, outerRingStyle: r.id as any })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          config.outerRingStyle === r.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Angle Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Banner Slant / Tilt Angle</span>
                    <span>{config.bannerAngle ?? 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="1"
                    value={config.bannerAngle ?? 0}
                    onChange={(e) => setConfig({ ...config, bannerAngle: parseInt(e.target.value) || 0 })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Vintage Ink Rubber Stamp Grunge Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Distressed Vintage Ink / Grunge Texture</span>
                    <span>{config.grungeIntensity ?? 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={config.grungeIntensity ?? 0}
                    onChange={(e) => setConfig({ ...config, grungeIntensity: parseInt(e.target.value) || 0 })}
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
