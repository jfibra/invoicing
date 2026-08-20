"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FilePlus,
  Coins,
  FileText,
  Users,
  Settings,
  Plus,
  Building2,
  FolderKanban,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Quick Action" | "Invoice Search";
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
  subtitle?: string;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [invoiceResults, setInvoiceResults] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect OS for shortcut display
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }
  }, []);

  // Keyboard Event Listener for Shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search invoices dynamically when search string is entered
  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setInvoiceResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingInvoices(true);
      try {
        const res = await fetch(`/api/invoices?search=${encodeURIComponent(search.trim())}&limit=5`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.invoices)) {
          setInvoiceResults(data.invoices);
        }
      } catch (err) {
        console.error("Command palette invoice search error:", err);
      } finally {
        setLoadingInvoices(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // Define Navigation Items
  const navigationItems: CommandItem[] = [
    {
      id: "nav-dashboard",
      title: "Dashboard",
      subtitle: "Overview & Site KPIs",
      category: "Navigation",
      icon: LayoutDashboard,
      action: () => {
        router.push("/dashboard");
        onClose();
      },
    },
    {
      id: "nav-invoices",
      title: "Commission Invoices",
      subtitle: "Generate & View Saved Invoices",
      category: "Navigation",
      icon: FilePlus,
      action: () => {
        router.push("/invoices");
        onClose();
      },
    },
    {
      id: "nav-cash-advances",
      title: "Cash Advances",
      subtitle: "Track Payout Deductions & Balance",
      category: "Navigation",
      icon: Coins,
      action: () => {
        router.push("/invoices/cash-advances");
        onClose();
      },
    },
    {
      id: "nav-trn",
      title: "TRN Library",
      subtitle: "Developer & Client Tax Registration Numbers",
      category: "Navigation",
      icon: FileText,
      action: () => {
        router.push("/trn-library");
        onClose();
      },
    },
    {
      id: "nav-teams",
      title: "Teams & Members",
      subtitle: "Manage Sales Organization & Leader Splits",
      category: "Navigation",
      icon: Users,
      action: () => {
        router.push("/teams");
        onClose();
      },
    },
    {
      id: "nav-profiles",
      title: "Invoice Profiles",
      subtitle: "Default Senders & Agent Credentials",
      category: "Navigation",
      icon: Settings,
      action: () => {
        router.push("/invoices/profile");
        onClose();
      },
    },
    {
      id: "nav-settings",
      title: "System Settings",
      subtitle: "Developers, Projects & Invoice Types",
      category: "Navigation",
      icon: Settings,
      action: () => {
        router.push("/settings");
        onClose();
      },
    },
  ];

  // Define Quick Actions
  const quickActions: CommandItem[] = [
    {
      id: "action-new-invoice",
      title: "Create New Commission Invoice",
      subtitle: "Launch Tax Invoice Canvas Builder",
      category: "Quick Action",
      icon: Plus,
      action: () => {
        router.push("/invoices");
        onClose();
      },
    },
    {
      id: "action-new-cash-advance",
      title: "Record New Cash Advance",
      subtitle: "Issue payout deduction to agent",
      category: "Quick Action",
      icon: Coins,
      action: () => {
        router.push("/invoices/cash-advances");
        onClose();
      },
    },
    {
      id: "action-add-trn",
      title: "Add TRN Library Record",
      subtitle: "Register new developer tax registration",
      category: "Quick Action",
      icon: FileText,
      action: () => {
        router.push("/trn-library?mode=ADD");
        onClose();
      },
    },
    {
      id: "action-manage-developers",
      title: "Manage Developers",
      subtitle: "Update developer registry in settings",
      category: "Quick Action",
      icon: Building2,
      action: () => {
        router.push("/settings/developers");
        onClose();
      },
    },
    {
      id: "action-manage-projects",
      title: "Manage Projects",
      subtitle: "Add or edit property development projects",
      category: "Quick Action",
      icon: FolderKanban,
      action: () => {
        router.push("/settings/projects");
        onClose();
      },
    },
  ];

  // Map fetched invoices into CommandItem format
  const dynamicInvoiceItems: CommandItem[] = invoiceResults.map((inv) => ({
    id: `inv-${inv.id}`,
    title: `Invoice #${inv.invoice_number}`,
    subtitle: `${inv.agent_name} • ${inv.developer_name || 'N/A'} • ${inv.currency || 'AED'} ${Number(inv.gross_amount || 0).toLocaleString()}`,
    category: "Invoice Search",
    icon: FilePlus,
    action: () => {
      router.push(`/invoices?search=${encodeURIComponent(inv.invoice_number)}`);
      onClose();
    },
  }));

  // Filter items based on query
  const query = search.trim().toLowerCase();

  const filteredNav = navigationItems.filter(
    (item) => item.title.toLowerCase().includes(query) || item.subtitle?.toLowerCase().includes(query)
  );

  const filteredActions = quickActions.filter(
    (item) => item.title.toLowerCase().includes(query) || item.subtitle?.toLowerCase().includes(query)
  );

  const allFilteredItems: CommandItem[] = [
    ...dynamicInvoiceItems,
    ...filteredNav,
    ...filteredActions,
  ];

  // Handle Keyboard Navigation (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allFilteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allFilteredItems.length) % (allFilteredItems.length || 1));
    } else if (e.key === "Enter" && allFilteredItems[selectedIndex]) {
      e.preventDefault();
      allFilteredItems[selectedIndex].action();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, actions, agent names, or invoice numbers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 font-mono">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-4 max-h-[60vh]">
          {loadingInvoices && (
            <div className="py-4 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-red-600" />
              <span>Searching invoice database...</span>
            </div>
          )}

          {allFilteredItems.length === 0 && !loadingInvoices ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No matching commands or invoices found</p>
              <p className="text-[11px] text-slate-400">Try searching for "Invoice", "Tax", "Agent", or "Settings"</p>
            </div>
          ) : (
            <>
              {/* Dynamic Invoice Results Section */}
              {dynamicInvoiceItems.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Database Invoice Matches ({dynamicInvoiceItems.length})</span>
                  </div>
                  {dynamicInvoiceItems.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full px-3 py-2.5 rounded-2xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-red-600 text-white font-bold shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{item.title}</span>
                            <span className={`text-[10px] block truncate ${isSelected ? "text-red-100" : "text-slate-400"}`}>{item.subtitle}</span>
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-300 dark:text-slate-600"}`} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Navigation Items Section */}
              {filteredNav.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Navigation Pages
                  </div>
                  {filteredNav.map((item, idx) => {
                    const actualIdx = dynamicInvoiceItems.length + idx;
                    const isSelected = selectedIndex === actualIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(actualIdx)}
                        className={`w-full px-3 py-2.5 rounded-2xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-red-600 font-bold shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{item.title}</span>
                            <span className={`text-[10px] block truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`}>{item.subtitle}</span>
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-300 dark:text-slate-600"}`} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Quick Actions Section */}
              {filteredActions.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Quick Actions
                  </div>
                  {filteredActions.map((item, idx) => {
                    const actualIdx = dynamicInvoiceItems.length + filteredNav.length + idx;
                    const isSelected = selectedIndex === actualIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(actualIdx)}
                        className={`w-full px-3 py-2.5 rounded-2xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white font-bold shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{item.title}</span>
                            <span className={`text-[10px] block truncate ${isSelected ? "text-blue-100" : "text-slate-400"}`}>{item.subtitle}</span>
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-300 dark:text-slate-600"}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3 font-mono">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">↵</kbd> select
            </span>
          </div>
          <div className="font-semibold flex items-center gap-1">
            <span>Shortcut:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
