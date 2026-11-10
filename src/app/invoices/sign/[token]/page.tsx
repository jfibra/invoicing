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
import { jsPDF } from "jspdf";

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
      if (data.request.agent_name && !signerName) {
        setSignerName(data.request.agent_name);
        setTypedSignature(data.request.agent_name);
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired invoice signing link.");
    } finally {
      setLoading(false);
    }
  }, [token, signerName]);

  useEffect(() => {
    fetchInvoiceForSigning();
  }, [fetchInvoiceForSigning]);

  // Setup Canvas Drawing Pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

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

    if ("touches" in e) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

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

  // Download PDF
  const handleDownloadPdf = () => {
    if (!sigData?.snapshot) return;
    const snap = sigData.snapshot;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("COMMISSION INVOICE STATEMENT", 15, 16);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(snap.companyName || "FHI Global Property LLC", 15, 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`TRN: ${snap.companyTrn || "105088815300001"}`, 15, 42);
    doc.text(`Invoice #: ${sigData.invoice_number}`, 140, 36);
    doc.text(`Agent: ${sigData.agent_name}`, 140, 42);
    doc.text(`Status: ${sigData.status}`, 140, 47);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, 54, 195, 54);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("STATEMENT DETAILS", 15, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Client/Developer: ${snap.customerName || snap.developerName || "N/A"}`, 15, 70);
    doc.text(`Particular: ${snap.categoryName || "Commission"} - ${snap.subcategoryName || snap.projectName || ""}`, 15, 76);

    doc.text(`Net Amount: ${snap.currency || "AED"} ${Number(snap.amount || snap.netAmount || 0).toLocaleString()}`, 15, 84);
    doc.text(`VAT: ${snap.currency || "AED"} ${Number(snap.vatAmount || 0).toLocaleString()}`, 15, 90);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: ${snap.currency || "AED"} ${Number(snap.totalActualAmount || snap.grossAmount || 0).toLocaleString()}`, 15, 98);

    if (sigData.status === "SIGNED") {
      doc.setFillColor(240, 253, 244);
      doc.rect(15, 110, 180, 25, "F");
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`SIGNED ELECTRONICALLY BY: ${sigData.signed_name}`, 20, 118);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Timestamp: ${new Date(sigData.signed_at).toLocaleString()}`, 20, 124);
      doc.text(`Hash: ${sigData.snapshot_hash || "SHA-256 Verified"}`, 20, 129);
    }

    doc.save(`Invoice_${sigData.invoice_number}.pdf`);
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

  const snap = sigData.snapshot || {};
  const isSigned = sigData.status === "SIGNED";
  const isDeclined = sigData.status === "DECLINED";
  const isExpired = sigData.status === "EXPIRED";
  const isRevoked = sigData.status === "REVOKED";
  const canSign = !isSigned && !isDeclined && !isExpired && !isRevoked;

  const curr = snap.currency || "AED";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-red-600 selection:text-white pb-20">
      {/* Top Banner */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-xs print:hidden">
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
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase">
              Secure E-Sign
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Status Callout Banner */}
        {isSigned && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
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
          <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 text-rose-900 flex items-start gap-3.5">
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
          <div className="bg-slate-200 border-2 border-slate-300 rounded-3xl p-6 text-slate-800 flex items-center gap-3.5">
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
          <div className="bg-slate-200 border-2 border-slate-300 rounded-3xl p-6 text-slate-800 flex items-center gap-3.5">
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {snap.companyName || "FHI Global Property LLC"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                TRN: <span className="font-mono font-bold text-slate-700">{snap.companyTrn || "105088815300001"}</span>
              </p>
            </div>
            <div className="sm:text-right text-xs space-y-1">
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider inline-block">
                Commission Statement
              </span>
              <p className="font-mono text-sm font-black text-red-600">{sigData.invoice_number}</p>
              <p className="text-slate-400">
                Date:{" "}
                <span className="text-slate-700 font-semibold">
                  {snap.saleDate || snap.issuedDate
                    ? new Date(snap.saleDate || snap.issuedDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Agent Recipient</span>
              <strong className="text-slate-900 text-sm block">{sigData.agent_name}</strong>
              <p className="text-slate-500">
                Code: {snap.memberCode || snap.agentCode || "N/A"} &bull; {snap.team || snap.teamName || "Direct"}
              </p>
              <p className="font-mono text-slate-600">{sigData.agent_email}</p>
            </div>
            <div className="sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Client / Developer</span>
              <strong className="text-slate-900 text-sm block">
                {snap.customerName || snap.developerName || "N/A"}
              </strong>
              <p className="text-slate-500">
                Project / Particular: {snap.subcategoryName || snap.projectName || "General Brokerage"}
              </p>
              {snap.tinNumber && <p className="font-mono text-slate-600">TRN/TIN: {snap.tinNumber}</p>}
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-right">Net Commission</th>
                  <th className="py-2.5 text-right">VAT (5%)</th>
                  <th className="py-2.5 text-right">Total Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4">
                    <p className="font-black text-slate-900">
                      {snap.categoryName || "Real Estate Brokerage Sales Commission"}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {snap.subcategoryName || snap.projectName || "Standard Deal"}
                    </p>
                  </td>
                  <td className="py-4 text-right font-mono font-bold text-slate-800">
                    {Number(snap.amount || snap.netAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-right font-mono text-slate-600">
                    {Number(snap.vatAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-right font-mono font-black text-slate-900 text-sm">
                    {Number(snap.totalActualAmount || snap.grossAmount || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Bar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-700">Total Net Amount Payable:</span>
            <span className="font-mono text-lg font-black text-emerald-700">
              {curr} {Number(snap.totalActualAmount || snap.grossAmount || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Existing Signature Stamp if signed */}
          {isSigned && sigData.signed_signature_data && (
            <div className="pt-6 border-t border-slate-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Recorded Electronic Signature
              </span>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
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

