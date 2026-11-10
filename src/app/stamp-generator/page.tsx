"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageLoader from "@/components/PageLoader";
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
  Image as ImageIcon,
  RotateCcw,
  ShieldCheck,
  Crown,
  Star,
  Building,
  CheckCircle2,
  Lock,
  Stamp,
  Gem,
  Save,
  Trash2,
  FolderOpen,
  User,
  CheckCircle,
  AlertCircle,
  Plus,
  Clock,
  Search,
  ArrowRight,
  Sliders,
} from "lucide-react";

// Big Kiosk Back Icon
const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Kiosk Hub Icons
const DesignStampKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#F59E0B" />
    <circle cx="32" cy="32" r="16" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="4 3" />
    <path d="M32 22L35 28L42 29L37 34L38 41L32 37L26 41L27 34L22 29L29 28L32 22Z" fill="#FFFFFF" />
  </svg>
);

const LibraryStampsKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2563EB" />
    <rect x="18" y="16" width="28" height="32" rx="6" fill="#FFFFFF" opacity="0.9" />
    <circle cx="32" cy="28" r="6" fill="#1D4ED8" />
    <path d="M24 38H40M24 42H34" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export type StampTemplateId =
  | "slanted_banner"
  | "royal_crown"
  | "serrated_badge"
  | "pill_ribbon"
  | "star_medallion"
  | "rubber_stamp"
  | "luxury_gold"
  | "corporate_seal";

export interface StampConfig {
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
  grungeIntensity: number;
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

export interface SavedStampItem {
  id: number;
  accountId: string;
  accountType: string;
  accountName: string;
  stampName: string;
  template: StampTemplateId;
  config: StampConfig;
  previewImageUrl: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
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
  return (
    <Suspense fallback={<PageLoader label="Loading Stamp & Seals Studio..." />}>
      <StampGeneratorContent />
    </Suspense>
  );
}

function StampGeneratorContent() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") || "MENU").toUpperCase();
  const [viewMode, setViewMode] = useState<"MENU" | "CREATE" | "LIBRARY">(
    initialView === "CREATE" || initialView === "STUDIO"
      ? "CREATE"
      : initialView === "LIBRARY" || initialView === "SAVED"
      ? "LIBRARY"
      : "MENU"
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [config, setConfig] = useState<StampConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);
  const [loadedCustomLogo, setLoadedCustomLogo] = useState<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "graphics" | "style">("text");

  // Account State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<{ id: string; name: string; type: string }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("default");

  // Saved Stamps State
  const [savedStamps, setSavedStamps] = useState<SavedStampItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [currentLoadedStampId, setCurrentLoadedStampId] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveStampName, setSaveStampName] = useState("");
  const [saveIsDefault, setSaveIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"new" | "update">("new");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Current User & Accounts List
  useEffect(() => {
    async function loadUserAndAccounts() {
      try {
        const res = await fetch("/api/auth/login");
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUser(data.user);
          const userAccId = String(data.user.id || data.user.email || "user-1");
          const accList = [
            { id: userAccId, name: `${data.user.name || "My Account"} (User)`, type: "USER" },
            { id: "admin-profile", name: "Company Profile (Leuterio Realty LLC)", type: "PROFILE" },
          ];
          if (data.user.teamName) {
            accList.push({
              id: `team-${data.user.teamName.replace(/\s+/g, "_").toLowerCase()}`,
              name: `${data.user.teamName} (Team)`,
              type: "TEAM",
            });
          }
          setAccounts(accList);
          setSelectedAccountId(userAccId);
        } else {
          setAccounts([
            { id: "default", name: "Default Account", type: "USER" },
            { id: "admin-profile", name: "Company Profile (Leuterio Realty LLC)", type: "PROFILE" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load user account:", err);
      }
    }
    loadUserAndAccounts();
  }, []);

  // Fetch Saved Stamps for the Active Account
  const fetchSavedStamps = useCallback(async (accId: string) => {
    setLoadingSaved(true);
    try {
      const res = await fetch(`/api/stamps?accountId=${encodeURIComponent(accId)}&includeAll=true`);
      const data = await res.json();
      if (res.ok && data.stamps) {
        setSavedStamps(data.stamps);
      }
    } catch (err) {
      console.error("Failed to fetch saved stamps:", err);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchSavedStamps(selectedAccountId);
    }
  }, [selectedAccountId, fetchSavedStamps]);

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
    if (viewMode !== "CREATE") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 1000;
    canvas.width = size;
    canvas.height = size;

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

    const fontFam =
      config.fontFamily === "serif"
        ? '"Times New Roman", Georgia, serif'
        : config.fontFamily === "mono"
        ? '"Courier New", Courier, monospace'
        : config.fontFamily === "impact"
        ? '"Arial Black", Impact, sans-serif'
        : 'system-ui, -apple-system, sans-serif';

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

    const drawCenterIcon = (iconType: string, ix: number, iy: number, isize: number) => {
      ctx.save();
      ctx.fillStyle = primaryColor;
      ctx.strokeStyle = primaryColor;

      if (iconType === "crown") {
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

        ctx.beginPath();
        ctx.arc(ix - w / 2 - 12, iy - h / 3 - 6, 6, 0, Math.PI * 2);
        ctx.arc(ix, iy - h / 2 - 7, 8, 0, Math.PI * 2);
        ctx.arc(ix + w / 2 + 12, iy - h / 3 - 6, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = contrastColor;
        ctx.fillRect(ix - w / 2 + 6, iy + h / 3, w - 12, 6);
      } else if (iconType === "shield") {
        const w = isize * 1.1;
        const h = isize * 1.3;
        ctx.beginPath();
        ctx.moveTo(ix, iy - h / 2);
        ctx.lineTo(ix + w / 2, iy - h / 3);
        ctx.quadraticCurveTo(ix + w / 2, iy + h / 4, ix, iy + h / 2);
        ctx.quadraticCurveTo(ix - w / 2, iy + h / 4, ix - w / 2, iy - h / 3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = contrastColor;
        drawStar(ix, iy - 4, 5, 20, 9, true);
      } else if (iconType === "building") {
        const bw = isize * 0.45;
        const bh1 = isize * 1.1;
        const bh2 = isize * 0.8;
        const bh3 = isize * 0.65;

        ctx.fillRect(ix - bw / 2, iy + 45 - bh1, bw, bh1);
        ctx.fillRect(ix - bw * 1.4, iy + 45 - bh2, bw * 0.8, bh2);
        ctx.fillRect(ix + bw * 0.6, iy + 45 - bh3, bw * 0.8, bh3);

        ctx.fillStyle = contrastColor;
        for (let r = 0; r < 5; r++) {
          ctx.fillRect(ix - 12, iy + 25 - r * 16, 8, 8);
          ctx.fillRect(ix + 4, iy + 25 - r * 16, 8, 8);
        }
      } else if (iconType === "check") {
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
        const lw = isize * 1.0;
        const lh = isize * 0.8;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(ix, iy - lh / 3, 26, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(ix - lw / 2, iy - lh / 4, lw, lh, [14]);
        ctx.fill();
        ctx.fillStyle = contrastColor;
        ctx.beginPath();
        ctx.arc(ix, iy + 6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(ix - 3.5, iy + 6, 7, 14);
      } else if (iconType === "diamond") {
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
        drawStar(ix, iy, 5, isize * 0.85, isize * 0.38, true);
      }
      ctx.restore();
    };

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

    // 1. OUTER RIMS & CONCENTRIC BORDERS
    const maxRadius = 450;

    if (config.outerRingStyle === "serrated" || config.template === "serrated_badge" || config.template === "star_medallion") {
      const points = config.serratedPoints || 40;
      drawSerratedRim(cx, cy, points, maxRadius, maxRadius - 28);
      ctx.fillStyle = contrastColor;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius - 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = primaryColor;
    }

    ctx.lineWidth = config.ringThickness * 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius - 38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = Math.max(2, config.ringThickness * 0.7);
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius - 55, 0, Math.PI * 2);
    ctx.stroke();

    const innerMedallionR = 280;
    ctx.lineWidth = config.ringThickness * 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, innerMedallionR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = Math.max(2, config.ringThickness * 0.7);
    ctx.beginPath();
    ctx.arc(cx, cy, innerMedallionR - 16, 0, Math.PI * 2);
    ctx.stroke();

    // 2. CURVED TEXT RENDERING
    const textRadius = 338;
    const curvedFont = `900 ${Math.round(48 * config.fontSizeScale)}px ${fontFam}`;
    drawCurvedText(config.topText, textRadius, true, curvedFont);
    drawCurvedText(config.bottomText, textRadius, false, curvedFont);

    drawStar(cx - textRadius, cy, 5, 16, 7, true);
    drawStar(cx - textRadius - 28, cy, 5, 11, 5, true);
    drawStar(cx + textRadius, cy, 5, 16, 7, true);
    drawStar(cx + textRadius + 28, cy, 5, 11, 5, true);

    // 3. INNER MEDALLION GRAPHICS / BANNER / LOGO / ICONS
    const hasBanner = config.showBanner || config.template === "slanted_banner" || config.template === "pill_ribbon";

    if (hasBanner) {
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

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((config.bannerAngle * Math.PI) / 180);

      const bannerW = 880;
      const bannerH = config.bannerHeight || 135;
      const cornerR = config.template === "pill_ribbon" ? 45 : 12;

      ctx.fillStyle = contrastColor;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2 - 14, -bannerH / 2 - 14, bannerW + 28, bannerH + 28, [cornerR + 6]);
      ctx.fill();

      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, [cornerR]);
      ctx.fill();

      ctx.strokeStyle = contrastColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2 + 10, -bannerH / 2 + 10, bannerW - 20, bannerH - 20, [Math.max(4, cornerR - 6)]);
      ctx.stroke();

      ctx.fillStyle = contrastColor;
      ctx.font = `900 ${Math.round(66 * config.fontSizeScale)}px ${fontFam}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.centerText, 0, 0);

      ctx.restore();
    } else {
      if (config.starCount > 0) {
        const numStars = config.starCount;
        for (let i = 0; i < numStars; i++) {
          const ang = -Math.PI / 2 + (i - (numStars - 1) / 2) * 0.28;
          const sx = cx + Math.cos(ang) * 225;
          const sy = cy + Math.sin(ang) * 225;
          drawStar(sx, sy, 5, 11, 4.5, true);
        }
      }

      if (config.iconType === "custom_logo" && loadedCustomLogo) {
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
          ctx.save();
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
          ctx.drawImage(loadedCustomLogo, logoX, logoY, lw, lh);
        }

        ctx.fillStyle = primaryColor;
        ctx.font = `900 ${Math.round(52 * config.fontSizeScale)}px ${fontFam}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.centerText, cx, cy + 45);

        if (config.subText) {
          ctx.font = `bold 22px ${fontFam}`;
          ctx.fillText(config.subText, cx, cy + 105);
        }
      } else if (config.iconType !== "none") {
        const iconSize = 65 * (config.logoScale || 1.0);
        drawCenterIcon(config.iconType, cx, cy - 70, iconSize);

        ctx.fillStyle = primaryColor;
        ctx.font = `900 ${Math.round(62 * config.fontSizeScale)}px ${fontFam}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.centerText, cx, cy + 35);

        if (config.subText) {
          ctx.font = `bold 22px ${fontFam}`;
          ctx.fillText(config.subText, cx, cy + 95);
        }
      } else {
        ctx.fillStyle = primaryColor;
        ctx.font = `900 ${Math.round(80 * config.fontSizeScale)}px ${fontFam}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.centerText, cx, cy - 15);

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

    // 4. DISTRESSED VINTAGE INK RUBBER STAMP GRUNGE EFFECT
    if (config.grungeIntensity > 0) {
      ctx.save();
      const intensity = config.grungeIntensity / 100;
      const numSpecks = Math.floor(600 * intensity);
      ctx.fillStyle = contrastColor;

      for (let i = 0; i < numSpecks; i++) {
        const gx = Math.random() * size;
        const gy = Math.random() * size;
        ctx.beginPath();
        ctx.arc(gx, gy, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < Math.floor(40 * intensity); i++) {
        const lx = Math.random() * (size - 100) + 50;
        const ly = Math.random() * (size - 100) + 50;
        const len = Math.random() * 60 + 10;
        ctx.fillRect(lx, ly, len, Math.random() * 2 + 1);
      }
      ctx.restore();
    }
  }, [config, loadedCustomLogo, viewMode]);

  const handleSelectTemplate = (preset: (typeof TEMPLATE_PRESETS)[0]) => {
    setConfig((prev) => ({
      ...prev,
      ...preset.templateProps,
      template: preset.id,
      customColor: preset.templateProps.colorPreset || prev.customColor,
    }));
  };

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

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `stamp_${config.template}_${Date.now()}.png`;
    a.click();
    showToast("Downloaded high-res stamp PNG!");
  };

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
        showToast("Copied transparent stamp to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) {
      console.error("Copy to clipboard failed:", e);
      alert("Please right click the stamp and choose 'Copy Image'.");
    }
  };

  const handleOpenSaveModal = (mode: "new" | "update" = "new") => {
    setSaveMode(mode);
    if (mode === "update" && currentLoadedStampId) {
      const current = savedStamps.find((s) => s.id === currentLoadedStampId);
      setSaveStampName(current?.stampName || config.centerText || "Custom Stamp Design");
      setSaveIsDefault(current?.isDefault || false);
    } else {
      const defaultName = `${config.centerText || "Official"} ${TEMPLATE_PRESETS.find(p => p.id === config.template)?.badge || "Seal"}`;
      setSaveStampName(defaultName);
      setSaveIsDefault(savedStamps.length === 0);
    }
    setIsSaveModalOpen(true);
  };

  const handleSaveStamp = async () => {
    if (!saveStampName.trim()) {
      alert("Please enter a name for this stamp.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const previewDataUrl = canvas.toDataURL("image/png");

    setIsSaving(true);
    try {
      const selectedAcc = accounts.find((a) => a.id === selectedAccountId) || {
        id: selectedAccountId,
        name: currentUser?.name || "Default Account",
        type: "USER",
      };

      const payload = {
        id: saveMode === "update" ? currentLoadedStampId : undefined,
        accountId: selectedAcc.id,
        accountType: selectedAcc.type,
        accountName: selectedAcc.name,
        stampName: saveStampName.trim(),
        template: config.template,
        config: config,
        previewImageUrl: previewDataUrl,
        isDefault: saveIsDefault,
        createdBy: currentUser?.id || null,
      };

      const res = await fetch("/api/stamps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save stamp");
      }

      showToast(saveMode === "update" ? "Stamp updated successfully in database!" : "Stamp saved to account database!");
      setIsSaveModalOpen(false);
      setCurrentLoadedStampId(data.stampId || currentLoadedStampId);
      fetchSavedStamps(selectedAccountId);
    } catch (err: any) {
      console.error("Save stamp error:", err);
      showToast(err.message || "Failed to save stamp", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // REGENERATE / LOAD SAVED STAMP AND SWITCH TO STUDIO VIEW
  const handleRegenerateStamp = (item: SavedStampItem) => {
    if (!item.config) return;
    setConfig({
      ...DEFAULT_CONFIG,
      ...item.config,
    });
    setCurrentLoadedStampId(item.id);
    setViewMode("CREATE");
    showToast(`Loaded and regenerated '${item.stampName}'!`);
  };

  const handleSetDefault = async (stampId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/stamps/${stampId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        showToast("Set as default stamp for account!");
        fetchSavedStamps(selectedAccountId);
      }
    } catch (err) {
      console.error("Failed to set default stamp:", err);
    }
  };

  const handleDeleteStamp = async (stampId: number, stampName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete '${stampName}'?`)) return;

    try {
      const res = await fetch(`/api/stamps/${stampId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Deleted stamp '${stampName}'`);
        if (currentLoadedStampId === stampId) {
          setCurrentLoadedStampId(null);
        }
        fetchSavedStamps(selectedAccountId);
      }
    } catch (err) {
      console.error("Failed to delete stamp:", err);
    }
  };

  const filteredStamps = savedStamps.filter((s) =>
    s.stampName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.template.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.accountName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-bold ${
              toastMessage.type === "success"
                ? "bg-slate-900 text-white border-emerald-500/30"
                : "bg-red-600 text-white border-red-700"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-300" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* TOP KIOSK BAR (NO HEADERNAV) */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode === "MENU" ? (
              <Link
                href="/invoices"
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
              >
                <BigBackIcon />
                <span>Invoices Hub</span>
              </Link>
            ) : (
              <button
                onClick={() => setViewMode("MENU")}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
              >
                <BigBackIcon />
                <span>← Stamps Menu</span>
              </button>
            )}
            <Image
              src="/fhi.png"
              alt="Filipino Homes"
              width={160}
              height={44}
              className="object-contain h-10 w-auto hidden sm:block"
              priority
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Account Selector Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 font-extrabold text-[10px] text-amber-800 uppercase tracking-wider flex items-center gap-2">
              <Stamp className="w-3.5 h-3.5 text-amber-600" />
              Stamp & Seals Studio
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        
        {/* ========================================================= */}
        {/* VIEW MODE 1: KIOSK MAIN HUB MENU */}
        {/* ========================================================= */}
        {viewMode === "MENU" && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500 rounded-l-3xl" />
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Stamp & Seal Studio Hub
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Select an action below to design and add a new custom stamp/seal, or view and manage your account&apos;s generated stamp library.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
              {/* Kiosk Tile 1: Add / Design New Stamp */}
              <button
                onClick={() => setViewMode("CREATE")}
                className="group bg-white border-2 border-slate-200 hover:border-amber-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <DesignStampKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  Add / Design Stamp
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Interactive canvas generator to design VIP member seals, approval rubber stamps & custom logo badges.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-amber-200 bg-amber-50 text-amber-700 font-black text-xs uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                  <span>Design New Stamp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Kiosk Tile 2: View Generated Stamps */}
              <button
                onClick={() => setViewMode("LIBRARY")}
                className="group bg-white border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <LibraryStampsKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  View Generated Stamps
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Inspect database records, regenerate past designs anytime with 1-click, and download PNG assets.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-blue-200 bg-blue-50 text-blue-700 font-black text-xs uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                  <span>View Stamps ({savedStamps.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 2: ADD / DESIGN STAMP (INTERACTIVE STUDIO) */}
        {/* ========================================================= */}
        {viewMode === "CREATE" && (
          <div className="space-y-6">
            {/* Header Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_6px_0_0_#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Stamp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Interactive Stamp & Seal Studio
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Customize your official seal and save per account to the database.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setViewMode("LIBRARY")}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Library ({savedStamps.length})</span>
                </button>

                <button
                  onClick={() => handleOpenSaveModal(currentLoadedStampId ? "update" : "new")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{currentLoadedStampId ? "Update in DB" : "Save to DB"}</span>
                </button>

                <button
                  onClick={handleCopyToClipboard}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy PNG"}</span>
                </button>

                <button
                  onClick={handleDownloadPNG}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>

            {/* TWO-COLUMN STUDIO WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: LIVE CANVAS PREVIEW & TEMPLATE PICKER (col-span-6) */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-[0_6px_0_0_#E2E8F0] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      1000 × 1000 px • Transparent PNG
                    </span>
                    {currentLoadedStampId && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Loaded ID #{currentLoadedStampId}
                      </span>
                    )}
                  </div>

                  <div
                    className="w-full max-w-[400px] aspect-square rounded-2xl p-4 flex items-center justify-center shadow-inner border border-slate-200 relative mt-4"
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

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
                    <button
                      onClick={() => handleOpenSaveModal("new")}
                      className="flex-1 min-w-[140px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Design to DB</span>
                    </button>
                    <button
                      onClick={handleDownloadPNG}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-red-400" />
                      <span>Download PNG</span>
                    </button>
                    <button
                      onClick={() => {
                        setConfig(DEFAULT_CONFIG);
                        setCurrentLoadedStampId(null);
                        showToast("Reset canvas to default!");
                      }}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* TEMPLATE PRESET PICKER */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_6px_0_0_#E2E8F0] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-red-600" />
                      <h3 className="font-bold text-sm text-slate-900">Choose Stamp / Seal Style</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Text preserved when switching</span>
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
                              ? "border-amber-500 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20"
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

              {/* RIGHT COLUMN: CUSTOMIZATION STUDIO CONTROLS (col-span-6) */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
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
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

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
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

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
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

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
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

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
                            className="w-full accent-amber-600 cursor-pointer"
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
                            className="w-full accent-amber-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LOGO & ICONS */}
                  {activeTab === "graphics" && (
                    <div className="space-y-5">
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
                                  ? "bg-amber-50 border-amber-500 text-amber-700 font-bold"
                                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <item.icon className="w-4 h-4" />
                              <span className="text-[11px]">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Ribbon Banner Bar</span>
                          <span className="text-[11px] text-slate-500">Crosses center medallion with bold cutout bar</span>
                        </div>
                        <button
                          onClick={() => setConfig({ ...config, showBanner: !config.showBanner })}
                          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                            config.showBanner
                              ? "bg-amber-600 text-white shadow-xs"
                              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          }`}
                        >
                          {config.showBanner ? "Enabled" : "Disabled"}
                        </button>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Logo Upload</span>
                          <button
                            onClick={() => setConfig({ ...config, customLogoUrl: "/fhi.png", iconType: "custom_logo", showBanner: false })}
                            className="text-[11px] text-amber-600 hover:underline font-bold"
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

                        {config.customLogoUrl && (
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Color Treatment:</span>
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
                            className="w-full accent-amber-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Decorative Outer Stars</span>
                          <span>{config.starCount ?? 6} Stars</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="16"
                          step="2"
                          value={config.starCount ?? 6}
                          onChange={(e) => setConfig({ ...config, starCount: parseInt(e.target.value) || 0 })}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: COLOR & EFFECTS */}
                  {activeTab === "style" && (
                    <div className="space-y-6">
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
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

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
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 3: VIEW STAMP GENERATED PAGES (LIBRARY LEDGER) */}
        {/* ========================================================= */}
        {viewMode === "LIBRARY" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <FolderOpen className="w-7 h-7 text-blue-600" />
                  Generated Stamps & Seals Ledger
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  View and manage all official stamps saved per account. Click &quot;Regenerate&quot; on any card to reload it into the studio.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode("CREATE")}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add / Design Stamp</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search by stamp name, style, or account..."
                  className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Account:</span>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => fetchSavedStamps(selectedAccountId)}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition"
                  title="Refresh Stamp List"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSaved ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Saved Stamps Grid */}
            {loadingSaved ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm font-bold">Loading saved stamp pages...</span>
              </div>
            ) : filteredStamps.length === 0 ? (
              <div className="py-16 bg-slate-50/60 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Stamp className="w-12 h-12 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">No saved stamps found for this account</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Create and design your official stamp seal, then click &quot;Save to DB&quot; to preserve it per account.
                </p>
                <button
                  onClick={() => setViewMode("CREATE")}
                  className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Design New Stamp Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStamps.map((stamp) => (
                  <div
                    key={stamp.id}
                    className="bg-white rounded-3xl border-2 border-slate-200 hover:border-blue-400 p-6 flex flex-col justify-between transition-all duration-150 shadow-[0_6px_0_0_#CBD5E1] hover:shadow-[0_10px_0_0_#94A3B8] hover:-translate-y-1 relative group"
                  >
                    <div>
                      {/* Thumbnail with Transparency Pattern */}
                      <div
                        className="w-full aspect-square max-h-[220px] rounded-2xl border border-slate-200 p-3 flex items-center justify-center mb-4 shadow-inner relative overflow-hidden"
                        style={{
                          backgroundImage:
                            "radial-gradient(#CBD5E1 1px, transparent 1px), radial-gradient(#CBD5E1 1px, #F8FAFC 1px)",
                          backgroundSize: "16px 16px",
                        }}
                      >
                        {stamp.previewImageUrl ? (
                          <img
                            src={stamp.previewImageUrl}
                            alt={stamp.stampName}
                            className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <Stamp className="w-12 h-12 text-slate-300" />
                        )}
                        {stamp.isDefault && (
                          <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                            ★ Account Default
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-base text-slate-900 truncate">
                        {stamp.stampName}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">
                        {stamp.accountName}
                      </p>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                          {stamp.template.replace("_", " ")}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {new Date(stamp.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleRegenerateStamp(stamp)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Regenerate</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {!stamp.isDefault && (
                          <button
                            onClick={(e) => handleSetDefault(stamp.id, e)}
                            className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-xl transition"
                            title="Set as Default for Account"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteStamp(stamp.id, stamp.stampName, e)}
                          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition"
                          title="Delete Stamp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* SAVE STAMP TO DATABASE MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {saveMode === "update" ? "Update Stamp Design" : "Save Stamp to Account"}
                  </h3>
                  <p className="text-xs text-slate-500">Persist to database & regenerate anytime</p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Stamp Design Name</label>
                <input
                  type="text"
                  value={saveStampName}
                  onChange={(e) => setSaveStampName(e.target.value)}
                  placeholder="e.g. Dubai Gold VIP Seal"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Assign to Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveIsDefault}
                  onChange={(e) => setSaveIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Set as Default Stamp</span>
                  <span className="text-[11px] text-slate-500">Auto-applies when generating commission invoices</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveStamp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Saving..." : saveMode === "update" ? "Update Changes" : "Save Stamp"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
