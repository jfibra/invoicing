"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import { LogOut, Users, Layers } from "lucide-react";

interface AuthUser {
  id: number;
  memberId: number | null;
  memberCode: string | null;
  name: string;
  email: string;
  roleId: number | null;
  roleName: string;
  teamName: string | null;
  isTeamLeader: boolean;
  subteamName: string | null;
  isSubteamLeader: boolean;
}

// Solid-fill SVG Icons (no gradients)
const SalesIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2563EB" />
    <rect x="17" y="32" width="7" height="12" rx="2" fill="#93C5FD" opacity="0.7" />
    <rect x="28" y="24" width="7" height="20" rx="2" fill="#93C5FD" opacity="0.9" />
    <rect x="39" y="16" width="7" height="28" rx="2" fill="white" />
    <path d="M18 28L28 20L36 24L46 14" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 14H46V20" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExpensesIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#DC2626" />
    <rect x="18" y="16" width="28" height="32" rx="4" fill="white" opacity="0.95" />
    <path d="M24 24H40" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 30H36" stroke="#F87171" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 36H32" stroke="#F87171" strokeWidth="3" strokeLinecap="round" />
    <circle cx="40" cy="38" r="9" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" />
    <path d="M40 33.5V42.5M37.5 36H42.5" stroke="#854D0E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const TrnLibraryIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#0891B2" />
    <path d="M16 20C16 18.3431 17.3431 17 19 17H29L33 21H45C46.6569 21 48 22.3431 48 24V43C48 44.6569 46.6569 46 45 46H19C17.3431 46 16 44.6569 16 43V20Z" fill="white" opacity="0.9" />
    <rect x="22" y="27" width="20" height="13" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
    <path d="M26 31H38M26 36H34" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CommissionsIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#059669" />
    <circle cx="28" cy="28" r="12" fill="#FDE047" stroke="white" strokeWidth="2" />
    <text x="28" y="33" textAnchor="middle" fill="#713F12" fontSize="13" fontWeight="900" fontFamily="sans-serif">%</text>
    <circle cx="40" cy="38" r="11" fill="#FDE047" stroke="white" strokeWidth="2" />
    <text x="40" y="43" textAnchor="middle" fill="#713F12" fontSize="13" fontWeight="900" fontFamily="sans-serif">$</text>
    <path d="M16 46C20 40 28 42 34 38" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CashAdvancesIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#D97706" />
    <rect x="16" y="24" width="32" height="20" rx="4" fill="white" />
    <circle cx="32" cy="34" r="5" fill="#D97706" />
    <path d="M20 28H24M40 40H44" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 14L38 20H26L32 14Z" fill="#FEF08A" stroke="white" strokeWidth="1.5" />
  </svg>
);

const InvoiceProfileIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#7C3AED" />
    <rect x="18" y="16" width="28" height="32" rx="5" fill="white" />
    <circle cx="32" cy="27" r="5" fill="#7C3AED" />
    <path d="M24 40C24 36 27.5 35 32 35C36.5 35 40 36 40 40" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22 20H26" stroke="#DDD6FE" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 sm:w-20 sm:h-20">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#475569" />
    <path d="M32 22C26.4772 22 22 26.4772 22 32C22 37.5228 26.4772 42 32 42C37.5228 42 42 37.5228 42 32C42 26.4772 37.5228 22 32 22ZM32 38C28.6863 38 26 35.3137 26 32C26 28.6863 28.6863 26 32 26C35.3137 26 38 28.6863 38 32C38 35.3137 35.3137 38 32 38Z" fill="white" />
    <path d="M34 16H30V20H34V16ZM34 44H30V48H34V44ZM48 30V34H44V30H48ZM20 30V34H16V30H20ZM42.5 18.5L39.5 21.5L42.5 24.5L45.5 21.5L42.5 18.5ZM21.5 39.5L18.5 42.5L21.5 45.5L24.5 42.5L21.5 39.5ZM42.5 45.5L45.5 42.5L42.5 39.5L39.5 42.5L42.5 45.5ZM21.5 24.5L24.5 21.5L21.5 18.5L18.5 21.5L21.5 24.5Z" fill="#CBD5E1" />
  </svg>
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch("/api/auth/login");
        if (!res.ok) { router.push("/"); return; }
        const data = await res.json();
        if (data.authenticated) { setUser(data.user); } else { router.push("/"); }
      } catch { router.push("/"); } finally { setLoading(false); }
    }
    loadUserData();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }
    catch (err) { console.error("Logout error:", err); }
    finally { setLoggingOut(false); }
  };

  if (loading) return <PageLoader label="Loading Kiosk Dashboard..." />;
  if (!user) return null;

  const roleUpper = user.roleName.toUpperCase();

  const kioskButtons = [
    { title: "Sales", description: "Manage Sales & Revenue Ledger", href: "/invoices/sales", icon: SalesIcon, accentBorder: "hover:border-blue-500", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
    { title: "Expenses", description: "Log & Track Operational Expenses", href: "/invoices/expenses", icon: ExpensesIcon, accentBorder: "hover:border-red-500", badgeColor: "bg-red-50 text-red-700 border-red-200" },
    { title: "TRN Library", description: "Tax Registration Records & Files", href: "/trn-library", icon: TrnLibraryIcon, accentBorder: "hover:border-cyan-500", badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    { title: "Commissions", description: "Issue & View Commission Invoices", href: "/invoices", icon: CommissionsIcon, accentBorder: "hover:border-emerald-500", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { title: "Cash Advances", description: "Agent Advances & Vouchers", href: "/invoices/cash-advances", icon: CashAdvancesIcon, accentBorder: "hover:border-amber-500", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
    { title: "Invoice Profile", description: "TRN, Banking & Company Logos", href: "/invoices/profile", icon: InvoiceProfileIcon, accentBorder: "hover:border-purple-500", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
    { title: "Settings", description: "System & Account Preferences", href: "/settings", icon: SettingsIcon, accentBorder: "hover:border-slate-500", badgeColor: "bg-slate-100 text-slate-700 border-slate-300" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Bar */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image src="/fhi.png" alt="Filipino Homes | Leuterio Realty" width={220} height={60} className="object-contain h-12 w-auto" priority />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-[11px]">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{roleUpper}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Welcome Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_0_#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-600 rounded-l-3xl" />
          <div className="pl-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                {roleUpper}
              </span>
              {user.teamName && (
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-slate-500" />
                  {user.teamName}
                  {user.isTeamLeader && <span className="text-amber-600 font-bold ml-1">(Team Leader)</span>}
                </span>
              )}
              {user.subteamName && (
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-slate-500" />
                  {user.subteamName}
                  {user.isSubteamLeader && <span className="text-blue-600 font-bold ml-1">(Unit Leader)</span>}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Select a module below to get started &bull; Member ID:{" "}
              <span className="font-mono font-bold text-slate-700">{user.memberCode || `#${user.id}`}</span>
            </p>
          </div>

          <div className="pl-4 sm:pl-0 hidden md:block">
            <span className="font-mono text-[10px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>

        {/* Kiosk Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {kioskButtons.map((btn) => {
            const IconComponent = btn.icon;
            return (
              <Link
                key={btn.title}
                href={btn.href}
                className={`group relative bg-white border-2 border-slate-200 rounded-3xl p-7 flex flex-col items-center justify-center text-center transition-all duration-150 shadow-[0_8px_0_0_#CBD5E1] hover:shadow-[0_12px_0_0_#94A3B8] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_0_#CBD5E1] cursor-pointer ${btn.accentBorder}`}
              >
                <div className="mb-5 transform transition-transform duration-200 group-hover:scale-105">
                  <IconComponent />
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1.5 group-hover:text-slate-700 transition-colors">
                  {btn.title}
                </h2>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mb-5">
                  {btn.description}
                </p>
                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${btn.badgeColor}`}>
                  Open Module →
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-5 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} FHI Global Property LLC &bull; All rights reserved
      </footer>
    </div>
  );
}
