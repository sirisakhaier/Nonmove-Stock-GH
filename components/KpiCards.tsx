import React from "react";
import { Package, Layers, DollarSign, AlertTriangle } from "lucide-react";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/validators";

interface KpiData {
  totalSkus?: number;
  totalStockQty?: number;
  totalStockValue?: number;
  highNonmoveRatio?: number;
  highCount?: number;
  okCount?: number;
  overallOkPct?: number;
  excludedCount?: number;
}

export function KpiCards({ data = {} }: { data?: KpiData }) {
  const totalSkus = data?.totalSkus || 0;
  const totalStockQty = data?.totalStockQty || 0;
  const totalStockValue = data?.totalStockValue || 0;
  const highNonmoveRatio = data?.highNonmoveRatio || 0;
  const highCount = data?.highCount || 0;
  const okCount = data?.okCount || 0;
  const isCritical = highNonmoveRatio > 30;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total SKUs */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            จำนวนรายการสินค้า
          </span>
          <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/60 p-2.5 text-blue-600 dark:text-blue-400">
            <Package className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatNumber(totalSkus)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">SKU</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          รายการสินค้าที่ไม่เคลื่อนไหวในสาขา
        </p>
      </div>

      {/* Total Units */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            จำนวนชิ้นสต๊อก
          </span>
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 p-2.5 text-indigo-600 dark:text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatNumber(totalStockQty)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">ชิ้น</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          จำนวนคงเหลือรวมทุกช่วงวัน
        </p>
      </div>

      {/* Total Value */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            มูลค่าสต๊อกรวม (บาท)
          </span>
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalStockValue)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          มูลค่าต้นทุนสินค้าไม่เคลื่อนไหว
        </p>
      </div>

      {/* High Non-Move Ratio */}
      <div className={`rounded-3xl border p-5 shadow-sm hover:shadow-md transition-all ${
        isCritical
          ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isCritical ? "text-rose-700 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"
          }`}>
            สัดส่วนสินค้าค้างนานวิกฤต
          </span>
          <div className={`rounded-2xl p-2.5 ${
            isCritical ? "bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400" : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-black ${
            isCritical ? "text-rose-700 dark:text-rose-300" : "text-slate-900 dark:text-white"
          }`}>
            {formatPercent(highNonmoveRatio)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">(High Bucket)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-rose-600 dark:text-rose-400 font-bold">🔥 วิกฤต: {highCount} SKU</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">✅ ปกติ: {okCount} SKU</span>
        </div>
      </div>
    </div>
  );
}
