import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

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

    // Define Columns
    worksheet.columns = [
      { header: "ลำดับ", key: "index", width: 8 },
      { header: "รหัสสาขา", key: "branchCode", width: 14 },
      { header: "ชื่อสาขา", key: "storeName", width: 28 },
      { header: "ภูมิภาค", key: "region", width: 14 },
      { header: "รหัสสินค้า", key: "productCode", width: 18 },
      { header: "ชื่อสินค้า", key: "productName", width: 35 },
      { header: "รุ่น (Model)", key: "model", width: 20 },
      { header: "หมวดหมู่", key: "category", width: 16 },
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
      { header: "รูปภาพหลักฐาน (Thumbnail)", key: "imageCell", width: 22 },
      { header: "ลิงก์รูปภาพ (Photo URLs)", key: "photoUrls", width: 45 },
    ];

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
      for (const p of r.photos) {
        if (p.url.startsWith("http://") || p.url.startsWith("https://")) {
          photoLinks.push(p.url);
        } else {
          photoLinks.push(`${baseUrl}/api/requests/photos/${p.id}`);
        }
      }

      const row = worksheet.addRow({
        index: i + 1,
        branchCode: r.branchCode,
        storeName: r.store?.storeNameCust || r.store?.storeName || r.branchCode,
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
        imageCell: r.photos.length > 0 ? "" : "ไม่มีรูปภาพ",
        photoUrls: photoLinks.length > 0 ? photoLinks.join(" \n") : "-",
      });

      row.height = r.photos.length > 0 ? 80 : 24;
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

      // If photo links exist, make the cell a hyperlink
      if (photoLinks.length > 0) {
        const photoCell = row.getCell("photoUrls");
        photoCell.value = {
          text: photoLinks.length === 1 ? photoLinks[0] : `${photoLinks.length} รูป: ${photoLinks.join(" ; ")}`,
          hyperlink: photoLinks[0],
        };
        photoCell.font = { color: { argb: "FF2563EB" }, underline: true, size: 10 };
      }

      // Embed thumbnail image into Excel cell
      if (r.photos.length > 0) {
        const firstPhoto = r.photos[0].url;
        let imageBase64: string | null = null;
        let extension: "png" | "jpeg" = "jpeg";

        try {
          // 1. Data URL (Base64)
          if (firstPhoto.startsWith("data:image/")) {
            const match = firstPhoto.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (match) {
              extension = match[1].toLowerCase() === "png" ? "png" : "jpeg";
              imageBase64 = match[2];
            }
          }
          // 2. Local uploads folder
          else if (firstPhoto.startsWith("/uploads/")) {
            const localPath = path.join(process.cwd(), "public", firstPhoto);
            if (fs.existsSync(localPath)) {
              const fileBuf = fs.readFileSync(localPath);
              extension = firstPhoto.toLowerCase().endsWith(".png") ? "png" : "jpeg";
              imageBase64 = fileBuf.toString("base64");
            }
          }
          // 3. HTTP URL
          else if (firstPhoto.startsWith("http://") || firstPhoto.startsWith("https://")) {
            const resp = await fetch(firstPhoto);
            if (resp.ok) {
              const arrayBuf = await resp.arrayBuffer();
              extension = firstPhoto.toLowerCase().endsWith(".png") ? "png" : "jpeg";
              imageBase64 = Buffer.from(arrayBuf).toString("base64");
            }
          }

          if (imageBase64) {
            const imageId = workbook.addImage({
              base64: imageBase64,
              extension,
            });

            // Column 18 is imageCell (index 18 is zero-based 18)
            worksheet.addImage(imageId, {
              tl: { col: 18, row: rowIndex - 1 },
              ext: { width: 92, height: 70 }, // Crisp compressed thumbnail
              editAs: "oneCell",
            });
          }
        } catch (imgErr) {
          console.warn("Could not embed image for row", rowIndex, imgErr);
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="NonMove_Requests_With_Pictures_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting requests with images to excel:", error);
    return NextResponse.json({ error: error.message || "Failed to export requests" }, { status: 500 });
  }
}
