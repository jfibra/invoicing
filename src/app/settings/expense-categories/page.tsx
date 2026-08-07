"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FolderTree,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  Tag,
  Layers,
  Filter,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ExpenseCategoryRecord {
  id: number;
  category_name: string;
  subcategory_name: string;
  vat_treatment: string;
  description: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export default function ExpenseCategoriesSettingsPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Expense Categories..." />}>
      <ExpenseCategoriesContent />
    </Suspense>
  );
}

function ExpenseCategoriesContent() {
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [vatFilter, setVatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryRecord | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [vatTreatment, setVatTreatment] = useState("Recoverable");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [submitting, setSubmitting] = useState(false);

  // Fetch expense categories
  const fetchExpenseCategories = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (vatFilter) query.set("vat_treatment", vatFilter);
      if (statusFilter) query.set("status", statusFilter);

      const res = await fetch(`/api/expense-categories?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.expense_categories) {
        setCategories(data.expense_categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, vatFilter, statusFilter]);

  useEffect(() => {
    fetchExpenseCategories();
  }, [fetchExpenseCategories]);

  // Open modal for Create / Edit
  const handleOpenModal = (record?: ExpenseCategoryRecord) => {
    if (record) {
      setEditingCategory(record);
      setCategoryName(record.category_name);
      setSubcategoryName(record.subcategory_name);
      setVatTreatment(record.vat_treatment);
      setDescription(record.description || "");
      setStatus(record.status);
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setSubcategoryName("");
      setVatTreatment("Recoverable");
      setDescription("");
      setStatus("active");
    }
    setShowModal(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !subcategoryName.trim()) {
      alert("Category name and Subcategory name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const method = editingCategory ? "PUT" : "POST";
      const payload = {
        id: editingCategory?.id,
        category_name: categoryName,
        subcategory_name: subcategoryName,
        vat_treatment: vatTreatment,
        description,
        status,
      };

      const res = await fetch("/api/expense-categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save expense category");

      setShowModal(false);
      fetchExpenseCategories();
    } catch (err: any) {
      alert(`Save Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete category
  const handleDelete = async (id: number, subcatName: string) => {
    if (!confirm(`Are you sure you want to delete '${subcatName}'?`)) return;

    try {
      const res = await fetch(`/api/expense-categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchExpenseCategories();
      } else {
        const data = await res.json();
        alert(`Delete failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/settings"
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
          >
            <BigBackIcon />
            <span className="font-extrabold text-sm text-slate-800 group-hover:text-red-600">Back to Settings</span>
          </Link>

          <Image src="/fhi.png" alt="Filipino Homes" width={180} height={50} className="object-contain h-14 w-auto hidden sm:block" priority />
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
          VAT Expense Checklist
        </span>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <FolderTree className="w-8 h-8 text-cyan-600" />
                Expense Categories & Subcategories
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Manage Dubai/UAE FTA VAT Expense Checklist categories, subcategories, treatment rules, and descriptions.
              </p>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#0891B2] flex items-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense Category</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search category, subcategory, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <select
                value={vatFilter}
                onChange={(e) => setVatFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-cyan-600 outline-none"
              >
                <option value="">All VAT Treatments</option>
                <option value="Recoverable">Recoverable (Claim Input VAT)</option>
                <option value="Blocked">Blocked (Non-Recoverable)</option>
                <option value="Mixed-Use">Mixed-Use (Apportionment)</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-cyan-600 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Categories Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-3.5 px-4">Main Category</th>
                  <th className="py-3.5 px-4">Subcategory</th>
                  <th className="py-3.5 px-4">VAT Treatment</th>
                  <th className="py-3.5 px-4">Description / Details</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">Loading expense categories...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">No expense categories found matching your filters.</td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-black text-slate-900">{cat.category_name}</td>
                      <td className="py-4 px-4 font-bold text-cyan-800">{cat.subcategory_name}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            cat.vat_treatment === "Recoverable"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : cat.vat_treatment === "Blocked"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {cat.vat_treatment}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 max-w-xs truncate" title={cat.description || ""}>
                        {cat.description || "—"}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                            cat.status === "active" ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {cat.status === "active" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span className="capitalize">{cat.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(cat)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.subcategory_name)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs cursor-pointer"
                            title="Delete Category"
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
      </main>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900">
                {editingCategory ? "Edit Expense Category" : "Add New Expense Category"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Main Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OFFICE & ADMINISTRATIVE"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Office Rent"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">VAT Treatment</label>
                  <select
                    value={vatTreatment}
                    onChange={(e) => setVatTreatment(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-cyan-600"
                  >
                    <option value="Recoverable">Recoverable</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Mixed-Use">Mixed-Use</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-cyan-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Examples</label>
                <textarea
                  rows={3}
                  placeholder="e.g. VAT-registered landlord charging 5%"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 font-bold text-slate-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Expense Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Settings Module
      </footer>
    </div>
  );
}
