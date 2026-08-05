"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
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
  Layers,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Check,
  Globe,
  Settings,
  Sparkles,
  CheckSquare,
  Image as ImageIcon,
  Edit3,
  X,
} from "lucide-react";

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

interface InvoiceTypeSetting {
  id: number;
  code: string;
  label: string;
  invoice_title: string;
  description: string;
  status: "active" | "inactive";
  sort_order: number;
}

export default function InvoiceProfilePage() {
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

  // Invoice Types Settings State
  const [invoiceTypesList, setInvoiceTypesList] = useState<InvoiceTypeSetting[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [editingTypeItem, setEditingTypeItem] = useState<InvoiceTypeSetting | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeForm, setTypeForm] = useState({
    id: 0,
    code: "",
    label: "",
    invoice_title: "",
    description: "",
    status: "active" as "active" | "inactive",
    sort_order: 0,
  });
  const [savingType, setSavingType] = useState(false);

  const fetchInvoiceTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const res = await fetch("/api/settings/invoice-types");
      const data = await res.json();
      if (res.ok && data.invoiceTypes) {
        setInvoiceTypesList(data.invoiceTypes);
      }
    } catch (err) {
      console.error("Error fetching invoice types:", err);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoiceTypes();
  }, [fetchInvoiceTypes]);

  const handleOpenTypeModal = (typeItem?: InvoiceTypeSetting) => {
    if (typeItem) {
      setEditingTypeItem(typeItem);
      setTypeForm({
        id: typeItem.id,
        code: typeItem.code,
        label: typeItem.label,
        invoice_title: typeItem.invoice_title,
        description: typeItem.description || "",
        status: typeItem.status,
        sort_order: typeItem.sort_order || 0,
      });
    } else {
      setEditingTypeItem(null);
      setTypeForm({
        id: 0,
        code: "",
        label: "",
        invoice_title: "",
        description: "",
        status: "active",
        sort_order: (invoiceTypesList.length + 1) * 10,
      });
    }
    setIsTypeModalOpen(true);
  };

  const handleSaveTypeForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.label.trim() || !typeForm.invoice_title.trim()) {
      alert("Please enter both Label Name and Invoice Title.");
      return;
    }
    setSavingType(true);
    try {
      const method = typeForm.id ? "PUT" : "POST";
      const res = await fetch("/api/settings/invoice-types", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed");

      setSuccessMsg(typeForm.id ? "Invoice type updated successfully!" : "New invoice type created successfully!");
      setIsTypeModalOpen(false);
      fetchInvoiceTypes();
    } catch (err: any) {
      alert(`Error saving invoice type: ${err.message}`);
    } finally {
      setSavingType(false);
    }
  };

  const handleDeactivateType = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this invoice type?")) return;
    try {
      const res = await fetch(`/api/settings/invoice-types?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Deactivation failed");
      setSuccessMsg("Invoice type deactivated!");
      fetchInvoiceTypes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Fetch Profile, Addresses, & Multiple Logos
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

  // Handle Logo Upload to S3 (Multiple Logos)
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
      alert(`Logo upload failed: ${err.message}`);
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

  // Address Management Helpers
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

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSuccessMsg(null);
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

      setSuccessMsg("Invoice Profile & Multiple Logos saved successfully!");
      fetchProfile();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Navigation */}
      <HeaderNav onRefresh={fetchProfile} loadingRefresh={loading} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-8">
        
        {/* Banner & Profile Switcher */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-2 bg-red-600" />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold uppercase tracking-wider">
                Dubai UAE Invoice Profile Configuration
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Company & Team Branding Profile
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Configure company TRN numbers, multiple Dubai/UAE addresses, official S3 invoice logos, banking details, and PDF templates for admin or individual sales teams.
            </p>
          </div>

          {/* Profile Switcher Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setProfileType("ADMIN");
                setSelectedTeamId("");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                profileType === "ADMIN"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Admin Default Profile
            </button>

            <button
              type="button"
              onClick={() => {
                setProfileType("TEAM");
                if (teams.length > 0) setSelectedTeamId(String(teams[0].id));
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                profileType === "TEAM"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Team-Specific Profile
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

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
              &times;
            </button>
          </div>
        )}

        {loading || !profile ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <span className="text-xs font-semibold">Loading Profile Configuration...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            
            {/* 1. Core Profile Details & TRN */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4">
                <Building className="w-5 h-5 text-red-600" />
                Corporate Identification & Tax Registration (TRN)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">Company Name on Invoice</label>
                  <input
                    type="text"
                    required
                    value={profile.company_name}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">UAE TRN / Tax Number</label>
                  <input
                    type="text"
                    placeholder="100XXXXXXXXX003"
                    value={profile.trn_number || ""}
                    onChange={(e) => setProfile({ ...profile, trn_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">Invoice Template Theme</label>
                  <select
                    value={profile.template_style}
                    onChange={(e) => setProfile({ ...profile, template_style: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="modern_slate">Modern Slate & Red (Recommended)</option>
                    <option value="dubai_luxury_gold">Dubai Luxury Gold</option>
                    <option value="corporate_minimal">Corporate Minimalist White</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">Invoice Currency</label>
                  <select
                    value={profile.currency}
                    onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="AED">AED - United Arab Emirates Dirham</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="PHP">PHP - Philippine Peso</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">VAT / Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profile.tax_percentage}
                    onChange={(e) => setProfile({ ...profile, tax_percentage: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">Payment Terms</label>
                  <input
                    type="text"
                    value={profile.payment_terms || ""}
                    onChange={(e) => setProfile({ ...profile, payment_terms: e.target.value })}
                    placeholder="Due upon receipt"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* 2. Official S3 Multiple Invoice Logos Uploader */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-red-600" />
                    S3 Invoice Logo Assets ({logos.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload multiple brand logos to S3 and select which one should be used as the default header logo.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors">
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Uploading to S3...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload New Logo to S3
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Logos Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {logos.length === 0 ? (
                  <div className="col-span-full p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-400">
                    No logos uploaded yet. Click "Upload New Logo to S3" above to add your official brand assets.
                  </div>
                ) : (
                  logos.map((logo, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                        logo.is_default ? "bg-red-50/20 border-red-300 ring-2 ring-red-600/20" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="w-full h-24 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center relative">
                        {/* Native img tag to avoid remotePattern restriction issues on user custom S3 URLs */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logo.s3_url}
                          alt={logo.logo_name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 truncate block text-[11px]" title={logo.logo_name}>
                            {logo.logo_name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLogo(index)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {logo.is_default ? (
                          <span className="w-full py-1 bg-red-600 text-white font-bold text-[10px] rounded-lg block text-center uppercase tracking-wider">
                            Default Logo
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDefaultLogo(index)}
                            className="w-full py-1 bg-white hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-300 transition-colors block text-center"
                          >
                            Set as Default Logo
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Multiple Addresses Management (Default Address Selection) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  Multiple Office Addresses ({addresses.length})
                </h2>
                <button
                  type="button"
                  onClick={addAddress}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Address
                </button>
              </div>

              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                    No addresses configured. Click "Add New Address" above.
                  </div>
                ) : (
                  addresses.map((addr, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-2xl border transition-all space-y-4 ${
                        addr.is_default
                          ? "bg-red-50/20 border-red-300"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={addr.address_label}
                            onChange={(e) => {
                              const updated = [...addresses];
                              updated[index].address_label = e.target.value;
                              setAddresses(updated);
                            }}
                            placeholder="Address Label (e.g. Dubai Office)"
                            className="font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs"
                          />
                          {addr.is_default && (
                            <span className="px-2.5 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded-full uppercase">
                              Default Invoice Address
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => setDefaultAddress(index)}
                              className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeAddress(index)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <input
                          type="text"
                          value={addr.building_name || ""}
                          onChange={(e) => {
                            const updated = [...addresses];
                            updated[index].building_name = e.target.value;
                            setAddresses(updated);
                          }}
                          placeholder="Building Name / Tower"
                          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                        />
                        <input
                          type="text"
                          required
                          value={addr.street_address}
                          onChange={(e) => {
                            const updated = [...addresses];
                            updated[index].street_address = e.target.value;
                            setAddresses(updated);
                          }}
                          placeholder="Street Address *"
                          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                        />
                        <input
                          type="text"
                          value={addr.area_locality || ""}
                          onChange={(e) => {
                            const updated = [...addresses];
                            updated[index].area_locality = e.target.value;
                            setAddresses(updated);
                          }}
                          placeholder="Area / Locality (Business Bay)"
                          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                        />
                        <input
                          type="text"
                          value={addr.city}
                          onChange={(e) => {
                            const updated = [...addresses];
                            updated[index].city = e.target.value;
                            setAddresses(updated);
                          }}
                          placeholder="City (Dubai)"
                          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                        />
                        <input
                          type="text"
                          value={addr.country}
                          onChange={(e) => {
                            const updated = [...addresses];
                            updated[index].country = e.target.value;
                            setAddresses(updated);
                          }}
                          placeholder="Country (United Arab Emirates)"
                          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                        />
                        <input
                          type="text"
                          value={addr.po_box || ""}
                          onChange={(e) => {
                            const updated = [...addresses];
                            updated[index].po_box = e.target.value;
                            setAddresses(updated);
                          }}
                          placeholder="PO Box (e.g. PO Box 12345)"
                          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 4. UAE Banking Details */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4">
                <Landmark className="w-5 h-5 text-red-600" />
                Bank Transfer & Wire Particulars (UAE Bank Accounts)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">Bank Name</label>
                  <input
                    type="text"
                    value={profile.bank_name || ""}
                    onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                    placeholder="Emirates NBD / Mashreq Bank"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">Account Name</label>
                  <input
                    type="text"
                    value={profile.account_name || ""}
                    onChange={(e) => setProfile({ ...profile, account_name: e.target.value })}
                    placeholder="Leuterio Realty LLC"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">IBAN Number</label>
                  <input
                    type="text"
                    value={profile.iban || ""}
                    onChange={(e) => setProfile({ ...profile, iban: e.target.value })}
                    placeholder="AE480260000001234567890"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-slate-700">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    value={profile.swift_code || ""}
                    onChange={(e) => setProfile({ ...profile, swift_code: e.target.value })}
                    placeholder="EBILAEAD"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* 5. Invoice Types & Header Titles Settings (Database) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-600" />
                    Invoice Types & Upper Right Titles (Database Settings)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage invoice types, editable label names, upper right canvas titles, and default descriptions stored directly in `commissions_hub`.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenTypeModal()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Invoice Type
                </button>
              </div>

              {loadingTypes ? (
                <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                  Loading Invoice Types from Database...
                </div>
              ) : invoiceTypesList.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-medium">
                  No invoice types found in database. Click &quot;Add Invoice Type&quot; above to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase">
                        <th className="p-3 rounded-l-xl">Type Code</th>
                        <th className="p-3">Label Name</th>
                        <th className="p-3">Upper Right Title (Invoice Header)</th>
                        <th className="p-3">Default Particular Description</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right rounded-r-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceTypesList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {item.code}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {item.label}
                          </td>
                          <td className="p-3 font-black text-red-700 uppercase tracking-wide">
                            {item.invoice_title}
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">
                            {item.description || "—"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                item.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenTypeModal(item)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                title="Edit Invoice Type Settings"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {item.status === "active" && (
                                <button
                                  type="button"
                                  onClick={() => handleDeactivateType(item.id)}
                                  className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                  title="Deactivate Type"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Invoice Profile Settings
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Modal: Add / Edit Invoice Type */}
        {isTypeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {editingTypeItem ? "Edit Invoice Type" : "Add New Invoice Type"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Changes persist directly to `commissions_hub` database.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTypeForm} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Label Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tax Invoice, Service Fee Statement"
                    value={typeForm.label}
                    onChange={(e) => setTypeForm({ ...typeForm, label: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Invoice Upper Right Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TAX INVOICE, SERVICE FEE INVOICE"
                    value={typeForm.invoice_title}
                    onChange={(e) => setTypeForm({ ...typeForm, invoice_title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-black tracking-wider uppercase rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This exact text appears at the top right header of the generated PDF/Canvas invoice.
                  </p>
                </div>

                {!editingTypeItem && (
                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">
                      Type Code / Slug (Unique)
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generated from label if left blank (e.g. TAX_INVOICE)"
                      value={typeForm.code}
                      onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Default Particular Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Default description displayed on invoice items/particulars"
                    value={typeForm.description}
                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Status</label>
                    <select
                      value={typeForm.status}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, status: e.target.value as "active" | "inactive" })
                      }
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red-600"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={typeForm.sort_order}
                      onChange={(e) => setTypeForm({ ...typeForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTypeModalOpen(false)}
                    className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingType}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {savingType ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingTypeItem ? "Update Invoice Type" : "Create Invoice Type"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
