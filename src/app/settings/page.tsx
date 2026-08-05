"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import HeaderNav from "@/components/HeaderNav";
import {
  FolderTree,
  Paperclip,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  FileCheck,
  Check,
  Tag,
  Sliders,
  Sparkles,
  Loader2,
  Info,
  Building2,
  Building,
  Star,
  MapPin,
  Briefcase,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-xs text-slate-500 font-bold">
          <Loader2 className="w-6 h-6 animate-spin text-red-600 mr-2" />
          Loading System Settings...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<"categories" | "file_categories" | "developers" | "projects">("categories");

  // -------------------------------------------------------------
  // STATE: Categories Management
  // -------------------------------------------------------------
  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catTypeFilter, setCatTypeFilter] = useState<"" | "SALES" | "PURCHASE">("");
  const [catSearch, setCatSearch] = useState("");
  const [catIncludeDeleted, setCatIncludeDeleted] = useState(false);

  // Modal State: Add/Edit Category
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [catName, setCatName] = useState("");
  const [catCode, setCatCode] = useState("");
  const [catType, setCatType] = useState<"SALES" | "PURCHASE">("SALES");
  const [catDesc, setCatDesc] = useState("");
  const [catStatus, setCatStatus] = useState<"active" | "inactive">("active");
  const [catSaving, setCatSaving] = useState(false);

  // -------------------------------------------------------------
  // STATE: Invoice File Categories Management
  // -------------------------------------------------------------
  const [fileCategories, setFileCategories] = useState<any[]>([]);
  const [fileCatLoading, setFileCatLoading] = useState(false);
  const [fileCatTypeFilter, setFileCatTypeFilter] = useState<"" | "SALES" | "PURCHASE">("");
  const [fileCatSearch, setFileCatSearch] = useState("");
  const [fileCatIncludeDeleted, setFileCatIncludeDeleted] = useState(false);

  // Modal State: Add/Edit File Category
  const [fileCatModalOpen, setFileCatModalOpen] = useState(false);
  const [editingFileCat, setEditingFileCat] = useState<any | null>(null);
  const [fileCatName, setFileCatName] = useState("");
  const [fileCatCode, setFileCatCode] = useState("");
  const [fileCatType, setFileCatType] = useState<"SALES" | "PURCHASE">("SALES");
  const [fileCatDesc, setFileCatDesc] = useState("");
  const [fileCatIsRequired, setFileCatIsRequired] = useState(false);
  const [fileCatStatus, setFileCatStatus] = useState<"active" | "inactive">("active");
  const [fileCatSaving, setFileCatSaving] = useState(false);

  // -------------------------------------------------------------
  // STATE: Property Developers Management
  // -------------------------------------------------------------
  const [developers, setDevelopers] = useState<any[]>([]);
  const [devLoading, setDevLoading] = useState(false);
  const [devSearch, setDevSearch] = useState("");
  const [devIncludeDeleted, setDevIncludeDeleted] = useState(false);

  // Modal State: Add/Edit Developer
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<any | null>(null);
  const [devName, setDevName] = useState("");
  const [devCode, setDevCode] = useState("");
  const [devTin, setDevTin] = useState("");
  const [devAddress, setDevAddress] = useState("");
  const [devCity, setDevCity] = useState("Dubai");
  const [devCountry, setDevCountry] = useState("United Arab Emirates");
  const [devStatus, setDevStatus] = useState<"active" | "inactive">("active");
  const [devSaving, setDevSaving] = useState(false);

  // -------------------------------------------------------------
  // STATE: Real Estate Projects Management
  // -------------------------------------------------------------
  const [projects, setProjects] = useState<any[]>([]);
  const [prjLoading, setPrjLoading] = useState(false);
  const [prjDevFilter, setPrjDevFilter] = useState("");
  const [prjSearch, setPrjSearch] = useState("");
  const [prjIncludeDeleted, setPrjIncludeDeleted] = useState(false);

  // Modal State: Add/Edit Project
  const [prjModalOpen, setPrjModalOpen] = useState(false);
  const [editingPrj, setEditingPrj] = useState<any | null>(null);
  const [prjDevId, setPrjDevId] = useState<number | "">("");
  const [prjName, setPrjName] = useState("");
  const [prjCode, setPrjCode] = useState("");
  const [prjLocation, setPrjLocation] = useState("");
  const [prjType, setPrjType] = useState("Residential");
  const [prjCompletion, setPrjCompletion] = useState("Off-Plan");
  const [prjStatus, setPrjStatus] = useState<"active" | "inactive">("active");
  const [prjSaving, setPrjSaving] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // -------------------------------------------------------------
  // API FETCH: Categories
  // -------------------------------------------------------------
  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const query = new URLSearchParams({
        include_deleted: catIncludeDeleted ? "true" : "false",
        search: catSearch,
      });
      if (catTypeFilter) query.set("type", catTypeFilter);

      const res = await fetch(`/api/categories?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load categories");
    } finally {
      setCatLoading(false);
    }
  }, [catTypeFilter, catSearch, catIncludeDeleted]);

  // -------------------------------------------------------------
  // API FETCH: Invoice File Categories
  // -------------------------------------------------------------
  const fetchFileCategories = useCallback(async () => {
    setFileCatLoading(true);
    try {
      const query = new URLSearchParams({
        include_deleted: fileCatIncludeDeleted ? "true" : "false",
        search: fileCatSearch,
      });
      if (fileCatTypeFilter) query.set("type", fileCatTypeFilter);

      const res = await fetch(`/api/invoice-file-categories?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.categories) {
        setFileCategories(data.categories);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load invoice file categories");
    } finally {
      setFileCatLoading(false);
    }
  }, [fileCatTypeFilter, fileCatSearch, fileCatIncludeDeleted]);

  // -------------------------------------------------------------
  // API FETCH: Property Developers
  // -------------------------------------------------------------
  const fetchDevelopers = useCallback(async () => {
    setDevLoading(true);
    try {
      const query = new URLSearchParams({
        include_deleted: devIncludeDeleted ? "true" : "false",
        search: devSearch,
      });

      const res = await fetch(`/api/developers?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.developers) {
        setDevelopers(data.developers);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load developers");
    } finally {
      setDevLoading(false);
    }
  }, [devSearch, devIncludeDeleted]);

  // -------------------------------------------------------------
  // API FETCH: Real Estate Projects
  // -------------------------------------------------------------
  const fetchProjects = useCallback(async () => {
    setPrjLoading(true);
    try {
      const query = new URLSearchParams({
        include_deleted: prjIncludeDeleted ? "true" : "false",
        search: prjSearch,
      });
      if (prjDevFilter) query.set("developer_id", prjDevFilter);

      const res = await fetch(`/api/projects?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.projects) {
        setProjects(data.projects);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load projects");
    } finally {
      setPrjLoading(false);
    }
  }, [prjDevFilter, prjSearch, prjIncludeDeleted]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchFileCategories();
  }, [fetchFileCategories]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // -------------------------------------------------------------
  // HANDLERS: Project CRUD
  // -------------------------------------------------------------
  const handleOpenPrjModal = (prj?: any) => {
    if (prj) {
      setEditingPrj(prj);
      setPrjDevId(prj.developer_id || "");
      setPrjName(prj.project_name || "");
      setPrjCode(prj.project_code || "");
      setPrjLocation(prj.project_location || "");
      setPrjType(prj.project_type || "Residential");
      setPrjCompletion(prj.completion_status || "Off-Plan");
      setPrjStatus(prj.status || "active");
    } else {
      setEditingPrj(null);
      setPrjDevId(developers[0]?.id || "");
      setPrjName("");
      setPrjCode("");
      setPrjLocation("Business Bay, Dubai");
      setPrjType("Residential");
      setPrjCompletion("Off-Plan");
      setPrjStatus("active");
    }
    setPrjModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prjDevId || !prjName.trim() || !prjLocation.trim()) return;

    setPrjSaving(true);
    try {
      const method = editingPrj ? "PUT" : "POST";
      const payload = {
        id: editingPrj?.id,
        developer_id: Number(prjDevId),
        project_name: prjName.trim(),
        project_code: prjCode.trim(),
        project_location: prjLocation.trim(),
        project_type: prjType,
        completion_status: prjCompletion,
        status: prjStatus,
      };

      const res = await fetch("/api/projects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save project");

      showNotification("success", data.message || "Project saved successfully!");
      setPrjModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      showNotification("error", err.message || "Error saving project");
    } finally {
      setPrjSaving(false);
    }
  };

  const handleSoftDeleteProject = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to soft delete project '${name}'?`)) return;

    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project");

      showNotification("success", data.message || `Project '${name}' soft deleted`);
      fetchProjects();
    } catch (err: any) {
      showNotification("error", err.message || "Error deleting project");
    }
  };

  const handleRestoreProject = async (id: number) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "restore" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore project");

      showNotification("success", data.message || "Project restored successfully");
      fetchProjects();
    } catch (err: any) {
      showNotification("error", err.message || "Error restoring project");
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Developer CRUD
  // -------------------------------------------------------------
  const handleOpenDevModal = (dev?: any) => {
    if (dev) {
      setEditingDev(dev);
      setDevName(dev.name || "");
      setDevCode(dev.code || "");
      setDevTin(dev.tin_number || "");
      setDevAddress(dev.address || "");
      setDevCity(dev.city || "Dubai");
      setDevCountry(dev.country || "United Arab Emirates");
      setDevStatus(dev.status || "active");
    } else {
      setEditingDev(null);
      setDevName("");
      setDevCode("");
      setDevTin("100392817400003");
      setDevAddress("Business Bay, Downtown");
      setDevCity("Dubai");
      setDevCountry("United Arab Emirates");
      setDevStatus("active");
    }
    setDevModalOpen(true);
  };

  const handleSaveDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName.trim()) return;

    setDevSaving(true);
    try {
      const method = editingDev ? "PUT" : "POST";
      const payload = {
        id: editingDev?.id,
        name: devName.trim(),
        code: devCode.trim(),
        tin_number: devTin.trim(),
        address: devAddress.trim(),
        city: devCity.trim(),
        country: devCountry.trim(),
        status: devStatus,
      };

      const res = await fetch("/api/developers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save developer");

      showNotification("success", data.message || "Developer saved successfully!");
      setDevModalOpen(false);
      fetchDevelopers();
    } catch (err: any) {
      showNotification("error", err.message || "Error saving developer");
    } finally {
      setDevSaving(false);
    }
  };

  const handleSoftDeleteDeveloper = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to soft delete developer '${name}'?`)) return;

    try {
      const res = await fetch(`/api/developers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete developer");

      showNotification("success", data.message || `Developer '${name}' soft deleted`);
      fetchDevelopers();
    } catch (err: any) {
      showNotification("error", err.message || "Error deleting developer");
    }
  };

  const handleRestoreDeveloper = async (id: number) => {
    try {
      const res = await fetch("/api/developers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "restore" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore developer");

      showNotification("success", data.message || "Developer restored successfully");
      fetchDevelopers();
    } catch (err: any) {
      showNotification("error", err.message || "Error restoring developer");
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Category CRUD
  // -------------------------------------------------------------
  const handleOpenCatModal = (cat?: any) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name || "");
      setCatCode(cat.code || "");
      setCatType(cat.type || "SALES");
      setCatDesc(cat.description || "");
      setCatStatus(cat.status || "active");
    } else {
      setEditingCat(null);
      setCatName("");
      setCatCode("");
      setCatType("SALES");
      setCatDesc("");
      setCatStatus("active");
    }
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setCatSaving(true);
    try {
      const method = editingCat ? "PUT" : "POST";
      const payload = {
        id: editingCat?.id,
        name: catName.trim(),
        code: catCode.trim(),
        type: catType,
        description: catDesc.trim(),
        status: catStatus,
      };

      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");

      showNotification("success", data.message || "Category saved successfully!");
      setCatModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showNotification("error", err.message || "Error saving category");
    } finally {
      setCatSaving(false);
    }
  };

  const handleSoftDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to soft delete category '${name}'?`)) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category");

      showNotification("success", data.message || `Category '${name}' soft deleted`);
      fetchCategories();
    } catch (err: any) {
      showNotification("error", err.message || "Error deleting category");
    }
  };

  const handleRestoreCategory = async (id: number) => {
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "restore" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore category");

      showNotification("success", data.message || "Category restored successfully");
      fetchCategories();
    } catch (err: any) {
      showNotification("error", err.message || "Error restoring category");
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Invoice File Category CRUD
  // -------------------------------------------------------------
  const handleOpenFileCatModal = (cat?: any) => {
    if (cat) {
      setEditingFileCat(cat);
      setFileCatName(cat.name || "");
      setFileCatCode(cat.code || "");
      setFileCatType(cat.type || "SALES");
      setFileCatDesc(cat.description || "");
      setFileCatIsRequired(Boolean(cat.is_required));
      setFileCatStatus(cat.status || "active");
    } else {
      setEditingFileCat(null);
      setFileCatName("");
      setFileCatCode("");
      setFileCatType("SALES");
      setFileCatDesc("");
      setFileCatIsRequired(false);
      setFileCatStatus("active");
    }
    setFileCatModalOpen(true);
  };

  const handleSaveFileCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileCatName.trim()) return;

    setFileCatSaving(true);
    try {
      const method = editingFileCat ? "PUT" : "POST";
      const payload = {
        id: editingFileCat?.id,
        name: fileCatName.trim(),
        code: fileCatCode.trim(),
        type: fileCatType,
        description: fileCatDesc.trim(),
        is_required: fileCatIsRequired ? 1 : 0,
        status: fileCatStatus,
      };

      const res = await fetch("/api/invoice-file-categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save file category");

      showNotification("success", data.message || "Invoice file category saved successfully!");
      setFileCatModalOpen(false);
      fetchFileCategories();
    } catch (err: any) {
      showNotification("error", err.message || "Error saving file category");
    } finally {
      setFileCatSaving(false);
    }
  };

  const handleSoftDeleteFileCategory = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to soft delete file category '${name}'?`)) return;

    try {
      const res = await fetch(`/api/invoice-file-categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete file category");

      showNotification("success", data.message || `File category '${name}' soft deleted`);
      fetchFileCategories();
    } catch (err: any) {
      showNotification("error", err.message || "Error deleting file category");
    }
  };

  const handleRestoreFileCategory = async (id: number) => {
    try {
      const res = await fetch("/api/invoice-file-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "restore" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore file category");

      showNotification("success", data.message || "File category restored successfully");
      fetchFileCategories();
    } catch (err: any) {
      showNotification("error", err.message || "Error restoring file category");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <HeaderNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* NOTIFICATION ALERT */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-md transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* HERO TITLE SECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <Sliders className="w-3.5 h-3.5 text-red-600" />
            System & Accounting Settings
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Categories & Configuration Control Center
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Manage accounting transaction categories and document upload attachment rules for both Purchase and Sales invoices in Dubai accounting operations.
          </p>
        </div>

        {/* DASHBOARD KIOSK LARGE FEATURE BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KIOSK BUTTON 1: CATEGORIES */}
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`p-6 sm:p-8 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none relative overflow-hidden group ${
              activeTab === "categories"
                ? "bg-slate-900 text-white border-slate-900 shadow-xl ring-2 ring-slate-900/20"
                : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  activeTab === "categories"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                <FolderTree className="w-7 h-7" />
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  activeTab === "categories"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {categories.length} Categories Loaded
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight">1. Transaction Categories</h2>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  activeTab === "categories" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Configure sales revenue categories and purchase expense classification codes for financial reporting.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs font-bold">
              <span className={activeTab === "categories" ? "text-red-400" : "text-red-600"}>
                Manage Categories &rarr;
              </span>
            </div>
          </button>

          {/* KIOSK BUTTON 2: INVOICE FILE CATEGORIES */}
          <button
            type="button"
            onClick={() => setActiveTab("file_categories")}
            className={`p-6 sm:p-8 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none relative overflow-hidden group ${
              activeTab === "file_categories"
                ? "bg-slate-900 text-white border-slate-900 shadow-xl ring-2 ring-slate-900/20"
                : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  activeTab === "file_categories"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                <Paperclip className="w-7 h-7" />
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  activeTab === "file_categories"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {fileCategories.length} Attachment Rules
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight">2. Invoice File Categories</h2>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  activeTab === "file_categories" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Define mandatory and optional file attachment types (SPA, Receipts, TRN, Passports) required for invoices.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs font-bold">
              <span className={activeTab === "file_categories" ? "text-red-400" : "text-red-600"}>
                Manage File Categories &rarr;
              </span>
            </div>
          </button>

          {/* KIOSK BUTTON 3: PROPERTY DEVELOPERS */}
          <button
            type="button"
            onClick={() => setActiveTab("developers")}
            className={`p-6 sm:p-8 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none relative overflow-hidden group ${
              activeTab === "developers"
                ? "bg-slate-900 text-white border-slate-900 shadow-xl ring-2 ring-slate-900/20"
                : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  activeTab === "developers"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                <Building2 className="w-7 h-7" />
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  activeTab === "developers"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {developers.length} Developers Loaded
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight">3. Property Developers</h2>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  activeTab === "developers" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Manage registered property developer companies, TRN tax numbers, address, and contact records.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs font-bold">
              <span className={activeTab === "developers" ? "text-red-400" : "text-red-600"}>
                Manage Developers &rarr;
              </span>
            </div>
          </button>

          {/* KIOSK BUTTON 4: REAL ESTATE PROJECTS */}
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`p-6 sm:p-8 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none relative overflow-hidden group ${
              activeTab === "projects"
                ? "bg-slate-900 text-white border-slate-900 shadow-xl ring-2 ring-slate-900/20"
                : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  activeTab === "projects"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                <MapPin className="w-7 h-7" />
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  activeTab === "projects"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {projects.length} Projects Loaded
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight">4. Real Estate Projects</h2>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  activeTab === "projects" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Manage off-plan and ready development projects linked directly to registered developers.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs font-bold">
              <span className={activeTab === "projects" ? "text-red-400" : "text-red-600"}>
                Manage Projects &rarr;
              </span>
            </div>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: TRANSACTION CATEGORIES MANAGEMENT CONTROL          */}
        {/* ========================================================= */}
        {activeTab === "categories" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header & Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <FolderTree className="w-4 h-4 text-red-600" />
                  Categories Management
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Sales & Purchase Categories
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenCatModal()}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setCatTypeFilter("")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    catTypeFilter === ""
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  All Types ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatTypeFilter("SALES")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    catTypeFilter === "SALES"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  SALES ({categories.filter((c) => c.type === "SALES").length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatTypeFilter("PURCHASE")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    catTypeFilter === "PURCHASE"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  PURCHASE ({categories.filter((c) => c.type === "PURCHASE").length})
                </button>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search category name or code..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                  />
                </div>

                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={catIncludeDeleted}
                    onChange={(e) => setCatIncludeDeleted(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span>Show Soft-Deleted</span>
                </label>
              </div>
            </div>

            {/* Category Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Category Name</th>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {catLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-red-600" />
                        <span className="mt-2 block">Loading categories...</span>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No categories found. Click "+ Add New Category" to create one.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat, idx) => {
                      const isDeleted = Boolean(cat.deleted_at);
                      return (
                        <tr
                          key={cat.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isDeleted ? "bg-red-50/40 opacity-75" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{cat.name}</div>
                            {isDeleted && (
                              <span className="text-[10px] text-red-600 font-mono block">
                                Deleted: {new Date(cat.deleted_at).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{cat.code || "-"}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                cat.type === "SALES"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {cat.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                            {cat.description || "-"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isDeleted ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-full text-[10px] font-bold">
                                Soft Deleted
                              </span>
                            ) : cat.status === "active" ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreCategory(cat.id)}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCatModal(cat)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Category"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSoftDeleteCategory(cat.id, cat.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Soft Delete Category"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INVOICE FILE CATEGORIES MANAGEMENT CONTROL         */}
        {/* ========================================================= */}
        {activeTab === "file_categories" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header & Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Paperclip className="w-4 h-4 text-red-600" />
                  Invoice Attachment Rules
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Invoice File Attachment Categories
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenFileCatModal()}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add File Category</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setFileCatTypeFilter("")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    fileCatTypeFilter === ""
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  All Types ({fileCategories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFileCatTypeFilter("SALES")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    fileCatTypeFilter === "SALES"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  SALES ({fileCategories.filter((c) => c.type === "SALES").length})
                </button>
                <button
                  type="button"
                  onClick={() => setFileCatTypeFilter("PURCHASE")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    fileCatTypeFilter === "PURCHASE"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  PURCHASE ({fileCategories.filter((c) => c.type === "PURCHASE").length})
                </button>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search file category..."
                    value={fileCatSearch}
                    onChange={(e) => setFileCatSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                  />
                </div>

                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={fileCatIncludeDeleted}
                    onChange={(e) => setFileCatIncludeDeleted(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span>Show Soft-Deleted</span>
                </label>
              </div>
            </div>

            {/* File Category Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Document Category Name</th>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Invoice Type</th>
                    <th className="py-3.5 px-4 text-center">Requirement</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {fileCatLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-red-600" />
                        <span className="mt-2 block">Loading invoice file categories...</span>
                      </td>
                    </tr>
                  ) : fileCategories.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No invoice file categories found. Click "+ Add File Category" to create one.
                      </td>
                    </tr>
                  ) : (
                    fileCategories.map((cat, idx) => {
                      const isDeleted = Boolean(cat.deleted_at);
                      return (
                        <tr
                          key={cat.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isDeleted ? "bg-red-50/40 opacity-75" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{cat.name}</div>
                            {isDeleted && (
                              <span className="text-[10px] text-red-600 font-mono block">
                                Deleted: {new Date(cat.deleted_at).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{cat.code || "-"}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                cat.type === "SALES"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {cat.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {cat.is_required ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
                                Mandatory
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-medium">
                                Optional
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                            {cat.description || "-"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isDeleted ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-full text-[10px] font-bold">
                                Soft Deleted
                              </span>
                            ) : cat.status === "active" ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreFileCategory(cat.id)}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenFileCatModal(cat)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit File Category"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSoftDeleteFileCategory(cat.id, cat.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Soft Delete File Category"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PROPERTY DEVELOPERS MANAGEMENT CONTROL              */}
        {/* ========================================================= */}
        {activeTab === "developers" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header & Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-red-600" />
                  Developers Management
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Registered Property Developers
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenDevModal()}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Developer</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Developer Name, Code, TRN / TIN Number, City..."
                  value={devSearch}
                  onChange={(e) => setDevSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devIncludeDeleted}
                    onChange={(e) => setDevIncludeDeleted(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span>Show Soft Deleted</span>
                </label>
              </div>
            </div>

            {/* Developers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Developer Company Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">TRN / TIN Tax Number</th>
                    <th className="py-3 px-4">Location / Address</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {devLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                        <span>Loading property developers database...</span>
                      </td>
                    </tr>
                  ) : developers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                        No developers found. Click "Add New Developer" above.
                      </td>
                    </tr>
                  ) : (
                    developers.map((dev, idx) => {
                      const isDeleted = Boolean(dev.deleted_at);
                      return (
                        <tr
                          key={dev.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isDeleted ? "bg-red-50/40 opacity-75" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{dev.name}</div>
                            {isDeleted && (
                              <span className="text-[10px] text-red-600 font-mono block">
                                Deleted: {new Date(dev.deleted_at).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {dev.code || "-"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                            {dev.tin_number || "-"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{dev.city || "Dubai"}, {dev.country || "UAE"}</div>
                            {dev.address && <span className="text-[10px] text-slate-400 block">{dev.address}</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isDeleted ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-full text-[10px] font-bold">
                                Soft Deleted
                              </span>
                            ) : dev.status === "active" ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreDeveloper(dev.id)}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDevModal(dev)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Developer"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSoftDeleteDeveloper(dev.id, dev.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Soft Delete Developer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: REAL ESTATE PROJECTS MANAGEMENT CONTROL            */}
        {/* ========================================================= */}
        {activeTab === "projects" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header & Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-red-600" />
                  Projects Management
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Developer Projects & Off-Plan Developments
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenPrjModal()}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Project</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={prjDevFilter}
                  onChange={(e) => setPrjDevFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value="">All Developers ({developers.length})</option>
                  {developers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search project name, location..."
                    value={prjSearch}
                    onChange={(e) => setPrjSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                  />
                </div>

                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={prjIncludeDeleted}
                    onChange={(e) => setPrjIncludeDeleted(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span>Show Soft Deleted</span>
                </label>
              </div>
            </div>

            {/* Projects Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Project Name</th>
                    <th className="py-3 px-4">Developer</th>
                    <th className="py-3 px-4">Project Location</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-center">Completion</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {prjLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                        <span>Loading developer projects...</span>
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                        No projects found. Click "Add New Project" above.
                      </td>
                    </tr>
                  ) : (
                    projects.map((prj, idx) => {
                      const isDeleted = Boolean(prj.deleted_at);
                      return (
                        <tr
                          key={prj.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isDeleted ? "bg-red-50/40 opacity-75" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{prj.project_name}</div>
                            {prj.project_code && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                Code: {prj.project_code}
                              </span>
                            )}
                            {isDeleted && (
                              <span className="text-[10px] text-red-600 font-mono block">
                                Deleted: {new Date(prj.deleted_at).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px]">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {prj.developer_name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                              <span>{prj.project_location}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                              {prj.project_type || "Residential"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                prj.completion_status === "Ready / Handed Over"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : prj.completion_status === "Under Construction"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}
                            >
                              {prj.completion_status || "Off-Plan"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isDeleted ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-full text-[10px] font-bold">
                                Soft Deleted
                              </span>
                            ) : prj.status === "active" ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreProject(prj.id)}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrjModal(prj)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Project"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSoftDeleteProject(prj.id, prj.project_name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Soft Delete Project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT TRANSACTION CATEGORY                    */}
      {/* ========================================================= */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setCatModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                <FolderTree className="w-3.5 h-3.5" />
                {editingCat ? "Edit Category" : "New Category"}
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {editingCat ? `Edit '${editingCat.name}'` : "Create Accounting Category"}
              </h2>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real Estate Sales Commission"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Category Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CAT-SALES-01"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Category Type *</label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  >
                    <option value="SALES">SALES Revenue</option>
                    <option value="PURCHASE">PURCHASE Expense</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide accounting classification details..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="catStatus"
                      checked={catStatus === "active"}
                      onChange={() => setCatStatus("active")}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="catStatus"
                      checked={catStatus === "inactive"}
                      onChange={() => setCatStatus("inactive")}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {catSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{catSaving ? "Saving..." : "Save Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT INVOICE FILE CATEGORY                   */}
      {/* ========================================================= */}
      {fileCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setFileCatModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                <Paperclip className="w-3.5 h-3.5" />
                {editingFileCat ? "Edit File Attachment Rule" : "New File Attachment Rule"}
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {editingFileCat ? `Edit '${editingFileCat.name}'` : "Create Invoice File Category"}
              </h2>
            </div>

            <form onSubmit={handleSaveFileCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Document Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales & Purchase Agreement (SPA)"
                  value={fileCatName}
                  onChange={(e) => setFileCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Category Code</label>
                  <input
                    type="text"
                    placeholder="e.g. FILE-SALES-SPA"
                    value={fileCatCode}
                    onChange={(e) => setFileCatCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Invoice Type *</label>
                  <select
                    value={fileCatType}
                    onChange={(e) => setFileCatType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  >
                    <option value="SALES">SALES Invoices</option>
                    <option value="PURCHASE">PURCHASE Invoices</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions on required documents..."
                  value={fileCatDesc}
                  onChange={(e) => setFileCatDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">Mandatory Document Attachment</span>
                  <span className="text-[10px] text-slate-500 block">
                    Require users to upload this file type when creating an invoice
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={fileCatIsRequired}
                  onChange={(e) => setFileCatIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="fileCatStatus"
                      checked={fileCatStatus === "active"}
                      onChange={() => setFileCatStatus("active")}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="fileCatStatus"
                      checked={fileCatStatus === "inactive"}
                      onChange={() => setFileCatStatus("inactive")}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFileCatModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fileCatSaving}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {fileCatSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{fileCatSaving ? "Saving..." : "Save File Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT PROPERTY DEVELOPER                     */}
      {/* ========================================================= */}
      {devModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDevModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" />
                {editingDev ? "Edit Developer" : "New Property Developer"}
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {editingDev ? `Edit '${editingDev.name}'` : "Add Property Developer"}
              </h2>
            </div>

            <form onSubmit={handleSaveDeveloper} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Developer Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sobha Realty, Emaar, Danube Properties"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Developer Code</label>
                  <input
                    type="text"
                    placeholder="e.g. DEV-SOBHA"
                    value={devCode}
                    onChange={(e) => setDevCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">TRN / TIN Tax Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 100392817400003"
                    value={devTin}
                    onChange={(e) => setDevTin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Dubai"
                    value={devCity}
                    onChange={(e) => setDevCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. United Arab Emirates"
                    value={devCountry}
                    onChange={(e) => setDevCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Registered Office Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sheikh Zayed Road, Business Bay"
                  value={devAddress}
                  onChange={(e) => setDevAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="devStatus"
                      checked={devStatus === "active"}
                      onChange={() => setDevStatus("active")}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="devStatus"
                      checked={devStatus === "inactive"}
                      onChange={() => setDevStatus("inactive")}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDevModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={devSaving}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {devSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{devSaving ? "Saving..." : "Save Developer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT REAL ESTATE PROJECT                      */}
      {/* ========================================================= */}
      {prjModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPrjModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                {editingPrj ? "Edit Project" : "New Real Estate Project"}
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {editingPrj ? `Edit '${editingPrj.project_name}'` : "Add Real Estate Project"}
              </h2>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Developer Company *</label>
                <select
                  required
                  value={prjDevId}
                  onChange={(e) => setPrjDevId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                >
                  <option value="">Select Developer Company...</option>
                  {developers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sobha Hartland II, Azizi Riviera"
                  value={prjName}
                  onChange={(e) => setPrjName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Project Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBR City, Dubai South, Business Bay"
                  value={prjLocation}
                  onChange={(e) => setPrjLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Project Code</label>
                  <input
                    type="text"
                    placeholder="e.g. PRJ-SOBHA-HART2"
                    value={prjCode}
                    onChange={(e) => setPrjCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-700">Project Type</label>
                  <select
                    value={prjType}
                    onChange={(e) => setPrjType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed Use">Mixed Use</option>
                    <option value="Villa Community">Villa Community</option>
                    <option value="Master Community">Master Community</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Completion Status</label>
                <select
                  value={prjCompletion}
                  onChange={(e) => setPrjCompletion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600"
                >
                  <option value="Off-Plan">Off-Plan</option>
                  <option value="Under Construction">Under Construction</option>
                  <option value="Ready / Handed Over">Ready / Handed Over</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold uppercase text-slate-700">Status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="prjStatus"
                      checked={prjStatus === "active"}
                      onChange={() => setPrjStatus("active")}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="prjStatus"
                      checked={prjStatus === "inactive"}
                      onChange={() => setPrjStatus("inactive")}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPrjModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prjSaving}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {prjSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{prjSaving ? "Saving..." : "Save Project"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
