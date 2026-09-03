"use client";

import React from "react";
import { Package, Layers, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
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
  const isCritical = highNonmoveRatio > 30;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {/* 1. Total SKUs */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2.5 sm:p-3.5 pb-1">
          <CardDescription className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">
            รายการสินค้า (SKU)
          </CardDescription>
          <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3.5 pt-0">
          <div className="text-base sm:text-xl font-bold tracking-tight text-foreground">
            {formatNumber(totalSkus)} <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">SKU</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate">
            ไม่เคลื่อนไหวในสาขา (&gt;30 วัน)
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Units */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2.5 sm:p-3.5 pb-1">
          <CardDescription className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">
            จำนวนสต๊อก (Units)
          </CardDescription>
          <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3.5 pt-0">
          <div className="text-base sm:text-xl font-bold tracking-tight text-foreground">
            {formatNumber(totalStockQty)} <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">ชิ้น</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 font-medium truncate">
            จาก {formatNumber(totalSkus)} SKU รวม
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Stock Value */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2.5 sm:p-3.5 pb-1">
          <CardDescription className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">
            มูลค่าสต๊อก (Value)
          </CardDescription>
          <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3.5 pt-0">
          <div className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate">
            {formatCurrency(totalStockValue)}
          </div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 font-medium truncate">
            ครอบคลุม {formatNumber(totalSkus)} SKU
          </p>
        </CardContent>
      </Card>

      {/* 4. Non-Move Ratio */}
      <Card className={`shadow-xs ${
        isCritical
          ? "border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20"
          : "border-border"
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2.5 sm:p-3.5 pb-1">
          <CardDescription className={`text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate ${
            isCritical ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground"
          }`}>
            Non-Move (&ge;61 วัน)
          </CardDescription>
          <AlertTriangle className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isCritical ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3.5 pt-0">
          <div className={`text-base sm:text-xl font-bold tracking-tight truncate ${
            isCritical ? "text-rose-700 dark:text-rose-400" : "text-foreground"
          }`}>
            {formatNumber(highCount)} <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">SKU</span> <span className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400">({formatPercent(highNonmoveRatio)})</span>
          </div>
          <p className={`text-[9px] sm:text-[10px] mt-0.5 truncate ${
            isCritical ? "text-rose-600/90 dark:text-rose-400/90 font-medium" : "text-muted-foreground"
          }`}>
            ค้างตั้งแต่ 61 วันขึ้นไป
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
