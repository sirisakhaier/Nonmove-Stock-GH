export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyNonmove, NONMOVE_BUCKET_ORDER, getWorstBucket } from "@/lib/nonmoveConfig";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get("branchCode");
    const targetDateStr = searchParams.get("date") || searchParams.get("reportDate");

    if (!branchCode) {
      return NextResponse.json({ error: "branchCode is required" }, { status: 400 });
    }

    // 1. Get all distinct dates for this branch in descending order
    const dateRecords = await prisma.nonMoveRow.findMany({
      where: { branchCode },
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

    const currentDateStr = targetDateStr && allDates.includes(targetDateStr) ? targetDateStr : allDates[allDates.length - 1];
    const currentIndex = allDates.indexOf(currentDateStr);
    const prevDateStr = currentIndex > 0 ? allDates[currentIndex - 1] : null;

    // 2. Fetch historical stats for each date
    const historicalSnapshots = [];
    for (const dStr of allDates) {
      const d = new Date(dStr);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const rows = await prisma.nonMoveRow.findMany({
        where: {
          branchCode,
          reportDate: { gte: start, lte: end },
        },
      });

      const pMap = new Map<string, { stockQty: number; stockValue: number; buckets: string[] }>();
      for (const r of rows) {
        if (!pMap.has(r.productCode)) {
          pMap.set(r.productCode, { stockQty: r.stockQty, stockValue: r.stockValue, buckets: [r.nonmoveDaysBucket] });
        } else {
          const item = pMap.get(r.productCode)!;
          item.stockQty += r.stockQty;
          item.stockValue += r.stockValue;
          item.buckets.push(r.nonmoveDaysBucket);
        }
      }

      let highCount = 0;
      let totalStockValue = 0;
      let totalStockQty = 0;
      for (const [, pData] of Array.from(pMap.entries())) {
        totalStockValue += pData.stockValue;
        totalStockQty += pData.stockQty;
        const worst = getWorstBucket(pData.buckets);
        if (classifyNonmove(worst) === "HIGH") highCount++;
      }

      const totalSkus = pMap.size;
      const highPct = totalSkus > 0 ? Math.round((highCount / totalSkus) * 100) : 0;
      const okPct = totalSkus > 0 ? 100 - highPct : 0;

      historicalSnapshots.push({
        date: dStr,
        totalSkus,
        totalStockQty,
        totalStockValue: Math.round(totalStockValue),
        highCount,
        okCount: totalSkus - highCount,
        highPct,
        okPct,
      });
    }

    // 3. Detailed SKU Comparison between currentDate and prevDate (if prevDate exists)
    let movements = {
      clearedCount: 0,
      newCount: 0,
      persistentCount: 0,
      clearedItems: [] as any[],
      newItems: [] as any[],
      persistentItems: [] as any[],
    };

    let delta = {
      stockQtyDiff: 0,
      stockValueDiff: 0,
      highPctDiff: 0,
      skusDiff: 0,
    };

    if (prevDateStr) {
      const prevD = new Date(prevDateStr);
      const prevStart = new Date(prevD);
      prevStart.setHours(0, 0, 0, 0);
      const prevEnd = new Date(prevD);
      prevEnd.setHours(23, 59, 59, 999);

      const currD = new Date(currentDateStr);
      const currStart = new Date(currD);
      currStart.setHours(0, 0, 0, 0);
      const currEnd = new Date(currD);
      currEnd.setHours(23, 59, 59, 999);

      const [prevRows, currRows] = await Promise.all([
        prisma.nonMoveRow.findMany({
          where: { branchCode, reportDate: { gte: prevStart, lte: prevEnd } },
          include: { product: true },
        }),
        prisma.nonMoveRow.findMany({
          where: { branchCode, reportDate: { gte: currStart, lte: currEnd } },
          include: { product: true },
        }),
      ]);

      const prevMap = new Map<string, any>();
      for (const r of prevRows) {
        if (!prevMap.has(r.productCode)) {
          prevMap.set(r.productCode, {
            productCode: r.productCode,
            productName: r.product?.productName || r.productCode,
            model: r.product?.model || "-",
            skuType: r.product?.skuType || "SELLABLE",
            category: r.categoryName || r.product?.category || "Other",
            stockQty: r.stockQty,
            stockValue: r.stockValue,
            bucket: r.nonmoveDaysBucket,
          });
        } else {
          const item = prevMap.get(r.productCode);
          item.stockQty += r.stockQty;
          item.stockValue += r.stockValue;
        }
      }

      const currMap = new Map<string, any>();
      for (const r of currRows) {
        if (!currMap.has(r.productCode)) {
          currMap.set(r.productCode, {
            productCode: r.productCode,
            productName: r.product?.productName || r.productCode,
            model: r.product?.model || "-",
            skuType: r.product?.skuType || "SELLABLE",
            category: r.categoryName || r.product?.category || "Other",
            stockQty: r.stockQty,
            stockValue: r.stockValue,
            bucket: r.nonmoveDaysBucket,
          });
        } else {
          const item = currMap.get(r.productCode);
          item.stockQty += r.stockQty;
          item.stockValue += r.stockValue;
        }
      }

      const currSnapshot = historicalSnapshots.find((s) => s.date === currentDateStr);
      const prevSnapshot = historicalSnapshots.find((s) => s.date === prevDateStr);

      if (currSnapshot && prevSnapshot) {
        delta = {
          stockQtyDiff: currSnapshot.totalStockQty - prevSnapshot.totalStockQty,
          stockValueDiff: currSnapshot.totalStockValue - prevSnapshot.totalStockValue,
          highPctDiff: currSnapshot.highPct - prevSnapshot.highPct,
          skusDiff: currSnapshot.totalSkus - prevSnapshot.totalSkus,
        };
      }

      // Cleared SKUs: In prev, not in curr
      for (const [pCode, pData] of Array.from(prevMap.entries())) {
        if (!currMap.has(pCode)) {
          movements.clearedItems.push(pData);
        }
      }
      movements.clearedCount = movements.clearedItems.length;

      // New SKUs: In curr, not in prev
      for (const [pCode, pData] of Array.from(currMap.entries())) {
        if (!prevMap.has(pCode)) {
          movements.newItems.push(pData);
        } else {
          const prevItem = prevMap.get(pCode);
          movements.persistentItems.push({
            ...pData,
            prevBucket: prevItem.bucket,
            stockQtyChange: pData.stockQty - prevItem.stockQty,
            stockValueChange: pData.stockValue - prevItem.stockValue,
          });
        }
      }
      movements.newCount = movements.newItems.length;
      movements.persistentCount = movements.persistentItems.length;
    }

    return NextResponse.json({
      currentDate: currentDateStr,
      prevDate: prevDateStr,
      hasComparison: !!prevDateStr,
      historicalSnapshots,
      delta,
      movements,
    });
  } catch (error: any) {
    console.error("Error in /api/nonmove/trend:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch trend" }, { status: 500 });
  }
}
