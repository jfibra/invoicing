import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { ensureInvoiceTypesTable, getAllInvoiceTypes } from "@/lib/invoiceTypes";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const types = await getAllInvoiceTypes();
    return NextResponse.json({ success: true, invoiceTypes: types });
  } catch (error: any) {
    console.error("Error fetching invoice types:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch invoice types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureInvoiceTypesTable();
    const body = await request.json();

    const { code, label, invoice_title, description, sort_order, status } = body;

    if (!label || !invoice_title) {
      return NextResponse.json(
        { success: false, error: "Label and invoice title are required" },
        { status: 400 }
      );
    }

    // Generate code if not provided
    const formattedCode = (
      code || label.toUpperCase().replace(/[^A-Z0-9]/g, "_")
    ).replace(/_+/g, "_");

    const itemStatus = status === "inactive" ? "inactive" : "active";
    const itemSortOrder = typeof sort_order === "number" ? sort_order : 0;

    const [result] = await commissionsDb.query<ResultSetHeader>(
      `INSERT INTO invoice_types (code, label, invoice_title, description, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [formattedCode, label.trim(), invoice_title.trim(), description || "", itemStatus, itemSortOrder]
    );

    const [newRows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM invoice_types WHERE id = ?",
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: "Invoice type created successfully",
      invoiceType: newRows[0],
    });
  } catch (error: any) {
    console.error("Error creating invoice type:", error);
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "An invoice type with this code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create invoice type" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureInvoiceTypesTable();
    const body = await request.json();

    const { id, code, label, invoice_title, description, status, sort_order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invoice type ID is required for update" },
        { status: 400 }
      );
    }

    if (!label || !invoice_title) {
      return NextResponse.json(
        { success: false, error: "Label name and invoice title are required" },
        { status: 400 }
      );
    }

    await commissionsDb.query(
      `UPDATE invoice_types 
       SET label = ?, invoice_title = ?, description = ?, status = ?, sort_order = ?
       WHERE id = ?`,
      [label.trim(), invoice_title.trim(), description || "", status || "active", sort_order || 0, id]
    );

    const [updatedRows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM invoice_types WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Invoice type updated successfully",
      invoiceType: updatedRows[0],
    });
  } catch (error: any) {
    console.error("Error updating invoice type:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update invoice type" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureInvoiceTypesTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID parameter is required" },
        { status: 400 }
      );
    }

    // Soft-delete by setting status to inactive
    await commissionsDb.query("UPDATE invoice_types SET status = 'inactive' WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Invoice type deactivated successfully",
    });
  } catch (error: any) {
    console.error("Error deactivating invoice type:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to deactivate invoice type" },
      { status: 500 }
    );
  }
}
