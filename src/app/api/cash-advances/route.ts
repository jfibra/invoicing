import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Helper: Ensure tables exist
async function ensureCashAdvanceTables() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS cash_advances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cash_advance_code VARCHAR(100) NOT NULL UNIQUE,
      member_id INT NULL,
      agent_code VARCHAR(100) NULL,
      agent_name VARCHAR(255) NOT NULL,
      agent_email VARCHAR(255) NULL,
      team_name VARCHAR(255) NULL,
      subteam_name VARCHAR(255) NULL,
      advance_amount DECIMAL(15,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'AED',
      repayment_term_type ENUM('WEEKS', 'MONTHS') DEFAULT 'MONTHS',
      repayment_term_value INT NOT NULL,
      total_repayment_amount DECIMAL(15,2) NOT NULL,
      installment_amount DECIMAL(15,2) NOT NULL,
      due_start_date DATE NOT NULL,
      due_end_date DATE NOT NULL,
      total_paid_amount DECIMAL(15,2) DEFAULT 0.00,
      balance_due DECIMAL(15,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      remarks TEXT NULL,
      profile_snapshot JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ca_code (cash_advance_code),
      INDEX idx_agent_code (agent_code),
      INDEX idx_status (status),
      INDEX idx_due_start (due_start_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS cash_advance_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cash_advance_id INT NOT NULL,
      receipt_number VARCHAR(100) NOT NULL UNIQUE,
      payment_amount DECIMAL(15,2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
      remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cash_advance_id) REFERENCES cash_advances(id) ON DELETE CASCADE,
      INDEX idx_receipt_num (receipt_number),
      INDEX idx_ca_id (cash_advance_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// GET: List/Track all cash advances with summary KPIs
export async function GET(request: NextRequest) {
  try {
    await ensureCashAdvanceTables();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 10)));
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (cash_advance_code LIKE ? OR agent_name LIKE ? OR agent_code LIKE ? OR team_name LIKE ?)`;
      const term = `%${search}%`;
      queryParams.push(term, term, term, term);
    }

    if (status) {
      whereClause += ` AND status = ?`;
      queryParams.push(status);
    }

    // Count Total Matching Cash Advances
    const [countRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM cash_advances ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    // Fetch Summary KPI Totals
    const [kpiRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(advance_amount), 0) as total_disbursed,
        COALESCE(SUM(total_paid_amount), 0) as total_repaid,
        COALESCE(SUM(balance_due), 0) as total_outstanding
       FROM cash_advances`
    );
    const kpis = kpiRows[0] || { total_count: 0, total_disbursed: 0, total_repaid: 0, total_outstanding: 0 };

    // Query Cash Advance Records with Payment History
    const [advances] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM cash_advances ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Fetch payments for each advance
    const advanceIds = advances.map((a: any) => a.id);
    let paymentsMap: { [key: number]: any[] } = {};
    if (advanceIds.length > 0) {
      const [payments] = await commissionsDb.query<RowDataPacket[]>(
        `SELECT * FROM cash_advance_payments WHERE cash_advance_id IN (?) ORDER BY payment_date DESC, id DESC`,
        [advanceIds]
      );
      for (const p of payments) {
        if (!paymentsMap[p.cash_advance_id]) paymentsMap[p.cash_advance_id] = [];
        paymentsMap[p.cash_advance_id].push(p);
      }
    }

    const enrichedAdvances = advances.map((a: any) => ({
      ...a,
      payments: paymentsMap[a.id] || [],
    }));

    return NextResponse.json({
      success: true,
      advances: enrichedAdvances,
      kpis,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("GET Cash Advances Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cash advances", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Issue/Disburse a new Cash Advance to an agent
export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    await ensureCashAdvanceTables();

    const body = await request.json();
    const {
      member_id,
      agent_code,
      agent_name,
      agent_email,
      team_name,
      subteam_name,
      advance_amount,
      currency = "AED",
      repayment_term_type = "MONTHS",
      repayment_term_value = 1,
      total_repayment_amount,
      installment_amount,
      due_start_date,
      remarks,
    } = body;

    const advAmtNum = Number(advance_amount || 0);
    if (!agent_name || advAmtNum <= 0) {
      return NextResponse.json({ error: "Agent name and valid cash advance amount are required" }, { status: 400 });
    }

    const termValNum = Math.max(1, Number(repayment_term_value || 1));
    const totalRepayNum = Number(total_repayment_amount) || advAmtNum;
    const instAmtNum = Number(installment_amount) || (totalRepayNum / termValNum);

    const startDate = due_start_date ? new Date(due_start_date) : new Date();
    const endDate = new Date(startDate);
    if (repayment_term_type === "WEEKS") {
      endDate.setDate(endDate.getDate() + termValNum * 7);
    } else {
      endDate.setMonth(endDate.getMonth() + termValNum);
    }

    const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const caCode = `CA-DXB-${yearMonth}-${randomSeq}`;

    // Snapshot admin profile
    let profile = null;
    let logoUrl = null;
    let address = null;

    try {
      const [adminProfiles] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT * FROM invoice_profiles WHERE profile_type = 'ADMIN' LIMIT 1"
      );
      profile = adminProfiles[0] || null;

      if (profile) {
        const [logos] = await commissionsDb.query<RowDataPacket[]>(
          "SELECT s3_url FROM profile_logos WHERE profile_id = ? ORDER BY is_default DESC, id ASC LIMIT 1",
          [profile.id]
        );
        if (logos.length > 0 && logos[0].s3_url) {
          logoUrl = logos[0].s3_url;
        } else if (profile.default_logo_url) {
          logoUrl = profile.default_logo_url;
        }

        const [addresses] = await commissionsDb.query<RowDataPacket[]>(
          "SELECT * FROM profile_addresses WHERE profile_id = ? ORDER BY is_default DESC, id ASC LIMIT 1",
          [profile.id]
        );
        address = addresses[0] || null;
      }
    } catch (e) {}

    const profileSnapshot = {
      profile: {
        ...profile,
        default_logo_url: logoUrl,
      },
      address,
    };

    const formattedStartDate = startDate.toISOString().slice(0, 10);
    const formattedEndDate = endDate.toISOString().slice(0, 10);

    const [result] = await commissionsDb.query<ResultSetHeader>(`
      INSERT INTO cash_advances 
      (cash_advance_code, member_id, agent_code, agent_name, agent_email, team_name, subteam_name, advance_amount, currency, repayment_term_type, repayment_term_value, total_repayment_amount, installment_amount, due_start_date, due_end_date, total_paid_amount, balance_due, status, remarks, profile_snapshot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'ACTIVE', ?, ?)
    `, [
      caCode,
      member_id || null,
      agent_code || null,
      agent_name,
      agent_email || null,
      team_name || null,
      subteam_name || null,
      advAmtNum,
      currency || "AED",
      repayment_term_type || "MONTHS",
      termValNum,
      totalRepayNum,
      instAmtNum,
      formattedStartDate,
      formattedEndDate,
      totalRepayNum,
      remarks || null,
      JSON.stringify(profileSnapshot),
    ]);

    await logSiteActivity({
      user_name: agent_name,
      user_email: agent_email || undefined,
      action_type: "DISBURSE_CASH_ADVANCE",
      module_name: "CASH_ADVANCES",
      description: `Disbursed ${currency || "AED"} ${advAmtNum.toLocaleString()} Cash Advance #${caCode} to ${agent_name}`,
      metadata: { cash_advance_id: result.insertId, cash_advance_code: caCode, advance_amount: advAmtNum },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      cash_advance_id: result.insertId,
      cash_advance_code: caCode,
      advance_amount: advAmtNum,
      currency,
      repayment_term_type,
      repayment_term_value: termValNum,
      total_repayment_amount: totalRepayNum,
      installment_amount: instAmtNum,
      due_start_date: formattedStartDate,
      due_end_date: formattedEndDate,
      balance_due: totalRepayNum,
      status: "ACTIVE",
      profile_snapshot: profileSnapshot,
    });
  } catch (error: any) {
    console.error("POST Cash Advance Error:", error);
    return NextResponse.json({ error: "Failed to disburse cash advance", details: error.message }, { status: 500 });
  }
}
