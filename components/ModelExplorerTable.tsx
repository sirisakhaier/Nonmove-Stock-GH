"use client";

import React from "react";
import {
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
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
      {/* 1. Header Toolbar */}
      <CardHeader className="p-3.5 border-b border-border space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-medium self-start">
            <button
              onClick={() => onStatusChange("ALL")}
              className={`px-3 py-1 rounded-sm transition-all ${
                selectedStatus === "ALL"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ทั้งหมด ({formatNumber(total)} SKU)
            </button>
            <button
              onClick={() => onStatusChange("HIGH")}
              className={`px-3 py-1 rounded-sm transition-all ${
                selectedStatus === "HIGH"
                  ? "bg-card text-rose-700 dark:text-rose-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Non-Move &ge;61 วัน ({highPct}%)
            </button>
            <button
              onClick={() => onStatusChange("OK")}
              className={`px-3 py-1 rounded-sm transition-all ${
                selectedStatus === "OK"
                  ? "bg-card text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ปกติ 30-60 วัน ({okPct}%)
            </button>
          </div>

          {/* Search and Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ค้นหาโมเดล, รหัสสินค้า..."
                className="h-8 w-44 sm:w-56 pl-8 text-xs"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>ส่งออก Excel</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* 2. Space-Saving Model Table (No ProductName, No Amount) */}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>ข้อมูลโมเดลสินค้า (Model & Code)</TableHead>
              <TableHead className="text-center w-28">ช่วงวัน (Bucket)</TableHead>
              <TableHead className="text-right w-24">จำนวนชิ้น</TableHead>
              <TableHead className="text-center w-28">สถานะ</TableHead>
              <TableHead className="text-right w-16">คำขอ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  ไม่พบรายการสินค้าที่ตรงกับเงื่อนไขการค้นหา
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => {
                const isHigh = item.classification === "HIGH";
                const rowNumber = (page - 1) * limit + idx + 1;

                return (
                  <TableRow key={item.productCode} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-muted-foreground text-[11px]">{rowNumber}</TableCell>
                    
                    {/* Model & ProductCode */}
                    <TableCell>
                      <div className="font-bold text-foreground text-xs">{item.model}</div>
                      <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span>{item.productCode}</span>
                        <span>·</span>
                        <span className="font-semibold text-foreground/80">{item.categoryName}</span>
                        {item.skuType && (
                          <>
                            <span>·</span>
                            <span className="text-[10px] text-muted-foreground">{item.skuType}</span>
                          </>
                        )}
                      </div>
                    </TableCell>

                    {/* Nonmove Period Bucket */}
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-mono font-medium ${
                          isHigh
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        {item.nonmoveDaysBucket === "121 up" ? "121 วันขึ้นไป" : `${item.nonmoveDaysBucket} วัน`}
                      </Badge>
                    </TableCell>

                    {/* Stock Qty */}
                    <TableCell className="text-right font-medium text-xs">
                      {formatNumber(item.stockQty)}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      {item.isExcluded ? (
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                          ยกเว้นแล้ว
                        </Badge>
                      ) : isHigh ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Non-Move</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>ปกติ</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Action Request Button */}
                    <TableCell className="text-right">
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

        {/* 3. Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-border text-xs text-muted-foreground">
          <div>
            แสดง {data.length > 0 ? (page - 1) * limit + 1 : 0} ถึง{" "}
            {Math.min(page * limit, total)} จากทั้งหมด {formatNumber(total)} รายการ
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

            <span className="px-2 font-medium">
              หน้า {page} จาก {totalPages}
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
