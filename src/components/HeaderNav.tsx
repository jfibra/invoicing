"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  Coins,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Building,
} from "lucide-react";

interface HeaderNavProps {
  user?: {
    name: string;
    email: string;
    roleName: string;
  } | null;
  onRefresh?: () => void;
  loadingRefresh?: boolean;
}

export default function HeaderNav({ user, onRefresh, loadingRefresh }: HeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Commission Invoices", href: "/invoices", icon: FilePlus },
    { label: "Cash Advances", href: "/invoices/cash-advances", icon: Coins },
    { label: "Teams & Units", href: "/teams", icon: Users },
    { label: "Invoice Profile", href: "/invoices/profile", icon: Settings },
  ];

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

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/fhi.png"
                alt="Filipino Homes | Leuterio Realty"
                width={180}
                height={50}
                className="object-contain h-9 w-auto hover:opacity-90 transition-opacity"
                priority
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/invoices");
                const isExactInvoice = item.href === "/invoices" && pathname === "/invoices";
                const isCurrent = item.href === "/invoices" ? isExactInvoice : isActive;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isCurrent
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-white" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side: Refresh, User Profile & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loadingRefresh}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRefresh ? "animate-spin text-red-600" : ""}`} />
              </button>
            )}

            {user && (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="flex flex-col items-end text-xs">
                  <span className="font-bold text-slate-900 leading-tight">{user.name}</span>
                  <span className="text-[10px] font-semibold text-slate-500">{user.roleName}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? "Out..." : "Sign Out"}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loadingRefresh}
                className="p-2 rounded-xl border border-slate-200 text-slate-600"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRefresh ? "animate-spin text-red-600" : ""}`} />
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  isActive
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            {user && (
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">{user.name}</span>
                <span className="text-[10px] text-slate-500">{user.roleName}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
