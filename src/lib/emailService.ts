import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  mock?: boolean;
  error?: string;
}

// In-memory log of mock-sent emails for inspection, debugging, and automated tests
export interface SentEmailRecord {
  to: string;
  subject: string;
  html: string;
  text?: string;
  sentAt: string;
  messageId: string;
  mock: boolean;
}

const mockEmailHistory: SentEmailRecord[] = [];

export function getMockEmailHistory(): SentEmailRecord[] {
  return [...mockEmailHistory];
}

export function clearMockEmailHistory(): void {
  mockEmailHistory.length = 0;
}

// Security: Prevent header injection (\r, \n) and validate recipient email format
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.includes("\r") || trimmed.includes("\n")) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

// Security: Escape user-provided inputs to prevent HTML injection in emails
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function isMockEmailMode(): boolean {
  // Always use mock mode in testing, development, or unless LIVE_EMAIL_SENDING is explicitly set to "true"
  // This strictly enforces the requirement: "Do not send test or real email during implementation or automated tests"
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.MOCK_EMAIL === "true") return true;
  if (process.env.LIVE_EMAIL_SENDING !== "true") return true;
  return false;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const recipient = (options.to || "").trim();

  if (!recipient || !isValidEmail(recipient)) {
    return {
      success: false,
      error: `Invalid recipient email address: "${recipient}"`,
    };
  }

  // Prevent subject line header injection
  const sanitizedSubject = options.subject.replace(/[\r\n]+/g, " ").trim();

  // MOCK TRANSPORT MODE (Safe default preventing real email dispatch)
  if (isMockEmailMode()) {
    const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const record: SentEmailRecord = {
      to: recipient,
      subject: sanitizedSubject,
      html: options.html,
      text: options.text,
      sentAt: new Date().toISOString(),
      messageId: mockId,
      mock: true,
    };
    mockEmailHistory.push(record);

    console.log(`[EmailService MOCK] Email recorded successfully -> To: ${recipient} | Subject: "${sanitizedSubject}" | MockID: ${mockId}`);
    return {
      success: true,
      messageId: mockId,
      mock: true,
    };
  }

  // LIVE SMTP TRANSPORT (Only invoked when LIVE_EMAIL_SENDING === "true")
  try {
    const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
    const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 465);
    const user = process.env.MAIL_USERNAME || process.env.SMTP_USER;
    const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || process.env.SMTP_FROM_EMAIL || user || "no-reply@filipinohomes.com";
    const fromName = (process.env.MAIL_FROM_NAME || process.env.SMTP_FROM_NAME || "Filipino Homes").replace(/"/g, "");

    if (!host || !user || !pass) {
      return {
        success: false,
        error: "SMTP configuration is incomplete. Please check MAIL_HOST / SMTP_HOST, MAIL_USERNAME / SMTP_USER, and MAIL_PASSWORD / SMTP_PASS.",
      };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || process.env.MAIL_ENCRYPTION === "ssl",
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: recipient,
      replyTo: options.replyTo,
      subject: sanitizedSubject,
      html: options.html,
      text: options.text,
    });

    return {
      success: true,
      messageId: info.messageId,
      mock: false,
    };
  } catch (err: any) {
    console.error("[EmailService SMTP Error]:", err);
    return {
      success: false,
      error: err?.message || "Failed to deliver email through SMTP transport.",
    };
  }
}

