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
  Calendar,
  Layers,
  Package,
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
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
      <Card className="border-border p-8 text-center text-xs text-muted-foreground animate-pulse">
        กำลังประมวลผลแนวโน้มการเปลี่ยนแปลงตามรอบวัน...
      </Card>
    );
  }

  if (!data || !data.historicalSnapshots || data.historicalSnapshots.length === 0) {
    return null;
  }

  const isDark = theme === "dark";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const tickColor = isDark ? "#94a3b8" : "#64748b";

  const delta = data.delta || { stockQtyDiff: 0, stockValueDiff: 0, highPctDiff: 0, skusDiff: 0 };
  const movements = data.movements || { clearedCount: 0, newCount: 0, persistentCount: 0, clearedItems: [], newItems: [], persistentItems: [] };
  const hasPrev = data.hasComparison;

  return (
    <Card className="border-border shadow-xs space-y-4 p-4 sm:p-6 transition-colors">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground">
                วิเคราะห์แนวโน้มการเปลี่ยนแปลงสต๊อก (Trend & Gap Analysis)
              </h3>
              <Badge variant="secondary" className="text-[11px]">
                เปรียบเทียบตามรอบวัน
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasPrev
                ? `เปรียบเทียบระหว่างรอบวันที่ ${data.currentDate} กับรอบก่อนหน้า (${data.prevDate})`
                : `ข้อมูลรอบวันที่ ${data.currentDate}`}
            </p>
          </div>
        </div>
      </div>

      {/* Delta KPI Stat Cards */}
      {hasPrev && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Value Diff */}
          <div className="rounded-md border border-border bg-card p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">มูลค่ารวม (เทียบรอบก่อน)</span>
            <div className="flex items-center gap-1.5 mt-1">
              {delta.stockValueDiff < 0 ? (
                <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : delta.stockValueDiff > 0 ? (
                <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={`text-base font-bold ${
                delta.stockValueDiff < 0 ? "text-emerald-600 dark:text-emerald-400" : delta.stockValueDiff > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              }`}>
                {delta.stockValueDiff > 0 ? "+" : ""}{formatCurrency(delta.stockValueDiff)}
              </span>
            </div>
          </div>

          {/* 2. Units Diff */}
          <div className="rounded-md border border-border bg-card p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">จำนวนชิ้น (เทียบรอบก่อน)</span>
            <div className="flex items-center gap-1.5 mt-1">
              {delta.stockQtyDiff < 0 ? (
                <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : delta.stockQtyDiff > 0 ? (
                <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={`text-base font-bold ${
                delta.stockQtyDiff < 0 ? "text-emerald-600 dark:text-emerald-400" : delta.stockQtyDiff > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              }`}>
                {delta.stockQtyDiff > 0 ? "+" : ""}{formatNumber(delta.stockQtyDiff)} ชิ้น
              </span>
            </div>
          </div>

          {/* 3. Cleared Items */}
          <div className="rounded-md border border-border bg-card p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">โมเดลที่ขายออกได้แล้ว (Cleared)</span>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 font-bold text-base">
              <CheckCircle2 className="h-4 w-4" />
              <span>{formatNumber(movements.clearedCount)} รายการ</span>
            </div>
          </div>

          {/* 4. New Nonmove Items */}
          <div className="rounded-md border border-border bg-card p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">โมเดลที่เพิ่มเข้าใหม่ (&gt;30 วัน)</span>
            <div className="flex items-center gap-1.5 mt-1 text-amber-600 dark:text-amber-400 font-bold text-base">
              <AlertTriangle className="h-4 w-4" />
              <span>{formatNumber(movements.newCount)} รายการ</span>
            </div>
          </div>
        </div>
      )}

      {/* Historical Trend Area Chart */}
      <div className="pt-2">
        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.historicalSnapshots} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <defs>
                <linearGradient id="storeTrendVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} angle={-15} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: gridColor, borderRadius: "0.375rem", fontSize: "12px" }}
                formatter={(value: any) => [formatCurrency(Number(value)), "มูลค่าสต๊อกรวม"]}
              />
              <Area type="monotone" dataKey="totalStockValue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#storeTrendVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Movement Breakdown Tabs */}
      {hasPrev && (
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-medium self-start">
            <button
              onClick={() => setActiveMovementTab("CLEARED")}
              className={`px-3 py-1 rounded-sm transition-all ${
                activeMovementTab === "CLEARED"
                  ? "bg-card text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ขายออกแล้ว ({movements.clearedCount})
            </button>
            <button
              onClick={() => setActiveMovementTab("NEW")}
              className={`px-3 py-1 rounded-sm transition-all ${
                activeMovementTab === "NEW"
                  ? "bg-card text-amber-700 dark:text-amber-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              เพิ่มเข้าใหม่ ({movements.newCount})
            </button>
            <button
              onClick={() => setActiveMovementTab("PERSISTENT")}
              className={`px-3 py-1 rounded-sm transition-all ${
                activeMovementTab === "PERSISTENT"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ยังคงค้างอยู่ ({movements.persistentCount})
            </button>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>รหัสสินค้า</TableHead>
                  <TableHead>รุ่นสินค้า (Model)</TableHead>
                  <TableHead className="text-center">ช่วงวัน</TableHead>
                  <TableHead className="text-right">จำนวนชิ้น</TableHead>
                  <TableHead className="text-right">มูลค่ารวม (บาท)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeMovementTab === "CLEARED" && (
                  movements.clearedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        ไม่มีรายการที่ขายออกในรอบนี้
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.clearedItems.map((item: any, idx: number) => (
                      <TableRow key={item.productCode}>
                        <TableCell className="font-mono text-muted-foreground text-[11px]">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs font-medium text-foreground">{item.productCode}</TableCell>
                        <TableCell className="font-medium text-foreground text-xs">{item.model}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[10px]">
                            {item.nonmoveDaysBucket} วัน
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">{formatNumber(item.stockQty)}</TableCell>
                        <TableCell className="text-right font-bold text-foreground text-xs">{formatCurrency(item.stockValue)}</TableCell>
                      </TableRow>
                    ))
                  )
                )}

                {activeMovementTab === "NEW" && (
                  movements.newItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        ไม่มีรายการที่เพิ่มเข้าใหม่ในรอบนี้
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.newItems.map((item: any, idx: number) => (
                      <TableRow key={item.productCode}>
                        <TableCell className="font-mono text-muted-foreground text-[11px]">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs font-medium text-foreground">{item.productCode}</TableCell>
                        <TableCell className="font-medium text-foreground text-xs">{item.model}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="warning" className="text-[10px]">
                            {item.nonmoveDaysBucket} วัน
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">{formatNumber(item.stockQty)}</TableCell>
                        <TableCell className="text-right font-bold text-foreground text-xs">{formatCurrency(item.stockValue)}</TableCell>
                      </TableRow>
                    ))
                  )
                )}

                {activeMovementTab === "PERSISTENT" && (
                  movements.persistentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        ไม่มีรายการค้าง
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.persistentItems.slice(0, 50).map((item: any, idx: number) => (
                      <TableRow key={item.productCode}>
                        <TableCell className="font-mono text-muted-foreground text-[11px]">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs font-medium text-foreground">{item.productCode}</TableCell>
                        <TableCell className="font-medium text-foreground text-xs">{item.model}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[10px]">
                            {item.nonmoveDaysBucket} วัน
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">{formatNumber(item.stockQty)}</TableCell>
                        <TableCell className="text-right font-bold text-foreground text-xs">{formatCurrency(item.stockValue)}</TableCell>
                      </TableRow>
                    ))
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Card>
  );
}
