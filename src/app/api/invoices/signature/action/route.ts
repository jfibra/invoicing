import { NextRequest, NextResponse } from "next/server";
import {
  revokeSignatureRequest,
  resendSignatureRequest,
} from "@/lib/signatureService";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    const body = await request.json();
    const { action, request_id, reason } = body;

    if (!request_id || !action) {
      return NextResponse.json({ error: "request_id and action are required" }, { status: 400 });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    if (action === "revoke") {
      const result = await revokeSignatureRequest({
        requestId: Number(request_id),
        reason: reason ? String(reason).trim() : undefined,
        adminIp: ipAddress,
        adminUserAgent: userAgent,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to revoke request" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Signature link revoked successfully. Recipient will no longer be able to sign.",
      });
    }

    if (action === "resend") {
      const result = await resendSignatureRequest({
        requestId: Number(request_id),
        adminIp: ipAddress,
        adminUserAgent: userAgent,
        baseUrl,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to resend request" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Signature request notification reminder dispatched successfully.",
        emailResult: result.emailResult,
      });
    }

    return NextResponse.json({ error: `Unsupported action: "${action}"` }, { status: 400 });
  } catch (err: any) {
    console.error("POST Signature Action Error:", err);
    return NextResponse.json(
      { error: "Internal server error while processing signature action", details: err?.message },
      { status: 500 }
    );
  }
}

