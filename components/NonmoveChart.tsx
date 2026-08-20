"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "./ThemeProvider";

interface ChartProps {
  bucketData?: { bucket: string; count: number; isHigh?: boolean; classification?: string }[];
}

export function NonmoveChart({ bucketData = [] }: ChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const normalizedBucketData = (bucketData || []).map((item) => ({
    bucket: item.bucket,
    count: item.count || 0,
    isHigh: item.isHigh ?? (item.classification === "HIGH"),
  }));

  if (!isMounted) {
    return (
      <div className="h-80 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-pulse flex items-center justify-center text-xs text-slate-400">
        กำลังโหลดแผนภูมิวิเคราะห์สต๊อก...
      </div>
    );
  }

  const isDark = theme === "dark";
  const gridColor = isDark ? "#334155" : "#f1f5f9";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const tooltipText = isDark ? "#f8fafc" : "#0f172a";

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-6 shadow-sm transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            การกระจายตัวตามช่วงวันไม่เคลื่อนไหว (Non-Move Aging Distribution)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            จำนวนรายการสินค้า (SKU) จำแนกตามช่วงวันค้างสต๊อก
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-md bg-emerald-500 inline-block shadow-sm shadow-emerald-500/20" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">ปกติ (&le; 120 วัน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-md bg-rose-500 inline-block shadow-sm shadow-rose-500/20" />
            <span className="text-rose-600 dark:text-rose-400 font-bold">วิกฤต (&gt; 120 วัน)</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-48 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalizedBucketData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 12, fill: tickColor, fontWeight: 500 }}
              stroke={gridColor}
              angle={-20}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 12, fill: tickColor }}
              stroke={gridColor}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: any) => [`${value} รายการ (SKU)`, "จำนวนสินค้า"]}
              labelFormatter={(label) => `ช่วงวัน: ${label} วัน`}
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: "14px",
                boxShadow: isDark ? "0 10px 25px -5px rgba(0, 0, 0, 0.5)" : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                color: tooltipText,
                fontSize: "12px",
                padding: "10px 14px",
              }}
              itemStyle={{ color: isDark ? "#38bdf8" : "#2563eb", fontWeight: 600 }}
              labelStyle={{ color: tooltipText, fontWeight: 700, marginBottom: "4px" }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
              {normalizedBucketData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isHigh ? "#f43f5e" : "#10b981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
