"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calendar,
  Layers,
  Package,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/validators";
import { useTheme } from "./ThemeProvider";

interface TrendProps {
  branchCode: string;
  selectedDate: string;
}

export function NonmoveTrendAnalysis({ branchCode, selectedDate }: TrendProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMovementTab, setActiveMovementTab] = useState<"CLEARED" | "NEW" | "PERSISTENT">("CLEARED");
  const { theme } = useTheme();

  useEffect(() => {
    if (!branchCode) return;
    setIsLoading(true);
    fetch(`/api/nonmove/trend?branchCode=${encodeURIComponent(branchCode)}&date=${encodeURIComponent(selectedDate || "")}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [branchCode, selectedDate]);

  if (isLoading) {
    return (
      <div className="h-72 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-pulse flex items-center justify-center text-xs text-slate-400">
        กำลังประมวลผลแนวโน้มการเปลี่ยนแปลงตามวัน (Day-by-Day Trend Analysis)...
      </div>
    );
  }

  if (!data || !data.historicalSnapshots || data.historicalSnapshots.length === 0) {
    return null;
  }

  const isDark = theme === "dark";
  const gridColor = isDark ? "#334155" : "#f1f5f9";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const tooltipText = isDark ? "#f8fafc" : "#0f172a";

  const delta = data.delta || { stockQtyDiff: 0, stockValueDiff: 0, highPctDiff: 0, skusDiff: 0 };
  const movements = data.movements || { clearedCount: 0, newCount: 0, persistentCount: 0, clearedItems: [], newItems: [], persistentItems: [] };
  const hasPrev = data.hasComparison;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-6 shadow-sm space-y-4 sm:space-y-6 transition-colors duration-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                วิเคราะห์แนวโน้มการเปลี่ยนแปลงสต๊อก (Non-Move Trend & Gap Analysis)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                เปรียบเทียบตามรอบวัน
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {hasPrev
                ? `เปรียบเทียบระหว่างรอบวันที่ ${data.currentDate} กับรอบก่อนหน้า (${data.prevDate})`
                : `ข้อมูลรอบวันที่ ${data.currentDate}`}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Day-by-Day Delta Indicator Cards */}
      {hasPrev && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Stock Value Delta */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              การเปลี่ยนแปลงมูลค่าสต๊อก
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-black ${
                delta.stockValueDiff > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : delta.stockValueDiff < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}>
                {delta.stockValueDiff > 0 ? `+${formatCurrency(delta.stockValueDiff)}` : formatCurrency(delta.stockValueDiff)}
              </span>
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {delta.stockValueDiff > 0 ? (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 font-bold">มูลค่าสต๊อกค้างเพิ่มขึ้น</span>
                </>
              ) : delta.stockValueDiff < 0 ? (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">มูลค่าสต๊อกค้างลดลง (ระบายออกดีขึ้น)</span>
                </>
              ) : (
                <>
                  <Minus className="h-3.5 w-3.5 text-slate-400" />
                  <span>ไม่มีการเปลี่ยนแปลง</span>
                </>
              )}
            </div>
          </div>

          {/* Stock Units Delta */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              การเปลี่ยนแปลงจำนวนชิ้น
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-black ${
                delta.stockQtyDiff > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : delta.stockQtyDiff < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}>
                {delta.stockQtyDiff > 0 ? `+${formatNumber(delta.stockQtyDiff)}` : formatNumber(delta.stockQtyDiff)} ชิ้น
              </span>
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {delta.stockQtyDiff > 0 ? (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 font-bold">สต๊อกชิ้นค้างเพิ่มขึ้น</span>
                </>
              ) : delta.stockQtyDiff < 0 ? (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">สต๊อกชิ้นลดลง ({Math.abs(delta.stockQtyDiff)} ชิ้น)</span>
                </>
              ) : (
                <>
                  <Minus className="h-3.5 w-3.5 text-slate-400" />
                  <span>คงที่</span>
                </>
              )}
            </div>
          </div>

          {/* Critical % High Delta */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              สัดส่วนค้างนานวิกฤต (% High)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-black ${
                delta.highPctDiff > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : delta.highPctDiff < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}>
                {delta.highPctDiff > 0 ? `+${delta.highPctDiff}%` : `${delta.highPctDiff}%`}
              </span>
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {delta.highPctDiff > 0 ? (
                <>
                  <Flame className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 font-bold">อัตราวิกฤตขยับสูงขึ้น</span>
                </>
              ) : delta.highPctDiff < 0 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">อัตราวิกฤตลดลง {Math.abs(delta.highPctDiff)}%</span>
                </>
              ) : (
                <>
                  <Minus className="h-3.5 w-3.5 text-slate-400" />
                  <span>ไม่มีการเปลี่ยนแปลง</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Historical Trend Progression Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              แนวโน้มมูลค่าสต๊อกและสัดส่วนวิกฤตตามวันที่รายงาน (Timeline Progression)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ติดตามความคืบหน้าการระบายสต๊อกในแต่ละรอบวัน
            </p>
          </div>
        </div>

        <div className="h-48 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.historicalSnapshots} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor, fontWeight: 500 }} stroke={gridColor} />
              <YAxis tick={{ fontSize: 11, fill: tickColor }} stroke={gridColor} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(val: any, name: string) => [
                  name === "totalStockValue" ? formatCurrency(Number(val)) : `${val}%`,
                  name === "totalStockValue" ? "มูลค่าสต๊อกรวม" : "สัดส่วนวิกฤต (% High)",
                ]}
                labelFormatter={(l) => `วันที่รายงาน: ${l}`}
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: "14px",
                  boxShadow: isDark ? "0 10px 25px -5px rgba(0,0,0,0.5)" : "0 10px 25px -5px rgba(0,0,0,0.1)",
                  color: tooltipText,
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="totalStockValue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="totalStockValue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. SKU Movements Tab & Tables */}
      {hasPrev && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              สถานะการเคลื่อนไหวรายสินค้า (SKU Movements Breakdown)
            </h4>

            {/* Movement Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveMovementTab("CLEARED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeMovementTab === "CLEARED"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                🟢 ระบายออกได้ ({movements.clearedCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveMovementTab("NEW")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeMovementTab === "NEW"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                🔴 กลายมาเป็น Non-Move ใหม่ ({movements.newCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveMovementTab("PERSISTENT")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeMovementTab === "PERSISTENT"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                🟡 ยังคงค้างอยู่ ({movements.persistentCount})
              </button>
            </div>
          </div>

          {/* Movement Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">รหัสสินค้า</th>
                    <th className="py-2.5 px-4 font-bold">ชื่อสินค้า / รุ่น</th>
                    <th className="py-2.5 px-4 font-bold">หมวดหมู่</th>
                    <th className="py-2.5 px-4 font-bold text-right">สต๊อก</th>
                    <th className="py-2.5 px-4 font-bold text-right">มูลค่า (บาท)</th>
                    <th className="py-2.5 px-4 font-bold text-center">ช่วงวัน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeMovementTab === "CLEARED" && (
                    movements.clearedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          ไม่มีสินค้าที่ถูกระบายออกในรอบนี้
                        </td>
                      </tr>
                    ) : (
                      movements.clearedItems.map((item: any) => (
                        <tr key={item.productCode} className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{item.productCode}</td>
                          <td className="py-2.5 px-4 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                          <td className="py-2.5 px-4">{item.category}</td>
                          <td className="py-2.5 px-4 text-right font-bold">{formatNumber(item.stockQty)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.stockValue)}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                              ระบายออกแล้ว
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {activeMovementTab === "NEW" && (
                    movements.newItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          ไม่มีสินค้า Non-Move รายการใหม่ในรอบนี้
                        </td>
                      </tr>
                    ) : (
                      movements.newItems.map((item: any) => (
                        <tr key={item.productCode} className="hover:bg-rose-50/40 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{item.productCode}</td>
                          <td className="py-2.5 px-4 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                          <td className="py-2.5 px-4">{item.category}</td>
                          <td className="py-2.5 px-4 text-right font-bold">{formatNumber(item.stockQty)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">{formatCurrency(item.stockValue)}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300">
                              ใหม่ ({item.bucket} วัน)
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {activeMovementTab === "PERSISTENT" && (
                    movements.persistentItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          ไม่มีรายการสินค้าค้างต่อเนื่อง
                        </td>
                      </tr>
                    ) : (
                      movements.persistentItems.map((item: any) => (
                        <tr key={item.productCode} className="hover:bg-amber-50/40 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{item.productCode}</td>
                          <td className="py-2.5 px-4 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                          <td className="py-2.5 px-4">{item.category}</td>
                          <td className="py-2.5 px-4 text-right font-bold">{formatNumber(item.stockQty)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.stockValue)}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                              {item.bucket} วัน
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
