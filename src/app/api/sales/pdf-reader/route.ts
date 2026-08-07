import { NextRequest, NextResponse } from "next/server";
// Import directly from lib to avoid index debug file loading issue
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No PDF files provided." }, { status: 400 });
    }

    const parsedResults: any[] = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      const rawText = pdfData.text || "";

      // Extraction Rules for Sales Invoice PDF
      const invDateMatch = rawText.match(/Invoice Date:\s*([^\r\n]+)/i);
      const invoiceDate = invDateMatch ? invDateMatch[1].trim() : "";

      const invNumMatch = rawText.match(/Invoice Number:\s*-?\s*([^\r\n]+)/i);
      const invoiceNumber = invNumMatch ? invNumMatch[1].trim() : "";

      // Customer / Client Name extraction
      let clientName = "";
      const aziziMatch = rawText.match(/(Azizi\s+Developments[^\r\n]*)/i);
      if (aziziMatch) {
        clientName = aziziMatch[1].trim();
      } else {
        const invToMatch = rawText.match(/Invoiced To:\s*[\r\n]*([^\r\n]+)/i);
        if (invToMatch) {
          clientName = invToMatch[1].replace(/E-mail:.*$/i, "").trim();
        }
      }

      // TRN Number
      const trnMatch = rawText.match(/TRN\s*:\s*([0-9]+)/i);
      const tinNumber = trnMatch ? trnMatch[1].trim() : "";

      // Line item & Commission extraction
      let projectUnit = "";
      let sellingPrice = "";
      let claimType = "Full";
      let percentage = "";
      let commissionAmt = "";

      const commMatch = rawText.match(/Commission Amt[^\r\n]*[\r\n]+([\s\S]+?)(?=Total|$)/i);
      if (commMatch) {
        const tableLine = commMatch[1].replace(/[\r\n]+/g, " ").trim();
        const pctMatch = tableLine.match(/(\d+(?:\.\d+)?%)\s*([\d,]+(?:\.\d{2})?)/);

        if (pctMatch) {
          percentage = pctMatch[1];
          commissionAmt = pctMatch[2];

          const beforePct = tableLine.substring(0, pctMatch.index);
          const claimMatch = beforePct.match(/(Full|Partial)/i);
          if (claimMatch) {
            claimType = claimMatch[1];
          }

          const beforeClaim = claimMatch ? beforePct.substring(0, claimMatch.index) : beforePct;
          const commNum = parseFloat(commissionAmt.replace(/,/g, ""));
          const pctNum = parseFloat(percentage.replace("%", "")) / 100;
          const calcSellingPrice = pctNum > 0 ? Math.round(commNum / pctNum) : 0;
          sellingPrice = String(calcSellingPrice);

          if (beforeClaim.endsWith(sellingPrice)) {
            projectUnit = beforeClaim.substring(0, beforeClaim.length - sellingPrice.length).trim();
          } else {
            const numMatch = beforeClaim.match(/^(.*?)(?:\s+|-)?(\d{5,})$/);
            if (numMatch) {
              projectUnit = numMatch[1].trim();
              sellingPrice = numMatch[2].trim();
            } else {
              projectUnit = beforeClaim.trim();
            }
          }
        }
      }

      parsedResults.push({
        fileName: file.name,
        fileSize: file.size,
        invoiceNumber,
        invoiceDate,
        clientName,
        tinNumber,
        projectUnit,
        sellingPrice,
        claimType,
        percentage,
        commissionAmt,
        rawTextPreview: rawText.substring(0, 400),
      });
    }

    return NextResponse.json({
      success: true,
      count: parsedResults.length,
      results: parsedResults,
    });
  } catch (error: any) {
    console.error("PDF Reader API Error:", error);
    return NextResponse.json({ error: "Failed to parse PDF document(s)", details: error.message }, { status: 500 });
  }
}
