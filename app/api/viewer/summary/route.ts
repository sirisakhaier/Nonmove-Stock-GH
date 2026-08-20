import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NONMOVE_BUCKET_ORDER, classifyNonmove, getWorstBucket } from "@/lib/nonmoveConfig";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regionParam = searchParams.get("region") || "ALL";
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
        kpis: {
          totalSkus: 0,
          totalStores: 0,
          totalStockQty: 0,
          totalStockValue: 0,
          highNonmoveRatio: 0,
          okRatio: 0,
          highValue: 0,
          highQty: 0,
          highSkuCount: 0,
        },
        periodBreakdown: [],
        categoryBreakdown: [],
        regionBreakdown: [],
        top20Stores: [],
        top20Models: [],
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

    // 2. Stores filter
    const storeWhere: any = {
      storeType: { not: "DC" },
      branchCode: { notIn: ["GH-001", "GH-002", "GH-003"] },
    };

    if (regionParam !== "ALL") {
      storeWhere.region = regionParam;
    }

    const allStores = await prisma.store.findMany({
      where: storeWhere,
      select: { branchCode: true, storeNameCust: true, storeName: true, region: true, province: true },
    });

    const storeMap = new Map<string, typeof allStores[0]>();
    for (const s of allStores) {
      storeMap.set(s.branchCode, s);
    }
    const storeCodes = Array.from(storeMap.keys());

    // 3. Fetch NonMove Rows
    const rowWhere: any = {
      branchCode: { in: storeCodes },
      reportDate: { gte: startOfDay, lte: endOfDay },
    };

    if (categoryParam !== "ALL") {
      rowWhere.OR = [
        { categoryName: categoryParam },
        { product: { category: categoryParam } },
      ];
    }

    const rows = await prisma.nonMoveRow.findMany({
      where: rowWhere,
      include: {
        product: true,
      },
    });

    // 4. Period Map
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

    // 5. Maps for Category, Region, Store, and Model Analysis
    const catMap = new Map<string, {
      category: string;
      skus: Set<string>;
      branches: Set<string>;
      stockQty: number;
      stockValue: number;
      highValue: number;
      highQty: number;
    }>();

    const regMap = new Map<string, {
      region: string;
      stores: Set<string>;
      skus: Set<string>;
      stockQty: number;
      stockValue: number;
      highValue: number;
      highQty: number;
    }>();

    const storeAggMap = new Map<string, {
      branchCode: string;
      storeName: string;
      region: string;
      skus: Set<string>;
      stockQty: number;
      stockValue: number;
      highValue: number;
      highQty: number;
    }>();

    const modelAggMap = new Map<string, {
      productCode: string;
      productName: string;
      model: string;
      skuType: string;
      category: string;
      subCategory: string;
      nonmoveDaysBucket: string;
      allBuckets: string[];
      stockQty: number;
      stockValue: number;
      branches: Set<string>;
      classification: "HIGH" | "OK";
    }>();

    let grandTotalValue = 0;
    let grandTotalQty = 0;
    const grandSkus = new Set<string>();
    const grandBranches = new Set<string>();
    const categorySet = new Set<string>();

    for (const r of rows) {
      const b = r.nonmoveDaysBucket || "30-60";
      const isHigh = classifyNonmove(b) === "HIGH";
      const sInfo = storeMap.get(r.branchCode);
      const storeRegion = sInfo?.region || "OTHER";
      const storeName = sInfo?.storeNameCust || sInfo?.storeName || r.branchCode;
      const catName = r.product?.category || r.categoryName || "Other";

      // Period Map
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

      // Grand totals
      grandTotalValue += r.stockValue;
      grandTotalQty += r.stockQty;
      grandSkus.add(r.productCode);
      grandBranches.add(r.branchCode);
      if (catName) categorySet.add(catName);

      // Category Map
      if (!catMap.has(catName)) {
        catMap.set(catName, {
          category: catName,
          skus: new Set([r.productCode]),
          branches: new Set([r.branchCode]),
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          highValue: isHigh ? r.stockValue : 0,
          highQty: isHigh ? r.stockQty : 0,
        });
      } else {
        const c = catMap.get(catName)!;
        c.skus.add(r.productCode);
        c.branches.add(r.branchCode);
        c.stockQty += r.stockQty;
        c.stockValue += r.stockValue;
        if (isHigh) {
          c.highValue += r.stockValue;
          c.highQty += r.stockQty;
        }
      }

      // Region Map
      if (!regMap.has(storeRegion)) {
        regMap.set(storeRegion, {
          region: storeRegion,
          stores: new Set([r.branchCode]),
          skus: new Set([r.productCode]),
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          highValue: isHigh ? r.stockValue : 0,
          highQty: isHigh ? r.stockQty : 0,
        });
      } else {
        const reg = regMap.get(storeRegion)!;
        reg.stores.add(r.branchCode);
        reg.skus.add(r.productCode);
        reg.stockQty += r.stockQty;
        reg.stockValue += r.stockValue;
        if (isHigh) {
          reg.highValue += r.stockValue;
          reg.highQty += r.stockQty;
        }
      }

      // Store Map
      if (!storeAggMap.has(r.branchCode)) {
        storeAggMap.set(r.branchCode, {
          branchCode: r.branchCode,
          storeName,
          region: storeRegion,
          skus: new Set([r.productCode]),
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          highValue: isHigh ? r.stockValue : 0,
          highQty: isHigh ? r.stockQty : 0,
        });
      } else {
        const st = storeAggMap.get(r.branchCode)!;
        st.skus.add(r.productCode);
        st.stockQty += r.stockQty;
        st.stockValue += r.stockValue;
        if (isHigh) {
          st.highValue += r.stockValue;
          st.highQty += r.stockQty;
        }
      }

      // Model Map
      if (!modelAggMap.has(r.productCode)) {
        modelAggMap.set(r.productCode, {
          productCode: r.productCode,
          productName: r.product?.productName || r.productCode,
          model: r.product?.model || r.designName || "-",
          skuType: r.product?.skuType || "SELLABLE",
          category: catName,
          subCategory: r.product?.subCategory || r.typeName || "-",
          nonmoveDaysBucket: b,
          allBuckets: [b],
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          branches: new Set([r.branchCode]),
          classification: classifyNonmove(b),
        });
      } else {
        const m = modelAggMap.get(r.productCode)!;
        m.stockQty += r.stockQty;
        m.stockValue += r.stockValue;
        m.branches.add(r.branchCode);
        m.allBuckets.push(b);
        m.nonmoveDaysBucket = getWorstBucket(m.allBuckets);
        m.classification = classifyNonmove(m.nonmoveDaysBucket);
      }
    }

    // 6. Format Period Breakdown
    let highValue = 0;
    let highQty = 0;
    let highSkuCount = 0;

    const periodBreakdown = NONMOVE_BUCKET_ORDER.map((b) => {
      const p = periodMap.get(b)!;
      const val = Math.round(p.stockValue);
      const qty = p.stockQty;
      const skuCount = p.skus.size;
      const storeCount = p.branches.size;

      if (p.classification === "HIGH") {
        highValue += val;
        highQty += qty;
        highSkuCount += skuCount;
      }

      return {
        period: b,
        label: `${b} วัน`,
        skuCount,
        stockQty: qty,
        stockValue: val,
        storeCount,
        valuePct: grandTotalValue > 0 ? Math.round((val / grandTotalValue) * 100) : 0,
        qtyPct: grandTotalQty > 0 ? Math.round((qty / grandTotalQty) * 100) : 0,
        skuPct: grandSkus.size > 0 ? Math.round((skuCount / grandSkus.size) * 100) : 0,
        classification: p.classification,
      };
    });

    const highNonmoveRatio = grandTotalValue > 0 ? Math.round((highValue / grandTotalValue) * 100) : 0;
    const okRatio = 100 - highNonmoveRatio;

    // 7. Format Category Breakdown Table
    const categoryBreakdown = Array.from(catMap.values())
      .map((c) => ({
        category: c.category,
        totalSkus: c.skus.size,
        branchCount: c.branches.size,
        stockQty: c.stockQty,
        stockValue: Math.round(c.stockValue),
        highValue: Math.round(c.highValue),
        highQty: c.highQty,
        highPct: c.stockValue > 0 ? Math.round((c.highValue / c.stockValue) * 100) : 0,
        sharePct: grandTotalValue > 0 ? Math.round((c.stockValue / grandTotalValue) * 100) : 0,
      }))
      .sort((a, b) => b.stockValue - a.stockValue);

    // 8. Format Region Breakdown Table
    const regionBreakdown = Array.from(regMap.values())
      .map((r) => ({
        region: r.region,
        storeCount: r.stores.size,
        totalSkus: r.skus.size,
        stockQty: r.stockQty,
        stockValue: Math.round(r.stockValue),
        highValue: Math.round(r.highValue),
        highQty: r.highQty,
        highPct: r.stockValue > 0 ? Math.round((r.highValue / r.stockValue) * 100) : 0,
        sharePct: grandTotalValue > 0 ? Math.round((r.stockValue / grandTotalValue) * 100) : 0,
      }))
      .sort((a, b) => b.stockValue - a.stockValue);

    // 9. Format Top 20 Stores (High Non-Move Stores)
    const top20Stores = Array.from(storeAggMap.values())
      .map((st) => ({
        branchCode: st.branchCode,
        storeName: st.storeName,
        region: st.region,
        totalSkus: st.skus.size,
        stockQty: st.stockQty,
        stockValue: Math.round(st.stockValue),
        highValue: Math.round(st.highValue),
        highQty: st.highQty,
        highPct: st.stockValue > 0 ? Math.round((st.highValue / st.stockValue) * 100) : 0,
      }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 20);

    // 10. Format Top 20 Models (High Non-Move Models)
    const top20Models = Array.from(modelAggMap.values())
      .map((m) => ({
        productCode: m.productCode,
        productName: m.productName,
        model: m.model,
        skuType: m.skuType,
        category: m.category,
        subCategory: m.subCategory,
        nonmoveDaysBucket: m.nonmoveDaysBucket,
        stockQty: m.stockQty,
        stockValue: Math.round(m.stockValue),
        branchCount: m.branches.size,
        classification: m.classification,
      }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 20);

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
      categoryBreakdown,
      regionBreakdown,
      top20Stores,
      top20Models,
      categories: Array.from(categorySet).sort(),
    });
  } catch (error: any) {
    console.error("Error in /api/viewer/summary:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch viewer summary" }, { status: 500 });
  }
}
