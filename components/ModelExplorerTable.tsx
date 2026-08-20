"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Download,
  Flame,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileEdit,
  CheckSquare,
  Square,
  SlidersHorizontal,
} from "lucide-react";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { formatNumber } from "@/lib/validators";
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
  selectedBucket: string; // Comma-separated or "ALL"
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

  // Close bucket popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsBucketOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleBucket = (b: string) => {
    let next: string[];
    if (isAllBucketsSelected) {
      // If previously all were selected, uncheck this one
      next = (NONMOVE_BUCKET_ORDER as readonly string[]).filter((x) => x !== b);
    } else if (currentBuckets.includes(b)) {
      next = currentBuckets.filter((x) => x !== b);
    } else {
      next = [...currentBuckets, b];
    }

    if (next.length === 0 || next.length === NONMOVE_BUCKET_ORDER.length) {
      onBucketChange("ALL");
    } else {
      onBucketChange(next.join(","));
    }
  };

  const handleToggleAllBuckets = () => {
    if (isAllBucketsSelected) {
      // Clear all
      onBucketChange(NONMOVE_BUCKET_ORDER[0]); // Keep at least one
    } else {
      onBucketChange("ALL");
    }
  };

  // Label for the 1-line bucket dropdown
  const bucketButtonLabel = isAllBucketsSelected
    ? "ทุกช่วงวัน Non-move"
    : currentBuckets.length === 1
    ? `${currentBuckets[0]} วัน`
    : `${currentBuckets.join(", ")} (${currentBuckets.length} ช่วง)`;

  // Ensure default sku types exist
  const combinedSkuTypes = Array.from(
    new Set(["SELLABLE", "DEMO", "MOCK_UP", ...(skuTypes || [])])
  );

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Table Header Controls */}
      <div className="p-3 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                รายการสินค้าไม่เคลื่อนไหว (Model Explorer)
              </h3>
              {/* Dynamic Live Metric Pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold shadow-sm">
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />
                  {highPct}% วิกฤต
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {okPct}% ปกติ
                </span>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              พบ {formatNumber(total)} รายการ (แตะที่รายการเพื่อขอยกเว้น Non-Move)
            </p>
          </div>

          <button
            onClick={onExport}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            ดาวน์โหลด CSV
          </button>
        </div>

        {/* Filter Toolbar (Mobile Optimized) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* 1. Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหารหัสสินค้า, รุ่น (Model)..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* 2. SKU_TYPE Dropdown (All types: SELLABLE, DEMO, MOCK_UP...) */}
          <div>
            <select
              value={selectedSkuType}
              onChange={(e) => onSkuTypeChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">ทุกประเภท (SKU_TYPE)</option>
              {combinedSkuTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 3. MULTI-CHECK Non-Move Bucket Dropdown (1 line with popover checkbox list) */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setIsBucketOpen(!isBucketOpen)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="truncate text-left font-medium pr-1">
                {bucketButtonLabel}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${isBucketOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Multi-check Popover Menu */}
            {isBucketOpen && (
              <div className="absolute left-0 right-0 mt-1 z-30 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-2.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                {/* Select / Deselect All */}
                <button
                  type="button"
                  onClick={handleToggleAllBuckets}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors border-b border-slate-100 dark:border-slate-700/60 pb-2 mb-1"
                >
                  {isAllBucketsSelected ? (
                    <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                  <span>เลือกทุกช่วงวัน (Select All)</span>
                </button>

                {/* Individual Buckets Checkboxes */}
                {NONMOVE_BUCKET_ORDER.map((b) => {
                  const isChecked = isAllBucketsSelected || currentBuckets.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleToggleBucket(b)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckSquare className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>{b} วัน</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Request Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">ทุกสถานะคำขอ</option>
              <option value="NO_REQUEST">ยังไม่มีคำขอ</option>
              <option value="PENDING">รอตรวจสอบ (Pending)</option>
              <option value="REVISE">ขอข้อมูลเพิ่ม (Revise)</option>
              <option value="APPROVED">อนุมัติแล้ว (Approved)</option>
              <option value="REJECTED">ไม่อนุมัติ (Rejected)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table (2 Lines Per Record for Maximum Mobile Space Efficiency) */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium text-xs">
            ไม่พบรายการสินค้าที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          data.map((item) => {
            const isHigh = item.classification === "HIGH" && !item.isExcluded;
            return (
              <div
                key={item.productCode}
                onClick={() => onSelectProduct(item)}
                className="p-3 sm:px-5 sm:py-3.5 hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors space-y-1.5 group"
              >
                {/* Line 1: ProductCode · Model  |  SKU_TYPE */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2 truncate">
                    <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 text-xs sm:text-sm tracking-tight shrink-0">
                      {item.productCode}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.model || "-"}
                    </span>
                  </div>

                  {/* SKU_TYPE Pill Badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider shrink-0 ${
                    item.skuType === "DEMO"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                      : item.skuType === "MOCK_UP"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  }`}>
                    {item.skuType || "SELLABLE"}
                  </span>
                </div>

                {/* Line 2: Non-Move Period Badge · Stock QTY  |  Action Button / Status */}
                <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Non-Move Bucket */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                        isHigh
                          ? "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700/70"
                          : item.isExcluded
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 line-through border border-emerald-300 dark:border-emerald-700"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/70"
                      }`}
                    >
                      {isHigh && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
                      {item.nonmoveDaysBucket} วัน
                    </span>

                    {/* Stock QTY */}
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                      สต๊อก: <strong className="text-slate-900 dark:text-white font-black">{formatNumber(item.stockQty)}</strong> ชิ้น
                    </span>
                  </div>

                  {/* Right Action / Status Badge */}
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    {item.activeRequest ? (
                      <div
                        onClick={() => onSelectProduct(item)}
                        className="cursor-pointer inline-block"
                        title="คลิกเพื่อดูรายละเอียดคำขอ"
                      >
                        <RequestStatusBadge
                          status={item.activeRequest.status}
                          requestType={item.activeRequest.requestType}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectProduct(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                      >
                        <FileEdit className="h-3 w-3" />
                        ขอยกเว้น
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer (Mobile Optimized) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
        <div className="text-slate-500 dark:text-slate-400 text-center sm:text-left text-[11px] sm:text-xs">
          แสดง {formatNumber(Math.min((page - 1) * limit + 1, total))} ถึง{" "}
          {formatNumber(Math.min(page * limit, total))} จาก {formatNumber(total)} รายการ
        </div>

        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="px-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
            title="หน้าถัดไป"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
