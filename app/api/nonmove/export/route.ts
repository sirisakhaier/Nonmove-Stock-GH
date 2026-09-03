export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyNonmove, getWorstBucket, mapTo4Buckets } from "@/lib/nonmoveConfig";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get("branchCode");
    const reportDateStr = searchParams.get("date") || searchParams.get("reportDate");
    const category = searchParams.get("category");
    const bucket = searchParams.get("bucket");
    const skuType = searchParams.get("skuType");

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

    // Multi-filters
    let allowedCats: Set<string> | null = null;
    if (category && category !== "ALL") {
      allowedCats = new Set(category.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
    }

    let allowedTypes: Set<string> | null = null;
    if (skuType && skuType !== "ALL") {
      allowedTypes = new Set(skuType.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
    }

    let allowedBuckets: Set<string> | null = null;
    if (bucket && bucket !== "ALL") {
      allowedBuckets = new Set(bucket.split(",").map((s) => mapTo4Buckets(s.trim())).filter(Boolean));
    }

    const modelMap = new Map<string, any>();
    for (const r of rows) {
      const p = r.productCode;
      const cat = r.product?.category?.trim().toUpperCase() || r.categoryName?.trim().toUpperCase() || "OTHER";
      const sType = r.product?.skuType?.trim().toUpperCase() || "SELLABLE";

      if (allowedCats && !allowedCats.has(cat)) continue;
      if (allowedTypes && !allowedTypes.has(sType)) continue;

      const reqInfo = reqMap.get(p);
      const mappedB = mapTo4Buckets(r.nonmoveDaysBucket);

      if (!modelMap.has(p)) {
        modelMap.set(p, {
          ProductCode: p,
          ProductName: r.product?.productName || p,
          Model: r.product?.model || "-",
          Category: cat,
          SubCategory: r.product?.subCategory || "-",
          SkuType: sType,
          StockQty: r.stockQty,
          StockValue: r.stockValue,
          Buckets: [mappedB],
          AgingDays: r.agingDaysBucket,
          RequestStatus: reqInfo ? `${reqInfo.status} (${reqInfo.requestType})` : "NO_REQUEST",
          ReviewComment: reqInfo?.reviewComment || "",
        });
      } else {
        const item = modelMap.get(p);
        item.StockQty += r.stockQty;
        item.StockValue += r.stockValue;
        item.Buckets.push(mappedB);
      }
    }

    let exportModels = Array.from(modelMap.values());
    if (allowedBuckets) {
      exportModels = exportModels.filter((m) => {
        const worst = getWorstBucket(m.Buckets);
        return allowedBuckets!.has(worst);
      });
    }

    const exportRows = exportModels.map((m) => {
      const worstBucket = getWorstBucket(m.Buckets);
      return {
        "Product Code": `="${m.ProductCode}"`,
        "Product Name": `"${(m.ProductName || "").replace(/"/g, '""')}"`,
        "Model": `"${(m.Model || "").replace(/"/g, '""')}"`,
        "Category": `"${(m.Category || "").replace(/"/g, '""')}"`,
        "Sub Category": `"${(m.SubCategory || "").replace(/"/g, '""')}"`,
        "Sku Type": `"${(m.SkuType || "").replace(/"/g, '""')}"`,
        "Nonmove Bucket": worstBucket === "121 up" ? "121 วันขึ้นไป" : `${worstBucket} วัน`,
        "Aging Bucket": m.AgingDays,
        "Classification": classifyNonmove(worstBucket) === "HIGH" ? "Non-Move (>=61d)" : "OK",
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
