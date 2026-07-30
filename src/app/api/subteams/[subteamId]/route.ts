import { NextRequest, NextResponse } from "next/server";
import { leuterioDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subteamId: string }> }
) {
  try {
    const { subteamId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    // 1. Fetch Subteam Info & Parent Team
    const [subteamRows] = await leuterioDb.query<RowDataPacket[]>(`
      SELECT 
        sub.sid as subteam_id,
        sub.teamName as subteam_name,
        sub.status as subteam_status,
        st.id as parent_team_id,
        st.teamname as parent_team_name,
        m.id as leader_member_id,
        m.completename as leader_name,
        m.mobile as leader_mobile
      FROM salesteam_subteam sub
      LEFT JOIN sales_team st ON sub.tteamID = st.id
      LEFT JOIN members m ON sub.LeadID = m.id
      WHERE sub.sid = ?
      LIMIT 1
    `, [subteamId]);

    if (subteamRows.length === 0) {
      return NextResponse.json({ error: "Subteam not found" }, { status: 404 });
    }

    const subteam = subteamRows[0];

    // 2. Fetch Subteam Members Roster
    let memberWhere = "WHERE subm.subTeamID = ? AND (subm.dateresigned IS NULL OR subm.dateresigned = '0000-00-00' OR subm.dateresigned >= CURDATE())";
    const memberParams: (string | number)[] = [subteamId];

    if (search.trim()) {
      memberWhere += " AND (m.completename LIKE ? OR m.email LIKE ? OR m.emailad LIKE ? OR m.memberid LIKE ?)";
      const term = `%${search.trim()}%`;
      memberParams.push(term, term, term, term);
    }

    const [countRows] = await leuterioDb.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM salesteam_subteam_members subm LEFT JOIN members m ON subm.memID = m.id ${memberWhere}`,
      memberParams
    );
    const totalMembers = countRows[0]?.total || 0;

    const membersSql = `
      SELECT 
        m.id as member_id,
        m.memberid as member_code,
        m.completename,
        m.email,
        m.emailad,
        m.mobile,
        m.city,
        m.status as member_status,
        subm.isLeader as is_subteam_leader,
        subm.created_at as joined_date
      FROM salesteam_subteam_members subm
      LEFT JOIN members m ON subm.memID = m.id
      ${memberWhere}
      ORDER BY subm.isLeader DESC, m.completename ASC
      LIMIT ? OFFSET ?
    `;

    const [members] = await leuterioDb.query<RowDataPacket[]>(membersSql, [...memberParams, limit, offset]);

    return NextResponse.json({
      subteam,
      members,
      pagination: {
        page,
        limit,
        total: totalMembers,
        totalPages: Math.ceil(totalMembers / limit),
      },
    });
  } catch (error: any) {
    console.error("API Subteam Details Error:", error);
    return NextResponse.json({ error: "Failed to fetch subteam details", details: error.message }, { status: 500 });
  }
}
