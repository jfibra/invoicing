/**
 * Normalizes invoice snapshot payloads across both SALES_INVOICE (camelCase)
 * and COMMISSION_INVOICE (snake_case rows from generated_invoices) so the
 * public E-Signature portal and PDF export display accurate statement data.
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
  const netAmount = Number(snap.amount ?? snap.netAmount ?? snap.net_amount ?? 0);
  const vatAmount = Number(snap.vatAmount ?? snap.vat_amount ?? 0);
  const vatRate = Number(snap.vatRate ?? snap.vat_rate ?? (vatAmount > 0 ? 5 : 0));
  const totalAmount = Number(
    snap.totalActualAmount ?? snap.grossAmount ?? snap.gross_amount ?? netAmount
  );

  return {
    companyName:
      snap.companyName || profileSnap?.company_name || "FHI Global Property LLC",
    companyTrn:
      snap.companyTrn ||
      profileSnap?.tax_number ||
      profileSnap?.trn_number ||
      "105088815300001",
    invoiceTypeLabel: snap.invoice_type
      ? String(snap.invoice_type).replace(/_/g, " ")
      : "Commission Statement",
    issuedDate: snap.saleDate || snap.issuedDate || snap.issued_date || null,
    memberCode: snap.memberCode || snap.agentCode || snap.agent_code || "N/A",
    team: snap.team || snap.teamName || snap.team_name || "Direct",
    subteam: snap.subteam || snap.subteamName || snap.subteam_name || "",
    customerOrDeveloper:
      snap.customerName || snap.developerName || snap.developer_name || "N/A",
    projectOrParticular:
      snap.subcategoryName ||
      snap.projectName ||
      snap.project_name ||
      "General Brokerage",
    unitNumber: snap.unitNumber || snap.unit_number || "",
    buyerName: snap.buyerName || snap.buyer_name || "",
    tinNumber: snap.tinNumber || snap.tin_number || "",
    categoryTitle:
      snap.categoryName ||
      snap.particular_title ||
      (snap.invoice_type
        ? String(snap.invoice_type).replace(/_/g, " ")
        : "Real Estate Brokerage Sales Commission"),
    currency: snap.currency || "AED",
    netAmount,
    vatRate,
    vatAmount,
    deductibles: parsedDeductibles,
    totalDeductibles,
    totalAmount,
    commissionReceived: Number(snap.commission_received ?? 0),
    commissionRate: Number(snap.commission_rate ?? 0),
    remarks: snap.remarks || "",
  };
}

