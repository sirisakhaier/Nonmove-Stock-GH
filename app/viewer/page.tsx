"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
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
  ArrowUpRight,
  ArrowDownRight,
  Filter,
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
  Legend,
} from "recharts";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/validators";
import { TEAM_NAME } from "@/lib/version";
import { useTheme } from "@/components/ThemeProvider";

export default function ViewerOverviewPage() {
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    highSkuCount: 0,
  };

  const periodBreakdown: any[] = summaryData?.periodBreakdown || [];
  const skuRanking: any[] = summaryData?.skuRanking || [];
  const categories: string[] = summaryData?.categories || [];

  const filteredSkus = skuRanking.filter((s) => {
    if (selectedPeriodFilter !== "ALL" && s.nonmoveDaysBucket !== selectedPeriodFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.productCode.toLowerCase().includes(q) ||
        s.productName.toLowerCase().includes(q) ||
        s.model.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    if (!skuRanking.length) return;
    const headers = [
      "ProductCode",
      "ProductName",
      "Model",
      "Category",
      "SubCategory",
      "NonmovePeriod",
      "AgingPeriod",
      "StockQty",
      "StockValueTHB",
      "BranchCount",
      "RiskClassification",
    ];
    const rows = filteredSkus.map((s) => [
      `="${s.productCode}"`,
      `"${(s.productName || "").replace(/"/g, "")}"`,
      `"${(s.model || "").replace(/"/g, "")}"`,
      `"${s.category || ""}"`,
      `"${s.subCategory || ""}"`,
      `"${s.nonmoveDaysBucket} วัน"`,
      `"${s.agingDaysBucket} วัน"`,
      s.stockQty,
      s.stockValue,
      s.branchCount,
      s.classification === "HIGH" ? "วิกฤต (>120 วัน)" : "ปกติ (<=120 วัน)",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NonMove_Period_SKU_Analysis_${selectedRegion}_${selectedDate}.csv`;
    link.click();
  };

  const isDark = theme === "dark";
  const gridColor = isDark ? "#334155" : "#f1f5f9";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const tooltipText = isDark ? "#f8fafc" : "#0f172a";

  const delta = trendData?.delta || { stockQtyDiff: 0, stockValueDiff: 0, highPctDiff: 0 };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Layers className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  แดชบอร์ดวิเคราะห์สต๊อกไม่เคลื่อนไหว (Executive Non-Move Dashboard)
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {selectedRegion === "ALL" ? "ทั่วประเทศ (Nationwide)" : `ภาค ${selectedRegion}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                วิเคราะห์แยกตามช่วงวันไม่เคลื่อนไหว (Period), จำนวนชิ้น (QTY), รายการ (SKU), มูลค่า (Amount) และแนวโน้มรายวัน · {TEAM_NAME}
              </p>
            </div>
          </div>

          {/* Controls: Region, Category, Date Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Region Selector */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 shadow-inner">
              <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">ทุกภูมิภาค</option>
                {regions.map((reg) => (
                  <option key={reg} value={reg} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    ภาค {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 shadow-inner">
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">ทุกหมวดหมู่</option>
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Selector */}
            {availableDates.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 shadow-inner">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      วันที่: {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => fetchViewerData(selectedDate, selectedRegion, selectedCategory)}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-2.5 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 1. Master KPI Cards: Amount, QTY, SKU, Critical High Ratio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Amount (มูลค่าสต๊อกรวม) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                มูลค่าสต๊อกไม่เคลื่อนไหว (Amount)
              </span>
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(kpis.totalStockValue)}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              {trendData?.hasComparison && (
                <span className={delta.stockValueDiff > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                  {delta.stockValueDiff > 0 ? `+${formatCurrency(delta.stockValueDiff)}` : formatCurrency(delta.stockValueDiff)} เทียบรอบก่อน
                </span>
              )}
            </div>
          </div>

          {/* Total Units (จำนวนชิ้น QTY) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                จำนวนชิ้นคงเหลือ (Total QTY)
              </span>
              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 p-2.5 text-indigo-600 dark:text-indigo-400">
                <Boxes className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {formatNumber(kpis.totalStockQty)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">ชิ้น</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              กระจายใน {formatNumber(kpis.totalStores)} สาขา
            </div>
          </div>

          {/* Total SKUs (จำนวนรายการสินค้า) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                จำนวนรายการสินค้า (Total SKUs)
              </span>
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/60 p-2.5 text-blue-600 dark:text-blue-400">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {formatNumber(kpis.totalSkus)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">SKU</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              โมเดลสินค้าที่ไม่เคลื่อนไหว
            </div>
          </div>

          {/* Critical High Ratio (% วิกฤต > 120 วัน) */}
          <div className="rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                สัดส่วนค้างนานวิกฤต (&gt; 120 วัน)
              </span>
              <div className="rounded-2xl bg-rose-100 dark:bg-rose-950/80 p-2.5 text-rose-600 dark:text-rose-400">
                <Flame className="h-5 w-5 fill-rose-500 text-rose-500" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-300">
                {formatPercent(kpis.highNonmoveRatio)}
              </span>
              <span className="text-xs text-rose-600/80 dark:text-rose-400/80 font-bold">ของมูลค่ารวม</span>
            </div>
            <div className="mt-1 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center justify-between">
              <span>🔥 {formatCurrency(kpis.highValue)}</span>
              <span>({formatNumber(kpis.highQty)} ชิ้น)</span>
            </div>
          </div>
        </div>

        {/* 2. Visual Charts: Period Breakdown & Daily Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Period Breakdown (Amount & QTY) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  มูลค่าสต๊อกแยกตามช่วงวันไม่เคลื่อนไหว (Amount by Period)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  มูลค่าสต๊อก (บาท) จำแนกตามแต่ละ Bucket
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-emerald-500 inline-block" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">&le; 120 วัน</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-rose-500 inline-block" />
                  <span className="text-rose-600 dark:text-rose-400 font-bold">&gt; 120 วัน</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor, fontWeight: 500 }} stroke={gridColor} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: tickColor }} stroke={gridColor} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(val: any, name: string) => [
                      `฿${Number(val).toLocaleString("th-TH")}`,
                      "มูลค่าสต๊อกรวม (Amount)",
                    ]}
                    labelFormatter={(l) => `ช่วงวัน: ${l}`}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: "14px",
                      color: tooltipText,
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="stockValue" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {periodBreakdown.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.classification === "HIGH" ? "#f43f5e" : "#10b981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Daily Trend Progression (Timeline Progression) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  แนวโน้มมูลค่าสต๊อกตามรอบวันรายงาน (Daily Trend)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  พัฒนาการมูลค่าสต๊อกรวมและสัดส่วนวิกฤต
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                <TrendingUp className="h-4 w-4" />
                Timeline
              </div>
            </div>

            <div className="h-64 w-full">
              {trendData?.historicalSnapshots?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData.historicalSnapshots} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorViewerTrendV2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor, fontWeight: 500 }} stroke={gridColor} />
                    <YAxis tick={{ fontSize: 11, fill: tickColor }} stroke={gridColor} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      formatter={(val: any, name: string) => [
                        formatCurrency(Number(val)),
                        name === "totalStockValue" ? "มูลค่าสต๊อกรวม" : "สัดส่วนวิกฤต (% High)",
                      ]}
                      labelFormatter={(l) => `วันที่: ${l}`}
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: "14px",
                        color: tooltipText,
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="totalStockValue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViewerTrendV2)" name="totalStockValue" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  กำลังโหลดข้อมูลแนวโน้ม...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. MASTER TABLE: Non-Move Period Breakdown Table */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ตารางสรุปสต๊อกแยกตามช่วงวันไม่เคลื่อนไหว (Non-Move Period Breakdown)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                จำแนกจำนวนรายการสินค้า (SKU), จำนวนชิ้น (QTY), มูลค่าสต๊อก (Amount บาท) และสัดส่วน % ตามช่วงวัน
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-5 font-bold">ช่วงวันไม่เคลื่อนไหว (Period)</th>
                  <th className="py-3.5 px-4 font-bold text-center">ระดับความเสี่ยง</th>
                  <th className="py-3.5 px-4 font-bold text-right">จำนวน SKU</th>
                  <th className="py-3.5 px-4 font-bold text-right">สัดส่วน SKU (%)</th>
                  <th className="py-3.5 px-4 font-bold text-right">จำนวนชิ้น (QTY)</th>
                  <th className="py-3.5 px-4 font-bold text-right">สัดส่วน QTY (%)</th>
                  <th className="py-3.5 px-4 font-bold text-right">มูลค่าสต๊อก (Amount บาท)</th>
                  <th className="py-3.5 px-4 font-bold text-right">สัดส่วน Amount (%)</th>
                  <th className="py-3.5 px-4 font-bold text-right">จำนวนสาขา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {periodBreakdown.map((p) => {
                  const isHigh = p.classification === "HIGH";
                  return (
                    <tr
                      key={p.period}
                      onClick={() => setSelectedPeriodFilter(selectedPeriodFilter === p.period ? "ALL" : p.period)}
                      className={`hover:bg-indigo-50/50 dark:hover:bg-slate-800/70 cursor-pointer transition-colors ${
                        selectedPeriodFilter === p.period ? "bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {p.label}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isHigh
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}>
                          {isHigh && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
                          {isHigh ? "วิกฤต (>120 วัน)" : "ปกติ (<=120 วัน)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatNumber(p.skuCount)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {p.skuPct}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatNumber(p.stockQty)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {p.qtyPct}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(p.stockValue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                        <span className={isHigh ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-700 dark:text-slate-300"}>
                          {p.valuePct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                        {p.storeCount} สาขา
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Grand Total Footer */}
              <tfoot className="bg-slate-100 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td className="py-3.5 px-5 font-black text-slate-900 dark:text-white">รวมทั้งหมด (Grand Total)</td>
                  <td className="py-3.5 px-4 text-center">-</td>
                  <td className="py-3.5 px-4 text-right">{formatNumber(kpis.totalSkus)}</td>
                  <td className="py-3.5 px-4 text-right">100%</td>
                  <td className="py-3.5 px-4 text-right">{formatNumber(kpis.totalStockQty)}</td>
                  <td className="py-3.5 px-4 text-right">100%</td>
                  <td className="py-3.5 px-4 text-right text-indigo-600 dark:text-indigo-400 text-sm">{formatCurrency(kpis.totalStockValue)}</td>
                  <td className="py-3.5 px-4 text-right">100%</td>
                  <td className="py-3.5 px-4 text-right">{kpis.totalStores} สาขา</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 4. DETAIL TABLE: Top Non-Move SKU Ranking */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  รายการสินค้าไม่เคลื่อนไหวสูงสุด (Top Non-Move SKUs & Models)
                </h2>
                {selectedPeriodFilter !== "ALL" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                    กรองช่วง: {selectedPeriodFilter} วัน
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                พบ {formatNumber(filteredSkus.length)} รายการ (เรียงตามมูลค่าคงเหลือสูงสุด)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหารหัสสินค้า, ชื่อรุ่น, หมวดหมู่..."
                  className="w-60 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Export CSV */}
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                <Download className="h-4 w-4" />
                ส่งออก CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold">อันดับ</th>
                  <th className="py-3.5 px-4 font-bold">รหัสสินค้า</th>
                  <th className="py-3.5 px-4 font-bold">ชื่อสินค้า / รุ่น (Model)</th>
                  <th className="py-3.5 px-4 font-bold">หมวดหมู่</th>
                  <th className="py-3.5 px-4 font-bold text-center">ช่วงวัน Non-Move</th>
                  <th className="py-3.5 px-4 font-bold text-right">จำนวนชิ้น (QTY)</th>
                  <th className="py-3.5 px-4 font-bold text-right">มูลค่าสต๊อก (Amount บาท)</th>
                  <th className="py-3.5 px-4 font-bold text-right">กระจายในสาขา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSkus.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                      ไม่พบรายการสินค้าที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredSkus.slice(0, 100).map((s, idx) => {
                    const isHigh = s.classification === "HIGH";
                    return (
                      <tr key={s.productCode} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/70 transition-colors group">
                        <td className="py-3.5 px-4 font-bold text-slate-400 whitespace-nowrap">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                          {s.productCode}
                        </td>
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {s.productName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            รุ่น: {s.model}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {s.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isHigh
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          }`}>
                            {isHigh && <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />}
                            {s.nonmoveDaysBucket} วัน
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {formatNumber(s.stockQty)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(s.stockValue)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                          {s.branchCount} สาขา
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 dark:text-slate-500 py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div>&copy; 2026 Non-Move Stock App · <strong>{TEAM_NAME}</strong></div>
      </footer>
    </div>
  );
}
