"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  Paperclip,
  FileText,
  Upload,
  Download,
  X,
  Users,
  CheckCircle2,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 drop-shadow-sm">
    <defs>
      <linearGradient id="backGradEditSales" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="26" fill="url(#backGradEditSales)" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface SalesFileCategory {
  id: number;
  name: string;
  code: string;
  type: string;
  description: string;
  is_required: number | boolean;
}

export default function EditSalePage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Sales Editor..." />}>
      <EditSaleContent />
    </Suspense>
  );
}

function EditSaleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const initialTabParam = searchParams.get("tab") || "info";

  const [activeTab, setActiveTab] = useState<"info" | "attachments">(initialTabParam === "attachments" ? "attachments" : "info");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [salesFileCategories, setSalesFileCategories] = useState<SalesFileCategory[]>([]);

  // Sale Data State
  const [sale, setSale] = useState<any | null>(null);
  const [saleDate, setSaleDate] = useState("");
  const [taxType, setTaxType] = useState<"VAT" | "NONVAT">("VAT");
  const [customerName, setCustomerName] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [categoryName, setCategoryName] = useState("COMMISSION SALES");
  const [subcategoryName, setSubcategoryName] = useState("Real Estate Brokerage");
  const [vatTreatment, setVatTreatment] = useState("Standard Rate (5%)");

  // Amounts State
  const [amount, setAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [grossTaxable, setGrossTaxable] = useState("");
  const [totalActualAmount, setTotalActualAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [remarks, setRemarks] = useState("");

  // Attachments State
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([]);
  const [stagedFiles, setStagedFiles] = useState<{ [catCode: string]: any[] }>({});

  // Load Sales Categories & Target Record
  useEffect(() => {
    async function initData() {
      if (!id) {
        alert("No Sale ID specified.");
        router.push("/invoices/sales");
        return;
      }

      setLoading(true);
      try {
        // Load Sales File Categories
        const fileCatRes = await fetch("/api/invoice-file-categories?type=SALES&status=active");
        const fileCatData = await fileCatRes.json();
        if (fileCatRes.ok && fileCatData.categories) {
          setSalesFileCategories(fileCatData.categories);
        } else {
          setSalesFileCategories([
            { id: 1, name: "Sales Invoice / Bill", code: "FILE-SALES-INV", type: "SALES", description: "Tax Invoice issued to Client", is_required: 1 },
            { id: 2, name: "Commission Payout Claim Form", code: "FILE-SALES-CLAIM", type: "SALES", description: "Agent Statement", is_required: 1 },
            { id: 3, name: "Client Trade License / Passport / TRN", code: "FILE-SALES-LIC", type: "SALES", description: "Tax Verification", is_required: 0 },
            { id: 4, name: "Payment Receipt & Deposit Slips", code: "FILE-SALES-RCPT", type: "SALES", description: "Official Receipts", is_required: 0 },
            { id: 5, name: "Bank Advice & Transfer Confirmation", code: "FILE-SALES-BANK", type: "SALES", description: "Proof of Payment", is_required: 0 },
          ]);
        }

        // Load Target Sale Record
        const saleRes = await fetch(`/api/sales?search=${encodeURIComponent(id)}`);
        const saleData = await saleRes.json();
        if (saleRes.ok && saleData.sales) {
          const match = saleData.sales.find((s: any) => String(s.id) === String(id));
          if (match) {
            setSale(match);
            setSaleDate(match.sale_date ? new Date(match.sale_date).toISOString().slice(0, 10) : "");
            setTaxType(match.tax_type || "VAT");
            setCustomerName(match.customer_name || "");
            setTinNumber(match.tin_number || "");
            setInvoiceNumber(match.invoice_number || "");
            setCategoryName(match.category_name || "COMMISSION SALES");
            setSubcategoryName(match.subcategory_name || "Real Estate Brokerage");
            setVatTreatment(match.vat_treatment || "Standard Rate (5%)");
            setAmount(String(match.amount || ""));
            setVatAmount(String(match.vat_amount || ""));
            setGrossTaxable(String(match.gross_taxable || match.amount || ""));
            setTotalActualAmount(String(match.total_actual_amount || match.total_amount || ""));
            setPaymentMethod(match.payment_method || "BANK_TRANSFER");
            setRemarks(match.remarks || "");
            setExistingAttachments(match.attachments || []);
          } else {
            alert("Sale record not found.");
            router.push("/invoices/sales");
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, [id, router]);

  // Submit Update Handler
  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Customer / Client Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      // Upload new staged files to AWS S3 under commissions_hub/sales/
      const newAttachmentsPayload: any[] = [];

      for (const pCat of salesFileCategories) {
        const catFiles = stagedFiles[pCat.code] || [];
        for (const fItem of catFiles) {
          if (fItem.file) {
            const formData = new FormData();
            formData.append("file", fItem.file);
            formData.append("file_category_code", pCat.code);

            const uploadRes = await fetch("/api/sales/upload", {
              method: "POST",
              body: formData,
            });

            const uploadData = await uploadRes.json();
            if (uploadRes.ok && uploadData.url) {
              newAttachmentsPayload.push({
                file_category_id: pCat.id,
                file_category_code: pCat.code,
                file_category_name: pCat.name,
                original_filename: fItem.name,
                file_path: uploadData.url,
                file_size: fItem.size,
                mime_type: fItem.type,
              });
            } else {
              throw new Error(uploadData.error || `Failed to upload ${fItem.name} to S3`);
            }
          }
        }
      }

      const payload = {
        id,
        sale_date: saleDate,
        tax_type: taxType,
        invoice_number: invoiceNumber,
        customer_name: customerName,
        tin_number: tinNumber,
        category_name: categoryName,
        subcategory_name: subcategoryName,
        vat_treatment: vatTreatment,
        amount: parseFloat(amount) || 0,
        vat_amount: parseFloat(vatAmount) || 0,
        gross_taxable: parseFloat(grossTaxable) || parseFloat(amount) || 0,
        total_actual_amount: parseFloat(totalActualAmount) || 0,
        payment_method: paymentMethod,
        remarks,
        new_attachments: newAttachmentsPayload,
        deleted_attachment_ids: deletedAttachmentIds,
      };

      const res = await fetch("/api/sales", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update sale");

      alert("Sales record and attachments updated successfully!");
      router.push("/invoices/sales");
    } catch (err: any) {
      alert(`Update Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading Sales Record Details..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Header Navigation */}
      <div className="w-full max-w-7xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/invoices/sales"
            className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 shadow-[0_4px_0_0_#CBD5E1] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            <BigBackIcon />
            <span className="font-extrabold text-sm text-slate-800 group-hover:text-emerald-600">Back to Sales Portal</span>
          </Link>

          <Image src="/fhi.png" alt="Filipino Homes" width={180} height={50} className="object-contain h-14 w-auto hidden sm:block" priority />
        </div>

        <span className="px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
          Edit Sales Record
        </span>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <span className="font-mono text-xs font-black text-emerald-600 block uppercase tracking-wider">Sales Record #{sale?.sale_number}</span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{customerName || "Client Name"}</h1>
              <p className="text-xs text-slate-500 font-semibold mt-1">Recorded by {sale?.fullname || "Admin"} ({sale?.team || "General Admin"})</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-[0_4px_0_0_#CBD5E1] flex items-center gap-2 cursor-pointer ${
                  activeTab === "info"
                    ? "bg-blue-600 text-white shadow-[0_4px_0_0_#1D4ED8]"
                    : "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-500"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>1. Edit Information</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("attachments")}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-[0_4px_0_0_#CBD5E1] flex items-center gap-2 cursor-pointer ${
                  activeTab === "attachments"
                    ? "bg-emerald-600 text-white shadow-[0_4px_0_0_#047857]"
                    : "bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-500"
                }`}
              >
                <Paperclip className="w-4 h-4" />
                <span>2. Manage Attachments ({existingAttachments.length})</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveSale} className="space-y-8 text-xs pt-4">
            {/* TAB 1: EDIT INFORMATION */}
            {activeTab === "info" && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Sales Revenue & Tax Details
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Edit invoice dates, client TRN details, subcategory, and revenue breakdowns.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sale Date *</label>
                    <input
                      type="date"
                      required
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tax Classification *</label>
                    <select
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value as any)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="VAT">VAT (Standard 5% Rate)</option>
                      <option value="NONVAT">NON-VAT (Zero-Rated / Exempt)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Client / Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Client TRN / TIN Number</label>
                    <input
                      type="text"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tax Invoice Ref #</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="CHEQUE">CHEQUE</option>
                      <option value="CREDIT_CARD">CREDIT CARD</option>
                      <option value="CASH">CASH</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales Subcategory</label>
                  <select
                    value={subcategoryName}
                    onChange={(e) => setSubcategoryName(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="Real Estate Brokerage">COMMISSION SALES → Real Estate Brokerage</option>
                    <option value="Off-Plan Developer Sales">COMMISSION SALES → Off-Plan Developer Sales</option>
                    <option value="Secondary Resale Commission">COMMISSION SALES → Secondary Resale Commission</option>
                    <option value="Commercial Property Sales">COMMISSION SALES → Commercial Property Sales</option>
                    <option value="Property Management Fees">COMMISSION SALES → Property Management Fees</option>
                  </select>
                </div>

                {/* Amounts Breakdown Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Net Amount (AED)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Output VAT 5%</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vatAmount}
                      onChange={(e) => setVatAmount(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-xs text-emerald-600 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gross Taxable</label>
                    <input
                      type="number"
                      step="0.01"
                      value={grossTaxable}
                      onChange={(e) => setGrossTaxable(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Actual</label>
                    <input
                      type="number"
                      step="0.01"
                      value={totalActualAmount}
                      onChange={(e) => setTotalActualAmount(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-black text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Remarks / Transaction Notes</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter transaction notes..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: MANAGE ATTACHMENTS */}
            {activeTab === "attachments" && (
              <div className="space-y-8">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-emerald-600" />
                    Manage Sales Documents & AWS S3 Files
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Delete existing attachments or upload new files to AWS S3 under `commissions_hub/sales`.</p>
                </div>

                {/* Section A: Existing Attachments */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    Existing Uploaded Files ({existingAttachments.length})
                  </h3>

                  {existingAttachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {existingAttachments.map((att) => {
                        const isMarkedDelete = deletedAttachmentIds.includes(att.id);

                        return (
                          <div
                            key={att.id}
                            className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-colors ${
                              isMarkedDelete ? "bg-red-50 border-red-300 opacity-60" : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                              <div className="truncate">
                                <span className={`font-bold text-sm block truncate ${isMarkedDelete ? "line-through text-red-700" : "text-slate-900"}`}>
                                  {att.original_filename}
                                </span>
                                <span className="text-xs text-slate-500 font-semibold block">{att.file_category_name}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {att.file_path && (
                                <a
                                  href={att.file_path}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-600 font-bold text-xs flex items-center gap-1 shadow-2xs"
                                  title="View / Download from AWS S3"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>View S3</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletedAttachmentIds((prev) =>
                                    isMarkedDelete ? prev.filter((i) => i !== att.id) : [...prev, att.id]
                                  );
                                }}
                                className={`px-3 py-1.5 rounded-xl border font-extrabold text-xs cursor-pointer ${
                                  isMarkedDelete ? "bg-white text-slate-600 border-slate-300" : "bg-red-50 text-red-600 border-red-200"
                                }`}
                              >
                                {isMarkedDelete ? "Undo" : "Remove"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No existing attachments for this sale record.</p>
                  )}
                </div>

                {/* Section B: Upload Additional File Dropzones */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    Upload Additional Sales Files (AWS S3)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {salesFileCategories.map((pCat) => {
                      const catFiles = stagedFiles[pCat.code] || [];

                      return (
                        <div key={pCat.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <span className="font-extrabold text-slate-900 text-xs block">{pCat.name}</span>
                          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-3 bg-white flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-slate-700 hover:text-emerald-600 transition-colors">
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span>Attach New File ({catFiles.length})</span>
                            <input
                              type="file"
                              multiple
                              onChange={(e) => {
                                if (!e.target.files) return;
                                const newF = Array.from(e.target.files).map((f) => ({
                                  file: f,
                                  name: f.name,
                                  size: f.size,
                                  type: f.type,
                                }));
                                setStagedFiles((prev) => ({
                                  ...prev,
                                  [pCat.code]: [...(prev[pCat.code] || []), ...newF],
                                }));
                              }}
                              className="hidden"
                            />
                          </label>

                          {catFiles.length > 0 && (
                            <div className="space-y-1.5 mt-2">
                              {catFiles.map((f: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">{f.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStagedFiles((prev) => {
                                        const list = [...(prev[pCat.code] || [])];
                                        list.splice(idx, 1);
                                        return { ...prev, [pCat.code]: list };
                                      });
                                    }}
                                    className="text-slate-400 hover:text-red-600"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Link
                href="/invoices/sales"
                className="px-6 py-3 font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                {submitting ? "Saving Changes..." : "Save Sales Record Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Sales & Commission Module
      </footer>
    </div>
  );
}
