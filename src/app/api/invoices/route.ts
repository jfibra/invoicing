import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Helper: Ensure generated_invoices table exists
async function ensureInvoicesTable() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS generated_invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_number VARCHAR(100) NOT NULL UNIQUE,
      invoice_type VARCHAR(50) NOT NULL,
      template_style VARCHAR(50) DEFAULT 'modern_slate',
      particular_title VARCHAR(255) NULL,
      commission_status VARCHAR(100) NULL,
      member_id INT NULL,
      agent_code VARCHAR(100),
      agent_name VARCHAR(255) NOT NULL,
      agent_email VARCHAR(255),
      team_name VARCHAR(255),
      subteam_name VARCHAR(255),
      developer_name VARCHAR(255),
      project_name VARCHAR(255),
      project_location VARCHAR(255) NULL,
      unit_number VARCHAR(100),
      spa_reference VARCHAR(100),
      buyer_name VARCHAR(255) NULL,
      project_value DECIMAL(15,2) NULL,
      commission_received DECIMAL(15,2) NULL,
      commission_rate DECIMAL(5,2) NULL,
      net_amount DECIMAL(15,2) NOT NULL,
      vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
      vat_amount DECIMAL(15,2) NOT NULL,
      gross_amount DECIMAL(15,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'AED',
      status VARCHAR(50) DEFAULT 'ISSUED',
      is_locked TINYINT(1) DEFAULT 0,
      issued_date DATE NOT NULL,
      remarks TEXT,
      deductibles JSON NULL,
      profile_snapshot JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_invoice_num (invoice_number),
      INDEX idx_agent_code (agent_code),
      INDEX idx_status (status),
      INDEX idx_issued_date (issued_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  try {
    await commissionsDb.query("ALTER TABLE generated_invoices ADD COLUMN particular_title VARCHAR(255) NULL AFTER template_style");
    await commissionsDb.query("ALTER TABLE generated_invoices ADD COLUMN commission_status VARCHAR(100) NULL AFTER particular_title");
    await commissionsDb.query("ALTER TABLE generated_invoices ADD COLUMN project_location VARCHAR(255) NULL AFTER project_name");
    await commissionsDb.query("ALTER TABLE generated_invoices ADD COLUMN buyer_name VARCHAR(255) NULL AFTER spa_reference");
    await commissionsDb.query("ALTER TABLE generated_invoices ADD COLUMN project_value DECIMAL(15,2) NULL AFTER buyer_name");
    await commissionsDb.query("ALTER TABLE generated_invoices ADD COLUMN commission_received DECIMAL(15,2) NULL AFTER project_value");
    await commissionsDb.query("ALTER TABLE generated_invoices ADD COLUMN commission_rate DECIMAL(5,2) NULL AFTER commission_received");
    await commissionsDb.query("ALTER TABLE generated_invoices ADD COLUMN deductibles JSON NULL AFTER remarks");
  } catch (e) {}
}

// GET: List/Filter invoice history
export async function GET(request: NextRequest) {
  try {
    await ensureInvoicesTable();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 10)));
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (invoice_number LIKE ? OR agent_name LIKE ? OR agent_code LIKE ? OR developer_name LIKE ? OR project_name LIKE ?)`;
      const term = `%${search}%`;
      queryParams.push(term, term, term, term, term);
    }

    if (type) {
      whereClause += ` AND invoice_type = ?`;
      queryParams.push(type);
    }

    if (status) {
      whereClause += ` AND status = ?`;
      queryParams.push(status);
    }

    const [countRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM generated_invoices ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    const [kpiRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(net_amount), 0) as total_net,
        COALESCE(SUM(vat_amount), 0) as total_vat,
        COALESCE(SUM(gross_amount), 0) as total_gross
       FROM generated_invoices`
    );
    const kpis = kpiRows[0] || { total_count: 0, total_net: 0, total_vat: 0, total_gross: 0 };

    const [invoices] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM generated_invoices ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return NextResponse.json({
      success: true,
      invoices,
      kpis,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("GET Invoices Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices history", details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Edit Invoice Details OR Toggle Lock Status
export async function PUT(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    await ensureInvoicesTable();
    const body = await request.json();
    const { id, action, is_locked } = body;

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    // Scenario A: Lock / Unlock Toggle Action
    if (action === "toggle_lock") {
      const newLockState = is_locked ? 1 : 0;
      const [existing] = await commissionsDb.query<RowDataPacket[]>("SELECT invoice_number FROM generated_invoices WHERE id = ?", [id]);
      const invNum = existing[0]?.invoice_number || `ID #${id}`;

      await commissionsDb.query("UPDATE generated_invoices SET is_locked = ? WHERE id = ?", [
        newLockState,
        id,
      ]);

      await logSiteActivity({
        action_type: newLockState ? "LOCK_INVOICE" : "UNLOCK_INVOICE",
        module_name: "INVOICES",
        description: `${newLockState ? "Locked" : "Unlocked"} invoice ${invNum}`,
        metadata: { invoice_id: id, invoice_number: invNum, is_locked: newLockState },
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      return NextResponse.json({
        success: true,
        message: newLockState ? "Invoice locked successfully" : "Invoice unlocked for editing",
        is_locked: newLockState,
      });
    }

    // Scenario B: Update Invoice Data
    const [existing] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT is_locked, invoice_number, agent_name FROM generated_invoices WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existing[0].is_locked) {
      return NextResponse.json(
        { error: "This invoice is locked. Please unlock it before saving edits." },
        { status: 403 }
      );
    }

    const {
      invoice_type,
      currency,
      particular_title,
      commission_status,
      agent_name,
      agent_code,
      developer_name,
      project_name,
      project_location,
      unit_number,
      spa_reference,
      buyer_name,
      project_value,
      commission_received,
      commission_rate,
      net_amount,
      vat_rate,
      include_vat,
      deductibles,
      remarks,
    } = body;

    let projValNum = project_value ? Number(project_value) : null;
    let commRecNum = commission_received ? Number(commission_received) : null;
    let commRateNum = commission_rate ? Number(commission_rate) : null;

    let netNum = 0;
    if (commRecNum && commRateNum) {
      netNum = (commRecNum * commRateNum) / 100;
    } else if (projValNum && commRateNum) {
      netNum = (projValNum * commRateNum) / 100;
    } else {
      netNum = Number(net_amount || 0);
    }

    const vatRateNum = (include_vat === false || Number(vat_rate) === 0) ? 0 : Number(vat_rate || 5.00);
    const vatNum = (netNum * vatRateNum) / 100;

    const deductiblesArr = Array.isArray(deductibles) ? deductibles : [];
    const totalDeductibles = deductiblesArr.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
    const grossNum = netNum + vatNum - totalDeductibles;

    await commissionsDb.query(
      `UPDATE generated_invoices SET
        invoice_type = ?,
        currency = ?,
        particular_title = ?,
        commission_status = ?,
        agent_name = ?,
        agent_code = ?,
        developer_name = ?,
        project_name = ?,
        project_location = ?,
        unit_number = ?,
        spa_reference = ?,
        buyer_name = ?,
        project_value = ?,
        commission_received = ?,
        commission_rate = ?,
        net_amount = ?,
        vat_rate = ?,
        vat_amount = ?,
        gross_amount = ?,
        remarks = ?,
        deductibles = ?
      WHERE id = ?`,
      [
        invoice_type || "TAX_INVOICE",
        currency || "AED",
        particular_title || null,
        commission_status || null,
        agent_name,
        agent_code || null,
        developer_name || null,
        project_name || null,
        project_location || null,
        unit_number || null,
        spa_reference || null,
        buyer_name || null,
        projValNum,
        commRecNum,
        commRateNum,
        netNum,
        vatRateNum,
        vatNum,
        grossNum,
        remarks || null,
        JSON.stringify(deductiblesArr),
        id,
      ]
    );

    await logSiteActivity({
      user_name: agent_name,
      action_type: "EDIT_INVOICE",
      module_name: "INVOICES",
      description: `Updated invoice ${existing[0].invoice_number} for ${agent_name}`,
      metadata: { invoice_id: id, invoice_number: existing[0].invoice_number },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully! You can now View/Regenerate the canvas.",
    });
  } catch (error: any) {
    console.error("PUT Invoice Error:", error);
    return NextResponse.json({ error: "Failed to update invoice", details: error.message }, { status: 500 });
  }
}

// DELETE: Delete/Cancel an invoice record
export async function DELETE(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
    }

    const [existing] = await commissionsDb.query<RowDataPacket[]>("SELECT invoice_number, agent_name FROM generated_invoices WHERE id = ?", [id]);
    const invNum = existing[0]?.invoice_number || `ID #${id}`;

    await commissionsDb.query("DELETE FROM generated_invoices WHERE id = ?", [id]);

    await logSiteActivity({
      action_type: "DELETE_INVOICE",
      module_name: "INVOICES",
      description: `Deleted invoice record ${invNum}`,
      metadata: { invoice_id: id, invoice_number: invNum },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({ success: true, message: "Invoice record removed" });
  } catch (error: any) {
    console.error("DELETE Invoice Error:", error);
    return NextResponse.json({ error: "Failed to delete invoice record" }, { status: 500 });
  }
}
