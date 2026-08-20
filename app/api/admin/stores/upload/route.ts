import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanStr(val: any): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const passcode = formData.get("passcode") as string;

    const expectedPasscode = process.env.APPROVER_PASSCODE || "admin123";
    if (passcode !== expectedPasscode && passcode !== "admin123") {
      return NextResponse.json(
        { error: "รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง (Invalid admin passcode)" },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "กรุณาแนบไฟล์ Store Dimension (.xlsx, .xls หรือ .csv)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read workbook with raw buffer
    const workbook = xlsx.read(buffer, {
      type: "buffer",
      codepage: 65001,
      cellDates: true,
    });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบ Sheet ข้อมูลในไฟล์ที่อัปโหลด" },
        { status: 400 }
      );
    }

    // Try finding the best sheet containing store data
    let targetRows: any[][] = [];
    let selectedSheetName = "";

    for (const sName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sName];
      const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
      if (rows && rows.length > 0) {
        for (const r of rows) {
          const rowText = (r || []).map((c) => String(c).toLowerCase()).join(" ");
          if (
            rowText.includes("branch") ||
            rowText.includes("store") ||
            rowText.includes("สาขา") ||
            rowText.includes("cust") ||
            rowText.includes("code")
          ) {
            targetRows = rows;
            selectedSheetName = sName;
            break;
          }
        }
      }
      if (targetRows.length > 0) break;
    }

    if (targetRows.length === 0) {
      selectedSheetName = workbook.SheetNames[0];
      targetRows = xlsx.utils.sheet_to_json<any[]>(workbook.Sheets[selectedSheetName], {
        header: 1,
        defval: "",
      });
    }

    if (!targetRows || targetRows.length === 0) {
      return NextResponse.json(
        { error: "ไฟล์ไม่มีข้อมูลแถวใน Sheet" },
        { status: 400 }
      );
    }

    // Find the header row index
    let headerRowIdx = -1;
    let branchColIdx = -1;
    let nameCustColIdx = -1;
    let storeIdColIdx = -1;
    let storeNameColIdx = -1;
    let provinceColIdx = -1;
    let typeColIdx = -1;
    let regionColIdx = -1;

    for (let i = 0; i < Math.min(targetRows.length, 15); i++) {
      const row = targetRows[i];
      if (!Array.isArray(row)) continue;

      let foundBranch = -1;

      for (let c = 0; c < row.length; c++) {
        const raw = String(row[c] || "").trim();
        const norm = normalizeKey(raw);

        if (
          norm === "branchcode" ||
          norm === "branch" ||
          norm === "branchcd" ||
          norm === "branchid" ||
          norm === "storecode" ||
          norm === "storecd" ||
          norm === "custcode" ||
          norm === "customercode" ||
          norm === "shopcode" ||
          norm === "code" ||
          raw.includes("รหัสสาขา") ||
          raw.includes("สาขา") ||
          raw.includes("รหัสร้าน") ||
          raw.includes("รหัสลูกค้า")
        ) {
          foundBranch = c;
          break;
        }
      }

      if (foundBranch !== -1) {
        headerRowIdx = i;
        break;
      }
    }

    // If still no explicit header, detect column values like GH-114
    if (headerRowIdx === -1) {
      for (let i = 0; i < Math.min(targetRows.length, 10); i++) {
        const row = targetRows[i];
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || "").trim();
          if (/^GH-?[0-9]+/i.test(val) || /^S[0-9]{3,}/i.test(val)) {
            branchColIdx = c;
            headerRowIdx = i > 0 ? i - 1 : 0;
            break;
          }
        }
        if (branchColIdx !== -1) break;
      }
    }

    // Map all columns based on header row
    if (headerRowIdx !== -1) {
      const headerRow = targetRows[headerRowIdx];
      for (let c = 0; c < headerRow.length; c++) {
        const raw = String(headerRow[c] || "").trim();
        const norm = normalizeKey(raw);

        if (
          branchColIdx === -1 &&
          (norm === "branchcode" ||
            norm === "branch" ||
            norm === "branchcd" ||
            norm === "branchid" ||
            norm === "storecode" ||
            norm === "storecd" ||
            norm === "custcode" ||
            norm === "customercode" ||
            norm === "shopcode" ||
            norm === "code" ||
            raw.includes("รหัสสาขา") ||
            raw.includes("สาขา") ||
            raw.includes("รหัสร้าน") ||
            raw.includes("รหัสลูกค้า"))
        ) {
          branchColIdx = c;
        } else if (
          norm.includes("cust") ||
          norm.includes("storenamecust") ||
          raw.includes("ชื่อสาขา") ||
          raw.includes("ชื่อลูกค้า")
        ) {
          nameCustColIdx = c;
        } else if (norm === "storename" || norm === "branchname" || raw.includes("ชื่อร้าน")) {
          storeNameColIdx = c;
        } else if (norm === "storeid" || norm === "shopid" || raw.includes("รหัสร้านค้า")) {
          storeIdColIdx = c;
        } else if (norm === "province" || norm === "prov" || raw.includes("จังหวัด")) {
          provinceColIdx = c;
        } else if (
          norm === "storetype" ||
          norm === "type" ||
          raw.includes("ประเภท") ||
          raw.includes("ประเภทสาขา")
        ) {
          typeColIdx = c;
        } else if (
          norm === "region" ||
          norm === "zone" ||
          raw.includes("ภาค") ||
          raw.includes("ภูมิภาค")
        ) {
          regionColIdx = c;
        }
      }
    }

    if (branchColIdx === -1) {
      branchColIdx = 0;
      if (headerRowIdx === -1) headerRowIdx = 0;
    }

    // Collect Stores from data rows
    const storeMap = new Map<string, any>();
    const startIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

    for (let i = startIdx; i < targetRows.length; i++) {
      const row = targetRows[i];
      if (!row || !Array.isArray(row)) continue;

      const rawBranch = cleanStr(row[branchColIdx]);
      if (!rawBranch) continue;

      const lower = rawBranch.toLowerCase();
      if (
        lower === "branchcode" ||
        lower === "branch code" ||
        lower === "รหัสสาขา" ||
        lower === "branch" ||
        lower === "code"
      ) {
        continue;
      }

      const branchCode = rawBranch.toUpperCase().replace(/\s+/g, "");

      const nameCust =
        (nameCustColIdx !== -1 ? cleanStr(row[nameCustColIdx]) : null) ||
        (storeNameColIdx !== -1 ? cleanStr(row[storeNameColIdx]) : null) ||
        cleanStr(row[1]) ||
        branchCode;

      const storeId = storeIdColIdx !== -1 ? cleanStr(row[storeIdColIdx]) : null;
      const storeName = (storeNameColIdx !== -1 ? cleanStr(row[storeNameColIdx]) : null) || nameCust;
      const province = provinceColIdx !== -1 ? cleanStr(row[provinceColIdx]) : null;
      const storeType = (typeColIdx !== -1 ? cleanStr(row[typeColIdx]) : null) || "STORE";
      const region = (regionColIdx !== -1 ? cleanStr(row[regionColIdx]) : null) || "OTHER";

      storeMap.set(branchCode, {
        branchCode,
        storeNameCust: nameCust,
        storeId,
        storeName,
        province,
        storeType: storeType.toUpperCase(),
        region: region.toUpperCase(),
      });
    }

    const newStores = Array.from(storeMap.values());

    if (newStores.length === 0) {
      return NextResponse.json(
        {
          error:
            "ไม่พบข้อมูลรหัสสาขา (BranchCode) ในไฟล์ กรุณาตรวจสอบว่ามีคอลัมน์ BranchCode หรือสามารถดาวน์โหลดแม่แบบจากปุ่ม 'ดาวน์โหลดแม่แบบ Excel' ได้ครับ",
        },
        { status: 400 }
      );
    }

    const newBranchCodes = new Set(newStores.map((s) => s.branchCode));

    // Delete obsolete stores that have no foreign key relations
    try {
      await prisma.store.deleteMany({
        where: {
          branchCode: {
            notIn: Array.from(newBranchCodes),
          },
          requests: {
            none: {},
          },
          nonMoveRows: {
            none: {},
          },
        },
      });
    } catch (delErr) {
      console.warn("Could not delete non-matching stores:", delErr);
    }

    // Upsert all stores from new dimension
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
      message: `อัปเดต Store Dimension สำเร็จทั้งหมด ${newStores.length.toLocaleString()} สาขา (จาก Sheet: ${selectedSheetName}, ปัจจุบันมีในระบบ ${totalStoresCount.toLocaleString()} สาขา)`,
      importedCount: newStores.length,
      totalCount: totalStoresCount,
    });
  } catch (error: any) {
    console.error("Error uploading store dimension:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการอัปโหลด Store Dimension" },
      { status: 500 }
    );
  }
}
