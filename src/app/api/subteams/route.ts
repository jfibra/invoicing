import { NextRequest, NextResponse } from "next/server";
import { leuterioDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const teamId = searchParams.get("teamId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    const whereConditions: string[] = ["sub.status = 'active'"];
    const params: (string | number)[] = [];

    if (teamId) {
      whereConditions.push("sub.tteamID = ?");
      params.push(teamId);
    }

    if (search.trim()) {
      whereConditions.push("(sub.teamName LIKE ? OR st.teamname LIKE ? OR m.completename LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // 1. Total Count Query
    const countSql = `
      SELECT COUNT(*) as total 
      FROM salesteam_subteam sub 
      LEFT JOIN sales_team st ON sub.tteamID = st.id 
      LEFT JOIN members m ON sub.LeadID = m.id
      ${whereClause}
    `;
    const [countRows] = await leuterioDb.query<RowDataPacket[]>(countSql, params);
    const total = countRows[0]?.total || 0;

    // 2. Data Query with Correlated Subquery Member Count
    const dataSql = `
      SELECT 
        sub.sid as subteam_id,
        sub.teamName as subteam_name,
        sub.status as subteam_status,
        st.id as parent_team_id,
        st.teamname as parent_team_name,
        m.id as leader_member_id,
        m.completename as leader_name,
        m.mobile as leader_mobile,
        (
          SELECT COUNT(DISTINCT subm.memID)
          FROM salesteam_subteam_members subm
          WHERE subm.subTeamID = sub.sid AND (subm.dateresigned IS NULL OR subm.dateresigned = '0000-00-00' OR subm.dateresigned >= CURDATE())
        ) as total_members
      FROM salesteam_subteam sub
      LEFT JOIN sales_team st ON sub.tteamID = st.id
      LEFT JOIN members m ON sub.LeadID = m.id
      ${whereClause}
      ORDER BY sub.teamName ASC
      LIMIT ? OFFSET ?
    `;

    const [subteams] = await leuterioDb.query<RowDataPacket[]>(dataSql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      subteams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("API Subteams List Error:", error);
    return NextResponse.json({ error: "Failed to fetch subteams", details: error.message }, { status: 500 });
  }
}
