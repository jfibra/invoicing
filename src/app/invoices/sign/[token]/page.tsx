"use client";

import React, { useState, useEffect, useRef, useCallback, use } from "react";
import Image from "next/image";
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
  Eraser,
  PenTool,
  Loader2,
  Lock,
  Landmark,
} from "lucide-react";
import { generateInvoicePdf } from "@/lib/invoicePdfGenerator";
import { normalizeInvoiceSnapshot } from "@/lib/snapshotNormalize";
import { useSinglePagePrint } from "@/lib/useSinglePagePrint";

interface SignPageProps {
  params: Promise<{ token: string }>;
}

export default function InvoiceSigningPage({ params }: SignPageProps) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sigData, setSigData] = useState<any | null>(null);

  // Signing Form State
  const [signerName, setSignerName] = useState("");
  const [signatureMode, setSignatureMode] = useState<"DRAW" | "TYPE">("DRAW");
  const [typedSignature, setTypedSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  // Decline Modal State
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining] = useState(false);

  // Canvas Drawing Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  useSinglePagePrint(sheetRef);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const fetchInvoiceForSigning = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/signature/public?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load invoice for review.");
      }

      setSigData(data.request);
      if (data.request.agent_name) {
        setSignerName((prev) => prev || data.request.agent_name);
        setTypedSignature((prev) => prev || data.request.agent_name);
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired invoice signing link.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvoiceForSigning();
  }, [fetchInvoiceForSigning]);

  // Scaled coordinates mapping screen pointer to canvas internal coordinates
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  // Setup Canvas Drawing Pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if ("touches" in e) {
      e.stopPropagation();
    }

    setIsDrawing(true);
    setHasDrawn(true);

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if ("touches" in e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Convert typed text to signature image data
  const generateTypedSignatureData = (name: string): string => {
    const c = document.createElement("canvas");
    c.width = 400;
    c.height = 120;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.font = "italic 32px 'Brush Script MT', 'Dancing Script', cursive, serif";
    ctx.fillStyle = "#0f172a";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 20, 60);
    return c.toDataURL("image/png");
  };

  // Submit Signature
  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!consentGiven) {
      setSubmitError("Please confirm your agreement by checking the legal consent acknowledgment box.");
      return;
    }

    if (!signerName.trim()) {
      setSubmitError("Please enter your full legal name.");
      return;
    }

    let finalSigData = "";
    if (signatureMode === "DRAW") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        setSubmitError("Please draw your signature in the signature box.");
        return;
      }
      finalSigData = canvas.toDataURL("image/png");
    } else {
      if (!typedSignature.trim()) {
        setSubmitError("Please type your signature.");
        return;
      }
      finalSigData = generateTypedSignatureData(typedSignature.trim());
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices/signature/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "sign",
          signer_name: signerName.trim(),
          signature_data: finalSigData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit signature.");
      }

      setSubmitSuccess(true);
      fetchInvoiceForSigning();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record signature.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Decline
  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineReason.trim()) return;

    setDeclining(true);
    try {
      const res = await fetch("/api/invoices/signature/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "decline",
          decline_reason: declineReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to decline invoice.");

      setDeclineOpen(false);
      fetchInvoiceForSigning();
    } catch (err: any) {
      alert(`Decline Error: ${err.message}`);
    } finally {
      setDeclining(false);
    }
  };

  // Download PDF using unified executive A4 generator
  const handleDownloadPdf = async () => {
    if (!sigData?.snapshot) return;
    try {
      const norm = normalizeInvoiceSnapshot(sigData.snapshot);
      const curr = norm.currency || "AED";
      const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });
      const issuedLabel = norm.issuedDate ? new Date(norm.issuedDate).toLocaleDateString() : "N/A";

      const items = [
        ...(norm.commissionReceived && norm.commissionReceived > 0
          ? [
              {
                description: "Gross Commission Received",
                subDescription: "Developer payment for closed transaction",
                basisOrRate: "Base Deal",
                taxTreatment: "Standard Rate",
                amountText: fmt(norm.commissionReceived),
              },
            ]
          : []),
        {
          description: norm.categoryTitle,
          subDescription: `${norm.projectOrParticular}${norm.unitNumber ? ` • Unit ${norm.unitNumber}` : ""}`,
          basisOrRate:
            norm.commissionRate !== null && norm.commissionRate !== undefined
              ? `${norm.commissionRate}%`
              : "Net Split",
          taxTreatment: "Net Taxable",
          amountText: fmt(norm.netAmount),
        },
        {
          description: "Value Added Tax (Output VAT)",
          subDescription: norm.vatAmount > 0 ? `Standard ${norm.vatRate}% VAT applied` : "Zero-rated or exempt",
          basisOrRate: `${norm.vatRate}%`,
          taxTreatment: norm.vatAmount > 0 ? "Output VAT" : "Exempt",
          amountText: fmt(norm.vatAmount),
          isTaxPositive: norm.vatAmount > 0,
        },
        ...norm.deductibles.map((ded) => ({
          description: `Less Deductible: ${ded.label}`,
          basisOrRate: "—",
          taxTreatment: "Deduction",
          amountText: `- ${fmt(ded.amount)}`,
          isDeduction: true,
        })),
      ];

      const clientLines: string[] = [
        `Project / Particular: ${norm.projectOrParticular}${norm.unitNumber ? ` • Unit ${norm.unitNumber}` : ""}`,
      ];
      if (norm.buyerName) clientLines.push(`Buyer: ${norm.buyerName}`);
      if (norm.tinNumber) clientLines.push(`TRN / TIN: ${norm.tinNumber}`);

      await generateInvoicePdf({
        fileName: `Invoice_${sigData.invoice_number}.pdf`,
        badgeText: norm.invoiceTypeLabel.toUpperCase(),
        invoiceNumber: sigData.invoice_number,
        issueDate: issuedLabel,
        statusLabel: sigData.status || "ACTIVE",
        companyName: norm.companyName,
        companyAddress: "Dubai, United Arab Emirates",
        companyTrn: norm.companyTrn,
        logoUrl: "/fhi.png",
        leftParty: {
          title: "AGENT RECIPIENT",
          heading: sigData.agent_name || "Agent",
          lines: [
            `Code: ${norm.memberCode} • ${norm.team}${norm.subteam ? ` • ${norm.subteam}` : ""}`,
            `Email: ${sigData.agent_email || "N/A"}`,
          ],
        },
        rightParty: {
          title: "CLIENT / DEVELOPER",
          heading: norm.customerOrDeveloper,
          lines: clientLines,
        },
        currency: curr,
        items,
        settlementLines: [
          "Commission payout is processed in accordance with approved agency split agreements and itemized deductions shown above.",
        ],
        paymentTerms: "For split or deduction inquiries, please contact Finance prior to signing.",
        netLabel: "Net Commission:",
        netValue: `${curr} ${fmt(norm.netAmount)}`,
        vatLabel: `Output VAT (${norm.vatRate}%):`,
        vatValue: `+ ${curr} ${fmt(norm.vatAmount)}`,
        deductiblesValue: norm.totalDeductibles > 0 ? `- ${curr} ${fmt(norm.totalDeductibles)}` : null,
        totalLabel: "Total Net Amount Payable:",
        totalValue: `${curr} ${fmt(norm.totalAmount)}`,
        remarks: norm.remarks || null,
        footerTitle: "Official Real Estate Commission Statement",
        signature: {
          isSigned: sigData.status === "SIGNED",
          signedName: sigData.signed_name,
          signedAt: sigData.signed_at,
          signatureDataUrl: sigData.signed_signature_data,
          snapshotHash: sigData.snapshot_hash,
        },
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try using the Print button.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500 font-bold text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
        <span>Loading Secure Invoice Signing Portal...</span>
      </div>
    );
  }

  if (error || !sigData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-black text-slate-900">Signing Link Unavailable</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || "This signing link may have expired or been revoked by the sender. Please contact your company administrator."}
          </p>
        </div>
      </div>
    );
  }

  const norm = normalizeInvoiceSnapshot(sigData.snapshot);
  const isSigned = sigData.status === "SIGNED";
  const isDeclined = sigData.status === "DECLINED";
  const isExpired = sigData.status === "EXPIRED";
  const isRevoked = sigData.status === "REVOKED";
  const canSign = !isSigned && !isDeclined && !isExpired && !isRevoked;

  const curr = norm.currency;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-red-600 selection:text-white pb-20 print:min-h-0 print:bg-white print:pb-0">
      {/* Top Banner */}
      <header className="sticky top-0 z-30 bg-[#001f3f] text-white border-b-2 border-red-600 px-6 py-3 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/fhi.png"
              alt="Filipino Homes"
              width={160}
              height={45}
              className="object-contain h-8 w-auto"
              priority
            />
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
              Secure E-Sign
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-200" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 print:max-w-none print:p-0 print:space-y-0">
        {/* Status Callout Banner */}
        {isSigned && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs print:hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black">Invoice Verified &amp; Signed</h2>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Signed electronically by <strong>{sigData.signed_name}</strong> on{" "}
                  {new Date(sigData.signed_at).toLocaleString()}.
                </p>
                <p className="text-[10px] font-mono text-emerald-600 mt-0.5">
                  SHA-256 Hash: {sigData.snapshot_hash}
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black uppercase">
              Locked &bull; Tamper-Evident
            </div>
          </div>
        )}

        {isDeclined && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 text-rose-900 flex items-start gap-3.5 print:hidden">
            <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-black">Invoice Declined</h2>
              <p className="text-xs text-rose-700 mt-0.5">
                This invoice was declined on {new Date(sigData.declined_at).toLocaleDateString()}.
              </p>
              <p className="text-xs text-rose-800 font-semibold mt-1">
                Reason: &ldquo;{sigData.declined_reason}&rdquo;
              </p>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="bg-slate-200 border-2 border-slate-300 rounded-3xl p-6 text-slate-800 flex items-center gap-3.5 print:hidden">
            <Clock className="w-6 h-6 text-slate-500" />
            <div>
              <h2 className="text-base font-black">Signing Link Expired</h2>
              <p className="text-xs text-slate-600">
                This link reached its validity date. Please ask your administrator to issue a reminder or new link.
              </p>
            </div>
          </div>
        )}

        {isRevoked && (
          <div className="bg-slate-200 border-2 border-slate-300 rounded-3xl p-6 text-slate-800 flex items-center gap-3.5 print:hidden">
            <Lock className="w-6 h-6 text-slate-500" />
            <div>
              <h2 className="text-base font-black">Signing Link Revoked</h2>
              <p className="text-xs text-slate-600">
                This link was revoked by the administrator. A revised version may be in progress.
              </p>
            </div>
          </div>
        )}

        {/* Invoice Statement Card */}
        <div
          ref={sheetRef}
          className="invoice-print-page bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:rounded-none print:border-none print:shadow-none print:p-0 print:w-full print:max-w-none print:box-border"
        >
          {/* Header Banner (#001f3f Navy for high-contrast white logo) */}
          <div className="bg-[#001f3f] text-white border-b-4 border-red-600 p-6 sm:px-10 sm:py-6 print:px-9 print:py-4 flex flex-col sm:flex-row print:flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <Image
                src="/fhi.png"
                alt="Filipino Homes"
                width={170}
                height={48}
                className="object-contain h-9 w-auto"
                priority
              />
              <div>
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {norm.companyName}
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  TRN: <span className="font-mono font-bold text-white">{norm.companyTrn}</span>
                </p>
              </div>
            </div>
            <div className="sm:text-right print:text-right text-xs space-y-1">
              <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider inline-block">
                {norm.invoiceTypeLabel}
              </span>
              <p className="font-mono text-sm font-black text-white whitespace-nowrap">{sigData.invoice_number}</p>
              <p className="text-slate-300">
                Date:{" "}
                <span className="text-white font-semibold whitespace-nowrap">
                  {norm.issuedDate
                    ? new Date(norm.issuedDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="invoice-print-body p-5 sm:p-8 print:px-9 print:py-4 space-y-6 print:space-y-3">

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 bg-slate-50 p-4 print:p-3.5 rounded-2xl text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Agent Recipient</span>
              <strong className="text-slate-900 text-sm block">{sigData.agent_name}</strong>
              <p className="text-slate-500">
                Code: {norm.memberCode} &bull; {norm.team}
                {norm.subteam ? ` • ${norm.subteam}` : ""}
              </p>
              <p className="font-mono text-slate-600">{sigData.agent_email}</p>
            </div>
            <div className="sm:border-l sm:border-slate-200 sm:pl-4 print:border-l print:border-slate-200 print:pl-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Client / Developer</span>
              <strong className="text-slate-900 text-sm block">
                {norm.customerOrDeveloper}
              </strong>
              <p className="text-slate-500">
                Project / Particular: {norm.projectOrParticular}
                {norm.unitNumber ? ` • Unit ${norm.unitNumber}` : ""}
              </p>
              {norm.buyerName && <p className="text-slate-500">Buyer: {norm.buyerName}</p>}
              {norm.tinNumber && <p className="font-mono text-slate-600">TRN/TIN: {norm.tinNumber}</p>}
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 pr-3 print:py-1.5">Item Description</th>
                  <th className="py-2.5 px-2 print:py-1.5 text-right whitespace-nowrap">Net Comm.</th>
                  <th className="py-2.5 px-2 print:py-1.5 text-right whitespace-nowrap">VAT ({norm.vatRate}%)</th>
                  <th className="py-2.5 pl-2 print:py-1.5 text-right whitespace-nowrap">Total Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 pr-3 print:py-2.5">
                    <p className="font-black text-slate-900">{norm.categoryTitle}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {norm.projectOrParticular}
                      {norm.unitNumber ? ` • Unit ${norm.unitNumber}` : ""}
                    </p>
                  </td>
                  <td className="py-4 px-2 print:py-2.5 text-right font-mono tabular-nums whitespace-nowrap font-bold text-slate-800">
                    {norm.netAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-2 print:py-2.5 text-right font-mono tabular-nums whitespace-nowrap text-slate-600">
                    {norm.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 pl-2 print:py-2.5 text-right font-mono tabular-nums whitespace-nowrap font-black text-slate-900 text-sm">
                    {norm.totalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>

                {norm.deductibles.map((ded, idx) => (
                  <tr key={idx} className="bg-amber-50/30">
                    <td className="py-2.5 pr-3 print:py-1.5 text-amber-900 font-semibold" colSpan={3}>
                      Less Deductible: {ded.label}
                    </td>
                    <td className="py-2.5 pl-2 print:py-1.5 text-right font-mono tabular-nums whitespace-nowrap font-bold text-amber-700">
                      - {ded.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {norm.remarks && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <span className="font-bold text-slate-700">Remarks: </span>
              {norm.remarks}
            </div>
          )}

          {/* Total Bar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 print:p-3 flex items-center justify-between text-xs print:break-inside-avoid">
            <span className="font-extrabold text-slate-700">Total Net Amount Payable:</span>
            <span className="font-mono text-lg font-black text-emerald-700">
              {curr} {norm.totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Existing Signature Stamp if signed */}
          {isSigned && sigData.signed_signature_data && (
            <div className="pt-6 print:pt-3 border-t border-slate-200 space-y-2 print:break-inside-avoid">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Recorded Electronic Signature
              </span>
              <div className="p-4 print:p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
                <img
                  src={sigData.signed_signature_data}
                  alt="Saved Signature"
                  className="max-h-16 object-contain"
                />
                <p className="font-mono text-xs font-bold text-slate-800 mt-2">{sigData.signed_name}</p>
                <p className="text-[10px] text-slate-400">
                  Signed on {new Date(sigData.signed_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          </div>

          {/* Navy Branded Footer (#001f3f) */}
          <div className="bg-[#001f3f] text-white border-t-4 border-red-600 px-6 py-3.5 sm:px-8 print:px-9 print:py-2.5 flex flex-col sm:flex-row print:flex-row items-center justify-between gap-2 text-[11px] mt-auto print:shrink-0 print:break-inside-avoid">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="font-bold">Official Real Estate Commission Statement</span>
              <span className="text-slate-300 hidden sm:inline print:inline">&bull; {norm.companyName}</span>
            </div>
            <span className="font-mono text-slate-300 font-semibold whitespace-nowrap">
              {sigData.invoice_number} &bull; Page 1 of 1
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE E-SIGNATURE CARD (Shown only if pending) */}
        {/* ========================================================================= */}
        {canSign && (
          <div className="bg-white rounded-3xl border-2 border-red-200 shadow-lg p-6 sm:p-8 space-y-6 print:hidden">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-red-600" />
                Electronic Signature Acknowledgment
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please review the details above and provide your electronic signature acknowledgment below.
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSign} className="space-y-6 text-xs">
              {/* Signer Full Legal Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900">
                  Signer Full Legal Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={signerName}
                  onChange={(e) => {
                    setSignerName(e.target.value);
                    if (signatureMode === "TYPE") setTypedSignature(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>

              {/* Mode Toggle: Draw vs Type */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900">Signature Method</label>
                  <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSignatureMode("DRAW")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        signatureMode === "DRAW" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Draw Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureMode("TYPE");
                        if (!typedSignature) setTypedSignature(signerName);
                      }}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        signatureMode === "TYPE" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Type Signature
                    </button>
                  </div>
                </div>

                {signatureMode === "DRAW" ? (
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl bg-slate-50/50 overflow-hidden">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-40 touch-none cursor-crosshair bg-white"
                      />
                      {!hasDrawn && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                          Sign here with finger or mouse
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleClearCanvas}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Clear Signature</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Type your signature here..."
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-lg font-serif italic text-slate-900 focus:bg-white focus:outline-none focus:border-red-600"
                    />
                    <p className="text-[11px] text-slate-400">
                      Your typed name will be converted into a cryptographic signature stamp.
                    </p>
                  </div>
                )}
              </div>

              {/* Legal Consent Disclaimer Checkbox */}
              <label className="flex items-start gap-3 p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 text-[11px] text-slate-700 leading-relaxed cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-red-600 rounded cursor-pointer flex-shrink-0"
                />
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-900 block">
                    Legal Consent &amp; Disclosure Acknowledgment *
                  </span>
                  <p className="text-slate-600">
                    I confirm that I have reviewed the invoice details, calculation breakdown, and terms. I agree that my electronic signature constitutes my formal acknowledgment and confirmation under company agreement. Note: Jurisdiction-specific signature legalities may vary; consult legal counsel if statutory formalities apply.
                  </p>
                </div>
              </label>

              {/* Actions Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setDeclineOpen(true)}
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs cursor-pointer"
                >
                  Decline / Request Revision
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-98"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Signature...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sign &amp; Acknowledge Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Decline Reason Modal */}
      {declineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="font-black text-base text-slate-900">Decline Invoice</h3>
            <p className="text-xs text-slate-500">
              Please specify the reason or corrections requested. The administrator will be notified immediately.
            </p>
            <form onSubmit={handleDecline} className="space-y-4">
              <textarea
                required
                rows={4}
                placeholder="e.g. Discrepancy in commission percentage or missing deduction line item..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-red-600"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeclineOpen(false)}
                  disabled={declining}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={declining}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  {declining ? "Submitting..." : "Submit Decline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

