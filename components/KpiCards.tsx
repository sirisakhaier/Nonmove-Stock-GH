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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Total SKUs */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            รายการสินค้า
          </span>
          <div className="rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 p-1.5 sm:p-2.5 text-blue-600 dark:text-blue-400">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatNumber(totalSkus)}
          </span>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">SKU</span>
        </div>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">
          ไม่เคลื่อนไหวในสาขา
        </p>
      </div>

      {/* 2. Total Units */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            จำนวนสต๊อก
          </span>
          <div className="rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 p-1.5 sm:p-2.5 text-indigo-600 dark:text-indigo-400">
            <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatNumber(totalStockQty)}
          </span>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">ชิ้น</span>
        </div>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">
          คงเหลือรวมทุกช่วงวัน
        </p>
      </div>

      {/* 3. Total Value */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            มูลค่าสต๊อกรวม
          </span>
          <div className="rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 p-1.5 sm:p-2.5 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">
            {formatCurrency(totalStockValue)}
          </span>
        </div>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">
          มูลค่าต้นทุนคงเหลือ
        </p>
      </div>

      {/* 4. High Non-Move Ratio */}
      <div className={`rounded-2xl sm:rounded-3xl border p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all ${
        isCritical
          ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate ${
            isCritical ? "text-rose-700 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"
          }`}>
            สินค้าวิกฤต (&gt;90 วัน)
          </span>
          <div className={`rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 ${
            isCritical
              ? "bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-400"
              : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
          }`}>
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
          <span className={`text-xl sm:text-3xl font-black ${
            isCritical ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
          }`}>
            {formatPercent(highNonmoveRatio)}
          </span>
        </div>
        <p className={`mt-0.5 sm:mt-1 text-[10px] sm:text-xs truncate ${
          isCritical ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-400 dark:text-slate-500"
        }`}>
          {highCount} จาก {totalSkus} SKU
        </p>
      </div>
    </div>
  );
}
