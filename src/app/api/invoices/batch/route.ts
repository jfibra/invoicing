import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    const body = await request.json();
    const { invoices } = body;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ error: "An array of invoice items is required" }, { status: 400 });
    }

    // Fetch Admin Profile for snapshot
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

    const defaultProfileSnapshot = {
      profile: {
        ...profile,
        default_logo_url: logoUrl,
        template_style: profile?.template_style || "modern_slate",
      },
      address,
    };

    const issuedDate = new Date().toISOString().slice(0, 10);
    const createdInvoices = [];
    const errors = [];

    // Ensure generated_invoices table exists
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

    for (let i = 0; i < invoices.length; i++) {
      const item = invoices[i];
      const rowIndex = i + 1;

      if (!item.agent_name || item.agent_name.trim() === "") {
        errors.push(`Row ${rowIndex}: Missing required Agent Name`);
        continue;
      }

      const invType = (item.invoice_type || "TAX_INVOICE").trim().toUpperCase();
      const projValNum = item.project_value ? Number(item.project_value) : null;
      const commRecNum = item.commission_received ? Number(item.commission_received) : null;
      const commRateNum = item.commission_rate ? Number(item.commission_rate) : null;

      let netNum = 0;
      if (commRecNum && commRateNum) {
        netNum = (commRecNum * commRateNum) / 100;
      } else if (projValNum && commRateNum) {
        netNum = (projValNum * commRateNum) / 100;
      } else {
        netNum = Number(item.net_amount || 0);
      }

      if (isNaN(netNum) || netNum <= 0) {
        errors.push(`Row ${rowIndex} (${item.agent_name}): Net amount must be greater than 0`);
        continue;
      }

      const vatRateNum = item.include_vat === false || Number(item.vat_rate) === 0 ? 0 : Number(item.vat_rate ?? 5.00);
      const vatNum = (netNum * vatRateNum) / 100;

      let deductiblesArr: any[] = [];
      if (Array.isArray(item.deductibles)) {
        deductiblesArr = item.deductibles;
      } else if (typeof item.deductibles === "string" && item.deductibles.trim().startsWith("[")) {
        try {
          deductiblesArr = JSON.parse(item.deductibles);
        } catch (e) {}
      }

      const totalDeductibles = deductiblesArr.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
      const grossNum = netNum + vatNum - totalDeductibles;

      const typePrefix = invType === "TAX_INVOICE" ? "TAX" : invType === "AGENT_PAYOUT" ? "PAY" : invType === "PARTIAL_TRANCHE" ? "TRN" : "PRF";
      const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `LR-DXB-${typePrefix}-${yearMonth}-${randomSeq}`;

      const rawRowDate = item.issued_date || item.issueddate || item.invoice_date || item.date;
      const itemIssuedDate = (rawRowDate && String(rawRowDate).trim().length >= 10)
        ? String(rawRowDate).trim().slice(0, 10)
        : issuedDate;

      try {
        const [result] = await commissionsDb.query<ResultSetHeader>(`
          INSERT INTO generated_invoices 
          (invoice_number, invoice_type, template_style, particular_title, commission_status, member_id, agent_code, agent_name, agent_email, team_name, subteam_name, developer_name, project_name, project_location, unit_number, buyer_name, project_value, commission_received, commission_rate, net_amount, vat_rate, vat_amount, gross_amount, currency, status, issued_date, remarks, deductibles, profile_snapshot)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ISSUED', ?, ?, ?, ?)
        `, [
          invoiceNumber,
          invType,
          item.template_style || "modern_slate",
          item.particular_title || null,
          item.commission_status || null,
          item.member_id || null,
          item.agent_code || null,
          item.agent_name.trim(),
          item.agent_email || null,
          item.team_name || null,
          item.subteam_name || null,
          item.developer_name || null,
          item.project_name || null,
          item.project_location || null,
          item.unit_number || null,
          item.buyer_name || null,
          projValNum,
          commRecNum,
          commRateNum,
          netNum,
          vatRateNum,
          vatNum,
          grossNum,
          item.currency || "AED",
          itemIssuedDate,
          item.remarks || null,
          JSON.stringify(deductiblesArr),
          JSON.stringify(defaultProfileSnapshot),
        ]);

        createdInvoices.push({
          id: result.insertId,
          invoice_number: invoiceNumber,
          agent_name: item.agent_name,
          net_amount: netNum,
          gross_amount: grossNum,
        });
      } catch (err: any) {
        errors.push(`Row ${rowIndex} (${item.agent_name}): ${err.message}`);
      }
    }

    if (createdInvoices.length > 0) {
      await logSiteActivity({
        action_type: "BATCH_INVOICES",
        module_name: "INVOICES",
        description: `Processed CSV batch upload generating ${createdInvoices.length} invoices`,
        metadata: { created_count: createdInvoices.length },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }

    return NextResponse.json({
      success: true,
      created_count: createdInvoices.length,
      created_invoices: createdInvoices,
      errors: errors,
    });
  } catch (error: any) {
    console.error("API Batch Invoices Error:", error);
    return NextResponse.json({ error: "Failed to process batch invoices", details: error.message }, { status: 500 });
  }
}
