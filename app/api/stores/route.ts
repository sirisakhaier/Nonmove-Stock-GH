import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region");

    const whereClause: any = {
      storeType: {
        not: "DC",
      },
    };

    if (region) {
      whereClause.region = region;
    }

    const stores = await prisma.store.findMany({
      where: whereClause,
      select: {
        branchCode: true,
        storeNameCust: true,
        storeName: true,
        province: true,
        region: true,
        storeType: true,
      },
      orderBy: {
        branchCode: "asc",
      },
    });

    return NextResponse.json({ stores });
  } catch (error: any) {
    console.error("Error fetching stores:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch stores" }, { status: 500 });
  }
}
