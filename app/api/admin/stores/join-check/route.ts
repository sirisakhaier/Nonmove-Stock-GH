import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFromCache, setInCache } from "@/lib/apiCache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cacheKey = "admin_stores_join_check";
    const cached = getFromCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 1. Get all distinct BranchCodes from NonMoveRows (Daily Stock Report)
    const stockRows = await prisma.nonMoveRow.findMany({
      select: {
        branchCode: true,
        branchShort: true,
        branchName: true,
        stockQty: true,
        stockValue: true,
        productCode: true,
      },
    });

    const branchStockMap = new Map<string, {
      branchCode: string;
      branchShort: string;
      branchName: string;
      stockQty: number;
      stockValue: number;
      products: Set<string>;
    }>();

    for (const r of stockRows) {
      if (!branchStockMap.has(r.branchCode)) {
        branchStockMap.set(r.branchCode, {
          branchCode: r.branchCode,
          branchShort: r.branchShort || r.branchCode,
          branchName: r.branchName || r.branchCode,
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          products: new Set([r.productCode]),
        });
      } else {
        const item = branchStockMap.get(r.branchCode)!;
        item.stockQty += r.stockQty;
        item.stockValue += r.stockValue;
        item.products.add(r.productCode);
      }
    }

    const totalStockBranches = branchStockMap.size;

    // 2. Get all Master Stores
    const masterStores = await prisma.store.findMany({
      select: {
        branchCode: true,
        storeNameCust: true,
        storeName: true,
        province: true,
        region: true,
        storeType: true,
      },
    });

    const masterMap = new Map<string, any>();
    for (const s of masterStores) {
      masterMap.set(s.branchCode, s);
    }

    const totalMasterStores = masterStores.length;

    // 3. Perform Join Analysis
    let matchedCount = 0;
    let matchedValue = 0;
    let matchedQty = 0;

    let unmatchedCount = 0;
    let unmatchedValue = 0;
    let unmatchedQty = 0;

    const unmatchedList: any[] = [];
    const matchedList: any[] = [];

    for (const [code, stock] of branchStockMap.entries()) {
      if (masterMap.has(code)) {
        matchedCount++;
        matchedValue += stock.stockValue;
        matchedQty += stock.stockQty;
        matchedList.push({
          branchCode: code,
          storeNameCust: masterMap.get(code)?.storeNameCust,
          province: masterMap.get(code)?.province,
          region: masterMap.get(code)?.region,
          stockQty: stock.stockQty,
          stockValue: Math.round(stock.stockValue),
          skuCount: stock.products.size,
          isMatched: true,
        });
      } else {
        unmatchedCount++;
        unmatchedValue += stock.stockValue;
        unmatchedQty += stock.stockQty;
        unmatchedList.push({
          branchCode: code,
          storeNameCust: stock.branchName || stock.branchShort || "ไม่พบใน Store Master",
          province: "-",
          region: "OTHER",
          stockQty: stock.stockQty,
          stockValue: Math.round(stock.stockValue),
          skuCount: stock.products.size,
          isMatched: false,
        });
      }
    }

    unmatchedList.sort((a, b) => b.stockValue - a.stockValue);
    matchedList.sort((a, b) => b.stockValue - a.stockValue);

    const matchRatePct = totalStockBranches > 0 ? Math.round((matchedCount / totalStockBranches) * 100) : 100;

    const result = {
      totalStockBranches,
      totalMasterStores,
      matchedCount,
      matchedValue: Math.round(matchedValue),
      matchedQty,
      unmatchedCount,
      unmatchedValue: Math.round(unmatchedValue),
      unmatchedQty,
      matchRatePct,
      isFullyMatched: unmatchedCount === 0,
      unmatchedList,
      matchedSample: matchedList.slice(0, 50),
    };
    setInCache(cacheKey, result, 120_000);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error checking store join:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify store join" },
      { status: 500 }
    );
  }
}
