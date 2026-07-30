import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 10)));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // Ensure user_login_logs table exists
    await commissionsDb.query(`
      CREATE TABLE IF NOT EXISTS user_login_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        member_id INT NULL,
        email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NULL,
        role_name VARCHAR(100) NULL,
        ip_address VARCHAR(100) NULL,
        user_agent TEXT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
        failure_reason VARCHAR(255) NULL,
        login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_login_at (login_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += " AND (email LIKE ? OR user_name LIKE ? OR ip_address LIKE ?)";
      const term = `%${search}%`;
      queryParams.push(term, term, term);
    }

    if (status) {
      whereClause += " AND status = ?";
      queryParams.push(status);
    }

    const [countRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM user_login_logs ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    const [logs] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM user_login_logs ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
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
    console.error("GET Login Logs Error:", error);
    return NextResponse.json({ error: "Failed to fetch login logs", details: error.message }, { status: 500 });
  }
}
