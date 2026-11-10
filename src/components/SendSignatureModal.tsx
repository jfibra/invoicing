"use client";

import React, { useState } from "react";
import {
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  Mail,
  User,
  Calendar,
  FileText,
  Clock,
  Loader2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface SendSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: "COMMISSION_INVOICE" | "SALES_INVOICE";
  recordId: number;
  invoiceNumber: string;
  agentName: string;
  defaultEmail?: string;
  agentCode?: string;
  amountFormatted: string;
  currency: string;
  snapshotData: any;
  onSuccess?: () => void;
}

export default function SendSignatureModal({
  isOpen,
  onClose,
  recordType,
  recordId,
  invoiceNumber,
  agentName,
  defaultEmail = "",
  agentCode,
  amountFormatted,
  currency,
  snapshotData,
  onSuccess,
}: SendSignatureModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState(`Action Required: Review and Sign Invoice ${invoiceNumber}`);
  const [message, setMessage] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(14);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reviewUrl: string;
    token: string;
    mock?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailToUse = recipientEmail.trim();
    if (!emailToUse) {
      setError("Recipient email address is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_type: recordType,
          record_id: recordId,
          invoice_number: invoiceNumber,
          agent_name: agentName,
          agent_email: emailToUse,
          agent_code: agentCode,
          subject,
          message,
          expires_in_days: expiresInDays,
          snapshot: snapshotData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create and dispatch signature request.");
      }

      setResult({
        reviewUrl: data.reviewUrl,
        token: data.token,
        mock: data.emailResult?.mock,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to send signature request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!result?.reviewUrl) return;
    navigator.clipboard.writeText(result.reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Send Invoice for Signature</h2>
              <p className="text-xs text-slate-400 font-medium">
                {recordType === "SALES_INVOICE" ? "Sales Record" : "Commission Invoice"} &bull; {invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {result ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Signature Request Dispatched!</h3>
                <p className="text-xs text-slate-500">
                  Notification prepared for <strong>{agentName}</strong> at{" "}
                  <span className="font-mono font-bold text-slate-700">{recipientEmail}</span>.
                </p>
                {result.mock && (
                  <div className="inline-block mt-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[11px] font-bold">
                    Safe Mock Mode Active &bull; No live email sent
                  </div>
                )}
              </div>

              {/* Secure Signing Link Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Agent Signing Link (Single-Invoice Token)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.reviewUrl}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <a
                    href={result.reviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600"
                    title="Open signing page in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400">
                  This single-invoice link expires in {expiresInDays} days and tracks agent view &amp; signature events.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Invoice Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Invoice</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">{invoiceNumber}</strong>
                  <span className="text-xs text-slate-500 block">{agentName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Amount</span>
                  <strong className="text-base font-black text-emerald-600">
                    {currency} {amountFormatted}
                  </strong>
                </div>
              </div>

              {/* Recipient Email */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Recipient Agent Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="agent@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:border-red-600 transition-colors"
                />
                <p className="text-[11px] text-slate-400">
                  Pre-filled with agent email on record. Enter a valid address to receive the secure signing link.
                </p>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Email Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>

              {/* Optional Custom Message */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Custom Note / Remarks to Agent (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please review the commission split for project Unit 11-756 and confirm by Friday."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-red-600 transition-colors resize-none"
                />
              </div>

              {/* Expiry Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Signing Link Expiration
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value={7}>7 Days from send</option>
                  <option value={14}>14 Days from send (Recommended)</option>
                  <option value={30}>30 Days from send</option>
                  <option value={60}>60 Days from send</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send for Signature</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

