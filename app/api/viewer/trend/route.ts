export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NONMOVE_BUCKET_ORDER, classifyNonmove } from "@/lib/nonmoveConfig";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region");

    const storeWhere: any = {
      storeType: { not: "DC" },
      branchCode: { notIn: ["GH-001", "GH-002", "GH-003"] },
    };
    if (region && region !== "ALL") {
      storeWhere.region = region;
    }

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { branchCode: true },
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
        select: {
          productCode: true,
          stockQty: true,
          stockValue: true,
          nonmoveDaysBucket: true,
        },
      });

      let totalStockValue = 0;
      let totalStockQty = 0;
      let highValue = 0;
      let okValue = 0;
      const skuSet = new Set<string>();

      const bucketAmounts: Record<string, number> = {};
      const bucketQtys: Record<string, number> = {};
      for (const b of NONMOVE_BUCKET_ORDER) {
        bucketAmounts[b] = 0;
        bucketQtys[b] = 0;
      }

      for (const r of rows) {
        totalStockValue += r.stockValue;
        totalStockQty += r.stockQty;
        skuSet.add(r.productCode);

        const b = r.nonmoveDaysBucket || "30-60";
        if (bucketAmounts[b] !== undefined) {
          bucketAmounts[b] += r.stockValue;
          bucketQtys[b] += r.stockQty;
        }

        if (classifyNonmove(b) === "HIGH") {
          highValue += r.stockValue;
        } else {
          okValue += r.stockValue;
        }
      }

      const totalSkus = skuSet.size;
      const highPct = totalStockValue > 0 ? Math.round((highValue / totalStockValue) * 100) : 0;
      const okPct = 100 - highPct;

      historicalSnapshots.push({
        date: dStr,
        totalSkus,
        totalStockQty,
        totalStockValue: Math.round(totalStockValue),
        highValue: Math.round(highValue),
        okValue: Math.round(okValue),
        highPct,
        okPct,
        bucketAmounts,
        bucketQtys,
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
