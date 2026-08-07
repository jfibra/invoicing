"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import CashAdvanceCanvasPreview, { CashAdvanceCanvasData, CashAdvancePaymentRecord } from "@/components/CashAdvanceCanvasPreview";
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Mail,
  User,
  Building2,
  CreditCard,
  History,
  Trash2,
  Plus,
  Coins,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Check,
  AlertCircle,
  Save,
  Download,
  Upload,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DisburseKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#059669" />
    <circle cx="32" cy="32" r="14" fill="#FFFFFF" opacity="0.9" />
    <path d="M32 24V40M24 32H40" stroke="#047857" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const TrackerKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2563EB" />
    <rect x="18" y="20" width="28" height="24" rx="4" fill="#FFFFFF" opacity="0.9" />
    <path d="M24 28H40M24 34H34" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const BulkUploaderKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#7C3AED" />
    <path d="M32 18V38M32 18L24 26M32 18L40 26" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 44H44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

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

export default function CashAdvancesPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Cash Advances Portal..." />}>
      <CashAdvancesContent />
    </Suspense>
  );
}

function CashAdvancesContent() {
  // Mode: MENU (Kiosk Tiles Hub), DISBURSE, TRACKER, BULK
  const [viewMode, setViewMode] = useState<"MENU" | "DISBURSE" | "TRACKER" | "BULK">("MENU");

  // Bulk Uploader State
  const [bulkText, setBulkText] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);

  // Admin Profile Settings State
  const [adminProfile, setAdminProfile] = useState<any>(null);

  // Roster Members State
  const [members, setMembers] = useState<InvoicingMember[]>([]);
  const [memberFirstName, setMemberFirstName] = useState("");
  const [memberLastName, setMemberLastName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [memberPagination, setMemberPagination] = useState({ total: 0, totalPages: 1 });
  const [membersLoading, setMembersLoading] = useState(false);

  // Cash Advance Ledger State
  const [advances, setAdvances] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    total_count: 0,
    total_disbursed: 0,
    total_repaid: 0,
    total_outstanding: 0,
  });
  const [trackerFirstName, setTrackerFirstName] = useState("");
  const [trackerLastName, setTrackerLastName] = useState("");
  const [trackerEmail, setTrackerEmail] = useState("");
  const [trackerStatus, setTrackerStatus] = useState("");
  const [trackerPage, setTrackerPage] = useState(1);
  const [trackerPagination, setTrackerPagination] = useState({ total: 0, totalPages: 1 });
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [expandedCaId, setExpandedCaId] = useState<number | null>(null);

  // Modal State: Create/Disburse Cash Advance
  const [selectedAgentForCA, setSelectedAgentForCA] = useState<InvoicingMember | null>(null);
  const [currency, setCurrency] = useState<"AED" | "PHP">("AED");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [termType, setTermType] = useState<"WEEKS" | "MONTHS">("MONTHS");
  const [termValue, setTermValue] = useState("3");
  const [customTotalRepayment, setCustomTotalRepayment] = useState("");
  const [dueStartDate, setDueStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [caRemarks, setCaRemarks] = useState("");
  const [submittingCA, setSubmittingCA] = useState(false);

  // Modal State: Record Repayment Payment
  const [selectedCAForPayment, setSelectedCAForPayment] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Canvas Preview State
  const [canvasData, setCanvasData] = useState<CashAdvanceCanvasData | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Admin Profile
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
        }
      } catch (err) {
        console.error("Failed to load admin profile:", err);
      }
    }
    loadAdminProfile();
  }, []);

  // Fetch Members
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(memberPage),
        limit: "12",
      });
      if (memberFirstName) query.set("firstName", memberFirstName);
      if (memberLastName) query.set("lastName", memberLastName);
      if (memberEmail) query.set("email", memberEmail);

      const res = await fetch(`/api/users?${query.toString()}`);
      const data = await res.json();
      const list = data.users || data.members || [];
      if (res.ok) {
        setMembers(
          list.map((u: any) => ({
            ...u,
            teamname: u.teamname || u.team || "No Team",
            subteam_name: u.subteam_name || u.subteam || "No Subteam",
          }))
        );
        setMemberPagination(data.pagination || { total: list.length, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMembersLoading(false);
    }
  }, [memberPage, memberFirstName, memberLastName, memberEmail]);

  useEffect(() => {
    if (viewMode === "DISBURSE") fetchMembers();
  }, [viewMode, fetchMembers]);

  // Fetch Cash Advances Ledger
  const fetchCashAdvances = useCallback(async () => {
    setTrackerLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(trackerPage),
        limit: "15",
      });
      if (trackerFirstName) query.set("firstName", trackerFirstName);
      if (trackerLastName) query.set("lastName", trackerLastName);
      if (trackerEmail) query.set("email", trackerEmail);
      if (trackerStatus) query.set("status", trackerStatus);

      const res = await fetch(`/api/cash-advances?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.advances) {
        setAdvances(data.advances);
        setKpis(data.kpis || { total_count: 0, total_disbursed: 0, total_repaid: 0, total_outstanding: 0 });
        setTrackerPagination(data.pagination || { total: data.advances.length, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTrackerLoading(false);
    }
  }, [trackerPage, trackerFirstName, trackerLastName, trackerEmail, trackerStatus]);

  useEffect(() => {
    if (viewMode === "TRACKER") fetchCashAdvances();
  }, [viewMode, fetchCashAdvances]);

  // Submit Disburse CA
  const handleCreateCashAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForCA) return;

    const amt = parseFloat(advanceAmount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid Cash Advance amount.");
      return;
    }

    setSubmittingCA(true);
    try {
      const payload = {
        agent_id: selectedAgentForCA.member_id,
        agent_code: selectedAgentForCA.member_code,
        agent_name: selectedAgentForCA.completename,
        agent_email: selectedAgentForCA.email,
        agent_mobile: selectedAgentForCA.mobile,
        team_id: selectedAgentForCA.team_id,
        team_name: selectedAgentForCA.teamname,
        subteam_id: selectedAgentForCA.subteam_id,
        subteam_name: selectedAgentForCA.subteam_name,
        currency,
        advance_amount: amt,
        repayment_term_type: termType,
        repayment_term_value: parseInt(termValue, 10) || 1,
        custom_total_repayment: customTotalRepayment ? parseFloat(customTotalRepayment) : null,
        due_start_date: dueStartDate,
        remarks: caRemarks,
        profile_snapshot: adminProfile,
      };

      const res = await fetch("/api/cash-advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disburse cash advance");

      const rec = data.cash_advance;
      setCanvasData({
        mode: "DISBURSEMENT",
        cashAdvanceCode: rec.cash_advance_code,
        issuedDate: new Date().toISOString().slice(0, 10),
        agentName: selectedAgentForCA.completename,
        agentCode: selectedAgentForCA.member_code,
        agentEmail: selectedAgentForCA.email ?? undefined,
        teamName: selectedAgentForCA.teamname,
        subteamName: selectedAgentForCA.subteam_name,
        advanceAmount: Number(rec.advance_amount),
        currency: rec.currency,
        repaymentTermType: rec.repayment_term_type,
        repaymentTermValue: Number(rec.repayment_term_value),
        totalRepaymentAmount: Number(rec.total_repayment_amount),
        installmentAmount: Number(rec.installment_amount),
        dueStartDate: rec.due_start_date ? new Date(rec.due_start_date).toISOString().slice(0, 10) : "",
        dueEndDate: rec.due_end_date ? new Date(rec.due_end_date).toISOString().slice(0, 10) : "",
        totalPaidAmount: 0,
        balanceDue: Number(rec.total_repayment_amount),
        status: rec.status,
        remarks: caRemarks,
        companyName: adminProfile?.company_name || "FHI Global",
        trnNumber: adminProfile?.trn_number || undefined,
        logoUrl: adminProfile?.default_logo_url || undefined,
        addressLine1: adminProfile?.address ? [adminProfile.address.building_name, adminProfile.address.street_address].filter(Boolean).join(", ") : "Dubai, UAE",
        cityCountry: adminProfile?.address ? [adminProfile.address.city, adminProfile.address.country].filter(Boolean).join(", ") : "United Arab Emirates",
      });

      setSuccessMsg(`Cash Advance #${rec.cash_advance_code} successfully disbursed to ${selectedAgentForCA.completename}!`);
      setSelectedAgentForCA(null);
      setViewMode("TRACKER");
    } catch (err: any) {
      alert(`Disbursement Error: ${err.message}`);
    } finally {
      setSubmittingCA(false);
    }
  };

  // Submit Repayment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCAForPayment) return;

    const pAmt = parseFloat(paymentAmount);
    if (!pAmt || pAmt <= 0) {
      alert("Please enter a valid repayment payment amount.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const payload = {
        cash_advance_id: selectedCAForPayment.id,
        payment_amount: pAmt,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        remarks: paymentRemarks,
      };

      const res = await fetch("/api/cash-advances/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment");

      setSelectedCAForPayment(null);
      setSuccessMsg(`Repayment Receipt #${data.receipt_number} logged!`);
      fetchCashAdvances();
    } catch (err: any) {
      alert(`Payment Record Error: ${err.message}`);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Regenerate Canvas Document for Cash Advance Disbursement Voucher or Repayment Receipt
  const handleRegenerateCanvas = (ca: any, paymentRec?: any) => {
    let snap: any = null;
    try {
      snap = ca.profile_snapshot ? (typeof ca.profile_snapshot === "string" ? JSON.parse(ca.profile_snapshot) : ca.profile_snapshot) : null;
    } catch (e) {}

    const prof = snap?.profile || adminProfile;
    const addr = snap?.address || adminProfile?.address;
    const logoUrl = adminProfile?.default_logo_url || prof?.default_logo_url;

    setCanvasData({
      mode: paymentRec ? "REPAYMENT_RECEIPT" : "DISBURSEMENT",
      cashAdvanceCode: ca.cash_advance_code,
      issuedDate: ca.created_at ? new Date(ca.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      agentName: ca.agent_name,
      agentCode: ca.agent_code,
      agentEmail: ca.agent_email,
      teamName: ca.team_name,
      subteamName: ca.subteam_name,
      advanceAmount: Number(ca.advance_amount),
      currency: ca.currency || "AED",
      repaymentTermType: ca.repayment_term_type || "MONTHS",
      repaymentTermValue: Number(ca.repayment_term_value || 1),
      totalRepaymentAmount: Number(ca.total_repayment_amount),
      installmentAmount: Number(ca.installment_amount),
      dueStartDate: ca.due_start_date ? new Date(ca.due_start_date).toISOString().slice(0, 10) : "",
      dueEndDate: ca.due_end_date ? new Date(ca.due_end_date).toISOString().slice(0, 10) : "",
      totalPaidAmount: Number(ca.total_paid_amount),
      balanceDue: Number(ca.balance_due),
      status: ca.status,
      remarks: paymentRec?.remarks || ca.remarks,
      companyName: prof?.company_name || "FHI Global",
      trnNumber: prof?.trn_number || undefined,
      logoUrl: logoUrl || undefined,
      addressLine1: addr ? [addr.building_name, addr.street_address].filter(Boolean).join(", ") : "Opus Tower by Omniyat, Marasi Drive, Business Bay",
      cityCountry: addr ? [addr.city, addr.country].filter(Boolean).join(", ") : "Dubai, United Arab Emirates",
      paymentRecord: paymentRec
        ? {
            id: paymentRec.id,
            cash_advance_id: ca.id,
            receipt_number: paymentRec.receipt_number,
            payment_amount: Number(paymentRec.payment_amount),
            payment_date: paymentRec.payment_date ? new Date(paymentRec.payment_date).toISOString().slice(0, 10) : "",
            payment_method: paymentRec.payment_method,
            remarks: paymentRec.remarks,
          }
        : undefined,
    });

    setTimeout(() => {
      const el = document.getElementById("ca-canvas-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
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

  // Submit Bulk Cash Advances Uploader
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
        firstLineLower.includes("agent") ||
        firstLineLower.includes("name") ||
        firstLineLower.includes("advance") ||
        firstLineLower.includes("amount") ||
        firstLineLower.includes("code")
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

        // Columns: Agent Code, Agent Name, Agent Email, Team Name, Subteam Name, Advance Amount, Currency, Term Type, Term Value, Total Repayment, Installment Amount, Start Date, Remarks
        let agCode = parts[0]?.trim() || "";
        let agName = parts[1]?.trim() || "";
        let agEmail = parts[2]?.trim() || "";
        let team = parts[3]?.trim() || "";
        let subteam = parts[4]?.trim() || "";
        let amt = parseFloat(parts[5]?.trim()) || 0;
        let curr = parts[6]?.trim() || "AED";
        let termType = (parts[7]?.trim().toUpperCase() === "WEEKS" ? "WEEKS" : "MONTHS");
        let termVal = parseInt(parts[8]?.trim()) || 1;
        let totalRepay = parseFloat(parts[9]?.trim()) || amt;
        let instAmt = parseFloat(parts[10]?.trim()) || (totalRepay / termVal);
        let startDate = parts[11]?.trim() || new Date().toISOString().slice(0, 10);
        let rem = parts[12]?.trim() || "";

        if (agName && amt > 0) {
          items.push({
            agent_code: agCode,
            agent_name: agName,
            agent_email: agEmail,
            team_name: team,
            subteam_name: subteam,
            advance_amount: amt,
            currency: curr,
            repayment_term_type: termType,
            repayment_term_value: termVal,
            total_repayment_amount: totalRepay,
            installment_amount: instAmt,
            due_start_date: startDate,
            remarks: rem,
          });
        }
      }

      if (items.length === 0) {
        alert("No valid cash advance rows parsed. Please check the CSV format or download the sample CSV template.");
        return;
      }

      const res = await fetch("/api/cash-advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk upload failed");

      alert(data.message || `Successfully processed and issued ${data.inserted_count} cash advance entries!`);
      setBulkText("");
      setViewMode("TRACKER");
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
                <span>← Advances Menu</span>
              </button>
            )}
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 font-extrabold text-[10px] text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-slate-500" />
            Cash Advances
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        
        {/* ========================================================= */}
        {/* VIEW MODE 1: KIOSK MAIN MENU TILES */}
        {/* ========================================================= */}
        {viewMode === "MENU" && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500 rounded-l-3xl" />
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Cash Advance & Repayment Portal
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Select an option below to disburse new cash advances or track repayment ledgers, installments, and canvas vouchers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              {/* Tile A: Disburse Cash Advance */}
              <button
                onClick={() => setViewMode("DISBURSE")}
                className="group bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <DisburseKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  Disburse Advance
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Issue cash advances to roster members and set installment terms (Weeks or Months).
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Issue Advance →
                </div>
              </button>

              {/* Tile B: View Cash Advance Ledger */}
              <button
                onClick={() => setViewMode("TRACKER")}
                className="group bg-white border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <TrackerKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  Advance Ledger
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Track balances, log repayments, and generate canvas vouchers.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-blue-200 bg-blue-50 text-blue-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  View Ledger →
                </div>
              </button>

              {/* Tile C: Bulk Cash Advances Uploader */}
              <button
                onClick={() => setViewMode("BULK")}
                className="group bg-white border-2 border-slate-200 hover:border-purple-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <BulkUploaderKioskIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  Bulk Uploader
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Batch upload and issue multiple agent cash advances from CSV files.
                </p>
                <div className="px-5 py-2 rounded-full border-2 border-purple-200 bg-purple-50 text-purple-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Batch Upload →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 2: DISBURSE CASH ADVANCE (ROSTER MEMBER SELECTION) */}
        {/* ========================================================= */}
        {viewMode === "DISBURSE" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
            <div className="border-b border-slate-200 pb-6 space-y-2">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Coins className="w-7 h-7 text-emerald-600" />
                Select Roster Member to Disburse Cash Advance
              </h2>
              <p className="text-xs text-slate-500 font-medium">Search for an active agent or team member to initiate a cash advance agreement.</p>
            </div>

            {/* 3 Separated Filter Inputs: First Name, Last Name, Email + Search Action Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setMemberPage(1);
                fetchMembers();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John"
                    value={memberFirstName}
                    onChange={(e) => setMemberFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Doe"
                    value={memberLastName}
                    onChange={(e) => setMemberLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. agent@domain.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMemberFirstName("");
                    setMemberLastName("");
                    setMemberEmail("");
                    setMemberPage(1);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Clear Filters
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#047857] flex items-center gap-2 cursor-pointer active:translate-y-0.5"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Roster Members</span>
                </button>
              </div>
            </form>

            {membersLoading ? (
              <div className="py-12 text-center text-slate-400">Loading roster members...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((m) => (
                  <div key={m.member_id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-4 hover:border-emerald-400 transition-colors">
                    <div>
                      <span className="text-[10px] font-mono font-extrabold text-emerald-700 block mb-1">{m.member_code}</span>
                      <h3 className="font-black text-slate-900 text-sm">{m.completename}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">{m.teamname} • {m.subteam_name}</p>
                    </div>

                    <button
                      onClick={() => setSelectedAgentForCA(m)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                    >
                      Disburse Advance →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 3: TRACKER LEDGER & CANVAS DISPLAY */}
        {/* ========================================================= */}
        {viewMode === "TRACKER" && (
          <div className="space-y-8">
            {/* KPI Cards Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Advances</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{kpis.total_count}</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Disbursed</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">AED {kpis.total_disbursed.toLocaleString()}</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Repaid</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">AED {kpis.total_repaid.toLocaleString()}</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Outstanding</span>
                <span className="text-2xl font-black text-red-600 mt-1 block">AED {kpis.total_outstanding.toLocaleString()}</span>
              </div>
            </div>

            {/* LEDGER DIRECTORY TABLE */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <History className="w-7 h-7 text-blue-600" />
                    Cash Advances Ledger
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Track agent disbursements and repayment receipts.</p>
                </div>

                <button
                  onClick={() => setViewMode("DISBURSE")}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#047857] flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Disburse Advance</span>
                </button>
              </div>

              {/* Separated Filters Bar: First Name, Last Name, Email, Status + Search Action Button */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setTrackerPage(1);
                  fetchCashAdvances();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">First Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John"
                      value={trackerFirstName}
                      onChange={(e) => setTrackerFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Doe"
                      value={trackerLastName}
                      onChange={(e) => setTrackerLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. agent@domain.com"
                      value={trackerEmail}
                      onChange={(e) => setTrackerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
                    <select
                      value={trackerStatus}
                      onChange={(e) => setTrackerStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="ACTIVE">ACTIVE (Outstanding)</option>
                      <option value="REPAID">REPAID (Settled)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTrackerFirstName("");
                      setTrackerLastName("");
                      setTrackerEmail("");
                      setTrackerStatus("");
                      setTrackerPage(1);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Clear Filters
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#1D4ED8] flex items-center gap-2 cursor-pointer active:translate-y-0.5"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Advance Records</span>
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">CA Code</th>
                      <th className="py-3 px-4">Agent Name</th>
                      <th className="py-3 px-4">Disbursed Amount</th>
                      <th className="py-3 px-4">Balance Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {trackerLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">Loading ledger records...</td>
                      </tr>
                    ) : advances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">No cash advance records found.</td>
                      </tr>
                    ) : (
                      advances.map((ca) => {
                        const isExpanded = expandedCaId === ca.id;
                        const payments = ca.payments || [];

                        return (
                          <React.Fragment key={ca.id}>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-4 font-mono font-extrabold text-blue-700 flex items-center gap-2">
                                {payments.length > 0 && (
                                  <button
                                    onClick={() => setExpandedCaId(isExpanded ? null : ca.id)}
                                    className="p-1 rounded-md hover:bg-slate-200 text-slate-500 cursor-pointer"
                                    title="Toggle Payment History"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                )}
                                <span>{ca.cash_advance_code}</span>
                              </td>
                              <td className="py-4 px-4 font-black text-slate-900">{ca.agent_name}</td>
                              <td className="py-4 px-4 font-bold text-slate-800">{ca.currency} {Number(ca.advance_amount).toLocaleString()}</td>
                              <td className="py-4 px-4 font-bold text-red-600">{ca.currency} {Number(ca.balance_due).toLocaleString()}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${ca.status === "REPAID" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                  {ca.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleRegenerateCanvas(ca)}
                                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                                    title="Regenerate Cash Advance Voucher"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Voucher</span>
                                  </button>

                                  {ca.status !== "REPAID" && (
                                    <button
                                      onClick={() => setSelectedCAForPayment(ca)}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-[11px] cursor-pointer"
                                    >
                                      Log Repayment
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* EXPANDABLE REPAYMENT PAYMENT HISTORY ROWS */}
                            {isExpanded && payments.length > 0 && (
                              <tr className="bg-slate-50/80 border-b border-slate-200">
                                <td colSpan={6} className="p-4 pl-12">
                                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                                    <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
                                      <History className="w-4 h-4 text-emerald-600" />
                                      Repayment Receipts History ({payments.length})
                                    </h4>

                                    <div className="divide-y divide-slate-100">
                                      {payments.map((p: any) => (
                                        <div key={p.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                                          <div className="flex items-center gap-4">
                                            <span className="font-mono font-bold text-emerald-700">{p.receipt_number}</span>
                                            <span className="text-slate-500 font-semibold">{p.payment_date ? new Date(p.payment_date).toISOString().slice(0, 10) : ""}</span>
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-extrabold text-[10px] uppercase text-slate-600">{p.payment_method}</span>
                                            {p.remarks && <span className="text-slate-400 italic text-[11px]">"{p.remarks}"</span>}
                                          </div>

                                          <div className="flex items-center gap-4">
                                            <span className="font-black text-slate-900">{ca.currency || "AED"} {Number(p.payment_amount).toLocaleString()}</span>
                                            <button
                                              onClick={() => handleRegenerateCanvas(ca, p)}
                                              className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-[10px] flex items-center gap-1 cursor-pointer"
                                              title="Regenerate Repayment Receipt Canvas"
                                            >
                                              <FileText className="w-3 h-3" />
                                              <span>Regenerate Receipt</span>
                                            </button>
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

            {/* Canvas Preview Section */}
            {canvasData && (
              <div id="ca-canvas-section" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-red-600" />
                  Generated Canvas Document
                </h3>
                <CashAdvanceCanvasPreview data={canvasData} />
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 4: BULK CASH ADVANCES UPLOADER */}
        {/* ========================================================= */}
        {viewMode === "BULK" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6 max-w-4xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <Coins className="w-7 h-7 text-purple-600" />
                  Bulk Cash Advances Uploader
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Batch issue multiple agent cash advances using CSV / TSV spreadsheets.
                </p>
              </div>

              {/* Sample Cash Advances CSV Download Button */}
              <a
                href="/sample_cash_advances_bulk_upload.csv"
                download="sample_cash_advances_bulk_upload.csv"
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
                <FileText className="w-4 h-4" />
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
                  placeholder={`Agent Code,Agent Name,Agent Email,Team Name,Subteam Name,Advance Amount,Currency,Term Type,Term Value,Total Repayment,Installment Amount,Start Date,Remarks\nMEM-001,John Doe,john.doe@filipinohomes.com,Dubai Sales Team,Downtown Subteam,5000.00,AED,MONTHS,6,5000.00,833.33,2026-08-01,Emergency advance request\nMEM-002,Maria Santos,maria.santos@filipinohomes.com,Abu Dhabi Sales Team,Corniche Subteam,3000.00,AED,WEEKS,4,3000.00,750.00,2026-08-01,Travel allowance advance`}
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
                  {bulkUploading ? "Uploading Advances..." : "Process Bulk Upload"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: DISBURSE CASH ADVANCE FORM */}
        {selectedAgentForCA && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">Disburse Cash Advance</h3>
                <button onClick={() => setSelectedAgentForCA(null)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCashAdvance} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Agent Name</label>
                  <input type="text" disabled value={selectedAgentForCA.completename} className="w-full p-3 bg-slate-100 border rounded-xl font-bold" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Currency</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold">
                      <option value="AED">AED (Dirham)</option>
                      <option value="PHP">PHP (Peso)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Advance Amount *</label>
                    <input type="number" required value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setSelectedAgentForCA(null)} className="px-5 py-2.5 font-bold">Cancel</button>
                  <button type="submit" disabled={submittingCA} className="px-6 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl shadow-xs">
                    {submittingCA ? "Disbursing..." : "Confirm Disbursement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: LOG REPAYMENT PAYMENT */}
        {selectedCAForPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">Record Repayment Payment</h3>
                <button onClick={() => setSelectedCAForPayment(null)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Repayment Amount *</label>
                  <input type="number" required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setSelectedCAForPayment(null)} className="px-5 py-2.5 font-bold">Cancel</button>
                  <button type="submit" disabled={submittingPayment} className="px-6 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl shadow-xs">
                    {submittingPayment ? "Recording..." : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Cash Advances Module
      </footer>
    </div>
  );
}
