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
import { BarChart2 } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/validators";

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
      <CardHeader className="p-3 sm:p-3.5 pb-2 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <BarChart2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div>
              <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                สัดส่วนสินค้าตาม 4 ช่วงวัน (Non-Move Period KPI Table)
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                จำนวน SKU และสัดส่วน % เทียบสินค้าทั้งหมด 4 ช่วงวัน
              </CardDescription>
            </div>
          </div>

          <Badge variant="outline" className="text-[10px] font-mono self-start sm:self-auto shrink-0">
            รวม {formatNumber(totalCalculatedSkus)} SKU
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="w-full text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 text-[10px] sm:text-[11px]">
                <TableHead className="py-2 px-2.5 sm:px-3 font-bold whitespace-nowrap">ช่วงวันไม่เคลื่อนไหว</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 text-right font-bold whitespace-nowrap">จำนวน SKU</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 text-center font-bold whitespace-nowrap">% เทียบ SKU ทั้งหมด</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 text-right font-bold whitespace-nowrap">จำนวนชิ้น</TableHead>
                <TableHead className="py-2 px-2.5 sm:px-3 text-right font-bold whitespace-nowrap">มูลค่าสต๊อก (บาท)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((item) => {
                const isHigh = item.isHigh;
                const pct = totalCalculatedSkus > 0 ? (item.skuCount / totalCalculatedSkus) * 100 : 0;
                const formattedPct = Math.round(pct * 10) / 10;

                return (
                  <TableRow key={item.bucket} className="hover:bg-muted/30 transition-colors">
                    {/* Period Label with Color-coded Badge */}
                    <TableCell className="py-2 px-2.5 sm:px-3 font-medium text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] sm:text-xs font-mono font-semibold px-2 py-0.5 ${
                            isHigh
                              ? item.bucket === "121 up"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                          }`}
                        >
                          {item.label}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* How many SKU */}
                    <TableCell className="py-2 px-2 sm:px-3 text-right whitespace-nowrap">
                      <span className="font-bold text-foreground text-xs sm:text-sm font-mono">
                        {formatNumber(item.skuCount)}
                      </span>{" "}
                      <span className="text-[10px] text-muted-foreground">SKU</span>
                    </TableCell>

                    {/* % vs Total SKU with visual mini-bar */}
                    <TableCell className="py-2 px-2 sm:px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="w-12 sm:w-20 bg-muted rounded-full h-1.5 sm:h-2 overflow-hidden shrink-0 hidden xs:block">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isHigh ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`font-bold font-mono text-xs ${
                            isHigh ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {formattedPct.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>

                    {/* Stock Qty */}
                    <TableCell className="py-2 px-2 sm:px-3 text-right font-mono text-xs font-medium text-foreground whitespace-nowrap">
                      {formatNumber(item.stockQty)}{" "}
                      <span className="text-[10px] text-muted-foreground font-normal">ชิ้น</span>
                    </TableCell>

                    {/* Stock Value */}
                    <TableCell className="py-2 px-2.5 sm:px-3 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                      {formatCurrency(item.stockValue)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>

            {/* Total Row */}
            <TableFooter className="bg-muted/60 font-semibold text-xs border-t-2 border-border">
              <TableRow>
                <TableCell className="py-2 px-2.5 sm:px-3 font-bold text-foreground whitespace-nowrap">
                  รวมทั้งหมด (4 ช่วงวัน)
                </TableCell>
                <TableCell className="py-2 px-2 sm:px-3 text-right font-bold font-mono text-foreground whitespace-nowrap">
                  {formatNumber(totalCalculatedSkus)} <span className="text-[10px] font-normal text-muted-foreground">SKU</span>
                </TableCell>
                <TableCell className="py-2 px-2 sm:px-3 text-center font-bold font-mono text-foreground whitespace-nowrap">
                  100.0%
                </TableCell>
                <TableCell className="py-2 px-2 sm:px-3 text-right font-bold font-mono text-foreground whitespace-nowrap">
                  {formatNumber(totalCalculatedQty)} <span className="text-[10px] font-normal text-muted-foreground">ชิ้น</span>
                </TableCell>
                <TableCell className="py-2 px-2.5 sm:px-3 text-right font-bold font-mono text-foreground whitespace-nowrap">
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
