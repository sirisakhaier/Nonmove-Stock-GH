import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { branchCode: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sell out team, Haier (Thailand)";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Store Dimension", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    worksheet.columns = [
      { header: "BranchCode", key: "branchCode", width: 16 },
      { header: "STORE_NAME_CUST", key: "storeNameCust", width: 35 },
      { header: "STORE_ID", key: "storeId", width: 16 },
      { header: "STORE_NAME", key: "storeName", width: 35 },
      { header: "PROVINCE", key: "province", width: 20 },
      { header: "STORE_TYPE", key: "storeType", width: 16 },
      { header: "REGION", key: "region", width: 16 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Arial" };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    for (const s of stores) {
      worksheet.addRow({
        branchCode: s.branchCode,
        storeNameCust: s.storeNameCust,
        storeId: s.storeId || "",
        storeName: s.storeName || "",
        province: s.province || "",
        storeType: s.storeType || "STORE",
        region: s.region,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Dimension_Store_Current_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting current stores:", error);
    return NextResponse.json({ error: error.message || "Failed to export stores" }, { status: 500 });
  }
}
