"use client";

import React, { useState, useMemo } from "react";
import { initialInvoices } from "@/data/mockInvoices";
import { Invoice, InvoiceStatus, calculateSubtotal, calculateTax, calculateTotal } from "@/types/invoice";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceForm } from "@/components/InvoiceForm";
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Download,
  Receipt,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  
  // Modals & Active State
  const [activePreview, setActivePreview] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Analytics Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    invoices.forEach((inv) => {
      const subtotal = calculateSubtotal(inv.items);
      const tax = calculateTax(subtotal, inv.taxRate);
      const total = calculateTotal(subtotal, tax, inv.discount);

      if (inv.status === "Paid") {
        totalRevenue += total;
      } else if (inv.status === "Pending") {
        pendingAmount += total;
      } else if (inv.status === "Overdue") {
        overdueAmount += total;
      }
    });

    return {
      totalRevenue,
      pendingAmount,
      overdueAmount,
      totalCount: invoices.length,
      paidCount: invoices.filter((i) => i.status === "Paid").length,
    };
  }, [invoices]);

  // Filtered List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === "All" || inv.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, selectedStatus]);

  // Actions
  const handleMarkPaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "Paid" } : inv))
    );
    if (activePreview?.id === id) {
      setActivePreview((prev) => (prev ? { ...prev, status: "Paid" } : null));
    }
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      if (activePreview?.id === id) setActivePreview(null);
    }
  };

  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((i) => i.id === invoice.id);
      if (exists) {
        return prev.map((i) => (i.id === invoice.id ? invoice : i));
      }
      return [invoice, ...prev];
    });
    setIsFormOpen(false);
    setEditingInvoice(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-900/30">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Invoicing
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Next.js App
                </span>
              </h1>
              <p className="text-xs text-slate-400">Modern Financial Operations & Client Billing</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingInvoice(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ${metrics.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              {metrics.paidCount} paid invoices
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Revenue</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ${metrics.pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-2">
              Awaiting client payment
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Overdue Balance</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ${metrics.overdueAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-rose-400 flex items-center gap-1 mt-2">
              Requires follow-up
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Invoices</span>
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{metrics.totalCount}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
              Active ledger entries
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice number, client name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            {["All", "Paid", "Pending", "Overdue", "Draft"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedStatus === status
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Table List */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Invoice</th>
                  <th className="py-4 px-6">Client</th>
                  <th className="py-4 px-6">Due Date</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const subtotal = calculateSubtotal(inv.items);
                    const tax = calculateTax(subtotal, inv.taxRate);
                    const total = calculateTotal(subtotal, tax, inv.discount);

                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="py-4 px-6 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-200">{inv.clientName}</div>
                          <div className="text-[11px] text-slate-500">{inv.clientEmail}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-mono">{inv.dueDate}</td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-white">
                          ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {inv.status === "Paid" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          )}
                          {inv.status === "Pending" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {inv.status === "Overdue" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                          {inv.status === "Draft" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              <FileText className="w-3 h-3" /> Draft
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-x-1">
                          <button
                            onClick={() => setActivePreview(inv)}
                            title="View Invoice"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingInvoice(inv);
                              setIsFormOpen(true);
                            }}
                            title="Edit Invoice"
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            title="Delete Invoice"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Invoice View Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full my-8">
            <InvoicePreview
              invoice={activePreview}
              onClose={() => setActivePreview(null)}
              onMarkPaid={handleMarkPaid}
            />
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full my-8">
            <InvoiceForm
              initialData={editingInvoice}
              onSave={handleSaveInvoice}
              onClose={() => {
                setIsFormOpen(false);
                setEditingInvoice(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
