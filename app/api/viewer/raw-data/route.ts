import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const regionParam = searchParams.get("region") || "ALL";
    const branchCodeParam = searchParams.get("branchCode") || "ALL";
    const categoryParam = searchParams.get("category") || "ALL";
    const skuTypeParam = searchParams.get("skuType") || "ALL";
    const searchParam = searchParams.get("search") || "";
    const format = searchParams.get("format"); // "csv" | "xlsx" | null

    // 1. Fetch available dates
    const dateRecords = await prisma.nonMoveRow.findMany({
      select: { reportDate: true },
      distinct: ["reportDate"],
      orderBy: { reportDate: "desc" },
    });

    if (dateRecords.length === 0) {
      return NextResponse.json({
        availableDates: [],
        selectedDate: null,
        totalRows: 0,
        rows: [],
      });
    }

    const availableDates = dateRecords.map((d) => d.reportDate.toISOString().split("T")[0]);
    const targetDateStr = dateParam && availableDates.includes(dateParam) ? dateParam : availableDates[0];
    const targetDate = new Date(targetDateStr);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Fetch stores lookup with all dimension attributes
    const storeWhere: any = {
      storeType: { not: "DC" },
      branchCode: { notIn: ["GH-001", "GH-002", "GH-003"] },
    };
    if (regionParam !== "ALL") {
      storeWhere.region = regionParam;
    }
    if (branchCodeParam !== "ALL") {
      storeWhere.branchCode = branchCodeParam;
    }

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: {
        branchCode: true,
        storeId: true,
        storeNameCust: true,
        storeName: true,
        province: true,
        region: true,
        storeType: true,
      },
    });

    const storeMap = new Map<string, typeof stores[0]>();
    for (const s of stores) {
      storeMap.set(s.branchCode, s);
    }
    const storeCodes = Array.from(storeMap.keys());

    // 3. Fetch NonMove Rows
    const rowWhere: any = {
      branchCode: { in: storeCodes },
      reportDate: { gte: startOfDay, lte: endOfDay },
    };

    if (categoryParam !== "ALL") {
      rowWhere.OR = [
        { categoryName: categoryParam },
        { product: { category: categoryParam } },
      ];
    }

    const rows = await prisma.nonMoveRow.findMany({
      where: rowWhere,
      include: {
        product: true,
      },
      orderBy: [
        { branchCode: "asc" },
        { stockValue: "desc" },
      ],
    });

    // 4. Map and join full dimension attributes
    let resultRows = rows.map((r, idx) => {
      const s = storeMap.get(r.branchCode);
      const storeId = s?.storeId || s?.branchCode || r.branchCode;
      const storeNameCust = s?.storeNameCust || s?.storeName || r.branchName || r.branchCode;
      const storeName = s?.storeName || s?.storeNameCust || "-";
      const province = s?.province || "-";
      const region = s?.region || "OTHER";
      const storeType = s?.storeType || "STORE";

      const model = r.product?.model || r.designName || "-";
      const productName = r.product?.productName || r.productCode;
      const skuType = r.product?.skuType || "SELLABLE";
      const category = r.product?.category || r.categoryName || "Other";
      const subCategory = r.product?.subCategory || r.typeName || "-";
      const sizeGroup = r.product?.sizeGroup || "-";

      return {
        id: r.id,
        index: idx + 1,
        reportDate: targetDateStr,
        storeId,
        branchCode: r.branchCode,
        storeName: storeNameCust,
        storeNameInternal: storeName,
        province,
        region,
        storeType,
        productCode: r.productCode,
        model,
        productName,
        skuType,
        category,
        subCategory,
        sizeGroup,
        nonmoveDaysBucket: r.nonmoveDaysBucket || "30-60",
        agingDaysBucket: r.agingDaysBucket || "0-180",
        stockQty: r.stockQty,
        stockValue: Math.round(r.stockValue),
      };
    });

    // Apply SKU_TYPE filter if requested
    if (skuTypeParam !== "ALL") {
      resultRows = resultRows.filter((r) => r.skuType.toLowerCase() === skuTypeParam.toLowerCase());
    }

    // Apply Search filter if provided
    if (searchParam.trim()) {
      const q = searchParam.toLowerCase().trim();
      resultRows = resultRows.filter(
        (r) =>
          r.storeId.toLowerCase().includes(q) ||
          r.branchCode.toLowerCase().includes(q) ||
          r.storeName.toLowerCase().includes(q) ||
          r.province.toLowerCase().includes(q) ||
          r.region.toLowerCase().includes(q) ||
          r.storeType.toLowerCase().includes(q) ||
          r.productCode.toLowerCase().includes(q) ||
          r.model.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    // 5. Handle Export Formats
    if (format === "csv") {
      const headers = [
        "No",
        "ReportDate",
        "STORE_ID",
        "BranchCode",
        "StoreName",
        "Province",
        "Region",
        "StoreType",
        "ProductCode",
        "Model",
        "ProductName",
        "SKU_TYPE",
        "Category",
        "SubCategory",
        "SizeGroup",
        "NonmoveDaysBucket",
        "AgingDaysBucket",
        "StockQty",
        "StockValueTHB",
      ];

      const csvRows = resultRows.map((r, i) => [
        i + 1,
        r.reportDate,
        `="${r.storeId}"`,
        `="${r.branchCode}"`,
        `"${(r.storeName || "").replace(/"/g, '""')}"`,
        `"${r.province}"`,
        `"${r.region}"`,
        `"${r.storeType}"`,
        `="${r.productCode}"`,
        `"${(r.model || "").replace(/"/g, '""')}"`,
        `"${(r.productName || "").replace(/"/g, '""')}"`,
        `"${r.skuType}"`,
        `"${r.category}"`,
        `"${r.subCategory}"`,
        `"${r.sizeGroup}"`,
        `"${r.nonmoveDaysBucket} วัน"`,
        `"${r.agingDaysBucket} วัน"`,
        r.stockQty,
        r.stockValue,
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="NonMove_RAW_Data_${targetDateStr}.csv"`,
        },
      });
    }

    if (format === "xlsx") {
      const exportData = resultRows.map((r, i) => ({
        "ลำดับ": i + 1,
        "วันที่รายงาน": r.reportDate,
        "STORE_ID": r.storeId,
        "รหัสสาขา (BranchCode)": r.branchCode,
        "ชื่อสาขา (Store Name)": r.storeName,
        "จังหวัด (Province)": r.province,
        "ภาค (Region)": r.region,
        "ประเภทสาขา (Store Type)": r.storeType,
        "รหัสสินค้า (ProductCode)": r.productCode,
        "รุ่นสินค้า (Model)": r.model,
        "ชื่อสินค้า (ProductName)": r.productName,
        "ประเภทสินค้า (SKU_TYPE)": r.skuType,
        "หมวดหมู่ (Category)": r.category,
        "กลุ่มสินค้า (SubCategory)": r.subCategory,
        "กลุ่มขนาด (SizeGroup)": r.sizeGroup,
        "ช่วงวันไม่เคลื่อนไหว": `${r.nonmoveDaysBucket} วัน`,
        "ช่วงอายุสินค้า (Aging)": `${r.agingDaysBucket} วัน`,
        "จำนวนชิ้น (StockQty)": r.stockQty,
        "มูลค่าสต๊อก (บาท)": r.stockValue,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "RAW_Data");
      const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="NonMove_RAW_Data_${targetDateStr}.xlsx"`,
        },
      });
    }

    // 6. JSON Response for preview
    const totalStockQty = resultRows.reduce((sum, r) => sum + r.stockQty, 0);
    const totalStockValue = resultRows.reduce((sum, r) => sum + r.stockValue, 0);
    const uniqueStores = new Set(resultRows.map((r) => r.branchCode)).size;
    const uniqueModels = new Set(resultRows.map((r) => r.productCode)).size;

    return NextResponse.json({
      availableDates,
      selectedDate: targetDateStr,
      totalRows: resultRows.length,
      summary: {
        totalStockQty,
        totalStockValue,
        uniqueStores,
        uniqueModels,
      },
      previewRows: resultRows.slice(0, 100),
    });
  } catch (error: any) {
    console.error("Error in /api/viewer/raw-data:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch raw data" }, { status: 500 });
  }
}
