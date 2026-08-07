"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TrendingUp,
  Search,
  Plus,
  Upload,
  History,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Calendar,
  Building2,
  DollarSign,
  Tag,
  FileSpreadsheet,
  Users,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Trash2,
  Download,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Kiosk SVG Icons for the 3 requested buttons
const AddSaleKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#059669" />
    <circle cx="32" cy="32" r="14" fill="#FFFFFF" opacity="0.9" />
    <path d="M32 24V40M24 32H40" stroke="#047857" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const ViewSalesKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2563EB" />
    <rect x="18" y="20" width="28" height="24" rx="4" fill="#FFFFFF" opacity="0.9" />
    <path d="M24 28H40M24 34H34" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const BulkSalesUioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#7C3AED" />
    <path d="M32 18V38M32 18L24 26M32 18L40 26" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 44H44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const PdfReaderKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#0284C7" />
    <rect x="18" y="16" width="28" height="32" rx="4" fill="#FFFFFF" opacity="0.95" />
    <path d="M24 24H40" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 30H36" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 36H32" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
    <circle cx="38" cy="38" r="7" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
    <path d="M43 43L48 48" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

interface TrnLibraryResult {
  id: number;
  company_name: string;
  tin_number: string;
  trade_license_number?: string;
  country_code?: string;
  entity_type?: string;
}

interface SalesFileCategory {
  id: number;
  name: string;
  code: string;
  type: string;
  description: string;
  is_required: number | boolean;
}

export default function SalesPortalPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Sales Portal..." />}>
      <SalesPortalContent />
    </Suspense>
  );
}

function SalesPortalContent() {
  // Mode: MENU, ADD, VIEW, BULK
  const [viewMode, setViewMode] = useState<"MENU" | "ADD" | "VIEW" | "BULK">("MENU");

  // Auth User / Member State (for recording sale creator & team)
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Sales File Categories (Types of files users can upload for sales)
  const [salesFileCategories, setSalesFileCategories] = useState<SalesFileCategory[]>([]);

  // TRN Library Autocomplete Search State
  const [trnSearchQuery, setTrnSearchQuery] = useState("");
  const [trnSearchResults, setTrnSearchResults] = useState<TrnLibraryResult[]>([]);
  const [trnSearching, setTrnSearching] = useState(false);
  const [selectedTrnId, setSelectedTrnId] = useState<number | null>(null);
  const [showTrnDropdown, setShowTrnDropdown] = useState(false);

  // Sales Directory & KPIs State
  const [sales, setSales] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ total_records: 0, total_gross_taxable: 0, total_output_vat: 0, total_actual_sales: 0 });
  const [search, setSearch] = useState("");
  const [taxTypeFilter, setTaxTypeFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [expandedSaleIds, setExpandedSaleIds] = useState<number[]>([]);

  // Add Sale Form State
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [taxType, setTaxType] = useState<"VAT" | "NONVAT">("VAT");
  const [customerName, setCustomerName] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [categoryName, setCategoryName] = useState("COMMISSION SALES");
  const [subcategoryName, setSubcategoryName] = useState("Real Estate Brokerage");
  const [vatTreatment, setVatTreatment] = useState("Standard Rate (5%)");

  // Amounts
  const [amount, setAmount] = useState<string>("");
  const [vatAmount, setVatAmount] = useState<string>("");
  const [grossTaxable, setGrossTaxable] = useState<string>("");
  const [totalActualAmount, setTotalActualAmount] = useState<string>("");

  // Attribution & Notes
  const [recordedByMemberId, setRecordedByMemberId] = useState<number | null>(null);
  const [recordedByMemberCode, setRecordedByMemberCode] = useState<string>("");
  const [recordedByFullname, setRecordedByFullname] = useState<string>("");
  const [recordedByTeam, setRecordedByTeam] = useState<string>("");
  const [recordedBySubteam, setRecordedBySubteam] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [remarks, setRemarks] = useState("");

  // Dynamic Per-File-Category Attachments State
  const [stagedFiles, setStagedFiles] = useState<{ [catCode: string]: any[] }>({});
  const [submitting, setSubmitting] = useState(false);

  // Bulk Uploader State
  const [bulkText, setBulkText] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);

  // Fetch Current Auth User
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/login");
        if (res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            setRecordedByMemberId(data.user.memberId || null);
            setRecordedByMemberCode(data.user.memberCode || "");
            setRecordedByFullname(data.user.name || "");
            setRecordedByTeam(data.user.teamName || "");
            setRecordedBySubteam(data.user.subteamName || "");
          }
        }
      } catch (err) {
        console.error("Auth load error:", err);
      }
    }
    loadUser();
  }, []);

  // Parse URL search parameters for pre-filling Add Sales form (e.g. from PDF Reader)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const pCustomer = params.get("customer_name");
    const pTin = params.get("tin_number");
    const pInvNum = params.get("invoice_number");
    const pDate = params.get("sale_date");
    const pAmount = params.get("amount");
    const pSubcat = params.get("subcategory_name");
    const pRemarks = params.get("remarks");

    if (mode === "ADD" || pCustomer || pAmount || pInvNum) {
      setViewMode("ADD");
      if (pCustomer) setCustomerName(pCustomer);
      if (pTin) setTinNumber(pTin);
      if (pInvNum) setInvoiceNumber(pInvNum);
      if (pDate) setSaleDate(pDate);
      if (pAmount) {
        setAmount(pAmount);
        setGrossTaxable(pAmount);
        setTotalActualAmount(pAmount);
      }
      if (pSubcat) setSubcategoryName(pSubcat);
      if (pRemarks) setRemarks(pRemarks);
    }
  }, []);

  // Load Sales File Categories (Type: SALES)
  useEffect(() => {
    async function loadSalesFileCategories() {
      try {
        const res = await fetch("/api/invoice-file-categories?type=SALES&status=active");
        const data = await res.json();
        if (res.ok && data.categories) {
          setSalesFileCategories(data.categories);
        } else {
          // Fallback categories if table is empty
          setSalesFileCategories([
            { id: 1, name: "Sales Invoice / Bill", code: "FILE-SALES-INV", type: "SALES", description: "Tax Invoice issued to Client", is_required: 1 },
            { id: 2, name: "Commission Payout Claim Form", code: "FILE-SALES-CLAIM", type: "SALES", description: "Agent / Broker Commission Statement", is_required: 1 },
            { id: 3, name: "Client Trade License / Passport / TRN", code: "FILE-SALES-LIC", type: "SALES", description: "Customer Tax & Identity Verification", is_required: 0 },
            { id: 4, name: "Payment Receipt & Deposit Slips", code: "FILE-SALES-RCPT", type: "SALES", description: "Official Receipts", is_required: 0 },
            { id: 5, name: "Bank Advice & Transfer Confirmation", code: "FILE-SALES-BANK", type: "SALES", description: "Proof of Payment Transfer", is_required: 0 },
          ]);
        }
      } catch (err) {
        console.error("Error loading sales file categories:", err);
      }
    }
    loadSalesFileCategories();
  }, []);

  // TRN Library Autocomplete Search against trn_records
  const executeTrnSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setTrnSearchResults([]);
      setShowTrnDropdown(false);
      return;
    }

    setTrnSearching(true);
    try {
      const res = await fetch(`/api/trn-library?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && data.records) {
        setTrnSearchResults(data.records);
        setShowTrnDropdown(true);
      }
    } catch (err) {
      console.error("TRN Search Error:", err);
    } finally {
      setTrnSearching(false);
    }
  }, []);

  // Debounced search on typing Customer Name or TRN
  useEffect(() => {
    const activeQuery = trnSearchQuery || customerName || tinNumber;
    const timer = setTimeout(() => {
      if (activeQuery) executeTrnSearch(activeQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [trnSearchQuery, customerName, tinNumber, executeTrnSearch]);

  // Select TRN Record from Dropdown
  const handleSelectTrnRecord = (rec: TrnLibraryResult) => {
    setCustomerName(rec.company_name);
    setTinNumber(rec.tin_number || "");
    setSelectedTrnId(rec.id);
    setShowTrnDropdown(false);
    setTrnSearchQuery("");
  };

  // Fetch Sales Directory Records & KPIs
  const fetchSales = useCallback(async () => {
    setLoadingDirectory(true);
    try {
      let url = `/api/sales?page=${page}&limit=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (taxTypeFilter) url += `&tax_type=${encodeURIComponent(taxTypeFilter)}`;
      if (teamFilter) url += `&team=${encodeURIComponent(teamFilter)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.sales) {
        setSales(data.sales);
        if (data.kpis) setKpis(data.kpis);
        if (data.pagination) setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Fetch Sales Error:", err);
    } finally {
      setLoadingDirectory(false);
    }
  }, [page, search, taxTypeFilter, teamFilter]);

  useEffect(() => {
    if (viewMode === "VIEW") {
      fetchSales();
    }
  }, [viewMode, fetchSales]);

  // Auto-calculate VAT (5%) and Total Amount
  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      if (taxType === "VAT") {
        const calculatedVat = (num * 0.05).toFixed(2);
        setVatAmount(calculatedVat);
        setGrossTaxable(num.toFixed(2));
        setTotalActualAmount((num + parseFloat(calculatedVat)).toFixed(2));
      } else {
        setVatAmount("0.00");
        setGrossTaxable("0.00");
        setTotalActualAmount(num.toFixed(2));
      }
    } else {
      setVatAmount("");
      setGrossTaxable("");
      setTotalActualAmount("");
    }
  };

  // Expandable Row Toggle
  const toggleExpandRow = (id: number) => {
    setExpandedSaleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Delete Sale Handler
  const handleDeleteSale = async (id: number, saleNum: string) => {
    if (!confirm(`Are you sure you want to delete sales record #${saleNum}? This will remove all attached files.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete sale record");

      alert(`Sale record #${saleNum} deleted successfully.`);
      fetchSales();
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  // Submit Add Sale Form
  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Customer / Client Name is required.");
      return;
    }

    const netAmt = parseFloat(amount);
    if (isNaN(netAmt) || netAmt <= 0) {
      alert("Please enter a valid sale amount.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload files to AWS S3 under commissions_hub/sales/
      const attachmentsPayload: any[] = [];

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
              attachmentsPayload.push({
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

      // 2. Post Sales Record to DB
      const payload = {
        sale_date: saleDate,
        tax_type: taxType,
        invoice_number: invoiceNumber,
        trn_record_id: selectedTrnId,
        customer_name: customerName,
        tin_number: tinNumber,
        category_name: categoryName,
        subcategory_name: subcategoryName,
        vat_treatment: vatTreatment,
        amount: netAmt,
        vat_amount: parseFloat(vatAmount) || 0,
        gross_taxable: parseFloat(grossTaxable) || netAmt,
        total_actual_amount: parseFloat(totalActualAmount) || netAmt,
        member_id: recordedByMemberId,
        member_code: recordedByMemberCode,
        fullname: recordedByFullname,
        team: recordedByTeam,
        subteam: recordedBySubteam,
        payment_method: paymentMethod,
        remarks,
        attachments: attachmentsPayload,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record sale");

      alert(`Sale Record #${data.sale_number} saved successfully with ${data.attachment_count || 0} attachments!`);

      // Reset Form
      setCustomerName("");
      setTinNumber("");
      setSelectedTrnId(null);
      setInvoiceNumber("");
      setAmount("");
      setVatAmount("");
      setGrossTaxable("");
      setTotalActualAmount("");
      setRemarks("");
      setStagedFiles({});
      setViewMode("VIEW");
    } catch (err: any) {
      alert(`Record Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // CSV File Upload Selection Handler
  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) setBulkText(text);
    };
    reader.readAsText(file);
  };

  // Submit Bulk Sales Uploader
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      alert("Please paste TSV / CSV text or upload a CSV file.");
      return;
    }

    setBulkUploading(true);
    try {
      const rawLines = bulkText.trim().split("\n");
      const items: any[] = [];

      let startIndex = 0;
      const firstLineLower = rawLines[0].toLowerCase();
      if (
        firstLineLower.includes("client") ||
        firstLineLower.includes("customer") ||
        firstLineLower.includes("date") ||
        firstLineLower.includes("net") ||
        firstLineLower.includes("trn")
      ) {
        startIndex = 1;
      }

      for (let i = startIndex; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (!line) continue;

        const parts = line.split("\t").length > 1
          ? line.split("\t")
          : line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((s) => s.replace(/^"|"$/g, "").trim());

        if (parts.length < 2) continue;

        let sDate = new Date().toISOString().slice(0, 10);
        let tType = "VAT";
        let cust = "";
        let trn = "";
        let invNum = "";
        let subcat = "Real Estate Brokerage";
        let amt = 0;
        let vat = 0;
        let gross = 0;
        let totalActual = 0;
        let payMethod = "BANK_TRANSFER";
        let rem = "";

        if (parts.length >= 10) {
          sDate = parts[0]?.trim() || sDate;
          tType = parts[1]?.trim().toUpperCase() === "NONVAT" ? "NONVAT" : "VAT";
          cust = parts[2]?.trim() || "";
          trn = parts[3]?.trim() || "";
          invNum = parts[4]?.trim() || "";
          subcat = parts[5]?.trim() || "Real Estate Brokerage";
          amt = parseFloat(parts[6]?.trim()) || 0;
          vat = parseFloat(parts[7]?.trim()) || 0;
          gross = parseFloat(parts[8]?.trim()) || amt;
          totalActual = parseFloat(parts[9]?.trim()) || (amt + vat);
          payMethod = parts[10]?.trim() || "BANK_TRANSFER";
          rem = parts[11]?.trim() || "";
        } else {
          cust = parts[0]?.trim() || "";
          trn = parts[1]?.trim() || "";
          amt = parseFloat(parts[2]?.trim()) || 0;
          vat = parseFloat(parts[3]?.trim()) || 0;
          invNum = parts[4]?.trim() || "";
          subcat = parts[5]?.trim() || "Real Estate Brokerage";
          gross = amt;
          totalActual = amt + vat;
        }

        if (cust && (amt > 0 || totalActual > 0)) {
          items.push({
            sale_date: sDate,
            tax_type: tType,
            customer_name: cust,
            tin_number: trn,
            invoice_number: invNum,
            subcategory_name: subcat,
            category_name: "COMMISSION SALES",
            vat_treatment: tType === "VAT" ? "Standard Rate (5%)" : "Zero-Rated (0%)",
            amount: amt,
            vat_amount: vat,
            gross_taxable: gross,
            total_actual_amount: totalActual,
            payment_method: payMethod,
            remarks: rem,
            member_id: recordedByMemberId,
            fullname: recordedByFullname,
            team: recordedByTeam,
            subteam: recordedBySubteam,
          });
        }
      }

      if (items.length === 0) {
        alert("No valid sales rows parsed. Please check the CSV format or download the sample CSV template.");
        return;
      }

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk upload failed");

      alert(data.message || `Successfully processed and recorded ${data.inserted_count} sales entries!`);
      setBulkText("");
      setViewMode("VIEW");
    } catch (err: any) {
      alert(`Bulk Upload Error: ${err.message}`);
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Bar */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer">
              <BigBackIcon />
              <span>Dashboard</span>
            </Link>
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices/sales/pdf-reader"
              className="px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Reader</span>
            </Link>

            {viewMode !== "MENU" && (
              <button
                onClick={() => setViewMode("MENU")}
                className="px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-400 font-bold text-xs text-slate-600 shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
              >
                ← Kiosk Hub
              </button>
            )}

            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 font-extrabold text-[10px] text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              Sales Portal
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10">
        {/* ========================================================= */}
        {/* VIEW MODE 1: KIOSK MAIN MENU BUTTONS */}
        {/* ========================================================= */}
        {viewMode === "MENU" && (
          <div className="space-y-10 py-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Sales & Commission Hub</h1>
              <p className="text-sm font-semibold text-slate-500">Record sales revenues, inspect directory ledgers, or upload bulk batch files.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Button 1: Add Sales */}
              <button
                onClick={() => setViewMode("ADD")}
                className="group relative bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-6 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_0_#CBD5E1] transition-all flex flex-col items-center text-center space-y-4 cursor-pointer"
              >
                <AddSaleKioskIcon />
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-slate-700 transition-colors">Add Sales</h3>
                  <p className="text-xs font-semibold text-slate-500">Record single sales revenue with client TRN auto-linking & S3 file dropzones.</p>
                </div>
                <span className="mt-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 font-extrabold text-[11px] text-emerald-700">
                  New Entry →
                </span>
              </button>

              {/* Button 2: View Sales Records */}
              <button
                onClick={() => setViewMode("VIEW")}
                className="group relative bg-white border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-6 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_0_#CBD5E1] transition-all flex flex-col items-center text-center space-y-4 cursor-pointer"
              >
                <ViewSalesKioskIcon />
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-slate-700 transition-colors">View Sales Records</h3>
                  <p className="text-xs font-semibold text-slate-500">Inspect sales ledger, view output VAT summaries, edit records, or download S3 files.</p>
                </div>
                <span className="mt-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 font-extrabold text-[11px] text-blue-700">
                  Directory Ledger →
                </span>
              </button>

              {/* Button 3: Bulk Sales Uploader */}
              <button
                onClick={() => setViewMode("BULK")}
                className="group relative bg-white border-2 border-slate-200 hover:border-purple-500 rounded-3xl p-6 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_0_#CBD5E1] transition-all flex flex-col items-center text-center space-y-4 cursor-pointer"
              >
                <BulkSalesUioskIcon />
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-slate-700 transition-colors">Bulk Sales Uploader</h3>
                  <p className="text-xs font-semibold text-slate-500">Upload CSV spreadsheets or paste TSV rows directly into database.</p>
                </div>
                <span className="mt-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 font-extrabold text-[11px] text-purple-700">
                  Batch Upload →
                </span>
              </button>

              {/* Button 4: Invoice PDF Reader */}
              <Link
                href="/invoices/sales/pdf-reader"
                className="group relative bg-white border-2 border-slate-200 hover:border-sky-500 rounded-3xl p-6 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_0_#CBD5E1] transition-all flex flex-col items-center text-center space-y-4 cursor-pointer"
              >
                <PdfReaderKioskIcon />
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-slate-700 transition-colors">Invoice PDF Reader</h3>
                  <p className="text-xs font-semibold text-slate-500">Upload sales PDF invoices to automatically extract commission & client data.</p>
                </div>
                <span className="mt-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 font-extrabold text-[11px] text-sky-700">
                  PDF OCR Reader →
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 2: ADD SALE FORM */}
        {/* ========================================================= */}
        {viewMode === "ADD" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-8 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <AddSaleKioskIcon />
                  Record New Sales Revenue
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Enter client information, tax invoice details, and attach supporting sales documents.
                </p>
              </div>
              <button onClick={() => setViewMode("MENU")} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSale} className="space-y-8 text-xs">
              {/* SECTION A: CLIENT / VENDOR & TRN SEARCH */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  1. Client / Customer & TRN Library Record
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                  {/* Customer Name Search & Auto-Complete Input */}
                  <div className="relative">
                    <label className="block font-bold text-slate-700 mb-1">Client / Customer Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g., Emaar Properties PJSC"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setSelectedTrnId(null);
                        }}
                        onFocus={() => {
                          if (trnSearchResults.length > 0) setShowTrnDropdown(true);
                        }}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                      />
                      {trnSearching && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-3.5" />}
                    </div>

                    {/* TRN Library Autocomplete Dropdown */}
                    {showTrnDropdown && trnSearchResults.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                        <div className="p-2 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400">
                          Matching TRN Library Records:
                        </div>
                        {trnSearchResults.map((rec) => (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => handleSelectTrnRecord(rec)}
                            className="w-full p-3 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block">{rec.company_name}</span>
                              <span className="font-mono text-[10px] text-slate-400">TRN: {rec.tin_number || "N/A"}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                              Select Record
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TRN / TIN Number Input */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Client TRN / TIN Number</label>
                    <input
                      type="text"
                      placeholder="e.g., 10029302910003"
                      value={tinNumber}
                      onChange={(e) => {
                        setTinNumber(e.target.value);
                        setSelectedTrnId(null);
                      }}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                {selectedTrnId && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Linked to existing TRN Library Record #{selectedTrnId}</span>
                  </div>
                )}
              </div>

              {/* SECTION B: DATE, TAX TYPE, INVOICE REF */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  2. Sale Date & Tax Classification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sales Tax Invoice #</label>
                    <input
                      type="text"
                      placeholder="e.g., INV-DXB-9901"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: SALES CATEGORY & AMOUNTS */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  3. Sales Category & Breakdown Amounts (AED)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category & Subcategory</label>
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Net Amount (AED) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Output VAT (5%)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
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
                      placeholder="0.00"
                      value={grossTaxable}
                      onChange={(e) => setGrossTaxable(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Sales Revenue</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={totalActualAmount}
                      onChange={(e) => setTotalActualAmount(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-black text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: DYNAMIC PER-FILE-CATEGORY ATTACHMENT DROPZONES */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Paperclip className="w-4 h-4 text-emerald-600" />
                  4. Attach Sales Documents & Proofs (AWS S3 Upload)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {salesFileCategories.map((pCat) => {
                    const catFiles = stagedFiles[pCat.code] || [];

                    return (
                      <div key={pCat.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs block">{pCat.name}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            pCat.is_required ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                          }`}>
                            {pCat.is_required ? "Mandatory" : "Optional"}
                          </span>
                        </div>

                        <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-3 bg-white flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-slate-700 hover:text-emerald-600 transition-colors">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span>Choose Files ({catFiles.length})</span>
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

                        {/* Staged File List Preview */}
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

              {/* SECTION E: TEAM ATTRIBUTION & REMARKS */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  5. Team Attribution & Internal Notes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Recorded By Member / Team</label>
                    <input
                      type="text"
                      disabled
                      value={`${recordedByFullname || "Admin"} (${recordedByTeam || "General Admin"})`}
                      className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Remarks / Transaction Notes</label>
                    <input
                      type="text"
                      placeholder="e.g., Dubai Creek Harbour off-plan commission"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("MENU")}
                  className="px-6 py-3 font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                >
                  {submitting ? "Saving Sales Record..." : "Record Sales Revenue"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 3: VIEW SALES RECORDS DIRECTORY */}
        {/* ========================================================= */}
        {viewMode === "VIEW" && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block">Total Sales Count</span>
                <span className="text-2xl font-black text-slate-900">{kpis.total_records || 0}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block">Gross Taxable Revenue</span>
                <span className="text-2xl font-black text-slate-900">AED {Number(kpis.total_gross_taxable).toLocaleString()}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block">Output VAT (5%)</span>
                <span className="text-2xl font-black text-emerald-600">AED {Number(kpis.total_output_vat).toLocaleString()}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block">Total Sales Volume</span>
                <span className="text-2xl font-black text-blue-600">AED {Number(kpis.total_actual_sales).toLocaleString()}</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by sale #, client name, TRN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={taxTypeFilter}
                  onChange={(e) => setTaxTypeFilter(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none"
                >
                  <option value="">All Tax Types</option>
                  <option value="VAT">VAT (5%)</option>
                  <option value="NONVAT">NON-VAT</option>
                </select>

                <button
                  onClick={fetchSales}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Directory Table */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_6px_0_0_#E2E8F0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="py-4 px-4">Ref #</th>
                      <th className="py-4 px-4">Date</th>
                      <th className="py-4 px-4">Client / Customer</th>
                      <th className="py-4 px-4">Subcategory</th>
                      <th className="py-4 px-4">Team</th>
                      <th className="py-4 px-4">Gross Taxable</th>
                      <th className="py-4 px-4">Output VAT</th>
                      <th className="py-4 px-4">Total Revenue</th>
                      <th className="py-4 px-4 text-center">Files</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loadingDirectory ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400 font-bold">
                          Loading Sales Directory...
                        </td>
                      </tr>
                    ) : sales.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400 font-bold">
                          No sales records found.
                        </td>
                      </tr>
                    ) : (
                      sales.map((sale) => {
                        const atts = sale.attachments || [];
                        const isExpanded = expandedSaleIds.includes(sale.id);

                        return (
                          <React.Fragment key={sale.id}>
                            <tr className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-4 px-4 font-mono font-black text-emerald-600">
                                <button
                                  onClick={() => toggleExpandRow(sale.id)}
                                  className="flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  {atts.length > 0 && (isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />)}
                                  <span>{sale.sale_number}</span>
                                </button>
                              </td>
                              <td className="py-4 px-4 text-slate-600 font-semibold">{sale.sale_date ? new Date(sale.sale_date).toISOString().slice(0, 10) : ""}</td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-slate-900 block">{sale.customer_name}</span>
                                {sale.tin_number && <span className="font-mono text-[10px] text-slate-400 block">TRN: {sale.tin_number}</span>}
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-700">{sale.subcategory_name}</td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-slate-800 block">{sale.fullname || "Admin"}</span>
                                <span className="text-[10px] text-slate-500 font-semibold block">{sale.team || "General Admin"}</span>
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-800">AED {Number(sale.gross_taxable || sale.amount).toLocaleString()}</td>
                              <td className="py-4 px-4 font-bold text-emerald-600">AED {Number(sale.vat_amount).toLocaleString()}</td>
                              <td className="py-4 px-4 font-black text-slate-900">AED {Number(sale.total_actual_amount || sale.total_amount).toLocaleString()}</td>
                              <td className="py-4 px-4 text-center">
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-700 text-[10px]">
                                  {atts.length} Files
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link
                                    href={`/invoices/sales/edit?id=${sale.id}&tab=info`}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] transition-colors cursor-pointer"
                                    title="Edit Sales Details"
                                  >
                                    Edit Info
                                  </Link>
                                  <Link
                                    href={`/invoices/sales/edit?id=${sale.id}&tab=attachments`}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                    title="Manage Sales Files"
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span>Files ({atts.length})</span>
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteSale(sale.id, sale.sale_number)}
                                    className="p-1 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 transition-colors cursor-pointer ml-1"
                                    title="Delete Sale Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* EXPANDABLE FILE ATTACHMENTS LIST ROW */}
                            {isExpanded && atts.length > 0 && (
                              <tr className="bg-slate-50/80 border-b border-slate-200">
                                <td colSpan={10} className="p-4 pl-12">
                                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                                    <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
                                      <Paperclip className="w-4 h-4 text-emerald-600" />
                                      Attached Sales Documents ({atts.length})
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {atts.map((att: any) => (
                                        <div key={att.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-3 truncate">
                                            <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                            <div className="truncate">
                                              <span className="font-bold text-slate-900 block truncate" title={att.original_filename}>
                                                {att.original_filename}
                                              </span>
                                              <span className="text-[10px] text-slate-500 font-semibold block">
                                                {att.file_category_name}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400">
                                              {(att.file_size / 1024).toFixed(0)} KB
                                            </span>
                                            {att.file_path && (
                                              <a
                                                href={att.file_path}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 rounded-md bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-600 font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                                                title="View / Download from AWS S3"
                                              >
                                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>View S3</span>
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 4: BULK SALES UPLOADER */}
        {/* ========================================================= */}
        {viewMode === "BULK" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6 max-w-4xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <FileSpreadsheet className="w-7 h-7 text-purple-600" />
                  Bulk Sales Uploader
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Batch record multiple sales revenue entries using CSV / TSV spreadsheets.
                </p>
              </div>

              {/* Sample Sales CSV Download Button */}
              <a
                href="/sample_sales_bulk_upload.csv"
                download="sample_sales_bulk_upload.csv"
                className="px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-800 font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-purple-600" />
                <span>Download Sample CSV Template</span>
              </a>
            </div>

            {/* CSV File Upload Dropzone */}
            <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl space-y-3 text-center">
              <Upload className="w-8 h-8 text-purple-600 mx-auto" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Select CSV File from Computer</h3>
                <p className="text-xs text-slate-500 font-medium">Or copy and paste your spreadsheet rows directly below.</p>
              </div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Browse & Load CSV File</span>
                <input type="file" accept=".csv,.tsv,.txt" onChange={handleCsvFileSelect} className="hidden" />
              </label>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700">Spreadsheet Lines (CSV / TSV Text):</label>
                  <span className="text-[11px] font-mono text-slate-400">Header line will be auto-detected</span>
                </div>
                <textarea
                  rows={10}
                  required
                  placeholder={`Sale Date,Tax Type,Client Name,TRN Number,Invoice Number,Subcategory,Net Amount,VAT Amount,Gross Taxable,Total Actual,Payment Method,Remarks\n2026-08-01,VAT,Emaar Properties PJSC,10029302910001,INV-SLS-9901,Off-Plan Developer Sales,150000.00,7500.00,150000.00,157500.00,BANK_TRANSFER,Dubai Creek Harbour commission\n2026-08-02,VAT,DAMAC Properties UAE,10038472910002,DAMAC-SLS-2026,Secondary Resale Commission,85000.00,4250.00,85000.00,89250.00,BANK_TRANSFER,DAMAC Hills villa resale payout`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-xs font-semibold outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setViewMode("MENU")} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkUploading}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer text-xs"
                >
                  {bulkUploading ? "Uploading Sales Entries..." : "Process Bulk Upload"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Sales & Commission Module
      </footer>
    </div>
  );
}
