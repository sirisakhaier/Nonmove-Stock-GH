import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    // PNG
    if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width > 0 && height > 0) return { width, height };
    }
    // GIF
    if (buffer.length > 10 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      if (width > 0 && height > 0) return { width, height };
    }
    // JPEG
    if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          if (width > 0 && height > 0) return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";

    // Determine base URL from request headers
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    const where: any = {};
    if (status !== "ALL") {
      where.status = status;
    }

    const requests = await prisma.skuRequest.findMany({
      where,
      include: {
        store: true,
        product: true,
        photos: true,
        requestedBy: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sell out team, Haier (Thailand)";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("รายการคำขอ (Requests)", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // Find maximum number of photos in any request
    let maxPhotos = 3;
    for (const r of requests) {
      if (r.photos.length > maxPhotos) {
        maxPhotos = r.photos.length;
      }
    }
    maxPhotos = Math.min(Math.max(maxPhotos, 3), 8);

    // Define Base Columns with STORE_ID and STORE_NAME
    const baseColumns: any[] = [
      { header: "ลำดับ", key: "index", width: 8 },
      { header: "STORE_ID", key: "storeId", width: 14 },
      { header: "STORE_NAME", key: "storeName", width: 30 },
      { header: "รหัสสาขา (BranchCode)", key: "branchCode", width: 16 },
      { header: "ชื่อสาขา (Internal)", key: "storeNameInternal", width: 24 },
      { header: "จังหวัด (Province)", key: "province", width: 16 },
      { header: "ภูมิภาค (Region)", key: "region", width: 14 },
      { header: "รหัสสินค้า (ProductCode)", key: "productCode", width: 18 },
      { header: "ชื่อสินค้า (ProductName)", key: "productName", width: 35 },
      { header: "รุ่น (Model)", key: "model", width: 20 },
      { header: "หมวดหมู่ (Category)", key: "category", width: 16 },
      { header: "ประเภทคำขอ", key: "requestType", width: 18 },
      { header: "เหตุผลที่ระบุ", key: "reason", width: 30 },
      { header: "คำอธิบายเพิ่มเติม/รายละเอียด", key: "comments", width: 35 },
      { header: "ผู้ยื่นคำขอ", key: "requestedByName", width: 20 },
      { header: "เบอร์โทรศัพท์", key: "phone", width: 16 },
      { header: "วันที่ยื่นคำขอ", key: "requestedAt", width: 22 },
      { header: "สถานะ", key: "status", width: 24 },
      { header: "ผู้อนุมัติ/ตรวจสอบ", key: "reviewedByName", width: 20 },
      { header: "ข้อคิดเห็นผู้อนุมัติ", key: "reviewComment", width: 30 },
      { header: "วันที่พิจารณา", key: "reviewedAt", width: 22 },
      { header: "จำนวนรูป", key: "photoCount", width: 12 },
    ];

    // Add Photo Thumbnail Columns (Photo 1, Photo 2, ...) with spacious width (25 ≈ 185px)
    for (let p = 1; p <= maxPhotos; p++) {
      baseColumns.push({
        header: `รูปภาพหลักฐาน ${p} (Photo ${p})`,
        key: `photoImg_${p}`,
        width: 25,
      });
    }

    // Add Photo URLs Column
    baseColumns.push({
      header: "ลิงก์รูปภาพทั้งหมด (Photo URLs)",
      key: "photoUrls",
      width: 45,
    });

    worksheet.columns = baseColumns;

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Arial" };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" }, // Indigo
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    const photoStartColIdx = 22; // 0-based column index where photoImg_1 starts

    // Populate rows
    for (let i = 0; i < requests.length; i++) {
      const r = requests[i];
      const rowIndex = i + 2; // 1-based index (header is row 1)

      const typeLabel = r.requestType === "EXCLUDE" ? "ขอยกเว้น (Exclusion)" : "ชี้แจง (Explain)";
      let statusLabel = r.status as string;
      if (r.status === "PENDING") statusLabel = "รอการตรวจสอบ (PENDING)";
      else if (r.status === "APPROVED") statusLabel = "อนุมัติแล้ว (APPROVED)";
      else if (r.status === "REJECTED") statusLabel = "ไม่อนุมัติ (REJECTED)";
      else if (r.status === "REVISE") statusLabel = "ขอข้อมูลเพิ่มเติม (REVISE)";

      // Generate Permanent URLs for each photo
      const photoLinks: string[] = [];
      for (let pIdx = 0; pIdx < r.photos.length; pIdx++) {
        const p = r.photos[pIdx];
        if (p.url.startsWith("http://") || p.url.startsWith("https://")) {
          photoLinks.push(p.url);
        } else {
          photoLinks.push(`${baseUrl}/api/requests/photos/${p.id}`);
        }
      }

      const rowData: any = {
        index: i + 1,
        storeId: r.store?.storeId || r.branchCode,
        storeName: r.store?.storeNameCust || r.store?.storeName || r.branchCode,
        branchCode: r.branchCode,
        storeNameInternal: r.store?.storeName || "-",
        province: r.store?.province || "-",
        region: r.store?.region || "OTHER",
        productCode: r.productCode,
        productName: r.product?.productName || "-",
        model: r.product?.model || "-",
        category: r.product?.category || "-",
        requestType: typeLabel,
        reason: r.reason,
        comments: r.comments || "-",
        requestedByName: r.requestedBy?.name || "-",
        phone: r.requestedBy?.phone || "-",
        requestedAt: new Date(r.requestedAt).toLocaleString("th-TH"),
        status: statusLabel,
        reviewedByName: r.reviewedByName || "-",
        reviewComment: r.reviewComment || "-",
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toLocaleString("th-TH") : "-",
        photoCount: r.photos.length > 0 ? `${r.photos.length} รูป` : "ไม่มีรูป",
        photoUrls: photoLinks.length > 0 ? photoLinks.join(" \n") : "-",
      };

      for (let p = 1; p <= maxPhotos; p++) {
        rowData[`photoImg_${p}`] = p <= r.photos.length ? "" : "-";
      }

      const row = worksheet.addRow(rowData);

      // Set spacious row height (95pt ≈ 126px) so photos display clearly without crowding
      row.height = r.photos.length > 0 ? 95 : 24;
      row.alignment = { vertical: "middle", wrapText: true };

      // Status cell coloring
      const statusCell = row.getCell("status");
      if (r.status === "APPROVED") {
        statusCell.font = { color: { argb: "FF16A34A" }, bold: true };
      } else if (r.status === "REJECTED") {
        statusCell.font = { color: { argb: "FFDC2626" }, bold: true };
      } else if (r.status === "REVISE") {
        statusCell.font = { color: { argb: "FFD97706" }, bold: true };
      }

      // If photo links exist, make the cell a clickable hyperlink
      if (photoLinks.length > 0) {
        const photoCell = row.getCell("photoUrls");
        photoCell.value = {
          text: photoLinks.length === 1 ? photoLinks[0] : `${photoLinks.length} รูป: ${photoLinks.join(" ; ")}`,
          hyperlink: photoLinks[0],
        };
        photoCell.font = { color: { argb: "FF2563EB" }, underline: true, size: 10 };
      }

      // Embed photo thumbnails preserving 100% natural aspect ratio
      for (let pIdx = 0; pIdx < r.photos.length && pIdx < maxPhotos; pIdx++) {
        const photo = r.photos[pIdx];
        if (!photo?.url) continue;

        let imageId: number | null = null;
        let imageBuffer: Buffer | null = null;
        let validExt: "jpeg" | "png" | "gif" = "jpeg";

        try {
          if (photo.url.startsWith("data:image/")) {
            // Case 1: Base64 Data URL
            const match = photo.url.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (match) {
              const rawExt = match[1].toLowerCase();
              validExt = rawExt.includes("png") ? "png" : rawExt.includes("gif") ? "gif" : "jpeg";
              const base64Content = match[2];
              imageBuffer = Buffer.from(base64Content, "base64");
              imageId = workbook.addImage({
                buffer: imageBuffer as any,
                extension: validExt,
              } as any);
            }
          } else if (photo.url.startsWith("http://") || photo.url.startsWith("https://")) {
            // Case 2: Remote URL
            const fetchRes = await fetch(photo.url);
            if (fetchRes.ok) {
              const arrayBuffer = await fetchRes.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
              validExt = photo.url.toLowerCase().includes(".png") ? "png" : "jpeg";
              imageId = workbook.addImage({
                buffer: imageBuffer as any,
                extension: validExt,
              } as any);
            }
          } else {
            // Case 3: Local file path
            const cleanRelPath = photo.url.startsWith("/") ? photo.url.slice(1) : photo.url;
            const localFilePath = path.join(process.cwd(), "public", cleanRelPath);

            if (fs.existsSync(localFilePath)) {
              const ext = path.extname(localFilePath).toLowerCase().replace(".", "");
              validExt = ext === "png" || ext === "gif" ? ext : "jpeg";
              imageBuffer = fs.readFileSync(localFilePath);
              imageId = workbook.addImage({
                buffer: imageBuffer as any,
                extension: validExt,
              } as any);
            }
          }

          if (imageId !== null && imageBuffer) {
            // Calculate proportional dimensions preserving original aspect ratio
            const dims = getImageDimensions(imageBuffer);
            const maxBoxWidth = 160;  // max pixel width in cell
            const maxBoxHeight = 115; // max pixel height in cell

            let targetWidth = 120;
            let targetHeight = 90;

            if (dims && dims.width > 0 && dims.height > 0) {
              const imgAspect = dims.width / dims.height;
              const boxAspect = maxBoxWidth / maxBoxHeight;

              if (imgAspect > boxAspect) {
                // Image is wider than bounding box
                targetWidth = maxBoxWidth;
                targetHeight = Math.round(maxBoxWidth / imgAspect);
              } else {
                // Image is taller than bounding box
                targetHeight = maxBoxHeight;
                targetWidth = Math.round(maxBoxHeight * imgAspect);
              }
            }

            const colIdx = photoStartColIdx + pIdx;
            worksheet.addImage(imageId, {
              tl: { col: colIdx + 0.05, row: rowIndex - 1 + 0.05 } as any,
              ext: { width: targetWidth, height: targetHeight },
              editAs: "oneCell",
            } as any);
          }
        } catch (imgErr) {
          console.error(`Error embedding photo ${pIdx + 1} for request ${r.id}:`, imgErr);
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="nonmove_requests_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating requests Excel:", error);
    return NextResponse.json({ error: error.message || "Failed to export requests" }, { status: 500 });
  }
}
