import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: {
        storeType: {
          not: "DC",
        },
      },
      select: {
        region: true,
      },
      distinct: ["region"],
      orderBy: {
        region: "asc",
      },
    });

    const regions = stores
      .map((s) => s.region?.trim())
      .filter((r): r is string => Boolean(r) && r !== "OTHER" && r !== "Other" && r !== "null" && r !== "undefined");

    return NextResponse.json({ regions });
  } catch (error: any) {
    console.error("Error fetching regions:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch regions" }, { status: 500 });
  }
}
