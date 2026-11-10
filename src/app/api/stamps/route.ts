import { NextRequest, NextResponse } from "next/server";
import { commissionsDb, leuterioDb } from "@/lib/db";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Helper: Ensure account_stamps table exists in commissions_hub
export async function ensureAccountStampsTable() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS account_stamps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      account_id VARCHAR(100) NOT NULL DEFAULT 'default',
      account_type VARCHAR(50) NOT NULL DEFAULT 'USER', -- 'USER', 'TEAM', 'PROFILE', 'SYSTEM'
      account_name VARCHAR(255) NOT NULL DEFAULT 'Default Account',
      stamp_name VARCHAR(255) NOT NULL,
      template VARCHAR(50) NOT NULL DEFAULT 'slanted_banner',
      config_json LONGTEXT NOT NULL,
      preview_image_url LONGTEXT NULL,
      is_default TINYINT(1) DEFAULT 0,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      INDEX idx_account (account_id, account_type),
      INDEX idx_template (template),
      INDEX idx_deleted (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// GET: Fetch saved stamps for account
export async function GET(request: NextRequest) {
  try {
    await ensureAccountStampsTable();

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const accountType = searchParams.get("accountType");
    const includeAll = searchParams.get("includeAll") === "true";

    let sql = "SELECT * FROM account_stamps WHERE deleted_at IS NULL";
    const params: any[] = [];

    if (!includeAll) {
      if (accountId) {
        sql += " AND (account_id = ? OR account_id = 'default' OR account_id = 'admin')";
        params.push(accountId);
      }
      if (accountType) {
        sql += " AND account_type = ?";
        params.push(accountType);
      }
    }

    sql += " ORDER BY is_default DESC, updated_at DESC, id DESC";

    const [rows] = await commissionsDb.query<RowDataPacket[]>(sql, params);

    const stamps = rows.map((r: any) => {
      let parsedConfig = null;
      try {
        parsedConfig = typeof r.config_json === "string" ? JSON.parse(r.config_json) : r.config_json;
      } catch (e) {
        parsedConfig = {};
      }
      return {
        id: r.id,
        accountId: r.account_id,
        accountType: r.account_type,
        accountName: r.account_name,
        stampName: r.stamp_name,
        template: r.template,
        config: parsedConfig,
        previewImageUrl: r.preview_image_url,
        isDefault: Boolean(r.is_default),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      stamps,
      count: stamps.length,
    });
  } catch (error: any) {
    console.error("API GET Stamps Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved stamps", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Save or Update a Stamp Design
export async function POST(request: NextRequest) {
  try {
    await ensureAccountStampsTable();

    const body = await request.json();
    const {
      id,
      accountId = "default",
      accountType = "USER",
      accountName = "Default Account",
      stampName,
      template = "slanted_banner",
      config,
      previewImageUrl = null,
      isDefault = false,
      createdBy = null,
    } = body;

    if (!stampName || !stampName.trim()) {
      return NextResponse.json(
        { error: "Stamp name is required" },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { error: "Stamp configuration is required" },
        { status: 400 }
      );
    }

    const configStr = typeof config === "string" ? config : JSON.stringify(config);

    // If marked as default, unset other defaults for the same account
    if (isDefault) {
      await commissionsDb.query(
        "UPDATE account_stamps SET is_default = 0 WHERE account_id = ? AND deleted_at IS NULL",
        [accountId]
      );
    }

    if (id) {
      // UPDATE Existing Stamp
      await commissionsDb.query(
        `UPDATE account_stamps SET
          stamp_name = ?,
          template = ?,
          config_json = ?,
          preview_image_url = COALESCE(?, preview_image_url),
          is_default = ?,
          account_id = ?,
          account_type = ?,
          account_name = ?
        WHERE id = ? AND deleted_at IS NULL`,
        [
          stampName.trim(),
          template,
          configStr,
          previewImageUrl,
          isDefault ? 1 : 0,
          accountId,
          accountType,
          accountName,
          id,
        ]
      );

      await logSiteActivity({
        module_name: "STAMP_GENERATOR",
        action_type: "UPDATE",
        description: `Updated stamp design '${stampName.trim()}' for account '${accountName}'`,
        metadata: { stamp_id: id, account_id: accountId },
      });

      return NextResponse.json({
        success: true,
        message: "Stamp updated successfully",
        stampId: id,
      });
    } else {
      // INSERT New Stamp
      const [result] = await commissionsDb.query<ResultSetHeader>(
        `INSERT INTO account_stamps 
          (account_id, account_type, account_name, stamp_name, template, config_json, preview_image_url, is_default, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          accountType,
          accountName,
          stampName.trim(),
          template,
          configStr,
          previewImageUrl,
          isDefault ? 1 : 0,
          createdBy,
        ]
      );

      const newId = result.insertId;

      await logSiteActivity({
        module_name: "STAMP_GENERATOR",
        action_type: "CREATE",
        description: `Saved new stamp design '${stampName.trim()}' for account '${accountName}'`,
        metadata: { stamp_id: newId, account_id: accountId },
      });

      return NextResponse.json({
        success: true,
        message: "Stamp saved successfully",
        stampId: newId,
      });
    }
  } catch (error: any) {
    console.error("API POST Stamp Error:", error);
    return NextResponse.json(
      { error: "Failed to save stamp design", details: error.message },
      { status: 500 }
    );
  }
}
