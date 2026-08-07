import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileCategoryCode = (formData.get("file_category_code") as string) || "GENERAL";
    const subfolder = (formData.get("folder") as string) || "expenses";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);

    // Save strictly under commissions_hub/ folder in S3 bucket
    // Path format: commissions_hub/expenses/{FILE_CATEGORY}/{timestamp}_{random}_{filename}
    const s3Key = `commissions_hub/${subfolder}/${fileCategoryCode}/${timestamp}_${randomStr}_${cleanFileName}`;

    const bucketName = process.env.AWS_S3_BUCKET_NAME || "filipinohomes123";
    const awsUrl = process.env.AWS_URL || `https://${bucketName}.s3.${process.env.AWS_REGION || "ap-southeast-1"}.amazonaws.com/`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    });

    await s3Client.send(command);

    const baseUrlClean = awsUrl.endsWith("/") ? awsUrl : `${awsUrl}/`;
    const s3FileUrl = `${baseUrlClean}${s3Key}`;

    return NextResponse.json({
      success: true,
      url: s3FileUrl,
      s3_key: s3Key,
      original_filename: file.name,
      file_size: file.size,
      mime_type: file.type,
    });
  } catch (error: any) {
    console.error("S3 Expenses Attachment Upload Error:", error);
    return NextResponse.json({ error: "S3 upload failed", details: error.message }, { status: 500 });
  }
}
