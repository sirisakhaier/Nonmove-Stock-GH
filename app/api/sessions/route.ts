import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateThaiPhone } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, branchCode, region } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter your name (min 2 characters)." }, { status: 400 });
    }

    if (!phone || !validateThaiPhone(phone)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number (e.g. 0812345678)." }, { status: 400 });
    }

    if (!branchCode) {
      return NextResponse.json({ error: "Branch code is required." }, { status: 400 });
    }

    const session = await prisma.userSession.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        branchCode: branchCode.trim(),
        region: region?.trim() || "OTHER",
      },
    });

    const response = NextResponse.json({ success: true, session });
    // Set cookie for automatic session restore
    response.cookies.set("nonmove_session", JSON.stringify({
      sessionId: session.id,
      name: session.name,
      phone: session.phone,
      branchCode: session.branchCode,
      region: session.region,
    }), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: error.message || "Failed to create session" }, { status: 500 });
  }
}
