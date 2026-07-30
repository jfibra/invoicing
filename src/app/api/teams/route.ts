import { NextRequest, NextResponse } from "next/server";
import { leuterioDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = [10, 25, 50].includes(parseInt(searchParams.get("limit") || "10", 10))
      ? parseInt(searchParams.get("limit") || "10", 10)
      : 10;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE st.status = 'active'";
    const params: (string | number)[] = [];

    if (search.trim()) {
      whereClause += " AND (st.teamname LIKE ? OR st.id = ?)";
      const term = `%${search.trim()}%`;
      const numericTerm = isNaN(Number(search.trim())) ? 0 : Number(search.trim());
      params.push(term, numericTerm);
    }

    // Parallel Execution: Fast Count + Fast Paginated Teams Base Fetch
    const [
      [countRows],
      [teamsRows]
    ] = await Promise.all([
      leuterioDb.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM sales_team st ${whereClause}`,
        params
      ),
      leuterioDb.query<RowDataPacket[]>(
        `
        SELECT 
          st.id as team_id,
          st.teamname,
          st.status as team_status,
          st.created_at as date_established,
          st.teamlogo
        FROM sales_team st
        ${whereClause}
        ORDER BY st.teamname ASC
        LIMIT ? OFFSET ?
        `,
        [...params, limit, offset]
      )
    ]);

    const total = countRows[0]?.total || 0;

    if (teamsRows.length === 0) {
      return NextResponse.json({
        success: true,
        teams: [],
        pagination: { page, limit, total, totalPages: 1 },
      });
    }

    const teamIds = teamsRows.map((t) => t.team_id);

    // Parallel Fetch Leaders, Subteam Counts, and Member Counts ONLY for the 10 displayed team IDs
    const [
      [leadersRows],
      [subteamCountsRows],
      [memberCountsRows]
    ] = await Promise.all([
      // Fetch Leaders for the 10 teams
      leuterioDb.query<RowDataPacket[]>(`
        SELECT 
          stm.teamid,
          m.memberid as leader_member_id,
          m.completename as leader_name,
          m.fn as leader_fn,
          m.ln as leader_ln,
          m.email as leader_email,
          m.mobile as leader_mobile,
          m.phone as leader_phone
        FROM sales_team_members stm
        JOIN members m ON (stm.agentid = m.memberid OR stm.memid = m.id)
        WHERE stm.teamid IN (?) AND stm.isleader = 1 AND stm.activeTeam = 1
      `, [teamIds]),

      // Fetch Subteam Counts for the 10 teams
      leuterioDb.query<RowDataPacket[]>(`
        SELECT tteamID as teamid, COUNT(*) as total_subteams
        FROM salesteam_subteam
        WHERE tteamID IN (?) AND status = 'active'
        GROUP BY tteamID
      `, [teamIds]),

      // Fetch Member Counts for the 10 teams
      leuterioDb.query<RowDataPacket[]>(`
        SELECT teamid, COUNT(DISTINCT memid) as total_members
        FROM sales_team_members
        WHERE teamid IN (?) AND activeTeam = 1
        GROUP BY teamid
      `, [teamIds])
    ]);

    // Map metrics back by team ID
    const leadersMap = new Map();
    leadersRows.forEach((l) => leadersMap.set(l.teamid, l));

    const subteamsMap = new Map();
    subteamCountsRows.forEach((s) => subteamsMap.set(s.teamid, s.total_subteams));

    const membersMap = new Map();
    memberCountsRows.forEach((m) => membersMap.set(m.teamid, m.total_members));

    const teamsData = teamsRows.map((team) => {
      const leader = leadersMap.get(team.team_id);
      const leaderName = leader?.leader_name || (leader?.leader_fn || leader?.leader_ln ? `${leader.leader_fn || ""} ${leader.leader_ln || ""}`.trim() : null);

      return {
        team_id: team.team_id,
        teamname: team.teamname,
        team_status: team.team_status,
        date_established: team.date_established,
        teamlogo: team.teamlogo,
        leader_member_id: leader?.leader_member_id || null,
        leader_name: leaderName || null,
        leader_email: leader?.leader_email || null,
        leader_mobile: leader?.leader_mobile || leader?.leader_phone || null,
        total_members: membersMap.get(team.team_id) || 0,
        total_subteams: subteamsMap.get(team.team_id) || 0,
      };
    });

    return NextResponse.json({
      success: true,
      teams: teamsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("API getTeams Ultra-Fast Error:", error);
    return NextResponse.json({ error: "Failed to fetch teams", details: error.message }, { status: 500 });
  }
}
