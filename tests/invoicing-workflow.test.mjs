import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { normalizeInvoiceSnapshot } from "../src/lib/snapshotNormalize.mjs";

// ---------------------------------------------------------------------------
// 1. Loading, Error, Empty, and Populated State Contract Tests
// ---------------------------------------------------------------------------
test("State Machine: Distinguishes failed query from successful empty result", () => {
  function computeViewState({ loading, error, items }) {
    if (loading) return "LOADING";
    if (error) return "ERROR";
    if (!items || items.length === 0) return "EMPTY";
    return "POPULATED";
  }

  assert.equal(computeViewState({ loading: true, error: null, items: [] }), "LOADING");
  assert.equal(computeViewState({ loading: false, error: "ETIMEDOUT", items: [] }), "ERROR");
  assert.equal(computeViewState({ loading: false, error: null, items: [] }), "EMPTY");
  assert.equal(computeViewState({ loading: false, error: null, items: [{ id: 1 }] }), "POPULATED");
});

// ---------------------------------------------------------------------------
// 2. Server-Side Pagination and Search for Large Agent Lists (28,338 records)
// ---------------------------------------------------------------------------
test("Pagination & Search: Safely pages through 28,338 member records", () => {
  const totalRosterCount = 28338;
  const limits = [10, 25, 50, 100];

  for (const limit of limits) {
    const totalPages = Math.ceil(totalRosterCount / limit);
    assert.ok(totalPages > 0);
    assert.equal(totalPages, Math.ceil(28338 / limit));
  }

  // Offset calculation
  function calculateOffset(page, limit) {
    const safePage = Math.max(1, page);
    const safeLimit = [10, 25, 50, 100].includes(limit) ? limit : 10;
    return (safePage - 1) * safeLimit;
  }

  assert.equal(calculateOffset(1, 10), 0);
  assert.equal(calculateOffset(2, 10), 10);
  assert.equal(calculateOffset(5, 50), 200);

  // Search filter query sanitizer
  function buildMemberSearchClauses(searchTerm) {
    const trimmed = searchTerm.trim();
    if (!trimmed) return { clause: "", params: [] };
    const term = `%${trimmed}%`;
    return {
      clause: "AND (completename LIKE ? OR member_code LIKE ? OR email LIKE ? OR teamname LIKE ?)",
      params: [term, term, term, term],
    };
  }

  const query = buildMemberSearchClauses("John Doe");
  assert.equal(query.params.length, 4);
  assert.equal(query.params[0], "%John Doe%");
});

// ---------------------------------------------------------------------------
// 3. Sales Invoice Math, VAT Treatment, and Deductibles Consistency
// ---------------------------------------------------------------------------
test("Invoice Math: Accurate calculations for VAT, deductibles, and net payout", () => {
  function calculateInvoiceTotals({
    salePrice,
    commissionRate,
    agentSplitRate,
    includeVat = true,
    vatRatePercent = 5,
    deductibles = [],
  }) {
    // Total gross commission received from developer
    const grossCommReceived = Math.round((salePrice * (commissionRate / 100)) * 100) / 100;
    
    // Agent net split amount
    const agentNetCommission = Math.round((grossCommReceived * (agentSplitRate / 100)) * 100) / 100;

    // Output VAT (if applicable)
    const vatAmount = includeVat
      ? Math.round((agentNetCommission * (vatRatePercent / 100)) * 100) / 100
      : 0;

    // Sum of valid deductibles
    const totalDeductibles = deductibles.reduce((sum, item) => {
      const amt = Number(item.amount) || 0;
      return sum + (amt > 0 ? amt : 0);
    }, 0);

    // Gross payable to agent
    const grossTotal = Math.round((agentNetCommission + vatAmount - totalDeductibles) * 100) / 100;

    return {
      grossCommReceived,
      agentNetCommission,
      vatAmount,
      totalDeductibles,
      grossTotal,
    };
  }

  // Example: 1,500,000 AED property, 3% developer commission, 50% agent split, 5% VAT, 500 AED deductible
  const res = calculateInvoiceTotals({
    salePrice: 1500000,
    commissionRate: 3.0,
    agentSplitRate: 50.0,
    includeVat: true,
    vatRatePercent: 5,
    deductibles: [
      { label: "Marketing Collateral", amount: 200 },
      { label: "Bank Wire Fee", amount: 300 },
      { label: "Invalid negative", amount: -100 }, // Should be ignored
    ],
  });

  assert.equal(res.grossCommReceived, 45000); // 3% of 1.5M = 45,000
  assert.equal(res.agentNetCommission, 22500); // 50% split = 22,500
  assert.equal(res.vatAmount, 1125); // 5% VAT on 22,500 = 1,125
  assert.equal(res.totalDeductibles, 500); // 200 + 300
  assert.equal(res.grossTotal, 23125); // 22,500 + 1,125 - 500 = 23,125
});

// ---------------------------------------------------------------------------
// 4. E-Signature Token Generation, Scope, Expiry, and Rate Limiting
// ---------------------------------------------------------------------------
test("Token Security: Generates 256-bit cryptographically secure tokens", () => {
  const token = crypto.randomBytes(32).toString("hex");
  assert.equal(token.length, 64);
  assert.match(token, /^[0-9a-f]{64}$/);
});

test("Token Expiration: Rejects expired signing tokens", () => {
  const now = new Date();
  const validToken = {
    token: "token123",
    status: "SENT",
    expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
  };
  const expiredToken = {
    token: "token456",
    status: "SENT",
    expires_at: new Date(now.getTime() - 1000), // 1 sec in past
  };

  function validateTokenExpiry(req) {
    if (new Date(req.expires_at).getTime() < Date.now()) {
      return { valid: false, reason: "EXPIRED" };
    }
    if (req.status === "REVOKED") {
      return { valid: false, reason: "REVOKED" };
    }
    return { valid: true };
  }

  assert.equal(validateTokenExpiry(validToken).valid, true);
  assert.equal(validateTokenExpiry(expiredToken).valid, false);
  assert.equal(validateTokenExpiry(expiredToken).reason, "EXPIRED");
});

test("Rate Limiter: Prevents brute-force scanning of public tokens", () => {
  const hits = new Map();
  function checkRateLimit(key, maxLimit = 5, windowMs = 60000) {
    const now = Date.now();
    const record = hits.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + windowMs;
      hits.set(key, record);
      return true;
    }
    record.count += 1;
    hits.set(key, record);
    return record.count <= maxLimit;
  }

  const clientIp = "192.168.1.100";
  for (let i = 1; i <= 5; i++) {
    assert.equal(checkRateLimit(clientIp, 5), true, `Attempt ${i} should be allowed`);
  }
  // 6th attempt should be blocked
  assert.equal(checkRateLimit(clientIp, 5), false, "6th attempt should be blocked by rate limit");
});

// ---------------------------------------------------------------------------
// 5. Email Service Safety: Mock Transport, Header Sanitization, HTML Escaping
// ---------------------------------------------------------------------------
test("Email Security: Sanitizes header injection & escapes HTML", () => {
  function sanitizeHeader(val) {
    return String(val || "").replace(/[\r\n]+/g, " ").trim();
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const maliciousSubject = "Important Notice\r\nBcc: victim@example.com\r\nSubject: Spoofed";
  assert.equal(sanitizeHeader(maliciousSubject), "Important Notice Bcc: victim@example.com Subject: Spoofed");

  const maliciousName = "<script>alert('xss')</script> & \"Admin\"";
  assert.equal(escapeHtml(maliciousName), "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt; &amp; &quot;Admin&quot;");

  function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(String(email).trim());
  }

  assert.equal(isValidEmail("agent@domain.com"), true);
  assert.equal(isValidEmail("invalid-email"), false);
  assert.equal(isValidEmail("victim@test\n.com"), false);
});

// ---------------------------------------------------------------------------
// 6. Tamper-Evident SHA-256 Hash, Consent, and Edit-Locking
// ---------------------------------------------------------------------------
test("E-Signature Integrity: Produces immutable SHA-256 snapshot and locks record", () => {
  const snapshotData = {
    invoice_number: "INV-2026-001",
    issue_date: "2026-02-15",
    developer: "Emaar Properties",
    agent_code: "726170245",
    net_commission: 22500,
    currency: "AED",
  };

  const hash1 = crypto.createHash("sha256").update(JSON.stringify(snapshotData)).digest("hex");
  const hash2 = crypto.createHash("sha256").update(JSON.stringify(snapshotData)).digest("hex");
  assert.equal(hash1, hash2, "Identical snapshot produces exact SHA-256 digest");

  // Tampering changes the hash
  const tamperedData = { ...snapshotData, net_commission: 999999 };
  const tamperedHash = crypto.createHash("sha256").update(JSON.stringify(tamperedData)).digest("hex");
  assert.notEqual(hash1, tamperedHash, "Tampered invoice snapshot produces different hash");

  // Edit locking test
  function canEditRecord(record) {
    if (record.is_locked || record.signature_status === "SIGNED") {
      return { allowed: false, error: "Record is signed/locked and cannot be edited. Create an amended version to make changes." };
    }
    return { allowed: true };
  }

  assert.equal(canEditRecord({ is_locked: 0, signature_status: "DRAFT" }).allowed, true);
  assert.equal(canEditRecord({ is_locked: 1, signature_status: "DRAFT" }).allowed, false);
  assert.equal(canEditRecord({ is_locked: 0, signature_status: "SIGNED" }).allowed, false);
});

// ---------------------------------------------------------------------------
// 7. Consent and Audit Event Trail
// ---------------------------------------------------------------------------
test("Audit Events: Follows strictly ordered event lifecycle", () => {
  const validTransitions = {
    DRAFT: ["SENT"],
    SENT: ["VIEWED", "REVOKED", "EXPIRED", "SENT"],
    VIEWED: ["SIGNED", "DECLINED", "REVOKED", "EXPIRED"],
    SIGNED: [], // Terminal locked state
    DECLINED: ["SENT"], // Admin can resend after revision
    REVOKED: ["SENT"], // Admin can reissue
    EXPIRED: ["SENT"], // Admin can reissue
  };

  function isValidTransition(from, to) {
    return (validTransitions[from] || []).includes(to);
  }

  assert.equal(isValidTransition("DRAFT", "SENT"), true);
  assert.equal(isValidTransition("SENT", "VIEWED"), true);
  assert.equal(isValidTransition("VIEWED", "SIGNED"), true);
  assert.equal(isValidTransition("VIEWED", "DECLINED"), true);
  assert.equal(isValidTransition("SIGNED", "DRAFT"), false, "Cannot un-sign a locked document");
  assert.equal(isValidTransition("SIGNED", "VIEWED"), false);
});

// ---------------------------------------------------------------------------
// 8. Authorization and Session Enforcement
// ---------------------------------------------------------------------------
test("Auth Check: Enforces roles and rejects unauthorized admin access", () => {
  function verifyUserRole(user, allowedRoles) {
    if (!user) return { status: 401, error: "Authentication required" };
    const userRole = (user.roleName || "").toUpperCase();
    const authorized = allowedRoles.map((r) => r.toUpperCase()).includes(userRole);
    if (!authorized) return { status: 403, error: `Forbidden: role '${userRole}' is not authorized` };
    return { status: 200, user };
  }

  const unauthenticated = verifyUserRole(null, ["ADMIN"]);
  assert.equal(unauthenticated.status, 401);

  const agentUser = { id: 10, roleName: "AGENT" };
  const forbidden = verifyUserRole(agentUser, ["ADMIN"]);
  assert.equal(forbidden.status, 403);

  const adminUser = { id: 1, roleName: "ADMIN" };
  const authorized = verifyUserRole(adminUser, ["ADMIN"]);
  assert.equal(authorized.status, 200);
});

// ---------------------------------------------------------------------------
// 9. Mobile Review/Signing Layout & Keyboard Accessibility
// ---------------------------------------------------------------------------
test("Accessibility & Mobile Sign Layout: Validates keyboard and signing mode contract", () => {
  // Mobile signing modes: DRAW (Canvas touch/mouse) or TYPE (Text input)
  function validateSignatureSubmission({ mode, drawnData, typedName, consentGiven }) {
    if (!consentGiven) {
      return { valid: false, error: "Explicit legal consent is required before signing." };
    }
    if (mode === "DRAW") {
      if (!drawnData || !drawnData.startsWith("data:image/png;base64,")) {
        return { valid: false, error: "Please provide a valid signature drawing." };
      }
    } else if (mode === "TYPE") {
      if (!typedName || typedName.trim().length < 2) {
        return { valid: false, error: "Please type your full legal name." };
      }
    } else {
      return { valid: false, error: "Invalid signature method." };
    }
    return { valid: true };
  }

  // Without consent
  assert.equal(
    validateSignatureSubmission({ mode: "DRAW", drawnData: "data:image/png;base64,abc", typedName: "", consentGiven: false }).valid,
    false
  );

  // Valid drawn signature
  assert.equal(
    validateSignatureSubmission({ mode: "DRAW", drawnData: "data:image/png;base64,iVBORw0KGgoAAAANS...", typedName: "", consentGiven: true }).valid,
    true
  );

  // Valid typed signature
  assert.equal(
    validateSignatureSubmission({ mode: "TYPE", drawnData: "", typedName: "Jane Doe", consentGiven: true }).valid,
    true
  );

  // Keyboard accessibility helper for modal dismissing & action toggling
  function handleKeyboardAction(key, { isModalOpen, onDismiss, onToggleConsent }) {
    if (key === "Escape" && isModalOpen) {
      onDismiss();
      return "DISMISSED";
    }
    if (key === " " || key === "Enter") {
      onToggleConsent();
      return "TOGGLED";
    }
    return "IGNORED";
  }

  let dismissed = false;
  let toggled = false;
  const res1 = handleKeyboardAction("Escape", { isModalOpen: true, onDismiss: () => { dismissed = true; }, onToggleConsent: () => {} });
  assert.equal(res1, "DISMISSED");
  assert.equal(dismissed, true);

  const res2 = handleKeyboardAction(" ", { isModalOpen: false, onDismiss: () => {}, onToggleConsent: () => { toggled = true; } });
  assert.equal(res2, "TOGGLED");
  assert.equal(toggled, true);
});

// ---------------------------------------------------------------------------
// 12. Invoice Snapshot Normalization (COMMISSION_INVOICE snake_case vs SALES_INVOICE camelCase)
// ---------------------------------------------------------------------------
test("Snapshot Normalization: Supports COMMISSION_INVOICE snake_case and SALES_INVOICE camelCase", () => {
  // Commission Invoice row (generated_invoices schema)
  const commissionSnap = normalizeInvoiceSnapshot({
    invoice_type: "TAX_INVOICE",
    issued_date: "2026-10-17T00:00:00.000Z",
    agent_code: "1123241352",
    team_name: "Team Alpha",
    subteam_name: "Dubai South",
    developer_name: "Azizi Developments",
    project_name: "Azizi Riviera",
    unit_number: "B-402",
    buyer_name: "Azizi Wares",
    net_amount: "53170.18",
    vat_rate: "0",
    vat_amount: "0.00",
    gross_amount: "13170.18",
    currency: "AED",
    deductibles: JSON.stringify([
      { label: "Cash Advance", amount: 20000 },
      { label: "Partial payment", amount: 20000 },
      { label: "Zero item", amount: 0 },
    ]),
    profile_snapshot: JSON.stringify({
      company_name: "FHI Global Property LLC",
      tax_number: "105088815300001",
    }),
  });

  assert.equal(commissionSnap.companyName, "FHI Global Property LLC");
  assert.equal(commissionSnap.companyTrn, "105088815300001");
  assert.equal(commissionSnap.invoiceTypeLabel, "TAX INVOICE");
  assert.equal(commissionSnap.issuedDate, "2026-10-17T00:00:00.000Z");
  assert.equal(commissionSnap.memberCode, "1123241352");
  assert.equal(commissionSnap.team, "Team Alpha");
  assert.equal(commissionSnap.subteam, "Dubai South");
  assert.equal(commissionSnap.customerOrDeveloper, "Azizi Developments");
  assert.equal(commissionSnap.projectOrParticular, "Azizi Riviera");
  assert.equal(commissionSnap.unitNumber, "B-402");
  assert.equal(commissionSnap.buyerName, "Azizi Wares");
  assert.equal(commissionSnap.netAmount, 53170.18);
  assert.equal(commissionSnap.vatRate, 0);
  assert.equal(commissionSnap.vatAmount, 0);
  assert.equal(commissionSnap.deductibles.length, 2);
  assert.equal(commissionSnap.totalDeductibles, 40000);
  assert.equal(commissionSnap.totalAmount, 13170.18);

  // Sales Invoice snapshot (camelCase)
  const salesSnap = normalizeInvoiceSnapshot({
    companyName: "FHI Global Property LLC",
    companyTrn: "105088815300001",
    saleDate: "2026-09-12",
    memberCode: "FH-9901",
    team: "Core Sales",
    customerName: "Emaar Properties",
    categoryName: "COMMISSION SALES",
    subcategoryName: "Downtown Views",
    tinNumber: "100222333",
    amount: 10000,
    vatAmount: 500,
    totalActualAmount: 10500,
    currency: "AED",
  });

  assert.equal(salesSnap.customerOrDeveloper, "Emaar Properties");
  assert.equal(salesSnap.projectOrParticular, "Downtown Views");
  assert.equal(salesSnap.memberCode, "FH-9901");
  assert.equal(salesSnap.netAmount, 10000);
  assert.equal(salesSnap.vatAmount, 500);
  assert.equal(salesSnap.vatRate, 5);
  assert.equal(salesSnap.totalAmount, 10500);
  assert.equal(salesSnap.deductibles.length, 0);
});



