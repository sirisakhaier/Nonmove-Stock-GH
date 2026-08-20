import React from "react";
import { Package, Layers, DollarSign, AlertTriangle } from "lucide-react";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/validators";

interface KpiData {
  totalSkus: number;
  totalStockQty: number;
  totalStockValue: number;
  highNonmoveRatio: number;
  highCount: number;
  okCount: number;
  overallOkPct: number;
  excludedCount?: number;
}

export function KpiCards({ data }: { data: KpiData }) {
  const isCritical = data.highNonmoveRatio > 30;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total SKUs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            จำนวนรายการสินค้า
          </span>
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Package className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {formatNumber(data.totalSkus)}
          </span>
          <span className="text-xs text-slate-500 font-medium">SKU</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          รายการสินค้าที่ไม่เคลื่อนไหวในสาขา
        </p>
      </div>

      {/* Total Units */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            จำนวนชิ้นสต๊อก
          </span>
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {formatNumber(data.totalStockQty)}
          </span>
          <span className="text-xs text-slate-500 font-medium">ชิ้น</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          จำนวนคงเหลือรวมทุกช่วงวัน
        </p>
      </div>

      {/* Total Value */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            มูลค่าสต๊อกรวม (บาท)
          </span>
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {formatCurrency(data.totalStockValue)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          มูลค่าต้นทุนสินค้าไม่เคลื่อนไหว
        </p>
      </div>

      {/* High Non-Move Ratio */}
      <div className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${
        isCritical ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            isCritical ? "text-rose-700" : "text-slate-500"
          }`}>
            สัดส่วนสินค้าค้างนานวิกฤต
          </span>
          <div className={`rounded-xl p-2.5 ${
            isCritical ? "bg-rose-100 text-rose-600" : "bg-amber-50 text-amber-600"
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-bold ${
            isCritical ? "text-rose-700" : "text-slate-900"
          }`}>
            {formatPercent(data.highNonmoveRatio)}
          </span>
          <span className="text-xs text-slate-500 font-medium">(High Bucket)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-rose-600 font-semibold">🔥 วิกฤต: {data.highCount} SKU</span>
          <span className="text-emerald-600 font-semibold">✅ ปกติ: {data.okCount} SKU</span>
        </div>
      </div>
    </div>
  );
}
