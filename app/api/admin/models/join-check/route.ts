import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Get all distinct ProductCodes from NonMoveRows (Daily Stock Report)
    const stockRows = await prisma.nonMoveRow.findMany({
      select: {
        productCode: true,
        categoryName: true,
        stockQty: true,
        stockValue: true,
        branchCode: true,
      },
    });

    // Aggregate by ProductCode from NonMoveRows
    const stockMap = new Map<string, {
      productCode: string;
      categoryName: string;
      stockQty: number;
      stockValue: number;
      branches: Set<string>;
    }>();

    for (const r of stockRows) {
      if (!stockMap.has(r.productCode)) {
        stockMap.set(r.productCode, {
          productCode: r.productCode,
          categoryName: r.categoryName || "Other",
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          branches: new Set([r.branchCode]),
        });
      } else {
        const item = stockMap.get(r.productCode)!;
        item.stockQty += r.stockQty;
        item.stockValue += r.stockValue;
        item.branches.add(r.branchCode);
      }
    }

    const totalStockSkus = stockMap.size;

    // 2. Get all Master Products
    const masterProducts = await prisma.product.findMany({
      select: {
        productCode: true,
        productName: true,
        model: true,
        category: true,
      },
    });

    const masterMap = new Map<string, any>();
    for (const p of masterProducts) {
      masterMap.set(p.productCode, p);
    }

    const totalMasterModels = masterProducts.length;

    // 3. Perform Join Analysis
    let matchedSkusCount = 0;
    let matchedValue = 0;
    let matchedQty = 0;

    let unmatchedSkusCount = 0;
    let unmatchedValue = 0;
    let unmatchedQty = 0;

    const unmatchedList: any[] = [];
    const matchedList: any[] = [];

    for (const [code, stock] of stockMap.entries()) {
      if (masterMap.has(code)) {
        matchedSkusCount++;
        matchedValue += stock.stockValue;
        matchedQty += stock.stockQty;
        matchedList.push({
          productCode: code,
          productName: masterMap.get(code)?.productName,
          model: masterMap.get(code)?.model,
          category: masterMap.get(code)?.category,
          stockQty: stock.stockQty,
          stockValue: Math.round(stock.stockValue),
          branchCount: stock.branches.size,
          isMatched: true,
        });
      } else {
        unmatchedSkusCount++;
        unmatchedValue += stock.stockValue;
        unmatchedQty += stock.stockQty;
        unmatchedList.push({
          productCode: code,
          productName: "ไม่พบใน Master Model",
          model: "-",
          category: stock.categoryName,
          stockQty: stock.stockQty,
          stockValue: Math.round(stock.stockValue),
          branchCount: stock.branches.size,
          isMatched: false,
        });
      }
    }

    // Sort unmatched by stockValue descending
    unmatchedList.sort((a, b) => b.stockValue - a.stockValue);
    matchedList.sort((a, b) => b.stockValue - a.stockValue);

    const matchRatePct = totalStockSkus > 0 ? Math.round((matchedSkusCount / totalStockSkus) * 100) : 100;

    return NextResponse.json({
      totalStockSkus,
      totalMasterModels,
      matchedSkusCount,
      matchedValue: Math.round(matchedValue),
      matchedQty,
      unmatchedSkusCount,
      unmatchedValue: Math.round(unmatchedValue),
      unmatchedQty,
      matchRatePct,
      isFullyMatched: unmatchedSkusCount === 0,
      unmatchedList,
      matchedSample: matchedList.slice(0, 50),
    });
  } catch (error: any) {
    console.error("Error checking model join:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify model join" },
      { status: 500 }
    );
  }
}
