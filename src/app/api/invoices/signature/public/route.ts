import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import {
  getSignatureRequestByToken,
  recordSignatureView,
  signInvoiceByToken,
  declineInvoiceByToken,
  checkTokenRateLimit,
} from "@/lib/signatureService";

// GET: Public agent lookup for viewing invoice to be signed
export async function GET(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "Unknown Browser";

  // Rate Limiting Protection (60 requests/minute per IP)
  if (!checkTokenRateLimit(ipAddress)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";

    if (!token || token.length < 32) {
      return NextResponse.json({ error: "Invalid signing link or token." }, { status: 400 });
    }

    const req = await getSignatureRequestByToken(token);
    if (!req) {
      return NextResponse.json({ error: "Signing link not found or invalid." }, { status: 404 });
    }

    // Record view event asynchronously
    await recordSignatureView(token, ipAddress, userAgent);

    let snapshot: any = null;
    try {
      snapshot = JSON.parse(req.snapshot_json);
    } catch (e) {
      snapshot = {};
    }

    // Hydrate incomplete unsigned snapshots from source record if amounts were missing
    const hasAmountKeys =
      snapshot &&
      (snapshot.gross_amount != null ||
        snapshot.net_amount != null ||
        snapshot.totalActualAmount != null ||
        snapshot.grossAmount != null ||
        snapshot.amount != null);
    if (!hasAmountKeys && req.status !== "SIGNED" && req.record_id) {
      if (req.record_type === "COMMISSION_INVOICE") {
        const [invRows] = await commissionsDb.query<RowDataPacket[]>(
          "SELECT * FROM generated_invoices WHERE id = ? LIMIT 1",
          [req.record_id]
        );
        if (invRows.length > 0) {
          snapshot = { ...invRows[0], ...(snapshot || {}) };
        }
      } else if (req.record_type === "SALES_INVOICE") {
        const [saleRows] = await commissionsDb.query<RowDataPacket[]>(
          "SELECT * FROM sales WHERE id = ? LIMIT 1",
          [req.record_id]
        );
        if (saleRows.length > 0) {
          snapshot = { ...saleRows[0], ...(snapshot || {}) };
        }
      }
    }

    // Return sanitized data only (no internal admin secrets)
    return NextResponse.json({
      success: true,
      request: {
        token: req.token,
        invoice_number: req.invoice_number,
        agent_name: req.agent_name,
        agent_email: req.agent_email,
        subject: req.subject,
        message: req.message,
        status: req.status,
        version: req.version,
        snapshot,
        snapshot_hash: req.snapshot_hash,
        signed_name: req.signed_name,
        signed_signature_data: req.signed_signature_data,
        signed_at: req.signed_at,
        declined_reason: req.declined_reason,
        declined_at: req.declined_at,
        expires_at: req.expires_at,
        created_at: req.created_at,
      },
    });
  } catch (err: any) {
    console.error("GET Public Signature Error:", err);
    return NextResponse.json(
      { error: "Failed to load invoice for signing", details: err?.message },
      { status: 500 }
    );
  }
}

// POST: Public agent submission (Sign or Decline)
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "Unknown Browser";

  if (!checkTokenRateLimit(ipAddress)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { token, action, signer_name, signature_data, decline_reason } = body;

    if (!token || typeof token !== "string" || token.length < 32) {
      return NextResponse.json({ error: "Invalid signing token." }, { status: 400 });
    }

    if (action === "sign") {
      if (!signer_name || !String(signer_name).trim()) {
        return NextResponse.json({ error: "Full legal name is required to sign this invoice." }, { status: 400 });
      }

      if (!signature_data || !String(signature_data).trim()) {
        return NextResponse.json({ error: "Signature drawing or acknowledgment is required." }, { status: 400 });
      }

      const result = await signInvoiceByToken({
        token,
        signerName: String(signer_name).trim(),
        signatureData: String(signature_data),
        ip: ipAddress,
        userAgent,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to submit signature." }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Invoice signed and recorded successfully. An immutable copy has been preserved.",
      });
    }

    if (action === "decline") {
      if (!decline_reason || !String(decline_reason).trim()) {
        return NextResponse.json({ error: "Please provide a reason for declining this invoice." }, { status: 400 });
      }

      const result = await declineInvoiceByToken({
        token,
        reason: String(decline_reason).trim(),
        ip: ipAddress,
        userAgent,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to decline invoice." }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Invoice declined. The administrator has been notified of your comments.",
      });
    }

    return NextResponse.json({ error: `Unsupported action: "${action}"` }, { status: 400 });
  } catch (err: any) {
    console.error("POST Public Signature Error:", err);
    return NextResponse.json(
      { error: "Failed to process signature submission", details: err?.message },
      { status: 500 }
    );
  }
}

