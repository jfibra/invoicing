"use client";

import React, { useState } from "react";
import { Invoice, InvoiceItem, InvoiceStatus } from "@/types/invoice";
import { Plus, Trash2, X, Save, Calculator } from "lucide-react";

interface InvoiceFormProps {
  initialData?: Invoice | null;
  onSave: (invoice: Invoice) => void;
  onClose: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, onSave, onClose }) => {
  const [clientName, setClientName] = useState(initialData?.clientName || "");
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || "");
  const [clientAddress, setClientAddress] = useState(initialData?.clientAddress || "");
  const [issueDate, setIssueDate] = useState(
    initialData?.issueDate || new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<InvoiceStatus>(initialData?.status || "Pending");
  const [taxRate, setTaxRate] = useState<number>(initialData?.taxRate ?? 10);
  const [discount, setDiscount] = useState<number>(initialData?.discount ?? 0);
  const [notes, setNotes] = useState(initialData?.notes || "");

  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items || [
      { id: "item-" + Date.now(), description: "Software Development Services", quantity: 1, unitPrice: 1500 },
    ]
  );

  const addItem = () => {
    setItems([
      ...items,
      { id: "item-" + Date.now(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) {
      alert("Please provide client name and email.");
      return;
    }

    const newInvoice: Invoice = {
      id: initialData?.id || "inv-" + Date.now(),
      invoiceNumber: initialData?.invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName,
      clientEmail,
      clientAddress,
      issueDate,
      dueDate,
      status,
      currency: "USD",
      taxRate: Number(taxRate) || 0,
      discount: Number(discount) || 0,
      items,
      notes,
    };

    onSave(newInvoice);
  };

  const subtotal = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const tax = (subtotal * (taxRate || 0)) / 100;
  const total = Math.max(0, subtotal + tax - (discount || 0));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-slate-100 max-w-4xl w-full mx-auto shadow-2xl">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">
            {initialData ? "Edit Invoice" : "Create New Invoice"}
          </h2>
          <p className="text-xs text-slate-400">Fill in client details, items, and tax rates below.</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Client details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Client Name *
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Client Email *
            </label>
            <input
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="e.g. billing@acme.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Client Address
            </label>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Street address, City, Country"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Dates & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Issue Date
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Invoice Line Items */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Line Items
            </span>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none font-mono"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                  className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-right text-white focus:outline-none font-mono"
                />
                <span className="w-24 text-right text-xs font-mono font-semibold text-slate-200">
                  ${((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  disabled={items.length <= 1}
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Notes & Terms
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment instructions or special notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span className="text-white">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Tax Rate (%):</span>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Discount ($):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs text-white focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm text-white">
              <span>Calculated Total:</span>
              <span className="text-indigo-400">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-900/40 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
};
