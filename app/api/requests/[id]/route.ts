import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/apiCache";

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
      comments,
      photoUrls,
      photos,
      requestType,
      isResubmission,
    } = body;

    // If this is a user re-submitting after REVISE
    if (isResubmission || status === "PENDING") {
      const updateData: any = {
        status: "PENDING",
        reason: reason ? reason.trim() : undefined,
        comments: comments ? String(comments).trim() : undefined,
        requestType: requestType || undefined,
        requestedAt: new Date(),
      };

      const rawPhotos = photoUrls || photos || [];
      const normalizedPhotos = rawPhotos.map((p: any) => (typeof p === "string" ? p : p.url || p.photoUrl)).filter(Boolean);

      if (normalizedPhotos.length > 0) {
        updateData.photos = {
          create: normalizedPhotos.map((url: string) => ({ url })),
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

    invalidateCache("admin_");
    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error("Error in PATCH /api/requests/[id]:", error);
    return NextResponse.json({ error: error.message || "Failed to update request" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.skuRequest.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบรายการคำขอนี้" }, { status: 404 });
    }

    // Delete associated photos
    await prisma.requestPhoto.deleteMany({
      where: { requestId: id },
    });

    // Delete the request
    await prisma.skuRequest.delete({
      where: { id },
    });

    invalidateCache("admin_");
    return NextResponse.json({
      success: true,
      message: "ลบรายการคำขอเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/requests/[id]:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการลบคำขอ" },
      { status: 500 }
    );
  }
}

