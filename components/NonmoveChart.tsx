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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
      <Card className="border-border p-8 text-center text-xs text-muted-foreground animate-pulse">
        กำลังโหลดแผนภูมิวิเคราะห์สต๊อก...
      </Card>
    );
  }

  const isDark = theme === "dark";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const tickColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="p-4 pb-2 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">
              การกระจายตัวตามช่วงวันไม่เคลื่อนไหว (Aging Distribution)
            </CardTitle>
            <CardDescription className="text-xs">
              จำนวนรายการสินค้า (SKU) จำแนกตามแต่ละช่วงวัน
            </CardDescription>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span>ปกติ (&le; 120 วัน)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
              <span>วิกฤต (&gt; 120 วัน)</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3">
        <div className="h-52 sm:h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={normalizedBucketData} margin={{ top: 10, right: 15, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 11, fill: tickColor }}
                stroke={gridColor}
                angle={-15}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: tickColor }}
                stroke={gridColor}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value: any) => [`${value} SKU`, "จำนวนสินค้า"]}
                labelFormatter={(label) => `ช่วงวัน: ${label} วัน`}
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: gridColor,
                  borderRadius: "0.375rem",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
      </CardContent>
    </Card>
  );
}
