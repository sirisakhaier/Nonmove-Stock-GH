import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NONMOVE_BUCKET_ORDER, classifyNonmove, getWorstBucket } from "@/lib/nonmoveConfig";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") || "ALL";
    const dateParam = searchParams.get("date");

    // Fetch available dates
    const dateRecords = await prisma.nonMoveRow.findMany({
      select: { reportDate: true },
      distinct: ["reportDate"],
      orderBy: { reportDate: "desc" },
    });

    if (dateRecords.length === 0) {
      return NextResponse.json({
        availableDates: [],
        selectedDate: null,
        kpis: { totalStores: 0, totalSkus: 0, totalStockQty: 0, totalStockValue: 0, highNonmoveRatio: 0, highCount: 0, okCount: 0 },
        regionBreakdown: [],
        storeRanking: [],
      });
    }

    const availableDates = dateRecords.map((d) => d.reportDate.toISOString().split("T")[0]);
    const targetDateStr = dateParam && availableDates.includes(dateParam) ? dateParam : availableDates[0];
    const targetDate = new Date(targetDateStr);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Filter by date and region
    const storeWhere: any = {
      storeType: { not: "DC" },
      branchCode: { notIn: ["GH-001", "GH-002", "GH-003"] },
    };

    if (region !== "ALL") {
      storeWhere.region = region;
    }

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: {
        branchCode: true,
        storeNameCust: true,
        region: true,
        province: true,
      },
    });

    const storeCodes = stores.map((s) => s.branchCode);

    const rows = await prisma.nonMoveRow.findMany({
      where: {
        branchCode: { in: storeCodes },
        reportDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        branchCode: true,
        productCode: true,
        stockQty: true,
        stockValue: true,
        nonmoveDaysBucket: true,
        categoryName: true,
      },
    });

    // Approved exclusions
    const approvedExclusions = await prisma.skuRequest.findMany({
      where: {
        branchCode: { in: storeCodes },
        status: "APPROVED",
        requestType: "EXCLUDE",
      },
      select: { branchCode: true, productCode: true },
    });
    const exclusionSet = new Set(approvedExclusions.map((e) => `${e.branchCode}:${e.productCode}`));

    // Aggregate by Store
    const storeAgg = new Map<string, {
      branchCode: string;
      storeNameCust: string;
      region: string;
      province: string | null;
      skus: Set<string>;
      stockQty: number;
      stockValue: number;
      highCount: number;
      okCount: number;
      excludedCount: number;
      bucketCounts: Record<string, number>;
    }>();

    for (const s of stores) {
      storeAgg.set(s.branchCode, {
        branchCode: s.branchCode,
        storeNameCust: s.storeNameCust,
        region: s.region,
        province: s.province,
        skus: new Set<string>(),
        stockQty: 0,
        stockValue: 0,
        highCount: 0,
        okCount: 0,
        excludedCount: 0,
        bucketCounts: Object.fromEntries(NONMOVE_BUCKET_ORDER.map((b) => [b, 0])),
      });
    }

    // Process rows
    for (const r of rows) {
      const agg = storeAgg.get(r.branchCode);
      if (!agg) continue;

      agg.skus.add(r.productCode);
      agg.stockQty += r.stockQty;
      agg.stockValue += r.stockValue;
      agg.bucketCounts[r.nonmoveDaysBucket] = (agg.bucketCounts[r.nonmoveDaysBucket] || 0) + 1;

      const isExcluded = exclusionSet.has(`${r.branchCode}:${r.productCode}`);
      if (isExcluded) {
        agg.excludedCount++;
      } else {
        const cls = classifyNonmove(r.nonmoveDaysBucket);
        if (cls === "HIGH") agg.highCount++;
        else agg.okCount++;
      }
    }

    // Company/Region totals
    let totalStockQty = 0;
    let totalStockValue = 0;
    let totalHighCount = 0;
    let totalOkCount = 0;
    let totalExcludedCount = 0;
    const allSkusSet = new Set<string>();

    const storeRanking = Array.from(storeAgg.values()).map((s) => {
      totalStockQty += s.stockQty;
      totalStockValue += s.stockValue;
      totalHighCount += s.highCount;
      totalOkCount += s.okCount;
      totalExcludedCount += s.excludedCount;
      s.skus.forEach((sku) => allSkusSet.add(sku));

      const activeCount = s.highCount + s.okCount;
      const highPct = activeCount > 0 ? Math.round((s.highCount / activeCount) * 100) : 0;
      const okPct = activeCount > 0 ? 100 - highPct : 0;

      return {
        branchCode: s.branchCode,
        storeNameCust: s.storeNameCust,
        region: s.region,
        province: s.province,
        skuCount: s.skus.size,
        stockQty: s.stockQty,
        stockValue: s.stockValue,
        highCount: s.highCount,
        okCount: s.okCount,
        highPct,
        okPct,
        excludedCount: s.excludedCount,
      };
    }).sort((a, b) => b.stockValue - a.stockValue);

    const totalActive = totalHighCount + totalOkCount;
    const overallHighPct = totalActive > 0 ? Math.round((totalHighCount / totalActive) * 100) : 0;
    const overallOkPct = totalActive > 0 ? 100 - overallHighPct : 0;

    // Regional breakdown
    const regionMap = new Map<string, { region: string; storeCount: number; stockValue: number; stockQty: number; highCount: number; okCount: number }>();
    for (const s of storeRanking) {
      if (!regionMap.has(s.region)) {
        regionMap.set(s.region, { region: s.region, storeCount: 0, stockValue: 0, stockQty: 0, highCount: 0, okCount: 0 });
      }
      const r = regionMap.get(s.region)!;
      r.storeCount++;
      r.stockValue += s.stockValue;
      r.stockQty += s.stockQty;
      r.highCount += s.highCount;
      r.okCount += s.okCount;
    }

    const regionBreakdown = Array.from(regionMap.values()).map((r) => {
      const active = r.highCount + r.okCount;
      return {
        ...r,
        highPct: active > 0 ? Math.round((r.highCount / active) * 100) : 0,
        okPct: active > 0 ? 100 - Math.round((r.highCount / active) * 100) : 0,
      };
    }).sort((a, b) => b.stockValue - a.stockValue);

    return NextResponse.json({
      availableDates,
      selectedDate: targetDateStr,
      kpis: {
        totalStores: stores.length,
        activeStoresWithStock: storeRanking.filter((s) => s.stockValue > 0).length,
        totalSkus: allSkusSet.size,
        totalStockQty,
        totalStockValue,
        highNonmoveRatio: overallHighPct,
        highCount: totalHighCount,
        okCount: totalOkCount,
        overallOkPct,
        excludedCount: totalExcludedCount,
      },
      regionBreakdown,
      storeRanking,
    });
  } catch (error: any) {
    console.error("Error in /api/viewer/summary:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch viewer summary" }, { status: 500 });
  }
}
