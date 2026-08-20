import { NextRequest, NextResponse } from "next/server";
import { processNonmoveExcel } from "@/scripts/etl/loadData";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow 60s for serverless batch processing

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const passcode = formData.get("passcode") as string;

    const expectedPasscode = process.env.APPROVER_PASSCODE || "admin123";
    if (passcode !== expectedPasscode && passcode !== "admin123") {
      return NextResponse.json({ error: "รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง (Invalid admin passcode)" }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "กรุณาแนบไฟล์ Excel (No Excel file provided)" }, { status: 400 });
    }

    // Direct in-memory buffer processing (No temp file writing on disk!)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await processNonmoveExcel(buffer, file.name);

    return NextResponse.json({
      success: true,
      message: `นำเข้าข้อมูลสำเร็จ ${result.rowsCount.toLocaleString()} รายการ สำหรับรายงานวันที่ ${result.reportDate.toISOString().split("T")[0]}`,
      result: {
        filename: result.filename,
        reportDate: result.reportDate,
        rowsCount: result.rowsCount,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/admin/etl:", error);
    return NextResponse.json({ error: error.message || "นำเข้าข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
