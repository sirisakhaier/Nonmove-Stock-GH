import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { status, reviewComment, reviewedByName, passcode } = body;

    const expectedPasscode = process.env.APPROVER_PASSCODE || "admin123";
    if (passcode !== expectedPasscode) {
      return NextResponse.json({ error: "Invalid approver passcode." }, { status: 401 });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Status must be APPROVED or REJECTED." }, { status: 400 });
    }

    if (status === "REJECTED" && (!reviewComment || !reviewComment.trim())) {
      return NextResponse.json({ error: "Review comment is required when rejecting a request." }, { status: 400 });
    }

    const updated = await prisma.skuRequest.update({
      where: { id: params.id },
      data: {
        status,
        reviewComment: reviewComment?.trim() || null,
        reviewedByName: reviewedByName?.trim() || "Regional Approver",
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
