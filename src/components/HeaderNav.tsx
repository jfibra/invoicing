"use client";

import React, { useState, useEffect } from "react";
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
  FileText,
  Search,
  Sun,
  Moon,
  Stamp,
} from "lucide-react";
import CommandPalette from "@/components/CommandPalette";

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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMac, setIsMac] = useState(true);

  // Detect OS for shortcut display & initialize dark mode state
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Listen for global custom event to open command palette
  useEffect(() => {
    const handleOpen = () => setCommandPaletteOpen(true);
    window.addEventListener("open-command-palette", handleOpen);
    return () => window.removeEventListener("open-command-palette", handleOpen);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Commission Invoices", href: "/invoices", icon: FilePlus },
    { label: "Cash Advances", href: "/invoices/cash-advances", icon: Coins },
    { label: "Stamp & Seals", href: "/stamp-generator", icon: Stamp },
    { label: "TRN Library", href: "/trn-library", icon: FileText },
    { label: "Teams", href: "/teams", icon: Users },
    { label: "Invoice Profiles", href: "/invoices/profile", icon: Settings },
    { label: "System Settings", href: "/settings", icon: Settings },
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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center shrink-0">
              <Image
                src="/fhi.png"
                alt="Filipino Homes | Leuterio Realty"
                width={160}
                height={44}
                className="object-contain h-8 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/invoices");
                const isExactInvoice = item.href === "/invoices" && pathname === "/invoices";
                const isCurrent = item.href === "/invoices" ? isExactInvoice : isActive;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                      isCurrent
                        ? "bg-red-600 text-white font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side: Command Palette, Theme Toggle, Refresh, User Profile & Sign Out */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Command Palette Trigger Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer shadow-2xs"
              title={`Open Command Palette (${isMac ? "⌘K" : "Ctrl+K"})`}
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xl:inline">Search app...</span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                {isMac ? "⌘K" : "Ctrl+K"}
              </kbd>
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loadingRefresh}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRefresh ? "animate-spin text-red-600" : ""}`} />
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs border-l border-slate-200 dark:border-slate-800 pl-3">
                <div className="flex flex-col text-right">
                  <span className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{user.roleName || "Admin"}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:border-red-200 text-slate-700 dark:text-slate-300 hover:text-red-600 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? "Out..." : "Sign Out"}</span>
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loadingRefresh}
                className="p-2 rounded-lg border border-slate-200 text-slate-600"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRefresh ? "animate-spin text-red-600" : ""}`} />
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/invoices");
            const isExactInvoice = item.href === "/invoices" && pathname === "/invoices";
            const isCurrent = item.href === "/invoices" ? isExactInvoice : isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full p-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2.5 ${
                  isCurrent
                    ? "bg-red-600 text-white font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {user && (
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{user.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{user.roleName}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Command Palette Component */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </header>
  );
}
