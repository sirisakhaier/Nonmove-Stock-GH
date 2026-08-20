import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const request = await prisma.skuRequest.findUnique({
      where: { id: params.id },
      include: {
        store: true,
        product: true,
        requestedBy: true,
        photos: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ request });
  } catch (error: any) {
    console.error("Error in GET /api/requests/[id]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch request" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      status,
      reviewComment,
      reviewedByName,
      reason,
      photoUrls,
      requestType,
      isResubmission,
    } = body;

    // If this is a user re-submitting after REVISE
    if (isResubmission || status === "PENDING") {
      const updateData: any = {
        status: "PENDING",
        reason: reason ? reason.trim() : undefined,
        requestType: requestType || undefined,
        requestedAt: new Date(),
      };

      if (photoUrls && Array.isArray(photoUrls) && photoUrls.length > 0) {
        updateData.photos = {
          create: photoUrls.map((url: string) => ({ url })),
        };
      }

      const updated = await prisma.skuRequest.update({
        where: { id: params.id },
        data: updateData,
        include: {
          store: true,
          product: true,
          requestedBy: true,
          photos: true,
        },
      });

      return NextResponse.json({ success: true, request: updated });
    }

    // Admin decision (APPROVED, REJECTED, REVISE)
    if (!["APPROVED", "REJECTED", "REVISE"].includes(status)) {
      return NextResponse.json({ error: "สถานะต้องเป็น APPROVED, REJECTED หรือ REVISE" }, { status: 400 });
    }

    if ((status === "REJECTED" || status === "REVISE") && (!reviewComment || !reviewComment.trim())) {
      return NextResponse.json({
        error: status === "REVISE"
          ? "กรุณาระบุรายละเอียดที่ต้องการให้สาขาแก้ไขหรือแนบเพิ่มเติม"
          : "กรุณาระบุเหตุผลการไม่อนุมัติ"
      }, { status: 400 });
    }

    const updated = await prisma.skuRequest.update({
      where: { id: params.id },
      data: {
        status: status as any,
        reviewComment: reviewComment?.trim() || null,
        reviewedByName: reviewedByName?.trim() || "HQ Admin",
        reviewedAt: new Date(),
      },
      include: {
        store: true,
        product: true,
        requestedBy: true,
        photos: true,
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error("Error in PATCH /api/requests/[id]:", error);
    return NextResponse.json({ error: error.message || "Failed to update request" }, { status: 500 });
  }
}
