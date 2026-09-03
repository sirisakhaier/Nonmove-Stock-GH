import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFromCache, setInCache } from "@/lib/apiCache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cacheKey = "admin_stats_overview";
    const cached = getFromCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const [
      totalStores,
      totalProducts,
      totalFactRows,
      totalSessions,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      dateRecords,
    ] = await Promise.all([
      prisma.store.count(),
      prisma.product.count(),
      prisma.nonMoveRow.count(),
      prisma.userSession.count(),
      prisma.skuRequest.count(),
      prisma.skuRequest.count({ where: { status: "PENDING" } }),
      prisma.skuRequest.count({ where: { status: "APPROVED" } }),
      prisma.skuRequest.count({ where: { status: "REJECTED" } }),
      prisma.nonMoveRow.groupBy({
        by: ["reportDate"],
        _count: {
          _all: true,
        },
        _sum: {
          stockQty: true,
          stockValue: true,
        },
        orderBy: {
          reportDate: "desc",
        },
      }),
    ]);

    const snapshots = dateRecords.map((d) => ({
      date: d.reportDate.toISOString().split("T")[0],
      count: d._count._all,
      rowCount: d._count._all,
      totalQty: d._sum?.stockQty || 0,
      totalValue: Math.round(d._sum?.stockValue || 0),
    }));

    const result = {
      totalStores,
      totalProducts,
      totalFactRows,
      totalSessions,
      totalRequests,
      requestsBreakdown: {
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
      },
      snapshots,
    };

    setInCache(cacheKey, result, 60_000);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in /api/admin/stats:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch admin stats" }, { status: 500 });
  }
}
