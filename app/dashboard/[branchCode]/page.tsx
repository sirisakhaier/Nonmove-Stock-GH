"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { KpiCards } from "@/components/KpiCards";
import { NonmoveChart } from "@/components/NonmoveChart";
import { ModelExplorerTable } from "@/components/ModelExplorerTable";
import { ActionPanel } from "@/components/ActionPanel";
import {
  Calendar,
  Store,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function StoreDashboard() {
  const params = useParams();
  const router = useRouter();
  const branchCode = params.branchCode as string;

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [storeInfo, setStoreInfo] = useState<{ branchCode: string; branchName: string; region: string } | null>(null);

  // KPIs & Chart Data
  const [kpiData, setKpiData] = useState<any>({
    totalSkus: 0,
    totalStockQty: 0,
    totalStockValue: 0,
    highNonmoveRatio: 0,
    highCount: 0,
    okCount: 0,
    overallOkPct: 0,
  });
  const [bucketChart, setBucketChart] = useState<any[]>([]);
  const [categoryChart, setCategoryChart] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Table Data & Filters
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedBucket, setSelectedBucket] = useState("ALL");
  const [selectedSkuType, setSelectedSkuType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [highPct, setHighPct] = useState(0);
  const [okPct, setOkPct] = useState(0);

  // Drawer
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Store Details & Summary
  const fetchSummary = useCallback(async (date?: string, cat?: string) => {
    try {
      const url = new URL("/api/nonmove/summary", window.location.origin);
      url.searchParams.set("branchCode", branchCode);
      if (date) url.searchParams.set("date", date);
      if (cat && cat !== "ALL") url.searchParams.set("category", cat);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("โหลดข้อมูลสรุปไม่สำเร็จ");
      const data = await res.json();

      if (data.store) {
        setStoreInfo(data.store);
      }
      setAvailableDates(data.availableDates || []);
      if (!selectedDate && data.selectedDate) {
        setSelectedDate(data.selectedDate);
      }
      if (data.kpis) {
        setKpiData(data.kpis);
        setHighPct(data.kpis.highNonmoveRatio || 0);
        setOkPct(data.kpis.overallOkPct || 0);
      }
      setBucketChart(data.chartData || []);
      setCategoryChart(data.categoryBreakdown || data.categoryData || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [branchCode, selectedDate]);

  // 2. Fetch Table Data
  const fetchTableData = useCallback(async () => {
    try {
      const url = new URL("/api/nonmove", window.location.origin);
      url.searchParams.set("branchCode", branchCode);
      if (selectedDate) url.searchParams.set("date", selectedDate);
      if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);
      if (selectedBucket !== "ALL") url.searchParams.set("nonmoveDaysBucket", selectedBucket);
      if (selectedSkuType !== "ALL") url.searchParams.set("skuType", selectedSkuType);
      if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
      if (search.trim()) url.searchParams.set("search", search.trim());
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("โหลดรายการสินค้าไม่สำเร็จ");
      const data = await res.json();

      setTableRows(data.data || data.items || []);
      setTotalRows(data.total !== undefined ? data.total : (data.totalCount || 0));
      if (data.highPct !== undefined) setHighPct(data.highPct);
      if (data.okPct !== undefined) setOkPct(data.okPct);
    } catch (error) {
      console.error("Error fetching table data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    branchCode,
    selectedDate,
    selectedCategory,
    selectedBucket,
    selectedSkuType,
    selectedStatus,
    search,
    page,
    limit,
  ]);

  useEffect(() => {
    setIsLoading(true);
    fetchSummary().then(() => {
      fetchTableData();
    });
  }, [branchCode, fetchSummary, fetchTableData]);

  useEffect(() => {
    fetchTableData();
  }, [selectedDate, selectedCategory, selectedBucket, selectedSkuType, selectedStatus, search, page, fetchTableData]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setPage(1);
    fetchSummary(newDate, selectedCategory);
  };

  const handleExport = () => {
    const url = new URL("/api/nonmove/export", window.location.origin);
    url.searchParams.set("branchCode", branchCode);
    if (selectedDate) url.searchParams.set("date", selectedDate);
    if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);
    if (selectedBucket !== "ALL") url.searchParams.set("nonmoveDaysBucket", selectedBucket);
    if (selectedSkuType !== "ALL") url.searchParams.set("skuType", selectedSkuType);
    if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
    if (search.trim()) url.searchParams.set("search", search.trim());

    window.open(url.toString(), "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Store Overview & Date Picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {storeInfo?.branchName || branchCode}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-mono">
                  {branchCode}
                </span>
                {storeInfo?.region && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {storeInfo.region}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                แดชบอร์ดติดตามและจัดการสต๊อกสินค้าไม่เคลื่อนไหวประจำสาขา
              </p>
            </div>
          </div>

          {/* Date Selector & Action Buttons */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {availableDates.length > 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 shadow-inner">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <select
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      รายงานวันที่: {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => {
                fetchSummary(selectedDate, selectedCategory);
                fetchTableData();
              }}
              title="รีเฟรชข้อมูล"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-2.5 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 1. KPI Cards */}
        <KpiCards data={kpiData} />

        {/* 2. Visual Charts */}
        <NonmoveChart bucketData={bucketChart} categoryData={categoryChart} />

        {/* 3. Model Explorer Table */}
        <ModelExplorerTable
          data={tableRows}
          total={totalRows}
          page={page}
          limit={limit}
          onPageChange={setPage}
          search={search}
          onSearchChange={(q) => { setSearch(q); setPage(1); }}
          selectedCategory={selectedCategory}
          onCategoryChange={(c) => { setSelectedCategory(c); setPage(1); }}
          selectedBucket={selectedBucket}
          onBucketChange={(b) => { setSelectedBucket(b); setPage(1); }}
          selectedSkuType={selectedSkuType}
          onSkuTypeChange={(s) => { setSelectedSkuType(s); setPage(1); }}
          selectedStatus={selectedStatus}
          onStatusChange={(st) => { setSelectedStatus(st); setPage(1); }}
          categories={categories}
          highPct={highPct}
          okPct={okPct}
          onSelectProduct={(p) => {
            setSelectedProduct(p);
            setIsDrawerOpen(true);
          }}
          onExport={handleExport}
        />
      </main>

      {/* Action Drawer */}
      <ActionPanel
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        product={selectedProduct}
        branchCode={branchCode}
        onSuccess={() => {
          fetchSummary(selectedDate, selectedCategory);
          fetchTableData();
        }}
      />
    </div>
  );
}
