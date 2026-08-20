"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

interface ChartItem {
  bucket: string;
  count: number;
  classification: "HIGH" | "OK";
}

interface NonmoveChartProps {
  data: ChartItem[];
}

export const NonmoveChart: React.FC<NonmoveChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Non-move Days Distribution</h3>
          <p className="text-xs text-slate-500">Count of SKUs per aging non-move bucket</p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-600">OK (&lt; 121d)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span className="text-slate-600">High Non-move (&ge; 121d)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="bucket"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ChartItem;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1">
                      <p className="font-bold text-slate-200">Bucket: {item.bucket} Days</p>
                      <p className="text-sky-400 font-semibold">Models: {item.count} SKUs</p>
                      <p className={item.classification === "HIGH" ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
                        Status: {item.classification === "HIGH" ? "High Non-move" : "OK"}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.classification === "HIGH" ? "#f43f5e" : "#10b981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
