"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HeaderNav from "@/components/HeaderNav";
import InvoiceCanvasPreview, { InvoiceCanvasData, TemplateStyle, DeductibleItem } from "@/components/InvoiceCanvasPreview";
import {
  FileText,
  Search,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  Loader2,
  CheckCircle2,
  X,
  Mail,
  User,
  RotateCcw,
  Building2,
  Sparkles,
  Receipt,
  CreditCard,
  Layers,
  Building,
  History,
  Eye,
  Trash2,
  Filter,
  Lock,
  Unlock,
  Edit3,
  Save,
  Plus,
  MapPin,
  Percent,
  Calculator,
  Coins,
  UserCheck,
  Globe,
  Upload,
  Download,
  FileSpreadsheet,
  FileUp,
  AlertTriangle,
  Calendar,
  Paperclip,
  Tag,
  FileText as FileIcon,
  ExternalLink,
} from "lucide-react";

interface InvoicingMember {
  member_id: string | number;
  member_code: string;
  completename: string;
  email: string | null;
  mobile: string | null;
  city: string | null;
  status: string;
  team_id: number | null;
  teamname: string;
  subteam_id: number | null;
  subteam_name: string;
}

type InvoiceType = string;

interface InvoiceTypeOption {
  id: number;
  code: string;
  label: string;
  invoice_title: string;
  description: string;
  status: string;
  sort_order: number;
}


const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IssueCommissionKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#DC2626" />
    <rect x="18" y="16" width="28" height="32" rx="4" fill="#FFFFFF" opacity="0.95" />
    <circle cx="28" cy="28" r="7" fill="#FDE047" stroke="#DC2626" strokeWidth="1.5" />
    <text x="28" y="32" textAnchor="middle" fill="#713F12" fontSize="9" fontWeight="900" fontFamily="sans-serif">%</text>
    <path d="M24 38H40M24 42H34" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const TrackerKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2563EB" />
    <rect x="18" y="20" width="28" height="24" rx="4" fill="#FFFFFF" opacity="0.9" />
    <path d="M24 28H40M24 34H34" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const BulkBatchKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#059669" />
    <path d="M32 18V38M32 18L24 26M32 18L40 26" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 44H44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export default function CommissionInvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-xs text-slate-500 font-bold">
          <Loader2 className="w-6 h-6 animate-spin text-red-600 mr-2" />
          Loading Invoices Portal...
        </div>
      }
    >
      <CommissionInvoicesContent />
    </Suspense>
  );
}

function CommissionInvoicesContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"MENU" | "ISSUE" | "HISTORY" | "BATCH">("MENU");

  // CSV Batch Upload State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsedRows, setCsvParsedRows] = useState<any[]>([]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvBatchErrors, setCsvBatchErrors] = useState<string[]>([]);

  // Helper: CSV Line Parser
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const rawHeaders = parseCSVLine(lines[0]);
    const headers = rawHeaders.map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""));

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every((v) => !v.trim())) continue;
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] !== undefined ? values[idx].trim() : "";
      });
      rows.push(rowObj);
    }
    return rows;
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setCsvFile(file);
    setCsvBatchErrors([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseCSVText(text);
        setCsvParsedRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessBatchInvoices = async () => {
    if (csvParsedRows.length === 0) return;
    setCsvUploading(true);
    setCsvBatchErrors([]);

    try {
      const res = await fetch("/api/invoices/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoices: csvParsedRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process batch CSV");

      if (data.errors && data.errors.length > 0) {
        setCsvBatchErrors(data.errors);
      }

      setSuccessMsg(`Successfully generated ${data.created_count} batch invoices! Redirecting to Invoice Tracker...`);
      setCsvFile(null);
      setCsvParsedRows([]);
      setViewMode("HISTORY");
      fetchInvoiceHistory();
    } catch (err: any) {
      alert(`Batch Processing Error: ${err.message}`);
    } finally {
      setCsvUploading(false);
    }
  };

  const [members, setMembers] = useState<InvoicingMember[]>([]);

  // Search Filters for Agent List
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Pagination for Agent List
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kiosk Invoice Issuance Modal State
  const [selectedMemberForInvoice, setSelectedMemberForInvoice] = useState<InvoicingMember | null>(null);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<InvoiceType>("TAX_INVOICE");
  const [selectedTemplateStyle, setSelectedTemplateStyle] = useState<TemplateStyle>("modern_slate");

  // Issuance Form Fields
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState<"AED" | "PHP">("AED");
  const [developerName, setDeveloperName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [commissionReceived, setCommissionReceived] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [netAmount, setNetAmount] = useState("");
  const [includeVat, setIncludeVat] = useState(true);
  const [vatRate, setVatRate] = useState("5");
  const [deductibles, setDeductibles] = useState<Array<{ id: string; label: string; amount: string }>>([]);
  const [remarks, setRemarks] = useState("");
  const [particularTitle, setParticularTitle] = useState("");
  const [commissionStatus, setCommissionStatus] = useState("NONE");
  const [customCommissionStatus, setCustomCommissionStatus] = useState("");

  // Generated Canvas Preview Data State
  const [activeCanvasInvoice, setActiveCanvasInvoice] = useState<InvoiceCanvasData | null>(null);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin Profile Settings State
  const [adminProfile, setAdminProfile] = useState<any>(null);

  // Dynamic Database Invoice Types State
  const [dbInvoiceTypes, setDbInvoiceTypes] = useState<InvoiceTypeOption[]>([]);

  // SALES Attachment Categories State
  const [salesFileCategories, setSalesFileCategories] = useState<any[]>([]);

  // Issue Invoice Pending Attachments State
  const [pendingAttachments, setPendingAttachments] = useState<
    Array<{ id: string; file: File; categoryId: number; categoryCode: string; categoryName: string }>
  >([]);
  const [pendingCatId, setPendingCatId] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Edit Invoice Attachments State
  const [editAttachments, setEditAttachments] = useState<any[]>([]);
  const [editSelectedFileCatId, setEditSelectedFileCatId] = useState("");
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [uploadingEditFile, setUploadingEditFile] = useState(false);

  useEffect(() => {
    async function loadDbInvoiceTypes() {
      try {
        const res = await fetch("/api/settings/invoice-types");
        const data = await res.json();
        if (res.ok && data.invoiceTypes) {
          setDbInvoiceTypes(data.invoiceTypes);
        }
      } catch (err) {
        console.error("Failed to fetch database invoice types:", err);
      }
    }
    async function loadSalesFileCategories() {
      try {
        const res = await fetch("/api/invoice-file-categories?type=SALES");
        const data = await res.json();
        if (res.ok && data.categories) {
          setSalesFileCategories(data.categories);
        }
      } catch (err) {
        console.error("Failed to fetch sales file categories:", err);
      }
    }
    loadDbInvoiceTypes();
    loadSalesFileCategories();
  }, []);

  // -------------------------------------------------------------
  // Invoice History & Tracker State
  // -------------------------------------------------------------
  const [historyInvoices, setHistoryInvoices] = useState<any[]>([]);
  const [historyKpis, setHistoryKpis] = useState({
    total_count: 0,
    total_commission_received: 0,
    total_net: 0,
    total_vat: 0,
    total_gross: 0,
  });
  const [historySearch, setHistorySearch] = useState("");
  const [historyType, setHistoryType] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [historyYear, setHistoryYear] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ total: 0, totalPages: 1 });
  const [historyLoading, setHistoryLoading] = useState(false);

  // -------------------------------------------------------------
  // Edit Invoice Modal State
  // -------------------------------------------------------------
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editIssuedDate, setEditIssuedDate] = useState("");
  const [editInvoiceType, setEditInvoiceType] = useState<InvoiceType>("TAX_INVOICE");
  const [editCurrency, setEditCurrency] = useState<"AED" | "PHP">("AED");
  const [editAgentName, setEditAgentName] = useState("");
  const [editAgentCode, setEditAgentCode] = useState("");
  const [editDeveloperName, setEditDeveloperName] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectLocation, setEditProjectLocation] = useState("");
  const [editUnitNumber, setEditUnitNumber] = useState("");
  const [editBuyerName, setEditBuyerName] = useState("");
  const [editProjectValue, setEditProjectValue] = useState("");
  const [editCommissionReceived, setEditCommissionReceived] = useState("");
  const [editCommissionRate, setEditCommissionRate] = useState("");
  const [editNetAmount, setEditNetAmount] = useState("");
  const [editIncludeVat, setEditIncludeVat] = useState(true);
  const [editVatRate, setEditVatRate] = useState("5");
  const [editDeductibles, setEditDeductibles] = useState<Array<{ id: string; label: string; amount: string }>>([]);
  const [editRemarks, setEditRemarks] = useState("");
  const [editParticularTitle, setEditParticularTitle] = useState("");
  const [editCommissionStatus, setEditCommissionStatus] = useState("NONE");
  const [editCustomCommissionStatus, setEditCustomCommissionStatus] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // -------------------------------------------------------------
  // Quick View Attachments Modal State
  // -------------------------------------------------------------
  const [viewAttModalOpen, setViewAttModalOpen] = useState(false);
  const [viewAttInvoice, setViewAttInvoice] = useState<any | null>(null);
  const [viewAttList, setViewAttList] = useState<any[]>([]);
  const [viewAttLoading, setViewAttLoading] = useState(false);
  const [viewAttSelectedCatId, setViewAttSelectedCatId] = useState("");
  const [viewAttFile, setViewAttFile] = useState<File | null>(null);
  const [viewAttUploading, setViewAttUploading] = useState(false);

  const handleOpenViewAttachmentsModal = async (inv: any) => {
    setViewAttInvoice(inv);
    setViewAttList([]);
    setViewAttSelectedCatId("");
    setViewAttFile(null);
    setViewAttModalOpen(true);
    setViewAttLoading(true);
    try {
      const res = await fetch(`/api/invoices/attachments?invoice_id=${inv.id}`);
      const data = await res.json();
      if (res.ok && data.attachments) {
        setViewAttList(data.attachments);
      }
    } catch (err) {
      console.error("Failed to fetch attachments:", err);
    } finally {
      setViewAttLoading(false);
    }
  };

  const handleUploadQuickAttachment = async () => {
    if (!viewAttInvoice || !viewAttFile) return;
    setViewAttUploading(true);
    try {
      const selectedCat = salesFileCategories.find((c) => String(c.id) === String(viewAttSelectedCatId));
      const formData = new FormData();
      formData.append("file", viewAttFile);
      formData.append("invoice_id", String(viewAttInvoice.id));
      formData.append("invoice_number", viewAttInvoice.invoice_number);
      formData.append("category_id", selectedCat ? String(selectedCat.id) : "");
      formData.append("category_code", selectedCat ? selectedCat.code || "" : "");
      formData.append("category_name", selectedCat ? selectedCat.name : "General Document");

      const res = await fetch("/api/invoices/attachments", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload attachment");

      setViewAttFile(null);
      const fileInput = document.getElementById("quick-view-attachment-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      const attRes = await fetch(`/api/invoices/attachments?invoice_id=${viewAttInvoice.id}`);
      const attData = await attRes.json();
      if (attRes.ok && attData.attachments) {
        setViewAttList(attData.attachments);
      }
      fetchInvoiceHistory();
    } catch (err: any) {
      alert(err.message || "Error uploading attachment.");
    } finally {
      setViewAttUploading(false);
    }
  };

  const handleDeleteQuickAttachment = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to delete this attachment from S3 and database?")) return;
    try {
      const res = await fetch(`/api/invoices/attachments?id=${attachmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete attachment");

      const attRes = await fetch(`/api/invoices/attachments?invoice_id=${viewAttInvoice.id}`);
      const attData = await attRes.json();
      if (attRes.ok && attData.attachments) {
        setViewAttList(attData.attachments);
      }
      fetchInvoiceHistory();
    } catch (err) {
      alert("Failed to delete attachment.");
    }
  };

  // Handle URL Query Params
  useEffect(() => {
    const queryEmail = searchParams.get("email");
    const queryFirstName = searchParams.get("firstName");
    const queryLastName = searchParams.get("lastName");

    if (queryEmail) setEmail(queryEmail);
    if (queryFirstName) setFirstName(queryFirstName);
    if (queryLastName) setLastName(queryLastName);
  }, [searchParams]);

  // Load Active Admin Profile on Mount
  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const res = await fetch("/api/invoices/profile?type=ADMIN");
        const data = await res.json();
        if (res.ok && data.profile) {
          const defaultAddr = data.addresses?.find((a: any) => a.is_default) || data.addresses?.[0];
          const defaultLogo = data.logos?.find((l: any) => l.is_default) || data.logos?.[0];

          setAdminProfile({
            ...data.profile,
            default_logo_url: data.profile.default_logo_url || defaultLogo?.s3_url,
            address: defaultAddr,
          });

          if (data.profile.currency) setCurrency(data.profile.currency);
          if (data.profile.tax_percentage) setVatRate(String(data.profile.tax_percentage));
          if (data.profile.template_style) setSelectedTemplateStyle(data.profile.template_style);
        }
      } catch (err) {
        console.error("Failed to load admin profile settings:", err);
      }
    }
    loadAdminProfile();
  }, []);

  // Fetch Member Roster for Issuance
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        firstName,
        lastName,
        email,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/invoices/members?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load members for invoicing");

      setMembers(data.members);
      setPagination({
        total: data.pagination.total,
        totalPages: data.pagination.totalPages || 1,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, email, page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  // Fetch Saved Invoices History & Tracker Data
  const fetchInvoiceHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const query = new URLSearchParams({
        search: historySearch,
        type: historyType,
        status: historyStatus,
        year: historyYear,
        page: historyPage.toString(),
        limit: "10",
      });
      const res = await fetch(`/api/invoices?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setHistoryInvoices(data.invoices || []);
        setHistoryKpis(data.kpis || { total_count: 0, total_net: 0, total_vat: 0, total_gross: 0 });
        setHistoryPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error("Failed to fetch invoice history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historySearch, historyType, historyStatus, historyYear, historyPage]);

  useEffect(() => {
    if (viewMode === "HISTORY") {
      fetchInvoiceHistory();
    }
  }, [viewMode, fetchInvoiceHistory]);

  // Auto-calculate Net Amount (Issuance)
  const handleCalcProjectCommission = (projVal: string, commRec: string, rate: string) => {
    const rec = Number(commRec);
    const r = Number(rate);
    const val = Number(projVal);

    if (rec > 0 && r > 0) {
      const calculatedNet = (rec * r) / 100;
      setNetAmount(calculatedNet.toFixed(2));
    } else if (val > 0 && r > 0) {
      const calculatedNet = (val * r) / 100;
      setNetAmount(calculatedNet.toFixed(2));
    }
  };

  // Auto-calculate Net Amount (Edit)
  const handleEditCalcProjectCommission = (projVal: string, commRec: string, rate: string) => {
    const rec = Number(commRec);
    const r = Number(rate);
    const val = Number(projVal);

    if (rec > 0 && r > 0) {
      const calculatedNet = (rec * r) / 100;
      setEditNetAmount(calculatedNet.toFixed(2));
    } else if (val > 0 && r > 0) {
      const calculatedNet = (val * r) / 100;
      setEditNetAmount(calculatedNet.toFixed(2));
    }
  };

  // Deductibles management (Issuance)
  const handleAddDeductible = () => {
    setDeductibles([
      ...deductibles,
      { id: Date.now().toString(), label: "", amount: "" },
    ]);
  };
  const handleRemoveDeductible = (id: string) => {
    setDeductibles(deductibles.filter((d) => d.id !== id));
  };
  const handleUpdateDeductible = (id: string, field: "label" | "amount", val: string) => {
    setDeductibles(
      deductibles.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  // Deductibles management (Edit)
  const handleAddEditDeductible = () => {
    setEditDeductibles([
      ...editDeductibles,
      { id: Date.now().toString(), label: "", amount: "" },
    ]);
  };
  const handleRemoveEditDeductible = (id: string) => {
    setEditDeductibles(editDeductibles.filter((d) => d.id !== id));
  };
  const handleUpdateEditDeductible = (id: string, field: "label" | "amount", val: string) => {
    setEditDeductibles(
      editDeductibles.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  const handleOpenIssueModal = (m: InvoicingMember) => {
    setSelectedMemberForInvoice(m);
    setCustomInvoiceNumber("");
    setIssuedDate(new Date().toISOString().slice(0, 10));
    setCurrency("AED");
    setDeveloperName("");
    setProjectName("");
    setProjectLocation("");
    setUnitNumber("");
    setBuyerName("");
    setProjectValue("");
    setCommissionReceived("");
    setCommissionRate("");
    setNetAmount("");
    setIncludeVat(true);
    setDeductibles([]);
    setPendingAttachments([]);
    setPendingCatId("");
    setPendingFile(null);
    setRemarks("");
    setParticularTitle("");
    setCommissionStatus("NONE");
    setCustomCommissionStatus("");
  };

  const handleResetInvoiceForm = () => {
    setSelectedMemberForInvoice(null);
    setCustomInvoiceNumber("");
    setIssuedDate(new Date().toISOString().slice(0, 10));
    setCurrency("AED");
    setDeveloperName("");
    setProjectName("");
    setProjectLocation("");
    setUnitNumber("");
    setBuyerName("");
    setProjectValue("");
    setCommissionReceived("");
    setCommissionRate("");
    setNetAmount("");
    setIncludeVat(true);
    setDeductibles([]);
    setPendingAttachments([]);
    setPendingCatId("");
    setPendingFile(null);
    setRemarks("");
    setParticularTitle("");
    setCommissionStatus("NONE");
    setCustomCommissionStatus("");
  };

  const handleResetFilters = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPage(1);
  };

  // Submit & Save Invoice to DB + Generate Canvas
  const handleGenerateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForInvoice) return;

    setIssuing(true);
    setSuccessMsg(null);
    try {
      let net = Number(netAmount);
      if ((!net || net === 0) && Number(commissionReceived) > 0 && Number(commissionRate) > 0) {
        net = (Number(commissionReceived) * Number(commissionRate)) / 100;
      } else if ((!net || net === 0) && Number(projectValue) > 0 && Number(commissionRate) > 0) {
        net = (Number(projectValue) * Number(commissionRate)) / 100;
      }

      const activeVatRate = includeVat ? Number(vatRate || 5) : 0;
      const vat = (net * activeVatRate) / 100;

      const formattedDeductibles = deductibles
        .filter((d) => d.label.trim() && Number(d.amount) > 0)
        .map((d) => ({ label: d.label.trim(), amount: Number(d.amount) }));

      const totalDeductibles = formattedDeductibles.reduce((acc, d) => acc + d.amount, 0);
      const gross = net + vat - totalDeductibles;

      const activeStatusText = commissionStatus === "CUSTOM" ? customCommissionStatus : commissionStatus;

      const payload = {
        invoice_number: customInvoiceNumber.trim() || undefined,
        invoice_type: selectedInvoiceType,
        template_style: selectedTemplateStyle,
        currency,
        particular_title: particularTitle,
        commission_status: activeStatusText,
        member_id: selectedMemberForInvoice.member_id,
        agent_code: selectedMemberForInvoice.member_code,
        agent_name: selectedMemberForInvoice.completename,
        agent_email: selectedMemberForInvoice.email,
        team_name: selectedMemberForInvoice.teamname,
        subteam_name: selectedMemberForInvoice.subteam_name,
        developer_name: developerName,
        project_name: projectName,
        project_location: projectLocation,
        unit_number: unitNumber,
        buyer_name: buyerName,
        project_value: projectValue ? Number(projectValue) : null,
        commission_received: commissionReceived ? Number(commissionReceived) : null,
        commission_rate: commissionRate ? Number(commissionRate) : null,
        net_amount: net,
        vat_rate: activeVatRate,
        include_vat: includeVat,
        deductibles: formattedDeductibles,
        remarks,
        issued_date: issuedDate,
      };

      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate invoice");

      const prof = data.profile_snapshot?.profile || adminProfile;
      const addr = data.profile_snapshot?.address || adminProfile?.address;
      const logoUrl = adminProfile?.default_logo_url || prof?.default_logo_url;
      const typeConfig = dbInvoiceTypes.find((t) => t.code === selectedInvoiceType);

      const canvasData: InvoiceCanvasData = {
        invoiceNumber: data.invoice_number,
        invoiceType: selectedInvoiceType,
        invoiceTitle: typeConfig?.invoice_title,
        invoiceTypeConfig: typeConfig,
        templateStyle: selectedTemplateStyle,
        currency,
        particularTitle: particularTitle || undefined,
        commissionStatus: activeStatusText !== "NONE" ? activeStatusText : undefined,
        issuedDate: issuedDate || new Date().toISOString().slice(0, 10),
        agentName: selectedMemberForInvoice.completename,
        agentCode: selectedMemberForInvoice.member_code,
        agentEmail: selectedMemberForInvoice.email || undefined,
        teamName: selectedMemberForInvoice.teamname,
        subteamName: selectedMemberForInvoice.subteam_name,
        developerName,
        projectName,
        projectLocation: projectLocation || undefined,
        unitNumber,
        buyerName: buyerName || undefined,
        projectValue: projectValue ? Number(projectValue) : undefined,
        commissionReceived: commissionReceived ? Number(commissionReceived) : undefined,
        commissionRate: commissionRate ? Number(commissionRate) : undefined,
        netAmount: net,
        vatRate: activeVatRate,
        vatAmount: vat,
        grossAmount: gross,
        deductibles: formattedDeductibles,
        companyName: prof?.company_name || "FHI Global",
        trnNumber: prof?.trn_number || undefined,
        logoUrl: logoUrl || undefined,
        addressLine1: addr ? [addr.building_name, addr.street_address].filter(Boolean).join(", ") : "Opus Tower by Omniyat, Marasi Drive, Business Bay",
        cityCountry: addr ? [addr.city, addr.country].filter(Boolean).join(", ") : "Dubai, United Arab Emirates",
        bankName: prof?.bank_name || "Emirates NBD",
        accountName: prof?.account_name || prof?.company_name || "Leuterio Realty LLC",
        iban: prof?.iban || "AE480260000001234567890",
        swiftCode: prof?.swift_code || "EBILAEAD",
        remarks,
      };

      // Upload pending file attachments if any
      if (pendingAttachments.length > 0 && data.invoice_id) {
        for (const item of pendingAttachments) {
          try {
            const form = new FormData();
            form.append("file", item.file);
            form.append("invoice_id", String(data.invoice_id));
            form.append("invoice_number", data.invoice_number);
            form.append("category_id", String(item.categoryId));
            form.append("category_code", item.categoryCode);
            form.append("category_name", item.categoryName);
            await fetch("/api/invoices/attachments", {
              method: "POST",
              body: form,
            });
          } catch (attErr) {
            console.error("Failed to upload pending attachment:", attErr);
          }
        }
      }
      setPendingAttachments([]);

      setActiveCanvasInvoice(canvasData);
      setSuccessMsg(`Invoice #${data.invoice_number} saved to database & rendered on Canvas!`);
      setSelectedMemberForInvoice(null);
      fetchInvoiceHistory();
    } catch (err: any) {
      alert(`Invoice Generation Error: ${err.message}`);
    } finally {
      setIssuing(false);
    }
  };

  // Toggle Lock / Unlock Invoice Status
  const handleToggleLock = async (id: number, newLockState: boolean) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle_lock", is_locked: newLockState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update lock status");

      setSuccessMsg(data.message);
      fetchInvoiceHistory();
    } catch (err: any) {
      alert(`Lock Toggle Error: ${err.message}`);
    }
  };

  const fetchEditAttachments = async (invoiceId: number) => {
    try {
      const res = await fetch(`/api/invoices/attachments?invoice_id=${invoiceId}`);
      const data = await res.json();
      if (res.ok && data.attachments) {
        setEditAttachments(data.attachments);
      }
    } catch (err) {
      console.error("Failed to fetch edit attachments:", err);
    }
  };

  const handleUploadEditAttachment = async () => {
    if (!editingInvoice || !editSelectedFile || !editSelectedFileCatId) return;
    const cat = salesFileCategories.find((c) => String(c.id) === String(editSelectedFileCatId));
    if (!cat) return;

    setUploadingEditFile(true);
    try {
      const formData = new FormData();
      formData.append("file", editSelectedFile);
      formData.append("invoice_id", String(editingInvoice.id));
      formData.append("invoice_number", editingInvoice.invoice_number);
      formData.append("category_id", String(cat.id));
      formData.append("category_code", cat.code || "GENERAL");
      formData.append("category_name", cat.name);

      const res = await fetch("/api/invoices/attachments", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload attachment");

      setEditSelectedFile(null);
      setEditSelectedFileCatId("");
      const fileInput = document.getElementById("edit-attachment-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      fetchEditAttachments(editingInvoice.id);
    } catch (err: any) {
      alert(`Upload Error: ${err.message}`);
    } finally {
      setUploadingEditFile(false);
    }
  };

  const handleDeleteEditAttachment = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to delete this attachment from S3 and database?")) return;
    try {
      const res = await fetch(`/api/invoices/attachments?id=${attachmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchEditAttachments(editingInvoice.id);
      }
    } catch (err) {
      alert("Failed to delete attachment.");
    }
  };

  // Open Edit Invoice Modal
  const handleOpenEditModal = (inv: any) => {
    if (inv.is_locked) {
      alert("This invoice is currently locked. Click the Lock icon to unlock it first before editing.");
      return;
    }

    let parsedDeductibles: any[] = [];
    try {
      parsedDeductibles = inv.deductibles ? (typeof inv.deductibles === "string" ? JSON.parse(inv.deductibles) : inv.deductibles) : [];
    } catch (e) {
      parsedDeductibles = [];
    }

    setEditingInvoice(inv);
    setEditInvoiceNumber(inv.invoice_number || "");
    setEditAttachments([]);
    setEditSelectedFileCatId("");
    setEditSelectedFile(null);
    if (inv.id) {
      fetchEditAttachments(inv.id);
    }
    setEditIssuedDate(
      inv.issued_date
        ? (typeof inv.issued_date === "string" ? inv.issued_date.slice(0, 10) : new Date(inv.issued_date).toISOString().slice(0, 10))
        : new Date().toISOString().slice(0, 10)
    );
    setEditInvoiceType(inv.invoice_type || "TAX_INVOICE");
    setEditCurrency(inv.currency === "PHP" ? "PHP" : "AED");
    setEditAgentName(inv.agent_name || "");
    setEditAgentCode(inv.agent_code || "");
    setEditDeveloperName(inv.developer_name || "");
    setEditProjectName(inv.project_name || "");
    setEditProjectLocation(inv.project_location || "");
    setEditUnitNumber(inv.unit_number || "");
    setEditBuyerName(inv.buyer_name || "");
    setEditProjectValue(inv.project_value ? String(inv.project_value) : "");
    setEditCommissionReceived(inv.commission_received ? String(inv.commission_received) : "");
    setEditCommissionRate(inv.commission_rate ? String(inv.commission_rate) : "");
    setEditNetAmount(String(inv.net_amount || ""));
    setEditIncludeVat(Number(inv.vat_rate || 0) > 0);
    setEditVatRate(String(inv.vat_rate || "5"));
    setEditDeductibles(
      parsedDeductibles.map((d: any) => ({
        id: Math.random().toString(),
        label: d.label || "",
        amount: String(d.amount || ""),
      }))
    );
    setEditRemarks(inv.remarks || "");
    setEditParticularTitle(inv.particular_title || "");

    const dbStatusText = inv.commission_status || "NONE";
    if (dbStatusText === "NONE" || dbStatusText === "Full Commission" || dbStatusText === "Partial Commission") {
      setEditCommissionStatus(dbStatusText);
      setEditCustomCommissionStatus("");
    } else {
      setEditCommissionStatus("CUSTOM");
      setEditCustomCommissionStatus(dbStatusText);
    }
  };

  // Save Edited Invoice Data
  const handleSaveInvoiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setSavingEdit(true);
    try {
      let net = Number(editNetAmount);
      if ((!net || net === 0) && Number(editCommissionReceived) > 0 && Number(editCommissionRate) > 0) {
        net = (Number(editCommissionReceived) * Number(editCommissionRate)) / 100;
      } else if ((!net || net === 0) && Number(editProjectValue) > 0 && Number(editCommissionRate) > 0) {
        net = (Number(editProjectValue) * Number(editCommissionRate)) / 100;
      }

      const activeVatRate = editIncludeVat ? Number(editVatRate || 5) : 0;
      const formattedDeductibles = editDeductibles
        .filter((d) => d.label.trim() && Number(d.amount) > 0)
        .map((d) => ({ label: d.label.trim(), amount: Number(d.amount) }));

      const activeStatusText = editCommissionStatus === "CUSTOM" ? editCustomCommissionStatus : editCommissionStatus;

      const payload = {
        id: editingInvoice.id,
        invoice_number: editInvoiceNumber.trim() || editingInvoice.invoice_number,
        invoice_type: editInvoiceType,
        currency: editCurrency,
        particular_title: editParticularTitle,
        commission_status: activeStatusText,
        agent_name: editAgentName,
        agent_code: editAgentCode,
        developer_name: editDeveloperName,
        project_name: editProjectName,
        project_location: editProjectLocation,
        unit_number: editUnitNumber,
        buyer_name: editBuyerName,
        project_value: editProjectValue ? Number(editProjectValue) : null,
        commission_received: editCommissionReceived ? Number(editCommissionReceived) : null,
        commission_rate: editCommissionRate ? Number(editCommissionRate) : null,
        net_amount: net,
        vat_rate: activeVatRate,
        include_vat: editIncludeVat,
        deductibles: formattedDeductibles,
        remarks: editRemarks,
        issued_date: editIssuedDate,
      };

      const res = await fetch("/api/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save invoice edits");

      setSuccessMsg(`Invoice #${editingInvoice.invoice_number} updated successfully! Click 'View / Regenerate' to render the updated Canvas.`);
      setEditingInvoice(null);
      fetchInvoiceHistory();
    } catch (err: any) {
      alert(`Save Edit Error: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Regenerate Canvas Preview from Database History Record
  const handleRegenerateFromHistory = (inv: any) => {
    let snap: any = null;
    try {
      snap = inv.profile_snapshot ? (typeof inv.profile_snapshot === "string" ? JSON.parse(inv.profile_snapshot) : inv.profile_snapshot) : null;
    } catch (e) {
      snap = null;
    }

    let parsedDeductibles: DeductibleItem[] = [];
    try {
      parsedDeductibles = inv.deductibles ? (typeof inv.deductibles === "string" ? JSON.parse(inv.deductibles) : inv.deductibles) : [];
    } catch (e) {
      parsedDeductibles = [];
    }

    const prof = snap?.profile || adminProfile;
    const addr = snap?.address || adminProfile?.address;
    const logoUrl = adminProfile?.default_logo_url || prof?.default_logo_url;

    const net = Number(inv.net_amount);
    const vat = Number(inv.vat_amount);
    const gross = Number(inv.gross_amount);

    const invType = inv.invoice_type || "TAX_INVOICE";
    const typeConfig = dbInvoiceTypes.find((t) => t.code === invType);

    const canvasData: InvoiceCanvasData = {
      invoiceNumber: inv.invoice_number,
      invoiceType: invType,
      invoiceTitle: typeConfig?.invoice_title,
      invoiceTypeConfig: typeConfig,
      templateStyle: inv.template_style || "modern_slate",
      currency: inv.currency || "AED",
      particularTitle: inv.particular_title || undefined,
      commissionStatus: inv.commission_status && inv.commission_status !== "NONE" ? inv.commission_status : undefined,
      issuedDate: inv.issued_date
        ? (typeof inv.issued_date === "string" ? inv.issued_date.slice(0, 10) : new Date(inv.issued_date).toISOString().slice(0, 10))
        : new Date().toISOString().slice(0, 10),
      agentName: inv.agent_name,
      agentCode: inv.agent_code || undefined,
      agentEmail: inv.agent_email || undefined,
      teamName: inv.team_name || undefined,
      subteamName: inv.subteam_name || undefined,
      developerName: inv.developer_name || undefined,
      projectName: inv.project_name || undefined,
      projectLocation: inv.project_location || undefined,
      unitNumber: inv.unit_number || undefined,
      buyerName: inv.buyer_name || undefined,
      projectValue: inv.project_value ? Number(inv.project_value) : undefined,
      commissionReceived: inv.commission_received ? Number(inv.commission_received) : undefined,
      commissionRate: inv.commission_rate ? Number(inv.commission_rate) : undefined,
      netAmount: net,
      vatRate: Number(inv.vat_rate || 0),
      vatAmount: vat,
      grossAmount: gross,
      deductibles: parsedDeductibles,
      companyName: prof?.company_name || "FHI Global",
      trnNumber: prof?.trn_number || undefined,
      logoUrl: logoUrl || undefined,
      addressLine1: addr ? [addr.building_name, addr.street_address].filter(Boolean).join(", ") : "Opus Tower by Omniyat, Marasi Drive, Business Bay",
      cityCountry: addr ? [addr.city, addr.country].filter(Boolean).join(", ") : "Dubai, United Arab Emirates",
      bankName: prof?.bank_name || "Emirates NBD",
      accountName: prof?.account_name || prof?.company_name || "Leuterio Realty LLC",
      iban: prof?.iban || "AE480260000001234567890",
      swiftCode: prof?.swift_code || "EBILAEAD",
      remarks: inv.remarks || undefined,
    };

    setActiveCanvasInvoice(canvasData);
    setSuccessMsg(`Loaded stored invoice #${inv.invoice_number} on Canvas!`);

    setTimeout(() => {
      const el = document.getElementById("canvas-preview-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Delete Invoice Record
  const handleDeleteInvoice = async (id: number, num: string) => {
    if (!confirm(`Are you sure you want to remove Invoice #${num} from history?`)) return;
    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMsg(`Invoice #${num} removed from database.`);
        fetchInvoiceHistory();
      }
    } catch (err) {
      alert("Failed to delete invoice record.");
    }
  };

  const getInvoiceTypeDefaultTitle = (type: InvoiceType) => {
    const match = dbInvoiceTypes.find((t) => t.code === type);
    if (match?.description) return match.description;

    switch (type) {
      case "TAX_INVOICE":
        return "Real Estate Sales Commission Service Fee";
      case "AGENT_PAYOUT":
        return "Brokerage Agent Commission Split Payout";
      case "PARTIAL_TRANCHE":
        return "Commission Tranche Milestone Release";
      case "PROFORMA":
        return "Proforma Estimated Sales Commission Fee";
      default:
        return "Real Estate Sales Commission Service Fee";
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
                <span>← Kiosk Hub</span>
              </button>
            )}
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices/cash-advances"
              className="px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-600 hover:text-amber-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Cash Advances</span>
            </Link>

            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 font-extrabold text-[10px] text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FilePlus className="w-3.5 h-3.5 text-slate-500" />
              Commissions Hub
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        {/* ========================================================= */}
        {/* VIEW MODE 1: KIOSK MAIN MENU TILES */}
        {/* ========================================================= */}
        {viewMode === "MENU" && (
          <div className="space-y-8 py-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-600 rounded-l-3xl" />
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Commission Invoices Portal
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Select an action below to issue new agent commission invoices, inspect database ledgers, or upload bulk batch CSV entries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              {/* Kiosk Tile 1: Issue Commission Invoice */}
              <button
                onClick={() => setViewMode("ISSUE")}
                className="group bg-white border-2 border-slate-200 hover:border-red-500 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <IssueCommissionKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  Issue Invoice
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Issue agent commission invoice with split calculations, deductibles & VAT.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-red-200 bg-red-50 text-red-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Issue New →
                </div>
              </button>

              {/* Kiosk Tile 2: Invoice History Ledger */}
              <button
                onClick={() => {
                  setViewMode("HISTORY");
                  fetchInvoiceHistory();
                }}
                className="group bg-white border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <TrackerKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  Invoice History
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Search, view PDF invoices, inspect database records & track payouts.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-blue-200 bg-blue-50 text-blue-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Open Ledger →
                </div>
              </button>

              {/* Kiosk Tile 3: Bulk Batch Uploader */}
              <button
                onClick={() => setViewMode("BATCH")}
                className="group bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <BulkBatchKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  Bulk Batch Upload
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Batch upload spreadsheet commission invoice entries via CSV.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Batch Upload →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: ISSUE NEW INVOICE (MEMBER ROSTER LIST) */}
        {/* ========================================================= */}
        {viewMode === "ISSUE" && (
          <div className="space-y-6">
            {/* Search Filters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_6px_0_0_#E2E8F0] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Search & Filter Agent Roster
                </span>
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by First Name..."
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by Last Name..."
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by Email..."
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Agent Roster Data Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Select Agent / Member to Issue Invoice
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  Total: {pagination.total} agents
                </span>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                      <th className="py-3 px-4">Member / Agent</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Sales Team / Unit</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                          <span>Loading agent roster...</span>
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No matching agents found.
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m.member_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-900">{m.completename}</td>
                          <td className="py-4 px-4 font-mono text-slate-600">{m.member_code}</td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-800">{m.teamname}</span>
                            {m.subteam_name && (
                              <span className="block text-[11px] text-slate-500 font-mono">
                                {m.subteam_name}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            <div>{m.email || "N/A"}</div>
                            {m.mobile && <span className="text-[10px] text-slate-400 font-mono">{m.mobile}</span>}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {m.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleOpenIssueModal(m)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              <FilePlus className="w-3.5 h-3.5" />
                              <span>Issue Invoice</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  Showing <span className="font-semibold text-slate-800">{page}</span> of{" "}
                  <span className="font-semibold text-slate-800">{pagination.totalPages || 1}</span> pages ({pagination.total} agents found)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages || loading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INVOICE TRACKER & SAVED DATABASE HISTORY */}
        {/* ========================================================= */}
        {viewMode === "HISTORY" && (
          <div className="space-y-6">
            {/* Summary KPI Overview Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Saved Invoices
                </span>
                <span className="text-2xl font-black text-slate-900 block">{historyKpis.total_count}</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Stored in DB
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Comm. Received
                </span>
                <span className="text-2xl font-black text-blue-600 font-mono block">
                  {Number(historyKpis.total_commission_received || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">Gross Commission Received</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Net Commission Volume
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono block">
                  {Number(historyKpis.total_net).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Subtotal before VAT</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total VAT Collected
                </span>
                <span className="text-2xl font-black text-red-600 font-mono block">
                  {Number(historyKpis.total_vat).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Tax Compliance</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Gross Invoice Volume
                </span>
                <span className="text-2xl font-black text-emerald-600 font-mono block">
                  {Number(historyKpis.total_gross).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Total Payable Amount</span>
              </div>
            </div>

            {/* Tracker Search & Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_6px_0_0_#E2E8F0] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Search & Filter Saved Invoice Records
                </span>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const query = new URLSearchParams({
                          search: historySearch,
                          type: historyType,
                          status: historyStatus,
                          year: historyYear,
                          page: "1",
                          limit: "1000",
                        });
                        const res = await fetch(`/api/invoices?${query.toString()}`);
                        const data = await res.json();
                        if (!res.ok || !data.invoices) {
                          alert("Failed to fetch invoices for export");
                          return;
                        }

                        const rows: any[] = data.invoices;
                        const kpis = data.kpis || {};
                        const generatedAt = new Date().toLocaleString();

                        let csv = "";
                        csv += `"COMMISSION INVOICES & FINANCIAL AUDIT REPORT"\n`;
                        csv += `"Generated At:","${generatedAt}"\n`;
                        csv += `"Filters Applied:","Search: ${historySearch || 'All'} | Type: ${historyType || 'All'} | Status: ${historyStatus || 'All'} | Year: ${historyYear || 'All'}"\n\n`;

                        csv += `"FINANCIAL SUMMARY KPIS"\n`;
                        csv += `"Total Invoices","${kpis.total_count || rows.length}"\n`;
                        csv += `"Total Comm Received (AED)","${Number(kpis.total_commission_received || 0).toFixed(2)}"\n`;
                        csv += `"Total Net Amount (AED)","${Number(kpis.total_net || 0).toFixed(2)}"\n`;
                        csv += `"Total VAT (5%) (AED)","${Number(kpis.total_vat || 0).toFixed(2)}"\n`;
                        csv += `"Total Gross Total (AED)","${Number(kpis.total_gross || 0).toFixed(2)}"\n\n`;

                        csv += `"Invoice Number","Issued Date","Type","Agent Code","Agent Name","Developer Name","Project Name","Project Location","Unit Number","Buyer Name","Commission Received (AED)","Agent Split (%)","Net Amount (AED)","VAT Amount (AED)","Gross Amount (AED)","Currency","Lock Status","Remarks"\n`;

                        let sumNet = 0;
                        let sumVat = 0;
                        let sumGross = 0;
                        let sumCommRec = 0;

                        rows.forEach((inv) => {
                          const net = Number(inv.net_amount || 0);
                          const vat = Number(inv.vat_amount || 0);
                          const gross = Number(inv.gross_amount || 0);
                          const commRec = Number(inv.commission_received || 0);

                          sumNet += net;
                          sumVat += vat;
                          sumGross += gross;
                          sumCommRec += commRec;

                          const dateStr = inv.issued_date ? new Date(inv.issued_date).toISOString().slice(0, 10) : "";
                          const cleanRemarks = (inv.remarks || "").replace(/"/g, '""').replace(/\n/g, ' ');

                          csv += `"${inv.invoice_number}","${dateStr}","${inv.invoice_type || ''}","${inv.agent_code || ''}","${inv.agent_name || ''}","${inv.developer_name || ''}","${inv.project_name || ''}","${inv.project_location || ''}","${inv.unit_number || ''}","${inv.buyer_name || ''}","${commRec.toFixed(2)}","${inv.commission_rate || ''}","${net.toFixed(2)}","${vat.toFixed(2)}","${gross.toFixed(2)}","${inv.currency || 'AED'}","${inv.is_locked ? 'Locked' : 'Unlocked'}","${cleanRemarks}"\n`;
                        });

                        csv += `"TOTALS","","","","","","","","","","${sumCommRec.toFixed(2)}","","${sumNet.toFixed(2)}","${sumVat.toFixed(2)}","${sumGross.toFixed(2)}","","",""\n`;

                        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        const filename = `Commission_Invoices_Report_${historyYear || 'All'}_${new Date().toISOString().slice(0, 10)}.csv`;
                        link.setAttribute("download", filename);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (err: any) {
                        alert("Error exporting CSV: " + err.message);
                      }
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV Report</span>
                  </button>

                  <button
                    onClick={() => {
                      setHistorySearch("");
                      setHistoryType("");
                      setHistoryStatus("");
                      setHistoryYear("");
                      setHistoryPage(1);
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Invoice #, Agent, Developer, Buyer, Project..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <select
                    value={historyType}
                    onChange={(e) => {
                      setHistoryType(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="">All Invoice Types</option>
                    {dbInvoiceTypes.length > 0 ? (
                      dbInvoiceTypes.map((t) => (
                        <option key={t.id} value={t.code}>
                          {t.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="TAX_INVOICE">Tax Invoice</option>
                        <option value="AGENT_PAYOUT">Agent Payout Statement</option>
                        <option value="PARTIAL_TRANCHE">Partial Tranche</option>
                        <option value="PROFORMA">Proforma Invoice</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="relative">
                  <CheckCircle2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <select
                    value={historyStatus}
                    onChange={(e) => {
                      setHistoryStatus(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="ISSUED">Issued</option>
                    <option value="PAID">Paid</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <select
                    value={historyYear}
                    onChange={(e) => {
                      setHistoryYear(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="">All Issued Years</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Saved Invoices History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-red-600" />
                  Saved Invoice Database Records
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {historyPagination.total} records found
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                      <th className="py-3 px-4">Invoice # & Date</th>
                      <th className="py-3 px-4">Agent Name / Code</th>
                      <th className="py-3 px-4">Developer & Project</th>
                      <th className="py-3 px-4 text-right">Comm. Received</th>
                      <th className="py-3 px-4 text-right">Agent Split (%)</th>
                      <th className="py-3 px-4 text-right">Net</th>
                      <th className="py-3 px-4 text-right">Gross Total</th>
                      <th className="py-3 px-4 text-center">Lock Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {historyLoading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                          <span>Loading invoice history...</span>
                        </td>
                      </tr>
                    ) : historyInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          No saved invoices found in database.
                        </td>
                      </tr>
                    ) : (
                      historyInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-slate-900">
                                {inv.invoice_number}
                              </span>
                              {Number(inv.attachment_count) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenViewAttachmentsModal(inv)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold hover:bg-purple-200 transition-colors cursor-pointer"
                                  title="View document attachments"
                                >
                                  <Paperclip className="w-3 h-3 text-purple-600" />
                                  <span>{inv.attachment_count}</span>
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {inv.issued_date ? new Date(inv.issued_date).toISOString().slice(0, 10) : "N/A"} • {inv.invoice_type}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800">
                            <div>{inv.agent_name}</div>
                            {inv.agent_code && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Code: {inv.agent_code}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-slate-800 block">
                              {inv.developer_name || "N/A"}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {inv.project_name ? `${inv.project_name} (${inv.buyer_name ? `Buyer: ${inv.buyer_name}` : inv.unit_number || 'Unit'})` : 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-slate-700">
                            {inv.commission_received ? `${inv.currency || "AED"} ${Number(inv.commission_received).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-semibold text-slate-700">
                            {inv.commission_rate ? `${Number(inv.commission_rate)}%` : "-"}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-semibold text-slate-700">
                            {inv.currency || "AED"} {Number(inv.net_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                            {inv.currency || "AED"} {Number(inv.gross_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>

                          {/* LOCK / UNLOCK TOGGLE ACTION BUTTON */}
                          <td className="py-4 px-4 text-center">
                            {inv.is_locked ? (
                              <button
                                type="button"
                                onClick={() => handleToggleLock(inv.id, false)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Invoice is Locked. Click to Unlock for Editing"
                              >
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>Locked</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleLock(inv.id, true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Invoice is Unlocked. Click to Lock"
                              >
                                <Unlock className="w-3 h-3 text-emerald-600" />
                                <span>Unlocked</span>
                              </button>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* VIEW ATTACHMENTS SHORTCUT BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleOpenViewAttachmentsModal(inv)}
                                className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                title="View & Manage S3 Document Attachments"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                                <span>Files ({inv.attachment_count || 0})</span>
                              </button>

                              {/* EDIT ACTION BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(inv)}
                                disabled={Boolean(inv.is_locked)}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 ${
                                  inv.is_locked
                                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50"
                                    : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
                                }`}
                                title={inv.is_locked ? "Invoice is Locked. Unlock to Edit." : "Edit Invoice Details"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {/* VIEW / REGENERATE CANVAS BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleRegenerateFromHistory(inv)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                title="View & Regenerate on Canvas"
                              >
                                <Eye className="w-3.5 h-3.5 text-red-500" />
                                <span>View / Regenerate</span>
                              </button>

                              {/* DELETE BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(inv.id, inv.invoice_number)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* History Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  Page <span className="font-semibold text-slate-800">{historyPage}</span> of{" "}
                  <span className="font-semibold text-slate-800">{historyPagination.totalPages || 1}</span> ({historyPagination.total} saved invoices)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage <= 1 || historyLoading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(historyPagination.totalPages, p + 1))}
                    disabled={historyPage >= historyPagination.totalPages || historyLoading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BULK CSV BATCH UPLOADER & GENERATOR */}
        {/* ========================================================= */}
        {viewMode === "BATCH" && (
          <div className="space-y-6">
            {/* Header Info & Template Download */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Bulk Multi-Invoice Batch Generation
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Upload CSV Spreadsheet to Batch Create Invoices
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl">
                  Upload a structured CSV spreadsheet containing multiple deal records. All generated invoices will automatically be created in the database and saved directly in the <strong>Invoice Tracker & Database History</strong>.
                </p>
              </div>

              <a
                href="/commission_invoices_batch_template.csv"
                download="commission_invoices_batch_template.csv"
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Sample CSV Template</span>
              </a>
            </div>

            {/* Drop Zone */}
            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-colors text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                <FileUp className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Select or Drag & Drop your Commission CSV File
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Supported format: .csv (Columns: agent_name, agent_code, invoice_type, project_name, unit_number, net_amount, etc.)
                </p>
              </div>

              <input
                type="file"
                accept=".csv"
                id="csv-batch-input"
                onChange={handleCsvFileChange}
                className="hidden"
              />

              <div className="flex items-center justify-center gap-3">
                <label
                  htmlFor="csv-batch-input"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose CSV File</span>
                </label>

                {csvFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setCsvFile(null);
                      setCsvParsedRows([]);
                      setCsvBatchErrors([]);
                    }}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-700 rounded-xl cursor-pointer"
                  >
                    Clear File
                  </button>
                )}
              </div>

              {csvFile && (
                <div className="text-xs text-slate-700 font-mono font-bold bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                  Selected File: {csvFile.name} ({csvParsedRows.length} rows parsed)
                </div>
              )}
            </div>

            {/* Error Notifications */}
            {csvBatchErrors.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 text-xs text-amber-900">
                <span className="font-bold flex items-center gap-1 text-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  Processing Warnings / Errors:
                </span>
                <ul className="list-disc pl-5 space-y-0.5 font-mono text-[11px]">
                  {csvBatchErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Parsed Rows Live Preview Table */}
            {csvParsedRows.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      CSV Batch Live Preview ({csvParsedRows.length} rows)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Review parsed spreadsheet rows before creating invoices in the database.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessBatchInvoices}
                    disabled={csvUploading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {csvUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Invoices...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate All {csvParsedRows.length} Invoices</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Agent Name</th>
                        <th className="py-3 px-4">Agent Code</th>
                        <th className="py-3 px-4">Invoice Type</th>
                        <th className="py-3 px-4">Invoice Date</th>
                        <th className="py-3 px-4">Project & Unit</th>
                        <th className="py-3 px-4 text-right">Net Amount</th>
                        <th className="py-3 px-4 text-center">VAT</th>
                        <th className="py-3 px-4 text-center">Currency</th>
                        <th className="py-3 px-4 text-center">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {csvParsedRows.map((r, idx) => {
                        const isValid = Boolean(r.agent_name && r.agent_name.trim());
                        const rowDate = r.issued_date || r.issueddate || r.invoice_date || r.date || "Today";
                        return (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{r.agent_name || "MISSING"}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{r.agent_code || "-"}</td>
                            <td className="py-3 px-4 font-semibold text-slate-700">{r.invoice_type || "TAX_INVOICE"}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{rowDate}</td>
                            <td className="py-3 px-4 text-slate-700">
                              <div>{r.project_name || "-"}</div>
                              {r.unit_number && <span className="text-[10px] text-slate-400 font-mono">{r.unit_number}</span>}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              {Number(r.net_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">{r.vat_rate || "5"}%</td>
                            <td className="py-3 px-4 text-center font-bold">{r.currency || "AED"}</td>
                            <td className="py-3 px-4 text-center">
                              {isValid ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                  Valid Row
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
                                  Missing Name
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas Rendered Bondpaper Preview Card (If Generated or Loaded) */}
        {activeCanvasInvoice && (
          <div id="canvas-preview-section" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                  Generated Bondpaper Canvas Invoice
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Invoice #{activeCanvasInvoice.invoiceNumber}
                </h2>
              </div>
            </div>

            <InvoiceCanvasPreview
              data={activeCanvasInvoice}
              onTemplateChange={(newStyle) => {
                setActiveCanvasInvoice({
                  ...activeCanvasInvoice,
                  templateStyle: newStyle,
                });
              }}
            />
          </div>
        )}
      </main>

      {/* DASHBOARD KIOSK INVOICE ISSUANCE MODAL */}
      {selectedMemberForInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedMemberForInvoice(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                <FilePlus className="w-3.5 h-3.5" />
                Dubai Commission Invoice Generator
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Issue Invoice for {selectedMemberForInvoice.completename}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Code: {selectedMemberForInvoice.member_code} • Team: {selectedMemberForInvoice.teamname}
              </p>
            </div>

            {/* CURRENCY TOGGLE SELECTION */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Invoice Currency
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency("AED")}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    currency === "AED"
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  AED (United Arab Emirates Dirham)
                </button>

                <button
                  type="button"
                  onClick={() => setCurrency("PHP")}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    currency === "PHP"
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  PHP (Philippine Peso ₱)
                </button>
              </div>
            </div>

            {/* KIOSK INVOICE TYPE SELECTION */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Select Invoice Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dbInvoiceTypes.length > 0 ? (
                  dbInvoiceTypes
                    .filter((t) => t.status === "active")
                    .map((t) => {
                      const isSelected = selectedInvoiceType === t.code;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceType(t.code);
                            if (!particularTitle) setParticularTitle(t.description || "");
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                            isSelected
                              ? "bg-red-600 text-white border-red-600 shadow-[0_3px_0_0_#991B1B]"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          <Receipt className="w-5 h-5" />
                          <div>
                            <span className="font-black text-xs block uppercase">{t.label}</span>
                            <span className="text-[10px] opacity-80 block truncate">
                              {t.invoice_title}
                            </span>
                          </div>
                        </button>
                      );
                    })
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceType("TAX_INVOICE")}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                        selectedInvoiceType === "TAX_INVOICE"
                          ? "bg-red-600 text-white border-red-600 shadow-[0_3px_0_0_#991B1B]"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      <Receipt className="w-5 h-5" />
                      <div>
                        <span className="font-black text-xs block">TAX INVOICE</span>
                        <span className="text-[10px] opacity-80 block">Standard 5% VAT</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceType("AGENT_PAYOUT")}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                        selectedInvoiceType === "AGENT_PAYOUT"
                          ? "bg-red-600 text-white border-red-600 shadow-[0_3px_0_0_#991B1B]"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <div>
                        <span className="font-black text-xs block">AGENT PAYOUT</span>
                        <span className="text-[10px] opacity-80 block">Internal Split</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceType("PARTIAL_TRANCHE")}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                        selectedInvoiceType === "PARTIAL_TRANCHE"
                          ? "bg-red-600 text-white border-red-600 shadow-[0_3px_0_0_#991B1B]"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      <Layers className="w-5 h-5" />
                      <div>
                        <span className="font-black text-xs block">TRANCHE</span>
                        <span className="text-[10px] opacity-80 block">Milestone Release</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceType("PROFORMA")}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                        selectedInvoiceType === "PROFORMA"
                          ? "bg-red-600 text-white border-red-600 shadow-[0_3px_0_0_#991B1B]"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                      <div>
                        <span className="font-black text-xs block">PROFORMA</span>
                        <span className="text-[10px] opacity-80 block">Pre-Billing Draft</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* FORM INPUTS */}
            <form onSubmit={handleGenerateInvoiceSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-red-600" />
                    Invoice Date (Issued Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-red-600" />
                    Custom Invoice # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if left blank"
                    value={customInvoiceNumber}
                    onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Developer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emaar Properties"
                    value={developerName}
                    onChange={(e) => setDeveloperName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dubai Creek Harbour"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* Project Location */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    Project Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown Dubai, UAE"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* Buyer Name */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-red-600" />
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Unit Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 1402 - Tower B"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* OPTIONAL DEAL VALUE */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 text-[11px] text-slate-500">
                    Project Deal Value ({currency}) (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1500000.00"
                    value={projectValue}
                    onChange={(e) => {
                      setProjectValue(e.target.value);
                      handleCalcProjectCommission(e.target.value, commissionReceived, commissionRate);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* COMMISSION RECEIVED */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-red-600" />
                    Commission Received ({currency}) (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 100000.00"
                    value={commissionReceived}
                    onChange={(e) => {
                      setCommissionReceived(e.target.value);
                      handleCalcProjectCommission(projectValue, e.target.value, commissionRate);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* COMMISSION RATE / AGENT SPLIT % */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">
                    Commission Rate / Agent Split (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50"
                    value={commissionRate}
                    onChange={(e) => {
                      setCommissionRate(e.target.value);
                      handleCalcProjectCommission(projectValue, commissionReceived, e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* NET COMMISSION INPUT */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold uppercase text-slate-700">Net Commission ({currency})</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={netAmount}
                    onChange={(e) => setNetAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-base rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                  {commissionReceived && commissionRate && netAmount && (
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      ✓ Auto-Calculated: {commissionRate}% split of {currency} {Number(commissionReceived).toLocaleString()} commission received = {currency} {Number(netAmount).toLocaleString()}
                    </p>
                  )}
                  {!commissionReceived && projectValue && commissionRate && netAmount && (
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      ✓ Auto-Calculated: {commissionRate}% of {currency} {Number(projectValue).toLocaleString()} deal value = {currency} {Number(netAmount).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* EDITABLE SERVICE PARTICULAR TITLE */}
              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">
                  Service Description Particular Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${getInvoiceTypeDefaultTitle(selectedInvoiceType)}`}
                  value={particularTitle}
                  onChange={(e) => setParticularTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* COMMISSION STATUS SELECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">
                    Commission Status Label
                  </label>
                  <select
                    value={commissionStatus}
                    onChange={(e) => setCommissionStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="NONE">None / Do Not Display</option>
                    <option value="Full Commission">Full Commission</option>
                    <option value="Partial Commission">Partial Commission</option>
                    <option value="CUSTOM">Custom Status...</option>
                  </select>
                </div>

                {commissionStatus === "CUSTOM" && (
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-700">
                      Custom Status Text
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. First Tranche Commission"
                      value={customCommissionStatus}
                      onChange={(e) => setCustomCommissionStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                    />
                  </div>
                )}
              </div>

              {/* OPTIONAL VAT TOGGLE & RATE */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeVat}
                      onChange={(e) => setIncludeVat(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded-md focus:ring-red-500 cursor-pointer"
                    />
                    <span>Charge VAT on Invoice</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {includeVat ? `Applying ${vatRate}% VAT` : "No VAT applied (0%)"}
                  </span>
                </div>

                {includeVat && (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-[11px] font-bold text-slate-600">VAT Percentage (%):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                      className="w-28 bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-600"
                    />
                  </div>
                )}
              </div>

              {/* DYNAMIC CUSTOM DEDUCTIBLES */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-red-600" />
                    Custom Deductibles / Fee Adjustments
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDeductible}
                    className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Deductible</span>
                  </button>
                </div>

                {deductibles.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No deductibles added. Click "+ Add Deductible" to add fees like Admin Fee, Marketing, etc.</p>
                ) : (
                  <div className="space-y-2">
                    {deductibles.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Administrative Fee"
                          value={item.label}
                          onChange={(e) => handleUpdateDeductible(item.id, "label", e.target.value)}
                          className="flex-1 bg-white border border-slate-300 text-slate-900 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-600"
                        />
                        <div className="relative w-36">
                          <span className="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">{currency}</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={(e) => handleUpdateDeductible(item.id, "amount", e.target.value)}
                            className="w-full bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs rounded-xl pl-10 pr-2 py-1.5 focus:outline-none focus:border-red-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeductible(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FILE ATTACHMENTS & DOCUMENTS (STORED ON S3) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-red-600" />
                    Document Attachments (Stored on S3 under commissions_hub/)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {pendingAttachments.length} Pending Attachment(s)
                  </span>
                </div>

                {/* Upload File Input controls */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="sm:col-span-5">
                    <select
                      value={pendingCatId}
                      onChange={(e) => setPendingCatId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium rounded-xl px-2.5 py-2 focus:outline-none focus:border-red-600"
                    >
                      <option value="">Select Document Category...</option>
                      {salesFileCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} {cat.is_required ? "(Required)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <input
                      type="file"
                      id="pending-attachment-file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPendingFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={!pendingCatId || !pendingFile}
                      onClick={() => {
                        if (!pendingCatId || !pendingFile) return;
                        const cat = salesFileCategories.find((c) => String(c.id) === String(pendingCatId));
                        if (!cat) return;
                        setPendingAttachments([
                          ...pendingAttachments,
                          {
                            id: Date.now().toString(),
                            file: pendingFile,
                            categoryId: cat.id,
                            categoryCode: cat.code || "GENERAL",
                            categoryName: cat.name,
                          },
                        ]);
                        setPendingFile(null);
                        setPendingCatId("");
                        const fileInput = document.getElementById("pending-attachment-file") as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                      className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Attach
                    </button>
                  </div>
                </div>

                {/* Pending attachments list */}
                {pendingAttachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {pendingAttachments.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[10px] font-bold">
                            {item.categoryName}
                          </span>
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">
                            {item.file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({(item.file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPendingAttachments(pendingAttachments.filter((p) => p.id !== item.id))}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForInvoice(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={issuing}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {issuing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving & Rendering Invoice...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate & Save Canvas Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INVOICE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingInvoice(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                <Edit3 className="w-3.5 h-3.5" />
                Edit Invoice Record
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Edit Invoice #{editingInvoice.invoice_number}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Agent: {editingInvoice.agent_name} • Issued Date: {editingInvoice.issued_date ? new Date(editingInvoice.issued_date).toISOString().slice(0, 10) : 'N/A'}
              </p>
            </div>

            {/* EDIT CURRENCY TOGGLE SELECTION */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Invoice Currency
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditCurrency("AED")}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    editCurrency === "AED"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  AED (United Arab Emirates Dirham)
                </button>

                <button
                  type="button"
                  onClick={() => setEditCurrency("PHP")}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    editCurrency === "PHP"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  PHP (Philippine Peso ₱)
                </button>
              </div>
            </div>

            {/* EDIT INVOICE TYPE SELECTION */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Invoice Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dbInvoiceTypes.length > 0 ? (
                  dbInvoiceTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditInvoiceType(t.code)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        editInvoiceType === t.code
                          ? "bg-blue-600 text-white border-blue-600 font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-bold text-xs block uppercase truncate">{t.label}</span>
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditInvoiceType("TAX_INVOICE")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        editInvoiceType === "TAX_INVOICE"
                          ? "bg-blue-600 text-white border-blue-600 font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-bold text-xs block">TAX INVOICE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditInvoiceType("AGENT_PAYOUT")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        editInvoiceType === "AGENT_PAYOUT"
                          ? "bg-blue-600 text-white border-blue-600 font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-bold text-xs block">AGENT PAYOUT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditInvoiceType("PARTIAL_TRANCHE")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        editInvoiceType === "PARTIAL_TRANCHE"
                          ? "bg-blue-600 text-white border-blue-600 font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-bold text-xs block">TRANCHE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditInvoiceType("PROFORMA")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        editInvoiceType === "PROFORMA"
                          ? "bg-blue-600 text-white border-blue-600 font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-bold text-xs block">PROFORMA</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* EDIT FORM INPUTS */}
            <form onSubmit={handleSaveInvoiceEdit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    Invoice # / Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Invoice Date (Issued Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={editIssuedDate}
                    onChange={(e) => setEditIssuedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={editAgentName}
                    onChange={(e) => setEditAgentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Agent Code</label>
                  <input
                    type="text"
                    value={editAgentCode}
                    onChange={(e) => setEditAgentCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Developer Name</label>
                  <input
                    type="text"
                    value={editDeveloperName}
                    onChange={(e) => setEditDeveloperName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Project Name</label>
                  <input
                    type="text"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* EDIT Project Location */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Project Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown Dubai, UAE"
                    value={editProjectLocation}
                    onChange={(e) => setEditProjectLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* EDIT Buyer Name */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={editBuyerName}
                    onChange={(e) => setEditBuyerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Unit Number</label>
                  <input
                    type="text"
                    value={editUnitNumber}
                    onChange={(e) => setEditUnitNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* EDIT Deal Value */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 text-[11px] text-slate-500">
                    Project Deal Value ({editCurrency}) (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProjectValue}
                    onChange={(e) => {
                      setEditProjectValue(e.target.value);
                      handleEditCalcProjectCommission(e.target.value, editCommissionReceived, editCommissionRate);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* EDIT Commission Received */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-blue-600" />
                    Commission Received ({editCurrency}) (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 100000.00"
                    value={editCommissionReceived}
                    onChange={(e) => {
                      setEditCommissionReceived(e.target.value);
                      handleEditCalcProjectCommission(editProjectValue, e.target.value, editCommissionRate);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* EDIT Commission Rate */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">
                    Commission Rate / Agent Split (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editCommissionRate}
                    onChange={(e) => {
                      setEditCommissionRate(e.target.value);
                      handleEditCalcProjectCommission(editProjectValue, editCommissionReceived, e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold uppercase text-slate-700">Net Commission ({editCurrency})</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editNetAmount}
                    onChange={(e) => setEditNetAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-base rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* EDITABLE SERVICE PARTICULAR TITLE */}
              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">
                  Service Description Particular Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${getInvoiceTypeDefaultTitle(editInvoiceType)}`}
                  value={editParticularTitle}
                  onChange={(e) => setEditParticularTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* EDIT COMMISSION STATUS SELECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">
                    Commission Status Label
                  </label>
                  <select
                    value={editCommissionStatus}
                    onChange={(e) => setEditCommissionStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="NONE">None / Do Not Display</option>
                    <option value="Full Commission">Full Commission</option>
                    <option value="Partial Commission">Partial Commission</option>
                    <option value="CUSTOM">Custom Status...</option>
                  </select>
                </div>

                {editCommissionStatus === "CUSTOM" && (
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-700">
                      Custom Status Text
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. First Tranche Commission"
                      value={editCustomCommissionStatus}
                      onChange={(e) => setEditCustomCommissionStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                )}
              </div>

              {/* EDIT OPTIONAL VAT TOGGLE */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIncludeVat}
                      onChange={(e) => setEditIncludeVat(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Charge VAT on Invoice</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {editIncludeVat ? `Applying ${editVatRate}% VAT` : "No VAT applied (0%)"}
                  </span>
                </div>

                {editIncludeVat && (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-[11px] font-bold text-slate-600">VAT Percentage (%):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editVatRate}
                      onChange={(e) => setEditVatRate(e.target.value)}
                      className="w-28 bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                )}
              </div>

              {/* EDIT DYNAMIC CUSTOM DEDUCTIBLES */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    Custom Deductibles / Fee Adjustments
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEditDeductible}
                    className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Deductible</span>
                  </button>
                </div>

                {editDeductibles.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No deductibles added for this invoice.</p>
                ) : (
                  <div className="space-y-2">
                    {editDeductibles.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Administrative Fee"
                          value={item.label}
                          onChange={(e) => handleUpdateEditDeductible(item.id, "label", e.target.value)}
                          className="flex-1 bg-white border border-slate-300 text-slate-900 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-600"
                        />
                        <div className="relative w-36">
                          <span className="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">{editCurrency}</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={(e) => handleUpdateEditDeductible(item.id, "amount", e.target.value)}
                            className="w-full bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs rounded-xl pl-10 pr-2 py-1.5 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditDeductible(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FILE ATTACHMENTS & DOCUMENTS (STORED ON S3) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    Document Attachments (Stored on S3 under commissions_hub/)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {editAttachments.length} Attachment(s)
                  </span>
                </div>

                {/* List of existing attachments */}
                {editAttachments.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No files attached to this invoice yet.</p>
                ) : (
                  <div className="space-y-2">
                    {editAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                            {att.category_name}
                          </span>
                          <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {att.file_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={att.s3_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3 text-blue-600" />
                            <span>View / Download</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteEditAttachment(att.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                            title="Delete Attachment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload new attachment controls */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="sm:col-span-5">
                    <select
                      value={editSelectedFileCatId}
                      onChange={(e) => setEditSelectedFileCatId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium rounded-xl px-2.5 py-2 focus:outline-none focus:border-blue-600"
                    >
                      <option value="">Select Document Category...</option>
                      {salesFileCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <input
                      type="file"
                      id="edit-attachment-file-input"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEditSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={!editSelectedFileCatId || !editSelectedFile || uploadingEditFile}
                      onClick={handleUploadEditAttachment}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {uploadingEditFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Invoice Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: QUICK VIEW & UPLOAD INVOICE ATTACHMENTS             */}
      {/* ========================================================= */}
      {viewAttModalOpen && viewAttInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewAttModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                <Paperclip className="w-3.5 h-3.5" />
                S3 Document Attachments
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Attachments for Invoice #{viewAttInvoice.invoice_number}
              </h2>
              <p className="text-xs text-slate-500">
                {viewAttInvoice.agent_name} • {viewAttInvoice.developer_name || 'N/A'} - {viewAttInvoice.project_name || 'N/A'}
              </p>
            </div>

            {/* List of existing attachments */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Uploaded Files ({viewAttList.length})
              </h3>

              {viewAttLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                  <span className="text-xs font-bold">Loading attachments from AWS S3...</span>
                </div>
              ) : viewAttList.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                  No document attachments uploaded for this invoice yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  {viewAttList.map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{att.file_name}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold uppercase tracking-wider text-[9px]">
                              {att.category_name}
                            </span>
                            <span>{att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : "S3 File"}</span>
                            <span>• {att.uploaded_at ? new Date(att.uploaded_at).toLocaleDateString() : ""}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={att.s3_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-400" />
                          <span>View File</span>
                        </a>

                        {!viewAttInvoice.is_locked && (
                          <button
                            type="button"
                            onClick={() => handleDeleteQuickAttachment(att.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Attachment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Upload Control */}
            {!viewAttInvoice.is_locked && (
              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <h3 className="font-bold uppercase text-slate-700 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-600" />
                  Attach New Document to Invoice
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Select Category
                    </label>
                    <select
                      value={viewAttSelectedCatId}
                      onChange={(e) => setViewAttSelectedCatId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-purple-600"
                    >
                      <option value="">General Document Attachment</option>
                      {salesFileCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} {cat.is_required ? "*" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Choose File
                    </label>
                    <input
                      type="file"
                      id="quick-view-attachment-file"
                      onChange={(e) => setViewAttFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleUploadQuickAttachment}
                    disabled={!viewAttFile || viewAttUploading}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {viewAttUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{viewAttUploading ? "Uploading to S3..." : "Upload Attachment"}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewAttModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
