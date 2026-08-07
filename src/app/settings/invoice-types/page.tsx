"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
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

function InvoiceTypesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isAddMode = searchParams.get("mode") === "add";

  const [invoiceTypes, setInvoiceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    code: "",
    label: "",
    invoice_title: "",
    description: "",
    status: "active" as "active" | "inactive",
    sort_order: 10,
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchInvoiceTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/invoice-types");
      const data = await res.json();
      if (res.ok && data.invoiceTypes) {
        setInvoiceTypes(data.invoiceTypes);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoiceTypes();
  }, [fetchInvoiceTypes]);

  useEffect(() => {
    if (editId && invoiceTypes.length > 0) {
      const target = invoiceTypes.find((item) => String(item.id) === String(editId));
      if (target) {
        setFormData({
          id: target.id,
          code: target.code || "",
          label: target.label || "",
          invoice_title: target.invoice_title || "",
          description: target.description || "",
          status: target.status || "active",
          sort_order: target.sort_order || 10,
        });
      }
    }
  }, [editId, invoiceTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const isEdit = Boolean(editId);
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch("/api/settings/invoice-types", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Invoice type ${isEdit ? "updated" : "created"} successfully!`);
        setTimeout(() => {
          router.push("/settings/invoice-types");
          fetchInvoiceTypes();
        }, 1000);
      } else {
        setErrorMsg(data.error || "Failed to save invoice type setting");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, label: string) => {
    if (!confirm(`Are you sure you want to deactivate invoice type "${label}"?`)) return;
    try {
      const res = await fetch(`/api/settings/invoice-types?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchInvoiceTypes();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTypes = invoiceTypes.filter((t) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      t.label?.toLowerCase().includes(term) ||
      t.code?.toLowerCase().includes(term) ||
      t.invoice_title?.toLowerCase().includes(term)
    );
  });

  if (loading && invoiceTypes.length === 0) {
    return <PageLoader label="Loading Invoice Types..." />;
  }

  // ADD / EDIT VIEW
  if (isAddMode || editId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
        <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings/invoice-types"
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
            >
              <BigBackIcon />
              <span>Back to Invoice Types</span>
            </Link>
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
            {editId ? `Edit Invoice Types #${editId}` : `New Invoice Types`}
          </span>
        </div>
      </div>

        <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-8">
            <div className="border-b border-slate-200 pb-6 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-600" />
                {editId ? "Edit Invoice Document Type" : "Add Invoice Document Type"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Configure document titles, descriptions, and header formats for generated invoices.</p>
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
                  <label className="block text-xs font-bold text-slate-700 mb-2">Label Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tax Invoice, Service Fee Statement"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Invoice Upper Right Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TAX INVOICE, SERVICE FEE INVOICE"
                    value={formData.invoice_title}
                    onChange={(e) => setFormData({ ...formData, invoice_title: e.target.value.toUpperCase() })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold uppercase tracking-wider focus:bg-white focus:border-red-600 outline-none"
                  />
                </div>

                {!editId && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Type Code / Slug (Unique)</label>
                    <input
                      type="text"
                      placeholder="Auto-generated if left blank (e.g. TAX_INVOICE)"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-red-600 outline-none"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Default Description Particular</label>
                  <textarea
                    rows={3}
                    placeholder="Default description displayed on invoice items"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-red-600 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <Link href="/settings/invoice-types" className="px-6 py-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-[0_3px_0_0_#E2E8F0] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#B91C1C] active:translate-y-1 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Invoice Type"}</span>
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FHI Global Property LLC • Invoice Types
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
            Invoice Types Module
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <FileText className="w-7 h-7 text-red-600" />
                Invoice Document Type Settings
              </h2>
              <p className="text-xs text-slate-500 font-medium">Manage invoice titles, description defaults, and header labels.</p>
            </div>

            <Link
              href="/settings/invoice-types?mode=add"
              className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#B91C1C] flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Invoice Type</span>
            </Link>
          </div>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search invoice label or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-red-600 outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">Code Slug</th>
                  <th className="py-3 px-4">Label Name</th>
                  <th className="py-3 px-4">Upper Right PDF Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No invoice type settings found.
                    </td>
                  </tr>
                ) : (
                  filteredTypes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-mono font-extrabold text-red-700">{item.code}</td>
                      <td className="py-4 px-4 font-black text-slate-900">{item.label}</td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-800">{item.invoice_title}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/settings/invoice-types?edit=${item.id}`} className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-extrabold text-[11px] flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                          <button onClick={() => handleDelete(item.id, item.label)} className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600">
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
        © {new Date().getFullYear()} FHI Global Property LLC • Invoice Types
      </footer>
    </div>
  );
}


export default function InvoiceTypesPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Settings..." />}>
      <InvoiceTypesContent />
    </Suspense>
  );
}
