import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket } from "mysql2";
import { ensureTrnLibraryTables } from "../route";

// GET: Single TRN Record by ID (including linked contact, address, bank accounts)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTrnLibraryTables();
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const [rows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT tr.*,
        ta.id as address_id, ta.street_address, ta.city, ta.state_province, ta.postal_code, ta.country,
        tcp.id as contact_id, tcp.name as contact_person, tcp.email as contact_email, tcp.phone as contact_phone, tcp.designation,
        tba.id as bank_id, tba.bank_name, tba.account_name, tba.account_number, tba.iban, tba.swift_code
       FROM trn_records tr
       LEFT JOIN trn_addresses ta ON tr.id = ta.trn_record_id AND ta.is_primary = 1
       LEFT JOIN trn_contact_persons tcp ON tr.id = tcp.trn_record_id AND tcp.is_primary = 1
       LEFT JOIN trn_bank_accounts tba ON tr.id = tba.trn_record_id AND tba.is_primary = 1
       WHERE tr.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "TRN Record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      record: rows[0],
    });
  } catch (error: any) {
    console.error("GET TRN Record by ID Error:", error);
    return NextResponse.json({ error: "Failed to fetch TRN record", details: error.message }, { status: 500 });
  }
}

// PUT: Update Existing TRN Record + Linked Child Tables
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    await ensureTrnLibraryTables();
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();

    const {
      company_name,
      tin_number,
      country_code,
      entity_type,
      tax_reg_date,
      trade_license_number,
      notes,
      status,
      // Relational child table values
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

    if (!company_name || !tin_number) {
      return NextResponse.json({ error: "Company Name and TRN/TIN Number are required" }, { status: 400 });
    }

    // 1. Update Master Table
    await commissionsDb.query(
      `UPDATE trn_records SET
        company_name = ?,
        tin_number = ?,
        country_code = ?,
        entity_type = ?,
        tax_reg_date = ?,
        trade_license_number = ?,
        notes = ?,
        status = ?
       WHERE id = ?`,
      [
        company_name.trim(),
        tin_number.trim(),
        country_code || "UAE",
        entity_type || "SALES",
        tax_reg_date || null,
        trade_license_number || null,
        notes || null,
        status || "ACTIVE",
        id,
      ]
    );

    // 2. Update/Insert Primary Address Record
    const [existingAddress] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT id FROM trn_addresses WHERE trn_record_id = ? AND is_primary = 1`,
      [id]
    );

    if (address && String(address).trim()) {
      if (existingAddress.length > 0) {
        await commissionsDb.query(
          `UPDATE trn_addresses SET street_address = ?, city = ?, state_province = ?, postal_code = ?, country = ? WHERE id = ?`,
          [
            String(address).trim(),
            city || null,
            state_province || null,
            postal_code || null,
            country || (country_code === "PH" ? "Philippines" : "United Arab Emirates"),
            existingAddress[0].id,
          ]
        );
      } else {
        await commissionsDb.query(
          `INSERT INTO trn_addresses (trn_record_id, street_address, city, state_province, postal_code, country, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            id,
            String(address).trim(),
            city || null,
            state_province || null,
            postal_code || null,
            country || (country_code === "PH" ? "Philippines" : "United Arab Emirates"),
          ]
        );
      }
    }

    // 3. Update/Insert Primary Contact Person Record
    const [existingContact] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT id FROM trn_contact_persons WHERE trn_record_id = ? AND is_primary = 1`,
      [id]
    );

    if (contact_person && String(contact_person).trim()) {
      if (existingContact.length > 0) {
        await commissionsDb.query(
          `UPDATE trn_contact_persons SET name = ?, email = ?, phone = ? WHERE id = ?`,
          [String(contact_person).trim(), contact_email || null, contact_phone || null, existingContact[0].id]
        );
      } else {
        await commissionsDb.query(
          `INSERT INTO trn_contact_persons (trn_record_id, name, email, phone, is_primary) VALUES (?, ?, ?, ?, 1)`,
          [id, String(contact_person).trim(), contact_email || null, contact_phone || null]
        );
      }
    }

    // 4. Update/Insert Primary Bank Account Record
    const [existingBank] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT id FROM trn_bank_accounts WHERE trn_record_id = ? AND is_primary = 1`,
      [id]
    );

    if (bank_name && String(bank_name).trim()) {
      if (existingBank.length > 0) {
        await commissionsDb.query(
          `UPDATE trn_bank_accounts SET bank_name = ?, account_number = ?, iban = ?, swift_code = ? WHERE id = ?`,
          [String(bank_name).trim(), bank_account_number || null, iban || null, swift_code || null, existingBank[0].id]
        );
      } else {
        await commissionsDb.query(
          `INSERT INTO trn_bank_accounts (trn_record_id, bank_name, account_number, iban, swift_code, is_primary) VALUES (?, ?, ?, ?, ?, 1)`,
          [id, String(bank_name).trim(), bank_account_number || null, iban || null, swift_code || null]
        );
      }
    }

    await logSiteActivity({
      action_type: "EDIT_TRN_RECORD",
      module_name: "TRN_LIBRARY",
      description: `Updated TRN/TIN record for ${company_name} (ID #${id})`,
      metadata: { record_id: id, company_name, tin_number },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "TRN Record updated successfully!",
    });
  } catch (error: any) {
    console.error("PUT TRN Record Error:", error);
    return NextResponse.json({ error: "Failed to update TRN record", details: error.message }, { status: 500 });
  }
}

// DELETE: Remove TRN Record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    await commissionsDb.query(`DELETE FROM trn_contact_persons WHERE trn_record_id = ?`, [id]);
    await commissionsDb.query(`DELETE FROM trn_addresses WHERE trn_record_id = ?`, [id]);
    await commissionsDb.query(`DELETE FROM trn_bank_accounts WHERE trn_record_id = ?`, [id]);
    await commissionsDb.query(`DELETE FROM trn_records WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, message: "TRN record removed" });
  } catch (error: any) {
    console.error("DELETE TRN Record Error:", error);
    return NextResponse.json({ error: "Failed to delete TRN record", details: error.message }, { status: 500 });
  }
}
