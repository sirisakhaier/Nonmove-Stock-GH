import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  console.log("--> Loading Store Dimension...");
  const filePath = findFile([
    path.join(process.cwd(), "data/seed/Dimension Store GH.csv"),
    path.join(process.cwd(), "Dimension Store GH.csv"),
    path.join(process.cwd(), "data/seed/Dimension_Store_GH.csv"),
    path.join(process.cwd(), "Dimension_Store_GH.csv"),
  ]);

  if (!filePath) {
    console.warn("⚠️ Store dimension file not found. Skipping store load.");
    return;
  }

  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = xlsx.utils.sheet_to_json<StoreRecord>(sheet);

  let count = 0;
  for (const r of records) {
    const branchCode = toStr(r.BranchCode);
    if (!branchCode) continue;
    await prisma.store.upsert({
      where: { branchCode },
      update: {
        storeNameCust: toStr(r.STORE_NAME_CUST) || branchCode,
        storeId: toStr(r.STORE_ID),
        storeName: toStr(r.STORE_NAME),
        province: toStr(r.PROVINCE),
        storeType: toStr(r.STORE_TYPE) || "STORE",
        region: toStr(r.REGION) || "OTHER",
      },
      create: {
        branchCode,
        storeNameCust: toStr(r.STORE_NAME_CUST) || branchCode,
        storeId: toStr(r.STORE_ID),
        storeName: toStr(r.STORE_NAME),
        province: toStr(r.PROVINCE),
        storeType: toStr(r.STORE_TYPE) || "STORE",
        region: toStr(r.REGION) || "OTHER",
      },
    });
    count++;
  }
  console.log(`✅ Loaded ${count} stores.`);
}

export async function loadProducts() {
  console.log("--> Loading Product Dimension...");
  const filePath = findFile([
    path.join(process.cwd(), "data/seed/Dimension Model GH.csv"),
    path.join(process.cwd(), "Dimension Model GH.csv"),
    path.join(process.cwd(), "data/seed/Dimension_Model_GH.csv"),
    path.join(process.cwd(), "Dimension_Model_GH.csv"),
  ]);

  if (!filePath) {
    console.warn("⚠️ Product dimension file not found. Skipping product load.");
    return;
  }

  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = xlsx.utils.sheet_to_json<ProductRecord>(sheet);

  let count = 0;
  for (const r of records) {
    const productCode = toStr(r.ProductCode);
    if (!productCode) continue;
    await prisma.product.upsert({
      where: { productCode },
      update: {
        productName: toStr(r.ProductName) || productCode,
        model: toStr(r.MODEL),
        skuType: toStr(r.SKU_TYPE) || "SELLABLE",
        category: toStr(r.CATEGORY),
        subCategory: toStr(r.SUB_CATEGORY),
        sizeGroup: toStr(r.SIZE_GROUP),
      },
      create: {
        productCode,
        productName: toStr(r.ProductName) || productCode,
        model: toStr(r.MODEL),
        skuType: toStr(r.SKU_TYPE) || "SELLABLE",
        category: toStr(r.CATEGORY),
        subCategory: toStr(r.SUB_CATEGORY),
        sizeGroup: toStr(r.SIZE_GROUP),
      },
    });
    count++;
  }
  console.log(`✅ Loaded ${count} products.`);
}

export function extractDateFromFilename(filename: string): Date {
  const match = filename.match(/NonMoveReport[ _]?(\d{4})(\d{2})(\d{2})\.xlsx/i);
  if (match) {
    const [_, year, month, day] = match;
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }
  return new Date();
}

export async function processNonmoveExcel(filePath: string, explicitDate?: Date) {
  const filename = path.basename(filePath);
  const reportDate = explicitDate || extractDateFromFilename(filename);
  console.log(`--> Ingesting daily report: ${filename} (Date: ${reportDate.toISOString().split("T")[0]})`);

  const workbook = xlsx.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json<any>(sheet);

  console.log(`Found ${rows.length} rows in ${filename}. Processing...`);

  // Ensure fallback stores and products exist
  const existingStores = new Set((await prisma.store.findMany({ select: { branchCode: true } })).map((s) => s.branchCode));
  const existingProducts = new Set((await prisma.product.findMany({ select: { productCode: true } })).map((p) => p.productCode));

  const missingStores = new Map<string, string>();
  const missingProducts = new Map<string, string>();

  for (const row of rows) {
    const branchCode = String(row["BranchCode"] || "").trim();
    const productCode = String(row["ProductCode"] || "").trim();
    const branchName = String(row["BranchName"] || branchCode).trim();
    const productName = String(row["ProductName"] || productCode).trim();

    if (branchCode && !existingStores.has(branchCode)) {
      missingStores.set(branchCode, branchName);
    }
    if (productCode && !existingProducts.has(productCode)) {
      missingProducts.set(productCode, productName);
    }
  }

  // Insert missing stores
  for (const [branchCode, branchName] of Array.from(missingStores.entries())) {
    await prisma.store.upsert({
      where: { branchCode },
      update: {},
      create: {
        branchCode,
        storeNameCust: branchName,
        storeName: branchName,
        storeType: "STORE",
        region: "OTHER",
      },
    });
    existingStores.add(branchCode);
  }

  // Insert missing products
  for (const [productCode, productName] of Array.from(missingProducts.entries())) {
    await prisma.product.upsert({
      where: { productCode },
      update: {},
      create: {
        productCode,
        productName,
        skuType: "SELLABLE",
      },
    });
    existingProducts.add(productCode);
  }

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

  const nonMoveData = rows
    .filter((r) => r["BranchCode"] && r["ProductCode"])
    .map((r) => ({
      reportDate,
      nonmoveDaysBucket: String(r["Nonmove Days"] || "30-60").trim(),
      agingDaysBucket: String(r["Aging Days"] || "0-180").trim(),
      branchCode: String(r["BranchCode"]).trim(),
      productCode: String(r["ProductCode"]).trim(),
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
    }));

  console.log(`--> Deleting existing fact rows for date: ${reportDate.toISOString().split("T")[0]}`);
  await prisma.nonMoveRow.deleteMany({
    where: {
      reportDate: {
        gte: new Date(reportDate.setHours(0, 0, 0, 0)),
        lte: new Date(reportDate.setHours(23, 59, 59, 999)),
      },
    },
  });

  const BATCH_SIZE = 1000;
  for (let i = 0; i < nonMoveData.length; i += BATCH_SIZE) {
    const chunk = nonMoveData.slice(i, i + BATCH_SIZE);
    await prisma.nonMoveRow.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`Inserted chunk ${i + 1} - ${Math.min(i + BATCH_SIZE, nonMoveData.length)} / ${nonMoveData.length}`);
  }

  console.log(`🎉 Ingestion complete for ${filename}: ${nonMoveData.length} rows inserted.`);
  return { filename, reportDate, rowsCount: nonMoveData.length };
}

export async function runETL() {
  try {
    await loadStores();
    await loadProducts();

    const args = process.argv.slice(2);
    let explicitFile: string | null = null;
    let explicitDate: Date | null = null;

    for (const arg of args) {
      if (arg.startsWith("--file=")) {
        explicitFile = arg.replace("--file=", "").trim();
      }
      if (arg.startsWith("--date=")) {
        const dStr = arg.replace("--date=", "").trim();
        explicitDate = new Date(`${dStr}T00:00:00.000Z`);
      }
    }

    if (explicitFile && fs.existsSync(explicitFile)) {
      await processNonmoveExcel(explicitFile, explicitDate || undefined);
    } else {
      const searchDirs = [
        path.join(process.cwd(), "data/seed"),
        path.join(process.cwd(), "Data Setup"),
        process.cwd(),
      ];

      const seenFiles = new Set<string>();
      for (const dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (/NonMoveReport[ _]?\d{8}\.xlsx/i.test(file)) {
            const fullPath = path.join(dir, file);
            if (!seenFiles.has(file)) {
              seenFiles.add(file);
              await processNonmoveExcel(fullPath);
            }
          }
        }
      }
    }

    console.log("✅ All ETL tasks completed successfully!");
  } catch (error) {
    console.error("❌ ETL Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runETL();
}
