"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Receipt,
  Paperclip,
  FileText,
  Upload,
  Download,
  X,
  Loader2,
  Users,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface PurchaseFileCategory {
  id: number;
  name: string;
  code: string;
  type: string;
  description: string;
  is_required: number | boolean;
}

export default function EditExpensePage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Expense Editor..." />}>
      <EditExpenseContent />
    </Suspense>
  );
}

function EditExpenseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const initialTabParam = searchParams.get("tab") || "info";

  const [activeTab, setActiveTab] = useState<"info" | "attachments">(initialTabParam === "attachments" ? "attachments" : "info");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Categories lists
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [purchaseFileCategories, setPurchaseFileCategories] = useState<PurchaseFileCategory[]>([]);

  // Expense Data State
  const [expense, setExpense] = useState<any | null>(null);
  const [expenseDate, setExpenseDate] = useState("");
  const [taxType, setTaxType] = useState<"VAT" | "NONVAT">("VAT");
  const [companyName, setCompanyName] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [vatTreatment, setVatTreatment] = useState("Recoverable");

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

  // Load Categories & Expense Data
  useEffect(() => {
    async function initData() {
      if (!id) {
        alert("No Expense ID specified.");
        router.push("/invoices/expenses");
        return;
      }

      setLoading(true);
      try {
        // Load Expense Categories
        const catRes = await fetch("/api/expense-categories?status=active");
        const catData = await catRes.json();
        if (catRes.ok && catData.expense_categories) {
          setExpenseCategories(catData.expense_categories);
        }

        // Load Purchase File Categories
        const fileCatRes = await fetch("/api/invoice-file-categories?type=PURCHASE&status=active");
        const fileCatData = await fileCatRes.json();
        if (fileCatRes.ok && fileCatData.categories) {
          setPurchaseFileCategories(fileCatData.categories);
        }

        // Load Target Expense Record
        const expRes = await fetch(`/api/expenses?search=${encodeURIComponent(id)}`);
        const expData = await expRes.json();
        if (expRes.ok && expData.expenses) {
          const match = expData.expenses.find((e: any) => String(e.id) === String(id));
          if (match) {
            setExpense(match);
            setExpenseDate(match.expense_date ? new Date(match.expense_date).toISOString().slice(0, 10) : "");
            setTaxType(match.tax_type || "VAT");
            setCompanyName(match.company_name || "");
            setTinNumber(match.tin_number || "");
            setInvoiceNumber(match.invoice_number || "");
            setSelectedCategory(match.category_name || "");
            setSelectedSubcategory(match.subcategory_name || "");
            setVatTreatment(match.vat_treatment || "Recoverable");
            setAmount(String(match.amount || ""));
            setVatAmount(String(match.vat_amount || ""));
            setGrossTaxable(String(match.gross_taxable || match.amount || ""));
            setTotalActualAmount(String(match.total_actual_amount || match.total_amount || ""));
            setPaymentMethod(match.payment_method || "BANK_TRANSFER");
            setRemarks(match.remarks || "");
            setExistingAttachments(match.attachments || []);
          } else {
            alert("Expense record not found.");
            router.push("/invoices/expenses");
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

  // Handle Category Select
  const handleCategorySelect = (subcatName: string) => {
    setSelectedSubcategory(subcatName);
    const catObj = expenseCategories.find((c) => c.subcategory_name === subcatName);
    if (catObj) {
      setSelectedCategory(catObj.category_name);
      setVatTreatment(catObj.vat_treatment || "Recoverable");
    }
  };

  // Submit Update Handler
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert("Company Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      // Upload new staged files to AWS S3 under commissions_hub/ folder
      const newAttachmentsPayload: any[] = [];

      for (const pCat of purchaseFileCategories) {
        const catFiles = stagedFiles[pCat.code] || [];
        for (const fItem of catFiles) {
          if (fItem.file) {
            const formData = new FormData();
            formData.append("file", fItem.file);
            formData.append("file_category_code", pCat.code);
            formData.append("folder", "expenses");

            const uploadRes = await fetch("/api/expenses/upload", {
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
        expense_date: expenseDate,
        tax_type: taxType,
        invoice_number: invoiceNumber,
        company_name: companyName,
        tin_number: tinNumber,
        category_name: selectedCategory || "OFFICE & ADMINISTRATIVE",
        subcategory_name: selectedSubcategory || "General Expenses",
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

      const res = await fetch("/api/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update expense");

      alert("Expense record and attachments updated successfully!");
      router.push("/invoices/expenses");
    } catch (err: any) {
      alert(`Update Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading Expense Details..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Navigation Header */}
      <div className="w-full max-w-7xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/invoices/expenses"
            className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-red-500 shadow-[0_4px_0_0_#CBD5E1] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            <BigBackIcon />
            <span className="font-extrabold text-sm text-slate-800 group-hover:text-red-600">Back to Expenses Portal</span>
          </Link>

          <Image src="/fhi.png" alt="Filipino Homes" width={180} height={50} className="object-contain h-14 w-auto hidden sm:block" priority />
        </div>

        <span className="px-4 py-1.5 rounded-full bg-blue-100 border border-blue-300 text-blue-800 font-extrabold text-xs uppercase tracking-wider">
          Edit Expense Record
        </span>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <span className="font-mono text-xs font-black text-blue-600 block uppercase tracking-wider">Expense Record #{expense?.expense_number}</span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{companyName || "Vendor Name"}</h1>
              <p className="text-xs text-slate-500 font-semibold mt-1">Recorded by {expense?.fullname || "Admin"} ({expense?.team || "General Admin"})</p>
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
                <Receipt className="w-4 h-4" />
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
                <span>2. Manage File Attachments ({existingAttachments.length})</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveExpense} className="space-y-8 text-xs pt-4">
            {/* TAB 1: EDIT INFORMATION PAGE */}
            {activeTab === "info" && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    Operational Expense & Tax Details
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Edit invoice dates, company tax identification numbers, and subcategories.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Expense Date *</label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tax Classification *</label>
                    <select
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value as any)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="VAT">VAT (Standard 5% Rate)</option>
                      <option value="NONVAT">NON-VAT (Zero-Rated / Exempt)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Vendor Name *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">TRN / TIN Number</label>
                    <input
                      type="text"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-xs outline-none focus:border-blue-600 focus:bg-white"
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
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="CASH">CASH</option>
                      <option value="CREDIT_CARD">CREDIT CARD</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Subcategory (Dubai FTA VAT Checklist)</label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="">Select Subcategory...</option>
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.subcategory_name}>
                        {c.category_name} → {c.subcategory_name} ({c.vat_treatment})
                      </option>
                    ))}
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
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">VAT Amount 5%</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vatAmount}
                      onChange={(e) => setVatAmount(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-emerald-600 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gross Taxable</label>
                    <input
                      type="number"
                      step="0.01"
                      value={grossTaxable}
                      onChange={(e) => setGrossTaxable(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Actual</label>
                    <input
                      type="number"
                      step="0.01"
                      value={totalActualAmount}
                      onChange={(e) => setTotalActualAmount(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-black text-red-600 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Remarks / Internal Notes</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter any additional notes..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: MANAGE ATTACHMENTS PAGE */}
            {activeTab === "attachments" && (
              <div className="space-y-8">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-emerald-600" />
                    Manage Expense Attachments & AWS S3 Documents
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Delete existing attachments or upload new files to AWS S3 under `commissions_hub/expenses`.</p>
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
                              <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
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
                                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-red-500 text-slate-700 hover:text-red-600 font-bold text-xs flex items-center gap-1 shadow-2xs"
                                  title="View / Download from AWS S3"
                                >
                                  <Download className="w-3.5 h-3.5 text-red-600" />
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
                    <p className="text-xs text-slate-400 italic">No existing attachments for this expense record.</p>
                  )}
                </div>

                {/* Section B: Dynamic Per-Category Dropzones for New Files */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    Upload Additional Files (Dynamic Purchase Category Dropzones)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {purchaseFileCategories.map((pCat) => {
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

                          {/* Staged file list preview */}
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

            {/* Bottom Form Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Link
                href="/invoices/expenses"
                className="px-6 py-3 font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-[0_4px_0_0_#1D4ED8] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                {submitting ? "Saving Changes..." : "Save Expense Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Expenses Module
      </footer>
    </div>
  );
}
