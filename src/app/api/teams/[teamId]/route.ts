import { NextRequest, NextResponse } from "next/server";
import { leuterioDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = [10, 25, 50].includes(parseInt(searchParams.get("limit") || "10", 10))
      ? parseInt(searchParams.get("limit") || "10", 10)
      : 10;
    const offset = (page - 1) * limit;

    // Execute Queries in Parallel via Promise.all
    const [
      [teamRows],
      [subteamRows],
      [countRows],
      [membersRows]
    ] = await Promise.all([
      // Query 1: Team Meta
      leuterioDb.query<RowDataPacket[]>(
        "SELECT id, teamname, status, created_at, teamlogo FROM sales_team WHERE id = ? LIMIT 1",
        [teamId]
      ),

      // Query 2: Subteams list
      leuterioDb.query<RowDataPacket[]>(`
        SELECT 
          sub.sid as subteam_id,
          sub.teamName as subteam_name,
          sub.status as subteam_status,
          m.memberid as leader_member_id,
          m.completename as leader_name,
          m.fn as leader_fn,
          m.ln as leader_ln,
          m.mobile as leader_mobile
        FROM salesteam_subteam sub
        LEFT JOIN members m ON sub.LeadID = m.id
        WHERE sub.tteamID = ?
        ORDER BY sub.teamName ASC
      `, [teamId]),

      // Query 3: Total Count for Pagination
      leuterioDb.query<RowDataPacket[]>(`
        SELECT COUNT(*) as total 
        FROM sales_team_members stm 
        ${search.trim() ? "LEFT JOIN members m ON (stm.memid = m.id OR stm.agentid = m.memberid)" : ""}
        WHERE stm.teamid = ? AND stm.activeTeam = 1
        ${search.trim() ? "AND (m.completename LIKE ? OR m.email LIKE ? OR m.mobile LIKE ? OR m.memberid LIKE ?)" : ""}
      `, search.trim() ? [teamId, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`] : [teamId]),

      // Query 4: Fast Paginated Members Roster
      leuterioDb.query<RowDataPacket[]>(`
        SELECT 
          stm.memid as member_id,
          stm.agentid as member_code,
          m.completename,
          m.email,
          m.mobile,
          m.phone,
          m.city,
          m.status as member_status,
          stm.isleader as is_team_leader
        FROM sales_team_members stm
        LEFT JOIN members m ON (stm.memid = m.id OR stm.agentid = m.memberid)
        WHERE stm.teamid = ? AND stm.activeTeam = 1
        ${search.trim() ? "AND (m.completename LIKE ? OR m.email LIKE ? OR m.mobile LIKE ? OR m.memberid LIKE ?)" : ""}
        ORDER BY stm.isleader DESC, stm.id DESC
        LIMIT ? OFFSET ?
      `, search.trim() 
          ? [teamId, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, limit, offset] 
          : [teamId, limit, offset]
      )
    ]);

    if (teamRows.length === 0) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const team = teamRows[0];
    const totalMembers = countRows[0]?.total || 0;

    const subteams = subteamRows.map((sub) => ({
      subteam_id: sub.subteam_id,
      subteam_name: sub.subteam_name,
      subteam_status: sub.subteam_status,
      leader_member_id: sub.leader_member_id,
      leader_name: sub.leader_name || (sub.leader_fn || sub.leader_ln ? `${sub.leader_fn || ""} ${sub.leader_ln || ""}`.trim() : null),
      leader_mobile: sub.leader_mobile,
      total_unit_members: 0,
    }));

    const members = membersRows.map((m) => ({
      member_id: m.member_id || m.member_code,
      member_code: m.member_code || m.member_id,
      completename: m.completename || "Unnamed Member",
      email: m.email || null,
      mobile: m.mobile || m.phone || null,
      city: m.city || null,
      member_status: m.member_status || "active",
      is_team_leader: m.is_team_leader || 0,
      is_subteam_leader: 0,
      subteam_name: null,
    }));

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        teamname: team.teamname,
        status: team.status,
        dateest: team.created_at,
        teamlogo: team.teamlogo,
      },
      subteams,
      members,
      pagination: {
        page,
        limit,
        total: totalMembers,
        totalPages: Math.ceil(totalMembers / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("API getTeamDetails Error:", error);
    return NextResponse.json({ error: "Failed to fetch team details", details: error.message }, { status: 500 });
  }
}
