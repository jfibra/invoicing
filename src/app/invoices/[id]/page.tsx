"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSinglePagePrint } from "@/lib/useSinglePagePrint";
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
import { generateInvoicePdf } from "@/lib/invoicePdfGenerator";

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
  const sheetRef = useRef<HTMLDivElement>(null);
  useSinglePagePrint(sheetRef);

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

  // Handle PDF Download using unified executive A4 generator
  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloadingPdf(true);
    try {
      const curr = invoice.currency || "AED";
      const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });
      const compName = profile?.company_name || "FHI GLOBAL PROPERTY REAL ESTATE BROKERAGE LLC";
      const trnVal = profile?.tax_number || profile?.trn_number || "105088815300001";
      const compAddress = address
        ? `${address.address_line1 || ""}${address.address_line2 ? ` • ${address.address_line2}` : ""} • ${address.city || ""}, ${address.country || ""}`.replace(/\s+/g, " ").trim()
        : "Dubai, United Arab Emirates";

      let parsedDeductibles: any[] = [];
      try {
        if (typeof invoice.deductibles === "string") {
          parsedDeductibles = JSON.parse(invoice.deductibles);
        } else if (Array.isArray(invoice.deductibles)) {
          parsedDeductibles = invoice.deductibles;
        }
      } catch {
        parsedDeductibles = [];
      }

      const validDeductibles = Array.isArray(parsedDeductibles)
        ? parsedDeductibles.filter((d) => Number(d?.amount || 0) > 0)
        : [];
      const totalDeductibles = validDeductibles.reduce((sum, d) => sum + Number(d.amount || 0), 0);

      const vatAmt = Number(invoice.vat_amount || 0);
      const vatRate =
        invoice.vat_rate !== undefined && invoice.vat_rate !== null && invoice.vat_rate !== ""
          ? Number(invoice.vat_rate)
          : vatAmt > 0
            ? 5
            : 0;

      const activeSig = signatureHistory?.activeRequest;
      const statusLabel =
        activeSig?.status === "SIGNED"
          ? "Verified & Signed"
          : activeSig?.status === "VIEWED"
            ? "Viewed by Agent"
            : activeSig?.status === "SENT"
              ? "Awaiting Signature"
              : activeSig?.status === "DECLINED"
                ? "Declined"
                : invoice.is_locked
                  ? "Locked"
                  : "Active";

      const agentLines: string[] = [
        `Agent Code: ${invoice.agent_code || "N/A"}`,
        `Team: ${invoice.team_name || "General"}${invoice.subteam_name ? ` • ${invoice.subteam_name}` : ""}`,
        `Email: ${invoice.agent_email || "Not specified on record"}`,
      ];
      if (invoice.agent_mobile) {
        agentLines.push(`Mobile: ${invoice.agent_mobile}`);
      }

      const dealLines: string[] = [
        `Project & Unit: ${invoice.project_name || "Not specified"}${invoice.unit_number ? ` • Unit ${invoice.unit_number}` : ""}`,
      ];
      if (invoice.project_location) {
        dealLines.push(invoice.project_location);
      }
      dealLines.push(`Buyer / Customer: ${invoice.buyer_name || "Not specified on record"}`);
      if (Number(invoice.project_value) > 0) {
        dealLines.push(`Sale Value: ${curr} ${fmt(Number(invoice.project_value))}`);
      }

      const items = [
        {
          description: "Gross Commission Received",
          subDescription: "Developer payment for closed transaction",
          basisOrRate: "Base Deal",
          taxTreatment: "Standard Rate",
          amountText: fmt(Number(invoice.commission_received || 0)),
        },
        {
          description: "Agent Commission Split",
          subDescription: "Contractual split rate applied to received commission",
          basisOrRate: `${Number(invoice.commission_rate || 0)}%`,
          taxTreatment: "Net Taxable",
          amountText: fmt(Number(invoice.net_amount || 0)),
        },
        {
          description: "Value Added Tax (Output VAT)",
          subDescription: vatAmt > 0 ? `Standard ${vatRate}% VAT applied` : "Zero-rated or exempt",
          basisOrRate: `${vatRate}%`,
          taxTreatment: vatAmt > 0 ? "Output VAT" : "Exempt",
          amountText: fmt(vatAmt),
          isTaxPositive: vatAmt > 0,
        },
        ...validDeductibles.map((d) => ({
          description: `Less Deductible: ${d.label || "Deduction"}`,
          basisOrRate: "—",
          taxTreatment: "Deduction",
          amountText: `- ${fmt(Number(d.amount || 0))}`,
          isDeduction: true,
        })),
      ];

      const settlementLines: string[] = [];
      if (profile?.bank_name || profile?.iban) {
        if (profile?.bank_name) settlementLines.push(`Bank: ${profile.bank_name}`);
        if (profile?.account_name) settlementLines.push(`Account Name: ${profile.account_name}`);
        if (profile?.iban) settlementLines.push(`IBAN: ${profile.iban}`);
        if (profile?.swift_code) settlementLines.push(`SWIFT: ${profile.swift_code}`);
      } else {
        settlementLines.push(
          "Commission payout is processed in accordance with approved agency split agreements and itemized deductions shown above."
        );
      }

      await generateInvoicePdf({
        fileName: `Invoice_${invoice.invoice_number}.pdf`,
        badgeText: invoice.invoice_type
          ? String(invoice.invoice_type).replace(/_/g, " ")
          : "COMMISSION INVOICE",
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issued_date ? new Date(invoice.issued_date).toISOString().slice(0, 10) : "Not recorded",
        statusLabel,
        companyName: compName,
        companyAddress: compAddress,
        companyTrn: trnVal,
        logoUrl: logo?.s3_url || profile?.default_logo_url || "/fhi.png",
        leftParty: {
          title: "AGENT PARTICULARS",
          heading: invoice.agent_name || "Agent",
          lines: agentLines,
        },
        rightParty: {
          title: "DEAL & PROPERTY PARTICULARS",
          heading: invoice.developer_name || "Developer / Vendor not specified",
          lines: dealLines,
        },
        currency: curr,
        items,
        settlementLines,
        paymentTerms:
          profile?.payment_terms || "For split or deduction inquiries, please contact Finance prior to signing.",
        netLabel: "Net Commission:",
        netValue: `${curr} ${fmt(Number(invoice.net_amount || 0))}`,
        vatLabel: `Output VAT (${vatRate}%):`,
        vatValue: `+ ${curr} ${fmt(vatAmt)}`,
        deductiblesValue: totalDeductibles > 0 ? `- ${curr} ${fmt(totalDeductibles)}` : null,
        totalLabel: "Gross Payable Amount:",
        totalValue: `${curr} ${fmt(Number(invoice.gross_amount || invoice.net_amount || 0))}`,
        remarks: invoice.remarks || null,
        footerTitle: "Official Real Estate Commission Statement",
        signature: {
          isSigned: activeSig?.status === "SIGNED",
          signedName: activeSig?.signed_name || invoice.agent_name,
          signedAt: activeSig?.signed_at,
          signatureDataUrl: activeSig?.signed_signature_data,
          snapshotHash: activeSig?.snapshot_hash,
        },
      });
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
        <div
          ref={sheetRef}
          className="invoice-print-page bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:rounded-none print:p-0 print:w-full print:max-w-none print:box-border print:border-none print:shadow-none"
        >
          {/* Header Banner (#001f3f Navy for high-contrast white logo) */}
          <div className="bg-[#001f3f] text-white border-b-4 border-red-600 p-6 sm:px-10 sm:py-7 print:px-9 print:py-4 flex flex-col sm:flex-row print:flex-row items-start justify-between gap-6 print:gap-4">
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
          <div className="invoice-print-body p-6 sm:px-10 sm:py-8 print:px-9 print:py-3.5 space-y-8 print:space-y-2.5">

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

            {/* Settlement Info & Totals Summary Row */}
            <div className="flex flex-col sm:flex-row print:flex-row items-start justify-between gap-6 pt-4 print:pt-4 print:break-inside-avoid">
              {/* Left: Settlement & Payment Reference */}
              <div className="w-full sm:flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-2xl p-4 print:p-4 text-xs space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-red-600" />
                  <span>Settlement &amp; Statement Reference</span>
                </span>
                {profile?.bank_name || profile?.iban ? (
                  <div className="space-y-1 text-slate-600">
                    {profile?.bank_name && (
                      <p>
                        Bank: <strong className="text-slate-900">{profile.bank_name}</strong>
                      </p>
                    )}
                    {profile?.account_name && (
                      <p>
                        Account Name: <strong className="text-slate-900">{profile.account_name}</strong>
                      </p>
                    )}
                    {profile?.iban && (
                      <p>
                        IBAN: <strong className="font-mono text-slate-900">{profile.iban}</strong>
                      </p>
                    )}
                    {profile?.swift_code && (
                      <p>
                        SWIFT: <strong className="font-mono text-slate-900">{profile.swift_code}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-600 leading-relaxed">
                    Commission payout is processed in accordance with approved agency split agreements and itemized deductions shown above.
                  </p>
                )}
                <p className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200">
                  {profile?.payment_terms || "For split or deduction inquiries, please contact Finance prior to signing."}
                </p>
              </div>

              {/* Right: Totals Box */}
              <div className="w-full sm:w-80 print:w-80 space-y-2 print:space-y-1.5 border-t border-slate-200 pt-4 print:pt-3">
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

          {/* Legal Terms & Verification Block + Signatories Group */}
          <div className="space-y-6 print:space-y-3 mt-auto">
            <div className="p-4 print:p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] print:text-[10px] text-slate-600 space-y-1 print:break-inside-avoid">
              <span className="font-black uppercase tracking-wider text-slate-800 text-[10px] block">
                Terms, Conditions &amp; Verification Notice
              </span>
              <p>
                1. This official commission statement is issued by {profile?.company_name || "FHI Global Property LLC"} for agent review and signature acknowledgment.
              </p>
              <p>
                2. All commission splits, tax treatments, and approved deductions comply with standard corporate brokerage accounting principles.
              </p>
            </div>

            {/* Signatory & Agent Acknowledgment Section */}
            <div className="pt-4 print:pt-2.5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 text-xs print:break-inside-avoid">
            <div>
              <p className="font-bold text-slate-900 mb-0.5">Authorized Company Signatory</p>
              <p className="text-[11px] text-slate-400 mb-6 print:mb-2">Filipino Homes / FHI Global Property</p>
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
                <div className="w-56 border-b border-slate-300 pb-1 mt-6 print:mt-2">
                  <span className="text-slate-400 italic">Pending Agent Signature</span>
                </div>
              )}
            </div>
          </div>
          </div>
          </div>

          {/* Navy Branded Footer (#001f3f) */}
          <div className="bg-[#001f3f] text-white border-t-4 border-red-600 px-6 py-4 sm:px-10 print:px-9 print:py-2.5 flex flex-col sm:flex-row print:flex-row items-center justify-between gap-2 text-[11px] mt-auto print:shrink-0 print:break-inside-avoid">
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

