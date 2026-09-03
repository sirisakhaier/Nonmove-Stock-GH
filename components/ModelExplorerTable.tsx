"use client";

import React from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  FileEdit,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { formatNumber } from "@/lib/validators";

interface ProductModelItem {
  productCode: string;
  productName: string;
  model: string;
  skuType: string;
  categoryName: string;
  subCategory: string;
  sizeGroup: string;
  nonmoveDaysBucket: string;
  agingDaysBucket: string;
  stockQty: number;
  stockValue: number;
  mosLevel: number | null;
  priceNormal: number | null;
  allBuckets: string[];
  classification: "HIGH" | "OK";
  isExcluded: boolean;
  activeRequest: any | null;
}

interface TableProps {
  data: ProductModelItem[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  search: string;
  onSearchChange: (newSearch: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  highPct: number;
  okPct: number;
  onSelectProduct: (product: ProductModelItem) => void;
  onExport: () => void;
}

export function ModelExplorerTable({
  data,
  total,
  page,
  limit,
  onPageChange,
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  highPct,
  okPct,
  onSelectProduct,
  onExport,
}: TableProps) {
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <Card className="border-border shadow-xs overflow-hidden">
      {/* 1. Header Toolbar (Responsive for Mobile Phones) */}
      <CardHeader className="p-3 sm:p-3.5 border-b border-border space-y-2.5">
        <div className="flex flex-col gap-2 sm:gap-3">
          {/* Status Pills: horizontally scrollable on mobile */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-medium overflow-x-auto no-scrollbar self-start max-w-full">
            <button
              onClick={() => onStatusChange("HIGH")}
              className={`px-2.5 sm:px-3 py-1 rounded-sm transition-all whitespace-nowrap ${
                selectedStatus === "HIGH"
                  ? "bg-card text-rose-700 dark:text-rose-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Non-Move &ge;61 วัน ({highPct}%)
            </button>
            <button
              onClick={() => onStatusChange("ALL")}
              className={`px-2.5 sm:px-3 py-1 rounded-sm transition-all whitespace-nowrap ${
                selectedStatus === "ALL"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ทั้งหมด ({formatNumber(total)} SKU)
            </button>
            <button
              onClick={() => onStatusChange("OK")}
              className={`px-2.5 sm:px-3 py-1 rounded-sm transition-all whitespace-nowrap ${
                selectedStatus === "OK"
                  ? "bg-card text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ปกติ 30-60 วัน ({okPct}%)
            </button>
          </div>

          {/* Search and Export Actions: responsive flex */}
          <div className="flex items-center gap-2 justify-between flex-wrap">
            <div className="relative flex-1 min-w-[160px] sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ค้นหาโมเดล, รหัสสินค้า..."
                className="h-8 pl-8 text-xs w-full"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8 text-xs gap-1.5 shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">ส่งออก</span> Excel
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* 2. Responsive Model Table without "สถานะ" Column */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="w-full text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 text-[10px] sm:text-[11px]">
                <TableHead className="w-8 py-2 px-2 text-center">#</TableHead>
                <TableHead className="py-2 px-2.5 sm:px-3 font-bold">ข้อมูลโมเดล (Model & Code)</TableHead>
                <TableHead className="py-2 px-2 text-center w-24 sm:w-28 font-bold whitespace-nowrap">ช่วงวัน</TableHead>
                <TableHead className="py-2 px-2 text-right w-20 sm:w-24 font-bold whitespace-nowrap">จำนวนชิ้น</TableHead>
                <TableHead className="py-2 px-2.5 text-right w-16 sm:w-20 font-bold whitespace-nowrap">คำขอ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    ไม่พบรายการสินค้าที่ตรงกับเงื่อนไขการค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, idx) => {
                  const isHigh = item.classification === "HIGH";
                  const rowNumber = (page - 1) * limit + idx + 1;

                  return (
                    <TableRow key={item.productCode} className="hover:bg-muted/40 transition-colors">
                      {/* Row Index */}
                      <TableCell className="py-2 px-2 font-mono text-muted-foreground text-[10px] text-center">
                        {rowNumber}
                      </TableCell>
                      
                      {/* Model & ProductCode (Compact for mobile) */}
                      <TableCell className="py-2 px-2.5 sm:px-3">
                        <div className="font-bold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
                          <span>{item.model}</span>
                          {item.isExcluded && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 text-muted-foreground border-border">
                              ยกเว้นแล้ว
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground flex items-center gap-1 flex-wrap mt-0.5">
                          <span>{item.productCode}</span>
                          <span>·</span>
                          <span className="font-semibold text-foreground/80">{item.categoryName}</span>
                          {item.skuType && (
                            <>
                              <span>·</span>
                              <span className="text-[9px] sm:text-[10px] text-muted-foreground">{item.skuType}</span>
                            </>
                          )}
                        </div>
                      </TableCell>

                      {/* Nonmove Period Bucket */}
                      <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] sm:text-[11px] font-mono font-medium px-2 py-0.5 ${
                            isHigh
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {item.nonmoveDaysBucket === "121 up" ? "121 วันขึ้นไป" : `${item.nonmoveDaysBucket} วัน`}
                        </Badge>
                      </TableCell>

                      {/* Stock Qty */}
                      <TableCell className="py-2 px-2 text-right font-mono font-bold text-xs whitespace-nowrap">
                        {formatNumber(item.stockQty)}
                      </TableCell>

                      {/* Action Request Button */}
                      <TableCell className="py-2 px-2.5 text-right whitespace-nowrap">
                        {item.activeRequest ? (
                          <div onClick={() => onSelectProduct(item)} className="cursor-pointer inline-block">
                            <RequestStatusBadge status={item.activeRequest.status} />
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onSelectProduct(item)}
                            title="ยื่นคำขอสำหรับโมเดลนี้"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                          >
                            <FileEdit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 3. Pagination Footer (Mobile Optimized) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 sm:p-3 border-t border-border text-xs text-muted-foreground">
          <div className="text-[11px] text-center sm:text-left">
            แสดง {data.length > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, total)} จากทั้งหมด {formatNumber(total)} รายการ
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2 font-medium text-[11px]">
              หน้า {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-7 w-7"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
