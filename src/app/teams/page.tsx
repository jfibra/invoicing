"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import {
  Users,
  Search,
  RefreshCw,
  Crown,
  Layers,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
  Eye,
  Loader2,
} from "lucide-react";

interface Team {
  team_id: number;
  teamname: string;
  team_status: string;
  date_established: string;
  teamlogo: string | null;
  leader_member_id: number | null;
  leader_name: string | null;
  leader_email: string | null;
  leader_mobile: string | null;
  total_members: number;
  total_subteams: number;
}

export default function TeamsManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams?search=${encodeURIComponent(search)}&page=${pagination.page}&limit=${pagination.limit}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load teams");
      setTeams(data.teams);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeams();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTeams]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Navigation */}
      <HeaderNav onRefresh={fetchTeams} loadingRefresh={loading} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-6">
        
        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Sales Teams Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing <strong className="text-slate-800">{pagination.total}</strong> active sales teams and units.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by team ID or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-red-600 focus:bg-white transition-all placeholder-slate-400 font-medium"
              />
            </div>

            <select
              value={pagination.limit}
              onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
              className="bg-slate-50 border border-slate-300 text-slate-800 font-medium text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600 cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden space-y-4">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                Querying Teams...
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold w-16">Team ID</th>
                  <th className="py-3.5 px-4 font-semibold">Team Name</th>
                  <th className="py-3.5 px-4 font-semibold">Team Leader</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Active Members</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Units / Subteams</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teams.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No sales teams found matching your search query.
                    </td>
                  </tr>
                ) : (
                  teams.map((t) => (
                    <tr key={t.team_id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-4 font-mono font-bold text-red-600">
                        #{t.team_id}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                        <Link href={`/teams/${t.team_id}`} className="hover:text-red-600 transition-colors">
                          {t.teamname}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        {t.leader_name ? (
                          <div className="flex items-center gap-2">
                            <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800 block">{t.leader_name}</span>
                              {t.leader_email && <span className="text-[10px] text-slate-400 block font-mono">{t.leader_email}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800 font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                          {t.total_members} Members
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800 font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                          {t.total_subteams} Units
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.team_status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/teams/${t.team_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-semibold text-slate-800">{pagination.total}</span> teams
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono font-medium text-slate-700 bg-slate-50 rounded-lg border border-slate-200">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>

              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
