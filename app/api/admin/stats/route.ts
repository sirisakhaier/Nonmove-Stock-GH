import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const totalStores = await prisma.store.count();
    const totalProducts = await prisma.product.count();
    const totalFactRows = await prisma.nonMoveRow.count();
    const totalSessions = await prisma.userSession.count();
    const totalRequests = await prisma.skuRequest.count();

    const pendingRequests = await prisma.skuRequest.count({ where: { status: "PENDING" } });
    const approvedRequests = await prisma.skuRequest.count({ where: { status: "APPROVED" } });
    const rejectedRequests = await prisma.skuRequest.count({ where: { status: "REJECTED" } });

    const dateRecords = await prisma.nonMoveRow.groupBy({
      by: ["reportDate"],
      _count: {
        _all: true,
      },
      orderBy: {
        reportDate: "desc",
      },
    });

    const snapshots = dateRecords.map((d) => ({
      date: d.reportDate.toISOString().split("T")[0],
      rowCount: d._count._all,
    }));

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error("Error in /api/admin/stats:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch admin stats" }, { status: 500 });
  }
}
