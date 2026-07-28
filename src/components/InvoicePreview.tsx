"use client";

import React from "react";
import { Invoice, calculateSubtotal, calculateTax, calculateTotal } from "@/types/invoice";
import { Download, CheckCircle2, Clock, AlertTriangle, FileEdit, Printer, X, Building, Mail, MapPin } from "lucide-react";

interface InvoicePreviewProps {
  invoice: Invoice;
  onClose?: () => void;
  onMarkPaid?: (id: string) => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onClose, onMarkPaid }) => {
  const subtotal = calculateSubtotal(invoice.items);
  const tax = calculateTax(subtotal, invoice.taxRate);
  const total = calculateTotal(subtotal, tax, invoice.discount);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (invoice.status) {
      case "Paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Pending Payment
          </span>
        );
      case "Overdue":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <FileEdit className="w-3.5 h-3.5" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl text-slate-200">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800 print:hidden">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white tracking-tight">{invoice.invoiceNumber}</h2>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2">
          {invoice.status !== "Paid" && onMarkPaid && (
            <button
              onClick={() => onMarkPaid(invoice.id)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark as Paid
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document Header */}
      <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base">
              I
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Invoicing Inc.</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            100 Tech Hub Blvd, Suite 400<br />
            San Francisco, CA 94105<br />
            support@invoicing.app
          </p>
        </div>

        <div className="md:text-right space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Invoice Reference</span>
          <h1 className="text-2xl font-black text-white font-mono">{invoice.invoiceNumber}</h1>
          <div className="text-xs text-slate-400 space-y-0.5 pt-1">
            <p><span className="text-slate-500">Issued:</span> {invoice.issueDate}</p>
            <p><span className="text-slate-500">Due Date:</span> {invoice.dueDate}</p>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="my-8 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-2">Billed To</span>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-400" />
          {invoice.clientName}
        </h3>
        <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
          <Mail className="w-3.5 h-3.5 text-slate-500" />
          {invoice.clientEmail}
        </p>
        {invoice.clientAddress && (
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            {invoice.clientAddress}
          </p>
        )}
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Item & Description</th>
              <th className="py-3 px-4 text-center">Qty</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {invoice.items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-200">{item.description}</td>
                <td className="py-3.5 px-4 text-center text-slate-400 font-mono">{item.quantity}</td>
                <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                  ${item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right font-semibold text-white font-mono">
                  ${(item.quantity * item.unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Breakdown */}
      <div className="mt-6 flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1 text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
          <span className="font-semibold text-slate-300 block mb-1">Notes & Terms:</span>
          <p>{invoice.notes || "Payment is due according to the agreed terms. Thank you for your business!"}</p>
        </div>

        <div className="w-full md:w-64 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal:</span>
            <span>${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>

          {invoice.discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount:</span>
              <span>-${invoice.discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-400">
            <span>Tax ({invoice.taxRate}%):</span>
            <span>${tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-bold text-white">
            <span>Total:</span>
            <span className="text-indigo-400">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
