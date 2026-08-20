import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { processNonmoveExcel, loadStores, loadProducts } from "@/scripts/etl/loadData";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const passcode = formData.get("passcode") as string;

    const expectedPasscode = process.env.APPROVER_PASSCODE || "admin123";
    if (passcode !== expectedPasscode) {
      return NextResponse.json({ error: "Invalid admin passcode." }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "No Excel file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, file.name);
    fs.writeFileSync(tempFilePath, buffer);

    await loadStores();
    await loadProducts();
    const result = await processNonmoveExcel(tempFilePath);

    fs.unlinkSync(tempFilePath);

    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${result.rowsCount} rows for date ${result.reportDate.toISOString().split("T")[0]}`,
      result,
    });
  } catch (error: any) {
    console.error("Error in /api/admin/etl:", error);
    return NextResponse.json({ error: error.message || "ETL upload failed" }, { status: 500 });
  }
}
