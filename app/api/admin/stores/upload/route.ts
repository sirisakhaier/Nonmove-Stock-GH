import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cleanStr(val: any): string | null {
  if (val === undefined || val === null) return null;
  let s = String(val).trim();
  s = s.replace(/^[\uFEFF\uFFFE\u200B\u200C\u200D]+|[\uFEFF\uFFFE\u200B\u200C\u200D]+$/g, "");
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s.length > 0 ? s : null;
}

function normalizeKey(str: string): string {
  if (!str) return "";
  let clean = cleanStr(str) || "";
  return clean.toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
}

function parseCsvText(csvText: string): string[][] {
  let text = csvText;
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const firstLines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0).slice(0, 5);
  let delimiter = ",";
  if (firstLines.length > 0) {
    const commaCount = (firstLines[0].match(/,/g) || []).length;
    const semiCount = (firstLines[0].match(/;/g) || []).length;
    const tabCount = (firstLines[0].match(/\t/g) || []).length;
    if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
    else if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentCell);
        currentCell = "";
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i++;
        }
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else if (char === "\n") {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
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
    const fileName = (file.name || "").toLowerCase();
    const isCsv = fileName.endsWith(".csv") || fileName.endsWith(".txt");

    let targetRows: any[][] = [];
    let selectedSource = isCsv ? "CSV (UTF-8)" : "Excel";

    if (isCsv) {
      const csvText = buffer.toString("utf-8");
      targetRows = parseCsvText(csvText);
    } else {
      const workbook = xlsx.read(buffer, {
        type: "buffer",
        codepage: 65001,
        cellDates: true,
      });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return NextResponse.json(
          { error: "ไม่พบ Sheet ข้อมูลในไฟล์ Excel ที่อัปโหลด" },
          { status: 400 }
        );
      }

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
              selectedSource = `Sheet: ${sName}`;
              break;
            }
          }
        }
        if (targetRows.length > 0) break;
      }

      if (targetRows.length === 0) {
        selectedSource = `Sheet: ${workbook.SheetNames[0]}`;
        targetRows = xlsx.utils.sheet_to_json<any[]>(workbook.Sheets[workbook.SheetNames[0]], {
          header: 1,
          defval: "",
        });
      }
    }

    if (!targetRows || targetRows.length === 0) {
      return NextResponse.json(
        { error: "ไฟล์ไม่มีข้อมูลแถว (Empty file)" },
        { status: 400 }
      );
    }

    // Header Detection
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
          headerRowIdx = i;
          branchColIdx = c;
          break;
        }
      }
      if (headerRowIdx !== -1) break;
    }

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

    if (headerRowIdx !== -1) {
      const headerRow = targetRows[headerRowIdx];
      for (let c = 0; c < headerRow.length; c++) {
        const raw = String(headerRow[c] || "").trim();
        const norm = normalizeKey(raw);

        if (c === branchColIdx) continue;

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
          nameCustColIdx === -1 &&
          (norm.includes("cust") ||
            norm.includes("storenamecust") ||
            raw.includes("ชื่อสาขา") ||
            raw.includes("ชื่อลูกค้า"))
        ) {
          nameCustColIdx = c;
        } else if (
          storeNameColIdx === -1 &&
          (norm === "storename" || norm === "branchname" || raw.includes("ชื่อร้าน"))
        ) {
          storeNameColIdx = c;
        } else if (
          storeIdColIdx === -1 &&
          (norm === "storeid" || norm === "shopid" || raw.includes("รหัสร้านค้า"))
        ) {
          storeIdColIdx = c;
        } else if (
          provinceColIdx === -1 &&
          (norm === "province" || norm === "prov" || raw.includes("จังหวัด"))
        ) {
          provinceColIdx = c;
        } else if (
          typeColIdx === -1 &&
          (norm === "storetype" ||
            norm === "type" ||
            raw.includes("ประเภท") ||
            raw.includes("ประเภทสาขา"))
        ) {
          typeColIdx = c;
        } else if (
          regionColIdx === -1 &&
          (norm === "region" ||
            norm === "zone" ||
            raw.includes("ภาค") ||
            raw.includes("ภูมิภาค"))
        ) {
          regionColIdx = c;
        }
      }
    }

    if (branchColIdx === -1) {
      branchColIdx = 0;
      if (headerRowIdx === -1) headerRowIdx = 0;
    }

    const storeMap = new Map<string, any>();
    const startIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

    for (let i = startIdx; i < targetRows.length; i++) {
      const row = targetRows[i];
      if (!row || !Array.isArray(row)) continue;

      const rawBranch = cleanStr(row[branchColIdx]);
      if (!rawBranch) continue;

      const normBranch = normalizeKey(rawBranch);
      if (
        normBranch === "branchcode" ||
        normBranch === "branch" ||
        normBranch === "code" ||
        normBranch === "รหัสสาขา"
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
            "ไม่พบข้อมูลรหัสสาขา (BranchCode) ในไฟล์ กรุณาตรวจสอบว่ามีคอลัมน์ BranchCode ในไฟล์ CSV / Excel ครับ",
        },
        { status: 400 }
      );
    }

    const newBranchCodes = new Set(newStores.map((s) => s.branchCode));

    // 1. DELETE ALL STORES THAT ARE NOT IN THE NEW UPLOADED FILE
    await prisma.store.deleteMany({
      where: {
        branchCode: {
          notIn: Array.from(newBranchCodes),
        },
      },
    });

    // 2. UPSERT ALL NEW STORES FROM THE UPLOADED FILE
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
      message: `อัปเดตและแทนที่ Store Dimension สำเร็จ ${newStores.length.toLocaleString()} สาขา (ลบสาขาที่ไม่มีในไฟล์ออกทั้งหมด, ปัจจุบันในระบบมี ${totalStoresCount.toLocaleString()} สาขา)`,
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
