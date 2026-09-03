import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/apiCache";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const passcode = req.headers.get("x-admin-passcode") || searchParams.get("passcode");

    const expectedPasscode = process.env.APPROVER_PASSCODE || "admin1234";
    if (passcode !== expectedPasscode) {
      return NextResponse.json({ error: "รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง" }, { status: 401 });
    }

    if (!dateStr) {
      return NextResponse.json({ error: "กรุณาระบุวันที่ที่ต้องการลบ (date=YYYY-MM-DD)" }, { status: 400 });
    }

    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const deleteResult = await prisma.nonMoveRow.deleteMany({
      where: {
        reportDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    invalidateCache();

    return NextResponse.json({
      success: true,
      message: `ลบข้อมูลรายงานวันที่ ${dateStr} เรียบร้อยแล้ว (จำนวน ${deleteResult.count} แถว)`,
      deletedCount: deleteResult.count,
    });
  } catch (error: any) {
    console.error("Error deleting snapshot:", error);
    return NextResponse.json({ error: error.message || "ลบข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
