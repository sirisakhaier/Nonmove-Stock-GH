export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyNonmove, getWorstBucket } from "@/lib/nonmoveConfig";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region");

    const storeWhere: any = {};
    if (region && region !== "ALL") {
      storeWhere.region = region;
    }

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { branchCode: true, region: true },
    });
    const branchCodes = stores.map((s) => s.branchCode);

    // 1. Get all distinct dates
    const dateRecords = await prisma.nonMoveRow.findMany({
      where: { branchCode: { in: branchCodes } },
      select: { reportDate: true },
      distinct: ["reportDate"],
      orderBy: { reportDate: "asc" },
    });

    const allDates = dateRecords.map((d) => d.reportDate.toISOString().split("T")[0]);

    if (allDates.length === 0) {
      return NextResponse.json({
        availableDates: [],
        historicalSnapshots: [],
        hasComparison: false,
      });
    }

    // 2. Fetch stats for each date
    const historicalSnapshots = [];
    for (const dStr of allDates) {
      const d = new Date(dStr);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const rows = await prisma.nonMoveRow.findMany({
        where: {
          branchCode: { in: branchCodes },
          reportDate: { gte: start, lte: end },
        },
      });

      const storeSkusMap = new Map<string, { stockQty: number; stockValue: number; buckets: string[] }>();
      for (const r of rows) {
        const key = `${r.branchCode}_${r.productCode}`;
        if (!storeSkusMap.has(key)) {
          storeSkusMap.set(key, { stockQty: r.stockQty, stockValue: r.stockValue, buckets: [r.nonmoveDaysBucket] });
        } else {
          const item = storeSkusMap.get(key)!;
          item.stockQty += r.stockQty;
          item.stockValue += r.stockValue;
          item.buckets.push(r.nonmoveDaysBucket);
        }
      }

      let highCount = 0;
      let totalStockValue = 0;
      let totalStockQty = 0;
      for (const [, pData] of Array.from(storeSkusMap.entries())) {
        totalStockValue += pData.stockValue;
        totalStockQty += pData.stockQty;
        const worst = getWorstBucket(pData.buckets);
        if (classifyNonmove(worst) === "HIGH") highCount++;
      }

      const totalSkus = storeSkusMap.size;
      const highPct = totalSkus > 0 ? Math.round((highCount / totalSkus) * 100) : 0;

      historicalSnapshots.push({
        date: dStr,
        totalSkus,
        totalStockQty,
        totalStockValue: Math.round(totalStockValue),
        highCount,
        okCount: totalSkus - highCount,
        highPct,
        okPct: totalSkus > 0 ? 100 - highPct : 0,
      });
    }

    // Delta between last 2 dates
    let delta = {
      stockQtyDiff: 0,
      stockValueDiff: 0,
      highPctDiff: 0,
      skusDiff: 0,
    };

    if (historicalSnapshots.length >= 2) {
      const last = historicalSnapshots[historicalSnapshots.length - 1];
      const prev = historicalSnapshots[historicalSnapshots.length - 2];
      delta = {
        stockQtyDiff: last.totalStockQty - prev.totalStockQty,
        stockValueDiff: last.totalStockValue - prev.totalStockValue,
        highPctDiff: last.highPct - prev.highPct,
        skusDiff: last.totalSkus - prev.totalSkus,
      };
    }

    return NextResponse.json({
      availableDates: allDates,
      historicalSnapshots,
      hasComparison: historicalSnapshots.length >= 2,
      delta,
    });
  } catch (error: any) {
    console.error("Error in /api/viewer/trend:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch viewer trend" }, { status: 500 });
  }
}
