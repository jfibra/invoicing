"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Upload,
  FileCheck,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Trash2,
  Loader2,
  Eye,
  X,
  FileSpreadsheet,
  Plus,
} from "lucide-react";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 drop-shadow-sm">
    <defs>
      <linearGradient id="backGradPdf" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="26" fill="url(#backGradPdf)" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ParsedInvoice {
  fileName: string;
  fileSize: number;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  tinNumber: string;
  projectUnit: string;
  sellingPrice: string;
  claimType: string;
  percentage: string;
  commissionAmt: string;
  rawTextPreview?: string;
}

export default function InvoicePdfReaderPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedInvoice[]>([]);
  const [previewRawText, setPreviewRawText] = useState<{ fileName: string; text: string } | null>(null);

  // File Select Handler (Supports multiple PDFs)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  // Remove File from Staged Upload List
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Process & Read PDF Invoices
  const handleProcessPdfs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert("Please select at least one sales invoice PDF file.");
      return;
    }

    setParsing(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/sales/pdf-reader", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process PDF documents.");

      setParsedData(data.results || []);
      alert(`Successfully processed and extracted data from ${data.count || 0} PDF invoice(s)!`);
    } catch (err: any) {
      alert(`PDF Reader Error: ${err.message}`);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Navigation Header */}
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

        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 font-extrabold text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Sales Invoice PDF Reader</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Top Overview Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-2 bg-blue-600" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Invoice PDF Reader
          </h1>
          <p className="text-xs text-slate-500 font-semibold max-w-3xl leading-relaxed">
            Upload single or multiple sales invoice PDFs (e.g., Azizi Developments / FHI Global Sales Invoices). The PDF reader automatically extracts the Invoiced Client, TRN, Project / Unit Number, Selling Price, Claim %, and Commission Received Amount.
          </p>
        </div>

        {/* Uploader Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Upload className="w-5 h-5 text-blue-600" />
            1. Upload Sales Invoice PDFs (Multiple Supported)
          </h2>

          <form onSubmit={handleProcessPdfs} className="space-y-6">
            {/* Drag & Drop File Select Area */}
            <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl text-center space-y-4 transition-colors">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Select Sales Invoice PDF File(s)</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Upload `.pdf` files from your computer to inspect and extract commission data.</p>
              </div>
              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Browse PDF Files</span>
                <input type="file" multiple accept=".pdf" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>

            {/* Selected Staged Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-extrabold uppercase text-slate-400 block">
                  Staged PDF Files ({selectedFiles.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Read Action Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={parsing || selectedFiles.length === 0}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_0_#1D4ED8] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting PDF Data...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Process & Extract ({selectedFiles.length}) PDF Invoice Data</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Extracted Results Data Table */}
        {parsedData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  2. Extracted Sales & Commission DataTable ({parsedData.length} Records)
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Extracted commission details parsed directly from PDF invoice text.
                </p>
              </div>

              <span className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs">
                Parsed Successfully
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="py-4 px-4">PDF File</th>
                    <th className="py-4 px-4">Invoice #</th>
                    <th className="py-4 px-4">Invoice Date</th>
                    <th className="py-4 px-4">Invoiced Client</th>
                    <th className="py-4 px-4">TRN</th>
                    <th className="py-4 px-4">Project / Unit</th>
                    <th className="py-4 px-4">Selling Price</th>
                    <th className="py-4 px-4">Claim %</th>
                    <th className="py-4 px-4 text-right">Commission Amt</th>
                    <th className="py-4 px-4 text-center">Inspect</th>
                    <th className="py-4 px-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-semibold">
                  {parsedData.map((row, idx) => {
                    const rawCommNum = parseFloat((row.commissionAmt || "0").replace(/,/g, "")) || 0;

                    // Build URL params for Add Sales form in a new tab
                    const buildAddSalesUrl = () => {
                      const params = new URLSearchParams({
                        mode: "ADD",
                        customer_name: row.clientName || "",
                        tin_number: row.tinNumber || "",
                        invoice_number: row.invoiceNumber || "",
                        sale_date: row.invoiceDate ? new Date(row.invoiceDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                        amount: String(rawCommNum),
                        subcategory_name: row.projectUnit || "Real Estate Brokerage",
                        remarks: `Extracted from PDF: ${row.fileName} (Claim ${row.percentage || "N/A"} on Selling Price AED ${Number(row.sellingPrice || 0).toLocaleString()})`,
                      });
                      return `/invoices/sales?${params.toString()}`;
                    };

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900 block truncate max-w-[160px]" title={row.fileName}>
                            {row.fileName}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-blue-600">{row.invoiceNumber || "N/A"}</td>
                        <td className="py-4 px-4 text-slate-600">{row.invoiceDate || "N/A"}</td>
                        <td className="py-4 px-4 font-bold text-slate-900">{row.clientName || "N/A"}</td>
                        <td className="py-4 px-4 font-mono text-slate-500">{row.tinNumber || "N/A"}</td>
                        <td className="py-4 px-4 font-bold text-slate-800">{row.projectUnit || "N/A"}</td>
                        <td className="py-4 px-4 text-slate-700">AED {Number(row.sellingPrice || 0).toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[10px]">
                            {row.percentage || "N/A"} ({row.claimType})
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-black text-emerald-600 text-sm">
                          AED {row.commissionAmt || "0.00"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setPreviewRawText({ fileName: row.fileName, text: row.rawTextPreview || "" })}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="View Raw PDF Text Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <a
                            href={buildAddSalesUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_2px_0_0_#047857] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Sales</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Raw Text Preview */}
        {previewRawText && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Raw PDF Text Preview ({previewRawText.fileName})
                </h3>
                <button onClick={() => setPreviewRawText(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                readOnly
                rows={12}
                value={previewRawText.text}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-700 outline-none"
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewRawText(null)}
                  className="px-5 py-2 bg-slate-900 text-white font-extrabold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Sales Invoice PDF Reader
      </footer>
    </div>
  );
}
