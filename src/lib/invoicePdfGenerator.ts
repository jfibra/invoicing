import { jsPDF } from "jspdf";

export interface InvoicePdfPartyBlock {
  title: string;
  heading: string;
  lines: string[];
}

export interface InvoicePdfLineItem {
  description: string;
  subDescription?: string;
  basisOrRate: string;
  taxTreatment: string;
  amountText: string;
  isDeduction?: boolean;
  isTaxPositive?: boolean;
}

export interface InvoicePdfInput {
  fileName: string;
  badgeText: string;
  invoiceNumber: string;
  issueDate: string;
  statusLabel: string;
  companyName: string;
  companyAddress: string;
  companyTrn: string;
  logoUrl?: string | null;
  leftParty: InvoicePdfPartyBlock;
  rightParty: InvoicePdfPartyBlock;
  currency: string;
  items: InvoicePdfLineItem[];
  settlementLines: string[];
  paymentTerms: string;
  netLabel: string;
  netValue: string;
  vatLabel: string;
  vatValue: string;
  deductiblesValue?: string | null;
  totalLabel: string;
  totalValue: string;
  remarks?: string | null;
  footerTitle: string;
  signature?: {
    isSigned: boolean;
    signedName?: string | null;
    signedAt?: string | null;
    signatureDataUrl?: string | null;
    snapshotHash?: string | null;
  };
}

async function loadImageAsPngDataUrl(rawUrl: string): Promise<{
  dataUrl: string;
  width: number;
  height: number;
} | null> {
  if (typeof window === "undefined" || !rawUrl) return null;

  const isExternal = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
  const resolvedUrl = isExternal
    ? `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`
    : rawUrl;

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 2000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 300;
        canvas.height = img.naturalHeight || img.height || 90;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height,
        });
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = resolvedUrl;
  });
}

/**
 * Generates a single-page A4 executive PDF matching the #001f3f navy header/footer
 * invoice sheet design across Commission, Sales, and Public E-Sign pages.
 */
export async function generateInvoicePdf(input: InvoicePdfInput): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // Attempt logo load (remote or fallback to /fhi.png)
  let logoAsset = input.logoUrl ? await loadImageAsPngDataUrl(input.logoUrl) : null;
  if (!logoAsset && input.logoUrl !== "/fhi.png") {
    logoAsset = await loadImageAsPngDataUrl("/fhi.png");
  }

  // ------------------------------------------------------------------
  // 1. TOP NAVY HEADER BANNER (#001f3f) + RED ACCENT STRIPE (#dc2626)
  // ------------------------------------------------------------------
  const headerHeight = 40;
  doc.setFillColor(0, 31, 63); // #001f3f
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // Crimson accent bottom border
  doc.setFillColor(220, 38, 38); // #dc2626
  doc.rect(0, headerHeight, pageWidth, 1.5, "F");

  // Logo on top-left
  if (logoAsset) {
    const maxLogoW = 46;
    const maxLogoH = 13;
    const aspect = logoAsset.width / Math.max(1, logoAsset.height);
    let drawW = maxLogoW;
    let drawH = drawW / aspect;
    if (drawH > maxLogoH) {
      drawH = maxLogoH;
      drawW = drawH * aspect;
    }
    doc.addImage(logoAsset.dataUrl, "PNG", marginX, 6.5, drawW, drawH);
  }

  const companyStartY = logoAsset ? 24.5 : 13;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(input.companyName, marginX, companyStartY);

  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const addressLines = doc.splitTextToSize(input.companyAddress, 108);
  doc.text(addressLines[0] || "", marginX, companyStartY + 5);
  doc.text(`Tax Registration No. (TRN): ${input.companyTrn}`, marginX, companyStartY + 9.5);

  // Top-right badge & metadata
  const badgeLabel = input.badgeText.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  const badgeW = Math.max(32, Math.min(72, doc.getTextWidth(badgeLabel) + 10));
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(pageWidth - marginX - badgeW, 7, badgeW, 6.5, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(badgeLabel, pageWidth - marginX - badgeW / 2, 11.4, { align: "center" });

  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.text("INVOICE NUMBER", pageWidth - marginX, 18.5, { align: "right" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(input.invoiceNumber, pageWidth - marginX, 24, { align: "right" });

  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.text(`Issue Date: ${input.issueDate}`, pageWidth - marginX, 29.5, { align: "right" });
  doc.text(`Status: ${input.statusLabel}`, pageWidth - marginX, 34, { align: "right" });

  // ------------------------------------------------------------------
  // 2. PARTIES GRID CARD
  // ------------------------------------------------------------------
  let y = 47;
  const leftLines = input.leftParty.lines.filter(Boolean).slice(0, 4);
  const rightLines = input.rightParty.lines.filter(Boolean).slice(0, 4);
  const partyRowsCount = Math.max(leftLines.length, rightLines.length, 2);
  const partyBoxH = 15 + partyRowsCount * 4.5 + 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentWidth, partyBoxH, 3, 3, "FD");

  // Vertical divider inside party card
  const midX = marginX + contentWidth / 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(midX, y + 4, midX, y + partyBoxH - 4);

  const renderPartyCol = (block: InvoicePdfPartyBlock, lines: string[], x: number) => {
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.text(block.title.toUpperCase(), x, y + 6.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(doc.splitTextToSize(block.heading, 80)[0] || "", x, y + 12);

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    lines.forEach((line, idx) => {
      doc.text(doc.splitTextToSize(line, 80)[0] || "", x, y + 17 + idx * 4.4);
    });
  };

  renderPartyCol(input.leftParty, leftLines, marginX + 4.5);
  renderPartyCol(input.rightParty, rightLines, midX + 5);

  y += partyBoxH + 6;

  // ------------------------------------------------------------------
  // 3. BREAKDOWN TABLE
  // ------------------------------------------------------------------
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.text(`COMMISSION BREAKDOWN & PARTICULARS (${input.currency})`, marginX, y);
  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, y, contentWidth, 7.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y + 7.5, marginX + contentWidth, y + 7.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("ITEM DESCRIPTION", marginX + 3, y + 5);
  doc.text("BASIS / RATE", marginX + 94, y + 5, { align: "center" });
  doc.text("TAX TREATMENT", marginX + 135, y + 5, { align: "right" });
  doc.text(`AMOUNT (${input.currency})`, pageWidth - marginX - 3, y + 5, { align: "right" });
  y += 7.5;

  // Compact row height if there are many items to guarantee 1-page fit
  const compactRows = input.items.length > 6;
  const rowStep = compactRows ? 7.2 : 9;

  for (const item of input.items) {
    if (item.isDeduction) {
      doc.setFillColor(255, 251, 235);
      doc.rect(marginX, y, contentWidth, rowStep, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(compactRows ? 7.5 : 8);
    if (item.isDeduction) {
      doc.setTextColor(146, 64, 14);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(doc.splitTextToSize(item.description, 75)[0] || "", marginX + 3, y + 4.3);

    if (item.subDescription && !compactRows) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(doc.splitTextToSize(item.subDescription, 75)[0] || "", marginX + 3, y + 7.6);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(item.basisOrRate, marginX + 94, y + 4.8, { align: "center" });

    if (item.isDeduction) {
      doc.setTextColor(180, 83, 9);
    } else if (item.isTaxPositive) {
      doc.setTextColor(22, 163, 74);
    }
    doc.text(item.taxTreatment, marginX + 135, y + 4.8, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    if (item.isDeduction) {
      doc.setTextColor(180, 83, 9);
    } else if (item.isTaxPositive) {
      doc.setTextColor(21, 128, 61);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(item.amountText, pageWidth - marginX - 3, y + 4.8, { align: "right" });

    doc.setDrawColor(241, 245, 249);
    doc.line(marginX, y + rowStep, marginX + contentWidth, y + rowStep);
    y += rowStep;
  }

  y += 5;

  // ------------------------------------------------------------------
  // 4. SETTLEMENT DETAILS (LEFT) + TOTALS BOX (RIGHT)
  // ------------------------------------------------------------------
  const leftBoxW = 94;
  const rightBoxX = marginX + leftBoxW + 8;
  const rightBoxW = contentWidth - leftBoxW - 8;

  const settlementLines = input.settlementLines.filter(Boolean).slice(0, 4);
  const settlementBoxH = Math.max(30, 15 + settlementLines.length * 4.2 + 6);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, leftBoxW, settlementBoxH, 2.5, 2.5, "FD");

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.text("SETTLEMENT & STATEMENT REFERENCE", marginX + 3.5, y + 5.5);

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  settlementLines.forEach((line, idx) => {
    doc.text(doc.splitTextToSize(line, leftBoxW - 7)[0] || "", marginX + 3.5, y + 10.5 + idx * 4.2);
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(marginX + 3.5, y + settlementBoxH - 7, marginX + leftBoxW - 3.5, y + settlementBoxH - 7);
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(doc.splitTextToSize(input.paymentTerms, leftBoxW - 7)[0] || "", marginX + 3.5, y + settlementBoxH - 2.8);

  // Right Totals Breakdown
  let ty = y + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(input.netLabel, rightBoxX, ty);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(input.netValue, pageWidth - marginX, ty, { align: "right" });

  ty += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(input.vatLabel, rightBoxX, ty);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text(input.vatValue, pageWidth - marginX, ty, { align: "right" });

  if (input.deductiblesValue) {
    ty += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(146, 64, 14);
    doc.text("Total Deductibles:", rightBoxX, ty);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 83, 9);
    doc.text(input.deductiblesValue, pageWidth - marginX, ty, { align: "right" });
  }

  ty += 4;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(rightBoxX, ty, rightBoxW, 10.5, 2.5, 2.5, "FD");

  doc.setTextColor(185, 28, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.text(input.totalLabel, rightBoxX + 3, ty + 6.7);
  doc.setFontSize(9.5);
  doc.text(input.totalValue, pageWidth - marginX - 3, ty + 6.8, { align: "right" });

  y = Math.max(y + settlementBoxH, ty + 11) + 5;

  if (input.remarks && y < 210) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const remarkLines = doc.splitTextToSize(`Remarks: ${input.remarks}`, contentWidth - 7).slice(0, 2);
    const remH = 5 + remarkLines.length * 4;
    doc.roundedRect(marginX, y, contentWidth, remH, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    remarkLines.forEach((line: string, idx: number) => {
      doc.text(line, marginX + 3.5, y + 4.5 + idx * 3.8);
    });
    y += remH + 4;
  }

  // ------------------------------------------------------------------
  // 5. BOTTOM PINNED TERMS NOTICE + SIGNATORIES + #001f3f FOOTER
  // ------------------------------------------------------------------
  const footerHeight = 14;
  const footerY = pageHeight - footerHeight;
  const sigY = Math.max(y + 2, 236);
  const termsY = sigY - 21;

  // Terms Notice above Signatories
  if (termsY > y) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, termsY, contentWidth, 16, 2.5, 2.5, "FD");
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.text("TERMS, CONDITIONS & VERIFICATION NOTICE", marginX + 3.5, termsY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `1. This official statement is issued by ${input.companyName} for review and signature acknowledgment.`,
      marginX + 3.5,
      termsY + 9.5
    );
    doc.text(
      "2. All commission splits, tax treatments, and approved deductions comply with corporate brokerage accounting principles.",
      marginX + 3.5,
      termsY + 13.3
    );
  }

  // Signatory Section
  const leftSigX = marginX;
  const rightSigX = marginX + contentWidth / 2 + 5;

  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, sigY - 2, pageWidth - marginX, sigY - 2);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Authorized Company Signatory", leftSigX, sigY + 3.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Filipino Homes / FHI Global Property", leftSigX, sigY + 7.5);

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("FHI Management", leftSigX, sigY + 21);
  doc.setDrawColor(203, 213, 225);
  doc.line(leftSigX, sigY + 23, leftSigX + 60, sigY + 23);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Agent Acknowledgment & Signature", rightSigX, sigY + 3.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Electronic acknowledgment of statement", rightSigX, sigY + 7.5);

  if (input.signature?.isSigned) {
    if (input.signature.signatureDataUrl?.startsWith("data:image/")) {
      try {
        doc.addImage(input.signature.signatureDataUrl, "PNG", rightSigX, sigY + 9, 32, 10);
      } catch {
        // Ignore invalid custom signature data URL and render typed name cleanly
      }
    }
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(21, 128, 61);
    doc.text(input.signature.signedName || "Signed Electronically", rightSigX, sigY + 21.5);
    doc.setDrawColor(16, 185, 129);
    doc.line(rightSigX, sigY + 23, rightSigX + 68, sigY + 23);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const signedTime = input.signature.signedAt
      ? new Date(input.signature.signedAt).toLocaleString()
      : "Verified";
    doc.text(`Signed: ${signedTime}`, rightSigX, sigY + 26.8);
    if (input.signature.snapshotHash) {
      doc.text(
        `SHA-256: ${input.signature.snapshotHash.slice(0, 24)}...`,
        rightSigX,
        sigY + 30.2
      );
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Pending Agent Signature", rightSigX, sigY + 21);
    doc.setDrawColor(203, 213, 225);
    doc.line(rightSigX, sigY + 23, rightSigX + 60, sigY + 23);
  }

  // ------------------------------------------------------------------
  // 6. BOTTOM #001f3f NAVY FOOTER + RED ACCENT STRIPE
  // ------------------------------------------------------------------
  doc.setFillColor(220, 38, 38); // #dc2626
  doc.rect(0, footerY - 1.5, pageWidth, 1.5, "F");

  doc.setFillColor(0, 31, 63); // #001f3f
  doc.rect(0, footerY, pageWidth, footerHeight, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(`${input.footerTitle} • ${input.companyName}`, marginX, footerY + 8.5);

  doc.setTextColor(203, 213, 225);
  doc.setFont("courier", "bold");
  doc.setFontSize(7.5);
  doc.text(`${input.invoiceNumber} • Page 1 of 1`, pageWidth - marginX, footerY + 8.5, {
    align: "right",
  });

  doc.save(input.fileName);
}
