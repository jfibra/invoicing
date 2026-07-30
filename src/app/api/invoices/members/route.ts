import { NextRequest, NextResponse } from "next/server";
import { leuterioDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firstName = searchParams.get("firstName") || "";
    const lastName = searchParams.get("lastName") || "";
    const email = searchParams.get("email") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = [10, 25, 50].includes(parseInt(searchParams.get("limit") || "10", 10))
      ? parseInt(searchParams.get("limit") || "10", 10)
      : 10;
    const offset = (page - 1) * limit;

    // Separate Filter Conditions for First Name, Last Name, and Email
    let memberWhere = "WHERE m.status IN ('active', 'inactive')";
    const params: (string | number)[] = [];

    if (firstName.trim()) {
      memberWhere += " AND (m.fn LIKE ? OR m.completename LIKE ?)";
      const term = `%${firstName.trim()}%`;
      params.push(term, term);
    }

    if (lastName.trim()) {
      memberWhere += " AND (m.ln LIKE ? OR m.completename LIKE ?)";
      const term = `%${lastName.trim()}%`;
      params.push(term, term);
    }

    if (email.trim()) {
      memberWhere += " AND (m.email LIKE ? OR m.emailad LIKE ?)";
      const term = `%${email.trim()}%`;
      params.push(term, term);
    }

    // High-Speed Count & Roster Queries Parallel Execution
    const [
      [countRows],
      [membersRows]
    ] = await Promise.all([
      leuterioDb.query<RowDataPacket[]>(`
        SELECT COUNT(DISTINCT m.id) as total 
        FROM members m
        ${memberWhere}
      `, params),

      leuterioDb.query<RowDataPacket[]>(`
        SELECT 
          m.id as internal_id,
          m.memberid as member_code,
          m.completename,
          m.fn,
          m.ln,
          m.email,
          m.emailad,
          m.mobile,
          m.phone,
          m.city,
          m.status as member_status,
          st.id as team_id,
          st.teamname,
          sub.sid as subteam_id,
          sub.teamName as subteam_name
        FROM members m
        LEFT JOIN sales_team_members stm ON stm.id = (
          SELECT id FROM sales_team_members WHERE memid = m.id AND activeTeam = 1 ORDER BY id DESC LIMIT 1
        )
        LEFT JOIN sales_team st ON stm.teamid = st.id
        LEFT JOIN salesteam_subteam_members subm ON subm.id = (
          SELECT id FROM salesteam_subteam_members WHERE memID = m.id AND (dateresigned IS NULL OR dateresigned = '0000-00-00' OR dateresigned > CURDATE()) ORDER BY id DESC LIMIT 1
        )
        LEFT JOIN salesteam_subteam sub ON subm.subTeamID = sub.sid
        ${memberWhere}
        ORDER BY m.id DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset])
    ]);

    const total = countRows[0]?.total || 0;

    const members = membersRows.map((m) => ({
      member_id: m.member_code || m.internal_id,
      member_code: m.member_code || `#${m.internal_id}`,
      completename: m.completename || `${m.fn || ""} ${m.ln || ""}`.trim() || "Unnamed Member",
      email: m.email || m.emailad || null,
      mobile: m.mobile || m.phone || null,
      city: m.city || null,
      status: m.member_status || "active",
      team_id: m.team_id || null,
      teamname: m.teamname || "Direct / No Team",
      subteam_id: m.subteam_id || null,
      subteam_name: m.subteam_name || "No Subteam",
    }));

    return NextResponse.json({
      success: true,
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("API Invoicing Members Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoicing members", details: error.message }, { status: 500 });
  }
}
