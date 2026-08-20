"use client";

import React, { useState } from "react";
import { Search, Download, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/validators";
import { NONMOVE_BUCKET_ORDER, AGING_BUCKET_ORDER } from "@/lib/nonmoveConfig";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { ActionPanel } from "./ActionPanel";

interface ModelExplorerTableProps {
  branchCode: string;
  reportDate: string;
  items: any[];
  totalCount: number;
  page: number;
  totalPages: number;
  highPct: number;
  okPct: number;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedNonmoveBucket: string;
  onNonmoveBucketChange: (b: string) => void;
  selectedAgingBucket: string;
  onAgingBucketChange: (b: string) => void;
  selectedSkuType: string;
  onSkuTypeChange: (sku: string) => void;
  selectedStatusFilter: string;
  onStatusFilterChange: (st: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
}

export const ModelExplorerTable: React.FC<ModelExplorerTableProps> = ({
  branchCode,
  reportDate,
  items,
  totalCount,
  page,
  totalPages,
  highPct,
  okPct,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedNonmoveBucket,
  onNonmoveBucketChange,
  selectedAgingBucket,
  onAgingBucketChange,
  selectedSkuType,
  onSkuTypeChange,
  selectedStatusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  onPageChange,
  onRefresh,
}) => {
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);

  const handleRowClick = (item: any) => {
    setSelectedModel(item);
    setIsActionPanelOpen(true);
  };

  const handleExport = () => {
    const url = `/api/nonmove/export?branchCode=${branchCode}&reportDate=${reportDate}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Model Explorer & Action Table</h3>
            <p className="text-xs text-slate-500">Click any row to explain or request exclusion</p>
          </div>

          {/* Live High/OK Metric Pill */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <span className="text-rose-600 px-2 py-0.5 rounded bg-white shadow-xs">
              🔥 {highPct}% High
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-700 px-2 py-0.5 rounded bg-white shadow-xs">
              ✅ {okPct}% OK
            </span>
            <button
              onClick={handleExport}
              className="ml-2 flex items-center space-x-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white transition text-xs"
              title="Download filtered CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Status Filter Chips Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: "ALL", label: "All Models" },
            { id: "HIGH", label: "🔥 High Non-move" },
            { id: "OK", label: "✅ OK" },
            { id: "PENDING", label: "⏳ Pending Review" },
            { id: "EXCLUDED", label: "🚫 Excluded" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => onStatusFilterChange(chip.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                selectedStatusFilter === chip.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Model / Barcode..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Nonmove Days */}
          <select
            value={selectedNonmoveBucket}
            onChange={(e) => onNonmoveBucketChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
          >
            <option value="ALL">All Nonmove Buckets</option>
            {NONMOVE_BUCKET_ORDER.map((b) => (
              <option key={b} value={b}>
                Nonmove: {b} Days
              </option>
            ))}
          </select>

          {/* Aging Days */}
          <select
            value={selectedAgingBucket}
            onChange={(e) => onAgingBucketChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
          >
            <option value="ALL">All Aging Buckets</option>
            {AGING_BUCKET_ORDER.map((b) => (
              <option key={b} value={b}>
                Aging: {b} Days
              </option>
            ))}
          </select>

          {/* SKU Type */}
          <select
            value={selectedSkuType}
            onChange={(e) => onSkuTypeChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
          >
            <option value="ALL">All SKU Types</option>
            <option value="SELLABLE">Sellable Stock Only</option>
            <option value="MOCK_UP">Mock-up / Display Units</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5 pl-5">Model & Product</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Nonmove Bucket</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Stock Units</th>
              <th className="p-3.5 text-right">Stock Value</th>
              <th className="p-3.5">Request State</th>
              <th className="p-3.5 pr-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No matching models found. Try adjusting your filters or search query.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.productCode}
                  onClick={() => handleRowClick(item)}
                  className="hover:bg-sky-50/50 cursor-pointer transition"
                >
                  <td className="p-3.5 pl-5">
                    <div className="font-bold text-slate-900 text-xs">{item.productName}</div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-700">
                        {item.model}
                      </span>
                      <span>·</span>
                      <span>{item.productCode}</span>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {item.categoryName}
                    </span>
                    {item.subCategory && item.subCategory !== "-" && (
                      <span className="block text-[10px] text-slate-400 mt-0.5">{item.subCategory}</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.classification === "HIGH"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {item.nonmoveDaysBucket}
                    </span>
                  </td>

                  <td className="p-3.5">
                    {item.isExcluded ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        EXCLUDED
                      </span>
                    ) : item.classification === "HIGH" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        HIGH NON-MOVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        OK
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-right font-bold text-slate-900">
                    {formatNumber(item.stockQty)}
                  </td>

                  <td className="p-3.5 text-right font-bold text-emerald-700">
                    {formatCurrency(item.stockValue)}
                  </td>

                  <td className="p-3.5">
                    <RequestStatusBadge
                      status={item.activeRequest?.status}
                      requestType={item.activeRequest?.requestType}
                      reviewComment={item.activeRequest?.reviewComment}
                    />
                  </td>

                  <td className="p-3.5 pr-5 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(item);
                      }}
                      className="inline-flex items-center space-x-1 text-xs text-sky-600 hover:text-sky-800 font-semibold px-2 py-1 rounded hover:bg-sky-100 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Action</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
        <span>
          Showing {(page - 1) * 25 + 1} - {Math.min(page * 25, totalCount)} of {formatNumber(totalCount)} models
        </span>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-800">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide-over Action Panel */}
      <ActionPanel
        isOpen={isActionPanelOpen}
        onClose={() => setIsActionPanelOpen(false)}
        branchCode={branchCode}
        item={selectedModel}
        onSuccess={onRefresh}
      />
    </div>
  );
};
