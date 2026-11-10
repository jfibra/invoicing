import { NextRequest, NextResponse } from "next/server";
import { commissionsDb, leuterioDb } from "@/lib/db";
import { ensureSalesTables } from "@/lib/sales";
import { getSignatureHistoryForRecord } from "@/lib/signatureService";
import { RowDataPacket } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSalesTables();
    const { id: rawId } = await params;
    const saleId = parseInt(rawId, 10);

    if (isNaN(saleId) || saleId <= 0) {
      return NextResponse.json({ error: "Invalid sales record ID" }, { status: 400 });
    }

    // 1. Fetch Sales Record
    const [salesRows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM sales WHERE id = ? LIMIT 1",
      [saleId]
    );

    if (salesRows.length === 0) {
      return NextResponse.json({ error: "Sales record not found" }, { status: 404 });
    }

    const sale = salesRows[0];

    // 2. Fetch File Attachments
    const [attachments] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM sale_attachments WHERE sale_id = ? ORDER BY id ASC",
      [saleId]
    );

    // 3. Fetch Company Invoice Profile & Default Address
    const [profileRows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM invoice_profiles WHERE profile_type = 'ADMIN' ORDER BY id ASC LIMIT 1"
    );
    const profile = profileRows[0] || null;

    let address = null;
    if (profile) {
      const [addrRows] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT * FROM profile_addresses WHERE profile_id = ? AND is_default = 1 LIMIT 1",
        [profile.id]
      );
      address = addrRows[0] || null;
    }

    // 4. Fetch Linked TRN Record if available
    let trnRecord = null;
    if (sale.trn_record_id) {
      const [trnRows] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT * FROM trn_records WHERE id = ? LIMIT 1",
        [sale.trn_record_id]
      );
      trnRecord = trnRows[0] || null;
    }

    // 5. Look up Agent Email and Contact Info from Reference Database
    let agentEmail: string | null = null;
    let agentMobile: string | null = null;

    if (sale.member_id || sale.member_code) {
      try {
        const [memberRows] = await leuterioDb.query<RowDataPacket[]>(
          `SELECT id, memberid, completename, email, emailad, mobile, phone 
           FROM members 
           WHERE id = ? OR memberid = ? 
           LIMIT 1`,
          [sale.member_id || 0, sale.member_code || ""]
        );
        if (memberRows.length > 0) {
          const m = memberRows[0];
          agentEmail = m.email || m.emailad || null;
          agentMobile = m.mobile || m.phone || null;
        }
      } catch (err) {
        console.error("Error looking up member email:", err);
      }
    }

    // 6. Fetch Signature History & Status
    const signatureHistory = await getSignatureHistoryForRecord("SALES_INVOICE", saleId);

    return NextResponse.json({
      success: true,
      sale: {
        ...sale,
        agent_email: agentEmail,
        agent_mobile: agentMobile,
      },
      attachments,
      profile,
      address,
      trnRecord,
      signatureHistory,
    });
  } catch (err: any) {
    console.error("GET Sales Record Error:", err);
    return NextResponse.json(
      { error: "Failed to load sales record invoice details", details: err?.message },
      { status: 500 }
    );
  }
}

