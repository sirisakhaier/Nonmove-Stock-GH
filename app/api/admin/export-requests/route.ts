import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

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

    const exportRows = requests.map((r, index) => {
      const typeLabel = r.requestType === "EXCLUDE" ? "ขอยกเว้น (Exclusion)" : "ชี้แจง (Explain)";
      let statusLabel = r.status as string;
      if (r.status === "PENDING") statusLabel = "รอการตรวจสอบ (PENDING)";
      else if (r.status === "APPROVED") statusLabel = "อนุมัติแล้ว (APPROVED)";
      else if (r.status === "REJECTED") statusLabel = "ไม่อนุมัติ (REJECTED)";

      const photoLinks = r.photos.map((p) => p.url).join(" | ");

      return {
        "ลำดับ": index + 1,
        "รหัสสาขา": r.branchCode,
        "ชื่อสาขา": r.store?.storeNameCust || r.store?.storeName || r.branchCode,
        "ภูมิภาค": r.store?.region || "OTHER",
        "รหัสสินค้า": r.productCode,
        "ชื่อสินค้า": r.product?.productName || "-",
        "รุ่น (Model)": r.product?.model || "-",
        "หมวดหมู่": r.product?.category || "-",
        "ประเภทคำขอ": typeLabel,
        "เหตุผล": r.reason,
        "ผู้ยื่นคำขอ": r.requestedBy?.name || "-",
        "เบอร์โทรศัพท์": r.requestedBy?.phone || "-",
        "วันที่ยื่นคำขอ": new Date(r.requestedAt).toLocaleString("th-TH"),
        "สถานะ": statusLabel,
        "ผู้อนุมัติ/ตรวจสอบ": r.reviewedByName || "-",
        "ความคิดเห็นผู้อนุมัติ": r.reviewComment || "-",
        "วันที่พิจารณา": r.reviewedAt ? new Date(r.reviewedAt).toLocaleString("th-TH") : "-",
        "จำนวนรูปภาพหลักฐาน": r.photos.length,
        "ลิงก์รูปภาพหลักฐาน (Photo URLs)": photoLinks || "-",
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(exportRows);

    if (exportRows.length > 0) {
      const colWidths = Object.keys(exportRows[0]).map((key) => {
        let maxLen = key.length;
        exportRows.forEach((row: any) => {
          const val = String((row as any)[key] || "");
          if (val.length > maxLen) maxLen = Math.min(val.length, 60);
        });
        return { wch: Math.max(maxLen + 4, 14) };
      });
      worksheet["!cols"] = colWidths;
    }

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Requests_Report");

    const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new Response(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="NonMove_Requests_Export_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting requests to excel:", error);
    return NextResponse.json({ error: error.message || "Failed to export requests" }, { status: 500 });
  }
}
