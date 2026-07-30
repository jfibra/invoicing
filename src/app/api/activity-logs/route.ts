import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { ensureActivityLogsTable } from "@/lib/activityLogger";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    await ensureActivityLogsTable();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 10)));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const moduleName = searchParams.get("module") || "";
    const actionType = searchParams.get("action") || "";

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += " AND (user_name LIKE ? OR user_email LIKE ? OR description LIKE ? OR ip_address LIKE ?)";
      const term = `%${search}%`;
      queryParams.push(term, term, term, term);
    }

    if (moduleName) {
      whereClause += " AND module_name = ?";
      queryParams.push(moduleName);
    }

    if (actionType) {
      whereClause += " AND action_type = ?";
      queryParams.push(actionType);
    }

    const [countRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM site_activity_logs ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    const [logs] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM site_activity_logs ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("GET Activity Logs Error:", error);
    return NextResponse.json({ error: "Failed to fetch site activity logs", details: error.message }, { status: 500 });
  }
}
