"use client";

import React from "react";
import { Package, Layers, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
  const isCritical = highNonmoveRatio > 30;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total SKUs */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1">
          <CardDescription className="text-[11px] font-medium uppercase tracking-wider">
            รายการสินค้า
          </CardDescription>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {formatNumber(totalSkus)} <span className="text-xs font-normal text-muted-foreground">SKU</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            ไม่เคลื่อนไหวในสาขา
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Units */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1">
          <CardDescription className="text-[11px] font-medium uppercase tracking-wider">
            จำนวนสต๊อก
          </CardDescription>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {formatNumber(totalStockQty)} <span className="text-xs font-normal text-muted-foreground">ชิ้น</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            กระจายในทุกกลุ่มวัน
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Stock Value */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1">
          <CardDescription className="text-[11px] font-medium uppercase tracking-wider">
            มูลค่าสต๊อกรวม
          </CardDescription>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
            {formatCurrency(totalStockValue)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            บาท
          </p>
        </CardContent>
      </Card>

      {/* 4. Critical Ratio (>120 Days) */}
      <Card className={`shadow-xs ${
        isCritical
          ? "border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20"
          : "border-border"
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1">
          <CardDescription className={`text-[11px] font-medium uppercase tracking-wider ${
            isCritical ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground"
          }`}>
            วิกฤต (&gt;120 วัน)
          </CardDescription>
          <AlertTriangle className={`h-4 w-4 ${isCritical ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <div className={`text-lg sm:text-xl font-bold tracking-tight ${
            isCritical ? "text-rose-700 dark:text-rose-400" : "text-foreground"
          }`}>
            {formatPercent(highNonmoveRatio)}
          </div>
          <p className={`text-[10px] mt-0.5 truncate ${
            isCritical ? "text-rose-600/80 dark:text-rose-400/80 font-medium" : "text-muted-foreground"
          }`}>
            ของมูลค่าทั้งหมดในสาขา
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
