export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyNonmove, getWorstBucket } from "@/lib/nonmoveConfig";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get("branchCode");
    const reportDateStr = searchParams.get("reportDate");

    if (!branchCode) {
      return NextResponse.json({ error: "branchCode is required" }, { status: 400 });
    }

    let targetDate: Date;
    if (reportDateStr) {
      targetDate = new Date(reportDateStr);
    } else {
      const latestRow = await prisma.nonMoveRow.findFirst({
        where: { branchCode },
        orderBy: { reportDate: "desc" },
        select: { reportDate: true },
      });
      targetDate = latestRow?.reportDate || new Date();
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const rows = await prisma.nonMoveRow.findMany({
      where: {
        branchCode,
        reportDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        product: true,
      },
    });

    const requests = await prisma.skuRequest.findMany({
      where: { branchCode },
    });
    const reqMap = new Map(requests.map((r) => [r.productCode, r]));

    const modelMap = new Map<string, any>();
    for (const r of rows) {
      const p = r.productCode;
      const reqInfo = reqMap.get(p);
      if (!modelMap.has(p)) {
        modelMap.set(p, {
          ProductCode: p,
          ProductName: r.product?.productName || p,
          Model: r.product?.model || "-",
          Category: r.categoryName || r.product?.category || "-",
          SubCategory: r.product?.subCategory || "-",
          StockQty: r.stockQty,
          StockValue: r.stockValue,
          Buckets: [r.nonmoveDaysBucket],
          AgingDays: r.agingDaysBucket,
          RequestStatus: reqInfo ? `${reqInfo.status} (${reqInfo.requestType})` : "NO_REQUEST",
          ReviewComment: reqInfo?.reviewComment || "",
        });
      } else {
        const item = modelMap.get(p);
        item.StockQty += r.stockQty;
        item.StockValue += r.stockValue;
        item.Buckets.push(r.nonmoveDaysBucket);
      }
    }

    const exportRows = Array.from(modelMap.values()).map((m) => {
      const worstBucket = getWorstBucket(m.Buckets);
      return {
        "Product Code": `="${m.ProductCode}"`,
        "Product Name": `"${(m.ProductName || "").replace(/"/g, '""')}"`,
        "Model": `"${(m.Model || "").replace(/"/g, '""')}"`,
        "Category": `"${(m.Category || "").replace(/"/g, '""')}"`,
        "Sub Category": `"${(m.SubCategory || "").replace(/"/g, '""')}"`,
        "Nonmove Bucket": worstBucket,
        "Aging Bucket": m.AgingDays,
        "Classification": classifyNonmove(worstBucket),
        "Stock Qty": m.StockQty,
        "Stock Value (THB)": m.StockValue,
        "Request Status": m.RequestStatus,
        "Review Comment": `"${(m.ReviewComment || "").replace(/"/g, '""')}"`,
      };
    });

    const headers = Object.keys(exportRows[0] || {});
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...exportRows.map((row) => headers.map((h) => (row as any)[h]).join(",")),
    ].join("\n");

    const dateStr = targetDate.toISOString().split("T")[0];
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="NonMove_${branchCode}_${dateStr}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/nonmove/export:", error);
    return NextResponse.json({ error: error.message || "Failed to export data" }, { status: 500 });
  }
}
