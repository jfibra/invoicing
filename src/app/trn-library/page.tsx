"use client";

import React, { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusCircle,
  FolderOpen,
  Search,
  Building2,
  Check,
  AlertCircle,
  Tag,
  MapPin,
  Landmark,
  FileText,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Save,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const AddTrnIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-20 h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#059669" />
    <rect x="18" y="18" width="28" height="28" rx="6" fill="#FFFFFF" opacity="0.9" />
    <path d="M32 24V40M24 32H40" stroke="#047857" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const ViewTrnIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-20 h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2563EB" />
    <path d="M16 20C16 18.3431 17.3431 17 19 17H29L33 21H45C46.6569 21 48 22.3431 48 24V43C48 44.6569 46.6569 46 45 46H19C17.3431 46 16 44.6569 16 43V20Z" fill="#FFFFFF" opacity="0.95" />
    <circle cx="32" cy="33" r="5" fill="#93C5FD" />
    <path d="M22 33C25 29 39 29 42 33C39 37 25 37 22 33Z" stroke="#BFDBFE" strokeWidth="2.5" />
  </svg>
);

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export default function TrnLibraryPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading TRN Library..." />}>
      <TrnLibraryContent />
    </Suspense>
  );
}

function TrnLibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as "MENU" | "ADD" | "VIEW") || "MENU";

  const [viewMode, setViewMode] = useState<"MENU" | "ADD" | "VIEW">(initialMode);
  const [currentStep, setCurrentStep] = useState(1);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCountry, setFilterCountry] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    company_name: "",
    tin_number: "",
    country_code: "UAE",
    entity_type: "SALES",
    tax_reg_date: "",
    trade_license_number: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "United Arab Emirates",
    bank_name: "",
    bank_account_number: "",
    iban: "",
    swift_code: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const steps = [
    { number: 1, title: "Core Entity & Tax ID", icon: Tag },
    { number: 2, title: "Registered Address", icon: MapPin },
    { number: 3, title: "Contact & Banking", icon: Landmark },
    { number: 4, title: "Review & Save", icon: FileText },
  ];

  // Fetch Records
  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterType) params.append("type", filterType);
      if (filterCountry) params.append("country", filterCountry);

      const res = await fetch(`/api/trn-library?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "VIEW") {
      loadRecords();
    }
  }, [viewMode, search, filterType, filterCountry]);

  // Stepper Next / Prev Handlers
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.company_name || !formData.tin_number) {
        setErrorMsg("Company Name and TRN/TIN Number are required before proceeding.");
        return;
      }
    }
    setErrorMsg("");
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setErrorMsg("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle Form Submission (Add Record)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/trn-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("TRN Record saved to library successfully!");
        setFormData({
          company_name: "",
          tin_number: "",
          country_code: "UAE",
          entity_type: "SALES",
          tax_reg_date: "",
          trade_license_number: "",
          contact_person: "",
          contact_email: "",
          contact_phone: "",
          address: "",
          city: "",
          state_province: "",
          postal_code: "",
          country: "United Arab Emirates",
          bank_name: "",
          bank_account_number: "",
          iban: "",
          swift_code: "",
          notes: "",
        });
        setCurrentStep(1);
        setTimeout(() => {
          setViewMode("VIEW");
        }, 1200);
      } else {
        setErrorMsg(data.error || "Failed to save TRN record");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Delete Record Handler
  const handleDeleteRecord = async (recId: number, compName: string) => {
    if (!confirm(`Are you sure you want to remove the TRN record for ${compName}?`)) return;

    try {
      const res = await fetch(`/api/trn-library/${recId}`, { method: "DELETE" });
      if (res.ok) {
        loadRecords();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Header Bar */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode === "MENU" ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
              >
                <BigBackIcon />
                <span>Dashboard</span>
              </Link>
            ) : (
              <button
                onClick={() => setViewMode("MENU")}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
              >
                <BigBackIcon />
                <span>← TRN Menu</span>
              </button>
            )}
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 font-extrabold text-[10px] text-slate-700 uppercase tracking-wider">
            TRN / TIN Library
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        {/* ========================================================= */}
        {/* VIEW MODE 1: KIOSK MAIN MENU */}
        {/* ========================================================= */}
        {viewMode === "MENU" && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-2 bg-cyan-600" />
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Tax Registration Number (TRN/TIN) Library
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage and look up tax identification credentials for Dubai (UAE TRN 15-digits) & Philippine (TIN 9-12 digits) client/vendor entities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
              {/* Tile A: Add TRN Record */}
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setViewMode("ADD");
                }}
                className="group bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-10 sm:p-12 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <AddTrnIcon />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                  Add TRN Record
                </h2>
                <p className="text-sm text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Register new corporate TIN/TRN records via stepper form for Sales clients or Expense vendors.
                </p>
                <div className="px-6 py-2.5 rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Create Record →
                </div>
              </button>

              {/* Tile B: View TRN Records */}
              <button
                onClick={() => setViewMode("VIEW")}
                className="group bg-white border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-10 sm:p-12 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer"
              >
                <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                  <ViewTrnIcon />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  View TRN Records
                </h2>
                <p className="text-sm text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                  Search, edit stepper profiles, inspect, and copy existing tax registration profiles.
                </p>
                <div className="px-6 py-2.5 rounded-full border-2 border-blue-200 bg-blue-50 text-blue-700 font-black text-xs uppercase tracking-wider shadow-xs">
                  Open Directory →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 2: STEPPER FORM FOR ADDING TRN RECORD */}
        {/* ========================================================= */}
        {viewMode === "ADD" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-8">
            <div className="border-b border-slate-200 pb-6 space-y-2">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Building2 className="w-7 h-7 text-emerald-600" />
                Add New Tax Registration (TRN / TIN) Record
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Complete the 4-step wizard below to register client or supplier tax information.
              </p>
            </div>

            {/* STEPPER PROGRESS BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {steps.map((s) => {
                const StepIcon = s.icon;
                const isActive = currentStep === s.number;
                const isCompleted = currentStep > s.number;

                return (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => {
                      if (s.number < currentStep || (formData.company_name && formData.tin_number)) {
                        setCurrentStep(s.number);
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${
                      isActive
                        ? "border-emerald-600 bg-emerald-50/60 shadow-[0_4px_0_0_#059669]"
                        : isCompleted
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs ${
                        isActive || isCompleted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : s.number}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">Step {s.number}</span>
                      <span className="text-xs font-black text-slate-900 block leading-tight">{s.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* STEP 1: CORE IDENTIFICATION */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    1. Core Entity & Tax Identification
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Record Category *</label>
                      <select
                        value={formData.entity_type}
                        onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none"
                      >
                        <option value="SALES">Sales Entity (Client / Customer)</option>
                        <option value="EXPENSES">Expenses Entity (Vendor / Supplier)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Tax Format *</label>
                      <select
                        value={formData.country_code}
                        onChange={(e) => {
                          const code = e.target.value;
                          setFormData({
                            ...formData,
                            country_code: code,
                            country: code === "PH" ? "Philippines" : "United Arab Emirates",
                          });
                        }}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none"
                      >
                        <option value="UAE">Dubai / UAE FTA (15-Digit TRN)</option>
                        <option value="PH">Philippines BIR (9-12 Digit TIN)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Registered Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Emaar Properties PJSC or Ayala Land Inc."
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        {formData.country_code === "UAE" ? "UAE TRN Number (15-Digits) *" : "BIR TIN Number (9-12 Digits) *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={formData.country_code === "UAE" ? "100234567800003" : "123-456-789-000"}
                        value={formData.tin_number}
                        onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Trade License # (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. CN-1029384"
                        value={formData.trade_license_number}
                        onChange={(e) => setFormData({ ...formData, trade_license_number: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Tax Reg Date (Optional)</label>
                      <input
                        type="date"
                        value={formData.tax_reg_date}
                        onChange={(e) => setFormData({ ...formData, tax_reg_date: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ADDRESS */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      2. Registered Billing Address
                    </span>
                    <span className="text-xs font-semibold text-slate-400 lowercase italic">(optional - linked trn_addresses record)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Street Address & Office Unit</label>
                      <textarea
                        rows={3}
                        placeholder="Suite 402, Al Hudaiba Awards Building, Jumeirah, Dubai"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">City / Emirate</label>
                      <input
                        type="text"
                        placeholder="Dubai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">State / Region</label>
                      <input
                        type="text"
                        placeholder="Dubai Emirate / Metro Manila"
                        value={formData.state_province}
                        onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACT & BANKING */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-600" />
                      3. Contact Person & Wire Banking Details
                    </span>
                    <span className="text-xs font-semibold text-slate-400 lowercase italic">(optional linked child records)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Contact Person Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe (Finance Officer)"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Finance Email</label>
                      <input
                        type="email"
                        placeholder="billing@company.com"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="+971 4 123 4567"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Bank Name</label>
                      <input
                        type="text"
                        placeholder="Emirates NBD / BDO"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">IBAN Number</label>
                      <input
                        type="text"
                        placeholder="AE230200000012345678901"
                        value={formData.iban}
                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">SWIFT / BIC Code</label>
                      <input
                        type="text"
                        placeholder="EBILAE2DXXX"
                        value={formData.swift_code}
                        onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SAVE */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    4. Review Profile & Notes
                  </h3>

                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 block font-semibold">Company Name</span>
                        <span className="font-extrabold text-slate-900 text-sm">{formData.company_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">TRN / TIN Number</span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">{formData.tin_number || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Category & Authority</span>
                        <span className="font-bold text-slate-800">{formData.entity_type} • {formData.country_code} Format</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Primary Address</span>
                        <span className="font-medium text-slate-800">{formData.address || "No address provided"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Filing & Exemption Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Enter any additional notes regarding tax exemption, registration certificate reference, etc."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEPPER NAVIGATION BUTTONS */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#047857] active:shadow-none active:translate-y-1 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#047857] active:shadow-none active:translate-y-1 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving Record..." : "Save TRN Record"}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE 3: DIRECTORY / SEARCH TABLE WITH EDIT ACTION */}
        {/* ========================================================= */}
        {viewMode === "VIEW" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <FolderOpen className="w-7 h-7 text-blue-600" />
                  TRN & TIN Directory Records
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Search through saved client and supplier tax records. Click Edit to open the dedicated stepper editor.
                </p>
              </div>

              <button
                onClick={() => {
                  setCurrentStep(1);
                  setViewMode("ADD");
                }}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#047857] flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add TRN Record</span>
              </button>
            </div>

            {/* FILTERS BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search company or TRN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="">All Categories (Sales & Expenses)</option>
                  <option value="SALES">Sales Clients Only</option>
                  <option value="EXPENSES">Expenses Vendors Only</option>
                </select>
              </div>

              <div>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="">All Formats (UAE & PH)</option>
                  <option value="UAE">UAE FTA TRN Records</option>
                  <option value="PH">Philippines BIR TIN Records</option>
                </select>
              </div>
            </div>

            {/* DIRECTORY TABLE WITH EDIT LINK */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">TRN / TIN Number</th>
                    <th className="py-3 px-4">Module Type</th>
                    <th className="py-3 px-4">Country Format</th>
                    <th className="py-3 px-4">Primary Address</th>
                    <th className="py-3 px-4">Primary Contact / IBAN</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading TRN directory records...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-normal">
                        No TRN records found. Click "Add TRN Record" to create one!
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-black text-slate-900">
                          {rec.company_name}
                          {rec.trade_license_number && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              Lic: {rec.trade_license_number}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono font-extrabold text-slate-800 text-[11px]">
                            {rec.tin_number}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              rec.entity_type === "SALES"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {rec.entity_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-700">
                          {rec.country_code === "UAE" ? "UAE (15-Digit TRN)" : "Philippines (BIR TIN)"}
                        </td>
                        <td className="py-4 px-4 text-slate-600 max-w-xs truncate" title={rec.primary_address || rec.address}>
                          {rec.primary_address || rec.address || "—"}
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-mono text-[11px]">
                          {rec.primary_contact_name || rec.primary_contact_email || rec.primary_iban || rec.iban || "—"}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/trn-library/edit?id=${rec.id}`}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </Link>
                            <button
                              onClick={() => handleDeleteRecord(rec.id, rec.company_name)}
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors cursor-pointer"
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
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • TRN Library Portal
      </footer>
    </div>
  );
}
