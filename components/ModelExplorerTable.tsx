"use client";

import React from "react";
import {
  Search,
  Download,
  Flame,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileEdit,
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
              พบ {formatNumber(total)} รายการ (กดที่แถวเพื่อขอยกเว้น Non-Move)
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
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหารหัส, ชื่อ, รุ่น..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">ทุกหมวดหมู่ (Category)</option>
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
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
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

      {/* Table (Responsive with revised columns) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-3 font-bold">รหัสสินค้า</th>
              <th className="py-2.5 px-3 font-bold">ชื่อสินค้า</th>
              <th className="py-2.5 px-3 font-bold">รุ่น (Model)</th>
              <th className="py-2.5 px-3 font-bold">หมวดหมู่ (Category)</th>
              <th className="py-2.5 px-3 font-bold text-center">ช่วงวันไม่เคลื่อนไหว</th>
              <th className="py-2.5 px-3 font-bold text-right">จำนวนชิ้น (QTY)</th>
              <th className="py-2.5 px-3 font-bold text-center">สถานะ / ดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
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
                    className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/70 cursor-pointer transition-colors group"
                  >
                    {/* 1. รหัสสินค้า */}
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                      {item.productCode}
                    </td>

                    {/* 2. ชื่อสินค้า */}
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.productName}
                      </div>
                    </td>

                    {/* 3. รุ่น (Model) from Model Dimension */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {item.model || "-"}
                    </td>

                    {/* 4. หมวดหมู่ (Category) from Model Dimension */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.categoryName || "Other"}
                      </span>
                    </td>

                    {/* 5. ช่วงวันไม่เคลื่อนไหว */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
                    </td>

                    {/* 6. จำนวนชิ้น (QTY) */}
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {formatNumber(item.stockQty)} <span className="text-[10px] text-slate-400 font-normal">ชิ้น</span>
                    </td>

                    {/* 7. สถานะ / ดำเนินการ */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
