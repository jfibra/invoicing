import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { ensureExpenseCategoriesTables } from "@/lib/expenseCategories";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET: Fetch all expense categories with optional filtering
export async function GET(request: NextRequest) {
  try {
    await ensureExpenseCategoriesTables();
    const { searchParams } = new URL(request.url);
    const vatTreatment = searchParams.get("vat_treatment");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (vatTreatment) {
      whereClause += " AND vat_treatment = ?";
      queryParams.push(vatTreatment);
    }

    if (status) {
      whereClause += " AND status = ?";
      queryParams.push(status);
    }

    if (search) {
      whereClause += " AND (category_name LIKE ? OR subcategory_name LIKE ? OR description LIKE ?)";
      const term = `%${search}%`;
      queryParams.push(term, term, term);
    }

    const [expenseCategories] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM expense_categories ${whereClause} ORDER BY category_name ASC, subcategory_name ASC`,
      queryParams
    );

    return NextResponse.json({
      success: true,
      expense_categories: expenseCategories,
    });
  } catch (error: any) {
    console.error("GET Expense Categories Error:", error);
    return NextResponse.json({ error: "Failed to fetch expense categories", details: error.message }, { status: 500 });
  }
}

// POST: Add new expense category record
export async function POST(request: NextRequest) {
  try {
    await ensureExpenseCategoriesTables();
    const body = await request.json();
    const { category_name, subcategory_name, vat_treatment = "Recoverable", description, status = "active" } = body;

    if (!category_name || !category_name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!subcategory_name || !subcategory_name.trim()) {
      return NextResponse.json({ error: "Subcategory name is required" }, { status: 400 });
    }

    const [result] = await commissionsDb.query<ResultSetHeader>(
      `INSERT INTO expense_categories (category_name, subcategory_name, vat_treatment, description, status) VALUES (?, ?, ?, ?, ?)`,
      [category_name.trim(), subcategory_name.trim(), vat_treatment, description || null, status]
    );

    const [created] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM expense_categories WHERE id = ?",
      [result.insertId]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "CREATE_EXPENSE_CATEGORY",
      module_name: "SETTINGS",
      description: `Created expense category '${category_name.trim()}' -> '${subcategory_name.trim()}'`,
      metadata: { id: result.insertId, category_name: category_name.trim(), subcategory_name: subcategory_name.trim() },
    });

    return NextResponse.json({
      success: true,
      message: "Expense category created successfully",
      expense_category: created[0],
    });
  } catch (error: any) {
    console.error("POST Expense Category Error:", error);
    return NextResponse.json({ error: "Failed to create expense category", details: error.message }, { status: 500 });
  }
}

// PUT: Update an existing expense category record
export async function PUT(request: NextRequest) {
  try {
    await ensureExpenseCategoriesTables();
    const body = await request.json();
    const { id, category_name, subcategory_name, vat_treatment, description, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Expense category ID is required" }, { status: 400 });
    }

    const [existing] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM expense_categories WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Expense category not found" }, { status: 404 });
    }

    await commissionsDb.query(
      `UPDATE expense_categories 
       SET category_name = ?, subcategory_name = ?, vat_treatment = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        category_name ? category_name.trim() : existing[0].category_name,
        subcategory_name ? subcategory_name.trim() : existing[0].subcategory_name,
        vat_treatment || existing[0].vat_treatment,
        description !== undefined ? description : existing[0].description,
        status || existing[0].status,
        id,
      ]
    );

    const [updated] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM expense_categories WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Expense category updated successfully",
      expense_category: updated[0],
    });
  } catch (error: any) {
    console.error("PUT Expense Category Error:", error);
    return NextResponse.json({ error: "Failed to update expense category", details: error.message }, { status: 500 });
  }
}

// DELETE: Delete an expense category record
export async function DELETE(request: NextRequest) {
  try {
    await ensureExpenseCategoriesTables();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Expense category ID is required" }, { status: 400 });
    }

    await commissionsDb.query("DELETE FROM expense_categories WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Expense category deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE Expense Category Error:", error);
    return NextResponse.json({ error: "Failed to delete expense category", details: error.message }, { status: 500 });
  }
}
