import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";
import { prisma } from "@/lib/prisma";

interface StoreRecord {
  BranchCode: string;
  STORE_NAME_CUST: string;
  STORE_ID?: string;
  STORE_NAME?: string;
  PROVINCE?: string;
  STORE_TYPE?: string;
  REGION: string;
}

interface ProductRecord {
  ProductCode: string;
  ProductName: string;
  MODEL?: string;
  SKU_TYPE?: string;
  CATEGORY?: string;
  SUB_CATEGORY?: string;
  SIZE_GROUP?: string;
}

function findFile(patterns: string[]): string | null {
  for (const p of patterns) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const toStr = (val: any): string | null => {
  if (val === undefined || val === null || val === "") return null;
  return String(val).trim() || null;
};

export async function loadStores() {
  const filePath = findFile([
    path.join(process.cwd(), "data/seed/Dimension Store GH.csv"),
    path.join(process.cwd(), "Dimension Store GH.csv"),
    path.join(process.cwd(), "data/seed/Dimension_Store_GH.csv"),
    path.join(process.cwd(), "Dimension_Store_GH.csv"),
  ]);

  if (!filePath) {
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const workbook = xlsx.read(fileContent, { type: "string", codepage: 65001 });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = xlsx.utils.sheet_to_json<StoreRecord>(sheet);

  const storeData = records
    .map((r) => {
      const branchCode = toStr(r.BranchCode);
      if (!branchCode) return null;
      return {
        branchCode,
        storeNameCust: toStr(r.STORE_NAME_CUST) || branchCode,
        storeId: toStr(r.STORE_ID),
        storeName: toStr(r.STORE_NAME),
        province: toStr(r.PROVINCE),
        storeType: toStr(r.STORE_TYPE) || "STORE",
        region: toStr(r.REGION) || "OTHER",
      };
    })
    .filter(Boolean) as any[];

  if (storeData.length > 0) {
    await prisma.store.createMany({
      data: storeData,
      skipDuplicates: true,
    });
  }
}

export async function loadProducts() {
  const filePath = findFile([
    path.join(process.cwd(), "data/seed/Dimension Model GH.csv"),
    path.join(process.cwd(), "Dimension Model GH.csv"),
    path.join(process.cwd(), "data/seed/Dimension_Model_GH.csv"),
    path.join(process.cwd(), "Dimension_Model_GH.csv"),
  ]);

  if (!filePath) {
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const workbook = xlsx.read(fileContent, { type: "string", codepage: 65001 });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = xlsx.utils.sheet_to_json<ProductRecord>(sheet);

  const productData = records
    .map((r) => {
      const productCode = toStr(r.ProductCode);
      if (!productCode) return null;
      return {
        productCode,
        productName: toStr(r.ProductName) || productCode,
        model: toStr(r.MODEL),
        skuType: toStr(r.SKU_TYPE) || "SELLABLE",
        category: toStr(r.CATEGORY),
        subCategory: toStr(r.SUB_CATEGORY),
        sizeGroup: toStr(r.SIZE_GROUP),
      };
    })
    .filter(Boolean) as any[];

  if (productData.length > 0) {
    await prisma.product.createMany({
      data: productData,
      skipDuplicates: true,
    });
  }
}

export function extractDateFromFilename(filename: string): Date {
  const match = filename.match(/NonMoveReport[ _]?(\d{4})(\d{2})(\d{2})\.xlsx/i);
  if (match) {
    const [_, year, month, day] = match;
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }
  return new Date();
}

export async function processNonmoveExcel(
  input: string | Buffer,
  customFilename?: string,
  explicitDate?: Date
) {
  const filename = customFilename || (typeof input === "string" ? path.basename(input) : "NonMoveReport.xlsx");
  const reportDate = explicitDate || extractDateFromFilename(filename);

  // 1. In-memory workbook reading (Works with Buffer or File Path)
  const workbook =
    typeof input === "string"
      ? xlsx.readFile(input, { codepage: 65001 })
      : xlsx.read(input, { type: "buffer", codepage: 65001 });

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json<any>(sheet);

  if (!rows || rows.length === 0) {
    throw new Error(`ไฟล์ Excel ไม่มีข้อมูลใน Sheet แรก (${filename})`);
  }

  // 2. High-speed Bulk Store & Product Preparation
  const storeMap = new Map<string, any>();
  const productMap = new Map<string, any>();

  const toFloat = (val: any): number | null => {
    if (val === undefined || val === null || val === "") return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const toInt = (val: any): number => {
    if (val === undefined || val === null || val === "") return 0;
    const num = parseInt(String(val), 10);
    return isNaN(num) ? 0 : num;
  };

  const nonMoveData: any[] = [];

  for (const r of rows) {
    const branchCode = String(r["BranchCode"] || "").trim();
    const productCode = String(r["ProductCode"] || "").trim();
    if (!branchCode || !productCode) continue;

    const branchName = String(r["BranchName"] || branchCode).trim();
    const productName = String(r["ProductName"] || productCode).trim();

    if (!storeMap.has(branchCode)) {
      storeMap.set(branchCode, {
        branchCode,
        storeNameCust: branchName,
        storeName: branchName,
        storeType: "STORE",
        region: "OTHER",
      });
    }

    if (!productMap.has(productCode)) {
      productMap.set(productCode, {
        productCode,
        productName,
        skuType: "SELLABLE",
        category: r["CategoryName"] ? String(r["CategoryName"]).trim() : null,
      });
    }

    nonMoveData.push({
      reportDate,
      nonmoveDaysBucket: String(r["Nonmove Days"] || "30-60").trim(),
      agingDaysBucket: String(r["Aging Days"] || "0-180").trim(),
      branchCode,
      productCode,
      branchShort: r["BranchShort"] ? String(r["BranchShort"]).trim() : null,
      branchName: r["BranchName"] ? String(r["BranchName"]).trim() : null,
      stockQty: toInt(r["Stock Qty"]),
      stockValue: toFloat(r["มูลค่าสต๊อก"]) || 0,
      branchCountForSku: toInt(r["จำนวนสาขา"]),
      totalStockQty: toInt(r["Stock Qty รวม"]),
      totalStockValue: toFloat(r["มูลค่าสต๊อกรวม"]),
      level: toFloat(r["level"]),
      fo: toFloat(r["FO"]),
      maxAs12m: toFloat(r["MAX AS (12M)"]),
      allMaxAs12m: toFloat(r["All MAX AS (12M)"]),
      mosLevel: toFloat(r["MOS level"]),
      mosMaxAs: toFloat(r["MOS (Max AS)"]),
      allMosLevel: toFloat(r["All MOS level"]),
      allMosMaxAs: toFloat(r["All MOS (Max AS)"]),
      priceNormal: toFloat(r["PriceNormal"]),
      pricePro: toFloat(r["PricePro"]),
      vendorCode: r["VendorCode"] ? String(r["VendorCode"]).trim() : null,
      vendorName: r["VendorName"] ? String(r["VendorName"]).trim() : null,
      assortment: r["Assortment"] ? String(r["Assortment"]).trim() : null,
      type: r["Type"] ? String(r["Type"]).trim() : null,
      categoryCode: r["CategoryCode"] ? String(r["CategoryCode"]).trim() : null,
      categoryName: r["CategoryName"] ? String(r["CategoryName"]).trim() : null,
      groupCode: r["GroupCode"] ? String(r["GroupCode"]).trim() : null,
      groupName: r["GroupName"] ? String(r["GroupName"]).trim() : null,
      patternCode: r["PatternCode"] ? String(r["PatternCode"]).trim() : null,
      patternName: r["PatternName"] ? String(r["PatternName"]).trim() : null,
      designCode: r["DesignCode"] ? String(r["DesignCode"]).trim() : null,
      designName: r["DesignName"] ? String(r["DesignName"]).trim() : null,
      typeCode: r["TypeCode"] ? String(r["TypeCode"]).trim() : null,
      typeName: r["TypeName"] ? String(r["TypeName"]).trim() : null,
    });
  }

  // 3. Fast Bulk Upsert Stores & Products in 2 queries total
  const uniqueStores = Array.from(storeMap.values());
  const uniqueProducts = Array.from(productMap.values());

  if (uniqueStores.length > 0) {
    await prisma.store.createMany({
      data: uniqueStores,
      skipDuplicates: true,
    });
  }

  if (uniqueProducts.length > 0) {
    await prisma.product.createMany({
      data: uniqueProducts,
      skipDuplicates: true,
    });
  }

  // 4. Delete existing records for this reportDate
  const startOfDay = new Date(reportDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(reportDate);
  endOfDay.setHours(23, 59, 59, 999);

  await prisma.nonMoveRow.deleteMany({
    where: {
      reportDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // 5. High-speed Bulk Insertion in chunks of 2,000
  const BATCH_SIZE = 2000;
  for (let i = 0; i < nonMoveData.length; i += BATCH_SIZE) {
    const chunk = nonMoveData.slice(i, i + BATCH_SIZE);
    await prisma.nonMoveRow.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  return { filename, reportDate, rowsCount: nonMoveData.length };
}

export async function runETL() {
  try {
    await loadStores();
    await loadProducts();

    const searchDirs = [
      path.join(process.cwd(), "data/seed"),
      process.cwd(),
    ];

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (/NonMoveReport[ _]?\d{8}\.xlsx/i.test(file)) {
          const fullPath = path.join(dir, file);
          await processNonmoveExcel(fullPath);
        }
      }
    }
  } catch (error) {
    console.error("ETL Failed:", error);
  }
}
