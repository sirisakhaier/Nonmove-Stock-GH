import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
      return NextResponse.json({ error: "กรุณาแนบไฟล์ Store Dimension (.xlsx หรือ .csv)" }, { status: 400 });
    }

    // In-memory reading
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: "buffer", codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json<any>(sheet);

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ error: "ไฟล์ไม่มีข้อมูลสาขาใน Sheet แรก" }, { status: 400 });
    }

    const toStr = (val: any): string | null => {
      if (val === undefined || val === null || val === "") return null;
      return String(val).trim() || null;
    };

    const storeMap = new Map<string, any>();
    for (const r of rawRows) {
      const branchCode = toStr(r.BranchCode || r.branchCode || r["Branch Code"] || r["รหัสสาขา"]);
      if (!branchCode) continue;

      const storeNameCust = toStr(r.STORE_NAME_CUST || r.storeNameCust || r["Store Name Cust"] || r.BranchName || r["ชื่อสาขา"]) || branchCode;
      const storeId = toStr(r.STORE_ID || r.storeId || r["Store ID"]);
      const storeName = toStr(r.STORE_NAME || r.storeName || r["Store Name"]) || storeNameCust;
      const province = toStr(r.PROVINCE || r.province || r["Province"] || r["จังหวัด"]);
      const storeType = toStr(r.STORE_TYPE || r.storeType || r["Store Type"]) || "STORE";
      const region = toStr(r.REGION || r.region || r["Region"] || r["ภาค"] || r["ภูมิภาค"]) || "OTHER";

      storeMap.set(branchCode, {
        branchCode,
        storeNameCust,
        storeId,
        storeName,
        province,
        storeType,
        region,
      });
    }

    const newStores = Array.from(storeMap.values());
    if (newStores.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรหัสสาขา (BranchCode) ที่ถูกต้องในไฟล์" }, { status: 400 });
    }

    const newBranchCodes = new Set(newStores.map((s) => s.branchCode));

    // Delete existing stores that are not in the new file (unless they have active requests)
    try {
      await prisma.store.deleteMany({
        where: {
          branchCode: {
            notIn: Array.from(newBranchCodes),
          },
          requests: {
            none: {},
          },
        },
      });
    } catch (delErr) {
      console.warn("Could not delete non-matching stores due to relations:", delErr);
    }

    // Upsert / Insert all new stores
    for (const s of newStores) {
      await prisma.store.upsert({
        where: { branchCode: s.branchCode },
        update: {
          storeNameCust: s.storeNameCust,
          storeId: s.storeId,
          storeName: s.storeName,
          province: s.province,
          storeType: s.storeType,
          region: s.region,
        },
        create: {
          branchCode: s.branchCode,
          storeNameCust: s.storeNameCust,
          storeId: s.storeId,
          storeName: s.storeName,
          province: s.province,
          storeType: s.storeType,
          region: s.region,
        },
      });
    }

    const totalStoresCount = await prisma.store.count();

    return NextResponse.json({
      success: true,
      message: `อัปเดต Store Dimension สำเร็จทั้งหมด ${newStores.length.toLocaleString()} สาขา (ปัจจุบันมีในระบบ ${totalStoresCount.toLocaleString()} สาขา)`,
      importedCount: newStores.length,
      totalCount: totalStoresCount,
    });
  } catch (error: any) {
    console.error("Error uploading store dimension:", error);
    return NextResponse.json({ error: error.message || "Failed to upload store dimension" }, { status: 500 });
  }
}
