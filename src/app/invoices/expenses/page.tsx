"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Receipt,
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
const AddExpenseKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#DC2626" />
    <circle cx="32" cy="32" r="14" fill="#FFFFFF" opacity="0.9" />
    <path d="M32 24V40M24 32H40" stroke="#B91C1C" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const ViewExpenseKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2563EB" />
    <rect x="18" y="20" width="28" height="24" rx="4" fill="#FFFFFF" opacity="0.9" />
    <path d="M24 28H40M24 34H34" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const BulkUploaderKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#059669" />
    <path d="M32 18V38M32 18L24 26M32 18L40 26" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 44H44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
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

interface PurchaseFileCategory {
  id: number;
  name: string;
  code: string;
  type: string;
  description: string;
  is_required: number | boolean;
}

export default function ExpensesPortalPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Expenses Portal..." />}>
      <ExpensesPortalContent />
    </Suspense>
  );
}

function ExpensesPortalContent() {
  // Mode: MENU, ADD, VIEW, BULK
  const [viewMode, setViewMode] = useState<"MENU" | "ADD" | "VIEW" | "BULK">("MENU");

  // Auth User / Member State (for recording expense creator & team)
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Expense Categories & Purchase File Categories
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [purchaseFileCategories, setPurchaseFileCategories] = useState<PurchaseFileCategory[]>([]);

  // TRN Library Autocomplete Search State
  const [trnSearchQuery, setTrnSearchQuery] = useState("");
  const [trnSearchResults, setTrnSearchResults] = useState<TrnLibraryResult[]>([]);
  const [trnSearching, setTrnSearching] = useState(false);
  const [selectedTrnId, setSelectedTrnId] = useState<number | null>(null);
  const [showTrnDropdown, setShowTrnDropdown] = useState(false);

  // Expenses Directory & KPIs State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ total_count: 0, total_net: 0, total_vat: 0, total_gross_taxable: 0, total_actual: 0 });
  const [search, setSearch] = useState("");
  const [vatFilter, setVatFilter] = useState("");
  const [taxTypeFilter, setTaxTypeFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedExpenseId, setExpandedExpenseId] = useState<number | null>(null);

  // Single Add Expense Form State
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taxType, setTaxType] = useState<"VAT" | "NONVAT">("VAT");
  const [companyName, setCompanyName] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [vatTreatment, setVatTreatment] = useState("Recoverable");
  
  // Amount breakdown fields
  const [amount, setAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [grossTaxable, setGrossTaxable] = useState("");
  const [totalActualAmount, setTotalActualAmount] = useState("");

  // Member & Team attribution fields
  const [recordedByMemberId, setRecordedByMemberId] = useState<number | null>(null);
  const [recordedByMemberCode, setRecordedByMemberCode] = useState("");
  const [recordedByFullname, setRecordedByFullname] = useState("");
  const [recordedByTeam, setRecordedByTeam] = useState("");
  const [recordedBySubteam, setRecordedBySubteam] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Per-File-Category Attachments State
  // Format: { [fileCategoryCode]: Array<{ file: File, name: string, size: number, type: string }> }
  const [stagedFiles, setStagedFiles] = useState<{ [catCode: string]: any[] }>({});

  // Bulk Uploader State
  const [bulkText, setBulkText] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);

  // Edit Modal State
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editTab, setEditTab] = useState<"INFO" | "ATTACHMENTS">("INFO");
  const [editExistingAttachments, setEditExistingAttachments] = useState<any[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([]);
  const [editStagedFiles, setEditStagedFiles] = useState<{ [catCode: string]: any[] }>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Load Session User
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/login");
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            setRecordedByMemberId(data.user.memberId || data.user.id || null);
            setRecordedByMemberCode(data.user.memberCode || "");
            setRecordedByFullname(data.user.name || "");
            setRecordedByTeam(data.user.teamName || "Admin Expenses");
            setRecordedBySubteam(data.user.subteamName || "");
          }
        }
      } catch (err) {
        console.error("Failed to load session user:", err);
      }
    }
    loadUser();
  }, []);

  // Load Expense Categories & Purchase File Categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/expense-categories?status=active");
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.expense_categories) {
            setExpenseCategories(data.expense_categories);
          }
        }
      } catch (err) {
        console.error("Failed to load expense categories:", err);
      }
    }

    async function loadFileCategories() {
      try {
        const res = await fetch("/api/invoice-file-categories?type=PURCHASE&status=active");
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.categories) {
            setPurchaseFileCategories(data.categories);
          }
        }
      } catch (err) {
        console.error("Failed to load purchase file categories:", err);
      }
    }

    loadCategories();
    loadFileCategories();
  }, []);

  // TRN Library Live Autocomplete Search effect
  useEffect(() => {
    if (!trnSearchQuery.trim() || trnSearchQuery.length < 2) {
      setTrnSearchResults([]);
      setShowTrnDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setTrnSearching(true);
      try {
        const res = await fetch(`/api/trn-library?search=${encodeURIComponent(trnSearchQuery)}`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.records) {
            setTrnSearchResults(data.records);
            setShowTrnDropdown(data.records.length > 0);
          }
        }
      } catch (err) {
        console.error("TRN search error:", err);
      } finally {
        setTrnSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [trnSearchQuery]);

  // Select TRN Record from Dropdown
  const handleSelectTrnRecord = (record: TrnLibraryResult) => {
    setSelectedTrnId(record.id);
    setCompanyName(record.company_name);
    setTinNumber(record.tin_number);
    setShowTrnDropdown(false);
  };

  // Auto-calculate VAT & Totals when amount or taxType changes
  useEffect(() => {
    const net = parseFloat(amount) || 0;
    if (taxType === "VAT") {
      const vat = Math.round(net * 0.05 * 100) / 100;
      setVatAmount(vat.toString());
      setGrossTaxable(net.toString());
      setTotalActualAmount((net + vat).toString());
    } else {
      setVatAmount("0.00");
      setGrossTaxable("0.00");
      setTotalActualAmount(net.toString());
    }
  }, [amount, taxType]);

  // Fetch Expense Directory Records
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search) query.set("search", search);
      if (vatFilter) query.set("vat_treatment", vatFilter);
      if (taxTypeFilter) query.set("tax_type", taxTypeFilter);
      if (teamFilter) query.set("team", teamFilter);

      const res = await fetch(`/api/expenses?${query.toString()}`);
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.expenses) {
          setExpenses(data.expenses);
          setKpis(data.kpis || { total_count: 0, total_net: 0, total_vat: 0, total_gross_taxable: 0, total_actual: 0 });
        }
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, vatFilter, taxTypeFilter, teamFilter]);

  useEffect(() => {
    if (viewMode === "VIEW") fetchExpenses();
  }, [viewMode, fetchExpenses]);

  // Handle Category selection change
  const handleCategorySelect = (subcatName: string) => {
    setSelectedSubcategory(subcatName);
    const catObj = expenseCategories.find((c) => c.subcategory_name === subcatName);
    if (catObj) {
      setSelectedCategory(catObj.category_name);
      setVatTreatment(catObj.vat_treatment || "Recoverable");
    }
  };

  // Handle local file selection for a specific File Category Dropzone
  const handleFileSelect = (catCode: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files).map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
    }));

    setStagedFiles((prev) => ({
      ...prev,
      [catCode]: [...(prev[catCode] || []), ...newFiles],
    }));
  };

  // Remove staged file from dropzone
  const handleRemoveStagedFile = (catCode: string, index: number) => {
    setStagedFiles((prev) => {
      const list = [...(prev[catCode] || [])];
      list.splice(index, 1);
      return { ...prev, [catCode]: list };
    });
  };

  // Submit Single Expense Form with File Attachments
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const netAmt = parseFloat(amount) || 0;
    if (!companyName.trim()) {
      alert("Please enter a Company Name.");
      return;
    }

    // Check required purchase file categories
    for (const pCat of purchaseFileCategories) {
      if (pCat.is_required && (!stagedFiles[pCat.code] || stagedFiles[pCat.code].length === 0)) {
        alert(`Mandatory Attachment Required: Please attach at least one file under '${pCat.name}'.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Upload files to AWS S3 under commissions_hub/ folder
      const attachmentsPayload: any[] = [];

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
              attachmentsPayload.push({
                file_category_id: pCat.id,
                file_category_code: pCat.code,
                file_category_name: pCat.name,
                original_filename: fItem.name,
                file_path: uploadData.url, // S3 Bucket URL under commissions_hub/
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
        expense_date: expenseDate,
        tax_type: taxType,
        invoice_number: invoiceNumber,
        trn_record_id: selectedTrnId,
        company_name: companyName,
        tin_number: tinNumber,
        category_name: selectedCategory || "OFFICE & ADMINISTRATIVE",
        subcategory_name: selectedSubcategory || "General Expenses",
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

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record expense");

      alert(`Expense #${data.expense_number} recorded successfully with ${data.attachment_count || 0} file attachments!`);
      
      // Reset form
      setCompanyName("");
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

  // Open Edit Expense Modal
  const openEditExpense = (exp: any, initialTab: "INFO" | "ATTACHMENTS" = "INFO") => {
    setEditingExpense({
      ...exp,
      expense_date: exp.expense_date ? new Date(exp.expense_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setEditTab(initialTab);
    setEditExistingAttachments(exp.attachments || []);
    setDeletedAttachmentIds([]);
    setEditStagedFiles({});
  };

  // Delete Expense Record
  const handleDeleteExpense = async (id: number, expNum: string) => {
    if (!confirm(`Are you sure you want to delete expense #${expNum}? This will remove all attached documents.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete expense");

      alert(`Expense #${expNum} deleted successfully.`);
      fetchExpenses();
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  // Submit Edit Expense Form
  const handleSaveEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.company_name.trim()) {
      alert("Company Name is required.");
      return;
    }

    setEditSubmitting(true);
    try {
      // Upload any new staged attachments to S3
      const newAttachmentsPayload: any[] = [];

      for (const pCat of purchaseFileCategories) {
        const catFiles = editStagedFiles[pCat.code] || [];
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
        id: editingExpense.id,
        expense_date: editingExpense.expense_date,
        tax_type: editingExpense.tax_type || "VAT",
        invoice_number: editingExpense.invoice_number,
        company_name: editingExpense.company_name,
        tin_number: editingExpense.tin_number,
        category_name: editingExpense.category_name || "OFFICE & ADMINISTRATIVE",
        subcategory_name: editingExpense.subcategory_name || "General Expenses",
        vat_treatment: editingExpense.vat_treatment || "Recoverable",
        amount: parseFloat(editingExpense.amount) || 0,
        vat_amount: parseFloat(editingExpense.vat_amount) || 0,
        gross_taxable: parseFloat(editingExpense.gross_taxable) || parseFloat(editingExpense.amount) || 0,
        total_actual_amount: parseFloat(editingExpense.total_actual_amount) || parseFloat(editingExpense.total_amount) || 0,
        payment_method: editingExpense.payment_method || "BANK_TRANSFER",
        remarks: editingExpense.remarks,
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

      alert("Expense record updated successfully!");
      setEditingExpense(null);
      fetchExpenses();
    } catch (err: any) {
      alert(`Update Error: ${err.message}`);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle CSV / TSV file upload selection directly from computer
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

  // Submit Bulk Uploader (Supports Header Detection or Standard Column Positional CSV/TSV)
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

      // Check if header line is present
      let startIndex = 0;
      const firstLineLower = rawLines[0].toLowerCase();
      if (
        firstLineLower.includes("company") ||
        firstLineLower.includes("date") ||
        firstLineLower.includes("net") ||
        firstLineLower.includes("trn")
      ) {
        startIndex = 1; // Skip header row
      }

      for (let i = startIndex; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (!line) continue;

        // Parse line by Tab or Comma (handling quoted strings)
        const parts = line.split("\t").length > 1 
          ? line.split("\t") 
          : line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((s) => s.replace(/^"|"$/g, "").trim());

        if (parts.length < 2) continue;

        let expDate = new Date().toISOString().slice(0, 10);
        let taxType = "VAT";
        let company = "";
        let trn = "";
        let invNum = "";
        let subcat = "General Expenses";
        let amt = 0;
        let vat = 0;
        let gross = 0;
        let totalActual = 0;
        let payMethod = "BANK_TRANSFER";
        let rem = "";

        // If line has 10+ columns (matches sample CSV template)
        if (parts.length >= 10) {
          expDate = parts[0]?.trim() || expDate;
          taxType = (parts[1]?.trim().toUpperCase() === "NONVAT" ? "NONVAT" : "VAT");
          company = parts[2]?.trim() || "";
          trn = parts[3]?.trim() || "";
          invNum = parts[4]?.trim() || "";
          subcat = parts[5]?.trim() || "General Expenses";
          amt = parseFloat(parts[6]?.trim()) || 0;
          vat = parseFloat(parts[7]?.trim()) || 0;
          gross = parseFloat(parts[8]?.trim()) || amt;
          totalActual = parseFloat(parts[9]?.trim()) || (amt + vat);
          payMethod = parts[10]?.trim() || "BANK_TRANSFER";
          rem = parts[11]?.trim() || "";
        } else {
          // Standard Positional: Company Name, TRN/TIN, Net Amount, VAT Amount, Invoice Number, Subcategory
          company = parts[0]?.trim() || "";
          trn = parts[1]?.trim() || "";
          amt = parseFloat(parts[2]?.trim()) || 0;
          vat = parseFloat(parts[3]?.trim()) || 0;
          invNum = parts[4]?.trim() || "";
          subcat = parts[5]?.trim() || "General Expenses";
          gross = amt;
          totalActual = amt + vat;
        }

        if (company && (amt > 0 || totalActual > 0)) {
          items.push({
            expense_date: expDate,
            tax_type: taxType,
            company_name: company,
            tin_number: trn,
            invoice_number: invNum,
            subcategory_name: subcat,
            category_name: "OFFICE & ADMINISTRATIVE",
            vat_treatment: taxType === "VAT" ? "Recoverable" : "Blocked",
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
        alert("No valid expense rows parsed. Please check the CSV format or download the sample CSV template.");
        return;
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk upload failed");

      alert(data.message || `Successfully processed and recorded ${data.inserted_count} expense entries!`);
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
            {viewMode === "MENU" ? (
              <Link href="/dashboard" className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer">
                <BigBackIcon />
                <span>Dashboard</span>
              </Link>
            ) : (
              <button onClick={() => setViewMode("MENU")} className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer">
                <BigBackIcon />
                <span>← Expenses Menu</span>
              </button>
            )}
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 font-extrabold text-[10px] text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            Expenses Module
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        
        {/* ========================================================= */}
        {/* VIEW MODE 1: KIOSK MAIN MENU (THE 3 REQUESTED BUTTONS) */}
        {/* ========================================================= */}
        {viewMode === "MENU" && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-600 rounded-l-3xl" />
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Operational Expenses Portal
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Record operational costs, manage VAT/Non-VAT expenses, auto-link TRN Library records, and attach categorized files.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
              {/* Button 1: Add Expenses */}
              <button
                onClick={() => setViewMode("ADD")}
                className="group bg-white border-2 border-slate-200 hover:border-red-500 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <AddExpenseKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  Add Expenses
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Log operational expense with TRN auto-link, tax breakdown & dynamic file dropzones.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-red-200 bg-red-50 text-red-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Record Expense →
                </div>
              </button>

              {/* Button 2: View Expenses Records */}
              <button
                onClick={() => setViewMode("VIEW")}
                className="group bg-white border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <ViewExpenseKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  View Expense Records
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Browse directory table of recorded expenses, attached files & VAT/Tax totals.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-blue-200 bg-blue-50 text-blue-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Open Records →
                </div>
              </button>

              {/* Button 3: Bulk Expenses Uploader */}
              <button
                onClick={() => setViewMode("BULK")}
                className="group bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <BulkUploaderKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  Bulk Expenses Uploader
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Batch upload spreadsheet expense entries via TSV / CSV text paste.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Bulk Upload →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 2: ADD EXPENSE FORM (WITH PER-CATEGORY DROPZONES) */}
        {/* ========================================================= */}
        {viewMode === "ADD" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6 max-w-4xl mx-auto w-full">
            <div className="border-b border-slate-200 pb-6 space-y-2">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Receipt className="w-7 h-7 text-red-600" />
                Record New Operational Expense
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Search or enter TRN company details, tax classification, and attach file category documents.
              </p>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-6 text-xs">
              {/* Member & Team Attribution Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-red-600" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Recording Member & Team</span>
                    <span className="font-extrabold text-slate-900 text-sm">{recordedByFullname || "System Admin"}</span>
                    {recordedByTeam && <span className="text-xs font-semibold text-slate-500 ml-2">({recordedByTeam}{recordedBySubteam ? ` • ${recordedBySubteam}` : ""})</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-red-100 text-red-800 font-extrabold text-[11px]">
                    {recordedByTeam ? "Team Expense" : "Admin Expense"}
                  </span>
                </div>
              </div>

              {/* Row 1: Expense Date & Tax Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tax Type *</label>
                  <select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-red-600"
                  >
                    <option value="VAT">VAT (Standard 5% Rate)</option>
                    <option value="NONVAT">NON-VAT (Zero-Rated / Exempt)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: TRN Library Company Autocomplete Search */}
              <div className="relative">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Company / Vendor Name * (TRN Library Auto-Search)</span>
                  {selectedTrnId && (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      ✓ Linked to TRN Record #{selectedTrnId}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Type to search TRN Library (e.g. du Telecom, DEWA, Etisalat)..."
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setTrnSearchQuery(e.target.value);
                      setSelectedTrnId(null);
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-red-600"
                  />
                  {trnSearching && (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-3.5" />
                  )}
                </div>

                {/* Autocomplete Dropdown list */}
                {showTrnDropdown && trnSearchResults.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border-2 border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {trnSearchResults.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => handleSelectTrnRecord(r)}
                        className="p-3 hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-black text-slate-900 block">{r.company_name}</span>
                          <span className="font-mono font-bold text-slate-500 text-[11px]">TRN/TIN: {r.tin_number}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[10px]">
                          Select →
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: TRN/TIN Number & Tax Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block font-bold text-slate-700 mb-1">TRN / TIN Number (Auto-Search)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type TRN/TIN (e.g. 10029302910003)..."
                      value={tinNumber}
                      onChange={(e) => {
                        setTinNumber(e.target.value);
                        setTrnSearchQuery(e.target.value);
                        setSelectedTrnId(null);
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold outline-none focus:border-red-600"
                    />
                    {trnSearching && (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-3.5" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tax Invoice Ref #</label>
                  <input
                    type="text"
                    placeholder="INV-2026-0091"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Row 4: Expense Subcategory & VAT Treatment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Subcategory (Dubai FTA VAT Checklist)</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-red-600"
                >
                  <option value="">Select Subcategory...</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.subcategory_name}>
                      {c.category_name} → {c.subcategory_name} ({c.vat_treatment})
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 5: Amounts Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Net Amount (AED) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">VAT Amount 5%</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={vatAmount}
                    onChange={(e) => setVatAmount(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-emerald-600 outline-none focus:border-red-600"
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
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Actual</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={totalActualAmount}
                    onChange={(e) => setTotalActualAmount(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-black text-red-600 outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* DYNAMIC PER-FILE-CATEGORY DROPBOX ATTACHMENTS SECTION */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-red-600" />
                    Categorized Purchase Attachments (Dynamic File Dropboxes)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Attach files per required category</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {purchaseFileCategories.map((pCat) => {
                    const catFiles = stagedFiles[pCat.code] || [];
                    const isMandatory = Boolean(pCat.is_required);

                    return (
                      <div
                        key={pCat.id}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          isMandatory
                            ? catFiles.length > 0
                              ? "bg-emerald-50/40 border-emerald-300"
                              : "bg-red-50/30 border-red-300"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{pCat.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                  isMandatory ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {isMandatory ? "Mandatory" : "Optional"}
                              </span>
                            </div>
                            {pCat.description && (
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{pCat.description}</p>
                            )}
                          </div>
                        </div>

                        {/* File Upload Dropzone Button */}
                        <label className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl p-3 bg-white flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs font-bold text-slate-700 hover:text-red-600">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span>Choose or Drag Files ({catFiles.length} attached)</span>
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleFileSelect(pCat.code, e)}
                            className="hidden"
                          />
                        </label>

                        {/* Staged Attached Files Preview List */}
                        {catFiles.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {catFiles.map((f: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]">
                                <div className="flex items-center gap-2 truncate max-w-[200px]">
                                  <FileText className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                  <span className="font-semibold text-slate-800 truncate" title={f.name}>{f.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStagedFile(pCat.code, idx)}
                                    className="p-1 text-slate-400 hover:text-red-600"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setViewMode("MENU")} className="px-5 py-2.5 font-bold text-slate-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  {submitting ? "Recording..." : "Save Expense Record"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 3: VIEW EXPENSES RECORDS DIRECTORY TABLE */}
        {/* ========================================================= */}
        {viewMode === "VIEW" && (
          <div className="space-y-8">
            {/* KPI Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Records</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{kpis.total_count}</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Gross Taxable</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">AED {kpis.total_gross_taxable.toLocaleString()}</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Input VAT (5%)</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">AED {kpis.total_vat.toLocaleString()}</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Actual Expenses</span>
                <span className="text-2xl font-black text-red-600 mt-1 block">AED {kpis.total_actual.toLocaleString()}</span>
              </div>
            </div>

            {/* Expenses Directory Table */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <History className="w-7 h-7 text-blue-600" />
                    Expenses Directory Records
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Browse operational expenses with file attachments & TRN attribution.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewMode("ADD")}
                    className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#B91C1C] flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Expense</span>
                  </button>

                  <button
                    onClick={() => setViewMode("BULK")}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#047857] flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Bulk Upload</span>
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search Code, Company Name, TRN, or Member..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <select
                    value={taxTypeFilter}
                    onChange={(e) => {
                      setTaxTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                  >
                    <option value="">All Tax Types (VAT & NON-VAT)</option>
                    <option value="VAT">VAT Expenses</option>
                    <option value="NONVAT">NON-VAT Expenses</option>
                  </select>
                </div>

                <div>
                  <select
                    value={vatFilter}
                    onChange={(e) => {
                      setVatFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                  >
                    <option value="">All VAT Treatments</option>
                    <option value="Recoverable">Recoverable (5%)</option>
                    <option value="Blocked">Blocked (Non-Claimable)</option>
                    <option value="Mixed-Use">Mixed-Use</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                      <th className="py-3.5 px-4">Exp Code</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Company / TRN</th>
                      <th className="py-3.5 px-4">Subcategory</th>
                      <th className="py-3.5 px-4">Team / Member</th>
                      <th className="py-3.5 px-4">Gross Taxable</th>
                      <th className="py-3.5 px-4">VAT (5%)</th>
                      <th className="py-3.5 px-4">Total Actual</th>
                      <th className="py-3.5 px-4 text-center">Files</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">Loading expense records...</td>
                      </tr>
                    ) : expenses.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">No expense records found.</td>
                      </tr>
                    ) : (
                      expenses.map((exp) => {
                        const isExpanded = expandedExpenseId === exp.id;
                        const atts = exp.attachments || [];

                        return (
                          <React.Fragment key={exp.id}>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-4 font-mono font-extrabold text-blue-700 flex items-center gap-2">
                                {atts.length > 0 && (
                                  <button
                                    onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                                    className="p-1 rounded-md hover:bg-slate-200 text-slate-500 cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                )}
                                <span>{exp.expense_number}</span>
                              </td>
                              <td className="py-4 px-4 text-slate-600 font-semibold">{exp.expense_date ? new Date(exp.expense_date).toISOString().slice(0, 10) : ""}</td>
                              <td className="py-4 px-4">
                                <span className="font-black text-slate-900 block">{exp.company_name}</span>
                                {exp.tin_number && <span className="font-mono text-[10px] text-slate-400 block">TRN: {exp.tin_number}</span>}
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-700">{exp.subcategory_name}</td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-slate-800 block">{exp.fullname || "Admin"}</span>
                                <span className="text-[10px] text-slate-500 font-semibold block">{exp.team || "General Admin"}</span>
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-800">AED {Number(exp.gross_taxable || exp.amount).toLocaleString()}</td>
                              <td className="py-4 px-4 font-bold text-emerald-600">AED {Number(exp.vat_amount).toLocaleString()}</td>
                              <td className="py-4 px-4 font-black text-slate-900">AED {Number(exp.total_actual_amount || exp.total_amount).toLocaleString()}</td>
                              <td className="py-4 px-4 text-center">
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-700 text-[10px]">
                                  {atts.length} Files
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link
                                    href={`/invoices/expenses/edit?id=${exp.id}&tab=info`}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] transition-colors cursor-pointer"
                                    title="Edit Expense Details"
                                  >
                                    Edit Info
                                  </Link>
                                  <Link
                                    href={`/invoices/expenses/edit?id=${exp.id}&tab=attachments`}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                    title="Manage File Attachments"
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span>Files ({atts.length})</span>
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteExpense(exp.id, exp.expense_number)}
                                    className="p-1 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 transition-colors cursor-pointer ml-1"
                                    title="Delete Expense"
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
                                      <Paperclip className="w-4 h-4 text-red-600" />
                                      Attached Purchase Documents ({atts.length})
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {atts.map((att: any) => (
                                        <div key={att.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-3 truncate">
                                            <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
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
                                                className="p-1.5 rounded-md bg-white border border-slate-300 hover:border-red-500 text-slate-700 hover:text-red-600 font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                                                title="View / Download from AWS S3"
                                              >
                                                <Download className="w-3.5 h-3.5 text-red-600" />
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
        {/* VIEW MODE 4: BULK EXPENSES UPLOADER */}
        {/* ========================================================= */}
        {viewMode === "BULK" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6 max-w-4xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
                  Bulk Expenses Uploader
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Batch record multiple operational expenses using CSV / TSV spreadsheets.
                </p>
              </div>

              {/* Sample CSV Download Button */}
              <a
                href="/sample_expenses_bulk_upload.csv"
                download="sample_expenses_bulk_upload.csv"
                className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Download Sample CSV Template</span>
              </a>
            </div>

            {/* CSV File Upload Dropzone */}
            <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl space-y-3 text-center">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Select CSV File from Computer</h3>
                <p className="text-xs text-slate-500 font-medium">Or copy and paste your spreadsheet rows directly below.</p>
              </div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-colors">
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
                  placeholder={`Expense Date,Tax Type,Company Name,TRN Number,Invoice Number,Subcategory,Net Amount,VAT Amount,Gross Taxable,Total Actual,Payment Method,Remarks\n2026-08-01,VAT,du Telecom UAE,10029302910003,INV-DU-9901,Mobile Phones (Business),450.00,22.50,450.00,472.50,BANK_TRANSFER,Monthly corporate mobile lines\n2026-08-02,VAT,DEWA Electricity & Water,10038472910005,DEWA-2026-081,DEWA - Electricity,3500.00,175.00,3500.00,3675.00,BANK_TRANSFER,Commercial office utility statement`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setViewMode("MENU")} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkUploading}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer text-xs"
                >
                  {bulkUploading ? "Uploading Expense Entries..." : "Process Bulk Upload"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Expenses Module
      </footer>
    </div>
  );
}
