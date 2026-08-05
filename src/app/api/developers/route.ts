import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { ensureDevelopersTable } from "@/lib/developers";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET: Fetch list of developers (Supports search, status, include_deleted)
export async function GET(request: NextRequest) {
  try {
    await ensureDevelopersTable();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includeDeleted = searchParams.get("include_deleted") === "true";
    const search = searchParams.get("search") || "";

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (!includeDeleted) {
      whereClause += " AND deleted_at IS NULL";
    }

    if (status) {
      whereClause += " AND status = ?";
      queryParams.push(status);
    }

    if (search) {
      whereClause += " AND (name LIKE ? OR code LIKE ? OR tin_number LIKE ? OR city LIKE ?)";
      const term = `%${search}%`;
      queryParams.push(term, term, term, term);
    }

    const [developers] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM developers ${whereClause} ORDER BY name ASC`,
      queryParams
    );

    return NextResponse.json({
      success: true,
      developers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch developers" },
      { status: 500 }
    );
  }
}

// POST: Create a new developer
export async function POST(request: NextRequest) {
  try {
    await ensureDevelopersTable();
    const body = await request.json();
    const {
      name,
      code,
      tin_number,
      address,
      city,
      country,
      contact_person,
      contact_email,
      contact_phone,
      status,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Developer name is required" }, { status: 400 });
    }

    const devCode = code ? code.trim().toUpperCase() : `DEV-${name.trim().toUpperCase().slice(0, 5)}`;
    const devStatus = status === "inactive" ? "inactive" : "active";

    const [result] = await commissionsDb.query<ResultSetHeader>(
      `INSERT INTO developers 
       (name, code, tin_number, address, city, country, contact_person, contact_email, contact_phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        devCode,
        tin_number ? tin_number.trim() : null,
        address ? address.trim() : null,
        city ? city.trim() : "Dubai",
        country ? country.trim() : "United Arab Emirates",
        contact_person ? contact_person.trim() : null,
        contact_email ? contact_email.trim() : null,
        contact_phone ? contact_phone.trim() : null,
        devStatus,
      ]
    );

    const [created] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM developers WHERE id = ?",
      [result.insertId]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "CREATE_DEVELOPER",
      module_name: "SETTINGS",
      description: `Created developer '${name.trim()}' (${devCode})`,
      metadata: { developer_id: result.insertId, name: name.trim(), code: devCode },
    });

    return NextResponse.json({
      success: true,
      message: "Developer created successfully",
      developer: created[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create developer" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing developer or restore a soft-deleted item
export async function PUT(request: NextRequest) {
  try {
    await ensureDevelopersTable();
    const body = await request.json();
    const {
      id,
      name,
      code,
      tin_number,
      address,
      city,
      country,
      contact_person,
      contact_email,
      contact_phone,
      status,
      action,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Developer ID is required" }, { status: 400 });
    }

    const [existing] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM developers WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    // Handle Restore Action
    if (action === "restore") {
      await commissionsDb.query("UPDATE developers SET deleted_at = NULL WHERE id = ?", [id]);
      await logSiteActivity({
        user_name: "System Admin",
        action_type: "RESTORE_DEVELOPER",
        module_name: "SETTINGS",
        description: `Restored developer '${existing[0].name}' (#${id})`,
        metadata: { developer_id: id, name: existing[0].name },
      });

      return NextResponse.json({
        success: true,
        message: "Developer restored successfully",
      });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Developer name is required" }, { status: 400 });
    }

    const devCode = code ? code.trim().toUpperCase() : existing[0].code;
    const devStatus = status === "inactive" ? "inactive" : "active";

    await commissionsDb.query(
      `UPDATE developers SET 
        name = ?, 
        code = ?, 
        tin_number = ?, 
        address = ?, 
        city = ?, 
        country = ?, 
        contact_person = ?, 
        contact_email = ?, 
        contact_phone = ?, 
        status = ? 
       WHERE id = ?`,
      [
        name.trim(),
        devCode,
        tin_number ? tin_number.trim() : null,
        address ? address.trim() : null,
        city ? city.trim() : "Dubai",
        country ? country.trim() : "United Arab Emirates",
        contact_person ? contact_person.trim() : null,
        contact_email ? contact_email.trim() : null,
        contact_phone ? contact_phone.trim() : null,
        devStatus,
        id,
      ]
    );

    const [updated] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM developers WHERE id = ?",
      [id]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "UPDATE_DEVELOPER",
      module_name: "SETTINGS",
      description: `Updated developer '${name.trim()}' (#${id})`,
      metadata: { developer_id: id, name: name.trim() },
    });

    return NextResponse.json({
      success: true,
      message: "Developer updated successfully",
      developer: updated[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update developer" },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete a developer (sets deleted_at = CURRENT_TIMESTAMP)
export async function DELETE(request: NextRequest) {
  try {
    await ensureDevelopersTable();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: "Developer ID is required" }, { status: 400 });
    }

    const [existing] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT id, name FROM developers WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    await commissionsDb.query(
      "UPDATE developers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "DELETE_DEVELOPER",
      module_name: "SETTINGS",
      description: `Soft-deleted developer '${existing[0].name}' (#${id})`,
      metadata: { developer_id: id, name: existing[0].name },
    });

    return NextResponse.json({
      success: true,
      message: `Developer '${existing[0].name}' soft deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete developer" },
      { status: 500 }
    );
  }
}
