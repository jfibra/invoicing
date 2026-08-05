"use client";

import React, { useRef, useEffect, useState } from "react";
import { Download, Sparkles, CheckCircle2, Coins, Calendar, ShieldCheck, Landmark } from "lucide-react";

export interface CashAdvancePaymentRecord {
  id: number;
  cash_advance_id: number;
  receipt_number: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  remarks?: string;
  created_at?: string;
}

export interface CashAdvanceCanvasData {
  mode: "DISBURSEMENT" | "REPAYMENT_RECEIPT";
  cashAdvanceCode: string;
  issuedDate: string;
  agentName: string;
  agentCode?: string;
  agentEmail?: string;
  teamName?: string;
  subteamName?: string;
  advanceAmount: number;
  currency: string;
  repaymentTermType: "WEEKS" | "MONTHS";
  repaymentTermValue: number;
  totalRepaymentAmount: number;
  installmentAmount: number;
  dueStartDate: string;
  dueEndDate: string;
  totalPaidAmount: number;
  balanceDue: number;
  status: string;
  remarks?: string;
  companyName?: string;
  trnNumber?: string;
  addressLine1?: string;
  cityCountry?: string;
  logoUrl?: string;

  // Specific to Repayment Receipt mode
  paymentRecord?: CashAdvancePaymentRecord;
}

export default function CashAdvanceCanvasPreview({
  data,
}: {
  data: CashAdvanceCanvasData;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [faLoaded, setFaLoaded] = useState(false);
  const [loadedLogo, setLoadedLogo] = useState<HTMLImageElement | null>(null);

  const curr = data.currency || "AED";
  const companyName = data.companyName || "FHI Global";

  // Preload & Cache Logo Image for Canvas
  useEffect(() => {
    let rawUrl = data.logoUrl || "/leuteriorealty.svg";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      rawUrl = `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
    }

    const img = new Image();
    img.src = rawUrl;
    img.onload = () => setLoadedLogo(img);
    img.onerror = () => {
      if (rawUrl !== "/leuteriorealty.svg") {
        const fallback = new Image();
        fallback.src = "/leuteriorealty.svg";
        fallback.onload = () => setLoadedLogo(fallback);
      }
    };
  }, [data.logoUrl]);

  // Preload Font Awesome 6 Solid Font
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

    // Helper: Font Awesome Icons
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
    // TOP HEADER SECTION: Sleek Dark Slate Banner (#0F172A)
    // ==========================================================
    const headerH = 210;
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, width, headerH);

    // Red Accent Stripe (#E11D2E)
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

    // Render Preloaded Logo
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
      ctx.fillText(companyName, 60, 65);
    }

    // Address & TRN
    drawFAIcon(ctx, "\uf3c5", 60, 140, 14, "#E11D2E");
    ctx.fillStyle = "#94A3B8";
    ctx.font = "14px sans-serif";
    ctx.fillText(data.addressLine1 || "Opus Tower by Omniyat, Business Bay", 80, 140);
    ctx.fillText(data.cityCountry || "Dubai, United Arab Emirates", 80, 162);

    drawFAIcon(ctx, "\uf095", 60, 186, 12, "#E11D2E");
    ctx.fillStyle = "#E11D2E";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`TRN: ${data.trnNumber || "100293847500003"}`, 80, 186);

    // Right Header Title & Ref Code
    ctx.textAlign = "right";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 28px sans-serif";

    const titleText = data.mode === "REPAYMENT_RECEIPT" ? "REPAYMENT RECEIPT" : "CASH ADVANCE VOUCHER";
    const refCode = data.mode === "REPAYMENT_RECEIPT" && data.paymentRecord
      ? data.paymentRecord.receipt_number
      : data.cashAdvanceCode;

    ctx.fillText(titleText, width - 60, 68);

    ctx.fillStyle = "#E11D2E";
    ctx.font = "bold 20px monospace";
    ctx.fillText(refCode, width - 60, 104);

    drawFAIcon(ctx, "\uf133", width - 175, 140, 13, "#94A3B8");
    ctx.fillStyle = "#94A3B8";
    ctx.font = "14px sans-serif";
    const displayDate = data.mode === "REPAYMENT_RECEIPT" && data.paymentRecord
      ? data.paymentRecord.payment_date
      : data.issuedDate;
    ctx.fillText(`Date: ${displayDate}`, width - 60, 140);

    drawFAIcon(ctx, "\uf51e", width - 155, 164, 13, "#94A3B8");
    ctx.fillText(`Currency: ${curr}`, width - 60, 164);
    ctx.textAlign = "left";

    // ==========================================================
    // MIDDLE SECTION: 2 SIDE-BY-SIDE INFORMATION CARDS
    // ==========================================================
    const cardY = 245;
    const cardW = 520;
    const cardH = 215;

    // CARD 1: AGENT INFORMATION
    const card1X = 60;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(card1X, cardY, cardW, cardH, [16]);
    ctx.fill();
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(card1X, cardY, cardW, 42, [14, 14, 0, 0]);
    ctx.fill();

    drawFAIcon(ctx, "\uf007", card1X + 22, cardY + 26, 14, "#FFFFFF");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("AGENT / RECIPIENT INFORMATION", card1X + 44, cardY + 26);

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

    // Watermark Icon
    ctx.fillStyle = "#F1F5F9";
    ctx.beginPath();
    ctx.arc(card1X + 440, cardY + 125, 45, 0, Math.PI * 2);
    ctx.fill();
    drawFAIcon(ctx, "\uf007", card1X + 420, cardY + 140, 48, "#CBD5E1");

    // CARD 2: CASH ADVANCE TERMS & SUMMARY
    const card2X = 620;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(card2X, cardY, cardW, cardH, [16]);
    ctx.fill();
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#E11D2E";
    ctx.beginPath();
    ctx.roundRect(card2X, cardY, cardW, 42, [14, 14, 0, 0]);
    ctx.fill();

    drawFAIcon(ctx, "\uf0d6", card2X + 22, cardY + 26, 14, "#FFFFFF");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("CASH ADVANCE TERMS & STATUS", card2X + 44, cardY + 26);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Advance Code:", card2X + 25, cardY + 70);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px monospace";
    ctx.fillText(data.cashAdvanceCode, card2X + 145, cardY + 70);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Repayment Term:", card2X + 25, cardY + 98);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`${data.repaymentTermValue} ${data.repaymentTermType}`, card2X + 145, cardY + 98);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Installment Amt:", card2X + 25, cardY + 126);
    ctx.fillStyle = "#E11D2E";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`${curr} ${Number(data.installmentAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })} / ${data.repaymentTermType === "WEEKS" ? "wk" : "mo"}`, card2X + 145, cardY + 126);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Schedule Due:", card2X + 25, cardY + 154);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${data.dueStartDate} to ${data.dueEndDate}`, card2X + 145, cardY + 154);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Advance Status:", card2X + 25, cardY + 182);
    ctx.fillStyle = data.status === "PAID" ? "#059669" : "#E11D2E";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(data.status, card2X + 145, cardY + 182);

    ctx.fillStyle = "#FEF2F2";
    ctx.beginPath();
    ctx.arc(card2X + 440, cardY + 125, 45, 0, Math.PI * 2);
    ctx.fill();
    drawFAIcon(ctx, "\uf0d6", card2X + 420, cardY + 140, 48, "#FCA5A5");

    // ==========================================================
    // DISBURSEMENT / REPAYMENT FINANCIAL SUMMARY TABLE
    // ==========================================================
    const tableY = 485;
    const tableW = 1080;

    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(60, tableY, tableW, 46, [12, 12, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("DESCRIPTION / TRANSACTION PARTICULAR", 85, tableY + 28);

    ctx.textAlign = "right";
    ctx.fillText(`AMOUNT (${curr})`, 850, tableY + 28);
    ctx.fillText(`TOTAL (${curr})`, 1120, tableY + 28);
    ctx.textAlign = "left";

    // Row 1: Primary Transaction Line
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(60, tableY + 46, tableW, 85);
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1;
    ctx.strokeRect(60, tableY + 46, tableW, 85);

    ctx.fillStyle = "#E11D2E";
    ctx.beginPath();
    ctx.arc(98, tableY + 88, 22, 0, Math.PI * 2);
    ctx.fill();

    drawFAIcon(ctx, data.mode === "REPAYMENT_RECEIPT" ? "\uf00c" : "\uf0d6", 88, tableY + 95, 18, "#FFFFFF");

    const rowTitle = data.mode === "REPAYMENT_RECEIPT"
      ? `Cash Advance Partial/Full Repayment Receipt (${data.paymentRecord?.payment_method || 'BANK_TRANSFER'})`
      : `Cash Advance Principal Disbursement to Agent (${data.repaymentTermValue} ${data.repaymentTermType} Term)`;

    const mainRowAmount = data.mode === "REPAYMENT_RECEIPT" && data.paymentRecord
      ? data.paymentRecord.payment_amount
      : data.advanceAmount;

    ctx.fillStyle = "#111827";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(rowTitle, 135, tableY + 82);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    const rowSubtext = data.mode === "REPAYMENT_RECEIPT"
      ? `Receipt Ref: ${data.paymentRecord?.receipt_number || 'N/A'} • CA Ref: ${data.cashAdvanceCode}`
      : `Repayment Schedule: ${data.repaymentTermValue} installments of ${curr} ${Number(data.installmentAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    ctx.fillText(rowSubtext, 135, tableY + 106);

    ctx.textAlign = "right";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 16px monospace";
    ctx.fillText(mainRowAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 850, tableY + 92);
    ctx.fillText(mainRowAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 1120, tableY + 92);
    ctx.textAlign = "left";

    // Summary Banner Row
    const sumY = tableY + 131;
    ctx.fillStyle = "#F1F5F9";
    ctx.beginPath();
    ctx.roundRect(60, sumY, tableW, 46, [0, 0, 12, 12]);
    ctx.fill();
    ctx.strokeStyle = "#CBD5E1";
    ctx.strokeRect(60, sumY, tableW, 46);

    drawFAIcon(ctx, "\uf1ec", 80, sumY + 28, 16, "#0F172A");
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("TRANSACTION TOTAL", 108, sumY + 28);

    ctx.textAlign = "right";
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#64748B";
    ctx.fillText(curr, 760, sumY + 26);
    ctx.font = "bold 15px monospace";
    ctx.fillStyle = "#0F172A";
    ctx.fillText(mainRowAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 850, sumY + 28);

    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(890, sumY, 250, 46, [0, 0, 12, 0]);
    ctx.fill();

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(curr, 980, sumY + 26);
    ctx.font = "900 18px monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(mainRowAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }), 1120, sumY + 28);
    ctx.textAlign = "left";

    // ==========================================================
    // BOTTOM PAYMENT DETAILS & SUMMARY BOX
    // ==========================================================
    const botY = 680;
    const botW = 520;

    // LEFT BOX: BANK / PAYMENT DETAILS
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

    drawFAIcon(ctx, "\uf19c", 82, botY + 26, 14, "#0F172A");
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("OFFICIAL PAYMENT ACKNOWLEDGEMENT", 106, botY + 26);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Issued By:", 85, botY + 70);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(companyName, 220, botY + 70);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Recipient Agent:", 85, botY + 110);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(data.agentName, 220, botY + 110);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Payment Method:", 85, botY + 150);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px monospace";
    const methodStr = data.mode === "REPAYMENT_RECEIPT" && data.paymentRecord
      ? data.paymentRecord.payment_method
      : "COMPANY DISBURSEMENT";
    ctx.fillText(methodStr, 220, botY + 150);

    // Watermark Bank Icon
    ctx.fillStyle = "#F1F5F9";
    ctx.beginPath();
    ctx.arc(60 + 440, botY + 120, 35, 0, Math.PI * 2);
    ctx.fill();
    drawFAIcon(ctx, "\uf19c", 60 + 422, botY + 132, 38, "#CBD5E1");

    // RIGHT BOX: REPAYMENT BALANCE BREAKDOWN
    const rightBoxX = 620;

    ctx.fillStyle = "#6B7280";
    ctx.font = "14px sans-serif";
    ctx.fillText("Total Disbursed Principal:", rightBoxX + 20, botY + 25);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`${curr} ${Number(data.advanceAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 1115, botY + 25);
    ctx.textAlign = "left";

    ctx.fillStyle = "#6B7280";
    ctx.font = "14px sans-serif";
    ctx.fillText("Total Repayments Made:", rightBoxX + 20, botY + 55);
    ctx.textAlign = "right";
    ctx.fillStyle = "#059669";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`+ ${curr} ${Number(data.totalPaidAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 1115, botY + 55);
    ctx.textAlign = "left";

    ctx.fillStyle = "#E11D2E";
    ctx.font = "14px sans-serif";
    ctx.fillText("Outstanding Balance Due:", rightBoxX + 20, botY + 85);
    ctx.textAlign = "right";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`${curr} ${Number(data.balanceDue).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 1115, botY + 85);
    ctx.textAlign = "left";

    // GRAND HIGHLIGHT BOX (#E11D2E or #059669 if PAID)
    const redBoxY = botY + 105;
    const boxColor = data.status === "PAID" ? "#059669" : "#E11D2E";

    ctx.fillStyle = boxColor;
    ctx.beginPath();
    ctx.roundRect(rightBoxX, redBoxY, 490, 75, [18]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 16px sans-serif";
    const boxLabel = data.mode === "REPAYMENT_RECEIPT" ? "PAYMENT RECEIVED" : "OUTSTANDING BALANCE";
    ctx.fillText(boxLabel, rightBoxX + 30, redBoxY + 44);

    ctx.textAlign = "right";
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#FCA5A5";
    ctx.fillText(curr, 930, redBoxY + 30);

    ctx.font = "900 28px monospace";
    ctx.fillStyle = "#FFFFFF";
    const highlightAmt = data.mode === "REPAYMENT_RECEIPT" && data.paymentRecord
      ? data.paymentRecord.payment_amount
      : data.balanceDue;
    ctx.fillText(highlightAmt.toLocaleString("en-US", { minimumFractionDigits: 2 }), 1105, redBoxY + 46);
    ctx.textAlign = "left";

    // ==========================================================
    // NOTES SECTION
    // ==========================================================
    const notesY = 905;
    drawFAIcon(ctx, "\uf15c", 60, notesY + 16, 14, "#0F172A");

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("REPAYMENT TERMS & REMARKS", 84, notesY + 16);

    ctx.fillStyle = "#64748B";
    ctx.font = "13px sans-serif";
    const defaultNote = data.mode === "REPAYMENT_RECEIPT"
      ? "Official receipt for cash advance repayment. Balance has been automatically updated."
      : `Repayment starts on ${data.dueStartDate} and ends on ${data.dueEndDate}. Repayments are deducted via agent payouts or bank transfer.`;

    ctx.fillText(data.remarks || defaultNote, 60, notesY + 42);

    // FOOTER
    const footerY = height - 60;
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, footerY, width, 60);

    drawFAIcon(ctx, "\uf132", 60, footerY + 35, 14, "#E11D2E");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Official Computer Generated Cash Advance Voucher / Repayment Receipt", 84, footerY + 28);
    ctx.fillStyle = "#94A3B8";
    ctx.font = "11px sans-serif";
    ctx.fillText(`• ${companyName} • Dubai, UAE`, 84, footerY + 46);

    ctx.textAlign = "right";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("Page 1 of 1", width - 60, footerY + 36);
    ctx.textAlign = "left";
  }, [data, faLoaded, curr, loadedLogo]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageURI = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${data.mode}_${data.cashAdvanceCode}.png`;
    link.href = imageURI;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {data.mode === "REPAYMENT_RECEIPT" ? "Cash Advance Repayment Receipt" : "Cash Advance Disbursement Voucher"}
          </span>
        </div>

        <button
          onClick={handleDownloadPNG}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Canvas Image (PNG)
        </button>
      </div>

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
