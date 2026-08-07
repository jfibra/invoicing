import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { ensureSalesTables } from "@/lib/sales";
import { ensureTrnLibraryTables } from "@/app/api/trn-library/route";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

// GET: Fetch sales records with text search, filtering, and attachments
export async function GET(request: NextRequest) {
  try {
    await ensureSalesTables();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const taxType = searchParams.get("tax_type") || "";
    const category = searchParams.get("category") || "";
    const memberId = searchParams.get("member_id") || "";
    const team = searchParams.get("team") || "";

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (
        sale_number LIKE ? OR 
        customer_name LIKE ? OR 
        tin_number LIKE ? OR 
        invoice_number LIKE ? OR 
        category_name LIKE ? OR 
        subcategory_name LIKE ? OR
        fullname LIKE ? OR
        team LIKE ?
      )`;
      const s = `%${search}%`;
      queryParams.push(s, s, s, s, s, s, s, s);
    }

    if (taxType) {
      whereClause += ` AND tax_type = ?`;
      queryParams.push(taxType);
    }

    if (category) {
      whereClause += ` AND category_name = ?`;
      queryParams.push(category);
    }

    if (memberId) {
      whereClause += ` AND member_id = ?`;
      queryParams.push(memberId);
    }

    if (team) {
      whereClause += ` AND team = ?`;
      queryParams.push(team);
    }

    // Get Total Count
    const [countRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sales ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    // Get KPIs Summary
    const [kpiRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_records,
        COALESCE(SUM(gross_taxable), 0) as total_gross_taxable,
        COALESCE(SUM(vat_amount), 0) as total_output_vat,
        COALESCE(SUM(total_actual_amount), 0) as total_actual_sales
       FROM sales ${whereClause}`,
      queryParams
    );
    const kpis = kpiRows[0] || {
      total_records: 0,
      total_gross_taxable: 0,
      total_output_vat: 0,
      total_actual_sales: 0,
    };

    // Get Sales Records
    const [sales] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM sales ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get Attachments for retrieved sales
    const saleIds = sales.map((s: any) => s.id);
    let attachmentsMap: { [key: number]: any[] } = {};

    if (saleIds.length > 0) {
      const [attachments] = await commissionsDb.query<RowDataPacket[]>(
        `SELECT * FROM sale_attachments WHERE sale_id IN (?) ORDER BY id ASC`,
        [saleIds]
      );

      for (const att of attachments) {
        if (!attachmentsMap[att.sale_id]) {
          attachmentsMap[att.sale_id] = [];
        }
        attachmentsMap[att.sale_id].push(att);
      }
    }

    const enrichedSales = sales.map((s: any) => ({
      ...s,
      attachments: attachmentsMap[s.id] || [],
    }));

    return NextResponse.json({
      success: true,
      sales: enrichedSales,
      kpis,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("GET Sales Error:", error);
    return NextResponse.json({ error: "Failed to fetch sales records", details: error.message }, { status: 500 });
  }
}

// POST: Single sale creation OR Bulk upload array
export async function POST(request: NextRequest) {
  try {
    await ensureSalesTables();
    await ensureTrnLibraryTables();

    const body = await request.json();

    // Check if bulk array upload
    if (Array.isArray(body.items)) {
      const items = body.items;
      let insertedCount = 0;

      for (const item of items) {
        const amt = Number(item.amount || 0);
        const vat = Number(item.vat_amount || 0);
        const grossTaxable = Number(item.gross_taxable || amt);
        const totalActual = Number(item.total_actual_amount || (amt + vat));
        const saleDate = item.sale_date ? new Date(item.sale_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

        const customerName = (item.customer_name || item.company_name || "General Client").trim();
        const tinNumber = (item.tin_number || "").trim() || null;

        // Auto-check/create TRN record under SALES entity type
        let trnRecordId = item.trn_record_id || null;
        if (!trnRecordId && customerName) {
          const [matchTrn] = await commissionsDb.query<RowDataPacket[]>(
            `SELECT id FROM trn_records WHERE company_name = ? OR (tin_number IS NOT NULL AND tin_number = ?) LIMIT 1`,
            [customerName, tinNumber || "___NOMATCH___"]
          );

          if (matchTrn.length > 0) {
            trnRecordId = matchTrn[0].id;
          } else {
            const [newTrn] = await commissionsDb.query<ResultSetHeader>(
              `INSERT INTO trn_records (company_name, tin_number, entity_type, country_code, status) VALUES (?, ?, 'SALES', 'UAE', 'ACTIVE')`,
              [customerName, tinNumber || "N/A"]
            );
            trnRecordId = newTrn.insertId;
          }
        }

        const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
        const randomSeq = Math.floor(1000 + Math.random() * 9000);
        const saleCode = item.sale_number || `SALE-DXB-${yearMonth}-${randomSeq}`;

        await commissionsDb.query(
          `INSERT INTO sales 
           (sale_number, sale_date, tax_type, invoice_number, trn_record_id, customer_name, tin_number, category_name, subcategory_name, vat_treatment, amount, vat_amount, gross_taxable, total_actual_amount, member_id, member_code, fullname, team, subteam, payment_method, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            saleCode,
            saleDate,
            item.tax_type || "VAT",
            item.invoice_number || null,
            trnRecordId,
            customerName,
            tinNumber,
            item.category_name || "COMMISSION SALES",
            item.subcategory_name || "Real Estate Brokerage",
            item.vat_treatment || "Standard Rate (5%)",
            amt,
            vat,
            grossTaxable,
            totalActual,
            item.member_id || null,
            item.member_code || null,
            item.fullname || null,
            item.team || null,
            item.subteam || null,
            item.payment_method || "BANK_TRANSFER",
            item.remarks || null,
          ]
        );
        insertedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully uploaded ${insertedCount} sales records!`,
        inserted_count: insertedCount,
      });
    }

    // Single Sale Creation
    const {
      sale_date,
      tax_type,
      invoice_number,
      trn_record_id,
      customer_name,
      tin_number,
      category_name,
      subcategory_name,
      vat_treatment,
      amount,
      vat_amount,
      gross_taxable,
      total_actual_amount,
      member_id,
      member_code,
      fullname,
      team,
      subteam,
      payment_method,
      remarks,
      attachments,
    } = body;

    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ error: "Customer / Client Name is required" }, { status: 400 });
    }

    // Auto-check/create TRN record under SALES entity
    let trnId = trn_record_id || null;
    const cleanCustomer = customer_name.trim();
    const cleanTin = tin_number ? tin_number.trim() : null;

    if (!trnId) {
      const [matchTrn] = await commissionsDb.query<RowDataPacket[]>(
        `SELECT id FROM trn_records WHERE company_name = ? OR (tin_number IS NOT NULL AND tin_number = ?) LIMIT 1`,
        [cleanCustomer, cleanTin || "___NOMATCH___"]
      );

      if (matchTrn.length > 0) {
        trnId = matchTrn[0].id;
      } else {
        const [newTrn] = await commissionsDb.query<ResultSetHeader>(
          `INSERT INTO trn_records (company_name, tin_number, entity_type, country_code, status) VALUES (?, ?, 'SALES', 'UAE', 'ACTIVE')`,
          [cleanCustomer, cleanTin || "N/A"]
        );
        trnId = newTrn.insertId;
      }
    }

    const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const saleNumber = `SALE-DXB-${yearMonth}-${randomSeq}`;

    const [saleRes] = await commissionsDb.query<ResultSetHeader>(
      `INSERT INTO sales 
       (sale_number, sale_date, tax_type, invoice_number, trn_record_id, customer_name, tin_number, category_name, subcategory_name, vat_treatment, amount, vat_amount, gross_taxable, total_actual_amount, member_id, member_code, fullname, team, subteam, payment_method, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saleNumber,
        sale_date || new Date().toISOString().slice(0, 10),
        tax_type || "VAT",
        invoice_number || null,
        trnId,
        cleanCustomer,
        cleanTin,
        category_name || "COMMISSION SALES",
        subcategory_name || "Real Estate Brokerage",
        vat_treatment || "Standard Rate (5%)",
        Number(amount || 0),
        Number(vat_amount || 0),
        Number(gross_taxable || amount || 0),
        Number(total_actual_amount || 0),
        member_id || null,
        member_code || null,
        fullname || null,
        team || null,
        subteam || null,
        payment_method || "BANK_TRANSFER",
        remarks || null,
      ]
    );

    const insertedSaleId = saleRes.insertId;

    // Record Attachments if provided
    let attachmentCount = 0;
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        await commissionsDb.query(
          `INSERT INTO sale_attachments 
           (sale_id, file_category_id, file_category_code, file_category_name, original_filename, file_path, file_size, mime_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            insertedSaleId,
            att.file_category_id || null,
            att.file_category_code || null,
            att.file_category_name || "General Sales Attachment",
            att.original_filename,
            att.file_path,
            att.file_size || 0,
            att.mime_type || null,
            fullname || "System User",
          ]
        );
        attachmentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sale recorded successfully",
      sale_id: insertedSaleId,
      sale_number: saleNumber,
      trn_record_id: trnId,
      attachment_count: attachmentCount,
    });
  } catch (error: any) {
    console.error("POST Sales Error:", error);
    return NextResponse.json({ error: "Failed to record sale", details: error.message }, { status: 500 });
  }
}

// PUT: Update sale record & attachments
export async function PUT(request: NextRequest) {
  try {
    await ensureSalesTables();

    const body = await request.json();
    const {
      id,
      sale_date,
      tax_type,
      invoice_number,
      customer_name,
      tin_number,
      category_name,
      subcategory_name,
      vat_treatment,
      amount,
      vat_amount,
      gross_taxable,
      total_actual_amount,
      payment_method,
      remarks,
      new_attachments,
      deleted_attachment_ids,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Sale ID is required for update" }, { status: 400 });
    }

    await commissionsDb.query(
      `UPDATE sales SET
        sale_date = ?,
        tax_type = ?,
        invoice_number = ?,
        customer_name = ?,
        tin_number = ?,
        category_name = ?,
        subcategory_name = ?,
        vat_treatment = ?,
        amount = ?,
        vat_amount = ?,
        gross_taxable = ?,
        total_actual_amount = ?,
        payment_method = ?,
        remarks = ?
       WHERE id = ?`,
      [
        sale_date,
        tax_type,
        invoice_number || null,
        customer_name,
        tin_number || null,
        category_name,
        subcategory_name,
        vat_treatment,
        Number(amount || 0),
        Number(vat_amount || 0),
        Number(gross_taxable || amount || 0),
        Number(total_actual_amount || 0),
        payment_method,
        remarks || null,
        id,
      ]
    );

    // Delete requested attachments
    if (Array.isArray(deleted_attachment_ids) && deleted_attachment_ids.length > 0) {
      await commissionsDb.query(`DELETE FROM sale_attachments WHERE id IN (?) AND sale_id = ?`, [
        deleted_attachment_ids,
        id,
      ]);
    }

    // Insert new attachments
    if (Array.isArray(new_attachments) && new_attachments.length > 0) {
      for (const att of new_attachments) {
        await commissionsDb.query(
          `INSERT INTO sale_attachments 
           (sale_id, file_category_id, file_category_code, file_category_name, original_filename, file_path, file_size, mime_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            att.file_category_id || null,
            att.file_category_code || null,
            att.file_category_name || "General Sales Attachment",
            att.original_filename,
            att.file_path,
            att.file_size || 0,
            att.mime_type || null,
            "System User",
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sale record updated successfully",
    });
  } catch (error: any) {
    console.error("PUT Sales Error:", error);
    return NextResponse.json({ error: "Failed to update sale record", details: error.message }, { status: 500 });
  }
}

// DELETE: Remove sale record and cascade attachments
export async function DELETE(request: NextRequest) {
  try {
    await ensureSalesTables();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Sale ID is required for deletion" }, { status: 400 });
    }

    await commissionsDb.query(`DELETE FROM sales WHERE id = ?`, [id]);

    return NextResponse.json({
      success: true,
      message: `Sale record #${id} deleted successfully`,
    });
  } catch (error: any) {
    console.error("DELETE Sales Error:", error);
    return NextResponse.json({ error: "Failed to delete sale record", details: error.message }, { status: 500 });
  }
}
