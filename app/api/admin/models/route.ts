import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { productCode: { contains: q, mode: "insensitive" } },
        { productName: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { productCode: "asc" },
      }),
      prisma.product.count(),
    ]);

    const categories = Array.from(
      new Set((await prisma.product.findMany({ select: { category: true } })).map((p) => p.category).filter(Boolean))
    ).sort();

    return NextResponse.json({
      models: products,
      products,
      totalCount,
      categories,
    });
  } catch (error: any) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch models" },
      { status: 500 }
    );
  }
}
