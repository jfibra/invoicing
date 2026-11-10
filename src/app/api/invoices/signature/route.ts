import { NextRequest, NextResponse } from "next/server";
import {
  createAndSendSignatureRequest,
  getSignatureHistoryForRecord,
  RecordType,
} from "@/lib/signatureService";
import { getAuthenticatedUser } from "@/lib/auth";

// GET: Retrieve signature status and history for an invoice record
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordType = (searchParams.get("record_type") || "COMMISSION_INVOICE") as RecordType;
    const recordId = parseInt(searchParams.get("record_id") || "0", 10);

    if (!recordId || recordId <= 0) {
      return NextResponse.json({ error: "record_id is required" }, { status: 400 });
    }

    const history = await getSignatureHistoryForRecord(recordType, recordId);
    return NextResponse.json({ success: true, ...history });
  } catch (err: any) {
    console.error("GET Signature Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch signature status", details: err?.message },
      { status: 500 }
    );
  }
}

// POST: Admin creates & sends a new signature request
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    const body = await request.json();
    const {
      record_type = "COMMISSION_INVOICE",
      record_id,
      invoice_number,
      agent_id,
      agent_code,
      agent_name,
      agent_email,
      subject,
      message,
      snapshot,
      expires_in_days = 14,
    } = body;

    if (!record_id || !invoice_number || !agent_name || !agent_email || !snapshot) {
      return NextResponse.json(
        { error: "Missing required fields: record_id, invoice_number, agent_name, agent_email, and snapshot are mandatory." },
        { status: 400 }
      );
    }

    // Determine base URL from headers if not provided
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const result = await createAndSendSignatureRequest({
      recordType: record_type as RecordType,
      recordId: Number(record_id),
      invoiceNumber: String(invoice_number).trim(),
      agentId: agent_id ? Number(agent_id) : null,
      agentCode: agent_code ? String(agent_code).trim() : null,
      agentName: String(agent_name).trim(),
      agentEmail: String(agent_email).trim(),
      subject: subject ? String(subject).trim() : undefined,
      message: message ? String(message).trim() : undefined,
      snapshot,
      expiresInDays: Number(expires_in_days) || 14,
      adminUserId: authUser?.id || null,
      adminIp: ipAddress,
      adminUserAgent: userAgent,
      baseUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create signature request" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice_number} successfully prepared and sent to ${agent_email}.`,
      requestId: result.requestId,
      token: result.token,
      reviewUrl: result.reviewUrl,
      emailResult: result.emailResult,
    });
  } catch (err: any) {
    console.error("POST Signature Request Error:", err);
    return NextResponse.json(
      { error: "Internal server error while creating signature request", details: err?.message },
      { status: 500 }
    );
  }
}

