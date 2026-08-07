"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building,
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  AlertCircle,
  Save,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";

const BigBackIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
    <circle cx="32" cy="32" r="26" fill="#DC2626" />
    <path d="M36 20L24 32L36 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isAddMode = searchParams.get("mode") === "add";

  const [projects, setProjects] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [devFilter, setDevFilter] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    developer_id: "" as number | "",
    name: "",
    code: "",
    location: "",
    type: "Residential",
    completion_status: "Off-Plan",
    status: "active" as "active" | "inactive",
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch Developers for Select Dropdown
  useEffect(() => {
    async function loadDevs() {
      try {
        const res = await fetch("/api/developers");
        const data = await res.json();
        if (res.ok && data.developers) {
          setDevelopers(data.developers);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadDevs();
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ search });
      if (devFilter) query.set("developer_id", devFilter);

      const res = await fetch(`/api/projects?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.projects) {
        setProjects(data.projects);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, devFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (editId && projects.length > 0) {
      const target = projects.find((p) => String(p.id) === String(editId));
      if (target) {
        setFormData({
          developer_id: target.developer_id || "",
          name: target.name || "",
          code: target.code || "",
          location: target.location || "",
          type: target.type || "Residential",
          completion_status: target.completion_status || "Off-Plan",
          status: target.status || "active",
        });
      }
    }
  }, [editId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const isEdit = Boolean(editId);
      const url = isEdit ? `/api/projects/${editId}` : "/api/projects";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Project ${isEdit ? "updated" : "created"} successfully!`);
        setTimeout(() => {
          router.push("/settings/projects");
          fetchProjects();
        }, 1000);
      } else {
        setErrorMsg(data.error || "Failed to save project");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to deactivate project "${name}"?`)) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) fetchProjects();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && projects.length === 0) {
    return <PageLoader label="Loading Real Estate Projects..." />;
  }

  // ADD / EDIT VIEW
  if (isAddMode || editId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
        <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings/projects"
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
            >
              <BigBackIcon />
              <span>Back to Projects</span>
            </Link>
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
            {editId ? `Edit Projects #${editId}` : `New Projects`}
          </span>
        </div>
      </div>

        <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-8">
            <div className="border-b border-slate-200 pb-6 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                <Building className="w-8 h-8 text-amber-600" />
                {editId ? "Edit Development Project" : "Add Real Estate Project"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Link development projects with property developers.</p>
            </div>

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Developer Partner *</label>
                  <select
                    required
                    value={formData.developer_id}
                    onChange={(e) => setFormData({ ...formData, developer_id: Number(e.target.value) })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-amber-600 outline-none"
                  >
                    <option value="">Select Developer Company...</option>
                    {developers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Project Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRJ-BURJ"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono focus:bg-white focus:border-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Burj Crown / Dubai Creek Harbour"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Property Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-amber-600 outline-none"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed-Use">Mixed-Use</option>
                    <option value="Villa Community">Villa Community</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Completion Status</label>
                  <select
                    value={formData.completion_status}
                    onChange={(e) => setFormData({ ...formData, completion_status: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-amber-600 outline-none"
                  >
                    <option value="Off-Plan">Off-Plan / Under Construction</option>
                    <option value="Ready">Ready to Move-In</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Location / Sub-community</label>
                  <input
                    type="text"
                    placeholder="Downtown Dubai / Business Bay"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-amber-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <Link href="/settings/projects" className="px-6 py-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-[0_3px_0_0_#E2E8F0] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#D97706] active:translate-y-1 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Project"}</span>
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FHI Global Property LLC • Projects
        </footer>
      </div>
    );
  }

  // DIRECTORY VIEW
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs transition-all shadow-[0_3px_0_0_#E2E8F0] active:shadow-none active:translate-y-0.5 cursor-pointer"
            >
              <BigBackIcon />
              <span>Settings Hub</span>
            </Link>
            <Image src="/fhi.png" alt="Filipino Homes" width={160} height={44} className="object-contain h-10 w-auto hidden sm:block" priority />
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
            Projects Module
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-[0_6px_0_0_#E2E8F0] space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Building className="w-7 h-7 text-amber-600" />
                Real Estate Development Projects
              </h2>
              <p className="text-xs text-slate-500 font-medium">Directory of off-plan and completed property developments.</p>
            </div>

            <Link
              href="/settings/projects?mode=add"
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-[0_4px_0_0_#D97706] flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Real Estate Project</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search project name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-amber-600 outline-none"
              />
            </div>

            <div>
              <select
                value={devFilter}
                onChange={(e) => setDevFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-amber-600 outline-none"
              >
                <option value="">All Developers...</option>
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">Project Code</th>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Developer</th>
                  <th className="py-3 px-4">Type & Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  projects.map((prj) => (
                    <tr key={prj.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-mono font-extrabold text-amber-700">{prj.code}</td>
                      <td className="py-4 px-4 font-black text-slate-900">
                        {prj.name}
                        {prj.location && <span className="text-[10px] text-slate-400 block font-normal">{prj.location}</span>}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-700">{prj.developer_name || "—"}</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                          {prj.type} • {prj.completion_status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/settings/projects?edit=${prj.id}`} className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-extrabold text-[11px] flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                          <button onClick={() => handleDelete(prj.id, prj.name)} className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FHI Global Property LLC • Projects
      </footer>
    </div>
  );
}


export default function ProjectsPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading Settings..." />}>
      <ProjectsContent />
    </Suspense>
  );
}
