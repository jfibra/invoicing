"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Printer,
  Download,
  Send,
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
} from "lucide-react";
import SendSignatureModal from "@/components/SendSignatureModal";
import { jsPDF } from "jspdf";

interface SalesInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default function SalesInvoicePage({ params }: SalesInvoicePageProps) {
  const router = useRouter();
  const { id: saleId } = use(params);

  const [sale, setSale] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [address, setAddress] = useState<any | null>(null);
  const [trnRecord, setTrnRecord] = useState<any | null>(null);
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

  const fetchSaleInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load sales invoice details.");
      }

      setSale(data.sale);
      setProfile(data.profile);
      setAddress(data.address);
      setTrnRecord(data.trnRecord);
      setAttachments(data.attachments || []);
      setSignatureHistory(data.signatureHistory || null);
    } catch (err: any) {
      setError(err.message || "Failed to load sales record invoice.");
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    fetchSaleInvoice();
  }, [fetchSaleInvoice]);

  // Handle PDF Download using jsPDF
  const handleDownloadPdf = () => {
    if (!sale) return;
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const curr = profile?.currency || "AED";
      const compName = profile?.company_name || "FHI Global Property LLC";
      const compTrn = profile?.trn_number || "105088815300001";
      const invNum = sale.invoice_number || sale.sale_number;
      const saleDate = sale.sale_date ? new Date(sale.sale_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

      // Header Banner
      doc.setFillColor(220, 38, 38); // Red
      doc.rect(0, 0, 210, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("TAX INVOICE / COMMISSION STATEMENT", 15, 16);

      // Company Info
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text(compName, 15, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`TRN: ${compTrn}`, 15, 42);
      if (address) {
        doc.text(`${address.building_name || ""}, ${address.street_address || ""}, ${address.city || ""}`, 15, 47);
      }

      // Invoice Details Block (Right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`Invoice Ref: ${invNum}`, 140, 36);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Date: ${saleDate}`, 140, 42);
      doc.text(`Status: ${sale.status || "RECORDED"}`, 140, 47);

      // Horizontal Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 54, 195, 54);

      // Billed To / Client
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("BILLED TO / DEVELOPER:", 15, 62);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(sale.customer_name || "N/A", 15, 68);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Client TRN/TIN: ${sale.tin_number || "Not specified"}`, 15, 73);

      // Agent Attribution Block
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("AGENT ATTRIBUTION:", 140, 62);
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(sale.fullname || "Not specified", 140, 68);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Member Code: ${sale.member_code || "N/A"}`, 140, 73);
      doc.text(`Team: ${sale.team || "Direct / No Team"}`, 140, 78);

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 88, 180, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("DESCRIPTION / PROJECT PARTICULAR", 18, 93);
      doc.text("NET (EXCL. VAT)", 125, 93);
      doc.text("VAT", 155, 93);
      doc.text("TOTAL", 180, 93);

      // Item Row
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const particular = `${sale.category_name || "Sales Commission"} - ${sale.subcategory_name || "Property Brokerage"}`;
      doc.text(particular.substring(0, 50), 18, 103);
      doc.text(`${Number(sale.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 125, 103);
      doc.text(`${Number(sale.vat_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 155, 103);
      doc.setFont("helvetica", "bold");
      doc.text(`${Number(sale.total_actual_amount || sale.gross_taxable || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 180, 103);

      // Remarks note
      if (sale.remarks) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Notes: ${sale.remarks.substring(0, 80)}`, 18, 112);
      }

      // Summary Box
      doc.setDrawColor(226, 232, 240);
      doc.line(115, 125, 195, 125);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Subtotal (Gross Taxable):", 120, 132);
      doc.text(`${curr} ${Number(sale.gross_taxable || sale.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 195, 132, { align: "right" });

      doc.text(`Output VAT (${sale.vat_treatment || "5%"}):`, 120, 138);
      doc.text(`${curr} ${Number(sale.vat_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 195, 138, { align: "right" });

      doc.setFillColor(248, 250, 252);
      doc.rect(115, 142, 80, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Total Receivable Amount:", 118, 148);
      doc.setTextColor(22, 163, 74);
      doc.text(`${curr} ${Number(sale.total_actual_amount || sale.gross_taxable || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 193, 148, { align: "right" });

      // Banking Details
      if (profile?.bank_name) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, 165, 180, 22, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text("SETTLEMENT BANK DETAILS", 20, 171);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Bank: ${profile.bank_name || ""} | Account: ${profile.account_name || ""}`, 20, 176);
        doc.text(`IBAN: ${profile.iban || ""} | SWIFT: ${profile.swift_code || ""}`, 20, 181);
      }

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Official Tax Invoice generated via Filipino Homes Commissions Portal.", 105, 280, { align: "center" });

      doc.save(`Sales_Invoice_${invNum}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. You can also use Print to PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Admin action: Resend / Remind
  const handleResend = async () => {
    const activeReq = signatureHistory?.activeRequest;
    if (!activeReq) return;

    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/invoices/signature/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", request_id: activeReq.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend reminder.");

      setActionMsg({ type: "success", text: data.message || "Reminder sent successfully." });
      fetchSaleInvoice();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Failed to resend reminder." });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin action: Revoke
  const handleRevoke = async () => {
    const activeReq = signatureHistory?.activeRequest;
    if (!activeReq) return;
    if (!confirm("Are you sure you want to revoke this signature link? The agent will no longer be able to sign.")) return;

    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/invoices/signature/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", request_id: activeReq.id, reason: "Revoked by admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke link.");

      setActionMsg({ type: "success", text: "Signature link revoked successfully." });
      fetchSaleInvoice();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Failed to revoke link." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500 font-bold text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
        <span>Loading Sales Record Invoice...</span>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Failed to Load Invoice</h2>
          <p className="text-xs text-slate-600">{error || "Sales record could not be found."}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push("/invoices/sales")}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Back to Sales
            </button>
            <button
              onClick={fetchSaleInvoice}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const curr = profile?.currency || "AED";
  const invNumber = sale.invoice_number || sale.sale_number;
  const activeReq = signatureHistory?.activeRequest;
  const sigStatus = activeReq?.status || "DRAFT";

  const statusBadge = () => {
    switch (sigStatus) {
      case "SIGNED":
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Signed by {activeReq.signed_name || sale.fullname}
          </span>
        );
      case "VIEWED":
        return (
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            Viewed by Agent
          </span>
        );
      case "SENT":
        return (
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Sent for Signature
          </span>
        );
      case "DECLINED":
        return (
          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Declined by Agent
          </span>
        );
      case "EXPIRED":
        return (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-xs font-black">
            Expired
          </span>
        );
      case "REVOKED":
        return (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-300 text-xs font-black">
            Revoked
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
            Draft / Unsent
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white pb-16">
      {/* Top Controls Bar (Hidden during print) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-xs print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices/sales"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sales</span>
            </Link>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                Sales Invoice: <span className="font-mono text-red-600">{invNumber}</span>
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Download className="w-4 h-4 text-slate-500" />}
              <span>{downloadingPdf ? "Generating..." : "Download PDF"}</span>
            </button>

            <button
              onClick={() => setSendModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{activeReq ? "Resend / New Version" : "Send for Signature"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Status Alert Banner if present */}
        {actionMsg && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              actionMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span>{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} className="p-1 hover:opacity-70">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* E-Signature Audit & Status Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              E-Signature Tracking Status
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {statusBadge()}
              {activeReq && (
                <span className="text-xs text-slate-500">
                  Version <strong>v{activeReq.version}</strong> &bull; Sent to{" "}
                  <span className="font-mono text-slate-700">{activeReq.agent_email}</span>
                </span>
              )}
            </div>
            {activeReq?.declined_reason && (
              <p className="text-xs text-rose-600 font-medium mt-1">
                Decline Reason: &ldquo;{activeReq.declined_reason}&rdquo; ({new Date(activeReq.declined_at).toLocaleDateString()})
              </p>
            )}
          </div>

          {activeReq && sigStatus !== "SIGNED" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResend}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                <span>Send Reminder</span>
              </button>
              {sigStatus !== "REVOKED" && (
                <button
                  onClick={handleRevoke}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Revoke Link
                </button>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* INVOICE CANVAS / PRINT SHEET (Pixel-Perfect Matching Company Identity) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-12 space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-slate-200 pb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/fhi.png"
                  alt="Filipino Homes | Leuterio Realty"
                  width={200}
                  height={55}
                  className="object-contain h-10 w-auto"
                  priority
                />
              </div>
              <div className="text-xs text-slate-500 space-y-0.5">
                <p className="font-extrabold text-slate-900 text-sm">
                  {profile?.company_name || "FHI Global Property LLC"}
                </p>
                <p>
                  TRN:{" "}
                  <span className="font-mono font-bold text-slate-700">
                    {profile?.trn_number || "105088815300001"}
                  </span>
                </p>
                {address && (
                  <p className="max-w-xs">
                    {address.building_name}, {address.street_address}, {address.city}, {address.country}
                  </p>
                )}
              </div>
            </div>

            {/* Document Title & Meta */}
            <div className="sm:text-right space-y-2">
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-black uppercase tracking-wider inline-block">
                TAX INVOICE &bull; SALES RECORD
              </span>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="text-slate-400 font-medium">Invoice / Ref #:</span>{" "}
                  <strong className="font-mono text-slate-900 text-sm">{invNumber}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-medium">Issue Date:</span>{" "}
                  <strong className="text-slate-800">
                    {sale.sale_date
                      ? new Date(sale.sale_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Not specified"}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-400 font-medium">Tax Treatment:</span>{" "}
                  <strong className="text-slate-800">{sale.vat_treatment || "Standard Rate (5%)"}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-medium">Payment Method:</span>{" "}
                  <strong className="text-slate-800">{sale.payment_method || "BANK_TRANSFER"}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Party Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-6 rounded-2xl border border-slate-100 text-xs">
            {/* Customer / Developer */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Billed To &bull; Developer / Client
              </span>
              <h2 className="text-base font-black text-slate-900">{sale.customer_name}</h2>
              <div className="space-y-1 text-slate-600">
                <p>
                  <span className="text-slate-400">TRN / TIN:</span>{" "}
                  <span className="font-mono font-bold text-slate-800">
                    {sale.tin_number || <span className="text-slate-400 italic">Not specified</span>}
                  </span>
                </p>
                {trnRecord && (
                  <p className="text-slate-500">
                    {trnRecord.street_address || ""}, {trnRecord.city || ""} {trnRecord.country || ""}
                  </p>
                )}
              </div>
            </div>

            {/* Agent Attribution */}
            <div className="space-y-2 md:border-l md:border-slate-200 md:pl-6">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Agent Attribution &bull; Commission Split
              </span>
              <h2 className="text-base font-black text-slate-900">
                {sale.fullname || <span className="text-slate-400 italic">Unassigned Agent</span>}
              </h2>
              <div className="space-y-1 text-slate-600">
                <p>
                  <span className="text-slate-400">Member Code:</span>{" "}
                  <span className="font-mono font-bold text-slate-800">
                    {sale.member_code || <span className="text-slate-400 italic">N/A</span>}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Sales Team:</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {sale.team || "Direct / No Team"} {sale.subteam ? `(${sale.subteam})` : ""}
                  </span>
                </p>
                {sale.agent_email && (
                  <p>
                    <span className="text-slate-400">Email:</span>{" "}
                    <span className="font-mono text-slate-700">{sale.agent_email}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Table of Ledger Particulars */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-2">Line Particulars / Project</th>
                  <th className="py-3 px-2 text-right">Net Amount</th>
                  <th className="py-3 px-2 text-right">VAT (5%)</th>
                  <th className="py-3 px-2 text-right">Gross Total ({curr})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-2">
                    <p className="font-black text-slate-900 text-sm">{sale.category_name || "COMMISSION SALES"}</p>
                    <p className="text-slate-600 font-medium mt-0.5">
                      {sale.subcategory_name || <span className="italic text-slate-400">Standard Real Estate Transaction</span>}
                    </p>
                    {sale.remarks && (
                      <p className="text-[11px] text-slate-500 mt-1 italic max-w-lg">
                        {sale.remarks}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-2 text-right font-mono font-bold text-slate-800">
                    {Number(sale.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-2 text-right font-mono text-slate-600">
                    {Number(sale.vat_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-2 text-right font-mono font-black text-slate-900 text-sm">
                    {Number(sale.total_actual_amount || sale.gross_taxable || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Totals Box */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-4 border-t border-slate-200">
            {/* Settlement Instructions */}
            <div className="space-y-3 max-w-md text-xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Settlement &amp; Bank Instructions
              </span>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-slate-700">
                <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                  {profile?.bank_name || "WIO Bank"}
                </p>
                <p>
                  <span className="text-slate-400">Account Name:</span>{" "}
                  <strong>{profile?.account_name || "FHI Global Property LLC"}</strong>
                </p>
                <p>
                  <span className="text-slate-400">IBAN:</span>{" "}
                  <strong className="font-mono">{profile?.iban || "AE900860000009185994189"}</strong>
                </p>
                <p>
                  <span className="text-slate-400">SWIFT / BIC:</span>{" "}
                  <strong className="font-mono">{profile?.swift_code || "WIOBAEADXXX"}</strong>
                </p>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  {profile?.payment_terms || "Payment due upon invoice receipt."}
                </p>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="w-full sm:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 py-1">
                <span>Net Commission Subtotal:</span>
                <span className="font-mono font-bold">
                  {curr} {Number(sale.gross_taxable || sale.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 py-1">
                <span>Output VAT ({sale.tax_type === "VAT" ? "5%" : "0%"}):</span>
                <span className="font-mono font-bold">
                  {curr} {Number(sale.vat_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-t-2 border-slate-900 text-sm font-black text-slate-900 bg-emerald-50/60 px-3 rounded-xl border border-emerald-100">
                <span>Total Amount Receivable:</span>
                <span className="text-base text-emerald-700 font-mono">
                  {curr} {Number(sale.total_actual_amount || sale.gross_taxable || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Signed Document Signature Section */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-900 mb-1">Authorized Company Signatory</p>
              <p className="text-[11px] text-slate-400 mb-8">Filipino Homes / Leuterio Realty Brokerage</p>
              <div className="w-56 border-b border-slate-300 pb-1">
                <span className="font-serif italic text-slate-500 text-sm">FHI Management</span>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-1">Agent Acknowledgment &amp; Signature</p>
              <p className="text-[11px] text-slate-400 mb-2">Electronic acknowledgment of commission statement</p>
              {activeReq?.signed_signature_data ? (
                <div className="space-y-1">
                  {/* Render saved signature image */}
                  <div className="h-16 flex items-end">
                    <img
                      src={activeReq.signed_signature_data}
                      alt="Agent Signature"
                      className="max-h-14 object-contain"
                    />
                  </div>
                  <div className="w-56 border-b border-emerald-500 pb-1">
                    <span className="font-mono text-emerald-700 font-bold">{activeReq.signed_name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Signed electronically on {new Date(activeReq.signed_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="w-56 border-b border-slate-300 pb-1 mt-8">
                  <span className="text-slate-400 italic">Pending Agent Signature</span>
                </div>
              )}
            </div>
          </div>

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-3 print:hidden">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                Supporting Attachments ({attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.file_path}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="truncate mr-2">
                      <span className="font-bold text-slate-800 block truncate">{att.original_filename}</span>
                      <span className="text-[10px] text-slate-400">{att.file_category_name || "Attachment"}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audit Event History Timeline */}
        {signatureHistory && signatureHistory.events.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 print:hidden">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Tamper-Evident Audit Trail &bull; Event History
            </h3>
            <div className="space-y-3 text-xs">
              {signatureHistory.events.map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 border-l-2 border-slate-200 pl-4 py-1">
                  <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(evt.created_at).toLocaleString()}
                  </span>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 mr-2">
                      {evt.event_type}
                    </span>
                    <span className="font-medium text-slate-800">{evt.event_description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Send Signature Modal Component */}
      <SendSignatureModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        recordType="SALES_INVOICE"
        recordId={sale.id}
        invoiceNumber={invNumber}
        agentName={sale.fullname || "Agent"}
        defaultEmail={sale.agent_email || ""}
        agentCode={sale.member_code || ""}
        amountFormatted={Number(sale.total_actual_amount || sale.gross_taxable || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}
        currency={curr}
        snapshotData={{
          saleId: sale.id,
          saleNumber: sale.sale_number,
          invoiceNumber: sale.invoice_number,
          saleDate: sale.sale_date,
          customerName: sale.customer_name,
          tinNumber: sale.tin_number,
          categoryName: sale.category_name,
          subcategoryName: sale.subcategory_name,
          amount: sale.amount,
          vatAmount: sale.vat_amount,
          grossTaxable: sale.gross_taxable,
          totalActualAmount: sale.total_actual_amount,
          currency: curr,
          fullname: sale.fullname,
          memberCode: sale.member_code,
          team: sale.team,
          companyName: profile?.company_name,
          companyTrn: profile?.trn_number,
        }}
        onSuccess={() => {
          fetchSaleInvoice();
        }}
      />
    </div>
  );
}

