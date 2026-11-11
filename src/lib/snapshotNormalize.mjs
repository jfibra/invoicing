function pickStr(...vals) {
  for (const v of vals) {
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed !== "") return trimmed;
    } else if (v !== undefined && v !== null) {
      return String(v);
    }
  }
  return "";
}

function pickNum(...vals) {
  for (const v of vals) {
    if (v === undefined || v === null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * Normalizes invoice snapshot payloads across both SALES_INVOICE (camelCase)
 * and COMMISSION_INVOICE (snake_case rows from generated_invoices) so the
 * email template, public E-Signature portal, and PDF export display accurate statement data.
 */
export function normalizeInvoiceSnapshot(rawSnap) {
  const snap = rawSnap && typeof rawSnap === "object" ? rawSnap : {};

  let profileSnap = {};
  try {
    if (typeof snap.profile_snapshot === "string") {
      profileSnap = JSON.parse(snap.profile_snapshot);
    } else if (snap.profile_snapshot && typeof snap.profile_snapshot === "object") {
      profileSnap = snap.profile_snapshot;
    }
  } catch {
    profileSnap = {};
  }

  let parsedDeductibles = [];
  try {
    const rawDed = typeof snap.deductibles === "string" ? JSON.parse(snap.deductibles) : snap.deductibles;
    if (Array.isArray(rawDed)) {
      parsedDeductibles = rawDed
        .map((d) => ({
          label: String(d?.label || "Deduction"),
          amount: Number(d?.amount || 0),
        }))
        .filter((d) => Number.isFinite(d.amount) && d.amount > 0);
    }
  } catch {
    parsedDeductibles = [];
  }

  const totalDeductibles = parsedDeductibles.reduce((sum, d) => sum + d.amount, 0);
  const netAmount =
    pickNum(snap.netAmount, snap.net_amount, snap.amount, snap.grossTaxable, snap.gross_taxable) ?? 0;
  const vatAmount = pickNum(snap.vatAmount, snap.vat_amount) ?? 0;
  const vatRate = pickNum(snap.vatRate, snap.vat_rate) ?? (vatAmount > 0 ? 5 : 0);
  const totalAmount =
    pickNum(
      snap.totalActualAmount,
      snap.total_actual_amount,
      snap.grossAmount,
      snap.gross_amount,
      snap.total_amount
    ) ?? netAmount;

  return {
    companyName:
      pickStr(snap.companyName, profileSnap?.company_name) || "FHI Global Property LLC",
    companyTrn:
      pickStr(snap.companyTrn, profileSnap?.tax_number, profileSnap?.trn_number) || "105088815300001",
    invoiceTypeLabel: snap.invoice_type
      ? String(snap.invoice_type).replace(/_/g, " ")
      : "Commission Statement",
    issuedDate: pickStr(snap.saleDate, snap.issuedDate, snap.issued_date, snap.sale_date) || null,
    memberCode: pickStr(snap.memberCode, snap.member_code, snap.agentCode, snap.agent_code) || "N/A",
    team: pickStr(snap.team, snap.teamName, snap.team_name) || "Direct",
    subteam: pickStr(snap.subteam, snap.subteamName, snap.subteam_name),
    customerOrDeveloper:
      pickStr(snap.customerName, snap.customer_name, snap.developerName, snap.developer_name) || "N/A",
    projectOrParticular:
      pickStr(
        snap.subcategoryName,
        snap.subcategory_name,
        snap.projectName,
        snap.project_name,
        snap.project_location
      ) || "General Brokerage",
    unitNumber: pickStr(snap.unitNumber, snap.unit_number),
    buyerName: pickStr(snap.buyerName, snap.buyer_name),
    tinNumber: pickStr(snap.tinNumber, snap.tin_number),
    categoryTitle:
      pickStr(snap.categoryName, snap.category_name, snap.particular_title) ||
      (snap.invoice_type
        ? String(snap.invoice_type).replace(/_/g, " ")
        : "Real Estate Brokerage Sales Commission"),
    currency: pickStr(snap.currency) || "AED",
    netAmount,
    vatRate,
    vatAmount,
    deductibles: parsedDeductibles,
    totalDeductibles,
    totalAmount,
    commissionReceived: pickNum(snap.commission_received) ?? 0,
    commissionRate: pickNum(snap.commission_rate) ?? 0,
    remarks: pickStr(snap.remarks),
  };
}
