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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900">
                รายการสินค้าไม่เคลื่อนไหว (Model Explorer)
              </h3>
              {/* Dynamic Live Metric Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="flex items-center gap-1 text-rose-600">
                  <Flame className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                  {highPct}% วิกฤต
                </span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {okPct}% ปกติ
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              พบทั้งหมด {formatNumber(total)} รายการ (คลิกที่แถวเพื่อชี้แจงสาเหตุหรือขอปลดล็อค)
            </p>
          </div>

          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors shrink-0"
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
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">รหัสสินค้า</th>
              <th className="py-3 px-4 font-semibold">ชื่อสินค้า / รุ่น</th>
              <th className="py-3 px-4 font-semibold">หมวดหมู่</th>
              <th className="py-3 px-4 font-semibold">ช่วงวันไม่เคลื่อนไหว</th>
              <th className="py-3 px-4 font-semibold">อายุสินค้า</th>
              <th className="py-3 px-4 font-semibold text-right">จำนวนสต๊อก</th>
              <th className="py-3 px-4 font-semibold text-right">มูลค่า (บาท)</th>
              <th className="py-3 px-4 font-semibold text-center">สถานะ / การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
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
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.productCode}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        รุ่น: {item.model}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                        {item.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isHigh
                            ? "bg-rose-100 text-rose-700"
                            : item.isExcluded
                            ? "bg-emerald-100 text-emerald-800 line-through"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isHigh && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
                        {item.nonmoveDaysBucket} วัน
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {item.agingDaysBucket} วัน
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatNumber(item.stockQty)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
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
                          className="rounded-lg p-1 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
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
      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 bg-slate-50/50">
        <div className="text-xs text-slate-500">
          แสดง {total === 0 ? 0 : (page - 1) * limit + 1} ถึง {Math.min(page * limit, total)} จากทั้งหมด {formatNumber(total)} รายการ
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-xs font-semibold text-slate-700">
            หน้า {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
