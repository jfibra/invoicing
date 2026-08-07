"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sliders, ChevronLeft } from "lucide-react";

// Solid-fill SVG Icons (no gradients)
const InvoiceTypeKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#DC2626" />
    <path d="M20 18H36L44 26V46H20V18Z" fill="white" opacity="0.9" />
    <path d="M26 30H38M26 36H34" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CategoriesKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2563EB" />
    <path d="M20 22H44M20 32H38M20 42H32" stroke="white" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const FileCatKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#7C3AED" />
    <path d="M22 18H36L44 26V46H22V18Z" fill="white" opacity="0.9" />
    <path d="M30 32L38 32M30 38L36 38" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const DevKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#059669" />
    <path d="M20 46V22L32 16L44 22V46H20ZM26 28H30V32H26V28ZM34 28H38V32H34V28ZM26 36H30V40H26V36ZM34 36H38V40H34V36Z" fill="white" />
  </svg>
);

const PrjKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#D97706" />
    <path d="M18 44V26L32 18L46 26V44H18ZM28 34H36V44H28V34Z" fill="white" />
  </svg>
);

const ExpenseCatKioskIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#0891B2" />
    <path d="M20 20H44V44H20V20Z" fill="white" opacity="0.9" />
    <path d="M26 26H38M26 32H34M26 38H30" stroke="#0891B2" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default function SettingsHubPage() {
  const settingsModules = [
    { title: "Invoice Document Types", description: "Configure PDF header titles, label names & description defaults.", href: "/settings/invoice-types", icon: InvoiceTypeKioskIcon, borderColor: "hover:border-red-500", badgeColor: "bg-red-50 text-red-700 border-red-200" },
    { title: "Expense Categories", description: "Manage VAT Recoverable, Blocked & Mixed-Use expense categories & subcategories.", href: "/settings/expense-categories", icon: ExpenseCatKioskIcon, borderColor: "hover:border-cyan-500", badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    { title: "Invoice Categories", description: "Manage Sales & Purchase accounting classification codes.", href: "/settings/categories", icon: CategoriesKioskIcon, borderColor: "hover:border-blue-500", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
    { title: "File Attachment Types", description: "Configure mandatory & optional document upload types.", href: "/settings/file-categories", icon: FileCatKioskIcon, borderColor: "hover:border-purple-500", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
    { title: "Property Developers", description: "Manage UAE & PH real estate developer partner profiles.", href: "/settings/developers", icon: DevKioskIcon, borderColor: "hover:border-emerald-500", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { title: "Real Estate Projects", description: "Manage off-plan and ready development project listings.", href: "/settings/projects", icon: PrjKioskIcon, borderColor: "hover:border-amber-500", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Bar */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            System Settings
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_0_#E2E8F0] relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-slate-800 rounded-l-3xl" />
          <div className="pl-4">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">System Configuration & Settings</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Select a settings module to view, add, or edit accounting categories, document types, developer partners, and property projects.
            </p>
          </div>
        </div>

        {/* Kiosk Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {settingsModules.map((mod) => {
            const IconComp = mod.icon;
            return (
              <Link
                key={mod.title}
                href={mod.href}
                className={`group bg-white border-2 border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer ${mod.borderColor}`}
              >
                <div className="mb-5 transform transition-transform duration-200 group-hover:scale-105">
                  <IconComp />
                </div>
                <h2 className="text-lg font-black text-slate-900 mb-2 tracking-tight">{mod.title}</h2>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mb-5 max-w-xs">{mod.description}</p>
                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${mod.badgeColor}`}>
                  Manage Module →
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-5 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} FHI Global Property LLC &bull; System Settings
      </footer>
    </div>
  );
}
