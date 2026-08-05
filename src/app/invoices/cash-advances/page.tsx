"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import CashAdvanceCanvasPreview, { CashAdvanceCanvasData, CashAdvancePaymentRecord } from "@/components/CashAdvanceCanvasPreview";
import {
  FileText,
  Search,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  Plus,
  Globe,
  Coins,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Check,
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

export default function CashAdvancesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-xs text-slate-500 font-bold">
          <Loader2 className="w-6 h-6 animate-spin text-red-600 mr-2" />
          Loading Cash Advances Portal...
        </div>
      }
    >
      <CashAdvancesContent />
    </Suspense>
  );
}

function CashAdvancesContent() {
  const [activeMainTab, setActiveMainTab] = useState<"disburse" | "tracker">("tracker");

  // Admin Profile Settings State
  const [adminProfile, setAdminProfile] = useState<any>(null);

  // Roster Members State
  const [members, setMembers] = useState<InvoicingMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
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
  const [trackerSearch, setTrackerSearch] = useState("");
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

  // Active Canvas Document Preview State
  const [canvasData, setCanvasData] = useState<CashAdvanceCanvasData | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Admin Profile Settings on Mount
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
        console.error("Failed to load admin profile settings:", err);
      }
    }
    loadAdminProfile();
  }, []);

  // Fetch Roster Members for Disbursing
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const query = new URLSearchParams({
        firstName: memberSearch,
        page: memberPage.toString(),
        limit: "10",
      });
      const res = await fetch(`/api/invoices/members?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        setMemberPagination({
          total: data.pagination.total || 0,
          totalPages: data.pagination.totalPages || 1,
        });
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setMembersLoading(false);
    }
  }, [memberSearch, memberPage]);

  // Fetch Cash Advance Ledger & KPIs
  const fetchCashAdvances = useCallback(async () => {
    setTrackerLoading(true);
    try {
      const query = new URLSearchParams({
        search: trackerSearch,
        status: trackerStatus,
        page: trackerPage.toString(),
        limit: "10",
      });
      const res = await fetch(`/api/cash-advances?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setAdvances(data.advances || []);
        setKpis(data.kpis || { total_count: 0, total_disbursed: 0, total_repaid: 0, total_outstanding: 0 });
        setTrackerPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error("Failed to fetch cash advances:", err);
    } finally {
      setTrackerLoading(false);
    }
  }, [trackerSearch, trackerStatus, trackerPage]);

  useEffect(() => {
    if (activeMainTab === "disburse") fetchMembers();
    else fetchCashAdvances();
  }, [activeMainTab, fetchMembers, fetchCashAdvances]);

  // Handle Disburse Cash Advance Form Submit
  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForCA) return;

    setSubmittingCA(true);
    setSuccessMsg(null);
    try {
      const advAmt = Number(advanceAmount);
      const tVal = Math.max(1, Number(termValue || 1));
      const totRepay = customTotalRepayment ? Number(customTotalRepayment) : advAmt;
      const instAmt = totRepay / tVal;

      const payload = {
        member_id: selectedAgentForCA.member_id,
        agent_code: selectedAgentForCA.member_code,
        agent_name: selectedAgentForCA.completename,
        agent_email: selectedAgentForCA.email,
        team_name: selectedAgentForCA.teamname,
        subteam_name: selectedAgentForCA.subteam_name,
        advance_amount: advAmt,
        currency,
        repayment_term_type: termType,
        repayment_term_value: tVal,
        total_repayment_amount: totRepay,
        installment_amount: instAmt,
        due_start_date: dueStartDate,
        remarks: caRemarks,
      };

      const res = await fetch("/api/cash-advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disburse cash advance");

      const prof = data.profile_snapshot?.profile || adminProfile;
      const addr = data.profile_snapshot?.address || adminProfile?.address;
      const logoUrl = adminProfile?.default_logo_url || prof?.default_logo_url;

      setCanvasData({
        mode: "DISBURSEMENT",
        cashAdvanceCode: data.cash_advance_code,
        issuedDate: new Date().toISOString().slice(0, 10),
        agentName: selectedAgentForCA.completename,
        agentCode: selectedAgentForCA.member_code,
        agentEmail: selectedAgentForCA.email || undefined,
        teamName: selectedAgentForCA.teamname,
        subteamName: selectedAgentForCA.subteam_name,
        advanceAmount: advAmt,
        currency,
        repaymentTermType: termType,
        repaymentTermValue: tVal,
        totalRepaymentAmount: totRepay,
        installmentAmount: instAmt,
        dueStartDate: data.due_start_date,
        dueEndDate: data.due_end_date,
        totalPaidAmount: 0,
        balanceDue: totRepay,
        status: "ACTIVE",
        remarks: caRemarks,
        companyName: prof?.company_name || "FHI Global",
        trnNumber: prof?.trn_number || undefined,
        logoUrl: logoUrl || undefined,
        addressLine1: addr ? [addr.building_name, addr.street_address].filter(Boolean).join(", ") : "Opus Tower by Omniyat, Marasi Drive, Business Bay",
        cityCountry: addr ? [addr.city, addr.country].filter(Boolean).join(", ") : "Dubai, United Arab Emirates",
      });

      setSuccessMsg(`Cash Advance #${data.cash_advance_code} issued successfully to ${selectedAgentForCA.completename}! Scroll down to view the Canvas Voucher.`);
      setSelectedAgentForCA(null);
      setActiveMainTab("tracker");
      fetchCashAdvances();
    } catch (err: any) {
      alert(`Disbursement Error: ${err.message}`);
    } finally {
      setSubmittingCA(false);
    }
  };

  // Handle Record Repayment Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCAForPayment) return;

    setSubmittingPayment(true);
    setSuccessMsg(null);
    try {
      const pAmt = Number(paymentAmount);
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

      let snap: any = null;
      try {
        snap = selectedCAForPayment.profile_snapshot ? (typeof selectedCAForPayment.profile_snapshot === "string" ? JSON.parse(selectedCAForPayment.profile_snapshot) : selectedCAForPayment.profile_snapshot) : null;
      } catch (e) {}

      const prof = snap?.profile || adminProfile;
      const addr = snap?.address || adminProfile?.address;
      const logoUrl = adminProfile?.default_logo_url || prof?.default_logo_url;

      const paymentRec: CashAdvancePaymentRecord = {
        id: data.payment_id,
        cash_advance_id: selectedCAForPayment.id,
        receipt_number: data.receipt_number,
        payment_amount: pAmt,
        payment_date: data.payment_date,
        payment_method: paymentMethod,
        remarks: paymentRemarks,
      };

      setCanvasData({
        mode: "REPAYMENT_RECEIPT",
        cashAdvanceCode: selectedCAForPayment.cash_advance_code,
        issuedDate: selectedCAForPayment.issued_date || new Date().toISOString().slice(0, 10),
        agentName: selectedCAForPayment.agent_name,
        agentCode: selectedCAForPayment.agent_code,
        agentEmail: selectedCAForPayment.agent_email,
        teamName: selectedCAForPayment.team_name,
        subteamName: selectedCAForPayment.subteam_name,
        advanceAmount: Number(selectedCAForPayment.advance_amount),
        currency: selectedCAForPayment.currency || "AED",
        repaymentTermType: selectedCAForPayment.repayment_term_type || "MONTHS",
        repaymentTermValue: Number(selectedCAForPayment.repayment_term_value || 1),
        totalRepaymentAmount: Number(selectedCAForPayment.total_repayment_amount),
        installmentAmount: Number(selectedCAForPayment.installment_amount),
        dueStartDate: selectedCAForPayment.due_start_date ? new Date(selectedCAForPayment.due_start_date).toISOString().slice(0, 10) : "",
        dueEndDate: selectedCAForPayment.due_end_date ? new Date(selectedCAForPayment.due_end_date).toISOString().slice(0, 10) : "",
        totalPaidAmount: data.new_total_paid,
        balanceDue: data.new_balance_due,
        status: data.status,
        remarks: paymentRemarks,
        paymentRecord: paymentRec,
        companyName: prof?.company_name || "FHI Global",
        trnNumber: prof?.trn_number || undefined,
        logoUrl: logoUrl || undefined,
        addressLine1: addr ? [addr.building_name, addr.street_address].filter(Boolean).join(", ") : "Opus Tower by Omniyat, Marasi Drive, Business Bay",
        cityCountry: addr ? [addr.city, addr.country].filter(Boolean).join(", ") : "Dubai, United Arab Emirates",
      });

      setSuccessMsg(`Repayment Receipt #${data.receipt_number} logged! Remaining balance: ${selectedCAForPayment.currency || "AED"} ${data.new_balance_due.toLocaleString()}. Scroll down to view the Canvas Receipt.`);
      setSelectedCAForPayment(null);
      fetchCashAdvances();

      setTimeout(() => {
        const el = document.getElementById("ca-canvas-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      alert(`Payment Record Error: ${err.message}`);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // View Canvas for existing Cash Advance or Repayment Receipt
  const handleViewCanvas = (ca: any, paymentRec?: any) => {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <HeaderNav
        onRefresh={() => {
          if (activeMainTab === "disburse") fetchMembers();
          else fetchCashAdvances();
        }}
        loadingRefresh={membersLoading || trackerLoading}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-6">
        {/* Banner Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Coins className="w-6 h-6 text-red-600" />
              Agent Cash Advances & Repayment Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Disburse cash advances to agents, configure repayment terms (Weeks/Months), log repayments, and issue Canvas Vouchers & Receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMainTab("disburse")}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Issue Cash Advance
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveMainTab("tracker")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "tracker"
                ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/30"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            <span>1. Cash Advance Ledger & Tracker ({trackerPagination.total || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("disburse")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "disburse"
                ? "bg-red-600 text-white shadow-md ring-2 ring-red-600/30"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FilePlus className="w-4 h-4" />
            <span>2. Issue New Cash Advance</span>
          </button>
        </div>

        {/* Alert Notification */}
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
        {/* TAB 1: LEDGER & TRACKER */}
        {/* ========================================================= */}
        {activeMainTab === "tracker" && (
          <div className="space-y-6">
            {/* KPI Cards Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Cash Advances
                </span>
                <span className="text-2xl font-black text-slate-900 block">{kpis.total_count}</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Recorded in DB
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Principal Disbursed
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono block">
                  {Number(kpis.total_disbursed).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Total funds sent to agents</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Repayments Collected
                </span>
                <span className="text-2xl font-black text-emerald-600 font-mono block">
                  {Number(kpis.total_repaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Agent payments logged</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Active Outstanding Balance
                </span>
                <span className="text-2xl font-black text-red-600 font-mono block">
                  {Number(kpis.total_outstanding).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-red-600 font-semibold">Balance due from agents</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Search & Filter Cash Advance Records
                </span>
                <button
                  onClick={() => {
                    setTrackerSearch("");
                    setTrackerStatus("");
                    setTrackerPage(1);
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Filters
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Advance Code, Agent Name, Code, Team..."
                    value={trackerSearch}
                    onChange={(e) => {
                      setTrackerSearch(e.target.value);
                      setTrackerPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <select
                    value={trackerStatus}
                    onChange={(e) => {
                      setTrackerStatus(e.target.value);
                      setTrackerPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active (Unpaid Balance)</option>
                    <option value="PAID">Fully Paid</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ledger Data Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-4 h-4 text-red-600" />
                  Cash Advance Database Ledger
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {trackerPagination.total} records found
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                      <th className="py-3 px-4">Code & Due Dates</th>
                      <th className="py-3 px-4">Agent Name / Team</th>
                      <th className="py-3 px-4">Repayment Term</th>
                      <th className="py-3 px-4 text-right">Disbursed</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {trackerLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                          <span>Loading cash advance ledger...</span>
                        </td>
                      </tr>
                    ) : advances.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No cash advance records found.
                        </td>
                      </tr>
                    ) : (
                      advances.map((ca) => {
                        const pctPaid = Math.min(100, Math.round((Number(ca.total_paid_amount) / Number(ca.total_repayment_amount)) * 100)) || 0;
                        const isExpanded = expandedCaId === ca.id;
                        const hasPayments = ca.payments && ca.payments.length > 0;

                        return (
                          <React.Fragment key={ca.id}>
                            <tr className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-4 px-4">
                                <span className="font-bold font-mono text-slate-900 block">
                                  {ca.cash_advance_code}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                                  {ca.due_start_date ? new Date(ca.due_start_date).toISOString().slice(0, 10) : "N/A"} → {ca.due_end_date ? new Date(ca.due_end_date).toISOString().slice(0, 10) : "N/A"}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-semibold text-slate-800">
                                <div>{ca.agent_name}</div>
                                {ca.agent_code && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Code: {ca.agent_code}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-slate-800 block">
                                  {ca.repayment_term_value} {ca.repayment_term_type}
                                </span>
                                <span className="text-[10px] text-slate-500 block font-mono">
                                  {ca.currency || "AED"} {Number(ca.installment_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} / {ca.repayment_term_type === "WEEKS" ? "wk" : "mo"}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right font-mono font-semibold text-slate-700">
                                {ca.currency || "AED"} {Number(ca.advance_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-right font-mono font-semibold text-emerald-600">
                                {ca.currency || "AED"} {Number(ca.total_paid_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-right font-mono font-bold text-red-600">
                                {ca.currency || "AED"} {Number(ca.balance_due).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                  ca.status === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}>
                                  {ca.status}
                                </span>
                                <div className="w-20 bg-slate-200 rounded-full h-1.5 mx-auto mt-1.5 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all"
                                    style={{ width: `${pctPaid}%` }}
                                  />
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* EXPAND PAYMENTS / RECEIPTS BUTTON */}
                                  {hasPayments && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedCaId(isExpanded ? null : ca.id)}
                                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                      title="View Repayment Receipts"
                                    >
                                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Receipts ({ca.payments.length})</span>
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                  )}

                                  {/* RECORD REPAYMENT BUTTON */}
                                  {ca.status !== "PAID" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCAForPayment(ca);
                                        setPaymentAmount("");
                                        setPaymentRemarks("");
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Log Payment</span>
                                    </button>
                                  )}

                                  {/* VIEW DISBURSEMENT VOUCHER CANVAS BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => handleViewCanvas(ca)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                    title="View Disbursement Voucher Canvas"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-red-500" />
                                    <span>Voucher</span>
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* EXPANDED REPAYMENT RECEIPTS SUB-ROW */}
                            {isExpanded && hasPayments && (
                              <tr className="bg-slate-50/90 border-b border-slate-200">
                                <td colSpan={8} className="p-4">
                                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-inner">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                        <Receipt className="w-4 h-4 text-emerald-600" />
                                        Logged Repayment Receipts for {ca.cash_advance_code}
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-semibold">
                                        Total Paid: {ca.currency || "AED"} {Number(ca.total_paid_amount).toLocaleString()}
                                      </span>
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                      {ca.payments.map((p: any) => (
                                        <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                                          <div className="space-y-0.5">
                                            <span className="font-bold font-mono text-slate-900 block">
                                              {p.receipt_number}
                                            </span>
                                            <span className="text-[10px] text-slate-500 block">
                                              Date: {p.payment_date ? new Date(p.payment_date).toISOString().slice(0, 10) : 'N/A'} • Method: {p.payment_method} {p.remarks ? `• ${p.remarks}` : ''}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-4">
                                            <span className="font-bold font-mono text-emerald-600 text-sm">
                                              + {ca.currency || "AED"} {Number(p.payment_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                            </span>

                                            <button
                                              type="button"
                                              onClick={() => handleViewCanvas(ca, p)}
                                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                            >
                                              <Eye className="w-3.5 h-3.5 text-white" />
                                              <span>View Receipt Canvas</span>
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

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  Page <span className="font-semibold text-slate-800">{trackerPage}</span> of{" "}
                  <span className="font-semibold text-slate-800">{trackerPagination.totalPages || 1}</span> ({trackerPagination.total} cash advances)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTrackerPage((p) => Math.max(1, p - 1))}
                    disabled={trackerPage <= 1 || trackerLoading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTrackerPage((p) => Math.min(trackerPagination.totalPages, p + 1))}
                    disabled={trackerPage >= trackerPagination.totalPages || trackerLoading}
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
        {/* TAB 2: DISBURSE CASH ADVANCE (AGENT ROSTER) */}
        {/* ========================================================= */}
        {activeMainTab === "disburse" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Search & Filter Agent Roster
                </span>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter agent by name..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Select Agent to Issue Cash Advance
              </h2>

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
                    {membersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                          <span>Loading roster...</span>
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
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {m.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedAgentForCA(m);
                                setAdvanceAmount("");
                                setTermValue("3");
                                setCustomTotalRepayment("");
                                setCaRemarks("");
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>Issue Cash Advance</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CANVAS PREVIEW DISPLAY SECTION */}
        {canvasData && (
          <div id="ca-canvas-section" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                  Canvas Document Preview
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  {canvasData.mode === "REPAYMENT_RECEIPT" ? `Repayment Receipt #${canvasData.paymentRecord?.receipt_number}` : `Cash Advance #${canvasData.cashAdvanceCode}`}
                </h2>
              </div>
            </div>

            <CashAdvanceCanvasPreview data={canvasData} />
          </div>
        )}
      </main>

      {/* DISBURSE CASH ADVANCE MODAL */}
      {selectedAgentForCA && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAgentForCA(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                <Coins className="w-3.5 h-3.5" />
                Issue Cash Advance
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Disburse Funds for {selectedAgentForCA.completename}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Code: {selectedAgentForCA.member_code} • Team: {selectedAgentForCA.teamname}
              </p>
            </div>

            {/* CURRENCY TOGGLE */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Currency</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency("AED")}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                    currency === "AED" ? "bg-red-600 text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  AED
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("PHP")}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                    currency === "PHP" ? "bg-red-600 text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  PHP (₱)
                </button>
              </div>
            </div>

            <form onSubmit={handleDisburseSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Cash Advance Principal ({currency})</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="e.g. 5000.00"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-base rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* REPAYMENT TERM TYPE & VALUE */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Repayment Period Unit</label>
                  <select
                    value={termType}
                    onChange={(e) => setTermType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="MONTHS">Months</option>
                    <option value="WEEKS">Weeks</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Duration ({termType})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={termValue}
                    onChange={(e) => setTermValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* REPAYMENT CALCULATION BREAKDOWN */}
              {advanceAmount && Number(advanceAmount) > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 text-emerald-900">
                  <span className="text-[11px] font-bold block uppercase tracking-wider">Calculated Installment Breakdown</span>
                  <div className="text-base font-black font-mono">
                    {currency} {(Number(customTotalRepayment || advanceAmount) / Math.max(1, Number(termValue || 1))).toFixed(2)} / {termType === "WEEKS" ? "week" : "month"}
                  </div>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    Total Repayment Required: {currency} {Number(customTotalRepayment || advanceAmount).toLocaleString()} over {termValue} {termType}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Repayment Start Date</label>
                <input
                  type="date"
                  required
                  value={dueStartDate}
                  onChange={(e) => setDueStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Remarks / Disburse Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved cash advance for personal emergency"
                  value={caRemarks}
                  onChange={(e) => setCaRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgentForCA(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingCA}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingCA ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Issuing Cash Advance...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Issue & Generate Voucher Canvas</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD REPAYMENT PAYMENT MODAL */}
      {selectedCAForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCAForPayment(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Record Repayment Received
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Log Payment for {selectedCAForPayment.agent_name}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Code: {selectedCAForPayment.cash_advance_code} • Current Outstanding: {selectedCAForPayment.currency || "AED"} {Number(selectedCAForPayment.balance_due).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Payment Amount Received ({selectedCAForPayment.currency || "AED"})</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={selectedCAForPayment.balance_due}
                  placeholder={`e.g. ${selectedCAForPayment.installment_amount}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-base rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                    <option value="PAYOUT_DEDUCTION">Agent Payout Deduction</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Payment Remarks / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Installment payment 1 of 3"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCAForPayment(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging Repayment...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Record Payment & Issue Canvas Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
