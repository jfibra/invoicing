"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeaderNav from "@/components/HeaderNav";
import {
  LogOut,
  User,
  Shield,
  Building,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Briefcase,
  Layers,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Search,
  LayoutDashboard,
  FilePlus,
  Settings,
  History,
  Eye,
  Sparkles,
  ArrowUpRight,
  Award,
  Receipt,
  Loader2,
  RefreshCw,
  Coins,
} from "lucide-react";

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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Live Dashboard Analytics State
  const [stats, setStats] = useState<any>({
    total_invoices: 0,
    total_net: 0,
    total_vat: 0,
    total_gross: 0,
    total_members: 0,
    total_teams: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [topTeams, setTopTeams] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Load Session User & Dashboard Stats
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch("/api/auth/login");
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);

          // Fetch Live Statistics
          try {
            const statsRes = await fetch("/api/dashboard/stats");
            const statsData = await statsRes.json();
            if (statsRes.ok) {
              setStats(statsData.stats || {});
              setRecentInvoices(statsData.recent_invoices || []);
              setTopTeams(statsData.top_teams || []);
            }
          } catch (e) {
            console.error("Failed to load dashboard stats:", e);
          } finally {
            setStatsLoading(false);
          }
        } else {
          router.push("/");
        }
      } catch (err) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [router]);

  // Handle Refresh Stats
  const handleRefreshStats = async () => {
    setStatsLoading(true);
    try {
      const statsRes = await fetch("/api/dashboard/stats");
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setStats(statsData.stats || {});
        setRecentInvoices(statsData.recent_invoices || []);
        setTopTeams(statsData.top_teams || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-900 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleUpper = user.roleName.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <HeaderNav user={user} onRefresh={handleRefreshStats} loadingRefresh={statsLoading} />

      {/* Main Role-Based Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-8">
        
        {/* Welcome Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-2 bg-red-600" />
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                {roleUpper}
              </span>
              {user.teamName && (
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {user.teamName}
                  {user.isTeamLeader && <span className="text-amber-600 font-bold">(Team Leader)</span>}
                </span>
              )}
              {user.subteamName && (
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  {user.subteamName}
                  {user.isSubteamLeader && <span className="text-blue-600 font-bold">(Unit Leader)</span>}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Member ID: {user.memberCode || `#${user.id}`} • Account Status: Active
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshStats}
              disabled={statsLoading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh Dashboard Metrics"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${statsLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/invoices/cash-advances"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>Cash Advances</span>
            </Link>
            <Link
              href="/invoices"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>Issue New Invoice</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LIVE SYSTEM KPI METRICS GRID */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Real-Time System & Commission Analytics
            </h2>
            <span className="text-xs font-bold text-slate-500">
              Live Database Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Gross Invoice Volume */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Commission Volume</span>
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                AED {Number(stats.total_gross || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Total payable invoice volume</p>
            </div>

            {/* KPI 2: Net Commission Volume */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Net Commission Subtotal</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                AED {Number(stats.total_net || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Before 5% VAT calculations</p>
            </div>

            {/* KPI 3: Total VAT Collected */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total VAT Collected</span>
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-red-600 font-mono">
                AED {Number(stats.total_vat || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Tax compliance records</p>
            </div>

            {/* KPI 4: Total Generated Invoices */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Generated Invoices</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {stats.total_invoices || 0}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Invoices saved in database</p>
            </div>
          </div>
        </div>

        {/* 2-COLUMN SECTION: RECENT INVOICES & TOP SALES TEAMS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Recent Saved Invoices Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-red-600" />
                Recent Saved Invoices Activity Feed
              </h3>
              <Link
                href="/invoices"
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <span>View Full Tracker</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Agent Name</th>
                    <th className="py-3 px-4">Developer</th>
                    <th className="py-3 px-4 text-right">Gross Total (AED)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No recent invoices generated yet. Click "Issue New Invoice" to start!
                      </td>
                    </tr>
                  ) : (
                    recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold font-mono text-slate-900 block">
                            {inv.invoice_number}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {inv.issued_date ? new Date(inv.issued_date).toISOString().slice(0, 10) : "N/A"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {inv.agent_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {inv.developer_name || "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          AED {Number(inv.gross_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href="/invoices"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors"
                          >
                            <Eye className="w-3 h-3 text-red-500" />
                            <span>View Canvas</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right 1 Col: Top Performing Sales Teams Leaderboard */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top Sales Teams
              </h3>
              <Link href="/teams" className="text-xs font-bold text-slate-500 hover:text-slate-900">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {topTeams.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Team volume data will appear here as deal invoices are generated.
                </p>
              ) : (
                topTeams.map((team, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-slate-200 text-slate-700"
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 block">{team.team_name}</span>
                        <span className="text-[10px] text-slate-500">{team.invoice_count} deal invoices</span>
                      </div>
                    </div>

                    <span className="font-bold font-mono text-slate-900">
                      AED {Number(team.total_volume || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Modules */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Quick Portal Administrative Modules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/invoices" className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-600 transition-colors flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-red-600 font-bold">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">Issue Invoices</h4>
                  <p className="text-xs text-slate-500 font-medium">Issue & download canvas PDFs</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/invoices/cash-advances" className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-600 transition-colors flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-red-600 font-bold">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">Agent Cash Advances</h4>
                  <p className="text-xs text-slate-500 font-medium">Issue, log repayments & vouchers</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/invoices" className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-600 transition-colors flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">Invoices Tracker</h4>
                  <p className="text-xs text-slate-500 font-medium">Search & regenerate saved DB records</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/invoices/profile" className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-600 transition-colors flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-red-600 font-bold">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">Invoice Profile</h4>
                  <p className="text-xs text-slate-500 font-medium">TRN, S3 Logos & Wire Banking</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </main>

      {/* Clean White Footer */}
      <footer className="w-full bg-white border-t border-slate-200 px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          © {new Date().getFullYear()} Leuterio Realty & Brokerage. All rights reserved.
        </div>
        <div className="flex items-center gap-6 font-medium">
          <a href="https://leuteriorealty.com" target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-700 font-mono font-semibold">
            leuteriorealty.com
          </a>
        </div>
      </footer>
    </div>
  );
}
