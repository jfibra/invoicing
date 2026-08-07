import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { ensureExpensesTables } from "@/lib/expenses";
import { ensureTrnLibraryTables } from "@/app/api/trn-library/route";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET: List expenses with search & filters and joined file attachments
export async function GET(request: NextRequest) {
  try {
    await ensureExpensesTables();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const vatTreatment = searchParams.get("vat_treatment") || "";
    const category = searchParams.get("category") || "";
    const taxType = searchParams.get("tax_type") || "";
    const memberId = searchParams.get("member_id") || "";
    const team = searchParams.get("team") || "";
    const subteam = searchParams.get("subteam") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 15)));
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += " AND (expense_number LIKE ? OR company_name LIKE ? OR tin_number LIKE ? OR invoice_number LIKE ? OR subcategory_name LIKE ? OR fullname LIKE ?)";
      const term = `%${search}%`;
      queryParams.push(term, term, term, term, term, term);
    }

    if (vatTreatment) {
      whereClause += " AND vat_treatment = ?";
      queryParams.push(vatTreatment);
    }

    if (taxType) {
      whereClause += " AND tax_type = ?";
      queryParams.push(taxType);
    }

    if (category) {
      whereClause += " AND category_name = ?";
      queryParams.push(category);
    }

    if (memberId) {
      whereClause += " AND member_id = ?";
      queryParams.push(memberId);
    }

    if (team) {
      whereClause += " AND team = ?";
      queryParams.push(team);
    }

    if (subteam) {
      whereClause += " AND subteam = ?";
      queryParams.push(subteam);
    }

    const [countRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM expenses ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    const [kpiRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_net,
        COALESCE(SUM(vat_amount), 0) as total_vat,
        COALESCE(SUM(gross_taxable), 0) as total_gross_taxable,
        COALESCE(SUM(total_actual_amount), 0) as total_actual
       FROM expenses ${whereClause}`,
      queryParams
    );
    const kpis = kpiRows[0] || { total_count: 0, total_net: 0, total_vat: 0, total_gross_taxable: 0, total_actual: 0 };

    const [expenses] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM expenses ${whereClause} ORDER BY expense_date DESC, id DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Fetch joined file attachments for each expense
    const expenseIds = expenses.map((e: any) => e.id);
    let attachmentsMap: { [key: number]: any[] } = {};
    if (expenseIds.length > 0) {
      const [attachments] = await commissionsDb.query<RowDataPacket[]>(
        `SELECT * FROM expense_attachments WHERE expense_id IN (?) ORDER BY id ASC`,
        [expenseIds]
      );
      for (const att of attachments) {
        if (!attachmentsMap[att.expense_id]) attachmentsMap[att.expense_id] = [];
        attachmentsMap[att.expense_id].push(att);
      }
    }

    const enrichedExpenses = expenses.map((e: any) => ({
      ...e,
      attachments: attachmentsMap[e.id] || [],
    }));

    return NextResponse.json({
      success: true,
      expenses: enrichedExpenses,
      kpis,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("GET Expenses Error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses", details: error.message }, { status: 500 });
  }
}

// POST: Single expense creation OR Bulk upload array
export async function POST(request: NextRequest) {
  try {
    await ensureExpensesTables();
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
        const expDate = item.expense_date ? new Date(item.expense_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

        const companyName = (item.company_name || item.supplier_name || "General Supplier").trim();
        const tinNumber = (item.tin_number || item.supplier_trn || "").trim() || null;

        // Auto-check/create TRN record
        let trnRecordId = item.trn_record_id || null;
        if (!trnRecordId && companyName) {
          const [matchTrn] = await commissionsDb.query<RowDataPacket[]>(
            `SELECT id FROM trn_records WHERE company_name = ? OR (tin_number IS NOT NULL AND tin_number = ?) LIMIT 1`,
            [companyName, tinNumber || "___NOMATCH___"]
          );

          if (matchTrn.length > 0) {
            trnRecordId = matchTrn[0].id;
          } else {
            const [newTrn] = await commissionsDb.query<ResultSetHeader>(
              `INSERT INTO trn_records (company_name, tin_number, entity_type, country_code, status) VALUES (?, ?, 'EXPENSES', 'UAE', 'ACTIVE')`,
              [companyName, tinNumber || "N/A"]
            );
            trnRecordId = newTrn.insertId;
          }
        }

        const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
        const randomSeq = Math.floor(1000 + Math.random() * 9000);
        const expCode = item.expense_number || `EXP-DXB-${yearMonth}-${randomSeq}`;

        await commissionsDb.query(
          `INSERT INTO expenses 
           (expense_number, expense_date, tax_type, invoice_number, trn_record_id, company_name, tin_number, expense_category_id, category_name, subcategory_name, vat_treatment, amount, vat_amount, gross_taxable, total_actual_amount, member_id, member_code, fullname, team, subteam, payment_method, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            expCode,
            expDate,
            item.tax_type || "VAT",
            item.invoice_number || null,
            trnRecordId,
            companyName,
            tinNumber,
            item.expense_category_id || null,
            item.category_name || "OFFICE & ADMINISTRATIVE",
            item.subcategory_name || "General Expenses",
            item.vat_treatment || "Recoverable",
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

      await logSiteActivity({
        user_name: "System Admin",
        action_type: "BULK_UPLOAD_EXPENSES",
        module_name: "EXPENSES",
        description: `Bulk uploaded ${insertedCount} expense records.`,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully uploaded ${insertedCount} expense records.`,
        inserted_count: insertedCount,
      });
    }

    // Single Expense Creation
    const {
      expense_date,
      tax_type = "VAT",
      invoice_number,
      trn_record_id,
      company_name,
      tin_number,
      expense_category_id,
      category_name,
      subcategory_name,
      vat_treatment = "Recoverable",
      amount = 0,
      vat_amount = 0,
      gross_taxable,
      total_actual_amount,
      member_id,
      member_code,
      fullname,
      team,
      subteam,
      payment_method = "BANK_TRANSFER",
      remarks,
      attachments = [],
    } = body;

    const amtNum = Number(amount || 0);
    const vatNum = Number(vat_amount || 0);
    const grossNum = Number(gross_taxable) || amtNum;
    const totalActualNum = Number(total_actual_amount) || (amtNum + vatNum);

    const compNameClean = (company_name || "").trim();
    const tinNumClean = (tin_number || "").trim() || null;

    if (!compNameClean) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    // Check or Auto-Create TRN Library Record
    let finalTrnRecordId = trn_record_id || null;
    if (!finalTrnRecordId) {
      const [existingTrn] = await commissionsDb.query<RowDataPacket[]>(
        `SELECT id FROM trn_records WHERE company_name = ? OR (tin_number IS NOT NULL AND tin_number = ?) LIMIT 1`,
        [compNameClean, tinNumClean || "___NOMATCH___"]
      );

      if (existingTrn.length > 0) {
        finalTrnRecordId = existingTrn[0].id;
      } else {
        const [newTrn] = await commissionsDb.query<ResultSetHeader>(
          `INSERT INTO trn_records (company_name, tin_number, entity_type, country_code, status) VALUES (?, ?, 'EXPENSES', 'UAE', 'ACTIVE')`,
          [compNameClean, tinNumClean || "N/A"]
        );
        finalTrnRecordId = newTrn.insertId;

        await logSiteActivity({
          user_name: fullname || "System Admin",
          action_type: "AUTO_CREATE_TRN_RECORD",
          module_name: "TRN_LIBRARY",
          description: `Auto-created TRN record '${compNameClean}' from Expense entry`,
          metadata: { trn_record_id: finalTrnRecordId, company_name: compNameClean, tin_number: tinNumClean },
        });
      }
    }

    const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const expCode = `EXP-DXB-${yearMonth}-${randomSeq}`;

    const expDate = expense_date ? new Date(expense_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    const [result] = await commissionsDb.query<ResultSetHeader>(
      `INSERT INTO expenses 
       (expense_number, expense_date, tax_type, invoice_number, trn_record_id, company_name, tin_number, expense_category_id, category_name, subcategory_name, vat_treatment, amount, vat_amount, gross_taxable, total_actual_amount, member_id, member_code, fullname, team, subteam, payment_method, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expCode,
        expDate,
        tax_type,
        invoice_number ? invoice_number.trim() : null,
        finalTrnRecordId,
        compNameClean,
        tinNumClean,
        expense_category_id || null,
        category_name || "OFFICE & ADMINISTRATIVE",
        subcategory_name || "General Expenses",
        vat_treatment,
        amtNum,
        vatNum,
        grossNum,
        totalActualNum,
        member_id || null,
        member_code || null,
        fullname || null,
        team || null,
        subteam || null,
        payment_method,
        remarks || null,
      ]
    );

    const expenseId = result.insertId;

    // Save File Attachments into expense_attachments table
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        await commissionsDb.query(
          `INSERT INTO expense_attachments 
           (expense_id, file_category_id, file_category_code, file_category_name, original_filename, file_path, file_size, mime_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            expenseId,
            att.file_category_id || null,
            att.file_category_code || null,
            att.file_category_name || "General Document",
            att.original_filename,
            att.file_path,
            att.file_size || 0,
            att.mime_type || "application/octet-stream",
            fullname || "System Admin",
          ]
        );
      }
    }

    await logSiteActivity({
      user_name: fullname || "System Admin",
      action_type: "CREATE_EXPENSE",
      module_name: "EXPENSES",
      description: `Recorded expense #${expCode} (${compNameClean} - AED ${totalActualNum.toLocaleString()}) with ${attachments.length} attachments`,
    });

    return NextResponse.json({
      success: true,
      message: "Expense recorded successfully",
      expense_id: expenseId,
      expense_number: expCode,
      trn_record_id: finalTrnRecordId,
      attachment_count: attachments.length,
    });
  } catch (error: any) {
    console.error("POST Expense Error:", error);
    return NextResponse.json({ error: "Failed to record expense", details: error.message }, { status: 500 });
  }
}

// PUT: Update an existing expense record & its attachments
export async function PUT(request: NextRequest) {
  try {
    await ensureExpensesTables();
    const body = await request.json();
    const {
      id,
      expense_date,
      tax_type = "VAT",
      invoice_number,
      company_name,
      tin_number,
      category_name,
      subcategory_name,
      vat_treatment = "Recoverable",
      amount = 0,
      vat_amount = 0,
      gross_taxable,
      total_actual_amount,
      payment_method = "BANK_TRANSFER",
      remarks,
      new_attachments = [], // New S3 uploaded attachments to add
      deleted_attachment_ids = [], // IDs of attachments to remove
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Expense Record ID is required for editing" }, { status: 400 });
    }

    const amtNum = Number(amount || 0);
    const vatNum = Number(vat_amount || 0);
    const grossNum = Number(gross_taxable) || amtNum;
    const totalActualNum = Number(total_actual_amount) || (amtNum + vatNum);

    const compNameClean = (company_name || "").trim();
    const tinNumClean = (tin_number || "").trim() || null;
    const expDate = expense_date ? new Date(expense_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    // Update master expense table
    await commissionsDb.query(
      `UPDATE expenses 
       SET expense_date = ?, tax_type = ?, invoice_number = ?, company_name = ?, tin_number = ?, 
           category_name = ?, subcategory_name = ?, vat_treatment = ?, amount = ?, vat_amount = ?, 
           gross_taxable = ?, total_actual_amount = ?, payment_method = ?, remarks = ?
       WHERE id = ?`,
      [
        expDate,
        tax_type,
        invoice_number ? invoice_number.trim() : null,
        compNameClean,
        tinNumClean,
        category_name || "OFFICE & ADMINISTRATIVE",
        subcategory_name || "General Expenses",
        vat_treatment,
        amtNum,
        vatNum,
        grossNum,
        totalActualNum,
        payment_method,
        remarks || null,
        id,
      ]
    );

    // Handle deleted attachments
    if (Array.isArray(deleted_attachment_ids) && deleted_attachment_ids.length > 0) {
      await commissionsDb.query(
        `DELETE FROM expense_attachments WHERE expense_id = ? AND id IN (?)`,
        [id, deleted_attachment_ids]
      );
    }

    // Handle new attachments insertion
    if (Array.isArray(new_attachments) && new_attachments.length > 0) {
      for (const att of new_attachments) {
        await commissionsDb.query(
          `INSERT INTO expense_attachments 
           (expense_id, file_category_id, file_category_code, file_category_name, original_filename, file_path, file_size, mime_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            att.file_category_id || null,
            att.file_category_code || null,
            att.file_category_name || "General Document",
            att.original_filename,
            att.file_path,
            att.file_size || 0,
            att.mime_type || "application/octet-stream",
            "System Admin",
          ]
        );
      }
    }

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "UPDATE_EXPENSE",
      module_name: "EXPENSES",
      description: `Updated expense record #${id} (${compNameClean})`,
    });

    return NextResponse.json({
      success: true,
      message: "Expense record and attachments updated successfully",
    });
  } catch (error: any) {
    console.error("PUT Expense Error:", error);
    return NextResponse.json({ error: "Failed to update expense", details: error.message }, { status: 500 });
  }
}

// DELETE: Delete an expense record and all its attachments
export async function DELETE(request: NextRequest) {
  try {
    await ensureExpensesTables();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Expense ID is required for deletion" }, { status: 400 });
    }

    // Attachments will be cascade-deleted by foreign key
    await commissionsDb.query("DELETE FROM expenses WHERE id = ?", [id]);

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "DELETE_EXPENSE",
      module_name: "EXPENSES",
      description: `Deleted expense record #${id}`,
    });

    return NextResponse.json({
      success: true,
      message: "Expense record deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE Expense Error:", error);
    return NextResponse.json({ error: "Failed to delete expense", details: error.message }, { status: 500 });
  }
}
