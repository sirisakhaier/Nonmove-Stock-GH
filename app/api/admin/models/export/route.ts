import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { productCode: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sell out team, Haier (Thailand)";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Model Dimension", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    worksheet.columns = [
      { header: "ProductCode", key: "productCode", width: 20 },
      { header: "ProductName", key: "productName", width: 35 },
      { header: "MODEL", key: "model", width: 22 },
      { header: "SKU_TYPE", key: "skuType", width: 16 },
      { header: "CATEGORY", key: "category", width: 18 },
      { header: "SUB_CATEGORY", key: "subCategory", width: 20 },
      { header: "SIZE_GROUP", key: "sizeGroup", width: 16 },
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

    for (const p of products) {
      worksheet.addRow({
        productCode: p.productCode,
        productName: p.productName,
        model: p.model || "",
        skuType: p.skuType || "SELLABLE",
        category: p.category || "",
        subCategory: p.subCategory || "",
        sizeGroup: p.sizeGroup || "",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Dimension_Model_Current_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting models:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export models" },
      { status: 500 }
    );
  }
}
