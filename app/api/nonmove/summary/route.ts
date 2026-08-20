import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyNonmove, NONMOVE_BUCKET_ORDER, getWorstBucket } from "@/lib/nonmoveConfig";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get("branchCode");
    const reportDateStr = searchParams.get("reportDate");
    const category = searchParams.get("category");

    if (!branchCode) {
      return NextResponse.json({ error: "branchCode is required" }, { status: 400 });
    }

    // Find all distinct available dates for this store
    const availableDates = await prisma.nonMoveRow.findMany({
      where: { branchCode },
      select: { reportDate: true },
      distinct: ["reportDate"],
      orderBy: { reportDate: "desc" },
    });

    const dateList = availableDates.map((d) => d.reportDate.toISOString().split("T")[0]);

    let targetDate: Date;
    if (reportDateStr) {
      targetDate = new Date(reportDateStr);
    } else {
      targetDate = availableDates[0]?.reportDate || new Date();
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause: any = {
      branchCode,
      reportDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (category && category !== "ALL") {
      whereClause.OR = [
        { categoryName: category },
        { product: { category } },
      ];
    }

    const rows = await prisma.nonMoveRow.findMany({
      where: whereClause,
      include: { product: true },
    });

    // Approved exclusions
    const approvedExclusions = new Set(
      (
        await prisma.skuRequest.findMany({
          where: {
            branchCode,
            status: "APPROVED",
            requestType: "EXCLUDE",
          },
          select: { productCode: true },
        })
      ).map((r) => r.productCode)
    );

    // Group by productCode
    const modelMap = new Map<string, {
      stockQty: number;
      stockValue: number;
      buckets: string[];
      categoryName: string;
    }>();

    for (const r of rows) {
      const p = r.productCode;
      const existing = modelMap.get(p);
      if (!existing) {
        modelMap.set(p, {
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          buckets: [r.nonmoveDaysBucket],
          categoryName: r.categoryName || "Other",
        });
      } else {
        existing.stockQty += r.stockQty;
        existing.stockValue += r.stockValue;
        existing.buckets.push(r.nonmoveDaysBucket);
      }
    }

    let totalSkus = 0;
    let totalStockQty = 0;
    let totalStockValue = 0;
    let highCount = 0;
    let okCount = 0;
    let excludedCount = 0;

    const bucketCounts: Record<string, number> = {};
    for (const b of NONMOVE_BUCKET_ORDER) {
      bucketCounts[b] = 0;
    }

    const categoryBreakdown: Record<string, { value: number; count: number }> = {};

    for (const [pCode, data] of modelMap.entries()) {
      totalSkus++;
      totalStockQty += data.stockQty;
      totalStockValue += data.stockValue;

      const worstBucket = getWorstBucket(data.buckets);
      bucketCounts[worstBucket] = (bucketCounts[worstBucket] || 0) + 1;

      const cat = data.categoryName;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { value: 0, count: 0 };
      }
      categoryBreakdown[cat].value += data.stockValue;
      categoryBreakdown[cat].count += 1;

      if (approvedExclusions.has(pCode)) {
        excludedCount++;
      } else {
        const cls = classifyNonmove(worstBucket);
        if (cls === "HIGH") highCount++;
        else okCount++;
      }
    }

    const activeCount = highCount + okCount;
    const highPct = activeCount > 0 ? Math.round((highCount / activeCount) * 100) : 0;
    const okPct = activeCount > 0 ? 100 - highPct : 0;

    const chartData = NONMOVE_BUCKET_ORDER.map((bucket) => ({
      bucket,
      count: bucketCounts[bucket] || 0,
      classification: classifyNonmove(bucket),
    }));

    const categoryData = Object.entries(categoryBreakdown)
      .map(([name, val]) => ({
        name,
        value: Math.round(val.value),
        count: val.count,
      }))
      .sort((a, b) => b.value - a.value);

    // Get unique categories for filter dropdown
    const allCategories = await prisma.nonMoveRow.findMany({
      where: {
        branchCode,
        reportDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { categoryName: true },
      distinct: ["categoryName"],
    });

    const categories = allCategories.map((c) => c.categoryName).filter(Boolean);

    return NextResponse.json({
      reportDate: targetDate.toISOString().split("T")[0],
      availableDates: dateList,
      totalSkus,
      totalStockQty,
      totalStockValue,
      highCount,
      okCount,
      excludedCount,
      highPct,
      okPct,
      chartData,
      categoryData,
      categories,
    });
  } catch (error: any) {
    console.error("Error in /api/nonmove/summary:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch summary" }, { status: 500 });
  }
}
