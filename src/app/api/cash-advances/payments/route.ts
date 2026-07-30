import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// POST: Record Repayment Payment Received from Agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cash_advance_id,
      payment_amount,
      payment_date,
      payment_method = "BANK_TRANSFER",
      remarks,
    } = body;

    const caId = Number(cash_advance_id);
    const payAmtNum = Number(payment_amount || 0);

    if (!caId || payAmtNum <= 0) {
      return NextResponse.json({ error: "Cash advance ID and valid payment amount are required" }, { status: 400 });
    }

    // 1. Fetch current cash advance record
    const [rows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM cash_advances WHERE id = ?",
      [caId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Cash advance record not found" }, { status: 404 });
    }

    const ca = rows[0];
    const currentPaid = Number(ca.total_paid_amount || 0);
    const currentBalance = Number(ca.balance_due || 0);

    if (currentBalance <= 0 || ca.status === "PAID") {
      return NextResponse.json({ error: "This cash advance is already fully paid" }, { status: 400 });
    }

    const newPaid = currentPaid + payAmtNum;
    const newBalance = Math.max(0, currentBalance - payAmtNum);
    const newStatus = newBalance === 0 ? "PAID" : ca.status;

    const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `CAR-DXB-${yearMonth}-${randomSeq}`;

    const payDateStr = payment_date ? new Date(payment_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    // 2. Insert Payment Record
    const [result] = await commissionsDb.query<ResultSetHeader>(
      `
      INSERT INTO cash_advance_payments
      (cash_advance_id, receipt_number, payment_amount, payment_date, payment_method, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [caId, receiptNumber, payAmtNum, payDateStr, payment_method || "BANK_TRANSFER", remarks || null]
    );

    // 3. Update Cash Advance totals and status
    await commissionsDb.query(
      `
      UPDATE cash_advances
      SET total_paid_amount = ?, balance_due = ?, status = ?
      WHERE id = ?
    `,
      [newPaid, newBalance, newStatus, caId]
    );

    return NextResponse.json({
      success: true,
      payment_id: result.insertId,
      receipt_number: receiptNumber,
      cash_advance_id: caId,
      payment_amount: payAmtNum,
      payment_date: payDateStr,
      payment_method,
      new_total_paid: newPaid,
      new_balance_due: newBalance,
      status: newStatus,
      advance: {
        ...ca,
        total_paid_amount: newPaid,
        balance_due: newBalance,
        status: newStatus,
      },
    });
  } catch (error: any) {
    console.error("POST Cash Advance Payment Error:", error);
    return NextResponse.json({ error: "Failed to record payment", details: error.message }, { status: 500 });
  }
}
