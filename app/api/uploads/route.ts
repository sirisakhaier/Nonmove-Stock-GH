import { NextRequest, NextResponse } from "next/server";
import { uploadPhoto } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawFiles = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ].filter(Boolean) as File[];

    if (!rawFiles || rawFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of rawFiles) {
      if (typeof file === "object" && file.arrayBuffer) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const contentType = file.type || "image/jpeg";
        const url = await uploadPhoto(buffer, file.name || "photo.jpg", contentType);
        uploadedUrls.push(url);
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0] || "",
      urls: uploadedUrls,
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
