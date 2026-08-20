"use client";

import React, { useRef, useEffect, useState } from "react";
import { Download, Sparkles, Printer, Check, RefreshCw } from "lucide-react";

export type TemplateStyle = "modern_slate" | "executive_navy" | "crimson_gold" | "minimal_charcoal";

export interface DeductibleItem {
  label: string;
  amount: number;
}

export interface InvoiceCanvasData {
  invoiceNumber: string;
  invoiceType: string;
  invoiceTitle?: string;
  invoiceTypeDescription?: string;
  invoiceTypeConfig?: { code: string; label: string; invoice_title: string; description: string };
  templateStyle?: TemplateStyle;
  issuedDate: string;
  dueDate?: string;
  agentName: string;
  agentCode?: string;
  agentEmail?: string;
  teamName?: string;
  subteamName?: string;
  developerName?: string;
  projectName?: string;
  projectLocation?: string;
  unitNumber?: string;
  buyerName?: string;
  projectValue?: number;
  commissionReceived?: number;
  commissionRate?: number;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  deductibles?: DeductibleItem[];
  currency: string;
  companyName: string;
  trnNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  cityCountry?: string;
  bankName?: string;
  accountName?: string;
  iban?: string;
  swiftCode?: string;
  logoUrl?: string;
  remarks?: string;
  particularTitle?: string;
  commissionStatus?: string;
  notedBy?: string;
  receivedBy?: string;
}

export default function InvoiceCanvasPreview({
  data,
  onTemplateChange,
}: {
  data: InvoiceCanvasData;
  onTemplateChange?: (newTemplate: TemplateStyle) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [faLoaded, setFaLoaded] = useState(false);
  const [loadedLogo, setLoadedLogo] = useState<HTMLImageElement | null>(null);
  const [loadedBg, setLoadedBg] = useState<HTMLImageElement | null>(null);
  const [dbTypeConfig, setDbTypeConfig] = useState<{ code: string; label: string; invoice_title: string; description: string } | null>(null);

  // Fetch dynamic invoice type settings from database if not explicitly provided in props
  useEffect(() => {
    async function fetchTypeConfig() {
      if (data.invoiceTypeConfig || (data.invoiceTitle && data.invoiceTypeDescription)) return;
      try {
        const res = await fetch("/api/settings/invoice-types");
        const resData = await res.json();
        if (res.ok && resData.invoiceTypes) {
          const match = resData.invoiceTypes.find((t: any) => t.code === data.invoiceType);
          if (match) {
            setDbTypeConfig(match);
          }
        }
      } catch (e) {
        console.error("Failed to fetch invoice type config in canvas preview:", e);
      }
    }
    fetchTypeConfig();
  }, [data.invoiceType, data.invoiceTitle, data.invoiceTypeDescription, data.invoiceTypeConfig]);

  const activeTemplate = data.templateStyle || "modern_slate";
  const curr = data.currency || "AED";

  // Preload & Cache Architectural Background Image
  useEffect(() => {
    const bgImg = new Image();
    bgImg.src = "/images/invoice_bg.jpg";
    bgImg.onload = () => setLoadedBg(bgImg);
    bgImg.onerror = () => {
      setLoadedBg(null);
    };
  }, []);

  // Preload & Cache Official FHI Logo Image (/fhi.png)
  useEffect(() => {
    const rawUrl = "/fhi.png";
    const img = new Image();
    img.src = rawUrl;
    img.onload = () => {
      setLoadedLogo(img);
    };
    img.onerror = () => {
      setLoadedLogo(null);
    };
  }, []);

  // Preload Font Awesome 6 Free Solid Font for Canvas Drawing
  useEffect(() => {
    let fontLoaded = false;
    const checkFA = async () => {
      try {
        if (typeof document !== "undefined" && document.fonts) {
          await document.fonts.load('900 16px "Font Awesome 6 Free"');
          await document.fonts.ready;
        }
        fontLoaded = true;
        setFaLoaded(true);
      } catch (e) {
        console.warn("Font Awesome preloading warning:", e);
        setFaLoaded(true);
      }
    };
    checkFA();

    const timer = setTimeout(() => {
      if (!fontLoaded) setFaLoaded(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Canvas Drawing Routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High resolution canvas setup (1200 x 1553 ~ standard 300DPI proportion)
    const width = 1200;
    const height = 1553;
    canvas.width = width;
    canvas.height = height;

    // 1. Pure White Base
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Luxury Architectural Background Watermark if loaded
    if (loadedBg) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.drawImage(loadedBg, 0, 0, width, height);
      ctx.restore();
    } else {
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      for (let x = 0; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }

    const matchedTypeConfig = data.invoiceTypeConfig || dbTypeConfig;

    const titleText =
      data.invoiceTitle ||
      matchedTypeConfig?.invoice_title ||
      (data.invoiceType === "TAX_INVOICE"
        ? "TAX INVOICE"
        : data.invoiceType === "AGENT_PAYOUT"
        ? "AGENT PAYOUT STATEMENT"
        : data.invoiceType === "PARTIAL_TRANCHE"
        ? "PARTIAL TRANCHE INVOICE"
        : data.invoiceType === "PROFORMA"
        ? "PROFORMA INVOICE"
        : (data.invoiceType || "INVOICE").replace(/_/g, " ").toUpperCase());

    const particularTitle =
      data.particularTitle ||
      data.invoiceTypeDescription ||
      matchedTypeConfig?.description ||
      (data.invoiceType === "TAX_INVOICE"
        ? "Real Estate Sales Commission Service Fee"
        : data.invoiceType === "AGENT_PAYOUT"
        ? "Brokerage Agent Commission Split Payout"
        : data.invoiceType === "PARTIAL_TRANCHE"
        ? "Commission Tranche Milestone Release"
        : data.invoiceType === "PROFORMA"
        ? "Proforma Estimated Sales Commission Fee"
        : "Commission Service Fee");

    // Helper: Render Font Awesome Icons on Canvas
    const drawFAIcon = (
      context: CanvasRenderingContext2D,
      unicodeChar: string,
      x: number,
      y: number,
      fontSize: number = 18,
      color: string = "#DC2626"
    ) => {
      context.save();
      context.fillStyle = color;
      context.font = `900 ${fontSize}px "Font Awesome 6 Free", "Font Awesome 5 Free", "FontAwesome"`;
      context.fillText(unicodeChar, x, y);
      context.restore();
    };

    // ==========================================================
    // TOP HEADER SECTION: Expanded, Crisp High-Contrast Header
    // ==========================================================
    const headerH = 245;

    // Header Background: Crisp White
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.fillRect(0, 0, width, headerH);

    // Top Crimson Accent Stripe (6px clean uniform line, no dark notch)
    ctx.fillStyle = "#DC2626";
    ctx.fillRect(0, 0, width, 6);

    // Render Preloaded Official FHI Logo on Left Header (Prominent & Large)
    if (loadedLogo) {
      const maxW = 340;
      const maxH = 110;
      const aspect = loadedLogo.width / loadedLogo.height;
      let w = maxW;
      let h = maxW / aspect;
      if (h > maxH) {
        h = maxH;
        w = maxH * aspect;
      }
      ctx.drawImage(loadedLogo, 60, 18, w, h);
    } else {
      ctx.fillStyle = "#DC2626";
      ctx.font = "900 32px sans-serif";
      ctx.fillText(data.companyName || "FHI Global Property", 60, 70);
    }

    // Company Address & Location (Bigger & Clearer)
    drawFAIcon(ctx, "\uf3c5", 60, 146, 15, "#DC2626");
    ctx.fillStyle = "#334155";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(data.addressLine1 || "Office no 98-3001, Owned by Arenco Marlin Investment LLC, Al Muraqqabat", 82, 146);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText(data.cityCountry || "Dubai, United Arab Emirates", 82, 168);

    // TRN Badge Container (Expanded)
    ctx.fillStyle = "#FEF2F2";
    ctx.beginPath();
    ctx.roundRect(60, 186, 310, 34, [8]);
    ctx.fill();
    ctx.strokeStyle = "#FECACA";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    drawFAIcon(ctx, "\uf095", 74, 209, 14, "#DC2626");
    ctx.fillStyle = "#991B1B";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`TRN: ${data.trnNumber || "105088815300001"}`, 96, 209);

    // Right Header: Voucher / Invoice Title (Prominent Bold Navy)
    ctx.textAlign = "right";
    ctx.fillStyle = "#0F172A";
    ctx.font = "900 42px sans-serif";
    ctx.fillText(titleText, width - 60, 64);

    // Voucher / Serial Number Highlight Pill (Bigger)
    const invNumStr = data.invoiceNumber || "LR-DXB-TAX-202608-8057";
    const pillW = Math.max(300, invNumStr.length * 15 + 36);
    const pillX = width - 60 - pillW;

    ctx.fillStyle = "#FEF2F2";
    ctx.beginPath();
    ctx.roundRect(pillX, 82, pillW, 42, [10]);
    ctx.fill();
    ctx.strokeStyle = "#F87171";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#DC2626";
    ctx.font = "bold 20px monospace";
    ctx.fillText(invNumStr, width - 78, 110);

    // Date with Calendar Icon (Larger font)
    drawFAIcon(ctx, "\uf133", width - 200, 165, 15, "#64748B");
    ctx.fillStyle = "#334155";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(`Date: ${data.issuedDate}`, width - 60, 165);

    // Currency with Coins Icon (Larger font)
    drawFAIcon(ctx, "\uf51e", width - 175, 195, 15, "#64748B");
    ctx.fillStyle = "#334155";
    ctx.fillText(`Currency: ${curr}`, width - 60, 195);
    ctx.textAlign = "left";

    // Multi-Accent Header Bottom Divider Line
    ctx.fillStyle = "#DC2626";
    ctx.fillRect(0, headerH - 4, width, 4);
    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(0, headerH, width, 1);

    // ==========================================================
    // MIDDLE SECTION: 2 SIDE-BY-SIDE INFORMATION CARDS (Expanded)
    // ==========================================================
    const cardY = 270;
    const cardW = 520;
    const cardH = 245;

    // CARD 1: INVOICE TO / AGENT INFORMATION (Left Card, x = 60)
    const card1X = 60;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(card1X, cardY, cardW, cardH, [16]);
    ctx.fill();
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Deep Navy Header Pill
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(card1X, cardY, cardW, 46, [14, 14, 0, 0]);
    ctx.fill();

    drawFAIcon(ctx, "\uf007", card1X + 22, cardY + 29, 16, "#FFFFFF");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("INVOICE TO / AGENT INFORMATION", card1X + 46, cardY + 29);

    // Fields (Bigger typography and comfortable line height)
    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Agent Name:", card1X + 25, cardY + 84);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(data.agentName, card1X + 140, cardY + 84);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Agent Code:", card1X + 25, cardY + 122);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 16px monospace";
    ctx.fillText(data.agentCode || "N/A", card1X + 140, cardY + 122);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Sales Team:", card1X + 25, cardY + 160);
    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(data.teamName || "General Roster", card1X + 140, cardY + 160);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Unit / Subteam:", card1X + 25, cardY + 198);
    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(data.subteamName || "Dubai Core Unit", card1X + 140, cardY + 198);

    // User Avatar Watermark Circle on Right
    ctx.fillStyle = "#F1F5F9";
    ctx.beginPath();
    ctx.arc(card1X + 440, cardY + 145, 52, 0, Math.PI * 2);
    ctx.fill();
    drawFAIcon(ctx, "\uf007", card1X + 418, cardY + 162, 54, "#CBD5E1");

    // CARD 2: PROPERTY & TRANSACTION DETAILS (Right Card, x = 620)
    const card2X = 620;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(card2X, cardY, cardW, cardH, [16]);
    ctx.fill();
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vibrant Crimson Header Pill (#DC2626)
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.roundRect(card2X, cardY, cardW, 46, [14, 14, 0, 0]);
    ctx.fill();

    drawFAIcon(ctx, "\uf1ad", card2X + 22, cardY + 29, 16, "#FFFFFF");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("PROPERTY & TRANSACTION DETAILS", card2X + 46, cardY + 29);

    // Card 2 Details (Bigger typography)
    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Developer:", card2X + 25, cardY + 80);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(data.developerName || "N/A", card2X + 140, cardY + 80);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Project / Loc:", card2X + 25, cardY + 114);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 15px sans-serif";
    const projLocStr = data.projectName
      ? `${data.projectName}${data.projectLocation ? ` • ${data.projectLocation}` : ""}`
      : data.projectLocation || "N/A";
    ctx.fillText(projLocStr, card2X + 140, cardY + 114);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Buyer Name:", card2X + 25, cardY + 148);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(data.buyerName || "N/A", card2X + 140, cardY + 148);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Unit Number:", card2X + 25, cardY + 180);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 15px monospace";
    ctx.fillText(data.unitNumber || "N/A", card2X + 140, cardY + 180);

    // Deal Value & Split % Row
    if (data.commissionReceived || data.projectValue) {
      ctx.fillStyle = "#64748B";
      ctx.font = "14px sans-serif";
      ctx.fillText(data.commissionReceived ? "Comm. Rec. & %:" : "Deal Value & %:", card2X + 25, cardY + 212);

      ctx.fillStyle = "#DC2626";
      ctx.font = "bold 15px monospace";

      if (data.commissionReceived) {
        const commRecStr = `${curr} ${Number(data.commissionReceived).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
        const rateStr = data.commissionRate ? ` (${data.commissionRate}% split)` : "";
        ctx.fillText(`${commRecStr}${rateStr}`, card2X + 140, cardY + 212);
      } else if (data.projectValue) {
        const valStr = `${curr} ${Number(data.projectValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
        const rateStr = data.commissionRate ? ` (${data.commissionRate}%)` : "";
        ctx.fillText(`${valStr}${rateStr}`, card2X + 140, cardY + 212);
      }
    }

    // Watermark Building Icon on Right of Card 2
    ctx.fillStyle = "#FEF2F2";
    ctx.beginPath();
    ctx.arc(card2X + 440, cardY + 145, 52, 0, Math.PI * 2);
    ctx.fill();
    drawFAIcon(ctx, "\uf1ad", card2X + 418, cardY + 162, 54, "#FCA5A5");

    // ==========================================================
    // COMMISSION LINE ITEM FINANCIAL TABLE (Expanded)
    // ==========================================================
    const tableY = 535;
    const tableW = 1080;

    // Deep Navy Table Header
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(60, tableY, tableW, 48, [12, 12, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("DESCRIPTION / SERVICE PARTICULAR", 85, tableY + 30);

    ctx.textAlign = "right";
    ctx.fillText(`NET (${curr})`, 670, tableY + 30);
    ctx.fillText(`VAT (${data.vatRate || 0}%)`, 850, tableY + 30);
    ctx.fillText(`TOTAL (${curr})`, 1140 - 20, tableY + 30);
    ctx.textAlign = "left";

    // Main Item Data Row (Taller & more prominent)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(60, tableY + 48, tableW, 90);
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1;
    ctx.strokeRect(60, tableY + 48, tableW, 90);

    // Red Circular Badge Icon
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.arc(98, tableY + 93, 24, 0, Math.PI * 2);
    ctx.fill();

    drawFAIcon(ctx, "\uf015", 87, tableY + 101, 19, "#FFFFFF");

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(data.particularTitle || particularTitle, 135, tableY + 84);
    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";

    if (data.commissionStatus && data.commissionStatus !== "NONE") {
      ctx.fillText(data.commissionStatus, 135, tableY + 110);
    }

    ctx.textAlign = "right";
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 18px monospace";
    ctx.fillText(data.netAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 670, tableY + 98);
    ctx.fillText(data.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 850, tableY + 98);
    ctx.fillText(data.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 1140 - 20, tableY + 98);
    ctx.textAlign = "left";

    // Highlighted TOTAL SUMMARY Section Row
    const sumY = tableY + 138;
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.roundRect(60, sumY, tableW, 48, [0, 0, 12, 12]);
    ctx.fill();
    ctx.strokeStyle = "#CBD5E1";
    ctx.strokeRect(60, sumY, tableW, 48);

    drawFAIcon(ctx, "\uf1ec", 80, sumY + 30, 17, "#0F172A");

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("TOTAL SUMMARY", 108, sumY + 30);

    ctx.textAlign = "right";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#64748B";
    ctx.fillText(curr, 570, sumY + 28);
    ctx.font = "bold 17px monospace";
    ctx.fillStyle = "#0F172A";
    ctx.fillText(data.netAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 670, sumY + 30);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#64748B";
    ctx.fillText(curr, 750, sumY + 28);
    ctx.font = "bold 17px monospace";
    ctx.fillStyle = "#0F172A";
    ctx.fillText(data.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 850, sumY + 30);

    // Dark Navy Summary Accent Pill for Total Payable
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(880, sumY, 260, 48, [0, 0, 12, 0]);
    ctx.fill();

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(curr, 970, sumY + 28);
    ctx.font = "900 20px monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(data.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 1140 - 20, sumY + 30);
    ctx.textAlign = "left";

    // ==========================================================
    // BOTTOM PAYMENT DETAILS & SUMMARY BOX (Expanded)
    // ==========================================================
    const botY = 735;
    const botW = 520;

    // LEFT BOX: BANK WIRE PAYMENT DETAILS (x = 60, width = 520)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(60, botY, botW, 205, [16]);
    ctx.fill();
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.roundRect(60, botY, botW, 42, [14, 14, 0, 0]);
    ctx.fill();

    drawFAIcon(ctx, "\uf19c", 82, botY + 27, 16, "#0F172A");

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("BANK WIRE PAYMENT DETAILS", 108, botY + 27);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Beneficiary Name:", 85, botY + 75);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(data.accountName || data.companyName || "FHI Global Property LLC", 220, botY + 75);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Bank Name:", 85, botY + 116);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(data.bankName || "WIO Bank", 220, botY + 116);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px sans-serif";
    ctx.fillText("Account / IBAN:", 85, botY + 158);
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 15px monospace";
    ctx.fillText(data.iban || "AE900860000009185994189", 220, botY + 158);

    // Watermark Bank Icon
    ctx.fillStyle = "#F1F5F9";
    ctx.beginPath();
    ctx.arc(60 + 440, botY + 125, 42, 0, Math.PI * 2);
    ctx.fill();
    drawFAIcon(ctx, "\uf19c", 60 + 420, botY + 138, 44, "#CBD5E1");

    // RIGHT BOX: FINANCIAL CALCULATION BREAKDOWN (x = 620, width = 520, right edge = 1140)
    const rightBoxX = 620;
    const rightBoxW = 520;
    const rightEdge = rightBoxX + rightBoxW; // 1140

    ctx.fillStyle = "#475569";
    ctx.font = "15px sans-serif";
    ctx.fillText("Net Commission Subtotal:", rightBoxX + 15, botY + 28);
    ctx.textAlign = "right";
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`${curr} ${data.netAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, rightEdge, botY + 28);
    ctx.textAlign = "left";

    ctx.fillStyle = "#475569";
    ctx.font = "15px sans-serif";
    ctx.fillText(`VAT (${data.vatRate || 0}%):`, rightBoxX + 15, botY + 62);
    ctx.textAlign = "right";
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`${curr} ${data.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, rightEdge, botY + 62);
    ctx.textAlign = "left";

    // Deductibles Line Item Summary
    const totalDeductibles = (data.deductibles || []).reduce((acc, d) => acc + d.amount, 0);
    if (totalDeductibles > 0) {
      ctx.fillStyle = "#DC2626";
      ctx.font = "14px sans-serif";
      ctx.fillText(`Total Deductibles (${data.deductibles?.length || 0} items):`, rightBoxX + 15, botY + 94);
      ctx.textAlign = "right";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`- ${curr} ${totalDeductibles.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, rightEdge, botY + 94);
      ctx.textAlign = "left";
    }

    // GRAND TOTAL PAYABLE HIGHLIGHT BOX (#DC2626) -> Prominent, large & aligned (height = 86)
    const redBoxY = botY + 110;
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.roundRect(rightBoxX, redBoxY, rightBoxW, 86, [18]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 20px sans-serif";
    ctx.fillText("TOTAL PAYABLE", rightBoxX + 30, redBoxY + 50);

    ctx.textAlign = "right";
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#FECACA";
    ctx.fillText(curr, rightEdge - 230, redBoxY + 34);

    ctx.font = "900 32px monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(data.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), rightEdge - 25, redBoxY + 52);
    ctx.textAlign = "left";

    // ==========================================================
    // SIGNATURE & APPROVAL SECTION (Prominent across page)
    // ==========================================================
    const sigY = 980;

    // LEFT: NOTED BY
    drawFAIcon(ctx, "\uf304", 60, sigY, 17, "#0F172A");
    ctx.fillStyle = "#0F172A";
    ctx.font = "900 15px sans-serif";
    ctx.fillText("NOTED BY:", 86, sigY);

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 19px sans-serif";
    ctx.fillText(data.notedBy || "Anthony Gerard Leuterio", 60, sigY + 40);

    ctx.fillStyle = "#64748B";
    ctx.font = "13px sans-serif";
    ctx.fillText("Founder & CEO • Filipino Homes / FHI Global", 60, sigY + 62);

    // RIGHT: RECEIVED BY & SIGNATURE LINE (Spanning to right border 1140)
    ctx.fillStyle = "#0F172A";
    ctx.font = "900 15px sans-serif";
    ctx.fillText("RECEIVED BY:", 620, sigY);

    // Signature Underline
    ctx.beginPath();
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2.0;
    ctx.moveTo(620, sigY + 52);
    ctx.lineTo(rightEdge, sigY + 52);
    ctx.stroke();

    ctx.fillStyle = "#94A3B8";
    ctx.font = "12px sans-serif";
    ctx.fillText("Signature over Printed Name / Date", 620, sigY + 72);

    // ==========================================================
    // OFFICIAL NOTES & SECURITY VERIFICATION BOX (Fills Bondpaper)
    // ==========================================================
    const notesY = 1080;
    const notesW = 1080;

    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.beginPath();
    ctx.roundRect(60, notesY, notesW, 140, [14]);
    ctx.fill();
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Notes Header
    drawFAIcon(ctx, "\uf15c", 82, notesY + 30, 15, "#DC2626");
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("TERMS, CONDITIONS & VERIFICATION NOTICE", 106, notesY + 30);

    ctx.fillStyle = "#475569";
    ctx.font = "13px sans-serif";
    ctx.fillText("1. This document is an official computer-generated real estate commission payment voucher issued by FHI Global Property LLC.", 82, notesY + 58);
    ctx.fillText("2. All wire transfers and payments are made strictly in accordance with approved UAE real estate brokerage regulations and tax laws.", 82, notesY + 82);
    ctx.fillText("3. For any transaction inquiries or split verifications, please contact accounting at finance@filipinohomes.com within 5 working days.", 82, notesY + 106);

    // ==========================================================
    // FOOTER: Clean Dark Navy & Crimson Line Footer (#0F172A)
    // ==========================================================
    const footerY = height - 60;
    
    // Top Crimson Accent line
    ctx.fillStyle = "#DC2626";
    ctx.fillRect(0, footerY, width, 2);

    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, footerY + 2, width, 58);

    // Font Awesome Shield Check Icon (\uf132)
    drawFAIcon(ctx, "\uf132", 60, footerY + 35, 15, "#DC2626");

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Official Computer Generated Real Estate Commission Invoice", 84, footerY + 28);
    ctx.fillStyle = "#94A3B8";
    ctx.font = "11px sans-serif";
    const footerCompany = data.companyName || "FHI Global Property LLC";
    ctx.fillText(`• ${footerCompany} • Dubai, UAE`, 84, footerY + 46);

    ctx.textAlign = "right";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("Page 1 of 1", width - 60, footerY + 36);
    ctx.textAlign = "left";
  }, [data, activeTemplate, faLoaded, curr, loadedLogo, loadedBg]);

  // Export Canvas Image to Downloadable PNG
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageURI = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `Invoice_${data.invoiceNumber}.png`;
    link.href = imageURI;
    link.click();
  };

  // Direct 1-Click Browser Print Canvas Function
  const handlePrintCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print invoices directly.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Invoice - ${data.invoiceNumber}</title>
          <style>
            @page {
              size: portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              display: flex;
              justify-content: center;
              align-items: flex-start;
            }
            img {
              width: 100%;
              max-width: 100vw;
              height: auto;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Template Style Selector & Action Toolbar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-wider">High-Contrast Print Optimized Voucher</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintCanvas}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-red-400" />
            Print Voucher
          </button>
          <button
            onClick={handleDownloadPNG}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
      </div>

      {/* HTML5 Canvas Element Display */}
      <div className="flex justify-center overflow-x-auto bg-slate-200/60 p-4 lg:p-8 rounded-3xl border border-slate-300 shadow-inner">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto rounded-xl shadow-2xl bg-white border border-slate-300"
          style={{ width: "100%", maxWidth: "850px" }}
        />
      </div>
    </div>
  );
}
