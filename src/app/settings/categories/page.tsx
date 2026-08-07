"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FolderTree,
  Plus,
  Search,
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  AlertCircle,
  Tag,
  ChevronRight,
  ChevronLeft,
  Save,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function CategoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isAddMode = searchParams.get("mode") === "add";

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "SALES" | "PURCHASE">("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "SALES" as "SALES" | "PURCHASE",
    description: "",
    status: "active" as "active" | "inactive",
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        include_deleted: includeDeleted ? "true" : "false",
        search,
      });
      if (typeFilter) query.set("type", typeFilter);

      const res = await fetch(`/api/categories?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, includeDeleted]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Load single record if editing
  useEffect(() => {
    if (editId && categories.length > 0) {
      const target = categories.find((c) => String(c.id) === String(editId));
      if (target) {
        setFormData({
          name: target.name || "",
          code: target.code || "",
          type: target.type || "SALES",
          description: target.description || "",
          status: target.status || "active",
        });
      }
    }
  }, [editId, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const isEdit = Boolean(editId);
      const url = isEdit ? `/api/categories/${editId}` : "/api/categories";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Category ${isEdit ? "updated" : "created"} successfully!`);
        setTimeout(() => {
          router.push("/settings/categories");
          fetchCategories();
        }, 1000);
      } else {
        setErrorMsg(data.error || "Failed to save category");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to deactivate category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && categories.length === 0) {
    return <PageLoader label="Loading Categories..." />;
  }

  // ADD / EDIT FORM VIEW
  if (isAddMode || editId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
        <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings/categories"
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
            >
              <BigBackIcon />
              <span>Back to Categories</span>
            </Link>
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
            {editId ? `Edit Categories #${editId}` : `New Categories`}
          </span>
        </div>
      </div>

        <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-8">
            <div className="border-b border-slate-200 pb-6 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                <FolderTree className="w-8 h-8 text-blue-600" />
                {editId ? "Edit Invoice Category" : "Add Invoice Category"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Configure classification codes for Sales or Purchase invoices.</p>
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
                  <label className="block text-xs font-bold text-slate-700 mb-2">Invoice Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-400 focus:outline-none transition-all shadow-xs"
                  >
                    <option value="SALES">Sales Invoice (Revenue)</option>
                    <option value="PURCHASE">Purchase Invoice (Expense / Asset)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Category Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. COMM-REAL"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Real Estate Sales Commission"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-400 focus:outline-none transition-all shadow-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter purpose of this accounting classification category..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-400 focus:outline-none transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-400 focus:outline-none transition-all shadow-xs"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <Link href="/settings/categories" className="px-6 py-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-[0_3px_0_0_#E2E8F0] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#1E40AF] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FHI Global Property LLC • Categories
        </footer>
      </div>
    );
  }

  // DIRECTORY / LIST VIEW
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
            Categories Module
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <FolderTree className="w-7 h-7 text-blue-600" />
                Invoice Accounting Categories
              </h2>
              <p className="text-xs text-slate-500 font-medium">Manage Sales and Purchase invoice classification codes.</p>
            </div>

            <Link
              href="/settings/categories?mode=add"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-[0_3px_0_0_#1E40AF] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search category name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-slate-400 focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-slate-400 focus:outline-none transition-all shadow-xs"
              >
                <option value="">All Types (Sales & Purchase)</option>
                <option value="SALES">Sales Categories</option>
                <option value="PURCHASE">Purchase Categories</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">Category Code</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No categories found. Click "Add Category" to create one!
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-mono font-extrabold text-blue-700">{cat.code}</td>
                      <td className="py-4 px-4 font-black text-slate-900">{cat.name}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${cat.type === "SALES" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                          {cat.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${cat.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {cat.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/settings/categories?edit=${cat.id}`} className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-[11px] flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                          <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600">
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
        © {new Date().getFullYear()} FHI Global Property LLC • Categories
      </footer>
    </div>
  );
}


export default function CategoriesPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Settings..." />}>
      <CategoriesContent />
    </Suspense>
  );
}
