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
    workbook.creator = "Non-Move Stock App";
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
      { header: "ผู้ยื่นคำขอ", key: "requestedByName", width: 20 },
      { header: "เบอร์โทรศัพท์", key: "phone", width: 16 },
      { header: "วันที่ยื่นคำขอ", key: "requestedAt", width: 22 },
      { header: "สถานะ", key: "status", width: 22 },
      { header: "ผู้อนุมัติ/ตรวจสอบ", key: "reviewedByName", width: 20 },
      { header: "ความคิดเห็นผู้อนุมัติ", key: "reviewComment", width: 30 },
      { header: "วันที่พิจารณา", key: "reviewedAt", width: 22 },
      { header: "รูปภาพหลักฐาน (Embedded Image)", key: "imageCell", width: 22 },
      { header: "ลิงก์รูปภาพทั้งหมด (Photo URLs)", key: "photoUrls", width: 40 },
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

      const photoLinks = r.photos.map((p) => p.url).join(" | ");

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
        requestedByName: r.requestedBy?.name || "-",
        phone: r.requestedBy?.phone || "-",
        requestedAt: new Date(r.requestedAt).toLocaleString("th-TH"),
        status: statusLabel,
        reviewedByName: r.reviewedByName || "-",
        reviewComment: r.reviewComment || "-",
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toLocaleString("th-TH") : "-",
        imageCell: r.photos.length > 0 ? "" : "ไม่มีรูปภาพ",
        photoUrls: photoLinks || "-",
      });

      row.height = r.photos.length > 0 ? 80 : 24;
      row.alignment = { vertical: "middle" };

      // Status cell coloring
      const statusCell = row.getCell("status");
      if (r.status === "APPROVED") {
        statusCell.font = { color: { argb: "FF16A34A" }, bold: true };
      } else if (r.status === "REJECTED") {
        statusCell.font = { color: { argb: "FFDC2626" }, bold: true };
      } else if (r.status === "REVISE") {
        statusCell.font = { color: { argb: "FFD97706" }, bold: true };
      }

      // Try embedding first photo image into Excel
      if (r.photos.length > 0) {
        const firstPhoto = r.photos[0].url;
        let imageBuffer: Buffer | null = null;
        let extension: "png" | "jpeg" = firstPhoto.toLowerCase().endsWith(".png") ? "png" : "jpeg";

        try {
          if (firstPhoto.startsWith("/uploads/")) {
            const localPath = path.join(process.cwd(), "public", firstPhoto);
            if (fs.existsSync(localPath)) {
              imageBuffer = fs.readFileSync(localPath);
            }
          } else if (firstPhoto.startsWith("http://") || firstPhoto.startsWith("https://")) {
            const resp = await fetch(firstPhoto);
            if (resp.ok) {
              const arrayBuf = await resp.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuf);
            }
          }

          if (imageBuffer) {
            const imageId = workbook.addImage({
              base64: imageBuffer.toString("base64"),
              extension,
            });

            worksheet.addImage(imageId, {
              tl: { col: 17, row: rowIndex - 1 },
              ext: { width: 95, height: 72 },
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
