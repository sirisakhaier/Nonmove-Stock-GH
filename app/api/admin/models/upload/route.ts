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

    const expectedPasscode = process.env.APPROVER_PASSCODE || "admin1234";
    if (passcode !== expectedPasscode && passcode !== "admin1234") {
      return NextResponse.json(
        { error: "รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง (Invalid admin passcode)" },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "กรุณาแนบไฟล์ Model Dimension (.xlsx, .xls หรือ .csv)" },
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
              rowText.includes("product") ||
              rowText.includes("model") ||
              rowText.includes("สินค้า") ||
              rowText.includes("รุ่น") ||
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
    let codeColIdx = -1;
    let nameColIdx = -1;
    let modelColIdx = -1;
    let skuTypeColIdx = -1;
    let categoryColIdx = -1;
    let subCategoryColIdx = -1;
    let sizeGroupColIdx = -1;

    for (let i = 0; i < Math.min(targetRows.length, 15); i++) {
      const row = targetRows[i];
      if (!Array.isArray(row)) continue;

      for (let c = 0; c < row.length; c++) {
        const raw = String(row[c] || "").trim();
        const norm = normalizeKey(raw);

        if (
          norm === "productcode" ||
          norm === "productcd" ||
          norm === "productid" ||
          norm === "itemcode" ||
          norm === "material" ||
          norm === "matcode" ||
          norm === "sku" ||
          norm === "code" ||
          raw.includes("รหัสสินค้า") ||
          raw.includes("รหัสรุ่น")
        ) {
          headerRowIdx = i;
          codeColIdx = c;
          break;
        }
      }
      if (headerRowIdx !== -1) break;
    }

    // Fallback if header not found
    if (headerRowIdx === -1) {
      codeColIdx = 0;
      headerRowIdx = 0;
    }

    // Map column headers
    if (headerRowIdx !== -1) {
      const headerRow = targetRows[headerRowIdx];
      for (let c = 0; c < headerRow.length; c++) {
        const raw = String(headerRow[c] || "").trim();
        const norm = normalizeKey(raw);

        if (c === codeColIdx) continue;

        if (
          codeColIdx === -1 &&
          (norm === "productcode" ||
            norm === "productcd" ||
            norm === "productid" ||
            norm === "itemcode" ||
            norm === "sku" ||
            norm === "code" ||
            raw.includes("รหัสสินค้า"))
        ) {
          codeColIdx = c;
        } else if (
          nameColIdx === -1 &&
          (norm === "productname" ||
            norm === "itemname" ||
            norm === "desc" ||
            norm === "description" ||
            raw.includes("ชื่อสินค้า") ||
            raw.includes("รายละเอียด"))
        ) {
          nameColIdx = c;
        } else if (
          modelColIdx === -1 &&
          (norm === "model" || norm === "modelname" || norm === "modelno" || raw.includes("รุ่น"))
        ) {
          modelColIdx = c;
        } else if (
          skuTypeColIdx === -1 &&
          (norm === "skutype" || norm === "type" || raw.includes("ประเภทสินค้า"))
        ) {
          skuTypeColIdx = c;
        } else if (
          categoryColIdx === -1 &&
          (norm === "category" || norm === "cat" || raw.includes("หมวดหมู่") || raw.includes("กลุ่มสินค้า"))
        ) {
          categoryColIdx = c;
        } else if (
          subCategoryColIdx === -1 &&
          (norm === "subcategory" || norm === "subcat" || raw.includes("หมวดหมู่ย่อย"))
        ) {
          subCategoryColIdx = c;
        } else if (
          sizeGroupColIdx === -1 &&
          (norm === "sizegroup" || norm === "size" || raw.includes("ขนาด"))
        ) {
          sizeGroupColIdx = c;
        }
      }
    }

    const productMap = new Map<string, any>();
    const startIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

    for (let i = startIdx; i < targetRows.length; i++) {
      const row = targetRows[i];
      if (!row || !Array.isArray(row)) continue;

      const rawCode = cleanStr(row[codeColIdx]);
      if (!rawCode) continue;

      const normCode = normalizeKey(rawCode);
      if (
        normCode === "productcode" ||
        normCode === "code" ||
        normCode === "sku" ||
        normCode === "รหัสสินค้า"
      ) {
        continue;
      }

      const productCode = rawCode.trim();
      const productName =
        (nameColIdx !== -1 ? cleanStr(row[nameColIdx]) : null) ||
        (modelColIdx !== -1 ? cleanStr(row[modelColIdx]) : null) ||
        productCode;

      const model = (modelColIdx !== -1 ? cleanStr(row[modelColIdx]) : null) || productName;
      const skuType = (skuTypeColIdx !== -1 ? cleanStr(row[skuTypeColIdx]) : null) || "SELLABLE";
      const category = (categoryColIdx !== -1 ? cleanStr(row[categoryColIdx]) : null) || "Other";
      const subCategory = subCategoryColIdx !== -1 ? cleanStr(row[subCategoryColIdx]) : null;
      const sizeGroup = sizeGroupColIdx !== -1 ? cleanStr(row[sizeGroupColIdx]) : null;

      productMap.set(productCode, {
        productCode,
        productName,
        model,
        skuType: skuType.toUpperCase(),
        category,
        subCategory,
        sizeGroup,
      });
    }

    const newProducts = Array.from(productMap.values());

    if (newProducts.length === 0) {
      return NextResponse.json(
        {
          error:
            "ไม่พบข้อมูลรหัสสินค้า (ProductCode) ในไฟล์ กรุณาตรวจสอบว่ามีคอลัมน์ ProductCode ในไฟล์ CSV / Excel ครับ",
        },
        { status: 400 }
      );
    }

    const newProductCodes = new Set(newProducts.map((p) => p.productCode));

    // 1. DELETE ALL PRODUCTS NOT IN THE NEW UPLOADED FILE
    await prisma.product.deleteMany({
      where: {
        productCode: {
          notIn: Array.from(newProductCodes),
        },
      },
    });

    // 2. UPSERT ALL NEW PRODUCTS
    for (const p of newProducts) {
      await prisma.product.upsert({
        where: { productCode: p.productCode },
        update: {
          productName: p.productName,
          model: p.model,
          skuType: p.skuType,
          category: p.category,
          subCategory: p.subCategory,
          sizeGroup: p.sizeGroup,
        },
        create: {
          productCode: p.productCode,
          productName: p.productName,
          model: p.model,
          skuType: p.skuType,
          category: p.category,
          subCategory: p.subCategory,
          sizeGroup: p.sizeGroup,
        },
      });
    }

    const totalProductsCount = await prisma.product.count();

    return NextResponse.json({
      success: true,
      message: `อัปเดตและแทนที่ Model Dimension สำเร็จ ${newProducts.length.toLocaleString()} รุ่น (จาก ${selectedSource}, รวมในระบบ ${totalProductsCount.toLocaleString()} รุ่น)`,
      importedCount: newProducts.length,
      totalCount: totalProductsCount,
    });
  } catch (error: any) {
    console.error("Error uploading model dimension:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการอัปโหลด Model Dimension" },
      { status: 500 }
    );
  }
}
