"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Calendar,
  MapPin,
  Flame,
  CheckCircle2,
  DollarSign,
  Package,
  Boxes,
  TrendingUp,
  Download,
  RefreshCw,
  Search,
  Filter,
  Building2,
  Store,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/validators";
import { useTheme } from "@/components/ThemeProvider";
import { TEAM_NAME } from "@/lib/version";

export function ExecutiveViewerDashboard() {
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<"CATEGORY" | "REGION" | "TREND" | "TOP_STORES" | "TOP_MODELS">("CATEGORY");
  const [search, setSearch] = useState("");
  const { theme } = useTheme();

  // 1. Fetch Regions
  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => setRegions(data.regions || []));
  }, []);

  // 2. Fetch Summary & Trend
  const fetchViewerData = useCallback(async (date?: string, region?: string, category?: string) => {
    setIsLoading(true);
    try {
      const url = new URL("/api/viewer/summary", window.location.origin);
      if (region && region !== "ALL") url.searchParams.set("region", region);
      if (date) url.searchParams.set("date", date);
      if (category && category !== "ALL") url.searchParams.set("category", category);

      const trendUrl = new URL("/api/viewer/trend", window.location.origin);
      if (region && region !== "ALL") trendUrl.searchParams.set("region", region);

      const [resSummary, resTrend] = await Promise.all([
        fetch(url.toString()),
        fetch(trendUrl.toString()),
      ]);

      if (resSummary.ok) {
        const data = await resSummary.json();
        setSummaryData(data);
        setAvailableDates(data.availableDates || []);
        if (!selectedDate && data.selectedDate) {
          setSelectedDate(data.selectedDate);
        }
      }

      if (resTrend.ok) {
        const tData = await resTrend.json();
        setTrendData(tData);
      }
    } catch (err) {
      console.error("Error fetching viewer summary:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchViewerData(selectedDate, selectedRegion, selectedCategory);
  }, [selectedRegion, selectedDate, selectedCategory, fetchViewerData]);

  const kpis = summaryData?.kpis || {
    totalStockValue: 0,
    totalStockQty: 0,
    totalSkus: 0,
    totalStores: 0,
    highNonmoveRatio: 0,
    okRatio: 0,
    highValue: 0,
    highQty: 0,
  };

  const periodBreakdown = summaryData?.periodBreakdown || [];
  const categoryBreakdown = summaryData?.categoryBreakdown || [];
  const regionBreakdown = summaryData?.regionBreakdown || [];
  const top20Stores = summaryData?.top20Stores || [];
  const top20Models = summaryData?.top20Models || [];
  const historicalSnapshots = trendData?.historicalSnapshots || [];

  const isDark = theme === "dark";
  const gridColor = isDark ? "#334155" : "#f1f5f9";
  const tickColor = isDark ? "#94a3b8" : "#64748b";

  // Filtered lists by search term
  const filteredCategories = categoryBreakdown.filter((c: any) =>
    c.category.toLowerCase().includes(search.toLowerCase())
  );
  const filteredRegions = regionBreakdown.filter((r: any) =>
    r.region.toLowerCase().includes(search.toLowerCase())
  );
  const filteredStores = top20Stores.filter((s: any) =>
    s.branchCode.toLowerCase().includes(search.toLowerCase()) ||
    s.storeName.toLowerCase().includes(search.toLowerCase()) ||
    s.region.toLowerCase().includes(search.toLowerCase())
  );
  const filteredModels = top20Models.filter((m: any) =>
    m.productCode.toLowerCase().includes(search.toLowerCase()) ||
    m.model.toLowerCase().includes(search.toLowerCase()) ||
    m.productName.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  // CSV Export for active tab
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `NonMove_Analysis_${activeAnalysisTab}_${selectedDate}.csv`;

    if (activeAnalysisTab === "CATEGORY") {
      headers = ["Category", "TotalSKUs", "StockQty", "StockValueTHB", "HighValueTHB", "HighQty", "HighRatioPct", "SharePct"];
      rows = filteredCategories.map((c: any) => [
        `"${c.category}"`,
        c.totalSkus,
        c.stockQty,
        c.stockValue,
        c.highValue,
        c.highQty,
        c.highPct,
        c.sharePct,
      ]);
    } else if (activeAnalysisTab === "REGION") {
      headers = ["Region", "StoreCount", "TotalSKUs", "StockQty", "StockValueTHB", "HighValueTHB", "HighQty", "HighRatioPct", "SharePct"];
      rows = filteredRegions.map((r: any) => [
        `"${r.region}"`,
        r.storeCount,
        r.totalSkus,
        r.stockQty,
        r.stockValue,
        r.highValue,
        r.highQty,
        r.highPct,
        r.sharePct,
      ]);
    } else if (activeAnalysisTab === "TREND") {
      headers = ["Date", "StockValueTHB", "StockQty", "TotalSKUs", "HighRatioPct", "HighValueTHB"];
      rows = historicalSnapshots.map((s: any) => [
        s.date,
        s.totalStockValue,
        s.totalStockQty,
        s.totalSkus,
        s.highPct,
        s.highValue,
      ]);
    } else if (activeAnalysisTab === "TOP_STORES") {
      headers = ["Rank", "BranchCode", "StoreName", "Region", "TotalSKUs", "StockQty", "StockValueTHB", "HighValueTHB", "HighRatioPct"];
      rows = filteredStores.map((s: any, idx: number) => [
        idx + 1,
        `"${s.branchCode}"`,
        `"${s.storeName}"`,
        `"${s.region}"`,
        s.totalSkus,
        s.stockQty,
        s.stockValue,
        s.highValue,
        s.highPct,
      ]);
    } else if (activeAnalysisTab === "TOP_MODELS") {
      headers = ["Rank", "ProductCode", "Model", "SKU_TYPE", "Category", "Bucket", "StockQty", "StockValueTHB", "BranchCount"];
      rows = filteredModels.map((m: any, idx: number) => [
        idx + 1,
        `"${m.productCode}"`,
        `"${m.model}"`,
        `"${m.skuType}"`,
        `"${m.category}"`,
        `"${m.nonmoveDaysBucket}"`,
        m.stockQty,
        m.stockValue,
        m.branchCount,
      ]);
    }

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Layers className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                ภาพรวมผู้บริหาร (Executive Analysis)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {selectedRegion === "ALL" ? "ทั่วประเทศ (Nationwide)" : `ภาค ${selectedRegion}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              วิเคราะห์เจาะลึกแยกตามหมวดหมู่, ภูมิภาค, แนวโน้มรายวัน, Top 20 สาขา และ Top 20 โมเดล
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Date Selector */}
          {availableDates.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 sm:py-2 text-xs font-bold">
              <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    รอบวันที่: {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Region Filter */}
          <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 sm:py-2 text-xs font-bold">
            <MapPin className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                ทุกภูมิภาค (Nationwide)
              </option>
              {regions.map((r) => (
                <option key={r} value={r} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  ภาค {r}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchViewerData(selectedDate, selectedRegion, selectedCategory)}
            title="รีเฟรชข้อมูล"
            className="rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-2 sm:p-2.5 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards (2x2 grid on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Stock Value */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              มูลค่ารวม (Stock Value)
            </span>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 p-2 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className="text-base sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">
              {formatCurrency(kpis.totalStockValue)}
            </span>
          </div>
          <div className="mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            สต๊อกค้าง &gt; 30 วัน
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              จำนวนชิ้น (Stock Units)
            </span>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2 text-emerald-600 dark:text-emerald-400">
              <Boxes className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className="text-base sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
              {formatNumber(kpis.totalStockQty)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">ชิ้น</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            กระจายใน {formatNumber(kpis.totalStores)} สาขา
          </div>
        </div>

        {/* Total SKUs */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              จำนวนโมเดล (SKUs)
            </span>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/60 p-2 text-blue-600 dark:text-blue-400">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className="text-base sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
              {formatNumber(kpis.totalSkus)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">SKU</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            โมเดลสินค้าที่ไม่เคลื่อนไหว
          </div>
        </div>

        {/* Critical Ratio (>120 Days) */}
        <div className="rounded-2xl sm:rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              วิกฤต (&gt; 120 วัน)
            </span>
            <div className="rounded-xl bg-rose-100 dark:bg-rose-950/80 p-2 text-rose-600 dark:text-rose-400">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-rose-500 text-rose-500" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className="text-base sm:text-2xl lg:text-3xl font-black text-rose-700 dark:text-rose-300">
              {formatPercent(kpis.highNonmoveRatio)}
            </span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-bold">ของมูลค่ารวม</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-xs text-rose-700 dark:text-rose-300 font-bold truncate">
            🔥 {formatCurrency(kpis.highValue)} ({formatNumber(kpis.highQty)} ชิ้น)
          </div>
        </div>
      </div>

      {/* 3. Visual Charts (Period Distribution & Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Period Breakdown Bar Chart */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                มูลค่าสต๊อกแยกตามช่วงวันไม่เคลื่อนไหว (Period)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จำแนกตามแต่ละ Bucket (บาท)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500 inline-block" /> &le; 120 วัน
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <span className="h-2.5 w-2.5 rounded bg-rose-500 inline-block" /> &gt; 120 วัน
              </span>
            </div>
          </div>

          <div className="h-48 sm:h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} angle={-15} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: gridColor, borderRadius: "1rem" }}
                  formatter={(value: any) => [formatCurrency(Number(value)), "มูลค่า"]}
                />
                <Bar dataKey="stockValue" radius={[6, 6, 0, 0]}>
                  {periodBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.classification === "HIGH" ? "#f43f5e" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day-by-Day Historical Trend Area Chart */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              แนวโน้มมูลค่าสต๊อกสะสมตามรอบวัน (Historical Trend)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ติดตามการเปลี่ยนแปลงมูลค่าสต๊อกรวมตามรอบวันที่นำเข้า
            </p>
          </div>

          <div className="h-48 sm:h-60 w-full">
            {historicalSnapshots.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูลแนวโน้มประวัติ
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalSnapshots} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <defs>
                    <linearGradient id="viewerTrendVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: gridColor, borderRadius: "1rem" }}
                    formatter={(value: any) => [formatCurrency(Number(value)), "มูลค่ารวม"]}
                  />
                  <Area type="monotone" dataKey="totalStockValue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#viewerTrendVal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 4. EXCLUSIVE ANALYSIS SECTION (Separated Reports for Category, Region, Trend, Top 20 Stores, Top 20 Models) */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6 transition-colors">
        {/* Navigation Tabs for Exclusive Analysis Reports */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => { setActiveAnalysisTab("CATEGORY"); setSearch(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeAnalysisTab === "CATEGORY"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              หมวดหมู่สินค้า ({categoryBreakdown.length})
            </button>

            <button
              type="button"
              onClick={() => { setActiveAnalysisTab("REGION"); setSearch(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeAnalysisTab === "REGION"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              ภูมิภาค ({regionBreakdown.length})
            </button>

            <button
              type="button"
              onClick={() => { setActiveAnalysisTab("TREND"); setSearch(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeAnalysisTab === "TREND"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              แนวโน้มรายวัน ({historicalSnapshots.length})
            </button>

            <button
              type="button"
              onClick={() => { setActiveAnalysisTab("TOP_STORES"); setSearch(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeAnalysisTab === "TOP_STORES"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Top 20 สาขาค้างสูงสุด
            </button>

            <button
              type="button"
              onClick={() => { setActiveAnalysisTab("TOP_MODELS"); setSearch(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeAnalysisTab === "TOP_MODELS"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Boxes className="h-3.5 w-3.5" />
              Top 20 โมเดลค้างสูงสุด
            </button>
          </div>

          {/* Search & Export Toolbar */}
          <div className="flex items-center gap-2">
            {activeAnalysisTab !== "TREND" && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาในตาราง..."
                  className="w-44 sm:w-56 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              ส่งออก CSV
            </button>
          </div>
        </div>

        {/* 4.1 REPORT: CATEGORY BREAKDOWN */}
        {activeAnalysisTab === "CATEGORY" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-bold">หมวดหมู่สินค้า (Category)</th>
                  <th className="py-3 px-4 font-bold text-center">สัดส่วน (% Share)</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวน SKU</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวนชิ้น (QTY)</th>
                  <th className="py-3 px-4 font-bold text-right">มูลค่ารวม (บาท)</th>
                  <th className="py-3 px-4 font-bold text-center">สัดส่วนวิกฤต (% High)</th>
                  <th className="py-3 px-4 font-bold text-right">มูลค่าวิตฤต (&gt;120 วัน)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลหมวดหมู่สินค้า
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((c: any) => (
                    <tr key={c.category} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {c.category}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          {c.sharePct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{formatNumber(c.totalSkus)}</td>
                      <td className="py-3 px-4 text-right font-bold">{formatNumber(c.stockQty)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(c.stockValue)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          c.highPct > 40
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                        }`}>
                          {c.highPct > 40 && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
                          {c.highPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(c.highValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4.2 REPORT: REGION BREAKDOWN */}
        {activeAnalysisTab === "REGION" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-bold">ภูมิภาค (Region)</th>
                  <th className="py-3 px-4 font-bold text-center">สัดส่วน (% Share)</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวนสาขา</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวน SKU</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวนชิ้น (QTY)</th>
                  <th className="py-3 px-4 font-bold text-right">มูลค่ารวม (บาท)</th>
                  <th className="py-3 px-4 font-bold text-center">สัดส่วนวิกฤต (% High)</th>
                  <th className="py-3 px-4 font-bold text-right">มูลค่าวิตฤต (&gt;120 วัน)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRegions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลภูมิภาค
                    </td>
                  </tr>
                ) : (
                  filteredRegions.map((r: any) => (
                    <tr key={r.region} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        ภาค {r.region}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          {r.sharePct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{r.storeCount} สาขา</td>
                      <td className="py-3 px-4 text-right font-medium">{formatNumber(r.totalSkus)}</td>
                      <td className="py-3 px-4 text-right font-bold">{formatNumber(r.stockQty)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(r.stockValue)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          r.highPct > 40
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                        }`}>
                          {r.highPct > 40 && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
                          {r.highPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(r.highValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4.3 REPORT: TREND OF DAY SNAPSHOTS */}
        {activeAnalysisTab === "TREND" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-bold">รอบวันที่บันทึก (Date)</th>
                  <th className="py-3 px-4 font-bold text-right">มูลค่าสต๊อกรวม (บาท)</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวนชิ้น (QTY)</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวน SKU</th>
                  <th className="py-3 px-4 font-bold text-center">สัดส่วนวิกฤต (% High)</th>
                  <th className="py-3 px-4 font-bold text-right">มูลค่าวิตฤต (&gt;120 วัน)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {historicalSnapshots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      ไม่มีข้อมูลบันทึกรายวัน
                    </td>
                  </tr>
                ) : (
                  historicalSnapshots.map((s: any) => (
                    <tr key={s.date} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        {s.date}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(s.totalStockValue)}</td>
                      <td className="py-3 px-4 text-right font-bold">{formatNumber(s.totalStockQty)}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatNumber(s.totalSkus)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          s.highPct > 40
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                        }`}>
                          {s.highPct > 40 && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
                          {s.highPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(s.highValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4.4 REPORT: TOP 20 STORES HIGH NON-MOVE */}
        {activeAnalysisTab === "TOP_STORES" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-bold">อันดับ</th>
                  <th className="py-3 px-4 font-bold">รหัสสาขา</th>
                  <th className="py-3 px-4 font-bold">ชื่อสาขา (Store Name)</th>
                  <th className="py-3 px-4 font-bold text-center">ภูมิภาค</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวน SKU</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวนชิ้น (QTY)</th>
                  <th className="py-3 px-4 font-bold text-right">มูลค่ารวม (บาท)</th>
                  <th className="py-3 px-4 font-bold text-center">สัดส่วนวิกฤต</th>
                  <th className="py-3 px-4 font-bold text-right">มูลค่าวิตฤต</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลสาขา
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((st: any, idx: number) => (
                    <tr key={st.branchCode} className="hover:bg-rose-50/40 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        {st.branchCode}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {st.storeName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {st.region}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{formatNumber(st.totalSkus)}</td>
                      <td className="py-3 px-4 text-right font-bold">{formatNumber(st.stockQty)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(st.stockValue)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                          {st.highPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(st.highValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4.5 REPORT: TOP 20 MODELS HIGH NON-MOVE */}
        {activeAnalysisTab === "TOP_MODELS" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-bold">อันดับ</th>
                  <th className="py-3 px-4 font-bold">รหัสสินค้า</th>
                  <th className="py-3 px-4 font-bold">รุ่นสินค้า (Model)</th>
                  <th className="py-3 px-4 font-bold text-center">ประเภท (SKU_TYPE)</th>
                  <th className="py-3 px-4 font-bold">หมวดหมู่</th>
                  <th className="py-3 px-4 font-bold text-center">ช่วงวัน</th>
                  <th className="py-3 px-4 font-bold text-right">จำนวนชิ้น (QTY)</th>
                  <th className="py-3 px-4 font-bold text-right">มูลค่ารวม (บาท)</th>
                  <th className="py-3 px-4 font-bold text-right">กระจายในสาขา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลโมเดลสินค้า
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((m: any, idx: number) => {
                    const isHigh = m.classification === "HIGH";
                    return (
                      <tr key={m.productCode} className="hover:bg-purple-50/40 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {m.productCode}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {m.model}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {m.skuType || "SELLABLE"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {m.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isHigh
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                              : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                          }`}>
                            {isHigh && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
                            {m.nonmoveDaysBucket} วัน
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">{formatNumber(m.stockQty)}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(m.stockValue)}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium">{m.branchCount} สาขา</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
