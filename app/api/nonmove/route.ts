export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyNonmove, NONMOVE_BUCKET_ORDER, getWorstBucket } from "@/lib/nonmoveConfig";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get("branchCode");
    const reportDateStr = searchParams.get("date") || searchParams.get("reportDate");
    const category = searchParams.get("category");
    const nonmoveDays = searchParams.get("nonmoveDaysBucket") || searchParams.get("nonmoveDays");
    const agingDays = searchParams.get("agingDaysBucket") || searchParams.get("agingDays");
    const skuType = searchParams.get("skuType"); // SELLABLE, MOCK_UP, ALL
    const search = searchParams.get("search");
    const statusFilter = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "25", 10));

    if (!branchCode) {
      return NextResponse.json({ error: "branchCode is required" }, { status: 400 });
    }

    // Determine report date
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

    if (category && category !== "ALL") {
      whereClause.OR = [
        { categoryName: category },
        { product: { category } },
      ];
    }

    if (nonmoveDays && nonmoveDays !== "ALL") {
      whereClause.nonmoveDaysBucket = nonmoveDays;
    }

    if (agingDays && agingDays !== "ALL") {
      whereClause.agingDaysBucket = agingDays;
    }

    if (skuType && skuType !== "ALL") {
      whereClause.product = {
        ...whereClause.product,
        skuType,
      };
    }

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
      include: {
        product: true,
      },
    });

    // Fetch active requests for this store
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

    // Group rows by ProductCode for model-level status
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
      const existing = modelMap.get(pCode);
      const reqInfo = requestMap.get(pCode) || null;
      const isExcluded = reqInfo?.status === "APPROVED" && reqInfo?.requestType === "EXCLUDE";

      if (!existing) {
        modelMap.set(pCode, {
          productCode: pCode,
          productName: r.product?.productName || pCode,
          model: r.product?.model || r.designName || "-",
          skuType: r.product?.skuType || "SELLABLE",
          categoryName: r.categoryName || r.product?.category || "Other",
          subCategory: r.product?.subCategory || r.typeName || "-",
          sizeGroup: r.product?.sizeGroup || "-",
          nonmoveDaysBucket: r.nonmoveDaysBucket,
          agingDaysBucket: r.agingDaysBucket,
          stockQty: r.stockQty,
          stockValue: r.stockValue,
          mosLevel: r.mosLevel,
          priceNormal: r.priceNormal,
          allBuckets: [r.nonmoveDaysBucket],
          classification: classifyNonmove(r.nonmoveDaysBucket),
          isExcluded,
          activeRequest: reqInfo,
        });
      } else {
        existing.stockQty += r.stockQty;
        existing.stockValue += r.stockValue;
        existing.allBuckets.push(r.nonmoveDaysBucket);
        existing.nonmoveDaysBucket = getWorstBucket(existing.allBuckets);
        existing.classification = classifyNonmove(existing.nonmoveDaysBucket);
      }
    }

    let modelList = Array.from(modelMap.values());

    // Compute live % High vs % OK for this filtered view
    let highCount = 0;
    let okCount = 0;
    for (const m of modelList) {
      if (!m.isExcluded) {
        if (m.classification === "HIGH") highCount++;
        else okCount++;
      }
    }
    const activeCount = highCount + okCount;
    const highPct = activeCount > 0 ? Math.round((highCount / activeCount) * 100) : 0;
    const okPct = activeCount > 0 ? 100 - highPct : 0;

    // Apply status filter
    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "HIGH") {
        modelList = modelList.filter((m) => m.classification === "HIGH" && !m.isExcluded);
      } else if (statusFilter === "OK") {
        modelList = modelList.filter((m) => m.classification === "OK" && !m.isExcluded);
      } else if (statusFilter === "EXCLUDED") {
        modelList = modelList.filter((m) => m.isExcluded);
      } else if (statusFilter === "NO_REQUEST") {
        modelList = modelList.filter((m) => !m.activeRequest);
      } else if (statusFilter === "PENDING") {
        modelList = modelList.filter((m) => m.activeRequest?.status === "PENDING");
      } else if (statusFilter === "APPROVED") {
        modelList = modelList.filter((m) => m.activeRequest?.status === "APPROVED");
      } else if (statusFilter === "REJECTED") {
        modelList = modelList.filter((m) => m.activeRequest?.status === "REJECTED");
      } else if (statusFilter === "EXPLAINED") {
        modelList = modelList.filter((m) => m.activeRequest?.status === "EXPLAINED" || m.activeRequest?.requestType === "EXPLAIN");
      }
    }

    // Sort by stockValue descending by default
    modelList.sort((a, b) => b.stockValue - a.stockValue);

    const totalCount = modelList.length;
    const startIndex = (page - 1) * limit;
    const paginated = modelList.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      reportDate: targetDate.toISOString().split("T")[0],
      total: totalCount,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      data: paginated,
      items: paginated,
      highPct,
      okPct,
    });
  } catch (error: any) {
    console.error("Error in /api/nonmove:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch non-move data" }, { status: 500 });
  }
}
