"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Building,
  MapPin,
  Landmark,
  Shield,
  Loader2,
  Check,
  Globe,
  ImageIcon,
  Tag,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Colorful SVG Icons for Stepper Kiosk Group Selection
const CorpTaxKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#DC2626" />
    <path d="M20 46V22L32 16L44 22V46H20ZM26 28H30V32H26V28ZM34 28H38V32H34V28ZM26 36H30V40H26V36ZM34 36H38V40H34V36Z" fill="#FFFFFF" />
  </svg>
);

const AddressBranchKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2563EB" />
    <path d="M32 18C24.8203 18 19 23.8203 19 31C19 40 32 48 32 48C32 48 45 40 45 31C45 23.8203 39.1797 18 32 18ZM32 35C29.7909 35 28 33.2091 28 31C28 28.7909 29.7909 27 32 27C34.2091 27 36 28.7909 36 31C36 33.2091 34.2091 35 32 35Z" fill="#FFFFFF" />
  </svg>
);

const LogoAssetKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#7C3AED" />
    <circle cx="28" cy="28" r="6" fill="#FFFFFF" />
    <path d="M18 44L28 32L34 38L42 28L46 44H18Z" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

const BankTermsKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#059669" />
    <path d="M18 42H46V46H18V42ZM20 28H24V38H20V28ZM28 28H32V38H28V28ZM36 28H40V38H36V28ZM44 28H48V38H44V28ZM34 18L50 24H18L34 18Z" fill="#FFFFFF" />
  </svg>
);

interface Address {
  id?: number;
  address_label: string;
  building_name: string;
  street_address: string;
  area_locality: string;
  city: string;
  country: string;
  po_box: string;
  is_default: boolean;
}

interface LogoAsset {
  id?: number;
  logo_name: string;
  s3_url: string;
  is_default: boolean;
}

interface Profile {
  id: number;
  profile_type: string;
  team_id: number | null;
  company_name: string;
  trn_number: string;
  default_logo_url: string | null;
  template_style: string;
  currency: string;
  tax_percentage: number;
  payment_terms: string;
  bank_name: string;
  account_name: string;
  iban: string;
  swift_code: string;
  footer_notes: string;
}

interface TeamOption {
  id: number;
  teamname: string;
}

export default function InvoiceProfilePage() {
  // Selected Kiosk Info Group State: 0 = Hub Menu, 1 = Corporate TRN, 2 = Branch Addresses, 3 = Logo Assets, 4 = Banking & Terms
  const [activeGroup, setActiveGroup] = useState<number>(0);

  const [profileType, setProfileType] = useState<"ADMIN" | "TEAM">("ADMIN");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [teams, setTeams] = useState<TeamOption[]>([]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [logos, setLogos] = useState<LogoAsset[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Profile, Addresses, & Logos
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        type: profileType,
        ...(profileType === "TEAM" && selectedTeamId ? { teamId: selectedTeamId } : {}),
      });
      const res = await fetch(`/api/invoices/profile?${query.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setProfile(data.profile);
        setAddresses(data.addresses || []);
        setLogos(data.logos || []);
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [profileType, selectedTeamId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle Logo Upload to S3
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    setUploadingLogo(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const newLogo: LogoAsset = {
        logo_name: file.name,
        s3_url: data.url,
        is_default: logos.length === 0,
      };

      const updatedLogos = [...logos, newLogo];
      setLogos(updatedLogos);

      if (profile && newLogo.is_default) {
        setProfile({ ...profile, default_logo_url: data.url });
      }
    } catch (err: any) {
      setErrorMsg(`Logo upload failed: ${err.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = (index: number) => {
    const updated = logos.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((l) => l.is_default)) {
      updated[0].is_default = true;
      if (profile) setProfile({ ...profile, default_logo_url: updated[0].s3_url });
    }
    setLogos(updated);
  };

  const setDefaultLogo = (index: number) => {
    const updated = logos.map((l, i) => ({
      ...l,
      is_default: i === index,
    }));
    setLogos(updated);
    if (profile) setProfile({ ...profile, default_logo_url: updated[index].s3_url });
  };

  // Address Helpers
  const addAddress = () => {
    setAddresses([
      ...addresses,
      {
        address_label: "Branch Office",
        building_name: "",
        street_address: "",
        area_locality: "",
        city: "Dubai",
        country: "United Arab Emirates",
        po_box: "",
        is_default: addresses.length === 0,
      },
    ]);
  };

  const removeAddress = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((a) => a.is_default)) {
      updated[0].is_default = true;
    }
    setAddresses(updated);
  };

  const setDefaultAddress = (index: number) => {
    const updated = addresses.map((a, i) => ({
      ...a,
      is_default: i === index,
    }));
    setAddresses(updated);
  };

  // Save Settings for active group
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const defaultLogo = logos.find((l) => l.is_default);

      const res = await fetch("/api/invoices/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profile.id,
          ...profile,
          default_logo_url: defaultLogo ? defaultLogo.s3_url : profile.default_logo_url,
          addresses,
          logos,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      setSuccessMsg("Profile information group updated successfully!");
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveGroup(0); // Return to Group Hub
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <PageLoader label="Loading Invoice Branding Profile..." />;
  }

  const kioskGroups = [
    {
      id: 1,
      title: "Corporate Identification & TRN",
      description: "Company Name, TRN Tax #, Currency & Theme",
      icon: CorpTaxKioskIcon,
      borderColor: "hover:border-red-500",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
    },
    {
      id: 2,
      title: "Branch Offices & Addresses",
      description: "Registered Building, Street & Office Locations",
      icon: AddressBranchKioskIcon,
      borderColor: "hover:border-blue-500",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: 3,
      title: "S3 Logo Assets & Branding",
      description: "Upload & Set Default Invoice S3 Logos",
      icon: LogoAssetKioskIcon,
      borderColor: "hover:border-purple-500",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: 4,
      title: "Wire Banking & Payment Terms",
      description: "Bank Accounts, IBAN, SWIFT & Default Terms",
      icon: BankTermsKioskIcon,
      borderColor: "hover:border-emerald-500",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Bar */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeGroup === 0 ? (
              <Link href="/dashboard" className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer">
                <BigBackIcon />
                <span>Dashboard</span>
              </Link>
            ) : (
              <button type="button" onClick={() => setActiveGroup(0)} className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer">
                <BigBackIcon />
                <span>← Profile Menu</span>
              </button>
            )}
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 font-extrabold text-[10px] text-slate-700 uppercase tracking-wider">
            Invoice Profile • {profileType}
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        
        {/* ========================================================= */}
        {/* STAGE 1: KIOSK HUB SELECTOR */}
        {/* ========================================================= */}
        {activeGroup === 0 && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-purple-600 rounded-l-3xl" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    Invoice Profile & Branding Hub
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">
                    Configure company TRN numbers, multiple Dubai/UAE branch addresses, official S3 logos, and banking wire details.
                  </p>
                </div>

                {/* Profile Switcher Controls */}
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileType("ADMIN");
                      setSelectedTeamId("");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      profileType === "ADMIN" ? "bg-red-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Admin Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileType("TEAM");
                      if (teams.length > 0) setSelectedTeamId(String(teams[0].id));
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      profileType === "TEAM" ? "bg-red-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Team Profile
                  </button>

                  {profileType === "TEAM" && (
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 cursor-pointer"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.teamname}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* 4 Large Kiosk Group Tile Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
              {kioskGroups.map((group) => {
                const IconComp = group.icon;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroup(group.id)}
                    className={`group bg-white border-2 border-slate-200 rounded-3xl p-10 sm:p-12 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:-translate-y-1 active:translate-y-1.5 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer ${group.borderColor}`}
                  >
                    <div className="mb-6 transform transition-transform duration-200 group-hover:scale-110">
                      <IconComp />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 group-hover:text-red-600 transition-colors">
                      {group.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-xs leading-relaxed mb-6">
                      {group.description}
                    </p>

                    <div
                      className={`px-6 py-2.5 rounded-full border-2 text-xs font-black uppercase tracking-wider ${group.badgeColor}`}
                    >
                      Edit Section →
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 2: PARTICULAR GROUP EDIT FORM */}
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
              
              {/* GROUP 1: CORPORATE TRN & THEME */}
              {activeGroup === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <Building className="w-7 h-7 text-red-600" />
                      Corporate Identification & Tax Registration (TRN)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure official company name, tax registration credentials, default currency, and template theme.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Company Name on Invoice *</label>
                      <input
                        type="text"
                        required
                        value={profile.company_name}
                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-red-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">UAE TRN / Tax Number</label>
                      <input
                        type="text"
                        placeholder="100XXXXXXXXX003"
                        value={profile.trn_number || ""}
                        onChange={(e) => setProfile({ ...profile, trn_number: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-red-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Invoice Currency</label>
                      <select
                        value={profile.currency}
                        onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-red-600 outline-none"
                      >
                        <option value="AED">AED - United Arab Emirates Dirham</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="PHP">PHP - Philippine Peso</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Tax Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={profile.tax_percentage}
                        onChange={(e) => setProfile({ ...profile, tax_percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-red-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Template Styling Theme</label>
                      <select
                        value={profile.template_style}
                        onChange={(e) => setProfile({ ...profile, template_style: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-red-600 outline-none"
                      >
                        <option value="modern_slate">Modern Slate & Red (Recommended)</option>
                        <option value="dubai_luxury_gold">Dubai Luxury Gold</option>
                        <option value="corporate_minimal">Corporate Minimalist White</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* GROUP 2: BRANCH OFFICES & ADDRESSES */}
              {activeGroup === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <MapPin className="w-7 h-7 text-blue-600" />
                        Registered Branch Offices & Addresses
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">Add and select default addresses to print on invoice headers.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addAddress}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Branch</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {addresses.map((addr, idx) => (
                      <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-xs text-slate-800">Branch #{idx + 1}</span>
                            {addr.is_default && (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                                Default Printed Address
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!addr.is_default && (
                              <button
                                type="button"
                                onClick={() => setDefaultAddress(idx)}
                                className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                              >
                                Set as Default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeAddress(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Branch Label</label>
                            <input
                              type="text"
                              value={addr.address_label}
                              onChange={(e) => {
                                const updated = [...addresses];
                                updated[idx].address_label = e.target.value;
                                setAddresses(updated);
                              }}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Building & Street Address</label>
                            <input
                              type="text"
                              value={addr.street_address}
                              onChange={(e) => {
                                const updated = [...addresses];
                                updated[idx].street_address = e.target.value;
                                setAddresses(updated);
                              }}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">City / Emirate</label>
                            <input
                              type="text"
                              value={addr.city}
                              onChange={(e) => {
                                const updated = [...addresses];
                                updated[idx].city = e.target.value;
                                setAddresses(updated);
                              }}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Country</label>
                            <input
                              type="text"
                              value={addr.country}
                              onChange={(e) => {
                                const updated = [...addresses];
                                updated[idx].country = e.target.value;
                                setAddresses(updated);
                              }}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GROUP 3: LOGO ASSETS & S3 UPLOAD */}
              {activeGroup === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <ImageIcon className="w-7 h-7 text-purple-600" />
                      S3 Invoice Logo Assets
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Upload corporate PNG/JPEG logos to S3 and select the active default logo for invoice PDFs.</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col items-center justify-center gap-3">
                    <label className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingLogo ? "Uploading Logo to S3..." : "Upload New Invoice Logo"}</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                    </label>
                    <span className="text-[11px] font-semibold text-purple-700">Supported formats: PNG, JPG, WebP</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {logos.map((logo, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 relative bg-white ${logo.is_default ? "border-purple-600 shadow-md" : "border-slate-200"}`}>
                        <div className="w-full h-24 relative flex items-center justify-center p-2">
                          <Image src={logo.s3_url} alt={logo.logo_name} fill className="object-contain" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 truncate w-full text-center">{logo.logo_name}</span>
                        
                        <div className="flex items-center gap-2 w-full pt-2 border-t border-slate-100">
                          {!logo.is_default ? (
                            <button
                              type="button"
                              onClick={() => setDefaultLogo(idx)}
                              className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-[10px] font-bold text-slate-700 hover:text-purple-700"
                            >
                              Make Default
                            </button>
                          ) : (
                            <span className="flex-1 text-center py-1 bg-purple-100 text-purple-800 rounded-lg text-[10px] font-black uppercase">
                              Active Default
                            </span>
                          )}
                          <button type="button" onClick={() => removeLogo(idx)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GROUP 4: WIRE BANKING & PAYMENT TERMS */}
              {activeGroup === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <Landmark className="w-7 h-7 text-emerald-600" />
                      Wire Banking & Default Terms
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Configure bank wire transfer details and default footer payment terms.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Bank Name</label>
                      <input
                        type="text"
                        placeholder="Emirates NBD / BDO"
                        value={profile.bank_name || ""}
                        onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Account Name</label>
                      <input
                        type="text"
                        placeholder="Company Beneficiary Name"
                        value={profile.account_name || ""}
                        onChange={(e) => setProfile({ ...profile, account_name: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">IBAN Number</label>
                      <input
                        type="text"
                        placeholder="AE230200000012345678901"
                        value={profile.iban || ""}
                        onChange={(e) => setProfile({ ...profile, iban: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">SWIFT / BIC Code</label>
                      <input
                        type="text"
                        placeholder="EBILAE2DXXX"
                        value={profile.swift_code || ""}
                        onChange={(e) => setProfile({ ...profile, swift_code: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Default Payment Terms</label>
                      <input
                        type="text"
                        placeholder="e.g. Payment due within 14 days upon receipt"
                        value={profile.payment_terms || ""}
                        onChange={(e) => setProfile({ ...profile, payment_terms: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Footer Notes / Terms & Conditions</label>
                      <textarea
                        rows={3}
                        placeholder="Additional terms or notes to display at the bottom of generated invoices..."
                        value={profile.footer_notes || ""}
                        onChange={(e) => setProfile({ ...profile, footer_notes: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SAVE / CANCEL BUTTONS */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveGroup(0)}
                  className="px-6 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel & Back to Hub
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#B91C1C] active:translate-y-1 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Profile..." : "Save Profile Group"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Invoice Profile
      </footer>
    </div>
  );
}
