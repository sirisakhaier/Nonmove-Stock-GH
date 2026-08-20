"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { KpiCards } from "@/components/KpiCards";
import { NonmoveChart } from "@/components/NonmoveChart";
import { ModelExplorerTable } from "@/components/ModelExplorerTable";
import { Calendar, RefreshCw, Layers } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";

export default function StoreDashboardPage() {
  const params = useParams();
  const branchCode = params.branchCode as string;

  const [sessionInfo, setSessionInfo] = useState<{ name: string; phone: string } | null>(null);
  const [storeInfo, setStoreInfo] = useState<{ storeNameCust?: string; region?: string; province?: string }>({});
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [summaryData, setSummaryData] = useState<any>({
    totalSkus: 0,
    totalUnits: 0,
    totalValue: 0,
    highCount: 0,
    okCount: 0,
    highPct: 0,
    okPct: 0,
    chartData: [],
    categoryData: [],
    categories: [],
  });

  const [modelsData, setModelsData] = useState<any>({
    items: [],
    totalCount: 0,
    page: 1,
    totalPages: 1,
  });

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedNonmoveBucket, setSelectedNonmoveBucket] = useState("ALL");
  const [selectedAgingBucket, setSelectedAgingBucket] = useState("ALL");
  const [selectedSkuType, setSelectedSkuType] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Read session from cookie
  useEffect(() => {
    try {
      const cookieMatch = document.cookie.match(/nonmove_session=([^;]+)/);
      if (cookieMatch) {
        const parsed = JSON.parse(decodeURIComponent(cookieMatch[1]));
        setSessionInfo({ name: parsed.name, phone: parsed.phone });
      }
    } catch (e) {
      console.warn("Could not parse session cookie:", e);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      let url = `/api/nonmove/summary?branchCode=${branchCode}`;
      if (selectedDate) url += `&reportDate=${selectedDate}`;
      if (selectedCategory !== "ALL") url += `&category=${encodeURIComponent(selectedCategory)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.reportDate && !selectedDate) {
        setSelectedDate(data.reportDate);
      }
      if (data.availableDates) {
        setAvailableDates(data.availableDates);
      }
      setSummaryData(data);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  }, [branchCode, selectedDate, selectedCategory]);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/nonmove?branchCode=${branchCode}&page=${currentPage}&limit=25`;
      if (selectedDate) url += `&reportDate=${selectedDate}`;
      if (selectedCategory !== "ALL") url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (selectedNonmoveBucket !== "ALL") url += `&nonmoveDays=${encodeURIComponent(selectedNonmoveBucket)}`;
      if (selectedAgingBucket !== "ALL") url += `&agingDays=${encodeURIComponent(selectedAgingBucket)}`;
      if (selectedSkuType !== "ALL") url += `&skuType=${selectedSkuType}`;
      if (selectedStatusFilter !== "ALL") url += `&status=${selectedStatusFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      setModelsData(data);
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    branchCode,
    selectedDate,
    selectedCategory,
    selectedNonmoveBucket,
    selectedAgingBucket,
    selectedSkuType,
    selectedStatusFilter,
    searchQuery,
    currentPage,
  ]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleRefresh = () => {
    fetchSummary();
    fetchModels();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        branchCode={branchCode}
        storeName={storeInfo.storeNameCust}
        staffName={sessionInfo?.name}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Top Header & Date Snapshot Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
                {branchCode}
              </span>
              <span className="text-xs text-slate-400 font-medium">Store Performance Analysis</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Non-Move Stock Dashboard
            </h1>
          </div>

          {/* Date Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-slate-600">Report Feed:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <KpiCards
          totalSkus={summaryData.totalSkus || 0}
          totalUnits={summaryData.totalUnits || 0}
          totalValue={summaryData.totalValue || 0}
          highCount={summaryData.highCount || 0}
          highPct={summaryData.highPct || 0}
          okPct={summaryData.okPct || 0}
        />

        {/* 2 Visualizations: Nonmove distribution & Category Value Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <NonmoveChart data={summaryData.chartData || []} />
          </div>

          {/* Category breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900">Top Categories by Value</h3>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mb-4">Stock valuation grouped by product category</p>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {(summaryData.categoryData || []).slice(0, 6).map((cat: any, i: number) => {
                  const maxVal = summaryData.categoryData[0]?.value || 1;
                  const pct = Math.round((cat.value / maxVal) * 100);
                  return (
                    <div key={cat.name} className="text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-800 truncate">{cat.name}</span>
                        <span className="text-emerald-700">฿{cat.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              Showing top categories for {branchCode}
            </div>
          </div>
        </div>

        {/* Model Explorer Table */}
        <ModelExplorerTable
          branchCode={branchCode}
          reportDate={selectedDate}
          items={modelsData.items || []}
          totalCount={modelsData.totalCount || 0}
          page={currentPage}
          totalPages={modelsData.totalPages || 1}
          highPct={summaryData.highPct || 0}
          okPct={summaryData.okPct || 0}
          categories={summaryData.categories || []}
          selectedCategory={selectedCategory}
          onCategoryChange={(c) => {
            setSelectedCategory(c);
            setCurrentPage(1);
          }}
          selectedNonmoveBucket={selectedNonmoveBucket}
          onNonmoveBucketChange={(b) => {
            setSelectedNonmoveBucket(b);
            setCurrentPage(1);
          }}
          selectedAgingBucket={selectedAgingBucket}
          onAgingBucketChange={(b) => {
            setSelectedAgingBucket(b);
            setCurrentPage(1);
          }}
          selectedSkuType={selectedSkuType}
          onSkuTypeChange={(s) => {
            setSelectedSkuType(s);
            setCurrentPage(1);
          }}
          selectedStatusFilter={selectedStatusFilter}
          onStatusFilterChange={(st) => {
            setSelectedStatusFilter(st);
            setCurrentPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          onPageChange={(p) => setCurrentPage(p)}
          onRefresh={handleRefresh}
        />
      </main>
    </div>
  );
}
