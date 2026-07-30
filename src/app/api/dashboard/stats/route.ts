import { NextRequest, NextResponse } from "next/server";
import { commissionsDb, leuterioDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    // 1. Ensure generated_invoices table exists
    await commissionsDb.query(`
      CREATE TABLE IF NOT EXISTS generated_invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL UNIQUE,
        invoice_type VARCHAR(50) NOT NULL,
        template_style VARCHAR(50) DEFAULT 'modern_slate',
        member_id INT NULL,
        agent_code VARCHAR(100),
        agent_name VARCHAR(255) NOT NULL,
        agent_email VARCHAR(255),
        team_name VARCHAR(255),
        subteam_name VARCHAR(255),
        developer_name VARCHAR(255),
        project_name VARCHAR(255),
        unit_number VARCHAR(100),
        spa_reference VARCHAR(100),
        net_amount DECIMAL(15,2) NOT NULL,
        vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
        vat_amount DECIMAL(15,2) NOT NULL,
        gross_amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'AED',
        status VARCHAR(50) DEFAULT 'ISSUED',
        issued_date DATE NOT NULL,
        remarks TEXT,
        profile_snapshot JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      await commissionsDb.query("ALTER TABLE generated_invoices ADD COLUMN template_style VARCHAR(50) DEFAULT 'modern_slate' AFTER invoice_type");
    } catch (e) {}

    // 2. Fetch Invoice KPI Totals
    const [kpiRows] = await commissionsDb.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(net_amount), 0) as total_net,
        COALESCE(SUM(vat_amount), 0) as total_vat,
        COALESCE(SUM(gross_amount), 0) as total_gross
      FROM generated_invoices
    `);
    const kpis = kpiRows[0] || { total_invoices: 0, total_net: 0, total_vat: 0, total_gross: 0 };

    // 3. Fetch Total Members Count & Total Teams Count
    let totalMembers = 0;
    let totalTeams = 0;
    try {
      const [mRows] = await leuterioDb.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM members WHERE status = 'active'");
      totalMembers = mRows[0]?.count || 0;

      const [tRows] = await leuterioDb.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM teams");
      totalTeams = tRows[0]?.count || 0;
    } catch (e) {
      console.error("Failed to query leuterioDb count:", e);
    }

    // 4. Fetch Recent 5 Issued Invoices
    const [recentInvoices] = await commissionsDb.query<RowDataPacket[]>(`
      SELECT id, invoice_number, invoice_type, template_style, agent_name, agent_code, team_name, developer_name, project_name, net_amount, vat_amount, gross_amount, currency, status, issued_date, created_at
      FROM generated_invoices
      ORDER BY id DESC
      LIMIT 5
    `);

    // 5. Top Teams by Invoice Volume
    const [topTeams] = await commissionsDb.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(team_name, 'Direct Agent') as team_name,
        COUNT(*) as invoice_count,
        SUM(gross_amount) as total_volume
      FROM generated_invoices
      GROUP BY team_name
      ORDER BY total_volume DESC
      LIMIT 4
    `);

    return NextResponse.json({
      success: true,
      stats: {
        total_invoices: kpis.total_invoices,
        total_net: Number(kpis.total_net),
        total_vat: Number(kpis.total_vat),
        total_gross: Number(kpis.total_gross),
        total_members: totalMembers,
        total_teams: totalTeams,
      },
      recent_invoices: recentInvoices,
      top_teams: topTeams,
    });
  } catch (error: any) {
    console.error("GET Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats", details: error.message }, { status: 500 });
  }
}
