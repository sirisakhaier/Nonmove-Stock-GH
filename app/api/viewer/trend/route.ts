import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapBucketToTier(bucketStr: string): number {
  if (!bucketStr) return 0;
  const b = bucketStr.trim().toLowerCase();
  if (b.includes(">360") || b.includes("365+") || b.includes(">365") || b.includes("360+")) return 4; // Severe
  if (b.includes("271-365") || b.includes("270-360") || b.includes(">270") || b.includes("271-360")) return 3; // Critical
  if (b.includes("181-270") || b.includes("180-360") || b.includes("181-210") || b.includes("211-270") || b.includes("180-270")) return 2; // Elevated
  if (b.includes("121-180") || b.includes("120-180")) return 1; // Watch
  return 0; // Active (<=120d)
}

export async function GET(req: NextRequest) {
  try {
    // 1. Get all distinct snapshot dates in database in ascending order
    const dateRecords = await prisma.nonMoveRow.findMany({
      select: { reportDate: true },
      distinct: ["reportDate"],
      orderBy: { reportDate: "asc" },
    });

    const dates = dateRecords.map((d) => d.reportDate.toISOString().split("T")[0]);

    if (dates.length === 0) {
      return NextResponse.json({
        dates: [],
        tierLabels: [],
        categories: [],
        regions: [],
        rollups: [],
        snapshots: [],
        hasComparison: false,
      });
    }

    const tierLabels = [
      "30-60 วัน",
      "61-90 วัน",
      "91-120 วัน",
      "121 วันขึ้นไป",
    ];

    // 2. Fetch all nonmove rows across all dates
    const allRows = await prisma.nonMoveRow.findMany({
      select: {
        reportDate: true,
        branchCode: true,
        productCode: true,
        categoryName: true,
        nonmoveDaysBucket: true,
        stockQty: true,
        stockValue: true,
        store: {
          select: {
            region: true,
            storeNameCust: true,
            province: true,
          },
        },
        product: {
          select: {
            category: true,
          },
        },
      },
    });

    // 3. Rollup by: Date x Region x Category x Tier
    const rollupMap = new Map<string, {
      date: string;
      dateIdx: number;
      region: string;
      category: string;
      tier: number;
      qty: number;
      value: number;
    }>();

    const categorySet = new Set<string>();
    const regionSet = new Set<string>();

    for (const r of allRows) {
      const dStr = r.reportDate.toISOString().split("T")[0];
      const dIdx = dates.indexOf(dStr);
      if (dIdx === -1) continue;

      const cat = r.product?.category?.trim().toUpperCase() || r.categoryName?.trim().toUpperCase() || "OTHER";
      const reg = r.store?.region?.trim() || "OTHER";
      if (reg !== "OTHER") regionSet.add(reg);
      if (cat !== "OTHER") categorySet.add(cat);

      const tier = mapBucketToTier(r.nonmoveDaysBucket);
      const q = r.stockQty || 0;
      const v = r.stockValue || 0;

      const key = `${dStr}__${reg}__${cat}__${tier}`;
      if (!rollupMap.has(key)) {
        rollupMap.set(key, {
          date: dStr,
          dateIdx: dIdx,
          region: reg,
          category: cat,
          tier,
          qty: 0,
          value: 0,
        });
      }
      const item = rollupMap.get(key)!;
      item.qty += q;
      item.value += v;
    }

    const categories = Array.from(categorySet).sort();
    if (categories.length === 0) {
      ["WM", "RF", "AC", "TV", "FREEZER", "WH", "SDA"].forEach((c) => categories.push(c));
    }
    const regions = Array.from(regionSet).sort();

    const rollups = Array.from(rollupMap.values()).map((r) => ({
      ...r,
      value: Math.round(r.value),
    }));

    // Per-date snapshot summary
    const snapshots = dates.map((dStr, dIdx) => {
      const dayRows = rollups.filter((r) => r.dateIdx === dIdx);
      let totalStockValue = 0;
      let totalStockQty = 0;
      let nonmoveValue = 0;
      let nonmoveQty = 0;
      let highRiskValue = 0;
      const tierVals = [0, 0, 0, 0];
      const tierQtys = [0, 0, 0, 0];

      for (const r of dayRows) {
        totalStockValue += r.value;
        totalStockQty += r.qty;
        tierVals[r.tier] += r.value;
        tierQtys[r.tier] += r.qty;
        if (r.tier >= 1) {
          nonmoveValue += r.value;
          nonmoveQty += r.qty;
        }
        if (r.tier === 3) {
          highRiskValue += r.value;
        }
      }

      const nonmovePct = totalStockValue > 0 ? Math.round((nonmoveValue / totalStockValue) * 100) : 0;

      return {
        date: dStr,
        dateIdx: dIdx,
        totalStockValue: Math.round(totalStockValue),
        totalStockQty,
        nonmoveValue: Math.round(nonmoveValue),
        nonmoveQty,
        highRiskValue: Math.round(highRiskValue),
        nonmovePct,
        tierVals: tierVals.map((v) => Math.round(v)),
        tierQtys,
      };
    });

    return NextResponse.json({
      dates,
      tierLabels,
      categories,
      regions,
      rollups,
      snapshots,
      hasComparison: dates.length > 1,
      firstDate: dates[0],
      latestDate: dates[dates.length - 1],
      prevDate: dates.length > 1 ? dates[dates.length - 2] : dates[0],
    });
  } catch (error: any) {
    console.error("Error in /api/viewer/trend:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trend analysis" },
      { status: 500 }
    );
  }
}
