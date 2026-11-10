import { NextRequest, NextResponse } from "next/server";
import { commissionsDb, leuterioDb } from "@/lib/db";
import { getSignatureHistoryForRecord } from "@/lib/signatureService";
import { RowDataPacket } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const isNumeric = /^\d+$/.test(rawId);
    const invoiceId = isNumeric ? parseInt(rawId, 10) : 0;

    // 1. Fetch Commission Invoice Record
    let query = "SELECT * FROM generated_invoices WHERE id = ? LIMIT 1";
    let queryParam: any = invoiceId;

    if (!isNumeric) {
      query = "SELECT * FROM generated_invoices WHERE invoice_number = ? LIMIT 1";
      queryParam = rawId;
    }

    const [rows] = await commissionsDb.query<RowDataPacket[]>(query, [queryParam]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Commission invoice not found" }, { status: 404 });
    }

    const invoice = rows[0];

    // 2. Fetch File Attachments from generated_invoice_files
    let attachments: any[] = [];
    try {
      const [attRows] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT * FROM generated_invoice_files WHERE invoice_id = ? ORDER BY id ASC",
        [invoice.id]
      );
      attachments = attRows;
    } catch (e) {
      console.error("Error fetching invoice attachments:", e);
    }

    // 3. Fetch Company Invoice Profile & Default Address / Logo
    let profile = null;
    let address = null;
    let logo = null;
    try {
      const [profileRows] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT * FROM invoice_profiles WHERE profile_type = 'ADMIN' ORDER BY id ASC LIMIT 1"
      );
      profile = profileRows[0] || null;

      if (profile) {
        const [addrRows] = await commissionsDb.query<RowDataPacket[]>(
          "SELECT * FROM profile_addresses WHERE profile_id = ? AND is_default = 1 LIMIT 1",
          [profile.id]
        );
        address = addrRows[0] || null;

        const [logoRows] = await commissionsDb.query<RowDataPacket[]>(
          "SELECT * FROM profile_logos WHERE profile_id = ? AND is_default = 1 LIMIT 1",
          [profile.id]
        );
        logo = logoRows[0] || null;
      }
    } catch (e) {
      console.error("Error fetching admin profile:", e);
    }

    // 4. Resolve Agent Email / Mobile if missing on invoice record
    let agentEmail = invoice.agent_email || null;
    let agentMobile: string | null = null;

    if (!agentEmail && (invoice.member_id || invoice.agent_code)) {
      try {
        const [memberRows] = await leuterioDb.query<RowDataPacket[]>(
          `SELECT id, memberid, completename, email, emailad, mobile, phone 
           FROM members 
           WHERE id = ? OR memberid = ? 
           LIMIT 1`,
          [invoice.member_id || 0, invoice.agent_code || ""]
        );
        if (memberRows.length > 0) {
          const m = memberRows[0];
          agentEmail = m.email || m.emailad || null;
          agentMobile = m.mobile || m.phone || null;
        }
      } catch (err) {
        console.error("Error resolving agent email from members:", err);
      }
    }

    // 5. Fetch Signature History & Events
    const signatureHistory = await getSignatureHistoryForRecord("COMMISSION_INVOICE", invoice.id);

    return NextResponse.json({
      success: true,
      invoice: {
        ...invoice,
        agent_email: agentEmail,
        agent_mobile: agentMobile,
      },
      profile,
      address,
      logo,
      attachments,
      signatureHistory,
    });
  } catch (err: any) {
    console.error("GET Commission Invoice Error:", err);
    return NextResponse.json(
      { error: "Internal server error fetching invoice", details: err?.message },
      { status: 500 }
    );
  }
}
