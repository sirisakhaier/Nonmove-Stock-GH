import { getFromCache, setInCache } from "@/lib/apiCache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyNonmove, NONMOVE_BUCKET_ORDER, getWorstBucket, mapTo4Buckets } from "@/lib/nonmoveConfig";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get("branchCode");
    const reportDateStr = searchParams.get("date");
    const category = searchParams.get("category");
    const bucket = searchParams.get("bucket");
    const skuType = searchParams.get("skuType");

    if (!branchCode) {
      return NextResponse.json({ error: "branchCode is required" }, { status: 400 });
    }

    // 1. Get branch info
    const store = await prisma.store.findUnique({
      where: { branchCode },
    });

    // 2. Fetch distinct available dates
    const dates = await prisma.nonMoveRow.findMany({
      where: { branchCode },
      select: { reportDate: true },
      distinct: ["reportDate"],
      orderBy: { reportDate: "desc" },
    });
    const dateList = dates.map((d) => d.reportDate.toISOString().split("T")[0]);

    // 3. Fetch all categories and skuTypes for this branch/catalog
    const allProducts = await prisma.product.findMany({
      select: { category: true, skuType: true },
      distinct: ["category", "skuType"],
    });

    const categoriesList = Array.from(
      new Set(allProducts.map((p) => p.category?.trim()).filter((c): c is string => Boolean(c)))
    ).sort();

    const skuTypesList = Array.from(
      new Set(allProducts.map((p) => p.skuType?.trim()).filter((t): t is string => Boolean(t)))
    );

    if (dateList.length === 0) {
      return NextResponse.json({
        store: {
          branchCode,
          branchName: store?.storeNameCust || store?.storeName || branchCode,
          region: store?.region || "OTHER",
        },
        selectedDate: null,
        reportDate: null,
        availableDates: [],
        kpis: {
          totalSkus: 0,
          totalStockQty: 0,
          totalStockValue: 0,
          highNonmoveRatio: 0,
          highCount: 0,
          okCount: 0,
          overallOkPct: 0,
          excludedCount: 0,
        },
        chartData: NONMOVE_BUCKET_ORDER.map((b) => ({
          bucket: b,
          count: 0,
          classification: classifyNonmove(b),
          isHigh: classifyNonmove(b) === "HIGH",
        })),
        categoryBreakdown: [],
        categories: categoriesList.length > 0 ? categoriesList : ["TV", "WH", "FZ", "WM", "RF", "AC", "SDA", "CAC", "KT"],
        skuTypes: skuTypesList.length > 0 ? skuTypesList : ["SELLABLE", "DEMO", "MOCK_UP"],
      });
    }

    let targetDateStr = reportDateStr && dateList.includes(reportDateStr) ? reportDateStr : dateList[0];
    let targetDate = new Date(targetDateStr);

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

    const cacheKey = `summary_${branchCode}_${targetDateStr}_${category || "ALL"}_${bucket || "ALL"}_${skuType || "ALL"}`;
    const cachedSummary = getFromCache(cacheKey);
    if (cachedSummary) {
      return NextResponse.json(cachedSummary);
    }

    const rows = await prisma.nonMoveRow.findMany({
      where: whereClause,
      select: {
        productCode: true,
        stockQty: true,
        stockValue: true,
        nonmoveDaysBucket: true,
        categoryName: true,
        product: {
          select: {
            category: true,
            skuType: true,
          },
        },
      },
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

    // Multi-Filter Parsing
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

    // Group by productCode
    const modelMap = new Map<string, {
      stockQty: number;
      stockValue: number;
      buckets: string[];
      categoryName: string;
      skuType: string;
    }>();

    for (const r of rows) {
      const p = r.productCode;
      const cat = r.product?.category?.trim().toUpperCase() || r.categoryName?.trim().toUpperCase() || "OTHER";
      const sType = r.product?.skuType?.trim().toUpperCase() || "SELLABLE";

      // Filter by Category
      if (allowedCats && !allowedCats.has(cat)) continue;

      // Filter by SKU Type
      if (allowedTypes && !allowedTypes.has(sType)) continue;

      if (!modelMap.has(p)) {
        modelMap.set(p, {
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          buckets: [mapTo4Buckets(r.nonmoveDaysBucket)],
          categoryName: cat,
          skuType: sType,
        });
      } else {
        const item = modelMap.get(p)!;
        item.stockQty += r.stockQty;
        item.stockValue += r.stockValue;
        item.buckets.push(mapTo4Buckets(r.nonmoveDaysBucket));
      }
    }

    let totalSkus = 0;
    let totalStockQty = 0;
    let totalStockValue = 0;
    let highCount = 0;
    let okCount = 0;
    let excludedCount = 0;

    const bucketCounts: Record<string, number> = {};
    const bucketQtys: Record<string, number> = {};
    const bucketValues: Record<string, number> = {};
    for (const b of NONMOVE_BUCKET_ORDER) {
      bucketCounts[b] = 0;
      bucketQtys[b] = 0;
      bucketValues[b] = 0;
    }

    const categoryBreakdown: Record<string, { value: number; count: number }> = {};

    for (const [pCode, data] of Array.from(modelMap.entries())) {
      const worstBucket = getWorstBucket(data.buckets);

      // Filter by Bucket (4 groups)
      if (allowedBuckets && !allowedBuckets.has(worstBucket)) continue;

      totalSkus++;
      totalStockQty += data.stockQty;
      totalStockValue += data.stockValue;

      bucketCounts[worstBucket] = (bucketCounts[worstBucket] || 0) + 1;
      bucketQtys[worstBucket] = (bucketQtys[worstBucket] || 0) + data.stockQty;
      bucketValues[worstBucket] = (bucketValues[worstBucket] || 0) + data.stockValue;

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

    const periodKpis = NONMOVE_BUCKET_ORDER.map((b) => {
      const count = bucketCounts[b] || 0;
      const pct = totalSkus > 0 ? (count / totalSkus) * 100 : 0;
      const isHigh = classifyNonmove(b) === "HIGH";
      return {
        bucket: b,
        label: b === "121 up" ? "121 วันขึ้นไป" : `${b} วัน`,
        skuCount: count,
        skuPct: Math.round(pct * 10) / 10,
        stockQty: bucketQtys[b] || 0,
        stockValue: Math.round(bucketValues[b] || 0),
        classification: classifyNonmove(b),
        isHigh,
        statusLabel: isHigh ? "Non-Move" : "ปกติ",
      };
    });

    const chartData = periodKpis.map((p) => ({
      bucket: p.bucket,
      count: p.skuCount,
      classification: p.classification,
      isHigh: p.isHigh,
    }));

    const categoryData = Object.entries(categoryBreakdown)
      .map(([name, val]) => ({
        category: name,
        name,
        value: Math.round(val.value),
        count: val.count,
      }))
      .sort((a, b) => b.value - a.value);

    const summaryResult = {
      store: {
        branchCode,
        branchName: store?.storeNameCust || store?.storeName || branchCode,
        region: store?.region || "OTHER",
      },
      selectedDate: targetDateStr,
      reportDate: targetDateStr,
      availableDates: dateList,
      kpis: {
        totalSkus,
        totalStockQty,
        totalStockValue: Math.round(totalStockValue),
        highNonmoveRatio: highPct,
        highCount,
        okCount,
        overallOkPct: okPct,
        excludedCount,
      },
      periodKpis,
      chartData,
      categoryBreakdown: categoryData,
      categories: categoriesList.length > 0 ? categoriesList : ["TV", "WH", "FZ", "WM", "RF", "AC", "SDA", "CAC", "KT"],
      skuTypes: skuTypesList.length > 0 ? skuTypesList : ["SELLABLE", "DEMO", "MOCK_UP"],
    };

    setInCache(cacheKey, summaryResult, 60_000); // 1 minute
    return NextResponse.json(summaryResult);
  } catch (error: any) {
    console.error("Error in /api/nonmove/summary:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
