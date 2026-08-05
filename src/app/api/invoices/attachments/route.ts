import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { commissionsDb } from "@/lib/db";
import { ensureInvoiceFilesTable } from "@/lib/invoiceAttachments";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// GET: Fetch file attachments for a specific invoice
export async function GET(request: NextRequest) {
  try {
    await ensureInvoiceFilesTable();
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");
    const invoiceNumber = searchParams.get("invoice_number");

    if (!invoiceId && !invoiceNumber) {
      return NextResponse.json(
        { error: "invoice_id or invoice_number is required" },
        { status: 400 }
      );
    }

    let query = "SELECT * FROM generated_invoice_files WHERE 1=1";
    const params: any[] = [];

    if (invoiceId) {
      query += " AND invoice_id = ?";
      params.push(invoiceId);
    } else if (invoiceNumber) {
      query += " AND invoice_number = ?";
      params.push(invoiceNumber);
    }

    query += " ORDER BY id DESC";

    const [attachments] = await commissionsDb.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      attachments,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoice attachments" },
      { status: 500 }
    );
  }
}

// POST: Upload file attachment to S3 (under commissions_hub/) & save DB record
export async function POST(request: NextRequest) {
  try {
    await ensureInvoiceFilesTable();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const invoiceId = formData.get("invoice_id") ? Number(formData.get("invoice_id")) : null;
    const invoiceNumber = (formData.get("invoice_number") as string) || "DRAFT";
    const categoryId = formData.get("category_id") ? Number(formData.get("category_id")) : null;
    const categoryCode = (formData.get("category_code") as string) || "GENERAL";
    const categoryName = (formData.get("category_name") as string) || "General Attachment";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!invoiceId && invoiceNumber === "DRAFT") {
      return NextResponse.json({ error: "Valid invoice_id or invoice_number is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const fileExt = originalName.split(".").pop() || "pdf";
    const cleanFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sanitizedInvoiceNum = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
    const sanitizedCatCode = categoryCode.replace(/[^a-zA-Z0-9_-]/g, "_");

    // S3 Key Path Structure: commissions_hub/invoices/{invoice_number}/{category_code}/{timestamp}_{filename}
    const s3Key = `commissions_hub/invoices/${sanitizedInvoiceNum}/${sanitizedCatCode}/${Date.now()}_${cleanFileName}`;

    const bucketName = process.env.AWS_S3_BUCKET_NAME || "filipinohomes123";
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    });

    await s3Client.send(command);

    const baseUrl = process.env.AWS_URL || `https://${bucketName}.s3.ap-southeast-1.amazonaws.com/`;
    const s3Url = baseUrl.endsWith("/") ? `${baseUrl}${s3Key}` : `${baseUrl}/${s3Key}`;

    const [result] = await commissionsDb.query<ResultSetHeader>(
      `INSERT INTO generated_invoice_files 
       (invoice_id, invoice_number, category_id, category_code, category_name, file_name, s3_key, s3_url, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        invoiceNumber,
        categoryId,
        categoryCode,
        categoryName,
        originalName,
        s3Key,
        s3Url,
        file.size,
        file.type || null,
      ]
    );

    const [created] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM generated_invoice_files WHERE id = ?",
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully to S3 under commissions_hub/",
      attachment: created[0],
    });
  } catch (error: any) {
    console.error("Invoice Attachment Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload file attachment", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete attachment from database & S3
export async function DELETE(request: NextRequest) {
  try {
    await ensureInvoiceFilesTable();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
    }

    const [existing] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM generated_invoice_files WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const record = existing[0];

    // Delete object from AWS S3
    try {
      const bucketName = process.env.AWS_S3_BUCKET_NAME || "filipinohomes123";
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: record.s3_key,
        })
      );
    } catch (s3Err) {
      console.warn("Could not delete file from S3:", s3Err);
    }

    // Delete record from database
    await commissionsDb.query("DELETE FROM generated_invoice_files WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Attachment removed successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
