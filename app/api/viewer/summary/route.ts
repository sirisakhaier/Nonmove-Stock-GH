import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NONMOVE_BUCKET_ORDER, classifyNonmove } from "@/lib/nonmoveConfig";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") || "ALL";
    const dateParam = searchParams.get("date");
    const categoryParam = searchParams.get("category") || "ALL";

    // 1. Fetch available dates
    const dateRecords = await prisma.nonMoveRow.findMany({
      select: { reportDate: true },
      distinct: ["reportDate"],
      orderBy: { reportDate: "desc" },
    });

    if (dateRecords.length === 0) {
      return NextResponse.json({
        availableDates: [],
        selectedDate: null,
        kpis: { totalSkus: 0, totalStockQty: 0, totalStockValue: 0, highNonmoveRatio: 0, highCount: 0, okCount: 0 },
        periodBreakdown: [],
        skuRanking: [],
        categories: [],
      });
    }

    const availableDates = dateRecords.map((d) => d.reportDate.toISOString().split("T")[0]);
    const targetDateStr = dateParam && availableDates.includes(dateParam) ? dateParam : availableDates[0];
    const targetDate = new Date(targetDateStr);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Filter stores by region if specified
    const storeWhere: any = {
      storeType: { not: "DC" },
      branchCode: { notIn: ["GH-001", "GH-002", "GH-003"] },
    };

    if (region !== "ALL") {
      storeWhere.region = region;
    }

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { branchCode: true, storeNameCust: true, region: true, province: true },
    });
    const storeCodes = stores.map((s) => s.branchCode);

    // 3. Fetch NonMove Rows
    const rowWhere: any = {
      branchCode: { in: storeCodes },
      reportDate: { gte: startOfDay, lte: endOfDay },
    };

    if (categoryParam !== "ALL") {
      rowWhere.categoryName = categoryParam;
    }

    const rows = await prisma.nonMoveRow.findMany({
      where: rowWhere,
      include: {
        product: true,
      },
    });

    // 4. Period (Bucket) Aggregation
    const periodMap = new Map<string, {
      period: string;
      skus: Set<string>;
      branches: Set<string>;
      stockQty: number;
      stockValue: number;
      classification: "HIGH" | "OK";
    }>();

    for (const b of NONMOVE_BUCKET_ORDER) {
      periodMap.set(b, {
        period: b,
        skus: new Set<string>(),
        branches: new Set<string>(),
        stockQty: 0,
        stockValue: 0,
        classification: classifyNonmove(b),
      });
    }

    let grandTotalValue = 0;
    let grandTotalQty = 0;
    const grandSkus = new Set<string>();
    const grandBranches = new Set<string>();
    const categorySet = new Set<string>();

    // SKU Map for Ranking
    const skuMap = new Map<string, {
      productCode: string;
      productName: string;
      model: string;
      category: string;
      subCategory: string;
      nonmoveDaysBucket: string;
      agingDaysBucket: string;
      stockQty: number;
      stockValue: number;
      branchCount: number;
      branches: Set<string>;
      classification: "HIGH" | "OK";
    }>();

    for (const r of rows) {
      const b = r.nonmoveDaysBucket || "30-60";
      if (!periodMap.has(b)) {
        periodMap.set(b, {
          period: b,
          skus: new Set<string>(),
          branches: new Set<string>(),
          stockQty: 0,
          stockValue: 0,
          classification: classifyNonmove(b),
        });
      }

      const pData = periodMap.get(b)!;
      pData.skus.add(r.productCode);
      pData.branches.add(r.branchCode);
      pData.stockQty += r.stockQty;
      pData.stockValue += r.stockValue;

      grandTotalValue += r.stockValue;
      grandTotalQty += r.stockQty;
      grandSkus.add(r.productCode);
      grandBranches.add(r.branchCode);
      if (r.categoryName) categorySet.add(r.categoryName);

      // SKU Aggregation
      if (!skuMap.has(r.productCode)) {
        skuMap.set(r.productCode, {
          productCode: r.productCode,
          productName: r.product?.productName || r.branchName || r.productCode,
          model: r.product?.model || "-",
          category: r.categoryName || r.product?.category || "Other",
          subCategory: r.product?.subCategory || "-",
          nonmoveDaysBucket: b,
          agingDaysBucket: r.agingDaysBucket || "0-180",
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          branchCount: 1,
          branches: new Set([r.branchCode]),
          classification: classifyNonmove(b),
        });
      } else {
        const item = skuMap.get(r.productCode)!;
        item.stockQty += r.stockQty;
        item.stockValue += r.stockValue;
        item.branches.add(r.branchCode);
        item.branchCount = item.branches.size;
      }
    }

    // Build Period Breakdown
    let highValue = 0;
    let highQty = 0;
    let highSkuCount = 0;

    const periodBreakdown = NONMOVE_BUCKET_ORDER.map((b) => {
      const p = periodMap.get(b) || {
        period: b,
        skus: new Set<string>(),
        branches: new Set<string>(),
        stockQty: 0,
        stockValue: 0,
        classification: classifyNonmove(b),
      };

      const value = Math.round(p.stockValue);
      const qty = p.stockQty;
      const skuCount = p.skus.size;
      const storeCount = p.branches.size;

      if (p.classification === "HIGH") {
        highValue += value;
        highQty += qty;
        highSkuCount += skuCount;
      }

      return {
        period: b,
        label: `${b} วัน`,
        skuCount,
        stockQty: qty,
        stockValue: value,
        storeCount,
        valuePct: grandTotalValue > 0 ? Math.round((value / grandTotalValue) * 100) : 0,
        qtyPct: grandTotalQty > 0 ? Math.round((qty / grandTotalQty) * 100) : 0,
        skuPct: grandSkus.size > 0 ? Math.round((skuCount / grandSkus.size) * 100) : 0,
        classification: p.classification,
      };
    });

    const highNonmoveRatio = grandTotalValue > 0 ? Math.round((highValue / grandTotalValue) * 100) : 0;
    const okRatio = 100 - highNonmoveRatio;

    // Top SKUs Ranking
    const skuRanking = Array.from(skuMap.values())
      .map((s) => ({
        productCode: s.productCode,
        productName: s.productName,
        model: s.model,
        category: s.category,
        subCategory: s.subCategory,
        nonmoveDaysBucket: s.nonmoveDaysBucket,
        agingDaysBucket: s.agingDaysBucket,
        stockQty: s.stockQty,
        stockValue: Math.round(s.stockValue),
        branchCount: s.branchCount,
        classification: s.classification,
      }))
      .sort((a, b) => b.stockValue - a.stockValue);

    return NextResponse.json({
      availableDates,
      selectedDate: targetDateStr,
      kpis: {
        totalStockValue: Math.round(grandTotalValue),
        totalStockQty: grandTotalQty,
        totalSkus: grandSkus.size,
        totalStores: grandBranches.size,
        highNonmoveRatio,
        okRatio,
        highValue,
        highQty,
        highSkuCount,
      },
      periodBreakdown,
      skuRanking,
      categories: Array.from(categorySet).sort(),
    });
  } catch (error: any) {
    console.error("Error in /api/viewer/summary:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch viewer summary" }, { status: 500 });
  }
}
