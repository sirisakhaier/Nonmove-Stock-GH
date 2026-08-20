"use client";

import React from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Flame,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { formatCurrency, formatNumber } from "@/lib/validators";
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
  highPct,
  okPct,
  onSelectProduct,
  onExport,
}: TableProps) {
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                รายการสินค้าไม่เคลื่อนไหว (Model Explorer)
              </h3>
              {/* Dynamic Live Metric Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <Flame className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                  {highPct}% วิกฤต
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {okPct}% ปกติ
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              พบทั้งหมด {formatNumber(total)} รายการ (คลิกที่แถวเพื่อชี้แจงสาเหตุหรือขอปลดล็อค)
            </p>
          </div>

          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <Download className="h-4 w-4" />
            ดาวน์โหลด CSV
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหารหัสสินค้า, ชื่อสินค้า, รุ่น/Model..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">ทุกหมวดหมู่สินค้า</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Bucket Filter */}
          <div>
            <select
              value={selectedBucket}
              onChange={(e) => onBucketChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">ทุกช่วงวัน Non-move</option>
              {NONMOVE_BUCKET_ORDER.map((b) => (
                <option key={b} value={b}>
                  {b} วัน
                </option>
              ))}
            </select>
          </div>

          {/* Request Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">ทุกสถานะคำขอ</option>
              <option value="NO_REQUEST">ยังไม่มีคำขอ</option>
              <option value="PENDING">รอการตรวจสอบ (Pending)</option>
              <option value="APPROVED">อนุมัติแล้ว (Approved)</option>
              <option value="REJECTED">ไม่อนุมัติ (Rejected)</option>
              <option value="EXPLAINED">ชี้แจงแล้ว (Explained)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">รหัสสินค้า</th>
              <th className="py-3.5 px-4 font-semibold">ชื่อสินค้า / รุ่น</th>
              <th className="py-3.5 px-4 font-semibold">หมวดหมู่</th>
              <th className="py-3.5 px-4 font-semibold">ช่วงวันไม่เคลื่อนไหว</th>
              <th className="py-3.5 px-4 font-semibold">อายุสินค้า</th>
              <th className="py-3.5 px-4 font-semibold text-right">จำนวนสต๊อก</th>
              <th className="py-3.5 px-4 font-semibold text-right">มูลค่า (บาท)</th>
              <th className="py-3.5 px-4 font-semibold text-center">สถานะ / การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  ไม่พบรายการสินค้าที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const isHigh = item.classification === "HIGH" && !item.isExcluded;
                return (
                  <tr
                    key={item.productCode}
                    onClick={() => onSelectProduct(item)}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {item.productCode}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        รุ่น: {item.model}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300">
                        {item.categoryName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isHigh
                            ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : item.isExcluded
                            ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 line-through"
                            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {isHigh && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
                        {item.nonmoveDaysBucket} วัน
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {item.agingDaysBucket} วัน
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatNumber(item.stockQty)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <RequestStatusBadge
                          status={item.activeRequest?.status}
                          requestType={item.activeRequest?.requestType}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProduct(item);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
                          title="ชี้แจง / ขอปลดล็อค"
                        >
                          <FileEdit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          แสดง {total === 0 ? 0 : (page - 1) * limit + 1} ถึง {Math.min(page * limit, total)} จากทั้งหมด {formatNumber(total)} รายการ
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
            หน้า {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
