"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileEdit,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { formatNumber, formatCurrency } from "@/lib/validators";
import { NONMOVE_BUCKET_ORDER } from "@/lib/nonmoveConfig";

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
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedBucket: string;
  onBucketChange: (bucket: string) => void;
  selectedSkuType: string;
  onSkuTypeChange: (skuType: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  categories: string[];
  skuTypes?: string[];
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
  selectedCategory,
  onCategoryChange,
  selectedBucket,
  onBucketChange,
  selectedSkuType,
  onSkuTypeChange,
  selectedStatus,
  onStatusChange,
  categories,
  skuTypes = ["SELLABLE", "DEMO", "MOCK_UP"],
  highPct,
  okPct,
  onSelectProduct,
  onExport,
}: TableProps) {
  const totalPages = Math.ceil(total / limit) || 1;

  // Multi-check Popover State
  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse currently selected buckets
  const currentBuckets: string[] =
    selectedBucket === "ALL" || !selectedBucket
      ? Array.from(NONMOVE_BUCKET_ORDER)
      : selectedBucket.split(",").map((b) => b.trim()).filter(Boolean);

  const isAllBucketsSelected = currentBuckets.length === NONMOVE_BUCKET_ORDER.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsBucketOpen(false);
      }
    }
    if (isBucketOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isBucketOpen]);

  const handleToggleBucket = (b: string) => {
    let newSelected: string[];
    if (currentBuckets.includes(b)) {
      newSelected = currentBuckets.filter((item) => item !== b);
      if (newSelected.length === 0) return;
    } else {
      newSelected = [...currentBuckets, b];
    }

    if (newSelected.length === NONMOVE_BUCKET_ORDER.length) {
      onBucketChange("ALL");
    } else {
      onBucketChange(newSelected.join(","));
    }
  };

  const handleSelectAllBuckets = () => {
    if (isAllBucketsSelected) {
      onBucketChange(">360,180-360,120-180");
    } else {
      onBucketChange("ALL");
    }
  };

  const getBucketDisplayText = () => {
    if (isAllBucketsSelected) return "ทุกช่วงวัน (All)";
    if (currentBuckets.length === 1) return `${currentBuckets[0]} วัน`;
    return `เลือก ${currentBuckets.length} ช่วงวัน`;
  };

  return (
    <Card className="border-border shadow-xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <CardHeader className="p-4 border-b border-border space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
              วิกฤต &gt;120 วัน ({highPct}%)
            </button>
            <button
              onClick={() => onStatusChange("OK")}
              className={`px-3 py-1 rounded-sm transition-all ${
                selectedStatus === "OK"
                  ? "bg-card text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ปกติ &le;120 วัน ({okPct}%)
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Search */}
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

        {/* 2. Secondary Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full bg-transparent font-medium text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">ทุก Category (All)</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Nonmove Period Multi-Check Dropdown */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setIsBucketOpen(!isBucketOpen)}
              className="w-full flex items-center justify-between gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{getBucketDisplayText()}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>

            {isBucketOpen && (
              <div className="absolute z-50 left-0 mt-1 w-60 rounded-md border border-border bg-card p-2.5 shadow-lg space-y-1.5 animate-in fade-in-80 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-border">
                  <span className="font-semibold text-foreground text-[11px]">ช่วงวันไม่เคลื่อนไหว</span>
                  <button
                    type="button"
                    onClick={handleSelectAllBuckets}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    {isAllBucketsSelected ? "เลือกเฉพาะวิกฤต" : "เลือกทั้งหมด"}
                  </button>
                </div>
                <div className="space-y-0.5">
                  {NONMOVE_BUCKET_ORDER.map((b) => {
                    const isChecked = currentBuckets.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleToggleBucket(b)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-sm text-left hover:bg-muted transition-colors"
                      >
                        <span className="text-foreground font-medium">{b} วัน</span>
                        {isChecked ? (
                          <CheckSquare className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-border flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsBucketOpen(false)}
                    className="h-7 text-xs font-semibold px-3"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    ยืนยันการเลือก
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* SKU_TYPE Filter */}
          <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0">ประเภท:</span>
            <select
              value={selectedSkuType}
              onChange={(e) => onSkuTypeChange(e.target.value)}
              className="w-full bg-transparent font-medium text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">ทุกประเภท (All)</option>
              {skuTypes.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      {/* 3. Model Table (Compact 2-Line Row Layout) */}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>ข้อมูลโมเดลและสินค้า (Model Details)</TableHead>
              <TableHead className="text-center w-28">ช่วงวัน (Bucket)</TableHead>
              <TableHead className="text-right w-24">จำนวนชิ้น</TableHead>
              <TableHead className="text-right w-28">มูลค่ารวม (บาท)</TableHead>
              <TableHead className="text-center w-24">สถานะ</TableHead>
              <TableHead className="text-right w-20">ยื่นคำขอ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
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
                    <TableCell className="py-2.5">
                      {/* Line 1: Model & SKU_TYPE Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-xs">{item.model}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                          {item.skuType}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          ({item.categoryName})
                        </span>
                      </div>
                      {/* Line 2: Product Name & Code */}
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px]">{item.productCode}</span>
                        <span>·</span>
                        <span className="truncate max-w-[280px]">{item.productName}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={isHigh ? "destructive" : "success"} className="text-[10px]">
                        {item.nonmoveDaysBucket} วัน
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-medium text-xs">
                      {formatNumber(item.stockQty)}
                    </TableCell>

                    <TableCell className="text-right font-bold text-foreground text-xs">
                      {formatCurrency(item.stockValue)}
                    </TableCell>

                    <TableCell className="text-center">
                      {item.activeRequest ? (
                        <RequestStatusBadge status={item.activeRequest.status} />
                      ) : (
                        <span className="text-[11px] text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectProduct(item)}
                        className="h-7 text-xs font-medium px-2"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* 4. Pagination */}
        <div className="flex items-center justify-between p-3 border-t border-border bg-card text-xs text-muted-foreground">
          <div>
            หน้า <span className="font-medium text-foreground">{page}</span> จาก <span className="font-medium text-foreground">{totalPages}</span> ({formatNumber(total)} SKU)
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-7 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>ก่อนหน้า</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-7 text-xs gap-1"
            >
              <span>ถัดไป</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
