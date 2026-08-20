import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateThaiPhone } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawName = body.name || body.userName || "";
    const name = String(rawName).trim();
    const phone = String(body.phone || "").replace(/[^0-9]/g, "").trim();
    const branchCode = String(body.branchCode || "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "กรุณาระบุชื่อ-นามสกุล (อย่างน้อย 2 ตัวอักษร)" }, { status: 400 });
    }

    if (!phone || !validateThaiPhone(phone)) {
      return NextResponse.json({ error: "กรุณาระบุเบอร์โทรศัพท์มือถือ 10 หลัก (เช่น 0812345678)" }, { status: 400 });
    }

    if (!branchCode) {
      return NextResponse.json({ error: "กรุณาเลือกรหัสสาขา" }, { status: 400 });
    }

    let region = body.region ? String(body.region).trim() : null;
    if (!region || region === "OTHER") {
      const store = await prisma.store.findUnique({
        where: { branchCode },
        select: { region: true },
      });
      region = store?.region || "OTHER";
    }

    const session = await prisma.userSession.create({
      data: {
        name,
        phone,
        branchCode,
        region,
      },
    });

    const response = NextResponse.json({ success: true, session });
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
