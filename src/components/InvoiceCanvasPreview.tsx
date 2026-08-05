"use client";

import React, { useRef, useEffect, useState } from "react";
import { Download, Sparkles, Check, RefreshCw } from "lucide-react";

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
  spaReference?: string;
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

  // Preload & Cache Logo Image for Canvas (Handles Proxy & CORS)
  useEffect(() => {
    let rawUrl = data.logoUrl || "/leuteriorealty.svg";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      rawUrl = `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
    }

    const img = new Image();
    img.src = rawUrl;
    img.onload = () => {
      setLoadedLogo(img);
    };
    img.onerror = () => {
      if (rawUrl !== "/leuteriorealty.svg") {
        const fallback = new Image();
        fallback.src = "/leuteriorealty.svg";
        fallback.onload = () => setLoadedLogo(fallback);
      }
    };
  }, [data.logoUrl]);

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

    // 1. Off-white / light slate background (#F8FAFC)
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, width, height);

    // Subtle Blueprint Architecture Background Grid Lines
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
      fontSize: number = 16,
      color: string = "#E11D2E"
    ) => {
      context.save();
      context.fillStyle = color;
      context.font = `900 ${fontSize}px "Font Awesome 6 Free", "Font Awesome 5 Free", "FontAwesome"`;
      context.fillText(unicodeChar, x, y);
      context.restore();
    };

    // ==========================================================
    // DRAW MODERN SLATE & RED EXECUTIVE TEMPLATE
    // ==========================================================

    // ==========================================================
    // TOP HEADER SECTION: Sleek Dark Slate Banner (#0F172A)
    // ==========================================================
    const headerH = 210;
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, width, headerH);

    // Bottom Red Accent Stripe (#E11D2E) with right angle tab notch
    ctx.fillStyle = "#E11D2E";
    ctx.beginPath();
    ctx.moveTo(0, headerH);
    ctx.lineTo(width - 120, headerH);
    ctx.lineTo(width - 90, headerH + 6);
    ctx.lineTo(width, headerH + 6);
    ctx.lineTo(width, headerH + 11);
    ctx.lineTo(0, headerH + 11);
    ctx.closePath();
    ctx.fill();

    // Render Preloaded Logo on Left Header
    if (loadedLogo) {
      const aspect = loadedLogo.width / loadedLogo.height;
      const maxW = 240;
      const maxH = 75;
      let w = maxW;
      let h = maxW / aspect;
      if (h > maxH) {
        h = maxH;
        w = maxH * aspect;
      }
      ctx.drawImage(loadedLogo, 60, 30, w, h);
    } else {
      ctx.fillStyle = "#E11D2E";
      ctx.font = "900 24px sans-serif";
      ctx.fillText(data.companyName || "Leuterio Realty", 60, 65);
    }

    // Font Awesome Location Dot Icon (\uf3c5)
    drawFAIcon(ctx, "\uf3c5", 60, 140, 14, "#E11D2E");
    ctx.fillStyle = "#94A3B8";
    ctx.font = "14px sans-serif";
    ctx.fillText(data.addressLine1 || "Opus Tower by Omniyat, Marasi Drive, Business Bay", 80, 140);
    ctx.fillText(data.cityCountry || "Dubai, United Arab Emirates", 80, 162);

    // Font Awesome Phone / TRN Icon (\uf095)
    drawFAIcon(ctx, "\uf095", 60, 186, 12, "#E11D2E");
    ctx.fillStyle = "#E11D2E";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`TRN: ${data.trnNumber || "100293847500003"}`, 80, 186);

    // Right Header Title & Info
    ctx.textAlign = "right";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 32px sans-serif";
    ctx.fillText(titleText, width - 60, 68);

    // Serial Number in Vibrant Monospace Red
    ctx.fillStyle = "#E11D2E";
    ctx.font = "bold 20px monospace";
    ctx.fillText(data.invoiceNumber, width - 60, 104);

    // Date with Font Awesome Calendar Icon (\uf133)
    drawFAIcon(ctx, "\uf133", width - 175, 140, 13, "#94A3B8");
    ctx.fillStyle = "#94A3B8";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Date: ${data.issuedDate}`, width - 60, 140);

    // Currency with Font Awesome Coins Icon (\uf51e)
    drawFAIcon(ctx, "\uf51e", width - 155, 164, 13, "#94A3B8");
    ctx.fillText(`Currency: ${curr}`, width - 60, 164);
    ctx.textAlign = "left";

    // ==========================================================
    // MIDDLE SECTION: 2 SIDE-BY-SIDE INFORMATION CARDS
    // ==========================================================
    const cardY = 245;
    const cardW = 520;
    const cardH = 215;

    // CARD 1: INVOICE TO / AGENT INFORMATION (Left Card, x = 60)
    const card1X = 60;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(card1X, cardY, cardW, cardH, [16]);
    ctx.fill();
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dark Navy Header Pill
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(card1X, cardY, cardW, 42, [14, 14, 0, 0]);
    ctx.fill();

    // Font Awesome User Icon (\uf007)
    drawFAIcon(ctx, "\uf007", card1X + 22, cardY + 26, 14, "#FFFFFF");

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("INVOICE TO / AGENT INFORMATION", card1X + 44, cardY + 26);

    // Fields
    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Agent Name:", card1X + 25, cardY + 75);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(data.agentName, card1X + 135, cardY + 75);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Agent Code:", card1X + 25, cardY + 110);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px monospace";
    ctx.fillText(data.agentCode || "N/A", card1X + 135, cardY + 110);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Sales Team:", card1X + 25, cardY + 145);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(data.teamName || "General Roster", card1X + 135, cardY + 145);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Unit / Subteam:", card1X + 25, cardY + 180);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(data.subteamName || "Dubai Core Unit", card1X + 135, cardY + 180);

    // Font Awesome User Avatar Watermark Circle on Right (\uf007)
    ctx.fillStyle = "#F1F5F9";
    ctx.beginPath();
    ctx.arc(card1X + 440, cardY + 125, 45, 0, Math.PI * 2);
    ctx.fill();
    drawFAIcon(ctx, "\uf007", card1X + 420, cardY + 140, 48, "#CBD5E1");

    // CARD 2: PROPERTY & TRANSACTION DETAILS (Right Card, x = 620)
    const card2X = 620;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(card2X, cardY, cardW, cardH, [16]);
    ctx.fill();
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vibrant Red Header Pill (#E11D2E)
    ctx.fillStyle = "#E11D2E";
    ctx.beginPath();
    ctx.roundRect(card2X, cardY, cardW, 42, [14, 14, 0, 0]);
    ctx.fill();

    // Font Awesome Building Icon (\uf1ad)
    drawFAIcon(ctx, "\uf1ad", card2X + 22, cardY + 26, 14, "#FFFFFF");

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("PROPERTY & TRANSACTION DETAILS", card2X + 44, cardY + 26);

    // Card 2 Details
    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Developer:", card2X + 25, cardY + 70);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(data.developerName || "N/A", card2X + 135, cardY + 70);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Project / Location:", card2X + 25, cardY + 98);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 13px sans-serif";
    const projLocStr = data.projectName
      ? `${data.projectName}${data.projectLocation ? ` • ${data.projectLocation}` : ""}`
      : data.projectLocation || "N/A";
    ctx.fillText(projLocStr, card2X + 135, cardY + 98);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Buyer Name:", card2X + 25, cardY + 126);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(data.buyerName || "N/A", card2X + 135, cardY + 126);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Unit / SPA Ref:", card2X + 25, cardY + 154);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`${data.unitNumber || "N/A"}   |   ${data.spaReference || "SPA"}`, card2X + 135, cardY + 154);

    // Deal Value & Split % Row
    if (data.commissionReceived || data.projectValue) {
      ctx.fillStyle = "#6B7280";
      ctx.font = "13px sans-serif";
      ctx.fillText(data.commissionReceived ? "Comm. Rec. & %:" : "Deal Value & %:", card2X + 25, cardY + 182);

      ctx.fillStyle = "#E11D2E";
      ctx.font = "bold 13px monospace";

      if (data.commissionReceived) {
        const commRecStr = `${curr} ${Number(data.commissionReceived).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
        const rateStr = data.commissionRate ? ` (${data.commissionRate}% split)` : "";
        ctx.fillText(`${commRecStr}${rateStr}`, card2X + 135, cardY + 182);
      } else if (data.projectValue) {
        const valStr = `${curr} ${Number(data.projectValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
        const rateStr = data.commissionRate ? ` (${data.commissionRate}%)` : "";
        ctx.fillText(`${valStr}${rateStr}`, card2X + 135, cardY + 182);
      }
    }

    // Font Awesome Watermark Building Icon on Right of Card 2 (\uf1ad)
    ctx.fillStyle = "#FEF2F2";
    ctx.beginPath();
    ctx.arc(card2X + 440, cardY + 125, 45, 0, Math.PI * 2);
    ctx.fill();
    drawFAIcon(ctx, "\uf1ad", card2X + 420, cardY + 140, 48, "#FCA5A5");

    // ==========================================================
    // COMMISSION LINE ITEM FINANCIAL TABLE
    // ==========================================================
    const tableY = 485;
    const tableW = 1080;

    // Dark Navy Table Header
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(60, tableY, tableW, 46, [12, 12, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("DESCRIPTION / SERVICE PARTICULAR", 85, tableY + 28);

    ctx.textAlign = "right";
    ctx.fillText(`NET (${curr})`, 670, tableY + 28);
    ctx.fillText(`VAT (${data.vatRate || 0}%)`, 850, tableY + 28);
    ctx.fillText(`TOTAL (${curr})`, 1120, tableY + 28);
    ctx.textAlign = "left";

    // Main Item Data Row
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(60, tableY + 46, tableW, 85);
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1;
    ctx.strokeRect(60, tableY + 46, tableW, 85);

    // Red Circular Badge Icon
    ctx.fillStyle = "#E11D2E";
    ctx.beginPath();
    ctx.arc(98, tableY + 88, 22, 0, Math.PI * 2);
    ctx.fill();

    // Font Awesome House/Deal Icon inside Red Badge (\uf015)
    drawFAIcon(ctx, "\uf015", 88, tableY + 95, 18, "#FFFFFF");

    ctx.fillStyle = "#111827";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(data.particularTitle || particularTitle, 135, tableY + 82);
    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";

    // RENDER ONLY COMMISSION STATUS ON TABLE SUBTEXT (REMARKS OMITTED PER USER DIRECTIVE)
    if (data.commissionStatus && data.commissionStatus !== "NONE") {
      ctx.fillText(data.commissionStatus, 135, tableY + 106);
    }

    ctx.textAlign = "right";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 16px monospace";
    ctx.fillText(data.netAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 670, tableY + 92);
    ctx.fillText(data.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 850, tableY + 92);
    ctx.fillText(data.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 1120, tableY + 92);
    ctx.textAlign = "left";

    // Highlighted TOTAL SUMMARY Section Row
    const sumY = tableY + 131;
    ctx.fillStyle = "#F1F5F9";
    ctx.beginPath();
    ctx.roundRect(60, sumY, tableW, 46, [0, 0, 12, 12]);
    ctx.fill();
    ctx.strokeStyle = "#CBD5E1";
    ctx.strokeRect(60, sumY, tableW, 46);

    // Font Awesome Calculator Icon (\uf1ec)
    drawFAIcon(ctx, "\uf1ec", 80, sumY + 28, 16, "#0F172A");

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("TOTAL SUMMARY", 108, sumY + 28);

    ctx.textAlign = "right";
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#64748B";
    ctx.fillText(curr, 580, sumY + 26);
    ctx.font = "bold 15px monospace";
    ctx.fillStyle = "#0F172A";
    ctx.fillText(data.netAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 670, sumY + 28);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#64748B";
    ctx.fillText(curr, 760, sumY + 26);
    ctx.font = "bold 15px monospace";
    ctx.fillStyle = "#0F172A";
    ctx.fillText(data.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 850, sumY + 28);

    // Dark Navy Summary Accent Pill for Total Payable
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(890, sumY, 250, 46, [0, 0, 12, 0]);
    ctx.fill();

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(curr, 980, sumY + 26);
    ctx.font = "900 18px monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(data.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 1120, sumY + 28);
    ctx.textAlign = "left";

    // ==========================================================
    // BOTTOM PAYMENT DETAILS & SUMMARY BOX
    // ==========================================================
    const botY = 680;
    const botW = 520;

    // LEFT BOX: BANK WIRE PAYMENT DETAILS
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(60, botY, botW, 195, [16]);
    ctx.fill();
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.roundRect(60, botY, botW, 40, [14, 14, 0, 0]);
    ctx.fill();

    // Font Awesome Landmark / Bank Icon (\uf19c)
    drawFAIcon(ctx, "\uf19c", 82, botY + 26, 14, "#0F172A");

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("BANK WIRE PAYMENT DETAILS", 106, botY + 26);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Beneficiary Name:", 85, botY + 70);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(data.accountName || data.companyName, 220, botY + 70);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Bank Name:", 85, botY + 110);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(data.bankName || "Emirates NBD", 220, botY + 110);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Account / IBAN:", 85, botY + 150);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px monospace";
    ctx.fillText(data.iban || "AE480260000001234567890", 220, botY + 150);

    // Font Awesome Watermark Bank Icon (\uf19c)
    ctx.fillStyle = "#F1F5F9";
    ctx.beginPath();
    ctx.arc(60 + 440, botY + 120, 35, 0, Math.PI * 2);
    ctx.fill();
    drawFAIcon(ctx, "\uf19c", 60 + 422, botY + 132, 38, "#CBD5E1");

    // RIGHT BOX: FINANCIAL CALCULATION BREAKDOWN
    const rightBoxX = 620;

    ctx.fillStyle = "#6B7280";
    ctx.font = "14px sans-serif";
    ctx.fillText("Net Commission Subtotal:", rightBoxX + 20, botY + 25);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`${curr} ${data.netAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 1115, botY + 25);
    ctx.textAlign = "left";

    ctx.fillStyle = "#6B7280";
    ctx.font = "14px sans-serif";
    ctx.fillText(`VAT (${data.vatRate || 0}%):`, rightBoxX + 20, botY + 55);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`${curr} ${data.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 1115, botY + 55);
    ctx.textAlign = "left";

    // Deductibles Line Item Summary
    const totalDeductibles = (data.deductibles || []).reduce((acc, d) => acc + d.amount, 0);
    if (totalDeductibles > 0) {
      ctx.fillStyle = "#E11D2E";
      ctx.font = "13px sans-serif";
      ctx.fillText(`Total Deductibles (${data.deductibles?.length || 0} items):`, rightBoxX + 20, botY + 85);
      ctx.textAlign = "right";
      ctx.font = "bold 15px monospace";
      ctx.fillText(`- ${curr} ${totalDeductibles.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 1115, botY + 85);
      ctx.textAlign = "left";
    }

    // GRAND TOTAL PAYABLE HIGHLIGHT BOX (#E11D2E)
    const redBoxY = botY + 105;
    ctx.fillStyle = "#E11D2E";
    ctx.beginPath();
    ctx.roundRect(rightBoxX, redBoxY, 490, 75, [18]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 18px sans-serif";
    ctx.fillText("TOTAL PAYABLE", rightBoxX + 30, redBoxY + 44);

    ctx.textAlign = "right";
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#FCA5A5";
    ctx.fillText(curr, 930, redBoxY + 30);

    ctx.font = "900 28px monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(data.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 1105, redBoxY + 46);
    ctx.textAlign = "left";

    // ==========================================================
    // NOTES SECTION (Bottom Left)
    // ==========================================================
    const notesY = 905;

    // Font Awesome Note Icon (\uf15c)
    drawFAIcon(ctx, "\uf15c", 60, notesY + 16, 14, "#0F172A");

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("NOTES", 84, notesY + 16);

    ctx.fillStyle = "#64748B";
    ctx.font = "13px sans-serif";
    ctx.fillText("Thank you for your trust and partnership.", 60, notesY + 42);
    ctx.fillText("Please make the payment to the account provided above.", 60, notesY + 64);

    // ==========================================================
    // FOOTER: Dark Navy Executive Footer (#0F172A)
    // ==========================================================
    const footerY = height - 60;
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, footerY, width, 60);

    // Font Awesome Shield Check Icon (\uf132)
    drawFAIcon(ctx, "\uf132", 60, footerY + 35, 14, "#E11D2E");

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Official Computer Generated Real Estate Commission Invoice", 84, footerY + 28);
    ctx.fillStyle = "#94A3B8";
    ctx.font = "11px sans-serif";
    const footerCompany = data.companyName || "FHI Global";
    ctx.fillText(`• ${footerCompany} • Dubai, UAE`, 84, footerY + 46);

    ctx.textAlign = "right";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("Page 1 of 1", width - 60, footerY + 36);
    ctx.textAlign = "left";
  }, [data, activeTemplate, faLoaded, curr, loadedLogo]);

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

  return (
    <div className="space-y-6">
      {/* Template Style Selector Toolbar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-wider">Default Bondpaper Invoice Style</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPNG}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Invoice Image (PNG)
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
