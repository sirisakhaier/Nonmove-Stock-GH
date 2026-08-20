export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get("branchCode");
    const region = searchParams.get("region");
    const status = searchParams.get("status");
    const sessionId = searchParams.get("sessionId");

    const whereClause: any = {};

    if (branchCode) {
      whereClause.branchCode = branchCode;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (sessionId) {
      whereClause.requestedById = sessionId;
    }

    if (region && region !== "ALL") {
      whereClause.store = {
        region,
      };
    }

    const requests = await prisma.skuRequest.findMany({
      where: whereClause,
      include: {
        store: true,
        product: true,
        requestedBy: true,
        photos: true,
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Error in GET /api/requests:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      branchCode,
      productCode,
      requestType,
      reason,
      comments,
      photoUrls,
      photos,
      requestedById,
    } = body;

    if (!branchCode || !productCode || !reason) {
      return NextResponse.json(
        { error: "branchCode, productCode, and reason are required." },
        { status: 400 }
      );
    }

    // Combine photos list
    const rawPhotos = photoUrls || photos || [];
    const normalizedPhotos = rawPhotos.map((p: any) => (typeof p === "string" ? p : p.url || p.photoUrl)).filter(Boolean);

    // Ensure session exists or create fallback
    let finalSessionId = requestedById;
    if (!finalSessionId) {
      const fallbackSession = await prisma.userSession.findFirst({
        where: { branchCode },
        orderBy: { createdAt: "desc" },
      });
      if (fallbackSession) {
        finalSessionId = fallbackSession.id;
      } else {
        const newSession = await prisma.userSession.create({
          data: {
            name: "Store Staff",
            phone: "0000000000",
            branchCode,
            region: "OTHER",
          },
        });
        finalSessionId = newSession.id;
      }
    }

    // Create SkuRequest with comments and photos
    const request = await prisma.skuRequest.create({
      data: {
        branchCode,
        productCode,
        requestType: requestType === "EXPLAIN" ? "EXPLAIN" : "EXCLUDE",
        reason: reason.trim(),
        comments: comments ? String(comments).trim() : null,
        status: "PENDING",
        requestedById: finalSessionId,
        photos: {
          create: normalizedPhotos.map((url: string) => ({ url })),
        },
      },
      include: {
        photos: true,
        product: true,
        store: true,
        requestedBy: true,
      },
    });

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    console.error("Error in POST /api/requests:", error);
    return NextResponse.json({ error: error.message || "Failed to create request" }, { status: 500 });
  }
}
