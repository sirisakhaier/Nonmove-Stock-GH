import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyNonmove, NONMOVE_BUCKET_ORDER, getWorstBucket, mapTo4Buckets } from "@/lib/nonmoveConfig";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get("branchCode");
    const reportDateStr = searchParams.get("date");
    const category = searchParams.get("category");
    const nonmoveDays = searchParams.get("bucket") || searchParams.get("nonmoveDays");
    const skuType = searchParams.get("skuType");
    const status = searchParams.get("status"); // ALL, HIGH, OK
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");

    if (!branchCode) {
      return NextResponse.json({ error: "branchCode is required" }, { status: 400 });
    }

    let targetDate: Date;
    if (reportDateStr) {
      targetDate = new Date(reportDateStr);
    } else {
      const latestRow = await prisma.nonMoveRow.findFirst({
        where: { branchCode },
        orderBy: { reportDate: "desc" },
        select: { reportDate: true },
      });
      targetDate = latestRow?.reportDate || new Date();
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause: any = {
      branchCode,
      reportDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { productCode: { contains: q, mode: "insensitive" } },
        { product: { productName: { contains: q, mode: "insensitive" } } },
        { product: { model: { contains: q, mode: "insensitive" } } },
      ];
    }

    const rows = await prisma.nonMoveRow.findMany({
      where: whereClause,
      select: {
        productCode: true,
        stockQty: true,
        stockValue: true,
        nonmoveDaysBucket: true,
        agingDaysBucket: true,
        categoryName: true,
        designName: true,
        typeName: true,
        mosLevel: true,
        priceNormal: true,
        product: {
          select: {
            productName: true,
            model: true,
            skuType: true,
            category: true,
            subCategory: true,
            sizeGroup: true,
          },
        },
      },
    });

    const requests = await prisma.skuRequest.findMany({
      where: {
        branchCode,
      },
      include: {
        photos: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    const requestMap = new Map<string, typeof requests[0]>();
    for (const reqItem of requests) {
      if (!requestMap.has(reqItem.productCode)) {
        requestMap.set(reqItem.productCode, reqItem);
      }
    }

    // Filter parsers
    let allowedCats: Set<string> | null = null;
    if (category && category !== "ALL") {
      allowedCats = new Set(category.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
    }

    let allowedTypes: Set<string> | null = null;
    if (skuType && skuType !== "ALL") {
      allowedTypes = new Set(skuType.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
    }

    let allowedBuckets: Set<string> | null = null;
    if (nonmoveDays && nonmoveDays !== "ALL") {
      allowedBuckets = new Set<string>(nonmoveDays.split(",").map((s) => mapTo4Buckets(s.trim())).filter(Boolean));
    }

    const modelMap = new Map<string, {
      productCode: string;
      productName: string;
      model: string;
      skuType: string;
      categoryName: string;
      subCategory: string;
      sizeGroup: string;
      nonmoveDaysBucket: string;
      agingDaysBucket: string;
      stockQty: number;
      stockValue: number;
      mosLevel: number | null;
      priceNormal: number | null;
      allBuckets: string[];
      classification: "HIGH" | "OK";
      isExcluded: boolean;
      activeRequest: any | null;
    }>();

    for (const r of rows) {
      const pCode = r.productCode;
      const cat = r.product?.category?.trim().toUpperCase() || r.categoryName?.trim().toUpperCase() || "OTHER";
      const sType = r.product?.skuType?.trim().toUpperCase() || "SELLABLE";

      // Filter by Category
      if (allowedCats && !allowedCats.has(cat)) continue;

      // Filter by SKU Type
      if (allowedTypes && !allowedTypes.has(sType)) continue;

      const existing = modelMap.get(pCode);
      const reqInfo = requestMap.get(pCode) || null;
      const isExcluded = reqInfo?.status === "APPROVED" && reqInfo?.requestType === "EXCLUDE";
      const mappedBucket = mapTo4Buckets(r.nonmoveDaysBucket);

      if (!existing) {
        modelMap.set(pCode, {
          productCode: pCode,
          productName: r.product?.productName || pCode,
          model: r.product?.model || r.designName || "-",
          skuType: sType,
          categoryName: cat,
          subCategory: r.product?.subCategory || r.typeName || "-",
          sizeGroup: r.product?.sizeGroup || "-",
          nonmoveDaysBucket: mappedBucket,
          agingDaysBucket: r.agingDaysBucket,
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          mosLevel: r.mosLevel,
          priceNormal: r.priceNormal,
          allBuckets: [mappedBucket],
          classification: classifyNonmove(mappedBucket),
          isExcluded,
          activeRequest: reqInfo,
        });
      } else {
        existing.stockQty += r.stockQty;
        existing.stockValue += r.stockValue;
        existing.allBuckets.push(mappedBucket);
        existing.nonmoveDaysBucket = getWorstBucket(existing.allBuckets);
        existing.classification = classifyNonmove(existing.nonmoveDaysBucket);
      }
    }

    let modelList = Array.from(modelMap.values());

    // Filter by bucket if specified
    if (allowedBuckets) {
      modelList = modelList.filter((m) => allowedBuckets.has(m.nonmoveDaysBucket));
    }

    let highCount = 0;
    let okCount = 0;
    for (const m of modelList) {
      if (m.classification === "HIGH") highCount++;
      else okCount++;
    }

    if (status && status !== "ALL") {
      modelList = modelList.filter((m) => m.classification === status);
    }

    const total = modelList.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = modelList.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      highCount,
      okCount,
    });
  } catch (error: any) {
    console.error("Error in /api/nonmove:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
