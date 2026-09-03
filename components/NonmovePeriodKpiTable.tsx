"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, BarChart2, Layers } from "lucide-react";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/validators";

export interface PeriodKpiItem {
  bucket: string;
  label: string;
  skuCount: number;
  skuPct: number;
  stockQty: number;
  stockValue: number;
  classification: "HIGH" | "OK";
  isHigh: boolean;
  statusLabel: string;
}

interface NonmovePeriodKpiTableProps {
  data?: PeriodKpiItem[];
  totalSkus?: number;
  totalQty?: number;
  totalValue?: number;
}

export function NonmovePeriodKpiTable({
  data = [],
  totalSkus = 0,
  totalQty = 0,
  totalValue = 0,
}: NonmovePeriodKpiTableProps) {
  // If no data, use default 4 periods
  const periods = data.length > 0 ? data : [
    { bucket: "30-60", label: "30-60 วัน", skuCount: 0, skuPct: 0, stockQty: 0, stockValue: 0, classification: "OK", isHigh: false, statusLabel: "ปกติ" },
    { bucket: "61-90", label: "61-90 วัน", skuCount: 0, skuPct: 0, stockQty: 0, stockValue: 0, classification: "HIGH", isHigh: true, statusLabel: "Non-Move" },
    { bucket: "91-120", label: "91-120 วัน", skuCount: 0, skuPct: 0, stockQty: 0, stockValue: 0, classification: "HIGH", isHigh: true, statusLabel: "Non-Move" },
    { bucket: "121 up", label: "121 วันขึ้นไป", skuCount: 0, skuPct: 0, stockQty: 0, stockValue: 0, classification: "HIGH", isHigh: true, statusLabel: "Non-Move" },
  ];

  const totalCalculatedSkus = totalSkus || periods.reduce((acc, p) => acc + p.skuCount, 0);
  const totalCalculatedQty = totalQty || periods.reduce((acc, p) => acc + p.stockQty, 0);
  const totalCalculatedValue = totalValue || periods.reduce((acc, p) => acc + p.stockValue, 0);

  return (
    <Card className="border-border shadow-xs overflow-hidden">
      <CardHeader className="p-3.5 pb-2 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                สัดส่วนสินค้าตาม 4 ช่วงวัน (Non-Move Period KPI Table)
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                จำนวน SKU และสัดส่วน % เทียบสินค้าทั้งหมด 4 ช่วงวัน (นับ Non-Move ตั้งแต่ 61 วันขึ้นไป)
              </CardDescription>
            </div>
          </div>

          <Badge variant="outline" className="text-[10px] self-start sm:self-auto font-mono">
            รวม {formatNumber(totalCalculatedSkus)} SKU
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 text-[11px]">
                <TableHead className="w-40 font-bold">ช่วงวันไม่เคลื่อนไหว (Period)</TableHead>
                <TableHead className="text-center w-32 font-bold">สถานะ</TableHead>
                <TableHead className="text-right w-36 font-bold">จำนวน SKU (How many SKU)</TableHead>
                <TableHead className="text-center w-48 font-bold">% เทียบ SKU ทั้งหมด (% vs Total)</TableHead>
                <TableHead className="text-right w-32 font-bold">จำนวนสต๊อก (ชิ้น)</TableHead>
                <TableHead className="text-right w-36 font-bold">มูลค่าสต๊อก (บาท)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {periods.map((item) => {
                const isHigh = item.isHigh;
                const pct = totalCalculatedSkus > 0 ? (item.skuCount / totalCalculatedSkus) * 100 : 0;
                const formattedPct = Math.round(pct * 10) / 10;

                return (
                  <TableRow key={item.bucket} className="hover:bg-muted/30 transition-colors">
                    {/* Period Label */}
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{item.label}</span>
                      </div>
                    </TableCell>

                    {/* Classification Status Badge */}
                    <TableCell className="text-center">
                      {isHigh ? (
                        <Badge
                          variant="secondary"
                          className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 gap-1 text-[10px] font-semibold"
                        >
                          <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                          <span>Non-Move</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 gap-1 text-[10px] font-semibold"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>ปกติ (Active)</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* How many SKU */}
                    <TableCell className="text-right">
                      <span className="font-bold text-foreground text-xs sm:text-sm font-mono">
                        {formatNumber(item.skuCount)}
                      </span>{" "}
                      <span className="text-[11px] text-muted-foreground">SKU</span>
                    </TableCell>

                    {/* % vs Total SKU with visual bar */}
                    <TableCell>
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-20 sm:w-28 bg-muted rounded-full h-2 overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isHigh ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`font-bold font-mono text-xs min-w-[42px] text-right ${
                            isHigh ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {formattedPct.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>

                    {/* Stock Qty */}
                    <TableCell className="text-right font-mono font-medium text-foreground">
                      {formatNumber(item.stockQty)}{" "}
                      <span className="text-[10px] text-muted-foreground font-normal">ชิ้น</span>
                    </TableCell>

                    {/* Stock Value */}
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(item.stockValue)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>

            {/* Total Row */}
            <TableFooter className="bg-muted/60 font-semibold text-xs border-t-2 border-border">
              <TableRow>
                <TableCell className="font-bold text-foreground">
                  รวมทั้งหมด (4 ช่วงวัน)
                </TableCell>
                <TableCell className="text-center text-muted-foreground font-normal text-[11px]">
                  100% สต๊อก
                </TableCell>
                <TableCell className="text-right font-bold font-mono text-foreground text-xs sm:text-sm">
                  {formatNumber(totalCalculatedSkus)} <span className="text-[11px] font-normal text-muted-foreground">SKU</span>
                </TableCell>
                <TableCell className="text-center font-bold font-mono text-foreground">
                  100.0%
                </TableCell>
                <TableCell className="text-right font-bold font-mono text-foreground">
                  {formatNumber(totalCalculatedQty)} <span className="text-[10px] font-normal text-muted-foreground">ชิ้น</span>
                </TableCell>
                <TableCell className="text-right font-bold font-mono text-foreground">
                  {formatCurrency(totalCalculatedValue)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
