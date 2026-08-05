import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { ensureCategoriesTable } from "@/lib/categories";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET: Fetch list of categories (Supports type, status, include_deleted, search)
export async function GET(request: NextRequest) {
  try {
    await ensureCategoriesTable();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const includeDeleted = searchParams.get("include_deleted") === "true";
    const search = searchParams.get("search") || "";

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (!includeDeleted) {
      whereClause += " AND deleted_at IS NULL";
    }

    if (type && (type === "PURCHASE" || type === "SALES")) {
      whereClause += " AND type = ?";
      queryParams.push(type);
    }

    if (status) {
      whereClause += " AND status = ?";
      queryParams.push(status);
    }

    if (search) {
      whereClause += " AND (name LIKE ? OR code LIKE ? OR description LIKE ?)";
      const term = `%${search}%`;
      queryParams.push(term, term, term);
    }

    const [categories] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT id, name, code, type, description, status, deleted_at, created_at, updated_at 
       FROM categories ${whereClause} 
       ORDER BY type ASC, name ASC`,
      queryParams
    );

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST: Create a new category
export async function POST(request: NextRequest) {
  try {
    await ensureCategoriesTable();
    const body = await request.json();
    const { name, code, type, description, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!type || (type !== "PURCHASE" && type !== "SALES")) {
      return NextResponse.json({ error: "Category type must be either PURCHASE or SALES" }, { status: 400 });
    }

    const categoryCode = code ? code.trim().toUpperCase() : null;
    const categoryStatus = status === "inactive" ? "inactive" : "active";

    const [result] = await commissionsDb.query<ResultSetHeader>(
      `INSERT INTO categories (name, code, type, description, status) VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), categoryCode, type, description || null, categoryStatus]
    );

    const [created] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM categories WHERE id = ?",
      [result.insertId]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "CREATE_CATEGORY",
      module_name: "SETTINGS",
      description: `Created ${type} category '${name.trim()}'${categoryCode ? ` (${categoryCode})` : ""}`,
      metadata: { category_id: result.insertId, name: name.trim(), code: categoryCode, type },
    });

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category: created[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing category or restore a soft-deleted category
export async function PUT(request: NextRequest) {
  try {
    await ensureCategoriesTable();
    const body = await request.json();
    const { id, name, code, type, description, status, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const [existing] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Handle Restore Action
    if (action === "restore") {
      await commissionsDb.query("UPDATE categories SET deleted_at = NULL WHERE id = ?", [id]);
      await logSiteActivity({
        user_name: "System Admin",
        action_type: "RESTORE_CATEGORY",
        module_name: "SETTINGS",
        description: `Restored category '${existing[0].name}' (#${id})`,
        metadata: { category_id: id, name: existing[0].name },
      });

      return NextResponse.json({
        success: true,
        message: "Category restored successfully",
      });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!type || (type !== "PURCHASE" && type !== "SALES")) {
      return NextResponse.json({ error: "Category type must be either PURCHASE or SALES" }, { status: 400 });
    }

    const categoryCode = code ? code.trim().toUpperCase() : null;
    const categoryStatus = status === "inactive" ? "inactive" : "active";

    await commissionsDb.query(
      `UPDATE categories SET 
        name = ?, 
        code = ?, 
        type = ?, 
        description = ?, 
        status = ? 
       WHERE id = ?`,
      [name.trim(), categoryCode, type, description || null, categoryStatus, id]
    );

    const [updated] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "UPDATE_CATEGORY",
      module_name: "SETTINGS",
      description: `Updated category '${name.trim()}' (#${id})`,
      metadata: { category_id: id, name: name.trim(), type },
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      category: updated[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete a category (sets deleted_at = CURRENT_TIMESTAMP)
export async function DELETE(request: NextRequest) {
  try {
    await ensureCategoriesTable();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const [existing] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT id, name FROM categories WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Soft delete by setting deleted_at timestamp
    await commissionsDb.query(
      "UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "DELETE_CATEGORY",
      module_name: "SETTINGS",
      description: `Soft-deleted category '${existing[0].name}' (#${id})`,
      metadata: { category_id: id, name: existing[0].name },
    });

    return NextResponse.json({
      success: true,
      message: `Category '${existing[0].name}' soft deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
