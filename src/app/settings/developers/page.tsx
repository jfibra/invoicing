"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  AlertCircle,
  Save,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function DevelopersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isAddMode = searchParams.get("mode") === "add";

  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    tin_number: "",
    address: "",
    city: "Dubai",
    country: "United Arab Emirates",
    status: "active" as "active" | "inactive",
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchDevelopers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ search });
      const res = await fetch(`/api/developers?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.developers) {
        setDevelopers(data.developers);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  useEffect(() => {
    if (editId && developers.length > 0) {
      const target = developers.find((d) => String(d.id) === String(editId));
      if (target) {
        setFormData({
          name: target.name || "",
          code: target.code || "",
          tin_number: target.tin_number || "",
          address: target.address || "",
          city: target.city || "Dubai",
          country: target.country || "United Arab Emirates",
          status: target.status || "active",
        });
      }
    }
  }, [editId, developers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const isEdit = Boolean(editId);
      const url = isEdit ? `/api/developers/${editId}` : "/api/developers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Property Developer ${isEdit ? "updated" : "created"} successfully!`);
        setTimeout(() => {
          router.push("/settings/developers");
          fetchDevelopers();
        }, 1000);
      } else {
        setErrorMsg(data.error || "Failed to save developer profile");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to deactivate developer profile "${name}"?`)) return;
    try {
      const res = await fetch(`/api/developers/${id}`, { method: "DELETE" });
      if (res.ok) fetchDevelopers();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && developers.length === 0) {
    return <PageLoader label="Loading Developers..." />;
  }

  // ADD / EDIT VIEW
  if (isAddMode || editId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
        <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings/developers"
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
            >
              <BigBackIcon />
              <span>Back to Developers</span>
            </Link>
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
            {editId ? `Edit Developers #${editId}` : `New Developers`}
          </span>
        </div>
      </div>

        <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-8">
            <div className="border-b border-slate-200 pb-6 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-emerald-600" />
                {editId ? "Edit Property Developer Profile" : "Add Property Developer Partner"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Configure real estate developer partners for project linkages and sales invoicing.</p>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Developer Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEV-EMAAR"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">TIN / TRN Number</label>
                  <input
                    type="text"
                    placeholder="100234567800003"
                    value={formData.tin_number}
                    onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Developer Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emaar Properties PJSC"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Office Address</label>
                  <textarea
                    rows={2}
                    placeholder="Building 1, Emaar Square, Downtown Dubai"
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
                  <label className="block text-xs font-bold text-slate-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <Link href="/settings/developers" className="px-6 py-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-[0_3px_0_0_#E2E8F0] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#065F46] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Developer"}</span>
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FHI Global Property LLC • Developers
        </footer>
      </div>
    );
  }

  // DIRECTORY VIEW
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
            >
              <BigBackIcon />
              <span>Settings Hub</span>
            </Link>
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
            Developers Module
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Building2 className="w-7 h-7 text-emerald-600" />
                Property Developer Partners
              </h2>
              <p className="text-xs text-slate-500 font-medium">Directory of real estate developer companies.</p>
            </div>

            <Link
              href="/settings/developers?mode=add"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-[0_3px_0_0_#065F46] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Developer</span>
            </Link>
          </div>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search developer name, code or TIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">Dev Code</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">TRN / TIN Number</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {developers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No developers found.
                    </td>
                  </tr>
                ) : (
                  developers.map((dev) => (
                    <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-mono font-extrabold text-emerald-700">{dev.code}</td>
                      <td className="py-4 px-4 font-black text-slate-900">{dev.name}</td>
                      <td className="py-4 px-4 font-mono text-slate-700">{dev.tin_number || "—"}</td>
                      <td className="py-4 px-4 text-slate-600">{dev.city ? `${dev.city}, ${dev.country}` : dev.country}</td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/settings/developers?edit=${dev.id}`} className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-[11px] flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                          <button onClick={() => handleDelete(dev.id, dev.name)} className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600">
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
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Developers
      </footer>
    </div>
  );
}


export default function DevelopersPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Settings..." />}>
      <DevelopersContent />
    </Suspense>
  );
}
