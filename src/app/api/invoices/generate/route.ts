import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    const body = await request.json();
    const {
      invoice_type,
      template_style,
      currency,
      particular_title,
      commission_status,
      member_id,
      agent_code,
      agent_name,
      agent_email,
      team_name,
      subteam_name,
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

    if (!agent_name || (!netNum && netNum !== 0)) {
      return NextResponse.json({ error: "Agent name and valid net amount or commission calculation are required" }, { status: 400 });
    }

    const vatRateNum = (include_vat === false || Number(vat_rate) === 0) ? 0 : Number(vat_rate || 5.00);
    const vatNum = (netNum * vatRateNum) / 100;

    const deductiblesArr = Array.isArray(deductibles) ? deductibles : [];
    const totalDeductibles = deductiblesArr.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

    const grossNum = netNum + vatNum - totalDeductibles;

    const typePrefix = invoice_type === "TAX_INVOICE" ? "TAX" : invoice_type === "AGENT_PAYOUT" ? "PAY" : invoice_type === "PARTIAL_TRANCHE" ? "TRN" : "PRF";
    const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `LR-DXB-${typePrefix}-${yearMonth}-${randomSeq}`;

    let profile = null;
    let logoUrl = null;

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
    }

    let address = null;
    if (profile) {
      const [addresses] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT * FROM profile_addresses WHERE profile_id = ? ORDER BY is_default DESC, id ASC LIMIT 1",
        [profile.id]
      );
      address = addresses[0] || null;
    }

    const profileSnapshot = {
      profile: {
        ...profile,
        default_logo_url: logoUrl,
        template_style: template_style || profile?.template_style || "modern_slate",
      },
      address,
    };

    const issuedDate = new Date().toISOString().slice(0, 10);

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

    const [result] = await commissionsDb.query<ResultSetHeader>(`
      INSERT INTO generated_invoices 
      (invoice_number, invoice_type, template_style, particular_title, commission_status, member_id, agent_code, agent_name, agent_email, team_name, subteam_name, developer_name, project_name, project_location, unit_number, spa_reference, buyer_name, project_value, commission_received, commission_rate, net_amount, vat_rate, vat_amount, gross_amount, currency, status, issued_date, remarks, deductibles, profile_snapshot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ISSUED', ?, ?, ?, ?)
    `, [
      invoiceNumber,
      invoice_type || "TAX_INVOICE",
      template_style || "modern_slate",
      particular_title || null,
      commission_status || null,
      member_id || null,
      agent_code || null,
      agent_name,
      agent_email || null,
      team_name || null,
      subteam_name || null,
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
      currency || "AED",
      issuedDate,
      remarks || null,
      JSON.stringify(deductiblesArr),
      JSON.stringify(profileSnapshot),
    ]);

    // Record Site Activity Audit Log
    await logSiteActivity({
      user_name: agent_name,
      user_email: agent_email || undefined,
      action_type: "CREATE_INVOICE",
      module_name: "INVOICES",
      description: `Generated ${invoice_type || "TAX_INVOICE"} invoice #${invoiceNumber} for ${agent_name} (${currency || "AED"} ${grossNum.toLocaleString()})`,
      metadata: { invoice_id: result.insertId, invoice_number: invoiceNumber, gross_amount: grossNum },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      invoice_id: result.insertId,
      invoice_number: invoiceNumber,
      template_style: template_style || "modern_slate",
      currency: currency || "AED",
      particular_title,
      commission_status,
      net_amount: netNum,
      vat_amount: vatNum,
      gross_amount: grossNum,
      project_location,
      buyer_name,
      project_value: projValNum,
      commission_received: commRecNum,
      commission_rate: commRateNum,
      deductibles: deductiblesArr,
      profile_snapshot: profileSnapshot,
    });
  } catch (error: any) {
    console.error("API Save Invoice Error:", error);
    return NextResponse.json({ error: "Failed to generate invoice", details: error.message }, { status: 500 });
  }
}
