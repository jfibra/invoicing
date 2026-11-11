import crypto from "crypto";
import { commissionsDb, leuterioDb } from "@/lib/db";
import { sendEmail, escapeHtml, isValidEmail, EmailResult } from "@/lib/emailService";
import { normalizeInvoiceSnapshot } from "@/lib/snapshotNormalize";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export type SignatureStatus = "DRAFT" | "SENT" | "VIEWED" | "SIGNED" | "DECLINED" | "EXPIRED" | "REVOKED";
export type RecordType = "COMMISSION_INVOICE" | "SALES_INVOICE";
export type SignatureEventType =
  | "CREATED"
  | "SENT"
  | "DELIVERY_SUCCESS"
  | "DELIVERY_FAILURE"
  | "VIEWED"
  | "SIGNED"
  | "DECLINED"
  | "EXPIRED"
  | "REVOKED"
  | "RESENT"
  | "REMINDED";

export interface SignatureRequestRecord {
  id: number;
  record_type: RecordType;
  record_id: number;
  invoice_number: string;
  token: string;
  agent_id: number | null;
  agent_code: string | null;
  agent_name: string;
  agent_email: string;
  subject: string;
  message: string | null;
  status: SignatureStatus;
  version: number;
  snapshot_json: string;
  snapshot_hash: string;
  signed_name: string | null;
  signed_signature_data: string | null;
  signed_at: string | null;
  signed_ip: string | null;
  signed_user_agent: string | null;
  declined_reason: string | null;
  declined_at: string | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface SignatureEventRecord {
  id: number;
  request_id: number;
  event_type: SignatureEventType;
  event_description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

// In-memory rate limiting for public token lookups (protects against brute-force token scanning)
const tokenLookupRateLimit = new Map<string, { count: number; resetAt: number }>();

export function checkTokenRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = tokenLookupRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    tokenLookupRateLimit.set(ip, { count: 1, resetAt: now + 60000 }); // 60 requests per minute
    return true;
  }
  if (entry.count >= 60) {
    return false;
  }
  entry.count += 1;
  return true;
}

let signatureTablesInitPromise: Promise<void> | null = null;

export async function ensureSignatureTables() {
  if (!signatureTablesInitPromise) {
    signatureTablesInitPromise = (async () => {
      await commissionsDb.query(`
        CREATE TABLE IF NOT EXISTS invoice_signature_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          record_type ENUM('COMMISSION_INVOICE', 'SALES_INVOICE') NOT NULL DEFAULT 'COMMISSION_INVOICE',
          record_id INT NOT NULL,
          invoice_number VARCHAR(100) NOT NULL,
          token VARCHAR(128) NOT NULL UNIQUE,
          agent_id INT NULL,
          agent_code VARCHAR(100) NULL,
          agent_name VARCHAR(255) NOT NULL,
          agent_email VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          message TEXT NULL,
          status ENUM('DRAFT', 'SENT', 'VIEWED', 'SIGNED', 'DECLINED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'DRAFT',
          version INT NOT NULL DEFAULT 1,
          snapshot_json LONGTEXT NOT NULL,
          snapshot_hash VARCHAR(64) NOT NULL,
          signed_name VARCHAR(255) NULL,
          signed_signature_data LONGTEXT NULL,
          signed_at TIMESTAMP NULL DEFAULT NULL,
          signed_ip VARCHAR(100) NULL,
          signed_user_agent TEXT NULL,
          declined_reason TEXT NULL,
          declined_at TIMESTAMP NULL DEFAULT NULL,
          first_viewed_at TIMESTAMP NULL DEFAULT NULL,
          last_viewed_at TIMESTAMP NULL DEFAULT NULL,
          expires_at TIMESTAMP NOT NULL,
          revoked_at TIMESTAMP NULL DEFAULT NULL,
          revoked_reason VARCHAR(255) NULL,
          created_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_token (token),
          INDEX idx_record (record_type, record_id),
          INDEX idx_invoice_number (invoice_number),
          INDEX idx_status (status),
          INDEX idx_expires_at (expires_at),
          INDEX idx_agent_email (agent_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await commissionsDb.query(`
        CREATE TABLE IF NOT EXISTS invoice_signature_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          request_id INT NOT NULL,
          event_type ENUM('CREATED', 'SENT', 'DELIVERY_SUCCESS', 'DELIVERY_FAILURE', 'VIEWED', 'SIGNED', 'DECLINED', 'EXPIRED', 'REVOKED', 'RESENT', 'REMINDED') NOT NULL,
          event_description TEXT NULL,
          ip_address VARCHAR(100) NULL,
          user_agent TEXT NULL,
          metadata JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_request_id (request_id),
          INDEX idx_event_type (event_type),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    })().catch((err) => {
      signatureTablesInitPromise = null;
      throw err;
    });
  }
  return signatureTablesInitPromise;
}

// Compute SHA-256 hash of invoice snapshot for tamper detection
export function computeSnapshotHash(snapshotJson: string): string {
  return crypto.createHash("sha256").update(snapshotJson).digest("hex");
}

// Generate high-entropy secure single-use token (64 hex chars = 256 bits of entropy)
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Log audit event for signature request
export async function logSignatureEvent(
  requestId: number,
  eventType: SignatureEventType,
  description: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: any
) {
  try {
    await ensureSignatureTables();
    await commissionsDb.query(
      `INSERT INTO invoice_signature_events 
       (request_id, event_type, event_description, ip_address, user_agent, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        eventType,
        description,
        ipAddress || null,
        userAgent || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    console.error("Failed to log signature event:", err);
  }
}

// Build review link
export function buildReviewUrl(token: string, baseUrl?: string): string {
  const origin = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://invoicing.filipinohomes.com";
  const cleanOrigin = origin.replace(/\/+$/, "");
  return `${cleanOrigin}/invoices/sign/${token}`;
}

// Generate professional HTML email for agent signature review
export function generateSignatureEmailHtml({
  agentName,
  invoiceNumber,
  amountFormatted,
  currency,
  customMessage,
  reviewUrl,
  expiresAtFormatted,
}: {
  agentName: string;
  invoiceNumber: string;
  amountFormatted: string;
  currency: string;
  customMessage?: string;
  reviewUrl: string;
  expiresAtFormatted: string;
}): string {
  const safeAgent = escapeHtml(agentName);
  const safeInv = escapeHtml(invoiceNumber);
  const safeAmt = escapeHtml(amountFormatted);
  const safeCurr = escapeHtml(currency);
  const safeMsg = customMessage ? escapeHtml(customMessage).replace(/\n/g, "<br/>") : "";
  const safeUrl = reviewUrl; // URL from internal builder
  const safeExp = escapeHtml(expiresAtFormatted);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Action Required: Review and Sign Invoice ${safeInv}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #dc2626; padding: 24px 32px; text-align: left;">
              <span style="color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; background-color: rgba(255, 255, 255, 0.2); padding: 4px 12px; rounded: 9999px; display: inline-block; margin-bottom: 8px;">
                Filipino Homes &bull; Leuterio Realty
              </span>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.02em;">
                Commission Invoice Signature Request
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 15px; margin-top: 0; margin-bottom: 16px; color: #334155;">
                Dear <strong>${safeAgent}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin-bottom: 24px;">
                An official commission invoice has been issued for your review and electronic signature. Please inspect the statement details and provide your signature acknowledgment.
              </p>

              <!-- Invoice KPI Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block;">Invoice Reference</span>
                    <strong style="font-size: 16px; color: #0f172a; font-family: monospace;">${safeInv}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block;">Total Commission Amount</span>
                    <strong style="font-size: 20px; color: #16a34a; font-weight: 900;">${safeCurr} ${safeAmt}</strong>
                  </td>
                </tr>
              </table>

              ${safeMsg ? `
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; color: #991b1b;">
                <strong>Admin Note:</strong><br/>
                ${safeMsg}
              </div>
              ` : ""}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${safeUrl}" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 36px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);">
                      Review &amp; Sign Invoice &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 8px;">
                This secure signing link will expire on <strong>${safeExp}</strong>.
              </p>
              <p style="font-size: 11px; color: #94a3b8; text-align: center; word-break: break-all; margin: 0;">
                If the button above does not work, copy and paste this link into your browser:<br/>
                <a href="${safeUrl}" style="color: #2563eb;">${safeUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
              &copy; ${new Date().getFullYear()} Filipino Homes &bull; Leuterio Realty. All rights reserved.<br/>
              This is an automated notification. Please do not reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Create and send a new signature request
export async function createAndSendSignatureRequest({
  recordType,
  recordId,
  invoiceNumber,
  agentId,
  agentCode,
  agentName,
  agentEmail,
  subject,
  message,
  snapshot,
  expiresInDays = 14,
  adminUserId,
  adminIp,
  adminUserAgent,
  baseUrl,
}: {
  recordType: RecordType;
  recordId: number;
  invoiceNumber: string;
  agentId?: number | null;
  agentCode?: string | null;
  agentName: string;
  agentEmail: string;
  subject?: string;
  message?: string;
  snapshot: any;
  expiresInDays?: number;
  adminUserId?: number | null;
  adminIp?: string | null;
  adminUserAgent?: string | null;
  baseUrl?: string;
}): Promise<{
  success: boolean;
  requestId?: number;
  token?: string;
  reviewUrl?: string;
  emailResult?: EmailResult;
  error?: string;
}> {
  try {
    await ensureSignatureTables();

    const cleanEmail = (agentEmail || "").trim();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return {
        success: false,
        error: `Invalid or missing recipient email address: "${cleanEmail}"`,
      };
    }

    // Ensure Commission Invoice snapshots contain complete authoritative record fields
    let effectiveSnapshot = snapshot && typeof snapshot === "object" ? { ...snapshot } : {};
    if (
      recordType === "COMMISSION_INVOICE" &&
      effectiveSnapshot.gross_amount == null &&
      effectiveSnapshot.net_amount == null &&
      effectiveSnapshot.grossAmount == null &&
      effectiveSnapshot.netAmount == null
    ) {
      const [invRows] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT * FROM generated_invoices WHERE id = ? LIMIT 1",
        [recordId]
      );
      if (invRows.length > 0) {
        effectiveSnapshot = { ...invRows[0], ...effectiveSnapshot };
      }
    } else if (
      recordType === "SALES_INVOICE" &&
      effectiveSnapshot.totalActualAmount == null &&
      effectiveSnapshot.amount == null &&
      effectiveSnapshot.total_actual_amount == null
    ) {
      const [saleRows] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT * FROM sales WHERE id = ? LIMIT 1",
        [recordId]
      );
      if (saleRows.length > 0) {
        effectiveSnapshot = { ...saleRows[0], ...effectiveSnapshot };
      }
    }

    // High-entropy token
    const token = generateSecureToken();
    const snapshotJson = JSON.stringify(effectiveSnapshot);
    const snapshotHash = computeSnapshotHash(snapshotJson);

    const expiresAtDate = new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + (expiresInDays > 0 ? expiresInDays : 14));
    const expiresAt = expiresAtDate.toISOString().slice(0, 19).replace("T", " ");

    const finalSubject = (
      subject || `Action Required: Review and Sign Invoice ${invoiceNumber}`
    ).replace(/[\r\n]+/g, " ").trim();

    // Check existing version count for this invoice record
    const [existingRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT MAX(version) as max_version FROM invoice_signature_requests 
       WHERE record_type = ? AND record_id = ?`,
      [recordType, recordId]
    );
    const nextVersion = (existingRows[0]?.max_version || 0) + 1;

    // Insert Request into database
    const [res] = await commissionsDb.query<ResultSetHeader>(
      `INSERT INTO invoice_signature_requests 
       (record_type, record_id, invoice_number, token, agent_id, agent_code, agent_name, agent_email, subject, message, status, version, snapshot_json, snapshot_hash, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SENT', ?, ?, ?, ?, ?)`,
      [
        recordType,
        recordId,
        invoiceNumber,
        token,
        agentId || null,
        agentCode || null,
        agentName,
        cleanEmail,
        finalSubject,
        message || null,
        nextVersion,
        snapshotJson,
        snapshotHash,
        expiresAt,
        adminUserId || null,
      ]
    );

    const requestId = res.insertId;

    // Log CREATED event
    await logSignatureEvent(
      requestId,
      "CREATED",
      `Signature request created (v${nextVersion}) for invoice ${invoiceNumber} by admin`,
      adminIp,
      adminUserAgent,
      { version: nextVersion, token: token.substring(0, 8) + "..." }
    );

    const reviewUrl = buildReviewUrl(token, baseUrl);
    const expiresFormatted = expiresAtDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const norm = normalizeInvoiceSnapshot(effectiveSnapshot);
    const emailHtml = generateSignatureEmailHtml({
      agentName,
      invoiceNumber,
      amountFormatted: norm.totalAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
      currency: norm.currency,
      customMessage: message,
      reviewUrl,
      expiresAtFormatted: expiresFormatted,
    });

    // Send email via EmailService (uses safe MOCK mode by default)
    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: finalSubject,
      html: emailHtml,
      text: `Dear ${agentName},\n\nPlease review and sign invoice ${invoiceNumber} at:\n${reviewUrl}\n\nExpires: ${expiresFormatted}`,
    });

    if (emailResult.success) {
      await logSignatureEvent(
        requestId,
        "SENT",
        `Email dispatched to ${cleanEmail} (mock: ${Boolean(emailResult.mock)})`,
        adminIp,
        adminUserAgent,
        { messageId: emailResult.messageId, mock: emailResult.mock }
      );
    } else {
      await logSignatureEvent(
        requestId,
        "DELIVERY_FAILURE",
        `Failed to deliver email: ${emailResult.error}`,
        adminIp,
        adminUserAgent,
        { error: emailResult.error }
      );
    }

    return {
      success: true,
      requestId,
      token,
      reviewUrl,
      emailResult,
    };
  } catch (err: any) {
    console.error("Error creating signature request:", err);
    return {
      success: false,
      error: err?.message || "Failed to create signature request.",
    };
  }
}

// Fetch signature request by secure token with expiration check
export async function getSignatureRequestByToken(token: string): Promise<SignatureRequestRecord | null> {
  if (!token || typeof token !== "string" || token.length < 32) return null;

  await ensureSignatureTables();

  const [rows] = await commissionsDb.query<RowDataPacket[]>(
    "SELECT * FROM invoice_signature_requests WHERE token = ? LIMIT 1",
    [token]
  );

  if (rows.length === 0) return null;

  const req = rows[0] as SignatureRequestRecord;

  // Auto-expire if expired and still in pending state
  const isExpired = new Date(req.expires_at).getTime() < Date.now();
  if (isExpired && ["DRAFT", "SENT", "VIEWED"].includes(req.status)) {
    await commissionsDb.query(
      "UPDATE invoice_signature_requests SET status = 'EXPIRED' WHERE id = ?",
      [req.id]
    );
    await logSignatureEvent(req.id, "EXPIRED", "Token expired automatically upon lookup");
    req.status = "EXPIRED";
  }

  return req;
}

// Mark signature request as VIEWED by recipient
export async function recordSignatureView(token: string, ip?: string | null, userAgent?: string | null): Promise<void> {
  try {
    const req = await getSignatureRequestByToken(token);
    if (!req) return;

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const isFirstView = !req.first_viewed_at;

    await commissionsDb.query(
      `UPDATE invoice_signature_requests 
       SET first_viewed_at = COALESCE(first_viewed_at, ?),
           last_viewed_at = ?,
           status = CASE WHEN status = 'SENT' THEN 'VIEWED' ELSE status END
       WHERE id = ?`,
      [now, now, req.id]
    );

    if (isFirstView) {
      await logSignatureEvent(req.id, "VIEWED", "Invoice was viewed for the first time by recipient", ip, userAgent);
    }
  } catch (err) {
    console.error("Error recording view event:", err);
  }
}

// Execute signature submission
export async function signInvoiceByToken({
  token,
  signerName,
  signatureData,
  ip,
  userAgent,
}: {
  token: string;
  signerName: string;
  signatureData: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const req = await getSignatureRequestByToken(token);
    if (!req) {
      return { success: false, error: "Invalid or expired invoice signing link." };
    }

    if (req.status === "SIGNED") {
      return { success: false, error: "This invoice has already been signed." };
    }

    if (req.status === "REVOKED") {
      return { success: false, error: "This signature link has been revoked by the administrator." };
    }

    if (req.status === "DECLINED") {
      return { success: false, error: "This invoice was previously declined." };
    }

    if (req.status === "EXPIRED" || new Date(req.expires_at).getTime() < Date.now()) {
      return { success: false, error: "This signature link has expired." };
    }

    if (!signerName || !signerName.trim()) {
      return { success: false, error: "Signer full name is required." };
    }

    if (!signatureData || !signatureData.trim()) {
      return { success: false, error: "Signature data is required." };
    }

    const signedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    // 1. Update signature request to SIGNED
    await commissionsDb.query(
      `UPDATE invoice_signature_requests 
       SET status = 'SIGNED',
           signed_name = ?,
           signed_signature_data = ?,
           signed_at = ?,
           signed_ip = ?,
           signed_user_agent = ?
       WHERE id = ?`,
      [signerName.trim(), signatureData, signedAt, ip || null, userAgent || null, req.id]
    );

    // 2. Lock the underlying invoice from further editing
    if (req.record_type === "COMMISSION_INVOICE") {
      await commissionsDb.query(
        "UPDATE generated_invoices SET is_locked = 1 WHERE id = ?",
        [req.record_id]
      );
    } else if (req.record_type === "SALES_INVOICE") {
      await commissionsDb.query(
        "UPDATE sales SET status = 'SIGNED' WHERE id = ?",
        [req.record_id]
      );
    }

    // 3. Log audit event
    await logSignatureEvent(
      req.id,
      "SIGNED",
      `Invoice signed by "${signerName.trim()}"`,
      ip,
      userAgent,
      { signerName: signerName.trim(), signedAt }
    );

    return { success: true };
  } catch (err: any) {
    console.error("Error signing invoice:", err);
    return { success: false, error: err?.message || "Failed to submit signature." };
  }
}

// Decline invoice submission
export async function declineInvoiceByToken({
  token,
  reason,
  ip,
  userAgent,
}: {
  token: string;
  reason: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const req = await getSignatureRequestByToken(token);
    if (!req) {
      return { success: false, error: "Invalid invoice signing link." };
    }

    if (req.status === "SIGNED") {
      return { success: false, error: "This invoice has already been signed and cannot be declined." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A reason is required to decline the invoice." };
    }

    const declinedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    await commissionsDb.query(
      `UPDATE invoice_signature_requests 
       SET status = 'DECLINED',
           declined_reason = ?,
           declined_at = ?
       WHERE id = ?`,
      [reason.trim(), declinedAt, req.id]
    );

    await logSignatureEvent(
      req.id,
      "DECLINED",
      `Invoice declined by recipient. Reason: "${reason.trim()}"`,
      ip,
      userAgent,
      { reason: reason.trim(), declinedAt }
    );

    return { success: true };
  } catch (err: any) {
    console.error("Error declining invoice:", err);
    return { success: false, error: err?.message || "Failed to decline invoice." };
  }
}

// Revoke a signature request (Admin action)
export async function revokeSignatureRequest({
  requestId,
  reason,
  adminIp,
  adminUserAgent,
}: {
  requestId: number;
  reason?: string;
  adminIp?: string | null;
  adminUserAgent?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureSignatureTables();

    const [rows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM invoice_signature_requests WHERE id = ? LIMIT 1",
      [requestId]
    );

    if (rows.length === 0) {
      return { success: false, error: "Signature request not found." };
    }

    const req = rows[0] as SignatureRequestRecord;
    if (req.status === "SIGNED") {
      return { success: false, error: "Cannot revoke a request that has already been signed." };
    }

    const revokedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    const cleanReason = (reason || "Revoked by administrator").trim();

    await commissionsDb.query(
      `UPDATE invoice_signature_requests 
       SET status = 'REVOKED',
           revoked_at = ?,
           revoked_reason = ?
       WHERE id = ?`,
      [revokedAt, cleanReason, requestId]
    );

    await logSignatureEvent(
      requestId,
      "REVOKED",
      `Signature link revoked by admin. Reason: "${cleanReason}"`,
      adminIp,
      adminUserAgent
    );

    return { success: true };
  } catch (err: any) {
    console.error("Error revoking signature request:", err);
    return { success: false, error: err?.message || "Failed to revoke request." };
  }
}

// Resend / Remind a signature request (with duplicate-send cooldown protection)
export async function resendSignatureRequest({
  requestId,
  adminIp,
  adminUserAgent,
  baseUrl,
}: {
  requestId: number;
  adminIp?: string | null;
  adminUserAgent?: string | null;
  baseUrl?: string;
}): Promise<{ success: boolean; error?: string; emailResult?: EmailResult }> {
  try {
    await ensureSignatureTables();

    const [rows] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM invoice_signature_requests WHERE id = ? LIMIT 1",
      [requestId]
    );

    if (rows.length === 0) {
      return { success: false, error: "Signature request not found." };
    }

    const req = rows[0] as SignatureRequestRecord;

    if (req.status === "SIGNED") {
      return { success: false, error: "Cannot resend an invoice that has already been signed." };
    }

    if (req.status === "REVOKED") {
      return { success: false, error: "Cannot resend a revoked request. Please create a new request instead." };
    }

    // Check duplicate-send protection: must wait at least 30 seconds between sends
    const [lastSendEvents] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT created_at FROM invoice_signature_events 
       WHERE request_id = ? AND event_type IN ('SENT', 'RESENT', 'REMINDED')
       ORDER BY id DESC LIMIT 1`,
      [requestId]
    );

    if (lastSendEvents.length > 0) {
      const lastSentTime = new Date(lastSendEvents[0].created_at).getTime();
      const elapsedSeconds = (Date.now() - lastSentTime) / 1000;
      if (elapsedSeconds < 30) {
        return {
          success: false,
          error: `Please wait ${Math.ceil(30 - elapsedSeconds)} seconds before resending to avoid duplicate emails.`,
        };
      }
    }

    const reviewUrl = buildReviewUrl(req.token, baseUrl);
    let snapshot: any = {};
    try {
      snapshot = JSON.parse(req.snapshot_json);
    } catch (e) {}

    const expiresFormatted = new Date(req.expires_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const norm = normalizeInvoiceSnapshot(snapshot);
    const emailHtml = generateSignatureEmailHtml({
      agentName: req.agent_name,
      invoiceNumber: req.invoice_number,
      amountFormatted: norm.totalAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
      currency: norm.currency,
      customMessage: req.message || undefined,
      reviewUrl,
      expiresAtFormatted: expiresFormatted,
    });

    const emailResult = await sendEmail({
      to: req.agent_email,
      subject: `[Reminder] Action Required: Sign Invoice ${req.invoice_number}`,
      html: emailHtml,
      text: `Reminder: Please review and sign invoice ${req.invoice_number} at:\n${reviewUrl}\n\nExpires: ${expiresFormatted}`,
    });

    await logSignatureEvent(
      requestId,
      "REMINDED",
      `Signature reminder email sent to ${req.agent_email} (mock: ${Boolean(emailResult.mock)})`,
      adminIp,
      adminUserAgent,
      { messageId: emailResult.messageId, mock: emailResult.mock }
    );

    return { success: true, emailResult };
  } catch (err: any) {
    console.error("Error resending signature request:", err);
    return { success: false, error: err?.message || "Failed to resend signature request." };
  }
}

// Get full history & audit events for an invoice record
export async function getSignatureHistoryForRecord(
  recordType: RecordType,
  recordId: number
): Promise<{
  activeRequest: SignatureRequestRecord | null;
  requests: SignatureRequestRecord[];
  events: SignatureEventRecord[];
}> {
  await ensureSignatureTables();

  const [reqRows] = await commissionsDb.query<RowDataPacket[]>(
    `SELECT * FROM invoice_signature_requests 
     WHERE record_type = ? AND record_id = ? 
     ORDER BY version DESC, id DESC`,
    [recordType, recordId]
  );

  const requests = reqRows as SignatureRequestRecord[];
  const activeRequest = requests[0] || null;

  let events: SignatureEventRecord[] = [];
  if (requests.length > 0) {
    const requestIds = requests.map((r) => r.id);
    const [eventRows] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM invoice_signature_events 
       WHERE request_id IN (?) 
       ORDER BY id DESC`,
      [requestIds]
    );
    events = eventRows as SignatureEventRecord[];
  }

  return { activeRequest, requests, events };
}

