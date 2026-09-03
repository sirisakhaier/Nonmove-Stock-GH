import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapTo4Buckets, NONMOVE_BUCKET_ORDER } from "@/lib/nonmoveConfig";

export const dynamic = "force-dynamic";

// Map bucket strings to 4 aging tiers:
// 0: "30-60" (Active <=60d)
// 1: "61-90" (Non-move 61-90d)
// 2: "91-120" (Non-move 91-120d)
// 3: "121 up" (High Non-move >=121d)
function mapBucketToTierIndex(bucketStr: string): number {
  const mapped = mapTo4Buckets(bucketStr);
  const idx = NONMOVE_BUCKET_ORDER.indexOf(mapped);
  return idx >= 0 ? idx : 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    // 1. Get all available snapshot dates in descending order (latest first)
    const dateRows = await prisma.nonMoveRow.findMany({
      select: { reportDate: true },
      distinct: ["reportDate"],
      orderBy: { reportDate: "desc" },
    });

    const availableDates = dateRows.map((d) => d.reportDate.toISOString().split("T")[0]);

    const tierLabels = [
      "30-60 วัน",
      "61-90 วัน",
      "91-120 วัน",
      "121 วันขึ้นไป",
    ];

    if (availableDates.length === 0) {
      return NextResponse.json({
        reportDate: null,
        availableDates: [],
        kpis: {
          totalStockValue: 0,
          totalStockQty: 0,
          nonmoveValue: 0,
          nonmoveQty: 0,
          highRiskValue: 0,
          linesFlagged: 0,
          totalLines: 0,
          avgValuePerLine: 0,
        },
        tierData: [0, 1, 2, 3].map((t) => ({ tier: t, value: 0, qty: 0 })),
        categoryBreakdown: [],
        regionBreakdown: [],
        matrix: { categories: [], regions: [], rows: [] },
        storeCategories: [],
      });
    }

    // Always default to latest uploaded date if none provided or invalid
    const selectedDateStr = dateParam && availableDates.includes(dateParam) ? dateParam : availableDates[0];
    const targetDate = new Date(selectedDateStr);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Fetch rows for the target date
    const rows = await prisma.nonMoveRow.findMany({
      where: {
        reportDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        store: true,
        product: true,
      },
    });

    let totalStockValue = 0;
    let totalStockQty = 0;
    let nonmoveValue = 0;
    let nonmoveQty = 0;
    let highRiskValue = 0;

    const tierSums = [
      { tier: 0, label: tierLabels[0], value: 0, qty: 0 },
      { tier: 1, label: tierLabels[1], value: 0, qty: 0 },
      { tier: 2, label: tierLabels[2], value: 0, qty: 0 },
      { tier: 3, label: tierLabels[3], value: 0, qty: 0 },
    ];

    // Aggregations maps
    const catMap = new Map<string, { totalVal: number; totalQty: number; tierVals: number[]; tierQtys: number[] }>();
    const regMap = new Map<string, { totalVal: number; totalQty: number; tierVals: number[]; tierQtys: number[] }>();
    const matrixMap = new Map<string, { totalVal: number; nonmoveVal: number }>();

    // Store x Category aggregation map
    const storeCatMap = new Map<string, {
      store: string;
      branchCode: string;
      storeId: string;
      province: string;
      region: string;
      category: string;
      totalQty: number;
      totalValue: number;
      nonmoveQty: number;
      nonmoveValue: number;
      tierVals: number[];
      tierQtys: number[];
      skus: Set<string>;
    }>();

    for (const r of rows) {
      const v = r.stockValue || 0;
      const q = r.stockQty || 0;
      const tier = mapBucketToTierIndex(r.nonmoveDaysBucket);
      const isNM = tier >= 1; // Non-move from 61 day up (tier 1: 61-90, tier 2: 91-120, tier 3: 121 up)
      const isHR = tier === 3; // High-risk >= 121 days

      totalStockValue += v;
      totalStockQty += q;
      if (isNM) {
        nonmoveValue += v;
        nonmoveQty += q;
      }
      if (isHR) {
        highRiskValue += v;
      }

      tierSums[tier].value += v;
      tierSums[tier].qty += q;

      const cat = r.product?.category?.trim().toUpperCase() || r.categoryName?.trim().toUpperCase() || "Other";
      const reg = r.store?.region?.trim() || "OTHER";
      const branchCode = r.branchCode;
      const storeName = r.store?.storeNameCust || r.branchName || r.branchShort || branchCode;
      const province = r.store?.province || "-";
      const storeId = r.store?.storeId || branchCode;

      // Category breakdown
      if (!catMap.has(cat)) {
        catMap.set(cat, { totalVal: 0, totalQty: 0, tierVals: [0, 0, 0, 0], tierQtys: [0, 0, 0, 0] });
      }
      const cItem = catMap.get(cat)!;
      cItem.totalVal += v;
      cItem.totalQty += q;
      cItem.tierVals[tier] += v;
      cItem.tierQtys[tier] += q;

      // Region breakdown
      if (!regMap.has(reg)) {
        regMap.set(reg, { totalVal: 0, totalQty: 0, tierVals: [0, 0, 0, 0], tierQtys: [0, 0, 0, 0] });
      }
      const rItem = regMap.get(reg)!;
      rItem.totalVal += v;
      rItem.totalQty += q;
      rItem.tierVals[tier] += v;
      rItem.tierQtys[tier] += q;

      // Matrix
      const matrixKey = `${cat}__${reg}`;
      if (!matrixMap.has(matrixKey)) {
        matrixMap.set(matrixKey, { totalVal: 0, nonmoveVal: 0 });
      }
      const mItem = matrixMap.get(matrixKey)!;
      mItem.totalVal += v;
      if (isNM) mItem.nonmoveVal += v;

      // Store x Category detail
      const scKey = `${branchCode}__${cat}`;
      if (!storeCatMap.has(scKey)) {
        storeCatMap.set(scKey, {
          store: storeName,
          branchCode,
          storeId,
          province,
          region: reg,
          category: cat,
          totalQty: 0,
          totalValue: 0,
          nonmoveQty: 0,
          nonmoveValue: 0,
          tierVals: [0, 0, 0, 0],
          tierQtys: [0, 0, 0, 0],
          skus: new Set([r.productCode]),
        });
      }
      const scItem = storeCatMap.get(scKey)!;
      scItem.totalQty += q;
      scItem.totalValue += v;
      if (isNM) {
        scItem.nonmoveQty += q;
        scItem.nonmoveValue += v;
      }
      scItem.tierVals[tier] += v;
      scItem.tierQtys[tier] += q;
      scItem.skus.add(r.productCode);
    }

    // Format Category list & breakdown
    const categories = Array.from(catMap.keys()).sort();
    const categoryBreakdown = categories.map((name) => {
      const data = catMap.get(name)!;
      return {
        name,
        totalVal: Math.round(data.totalVal),
        totalQty: data.totalQty,
        tierVals: data.tierVals.map((val) => Math.round(val)),
        tierQtys: data.tierQtys,
      };
    }).sort((a, b) => b.totalVal - a.totalVal);

    // Format Region list & breakdown
    const regions = Array.from(regMap.keys()).sort();
    const regionBreakdown = regions.map((name) => {
      const data = regMap.get(name)!;
      return {
        name,
        totalVal: Math.round(data.totalVal),
        totalQty: data.totalQty,
        tierVals: data.tierVals.map((val) => Math.round(val)),
        tierQtys: data.tierQtys,
      };
    }).sort((a, b) => b.totalVal - a.totalVal);

    // Format Matrix data (Category x Region)
    const matrixRows = categories.map((cat) => {
      let rowTotalVal = 0;
      let rowNonmoveVal = 0;
      const cells = regions.map((reg) => {
        const item = matrixMap.get(`${cat}__${reg}`) || { totalVal: 0, nonmoveVal: 0 };
        rowTotalVal += item.totalVal;
        rowNonmoveVal += item.nonmoveVal;
        const pct = item.totalVal > 0 ? (item.nonmoveVal / item.totalVal) * 100 : 0;
        return {
          region: reg,
          totalVal: Math.round(item.totalVal),
          nonmoveVal: Math.round(item.nonmoveVal),
          pct: Math.round(pct),
        };
      });
      const rowPct = rowTotalVal > 0 ? (rowNonmoveVal / rowTotalVal) * 100 : 0;
      return {
        category: cat,
        cells,
        totalVal: Math.round(rowTotalVal),
        nonmoveVal: Math.round(rowNonmoveVal),
        pct: Math.round(rowPct),
      };
    });

    // Column totals for matrix
    const matrixColTotals = regions.map((reg) => {
      let colTotVal = 0;
      let colNmVal = 0;
      for (const cat of categories) {
        const item = matrixMap.get(`${cat}__${reg}`);
        if (item) {
          colTotVal += item.totalVal;
          colNmVal += item.nonmoveVal;
        }
      }
      const pct = colTotVal > 0 ? (colNmVal / colTotVal) * 100 : 0;
      return {
        region: reg,
        totalVal: Math.round(colTotVal),
        nonmoveVal: Math.round(colNmVal),
        pct: Math.round(pct),
      };
    });

    // Format Store x Category Detail List
    const storeCategories = Array.from(storeCatMap.values()).map((item) => {
      let dominantTier = 0;
      for (let t = 3; t >= 0; t--) {
        if (item.tierVals[t] > 0) {
          dominantTier = t;
          break;
        }
      }
      const nonmovePct = item.totalValue > 0 ? (item.nonmoveValue / item.totalValue) * 100 : 0;
      return {
        store: item.store,
        branchCode: item.branchCode,
        storeId: item.storeId,
        province: item.province,
        region: item.region,
        category: item.category,
        skuCount: item.skus.size,
        dominantTier,
        dominantTierLabel: tierLabels[dominantTier],
        totalQty: item.totalQty,
        totalValue: Math.round(item.totalValue),
        nonmoveQty: item.nonmoveQty,
        nonmoveValue: Math.round(item.nonmoveValue),
        nonmovePct: Math.round(nonmovePct),
        tierVals: item.tierVals.map((v) => Math.round(v)),
        tierQtys: item.tierQtys,
      };
    }).sort((a, b) => b.totalValue - a.totalValue);

    const totalLines = storeCategories.length;
    const linesFlagged = storeCategories.filter((sc) => sc.nonmoveValue > 0).length;
    const avgValuePerLine = totalLines > 0 ? Math.round(totalStockValue / totalLines) : 0;

    return NextResponse.json({
      reportDate: selectedDateStr,
      availableDates,
      tierLabels,
      kpis: {
        totalStockValue: Math.round(totalStockValue),
        totalStockQty,
        nonmoveValue: Math.round(nonmoveValue),
        nonmoveQty,
        highRiskValue: Math.round(highRiskValue),
        linesFlagged,
        totalLines,
        avgValuePerLine,
      },
      tierData: tierSums.map((t) => ({ ...t, value: Math.round(t.value) })),
      categories,
      regions,
      categoryBreakdown,
      regionBreakdown,
      matrix: {
        categories,
        regions,
        rows: matrixRows,
        colTotals: matrixColTotals,
        grandTotalVal: Math.round(totalStockValue),
        grandNonmoveVal: Math.round(nonmoveValue),
        grandPct: totalStockValue > 0 ? Math.round((nonmoveValue / totalStockValue) * 100) : 0,
      },
      storeCategories,
    });
  } catch (error: any) {
    console.error("Error in /api/viewer/one-day:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load 1-day analysis" },
      { status: 500 }
    );
  }
}
