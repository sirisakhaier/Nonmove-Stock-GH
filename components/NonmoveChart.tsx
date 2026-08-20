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

interface ChartProps {
  bucketData?: { bucket: string; count: number; isHigh?: boolean; classification?: string }[];
  categoryData?: { category?: string; name?: string; value: number; count?: number }[];
}

export function NonmoveChart({ bucketData = [], categoryData = [] }: ChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatBaht = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toLocaleString("th-TH");
  };

  const normalizedCategoryData = (categoryData || []).map((item) => ({
    category: item.category || item.name || "อื่นๆ",
    value: item.value || 0,
    count: item.count || 0,
  }));

  const normalizedBucketData = (bucketData || []).map((item) => ({
    bucket: item.bucket,
    count: item.count || 0,
    isHigh: item.isHigh ?? (item.classification === "HIGH"),
  }));

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse flex items-center justify-center text-xs text-slate-400">
          กำลังโหลดแผนภูมิ...
        </div>
        <div className="h-72 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse flex items-center justify-center text-xs text-slate-400">
          กำลังโหลดแผนภูมิ...
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bucket Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              การกระจายตัวตามช่วงวันไม่เคลื่อนไหว
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              จำนวนรายการสินค้า (SKU) ตามช่วงวัน Non-move
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-slate-600">ปกติ (&le; 120 วัน)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-rose-500 inline-block" />
              <span className="text-slate-600 font-semibold">วิกฤต (&gt; 120 วัน)</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={normalizedBucketData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 11, fill: "#64748b" }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                formatter={(value: any) => [`${value} รายการ (SKU)`, "จำนวนสินค้า"]}
                labelFormatter={(label) => `ช่วงวัน: ${label} วัน`}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
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

      {/* Category Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              มูลค่าสต๊อกแยกตามหมวดหมู่สินค้า
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              มูลค่าสต๊อกสินค้าไม่เคลื่อนไหว (บาท)
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={normalizedCategoryData.slice(0, 6)}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={formatBaht}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11, fill: "#475569" }}
                width={120}
              />
              <Tooltip
                formatter={(value: any) => [
                  `฿${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`,
                  "มูลค่าสต๊อก",
                ]}
                labelFormatter={(label) => `หมวดหมู่: ${label}`}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
