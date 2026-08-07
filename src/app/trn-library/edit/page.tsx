"use client";

import React, { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Check,
  AlertCircle,
  Tag,
  MapPin,
  Landmark,
  FileText,
  Save,
  ArrowLeft,
} from "lucide-react";

import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Colorful SVG Icons for Stepper Kiosk Edit Modules
const CoreTaxKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
    <defs>
      <linearGradient id="coreTaxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#coreTaxGrad)" />
    <rect x="18" y="18" width="28" height="28" rx="6" fill="#FFFFFF" opacity="0.95" />
    <path d="M24 28H40M24 34H36M24 40H30" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const AddressKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
    <defs>
      <linearGradient id="addressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#addressGrad)" />
    <path d="M32 18C24.8203 18 19 23.8203 19 31C19 40 32 48 32 48C32 48 45 40 45 31C45 23.8203 39.1797 18 32 18ZM32 35C29.7909 35 28 33.2091 28 31C28 28.7909 29.7909 27 32 27C34.2091 27 36 28.7909 36 31C36 33.2091 34.2091 35 32 35Z" fill="#FFFFFF" />
  </svg>
);

const ContactBankKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
    <defs>
      <linearGradient id="contactBankGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#contactBankGrad)" />
    <path d="M18 42H46V46H18V42ZM20 28H24V38H20V28ZM28 28H32V38H28V28ZM36 28H40V38H36V28ZM44 28H48V38H44V28ZM34 18L50 24H18L34 18Z" fill="#FFFFFF" />
  </svg>
);

const ReviewNotesKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
    <defs>
      <linearGradient id="reviewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#reviewGrad)" />
    <rect x="18" y="16" width="28" height="32" rx="5" fill="#FFFFFF" />
    <path d="M24 24H40M24 30H36M24 36H32" stroke="#6D28D9" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function EditTrnRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const initialGroup = Number(searchParams.get("group") || 0);

  // Selected Group State: 0 = Kiosk Menu Hub, 1 = Core Tax, 2 = Address, 3 = Contact & Bank, 4 = Notes & Status
  const [activeGroup, setActiveGroup] = useState<number>(initialGroup);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    company_name: "",
    tin_number: "",
    country_code: "UAE",
    entity_type: "SALES",
    tax_reg_date: "",
    trade_license_number: "",
    notes: "",
    status: "ACTIVE",
    // Contact Person
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    // Address
    address: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "United Arab Emirates",
    // Bank
    bank_name: "",
    bank_account_number: "",
    iban: "",
    swift_code: "",
  });

  // Load Existing TRN Record Data
  useEffect(() => {
    async function fetchRecord() {
      if (!id) {
        setErrorMsg("No TRN record ID provided.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/trn-library/${id}`);
        if (res.ok) {
          const data = await res.json();
          const rec = data.record;
          if (rec) {
            setFormData({
              company_name: rec.company_name || "",
              tin_number: rec.tin_number || "",
              country_code: rec.country_code || "UAE",
              entity_type: rec.entity_type || "SALES",
              tax_reg_date: rec.tax_reg_date ? new Date(rec.tax_reg_date).toISOString().slice(0, 10) : "",
              trade_license_number: rec.trade_license_number || "",
              notes: rec.notes || "",
              status: rec.status || "ACTIVE",
              contact_person: rec.contact_person || "",
              contact_email: rec.contact_email || "",
              contact_phone: rec.contact_phone || "",
              address: rec.street_address || "",
              city: rec.city || "",
              state_province: rec.state_province || "",
              postal_code: rec.postal_code || "",
              country: rec.country || "United Arab Emirates",
              bank_name: rec.bank_name || "",
              bank_account_number: rec.account_number || "",
              iban: rec.iban || "",
              swift_code: rec.swift_code || "",
            });
          }
        } else {
          setErrorMsg("Failed to load TRN record.");
        }
      } catch (e: any) {
        setErrorMsg(e.message || "Error fetching record.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [id]);

  // Handle Form Submission for Specific Info Group
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/trn-library/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Group information updated successfully!");
        setTimeout(() => {
          setSuccessMsg("");
          setActiveGroup(0); // Return to Kiosk Group Selection Hub
        }, 1000);
      } else {
        setErrorMsg(data.error || "Failed to update TRN record.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading TRN Record Details..." />;
  }

  const kioskInfoGroups = [
    {
      id: 1,
      title: "Core Entity & Tax ID",
      description: "Company Name, TRN/TIN #, Tax Authority & Format",
      icon: CoreTaxKioskIcon,
      accentBorder: "hover:border-blue-500",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: 2,
      title: "Registered Address",
      description: "Billing Street Address, City, Region & Country",
      icon: AddressKioskIcon,
      accentBorder: "hover:border-emerald-500",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: 3,
      title: "Contact & Banking",
      description: "Finance Person, Email, Phone, IBAN & SWIFT Code",
      icon: ContactBankKioskIcon,
      accentBorder: "hover:border-amber-500",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: 4,
      title: "Filing Notes & Status",
      description: "Tax Exemption Notes & Record Status",
      icon: ReviewNotesKioskIcon,
      accentBorder: "hover:border-purple-500",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Header Bar */}
      <div className="w-full max-w-7xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {activeGroup === 0 ? (
            <Link
              href="/trn-library?mode=VIEW"
              className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-red-500 shadow-[0_4px_0_0_#CBD5E1] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              <BigBackIcon />
              <span className="font-extrabold text-sm text-slate-800 group-hover:text-red-600">Back to TRN Records</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setActiveGroup(0)}
              className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-red-500 shadow-[0_4px_0_0_#CBD5E1] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              <BigBackIcon />
              <span className="font-extrabold text-sm text-slate-800 group-hover:text-red-600">Back to Group Menu</span>
            </button>
          )}

          <Image
            src="/fhi.png"
            alt="Filipino Homes"
            width={180}
            height={50}
            className="object-contain h-14 w-auto hidden sm:block"
            priority
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full bg-blue-100 border border-blue-300 text-blue-800 font-extrabold text-xs uppercase tracking-wider">
            TRN Record: {formData.company_name || `ID #${id}`}
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        
        {/* ========================================================= */}
        {/* STAGE 1: KIOSK BUTTON TILES FOR SELECTING INFO GROUP TO EDIT */}
        {/* ========================================================= */}
        {activeGroup === 0 && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-2 bg-blue-600" />
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Select Information Group to Edit
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Choose a specific group of information below to quickly edit only that section for <strong className="text-slate-800">{formData.company_name}</strong>.
              </p>
            </div>

            {/* 4 Large Kiosk Group Tile Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto w-full">
              {kioskInfoGroups.map((group) => {
                const IconComp = group.icon;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroup(group.id)}
                    className={`group relative bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer ${group.accentBorder}`}
                  >
                    <div className="mb-6 transform transition-transform duration-200 group-hover:scale-105">
                      <IconComp />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                      {group.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                      {group.description}
                    </p>

                    <div
                      className={`px-5 py-2 rounded-full border-2 text-xs font-extrabold uppercase tracking-wider shadow-[0_3px_0_0_rgba(0,0,0,0.08)] transition-all duration-200 ${group.badgeColor}`}
                    >
                      Edit This Group →
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 2: DEDICATED EDIT FORM FOR PARTICULAR GROUP ONLY */}
        {/* ========================================================= */}
        {activeGroup > 0 && (
          <div className="max-w-4xl mx-auto w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-8 animate-fadeIn">
            
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

            <form onSubmit={handleSaveGroup} className="space-y-8">
              
              {/* GROUP 1: CORE ENTITY & TAX IDENTIFICATION */}
              {activeGroup === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <Tag className="w-7 h-7 text-blue-600" />
                      Edit Core Entity & Tax Identification
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Update official company name, tax authority format, and registered TRN/TIN number.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Record Category *</label>
                      <select
                        value={formData.entity_type}
                        onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-600 outline-none"
                      >
                        <option value="SALES">Sales Entity (Client / Customer)</option>
                        <option value="EXPENSES">Expenses Entity (Vendor / Supplier)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Tax Authority Format *</label>
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
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-600 outline-none"
                      >
                        <option value="UAE">Dubai / UAE FTA (15-Digit TRN)</option>
                        <option value="PH">Philippines BIR (9-12 Digit TIN)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Official Registered Company Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        {formData.country_code === "UAE" ? "UAE TRN Number (15-Digits) *" : "BIR TIN Number (9-12 Digits) *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.tin_number}
                        onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono focus:bg-white focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Trade License # (Optional)</label>
                      <input
                        type="text"
                        value={formData.trade_license_number}
                        onChange={(e) => setFormData({ ...formData, trade_license_number: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Tax Reg Date (Optional)</label>
                      <input
                        type="date"
                        value={formData.tax_reg_date}
                        onChange={(e) => setFormData({ ...formData, tax_reg_date: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GROUP 2: REGISTERED BILLING ADDRESS */}
              {activeGroup === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <MapPin className="w-7 h-7 text-emerald-600" />
                      Edit Registered Billing Address
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Modify street address, emirate/city, region, or country details in linked trn_addresses table.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Street Address & Office Unit</label>
                      <textarea
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">City / Emirate</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">State / Region</label>
                      <input
                        type="text"
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

              {/* GROUP 3: CONTACT PERSON & WIRE BANKING DETAILS */}
              {activeGroup === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <Landmark className="w-7 h-7 text-amber-600" />
                      Edit Contact Person & Wire Banking Details
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Update accounting contact officer, billing email, IBAN wire number, and SWIFT code.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Contact Person Name</label>
                      <input
                        type="text"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Finance Email</label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Contact Phone</label>
                      <input
                        type="text"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">IBAN Number</label>
                      <input
                        type="text"
                        value={formData.iban}
                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">SWIFT / BIC Code</label>
                      <input
                        type="text"
                        value={formData.swift_code}
                        onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-amber-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GROUP 4: FILING NOTES & RECORD STATUS */}
              {activeGroup === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <FileText className="w-7 h-7 text-purple-600" />
                      Edit Filing Notes & Status
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter exemption notes, filing certificates, or change active status.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Record Active Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-purple-600 outline-none"
                      >
                        <option value="ACTIVE font-bold text-emerald-600">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE / ARCHIVED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Filing & Tax Exemption Notes</label>
                      <textarea
                        rows={4}
                        placeholder="Enter tax notes..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SAVE / CANCEL ACTION BUTTONS */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveGroup(0)}
                  className="px-6 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel & Back to Groups
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#047857] active:shadow-none active:translate-y-1 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Group..." : "Save Group Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Edit TRN Profile
      </footer>
    </div>
  );
}


export default function TrnLibraryEditPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Edit Page..." />}>
      <EditTrnRecordPage />
    </Suspense>
  );
}
