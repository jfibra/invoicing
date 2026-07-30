import { NextRequest, NextResponse } from "next/server";
import { commissionsDb, leuterioDb } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET Profile Settings for ADMIN or specific TEAM
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileType = (searchParams.get("type") || "ADMIN").toUpperCase();
    const teamId = searchParams.get("teamId") ? Number(searchParams.get("teamId")) : null;

    // 1. Fetch Invoice Profile from commissions_hub
    let profileSql = "SELECT * FROM invoice_profiles WHERE profile_type = ?";
    const profileParams: any[] = [profileType];

    if (profileType === "TEAM" && teamId) {
      profileSql += " AND team_id = ?";
      profileParams.push(teamId);
    } else {
      profileSql += " AND team_id IS NULL";
    }

    let [profiles] = await commissionsDb.query<RowDataPacket[]>(profileSql, profileParams);

    // If profile doesn't exist yet, insert default initial profile
    if (profiles.length === 0) {
      const [insertResult] = await commissionsDb.query<ResultSetHeader>(`
        INSERT INTO invoice_profiles 
        (profile_type, team_id, company_name, trn_number, template_style, currency, tax_percentage, payment_terms, bank_name, account_name, iban, swift_code, footer_notes)
        VALUES (?, ?, 'Leuterio Realty & Brokerage LLC', '100293847500003', 'modern_slate', 'AED', 5.00, 'Payment due within 15 days of invoice issuance', 'Emirates NBD', 'Leuterio Realty LLC', 'AE480260000001234567890', 'EBILAEAD', 'Thank you for doing business with Leuterio Realty.')
      `, [profileType, teamId]);

      // Add default Dubai address
      await commissionsDb.query(`
        INSERT INTO profile_addresses (profile_id, address_label, building_name, street_address, area_locality, city, country, po_box, is_default)
        VALUES (?, 'Dubai Headquarters', 'Opus Tower by Omniyat', 'Marasi Drive, Business Bay', 'Downtown Dubai', 'Dubai', 'United Arab Emirates', 'PO Box 12345', 1)
      `, [insertResult.insertId]);

      [profiles] = await commissionsDb.query<RowDataPacket[]>("SELECT * FROM invoice_profiles WHERE id = ?", [insertResult.insertId]);
    }

    const profile = profiles[0];

    // 2. Fetch Addresses and Logos for this profile
    const [addresses] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM profile_addresses WHERE profile_id = ? ORDER BY is_default DESC, id ASC",
      [profile.id]
    );

    const [logos] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM profile_logos WHERE profile_id = ? ORDER BY is_default DESC, id ASC",
      [profile.id]
    );

    // Ensure default_logo_url is in sync with default logo in profile_logos
    const defaultLogo = logos.find((l: any) => l.is_default) || logos[0];
    if (defaultLogo && defaultLogo.s3_url) {
      profile.default_logo_url = defaultLogo.s3_url;
    }

    // 3. Fetch Teams list for Team Profile Selector
    const [teams] = await leuterioDb.query<RowDataPacket[]>(
      "SELECT id, teamname FROM sales_team WHERE status = 'active' ORDER BY teamname ASC"
    );

    return NextResponse.json({
      success: true,
      profile,
      addresses,
      logos,
      teams,
    });
  } catch (error: any) {
    console.error("API Get Invoice Profile Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice profile", details: error.message }, { status: 500 });
  }
}

// POST/PUT Update Profile, Addresses, and Logos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile_id,
      company_name,
      trn_number,
      template_style,
      currency,
      tax_percentage,
      payment_terms,
      bank_name,
      account_name,
      iban,
      swift_code,
      footer_notes,
      default_logo_url,
      addresses,
      logos,
    } = body;

    if (!profile_id) {
      return NextResponse.json({ error: "Profile ID required" }, { status: 400 });
    }

    let activeDefaultLogoUrl = default_logo_url || null;

    // 1. Sync Multiple Logos if provided first to find default
    if (Array.isArray(logos)) {
      await commissionsDb.query("DELETE FROM profile_logos WHERE profile_id = ?", [profile_id]);
      for (const l of logos) {
        if (l.is_default && l.s3_url) {
          activeDefaultLogoUrl = l.s3_url;
        }
        await commissionsDb.query(`
          INSERT INTO profile_logos (profile_id, logo_name, s3_url, is_default)
          VALUES (?, ?, ?, ?)
        `, [
          profile_id,
          l.logo_name || "Invoice Logo",
          l.s3_url,
          l.is_default ? 1 : 0,
        ]);
      }
    }

    // 2. Update Invoice Profile with resolved default logo URL
    await commissionsDb.query(`
      UPDATE invoice_profiles SET
        company_name = ?,
        trn_number = ?,
        template_style = ?,
        currency = ?,
        tax_percentage = ?,
        payment_terms = ?,
        bank_name = ?,
        account_name = ?,
        iban = ?,
        swift_code = ?,
        footer_notes = ?,
        default_logo_url = ?
      WHERE id = ?
    `, [
      company_name,
      trn_number,
      template_style || "modern_slate",
      currency || "AED",
      tax_percentage || 5.00,
      payment_terms,
      bank_name,
      account_name,
      iban,
      swift_code,
      footer_notes,
      activeDefaultLogoUrl,
      profile_id,
    ]);

    // 3. Sync Addresses if provided
    if (Array.isArray(addresses)) {
      await commissionsDb.query("DELETE FROM profile_addresses WHERE profile_id = ?", [profile_id]);
      for (const addr of addresses) {
        await commissionsDb.query(`
          INSERT INTO profile_addresses 
          (profile_id, address_label, building_name, street_address, area_locality, city, country, po_box, is_default)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          profile_id,
          addr.address_label || "Office",
          addr.building_name || null,
          addr.street_address,
          addr.area_locality || null,
          addr.city || "Dubai",
          addr.country || "United Arab Emirates",
          addr.po_box || null,
          addr.is_default ? 1 : 0,
        ]);
      }
    }

    return NextResponse.json({ success: true, message: "Invoice profile updated successfully" });
  } catch (error: any) {
    console.error("API Save Invoice Profile Error:", error);
    return NextResponse.json({ error: "Failed to save invoice profile", details: error.message }, { status: 500 });
  }
}
