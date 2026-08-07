import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket } from "mysql2";

export async function ensureTrnLibraryTables() {
  // Main TRN Records Master Table
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS trn_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      tin_number VARCHAR(100) NOT NULL,
      country_code VARCHAR(10) NOT NULL DEFAULT 'UAE', -- 'UAE' or 'PH'
      entity_type VARCHAR(50) NOT NULL DEFAULT 'SALES', -- 'SALES' or 'EXPENSES'
      tax_reg_date DATE NULL,
      trade_license_number VARCHAR(100) NULL,
      notes TEXT NULL,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_company_name (company_name),
      INDEX idx_tin (tin_number),
      INDEX idx_entity_type (entity_type),
      INDEX idx_country_code (country_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Separate Table 1: Contact Persons
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS trn_contact_persons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trn_record_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NULL,
      phone VARCHAR(100) NULL,
      designation VARCHAR(100) NULL,
      is_primary TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_trn_rec (trn_record_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Separate Table 2: Addresses
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS trn_addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trn_record_id INT NOT NULL,
      street_address TEXT NOT NULL,
      city VARCHAR(100) NULL,
      state_province VARCHAR(100) NULL,
      postal_code VARCHAR(50) NULL,
      country VARCHAR(100) DEFAULT 'United Arab Emirates',
      is_primary TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_trn_rec (trn_record_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Separate Table 3: Bank Accounts
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS trn_bank_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trn_record_id INT NOT NULL,
      bank_name VARCHAR(255) NOT NULL,
      account_name VARCHAR(255) NULL,
      account_number VARCHAR(100) NULL,
      iban VARCHAR(100) NULL,
      swift_code VARCHAR(50) NULL,
      currency VARCHAR(10) DEFAULT 'AED',
      is_primary TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_trn_rec (trn_record_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// GET: Fetch / Search TRN Records with optional joined relational data
export async function GET(request: NextRequest) {
  try {
    await ensureTrnLibraryTables();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const country = searchParams.get("country") || "";

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (tr.company_name LIKE ? OR tr.tin_number LIKE ? OR tr.trade_license_number LIKE ?)`;
      const term = `%${search}%`;
      queryParams.push(term, term, term);
    }

    if (type) {
      whereClause += ` AND tr.entity_type = ?`;
      queryParams.push(type);
    }

    if (country) {
      whereClause += ` AND tr.country_code = ?`;
      queryParams.push(country);
    }

    const [records] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT tr.*,
        ta.street_address as primary_address, ta.city, ta.country,
        tcp.name as primary_contact_name, tcp.email as primary_contact_email, tcp.phone as primary_contact_phone,
        tba.bank_name as primary_bank_name, tba.iban as primary_iban
       FROM trn_records tr
       LEFT JOIN trn_addresses ta ON tr.id = ta.trn_record_id AND ta.is_primary = 1
       LEFT JOIN trn_contact_persons tcp ON tr.id = tcp.trn_record_id AND tcp.is_primary = 1
       LEFT JOIN trn_bank_accounts tba ON tr.id = tba.trn_record_id AND tba.is_primary = 1
       ${whereClause} ORDER BY tr.company_name ASC`,
      queryParams
    );

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error: any) {
    console.error("GET TRN Records Error:", error);
    return NextResponse.json({ error: "Failed to fetch TRN library records", details: error.message }, { status: 500 });
  }
}

// POST: Add New TRN Record + Optional Child Relational Records
export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    await ensureTrnLibraryTables();
    const body = await request.json();

    const {
      company_name,
      tin_number,
      country_code,
      entity_type,
      tax_reg_date,
      trade_license_number,
      notes,
      // Optional Relational Fields
      contact_person,
      contact_email,
      contact_phone,
      address,
      city,
      state_province,
      postal_code,
      country,
      bank_name,
      bank_account_number,
      iban,
      swift_code,
    } = body;

    // Only Company Name & TIN/TRN Number are required now!
    if (!company_name || !tin_number) {
      return NextResponse.json(
        { error: "Company Name and TRN/TIN Number are required." },
        { status: 400 }
      );
    }

    // Insert Master TRN Record
    const [result]: any = await commissionsDb.query(
      `INSERT INTO trn_records (
        company_name,
        tin_number,
        country_code,
        entity_type,
        tax_reg_date,
        trade_license_number,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        company_name.trim(),
        tin_number.trim(),
        country_code || "UAE",
        entity_type || "SALES",
        tax_reg_date || null,
        trade_license_number || null,
        notes || null,
      ]
    );

    const trnRecordId = result.insertId;

    // Insert Optional Child Relational Record 1: Contact Person
    if (contact_person && String(contact_person).trim()) {
      await commissionsDb.query(
        `INSERT INTO trn_contact_persons (trn_record_id, name, email, phone, is_primary) VALUES (?, ?, ?, ?, 1)`,
        [trnRecordId, String(contact_person).trim(), contact_email || null, contact_phone || null]
      );
    }

    // Insert Optional Child Relational Record 2: Address
    if (address && String(address).trim()) {
      await commissionsDb.query(
        `INSERT INTO trn_addresses (trn_record_id, street_address, city, state_province, postal_code, country, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          trnRecordId,
          String(address).trim(),
          city || null,
          state_province || null,
          postal_code || null,
          country || (country_code === "PH" ? "Philippines" : "United Arab Emirates"),
        ]
      );
    }

    // Insert Optional Child Relational Record 3: Bank Account
    if (bank_name && String(bank_name).trim()) {
      await commissionsDb.query(
        `INSERT INTO trn_bank_accounts (trn_record_id, bank_name, account_number, iban, swift_code, is_primary) VALUES (?, ?, ?, ?, ?, 1)`,
        [trnRecordId, String(bank_name).trim(), bank_account_number || null, iban || null, swift_code || null]
      );
    }

    await logSiteActivity({
      action_type: "ADD_TRN_RECORD",
      module_name: "TRN_LIBRARY",
      description: `Added TRN/TIN record for ${company_name} (${tin_number})`,
      metadata: { record_id: trnRecordId, company_name, tin_number, entity_type },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "TRN Record saved to library!",
      record_id: trnRecordId,
    });
  } catch (error: any) {
    console.error("POST TRN Record Error:", error);
    return NextResponse.json({ error: "Failed to save TRN record", details: error.message }, { status: 500 });
  }
}
