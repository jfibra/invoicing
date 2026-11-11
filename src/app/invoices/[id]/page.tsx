"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Printer,
  Download,
  Mail,
  ArrowLeft,
  Building2,
  Building,
  User,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  RotateCcw,
  Paperclip,
  Landmark,
  Eye,
  RefreshCw,
  Loader2,
  ExternalLink,
  Lock,
  Unlock,
  Coins,
  Percent,
  Layers,
} from "lucide-react";
import SendSignatureModal from "@/components/SendSignatureModal";
import { jsPDF } from "jspdf";

interface CommissionInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default function CommissionInvoiceDetailPage({ params }: CommissionInvoicePageProps) {
  const router = useRouter();
  const { id: invoiceId } = use(params);

  const [invoice, setInvoice] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [address, setAddress] = useState<any | null>(null);
  const [logo, setLogo] = useState<any | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [signatureHistory, setSignatureHistory] = useState<{
    activeRequest: any | null;
    requests: any[];
    events: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // E-Signature Modal & Action states
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load commission invoice details.");
      }

      setInvoice(data.invoice);
      setProfile(data.profile);
      setAddress(data.address);
      setLogo(data.logo);
      setAttachments(data.attachments || []);
      setSignatureHistory(data.signatureHistory || null);
    } catch (err: any) {
      setError(err.message || "Failed to load commission invoice.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Handle PDF Download using jsPDF
  const handleDownloadPdf = () => {
    if (!invoice) return;
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const curr = invoice.currency || "AED";
      const primaryColor = [220, 38, 38]; // Red 600

      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(
        invoice.invoice_type
          ? String(invoice.invoice_type).replace(/_/g, " ").toUpperCase()
          : "COMMISSION INVOICE",
        15,
        18
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`REFERENCE #: ${invoice.invoice_number}`, 140, 18);

      // Company Info
      const compName = profile?.company_name || "FHI GLOBAL PROPERTY REAL ESTATE BROKERAGE LLC";
      const trnVal = profile?.tax_number || profile?.trn_number || "105088815300001";
      const compAddress = address
        ? `${address.address_line1 || ""} ${address.city || ""}, ${address.country || ""}`
        : "Dubai, United Arab Emirates";

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(compName, 15, 38);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`TRN / TIN: ${trnVal}`, 15, 44);
      doc.text(compAddress, 15, 49);

      // Invoice Date & Lock
      doc.text(
        `Issue Date: ${invoice.issued_date ? new Date(invoice.issued_date).toISOString().slice(0, 10) : "N/A"}`,
        140,
        38
      );
      doc.text(`Status: ${invoice.is_locked ? "Locked" : "Active"}`, 140, 44);

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 54, 195, 54);

      // Agent & Particulars Section
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("AGENT DETAILS", 15, 62);
      doc.text("PROPERTY & TRANSACTION DETAILS", 105, 62);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      // Agent column
      doc.text(`Name: ${invoice.agent_name || "N/A"}`, 15, 69);
      doc.text(`Agent Code: ${invoice.agent_code || "N/A"}`, 15, 75);
      doc.text(`Team: ${invoice.team_name || "General"} ${invoice.subteam_name ? `• ${invoice.subteam_name}` : ""}`, 15, 81);
      doc.text(`Email: ${invoice.agent_email || "N/A"}`, 15, 87);

      // Property column
      doc.text(`Developer: ${invoice.developer_name || "Not specified"}`, 105, 69);
      doc.text(`Project: ${invoice.project_name || "Not specified"}`, 105, 75);
      doc.text(`Unit #: ${invoice.unit_number || "Not specified"}`, 105, 81);
      doc.text(`Buyer / Client: ${invoice.buyer_name || "Not specified"}`, 105, 87);

      // Divider
      doc.line(15, 93, 195, 93);

      // Table Header
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 96, 180, 8, "F");
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("FINANCIAL COMPONENT", 18, 101);
      doc.text("RATE / TERMS", 100, 101);
      doc.text("AMOUNT", 175, 101);

      // Rows
      let y = 109;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      // 1. Commission Received
      doc.text("Commission Received from Developer", 18, y);
      doc.text("Gross Base", 100, y);
      doc.text(`${curr} ${Number(invoice.commission_received || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 175, y);
      y += 7;

      // 2. Agent Split
      doc.text("Agent Commission Split", 18, y);
      doc.text(`${Number(invoice.commission_rate || 0)}% Split`, 100, y);
      doc.text(`${curr} ${Number(invoice.net_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 175, y);
      y += 7;

      // 3. VAT
      doc.text("Value Added Tax (Output VAT)", 18, y);
      doc.text(`${Number(invoice.vat_rate || 5)}% VAT`, 100, y);
      doc.text(`${curr} ${Number(invoice.vat_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 175, y);
      y += 7;

      // 4. Deductibles if any
      let parsedDeductibles: any[] = [];
      try {
        if (typeof invoice.deductibles === "string") {
          parsedDeductibles = JSON.parse(invoice.deductibles);
        } else if (Array.isArray(invoice.deductibles)) {
          parsedDeductibles = invoice.deductibles;
        }
      } catch (e) {
        parsedDeductibles = [];
      }

      if (Array.isArray(parsedDeductibles) && parsedDeductibles.length > 0) {
        parsedDeductibles.forEach((d) => {
          if (Number(d.amount) > 0) {
            doc.text(`Less Deductible: ${d.label || "Deduction"}`, 18, y);
            doc.text("Adjustment", 100, y);
            doc.text(`- ${curr} ${Number(d.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 175, y);
            y += 6;
          }
        });
      }

      // Divider & Total
      y += 2;
      doc.line(15, y, 195, y);
      y += 8;

      doc.setFillColor(254, 242, 242);
      doc.rect(100, y - 5, 95, 14, "F");
      doc.setTextColor(220, 38, 38);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("NET PAYABLE AMOUNT:", 104, y + 4);
      doc.text(
        `${curr} ${Number(invoice.gross_amount || invoice.net_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        160,
        y + 4
      );

      // Signature Status Box if signed
      const activeSig = signatureHistory?.activeRequest;
      if (activeSig?.status === "SIGNED") {
        y += 20;
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.rect(15, y, 180, 24, "FD");

        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text("ELECTRONICALLY SIGNED & VERIFIED", 20, y + 7);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Signer: ${activeSig.signed_name || invoice.agent_name}`, 20, y + 13);
        doc.text(
          `Signed At: ${activeSig.signed_at ? new Date(activeSig.signed_at).toLocaleString() : "Recorded"}`,
          20,
          y + 18
        );
        doc.text(`SHA-256 Audit Digest: ${activeSig.snapshot_hash || "Verified"}`, 100, y + 18);
      }

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} • Invoicing System • ${compName}`,
        15,
        285
      );

      doc.save(`Invoice_${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try using the Print button.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Revoke Action
  const handleRevoke = async (requestId: number) => {
    if (!confirm("Are you sure you want to revoke this signing link? The agent will no longer be able to sign.")) {
      return;
    }
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/invoices/signature/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "revoke" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke link");
      setActionMsg({ type: "success", text: "Signing link successfully revoked." });
      fetchInvoice();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Failed to revoke link" });
    } finally {
      setActionLoading(false);
    }
  };

  // Resend / Reminder Action
  const handleResend = async (requestId: number) => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/invoices/signature/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "resend" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend invoice");
      setActionMsg({ type: "success", text: data.message || "Reminder sent successfully." });
      fetchInvoice();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Failed to resend reminder" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500 font-bold text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
        <span>Loading Commission Invoice Statement...</span>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-black text-slate-900">Invoice Record Not Found</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || "The requested commission invoice could not be located in the database."}
          </p>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Invoices Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  const activeSig = signatureHistory?.activeRequest;
  const isSigned = activeSig?.status === "SIGNED";
  const isPending = activeSig?.status === "SENT" || activeSig?.status === "VIEWED";
  const isDeclined = activeSig?.status === "DECLINED";

  const curr = invoice.currency || "AED";
  const invNumber = invoice.invoice_number;

  // Deductibles
  let parsedDeductibles: any[] = [];
  try {
    if (typeof invoice.deductibles === "string") {
      parsedDeductibles = JSON.parse(invoice.deductibles);
    } else if (Array.isArray(invoice.deductibles)) {
      parsedDeductibles = invoice.deductibles;
    }
  } catch (e) {
    parsedDeductibles = [];
  }

  const totalDeductiblesVal = parsedDeductibles.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-red-600 selection:text-white pb-20 print:min-h-0 print:bg-white print:pb-0">
      {/* Top Controls Action Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-xs print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/invoices"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Return to Invoices Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">Invoice:</span>
                <span className="font-mono text-sm font-black text-slate-900">{invNumber}</span>
                {invoice.is_locked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                    <Lock className="w-3 h-3 text-amber-600" />
                    Locked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <Unlock className="w-3 h-3 text-emerald-600" />
                    Unlocked
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            {/* Signature Status Pill */}
            {isSigned && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Signed</span>
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Awaiting Signature</span>
              </span>
            )}
            {isDeclined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Declined</span>
              </span>
            )}

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-600" />}
              <span>PDF</span>
            </button>

            {/* Send for Signature Button */}
            <button
              onClick={() => setSendModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isSigned ? "Resend Signed Copy" : isPending ? "Resend Link" : "Send for Signature"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 print:max-w-none print:p-0 print:m-0 print:space-y-0">
        {/* Action Status Banner */}
        {actionMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 border print:hidden ${
              actionMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <span>{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
        )}

        {/* E-SIGNATURE VERIFICATION BADGE (If signed) */}
        {isSigned && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs print:hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wide">
                    Document Electronically Signed &amp; Locked
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[10px] font-black">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Signed by <strong>{activeSig.signed_name}</strong> on{" "}
                  {new Date(activeSig.signed_at).toLocaleString()} &bull; IP:{" "}
                  <span className="font-mono">{activeSig.signer_ip || "Recorded"}</span>
                </p>
                <p className="text-[10px] font-mono text-emerald-700 mt-1 truncate max-w-xl">
                  SHA-256 Fingerprint: {activeSig.snapshot_hash}
                </p>
              </div>
            </div>

            {activeSig.signed_signature_data && (
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs self-center sm:self-auto">
                <Image
                  src={activeSig.signed_signature_data}
                  alt="Signer Signature"
                  width={140}
                  height={50}
                  className="max-h-12 w-auto object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>
        )}

        {/* E-SIGNATURE DECLINED ALERT */}
        {isDeclined && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-rose-900 flex items-start gap-3.5 shadow-xs print:hidden">
            <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-rose-900">Invoice Signature Declined by Agent</h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                Decline Reason: &ldquo;{activeSig.declined_reason || "No comment provided."}&rdquo;
              </p>
              <p className="text-[10px] text-rose-500">
                Declined on: {activeSig.declined_at ? new Date(activeSig.declined_at).toLocaleString() : "Recently"}
              </p>
            </div>
          </div>
        )}

        {/* E-SIGNATURE PENDING BANNER */}
        {isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs print:hidden">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-900">
                  Signature Link Active ({activeSig.status === "VIEWED" ? "Viewed by Agent" : "Sent to Agent"})
                </p>
                <p className="text-[11px] text-blue-700">
                  Recipient: <span className="font-mono font-semibold">{activeSig.agent_email}</span> &bull; Expires:{" "}
                  {new Date(activeSig.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleResend(activeSig.id)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-2xs transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resend Reminder</span>
              </button>
              <button
                onClick={() => handleRevoke(activeSig.id)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-rose-600 border border-rose-200 font-bold text-xs cursor-pointer shadow-2xs transition-colors"
              >
                Revoke Link
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* THE FORMAL INVOICE SHEET VIEW (Clean Printable Document) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:rounded-none print:p-0 print:w-full print:max-w-none print:box-border print:border-none print:shadow-none">
          {/* Header Banner (#001f3f Navy for high-contrast white logo) */}
          <div className="bg-[#001f3f] text-white border-b-4 border-red-600 p-6 sm:px-10 sm:py-7 print:px-10 print:py-5 flex flex-col sm:flex-row print:flex-row items-start justify-between gap-6 print:gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Image
                  src={logo?.s3_url || profile?.default_logo_url || "/fhi.png"}
                  alt="Company Logo"
                  width={180}
                  height={50}
                  className="object-contain h-11 w-auto"
                  priority
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-white">
                  {profile?.company_name || "FHI GLOBAL PROPERTY REAL ESTATE BROKERAGE LLC"}
                </h1>
                <p className="text-xs text-slate-300 font-medium">
                  {address
                    ? `${address.address_line1 || ""} ${address.address_line2 ? `• ${address.address_line2}` : ""} • ${address.city || ""}, ${address.country || ""}`
                    : "Dubai, United Arab Emirates"}
                </p>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Tax Registration No. (TRN):{" "}
                  <strong className="text-white">
                    {profile?.tax_number || profile?.trn_number || "105088815300001"}
                  </strong>
                </p>
              </div>
            </div>

            <div className="sm:text-right print:text-right space-y-2 print:space-y-1">
              <span className="inline-block px-3 py-1 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-xs">
                {invoice.invoice_type ? String(invoice.invoice_type).replace(/_/g, " ") : "COMMISSION INVOICE"}
              </span>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-300 block tracking-wider">
                  Invoice Number
                </span>
                <span className="text-base font-black font-mono text-white block whitespace-nowrap">{invNumber}</span>
              </div>
              <div className="text-xs text-slate-300">
                <span>Issue Date: </span>
                <strong className="text-white whitespace-nowrap">
                  {invoice.issued_date ? new Date(invoice.issued_date).toISOString().slice(0, 10) : "Not recorded"}
                </strong>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:px-10 sm:py-8 print:px-10 print:py-5 space-y-8 print:space-y-3.5">

          {/* Parties Grid (Agent & Transaction Particulars) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4 bg-slate-50 p-6 print:p-3.5 rounded-2xl border border-slate-200 text-xs">
            {/* Agent / Recipient Column */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-600" />
                <span>Agent Particulars</span>
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{invoice.agent_name || "Agent"}</h3>
                <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                  Agent Code: <strong className="text-slate-700">{invoice.agent_code || "N/A"}</strong>
                </p>
                <p className="text-slate-500 text-[11px]">
                  Team: {invoice.team_name || "General"} {invoice.subteam_name ? `• ${invoice.subteam_name}` : ""}
                </p>
                <p className="text-slate-500 font-mono text-[11px] mt-1">
                  Email: {invoice.agent_email || <span className="text-amber-600 italic">Not specified on record</span>}
                </p>
                {invoice.agent_mobile && (
                  <p className="text-slate-500 font-mono text-[11px]">Mobile: {invoice.agent_mobile}</p>
                )}
              </div>
            </div>

            {/* Deal / Property Particulars Column */}
            <div className="space-y-2 sm:border-l sm:border-slate-200 sm:pl-6 print:border-l print:border-slate-200 print:pl-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-red-600" />
                <span>Deal &amp; Property Particulars</span>
              </span>
              <div className="space-y-1">
                <div>
                  <span className="text-slate-400 text-[10px] block">Developer / Vendor:</span>
                  <strong className="text-slate-800 text-xs">
                    {invoice.developer_name || <span className="text-slate-400 font-normal">Not specified on record</span>}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Project &amp; Unit:</span>
                  <span className="text-slate-800 font-semibold">
                    {invoice.project_name || "Not specified"}
                    {invoice.unit_number ? ` • Unit ${invoice.unit_number}` : ""}
                  </span>
                  {invoice.project_location && (
                    <span className="text-slate-500 text-[10px] block font-normal">{invoice.project_location}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Buyer / Customer:</span>
                  <span className="text-slate-800 font-medium">
                    {invoice.buyer_name || <span className="text-slate-400 italic">Not specified on record</span>}
                  </span>
                </div>
                {Number(invoice.project_value) > 0 && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">Sale Value:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {curr} {Number(invoice.project_value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Coins className="w-4 h-4 text-red-600" />
              <span>Commission Breakdown &amp; Deductibles</span>
            </h3>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse print:[&_th]:py-1.5 print:[&_th]:px-2.5 print:[&_td]:py-1.5 print:[&_td]:px-2.5">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4 text-center">Basis / Rate</th>
                    <th className="py-3 px-4 text-right">Tax Treatment</th>
                    <th className="py-3 px-4 text-right">Amount ({curr})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: Commission Received */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">Gross Commission Received</p>
                      <p className="text-[11px] text-slate-500">Developer payment for closed transaction</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600">Base Deal</td>
                    <td className="py-3.5 px-4 text-right text-slate-500">Standard Rate</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {Number(invoice.commission_received || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Row 2: Agent Commission Split */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">Agent Commission Split</p>
                      <p className="text-[11px] text-slate-500">
                        Contractual split rate applied to received commission
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-red-600">
                      {Number(invoice.commission_rate || 0)}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">Net Taxable</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {Number(invoice.net_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Row 3: VAT */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">Value Added Tax (Output VAT)</p>
                      <p className="text-[11px] text-slate-500">
                        {Number(invoice.vat_amount || 0) > 0 ? "Standard 5% VAT applied" : "Zero-rated or exempt"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                      {Number(invoice.vat_rate || 5)}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {Number(invoice.vat_amount || 0) > 0 ? "Output VAT" : "Exempt"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {Number(invoice.vat_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Row 4: Deductibles Breakdown */}
                  {parsedDeductibles.map((ded: any, idx: number) => {
                    const amt = Number(ded.amount || 0);
                    if (amt <= 0) return null;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors bg-amber-50/20">
                        <td className="py-3 px-4">
                          <p className="font-bold text-amber-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Less Deductible: {ded.label || "Deduction"}</span>
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">—</td>
                        <td className="py-3 px-4 text-right text-amber-700 font-semibold">Deduction</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                          - {amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Summary Card */}
            <div className="flex flex-col sm:flex-row print:flex-row items-end justify-end pt-4 print:pt-2 print:break-inside-avoid">
              <div className="w-full sm:w-80 print:w-80 space-y-2 print:space-y-1 border-t border-slate-200 pt-4 print:pt-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Net Commission:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {curr} {Number(invoice.net_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Output VAT ({Number(invoice.vat_rate || 5)}%):</span>
                  <span className="font-mono font-bold text-emerald-600">
                    + {curr} {Number(invoice.vat_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {totalDeductiblesVal > 0 && (
                  <div className="flex items-center justify-between text-xs text-amber-800">
                    <span>Total Deductibles:</span>
                    <span className="font-mono font-bold text-amber-700">
                      - {curr} {totalDeductiblesVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 p-3.5 print:p-2.5 bg-red-50 rounded-2xl border border-red-200 text-sm font-black text-red-700 mt-2 print:mt-1">
                  <span className="whitespace-nowrap">Gross Payable Amount:</span>
                  <span className="font-mono text-base whitespace-nowrap">
                    {curr}{" "}
                    {Number(invoice.gross_amount || invoice.net_amount || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks block if any */}
          {invoice.remarks && (
            <div className="p-4 print:p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Statement Remarks:</span>
              <p className="text-slate-600 leading-relaxed">{invoice.remarks}</p>
            </div>
          )}

          {/* Attachments Section if any */}
          {attachments.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3 print:hidden">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-purple-600" />
                <span>Supporting Document Attachments ({attachments.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.file_url || att.s3_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-800 block truncate">
                          {att.file_name || att.original_filename || "Attached Document"}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {att.category_name || "General Attachment"}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Signatory & Agent Acknowledgment Section */}
          <div className="pt-6 print:pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 text-xs print:break-inside-avoid">
            <div>
              <p className="font-bold text-slate-900 mb-0.5">Authorized Company Signatory</p>
              <p className="text-[11px] text-slate-400 mb-6 print:mb-3">Filipino Homes / FHI Global Property</p>
              <div className="w-56 border-b border-slate-300 pb-1">
                <span className="font-serif italic text-slate-500 text-sm">FHI Management</span>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-0.5">Agent Acknowledgment &amp; Signature</p>
              <p className="text-[11px] text-slate-400 mb-2">Electronic acknowledgment of commission statement</p>
              {isSigned && activeSig?.signed_signature_data ? (
                <div className="space-y-1">
                  <div className="h-12 flex items-end">
                    <img
                      src={activeSig.signed_signature_data}
                      alt="Agent Signature"
                      className="max-h-12 object-contain"
                    />
                  </div>
                  <div className="w-56 border-b border-emerald-500 pb-0.5">
                    <span className="font-mono text-emerald-700 font-bold">{activeSig.signed_name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Signed electronically on {new Date(activeSig.signed_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="w-56 border-b border-slate-300 pb-1 mt-6 print:mt-3">
                  <span className="text-slate-400 italic">Pending Agent Signature</span>
                </div>
              )}
            </div>
          </div>

          {/* Legal Footnote Notice */}
          <div className="pt-4 print:pt-2 border-t border-slate-100 text-[10px] print:text-[9px] text-slate-400 text-center leading-relaxed">
            This statement was generated electronically by the FHI Global Property Commission Management System.
            All commissions and applicable tax calculations adhere to standard corporate accounting principles.
          </div>
          </div>

          {/* Navy Branded Footer (#001f3f) */}
          <div className="bg-[#001f3f] text-white border-t-4 border-red-600 px-6 py-4 sm:px-10 print:px-10 print:py-3 flex flex-col sm:flex-row print:flex-row items-center justify-between gap-2 text-[11px] print:break-inside-avoid">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="font-bold">Official Real Estate Commission Statement</span>
              <span className="text-slate-300 hidden sm:inline print:inline">
                &bull; {profile?.company_name || "FHI Global Property LLC"}
              </span>
            </div>
            <span className="font-mono text-slate-300 font-semibold whitespace-nowrap">
              {invNumber} &bull; Page 1 of 1
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* E-SIGNATURE AUDIT TRAIL LOG */}
        {/* ========================================================================= */}
        {signatureHistory && signatureHistory.events.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-2xs print:hidden">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>E-Signature Tamper-Evident Audit Trail</span>
            </h3>

            <div className="space-y-3">
              {signatureHistory.events.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-800">
                      {evt.event_type}
                    </span>
                    <span className="font-semibold text-slate-800">{evt.event_description}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                    {evt.created_at ? new Date(evt.created_at).toLocaleString() : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Admin Send E-Signature Modal */}
      {sendModalOpen && (
        <SendSignatureModal
          isOpen={true}
          onClose={() => setSendModalOpen(false)}
          onSuccess={() => {
            setSendModalOpen(false);
            fetchInvoice();
          }}
          recordType="COMMISSION_INVOICE"
          recordId={invoice.id}
          invoiceNumber={invNumber}
          defaultEmail={invoice.agent_email || ""}
          agentName={invoice.agent_name || "Agent"}
          agentCode={invoice.agent_code || ""}
          currency={curr}
          amountFormatted={Number(invoice.gross_amount || invoice.net_amount || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
          snapshotData={invoice}
        />
      )}
    </div>
  );
}

