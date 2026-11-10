import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket } from "mysql2";

// GET single stamp
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM account_stamps WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Stamp not found" }, { status: 404 });
    }

    const r = rows[0];
    let parsedConfig = null;
    try {
      parsedConfig = typeof r.config_json === "string" ? JSON.parse(r.config_json) : r.config_json;
    } catch (e) {
      parsedConfig = {};
    }

    return NextResponse.json({
      success: true,
      stamp: {
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
      },
    });
  } catch (error: any) {
    console.error("API GET Stamp by ID Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stamp", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete a stamp
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT stamp_name, account_name FROM account_stamps WHERE id = ?",
      [id]
    );

    await commissionsDb.query(
      "UPDATE account_stamps SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    if (rows.length > 0) {
      await logSiteActivity({
        module_name: "STAMP_GENERATOR",
        action_type: "DELETE",
        description: `Deleted stamp '${rows[0].stamp_name}' for account '${rows[0].account_name}'`,
        metadata: { stamp_id: Number(id) },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Stamp deleted successfully",
    });
  } catch (error: any) {
    console.error("API DELETE Stamp Error:", error);
    return NextResponse.json(
      { error: "Failed to delete stamp", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Toggle default or rename
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isDefault, stampName } = body;

    const [rows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM account_stamps WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Stamp not found" }, { status: 404 });
    }

    const current = rows[0];

    if (typeof isDefault === "boolean") {
      if (isDefault) {
        // Unset other defaults for this account
        await commissionsDb.query(
          "UPDATE account_stamps SET is_default = 0 WHERE account_id = ? AND deleted_at IS NULL",
          [current.account_id]
        );
      }
      await commissionsDb.query(
        "UPDATE account_stamps SET is_default = ? WHERE id = ?",
        [isDefault ? 1 : 0, id]
      );
    }

    if (stampName && stampName.trim()) {
      await commissionsDb.query(
        "UPDATE account_stamps SET stamp_name = ? WHERE id = ?",
        [stampName.trim(), id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stamp updated successfully",
    });
  } catch (error: any) {
    console.error("API PATCH Stamp Error:", error);
    return NextResponse.json(
      { error: "Failed to update stamp", details: error.message },
      { status: 500 }
    );
  }
}
