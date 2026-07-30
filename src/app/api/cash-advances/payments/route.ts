import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    const body = await request.json();
    const {
      cash_advance_id,
      payment_amount,
      payment_date,
      payment_method = "BANK_TRANSFER",
      remarks,
    } = body;

    const pAmtNum = Number(payment_amount || 0);
    if (!cash_advance_id || pAmtNum <= 0) {
      return NextResponse.json({ error: "Cash advance ID and valid payment amount are required" }, { status: 400 });
    }

    // 1. Check Cash Advance Record
    const [advances] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM cash_advances WHERE id = ?",
      [cash_advance_id]
    );

    if (advances.length === 0) {
      return NextResponse.json({ error: "Cash advance record not found" }, { status: 404 });
    }

    const ca = advances[0];
    const currentPaid = Number(ca.total_paid_amount || 0);
    const totalRepay = Number(ca.total_repayment_amount || 0);
    const currentBalance = Number(ca.balance_due || 0);

    if (pAmtNum > currentBalance) {
      return NextResponse.json(
        { error: `Payment amount (${pAmtNum}) exceeds current balance due (${currentBalance})` },
        { status: 400 }
      );
    }

    const newPaid = currentPaid + pAmtNum;
    const newBalance = Math.max(0, totalRepay - newPaid);
    const newStatus = newBalance === 0 ? "PAID" : "ACTIVE";

    // 2. Generate Receipt Number
    const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const receiptNum = `CAR-DXB-${yearMonth}-${randomSeq}`;
    const pDateFormatted = payment_date ? new Date(payment_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    // 3. Insert Payment Log
    const [payResult] = await commissionsDb.query<ResultSetHeader>(`
      INSERT INTO cash_advance_payments (cash_advance_id, receipt_number, payment_amount, payment_date, payment_method, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      cash_advance_id,
      receiptNum,
      pAmtNum,
      pDateFormatted,
      payment_method,
      remarks || null,
    ]);

    // 4. Update Cash Advance Record Totals & Status
    await commissionsDb.query(`
      UPDATE cash_advances SET
        total_paid_amount = ?,
        balance_due = ?,
        status = ?
      WHERE id = ?
    `, [newPaid, newBalance, newStatus, cash_advance_id]);

    await logSiteActivity({
      user_name: ca.agent_name,
      user_email: ca.agent_email || undefined,
      action_type: "RECORD_REPAYMENT",
      module_name: "CASH_ADVANCES",
      description: `Logged repayment receipt #${receiptNum} (${ca.currency || "AED"} ${pAmtNum.toLocaleString()}) for ${ca.agent_name}`,
      metadata: { cash_advance_id, receipt_number: receiptNum, payment_amount: pAmtNum, new_balance_due: newBalance },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      payment_id: payResult.insertId,
      receipt_number: receiptNum,
      cash_advance_id,
      payment_amount: pAmtNum,
      payment_date: pDateFormatted,
      new_total_paid: newPaid,
      new_balance_due: newBalance,
      status: newStatus,
    });
  } catch (error: any) {
    console.error("POST Cash Advance Payment Error:", error);
    return NextResponse.json({ error: "Failed to record payment", details: error.message }, { status: 500 });
  }
}
