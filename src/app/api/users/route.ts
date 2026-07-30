import { NextRequest, NextResponse } from "next/server";
import { leuterioDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = (searchParams.get("status") || "all").toLowerCase();
    const dateRange = searchParams.get("dateRange");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = [10, 25, 50].includes(parseInt(searchParams.get("limit") || "10", 10))
      ? parseInt(searchParams.get("limit") || "10", 10)
      : 10;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = ["1=1"];
    const params: (string | number)[] = [];

    if (search.trim()) {
      whereConditions.push("(m.completename LIKE ? OR m.fn LIKE ? OR m.mn LIKE ? OR m.ln LIKE ? OR m.email LIKE ? OR m.mobile LIKE ? OR m.phone LIKE ? OR m.memberid LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term, term, term);
    }

    if (status !== "all") {
      whereConditions.push("m.status = ?");
      params.push(status);
    }

    // Date Range Presets
    if (dateRange && dateRange.toLowerCase() !== "all") {
      const now = new Date();
      let startDate: string | null = null;
      let endDate: string | null = null;

      const formatDate = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

      switch (dateRange.toLowerCase()) {
        case "today": {
          const start = new Date(now.setHours(0, 0, 0, 0));
          const end = new Date(now.setHours(23, 59, 59, 999));
          startDate = formatDate(start);
          endDate = formatDate(end);
          break;
        }
        case "this_month": {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          startDate = formatDate(start);
          endDate = formatDate(end);
          break;
        }
        case "this_year": {
          const start = new Date(now.getFullYear(), 0, 1);
          const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          startDate = formatDate(start);
          endDate = formatDate(end);
          break;
        }
      }

      if (startDate && endDate) {
        whereConditions.push("m.created_at BETWEEN ? AND ?");
        params.push(startDate, endDate);
      }
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // 1. Total Count Query
    const countSql = `SELECT COUNT(*) as total FROM members m ${whereClause}`;
    const [countRows] = await leuterioDb.query<RowDataPacket[]>(countSql, params);
    const total = countRows[0]?.total || 0;

    // 2. Data Query matching getUsers
    const dataSql = `
      SELECT 
        m.memberid as member_id,
        m.memberid as member_code,
        m.completename,
        m.email,
        m.mobile,
        m.phone,
        m.status,
        m.created_at,
        st.teamname as team,
        sub.teamName as subteam
      FROM members m
      LEFT JOIN sales_team_members stm ON stm.id = (
        SELECT id FROM sales_team_members 
        WHERE (memid = m.id OR agentid = m.memberid) AND activeTeam = 1 AND (dateresigned IS NULL OR dateresigned > CURDATE()) 
        ORDER BY id DESC LIMIT 1
      )
      LEFT JOIN sales_team st ON stm.teamid = st.id
      LEFT JOIN salesteam_subteam_members subm ON subm.id = (
        SELECT id FROM salesteam_subteam_members 
        WHERE (memID = m.id OR agentid = m.memberid) AND (dateresigned IS NULL OR dateresigned > CURDATE()) 
        ORDER BY id DESC LIMIT 1
      )
      LEFT JOIN salesteam_subteam sub ON subm.subTeamID = sub.sid
      ${whereClause}
      ORDER BY m.completename ASC
      LIMIT ? OFFSET ?
    `;

    const [usersRows] = await leuterioDb.query<RowDataPacket[]>(dataSql, [...params, limit, offset]);

    const usersData = usersRows.map((u) => ({
      member_id: u.member_id,
      member_code: u.member_code,
      completename: u.completename,
      email: u.email,
      mobile: u.mobile || u.phone,
      team: u.team || null,
      subteam: u.subteam || null,
      status: u.status,
      created_at: u.created_at,
    }));

    return NextResponse.json({
      success: true,
      users: usersData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("API getUsers Error:", error);
    return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 });
  }
}
