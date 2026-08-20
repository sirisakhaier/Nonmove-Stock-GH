import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sell out team, Haier (Thailand)";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Store Dimension", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // Define Headers
    worksheet.columns = [
      { header: "BranchCode", key: "branchCode", width: 16 },
      { header: "STORE_NAME_CUST", key: "storeNameCust", width: 35 },
      { header: "STORE_ID", key: "storeId", width: 16 },
      { header: "STORE_NAME", key: "storeName", width: 35 },
      { header: "PROVINCE", key: "province", width: 20 },
      { header: "STORE_TYPE", key: "storeType", width: 16 },
      { header: "REGION", key: "region", width: 16 },
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

    // Sample Rows
    worksheet.addRow({
      branchCode: "GH-114",
      storeNameCust: "ไทวัสดุ สาขาบางนา",
      storeId: "S00114",
      storeName: "ไทวัสดุ บางนา",
      province: "สมุทรปราการ",
      storeType: "STORE",
      region: "BMR",
    });

    worksheet.addRow({
      branchCode: "GH-115",
      storeNameCust: "โฮมโปร สาขาเชียงใหม่",
      storeId: "S00115",
      storeName: "โฮมโปร เชียงใหม่",
      province: "เชียงใหม่",
      storeType: "STORE",
      region: "NORTH",
    });

    worksheet.addRow({
      branchCode: "GH-116",
      storeNameCust: "เมกาโฮม สาขาขอนแก่น",
      storeId: "S00116",
      storeName: "เมกาโฮม ขอนแก่น",
      province: "ขอนแก่น",
      storeType: "STORE",
      region: "NORTHEAST",
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Dimension_Store_Template.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating store template:", error);
    return NextResponse.json({ error: error.message || "Failed to generate template" }, { status: 500 });
  }
}
