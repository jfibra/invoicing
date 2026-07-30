"use client";

import React, { useState, useEffect, useCallback, use } from "react";
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
  ShieldCheck,
  FilePlus,
  Loader2,
} from "lucide-react";

interface TeamDetail {
  id: number;
  teamname: string;
  status: string;
  dateest: string;
  teamlogo: string | null;
}

interface Subteam {
  subteam_id: number;
  subteam_name: string;
  subteam_status: string;
  leader_member_id: number | null;
  leader_name: string | null;
  leader_mobile: string | null;
  total_unit_members: number;
}

interface Member {
  member_id: number;
  member_code: string | null;
  completename: string;
  email: string | null;
  mobile: string | null;
  city: string | null;
  member_status: string;
  is_team_leader: number;
  is_subteam_leader: number | null;
  subteam_name: string | null;
}

export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [subteams, setSubteams] = useState<Subteam[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load team details");

      setTeam(data.team);
      setSubteams(data.subteams);
      setMembers(data.members);
      setPagination({
        total: data.pagination.total,
        totalPages: data.pagination.totalPages || 1,
      });
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [teamId, search, page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeamDetails();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTeamDetails]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Navigation */}
      <HeaderNav onRefresh={fetchTeamDetails} loadingRefresh={loading} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-8">
        
        {/* Team Banner */}
        {team && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-2 bg-red-600" />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                  {team.status}
                </span>
                <span className="text-xs font-mono text-slate-400">Team ID #{team.id}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{team.teamname}</h1>
              <p className="text-xs text-slate-500 font-medium">
                Total Members: <strong className="text-slate-800">{pagination.total}</strong> • Units/Subteams: <strong className="text-slate-800">{subteams.length}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/invoices"
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                Issue Commission Invoice
              </Link>
            </div>
          </div>
        )}

        {/* Subteams / Units Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-600" />
            Units & Subteams Breakdown ({subteams.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subteams.length === 0 ? (
              <div className="col-span-full bg-white p-6 rounded-2xl border border-slate-200 text-xs text-slate-400 text-center">
                No active subteams assigned to this sales team.
              </div>
            ) : (
              subteams.map((sub) => (
                <div key={sub.subteam_id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{sub.subteam_name}</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Leader</span>
                      <span className="font-bold text-slate-800 truncate block">{sub.leader_name || "Unassigned"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden space-y-4">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                Querying Members...
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              Team Roster ({pagination.total})
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search member name or code..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-red-600 transition-all font-medium"
                />
              </div>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-300 text-slate-800 font-medium text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Member Code</th>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Leadership</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No team members found matching your search.
                    </td>
                  </tr>
                ) : (
                  members.map((m, idx) => (
                    <tr key={`${m.member_id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                        {m.member_code || `#${m.member_id}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {m.completename}
                      </td>
                      <td className="py-3.5 px-4">
                        {Boolean(m.is_team_leader) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 mr-1">
                            Team Leader
                          </span>
                        )}
                        {!m.is_team_leader && (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex flex-col">
                          <span>{m.email || m.mobile || "No contact"}</span>
                          {m.city && <span className="text-[10px] text-slate-400">{m.city}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {m.member_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/invoices?email=${encodeURIComponent(m.email || m.completename)}`}
                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-colors cursor-pointer inline-block"
                        >
                          Issue Invoice
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing Page <strong>{page}</strong> of <strong>{pagination.totalPages || 1}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || loading}
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
