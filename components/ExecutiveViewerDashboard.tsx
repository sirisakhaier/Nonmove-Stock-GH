"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  Boxes,
  TrendingUp,
  Download,
  RefreshCw,
  Search,
  Building2,
  Store,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/validators";
import { useTheme } from "@/components/ThemeProvider";
import { TEAM_NAME } from "@/lib/version";

const ALL_PERIOD_BUCKETS = [
  { key: "30-60 วัน", label: "30-60 วัน", color: "#0ea5e9" },
  { key: "60-90 วัน", label: "60-90 วัน", color: "#14b8a6" },
  { key: "90-120 วัน", label: "90-120 วัน", color: "#10b981" },
  { key: "120-180 วัน", label: "120-180 วัน", color: "#f59e0b" },
  { key: "180-360 วัน", label: "180-360 วัน", color: "#f97316" },
  { key: ">360 วัน", label: ">360 วัน", color: "#ef4444" },
];

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
  const [selectedTrendPeriods, setSelectedTrendPeriods] = useState<string[]>([
    "30-60 วัน",
    "60-90 วัน",
    "90-120 วัน",
    "120-180 วัน",
    "180-360 วัน",
    ">360 วัน",
  ]);
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

  // Flatten trend data with all Nonmove period bucket lines
  const formattedTrendData = historicalSnapshots.map((s: any) => ({
    date: s.date,
    totalStockValue: s.totalStockValue,
    "30-60 วัน": s.bucketAmounts?.["30-60"] || 0,
    "60-90 วัน": s.bucketAmounts?.["60-90"] || 0,
    "90-120 วัน": s.bucketAmounts?.["90-120"] || 0,
    "120-180 วัน": s.bucketAmounts?.["120-180"] || 0,
    "180-360 วัน": s.bucketAmounts?.["180-360"] || 0,
    ">360 วัน": s.bucketAmounts?.[">360"] || 0,
  }));

  const toggleTrendPeriod = (bucketKey: string) => {
    if (selectedTrendPeriods.includes(bucketKey)) {
      if (selectedTrendPeriods.length === 1) return; // Keep at least 1
      setSelectedTrendPeriods(selectedTrendPeriods.filter((k) => k !== bucketKey));
    } else {
      setSelectedTrendPeriods([...selectedTrendPeriods, bucketKey]);
    }
  };

  const selectAllTrendPeriods = () => {
    if (selectedTrendPeriods.length === ALL_PERIOD_BUCKETS.length) {
      setSelectedTrendPeriods([">360 วัน", "180-360 วัน", "120-180 วัน"]);
    } else {
      setSelectedTrendPeriods(ALL_PERIOD_BUCKETS.map((b) => b.key));
    }
  };

  const isDark = theme === "dark";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
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
      headers = ["Date", "StockValueTHB", "StockQty", "TotalSKUs", "HighRatioPct", "HighValueTHB", "30-60", "60-90", "90-120", "120-180", "180-360", ">360"];
      rows = historicalSnapshots.map((s: any) => [
        s.date,
        s.totalStockValue,
        s.totalStockQty,
        s.totalSkus,
        s.highPct,
        s.highValue,
        s.bucketAmounts?.["30-60"] || 0,
        s.bucketAmounts?.["60-90"] || 0,
        s.bucketAmounts?.["90-120"] || 0,
        s.bucketAmounts?.["120-180"] || 0,
        s.bucketAmounts?.["180-360"] || 0,
        s.bucketAmounts?.[">360"] || 0,
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
    <div className="space-y-6">
      {/* 1. Header Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 sm:p-5 rounded-lg shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Executive Analytics Dashboard
              </h1>
              <Badge variant="secondary" className="text-[11px] font-semibold">
                {selectedRegion === "ALL" ? "ทั่วประเทศ (Nationwide)" : `ภาค ${selectedRegion}`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              วิเคราะห์เจาะลึกแยกตามหมวดหมู่, ภูมิภาค, แนวโน้มรายวัน, Top 20 สาขา และ Top 20 โมเดล
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Date Selector */}
          {availableDates.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium text-foreground focus:outline-hidden cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d} className="bg-background text-foreground">
                    รอบวันที่: {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Region Filter */}
          <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent font-medium text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="ALL" className="bg-background text-foreground">
                ทุกภูมิภาค (Nationwide)
              </option>
              {regions.map((r) => (
                <option key={r} value={r} className="bg-background text-foreground">
                  ภาค {r}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchViewerData(selectedDate, selectedRegion, selectedCategory)}
            title="รีเฟรชข้อมูล"
            className="h-8 w-8"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Stock Value */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardDescription className="text-[11px] font-medium uppercase tracking-wider">
              มูลค่าสต๊อกรวม
            </CardDescription>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {formatCurrency(kpis.totalStockValue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              สต๊อกค้าง &gt; 30 วัน
            </p>
          </CardContent>
        </Card>

        {/* Total Stock Units */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardDescription className="text-[11px] font-medium uppercase tracking-wider">
              จำนวนชิ้น (Units)
            </CardDescription>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {formatNumber(kpis.totalStockQty)} <span className="text-xs font-normal text-muted-foreground">ชิ้น</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              กระจายใน {formatNumber(kpis.totalStores)} สาขา
            </p>
          </CardContent>
        </Card>

        {/* Total SKUs */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardDescription className="text-[11px] font-medium uppercase tracking-wider">
              จำนวนโมเดล (SKUs)
            </CardDescription>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {formatNumber(kpis.totalSkus)} <span className="text-xs font-normal text-muted-foreground">SKU</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              โมเดลสินค้าที่ไม่เคลื่อนไหว
            </p>
          </CardContent>
        </Card>

        {/* Critical Ratio (>120 Days) */}
        <Card className="border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardDescription className="text-[11px] font-medium uppercase tracking-wider text-rose-700 dark:text-rose-400">
              วิกฤต (&gt; 120 วัน)
            </CardDescription>
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-400">
              {formatPercent(kpis.highNonmoveRatio)}
            </div>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-medium truncate">
              {formatCurrency(kpis.highValue)} ({formatNumber(kpis.highQty)} ชิ้น)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Period Breakdown Bar Chart */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">
                  มูลค่าสต๊อกแยกตามช่วงวัน (Period Distribution)
                </CardTitle>
                <CardDescription className="text-[11px]">
                  จำแนกตามแต่ละ Bucket (บาท)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> &le; 120 วัน
                </span>
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" /> &gt; 120 วัน
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2">
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: gridColor, borderRadius: "0.375rem", fontSize: "12px" }}
                    formatter={(value: any) => [formatCurrency(Number(value)), "มูลค่า"]}
                  />
                  <Bar dataKey="stockValue" radius={[4, 4, 0, 0]}>
                    {periodBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.classification === "HIGH" ? "#f43f5e" : "#10b981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Period Nonmove Trend Chart */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <CardTitle className="text-sm font-semibold">
                  แนวโน้มมูลค่าสต๊อกแยกตามช่วงวัน (Historical Trend)
                </CardTitle>
                <CardDescription className="text-[11px]">
                  เลือกช่วงวันเพื่อเปรียบเทียบแนวโน้ม (Multi-Check)
                </CardDescription>
              </div>

              <button
                type="button"
                onClick={selectAllTrendPeriods}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:underline self-start sm:self-auto"
              >
                {selectedTrendPeriods.length === ALL_PERIOD_BUCKETS.length ? "แสดงเฉพาะกลุ่มวิกฤต" : "เลือกทุกช่วงวัน"}
              </button>
            </div>

            {/* Multi-Check Badges Toolbar */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              {ALL_PERIOD_BUCKETS.map((b) => {
                const isSelected = selectedTrendPeriods.includes(b.key);
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => toggleTrendPeriod(b.key)}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all border ${
                      isSelected
                        ? "bg-secondary text-foreground border-border"
                        : "opacity-40 hover:opacity-75 bg-transparent border-dashed border-border text-muted-foreground"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <span>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-1">
            <div className="h-52 sm:h-60 w-full">
              {formattedTrendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  ไม่มีข้อมูลแนวโน้มประวัติ
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} angle={-15} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: gridColor, borderRadius: "0.375rem", fontSize: "12px" }}
                      formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                    {ALL_PERIOD_BUCKETS.map((b) => {
                      if (!selectedTrendPeriods.includes(b.key)) return null;
                      return (
                        <Line
                          key={b.key}
                          type="monotone"
                          dataKey={b.key}
                          stroke={b.color}
                          strokeWidth={1.75}
                          dot={{ r: 2 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Tabular Reports */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Tabs List */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
              <Button
                variant={activeAnalysisTab === "CATEGORY" ? "default" : "ghost" }
                size="sm"
                onClick={() => { setActiveAnalysisTab("CATEGORY"); setSearch(""); }}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Package className="h-3.5 w-3.5" />
                <span>หมวดหมู่สินค้า ({categoryBreakdown.length})</span>
              </Button>

              <Button
                variant={activeAnalysisTab === "REGION" ? "default" : "ghost" }
                size="sm"
                onClick={() => { setActiveAnalysisTab("REGION"); setSearch(""); }}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>ภูมิภาค ({regionBreakdown.length})</span>
              </Button>

              <Button
                variant={activeAnalysisTab === "TREND" ? "default" : "ghost" }
                size="sm"
                onClick={() => { setActiveAnalysisTab("TREND"); setSearch(""); }}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>แนวโน้มรายวัน ({historicalSnapshots.length})</span>
              </Button>

              <Button
                variant={activeAnalysisTab === "TOP_STORES" ? "default" : "ghost" }
                size="sm"
                onClick={() => { setActiveAnalysisTab("TOP_STORES"); setSearch(""); }}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Top 20 สาขา</span>
              </Button>

              <Button
                variant={activeAnalysisTab === "TOP_MODELS" ? "default" : "ghost" }
                size="sm"
                onClick={() => { setActiveAnalysisTab("TOP_MODELS"); setSearch(""); }}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Top 20 โมเดล</span>
              </Button>
            </div>

            {/* Search & Export Toolbar */}
            <div className="flex items-center gap-2">
              {activeAnalysisTab !== "TREND" && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาในตาราง..."
                    className="h-8 w-44 sm:w-56 pl-8 text-xs"
                  />
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>ส่งออก CSV</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* 4.1 REPORT: CATEGORY BREAKDOWN */}
          {activeAnalysisTab === "CATEGORY" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หมวดหมู่สินค้า (Category)</TableHead>
                  <TableHead className="text-center">สัดส่วน (% Share)</TableHead>
                  <TableHead className="text-right">จำนวน SKU</TableHead>
                  <TableHead className="text-right">จำนวนชิ้น (QTY)</TableHead>
                  <TableHead className="text-right">มูลค่ารวม (บาท)</TableHead>
                  <TableHead className="text-center">สัดส่วนวิกฤต (% High)</TableHead>
                  <TableHead className="text-right">มูลค่าวิตฤต (&gt;120 วัน)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      ไม่พบข้อมูลหมวดหมู่สินค้า
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((c: any) => (
                    <TableRow key={c.category}>
                      <TableCell className="font-medium text-foreground">
                        {c.category}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <Badge variant="secondary" className="text-[11px]">
                          {c.sharePct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(c.totalSkus)}</TableCell>
                      <TableCell className="text-right font-medium">{formatNumber(c.stockQty)}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatCurrency(c.stockValue)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.highPct > 40 ? "destructive" : "success"} className="text-[11px]">
                          {c.highPct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">
                        {formatCurrency(c.highValue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 4.2 REPORT: REGION BREAKDOWN */}
          {activeAnalysisTab === "REGION" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ภูมิภาค (Region)</TableHead>
                  <TableHead className="text-center">สัดส่วน (% Share)</TableHead>
                  <TableHead className="text-right">จำนวนสาขา</TableHead>
                  <TableHead className="text-right">จำนวน SKU</TableHead>
                  <TableHead className="text-right">จำนวนชิ้น (QTY)</TableHead>
                  <TableHead className="text-right">มูลค่ารวม (บาท)</TableHead>
                  <TableHead className="text-center">สัดส่วนวิกฤต (% High)</TableHead>
                  <TableHead className="text-right">มูลค่าวิตฤต (&gt;120 วัน)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      ไม่พบข้อมูลภูมิภาค
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegions.map((r: any) => (
                    <TableRow key={r.region}>
                      <TableCell className="font-medium text-foreground">
                        ภาค {r.region}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <Badge variant="secondary" className="text-[11px]">
                          {r.sharePct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.storeCount} สาขา</TableCell>
                      <TableCell className="text-right">{formatNumber(r.totalSkus)}</TableCell>
                      <TableCell className="text-right font-medium">{formatNumber(r.stockQty)}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatCurrency(r.stockValue)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.highPct > 40 ? "destructive" : "success"} className="text-[11px]">
                          {r.highPct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">
                        {formatCurrency(r.highValue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 4.3 REPORT: TREND OF DAY SNAPSHOTS */}
          {activeAnalysisTab === "TREND" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รอบวันที่บันทึก (Date)</TableHead>
                  <TableHead className="text-right">มูลค่าสต๊อกรวม (บาท)</TableHead>
                  <TableHead className="text-right">จำนวนชิ้น (QTY)</TableHead>
                  <TableHead className="text-right">จำนวน SKU</TableHead>
                  <TableHead className="text-center">สัดส่วนวิกฤต (% High)</TableHead>
                  <TableHead className="text-right">มูลค่าวิตฤต (&gt;120 วัน)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalSnapshots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      ไม่มีข้อมูลบันทึกรายวัน
                    </TableCell>
                  </TableRow>
                ) : (
                  historicalSnapshots.map((s: any) => (
                    <TableRow key={s.date}>
                      <TableCell className="font-mono font-medium text-foreground">
                        {s.date}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatCurrency(s.totalStockValue)}</TableCell>
                      <TableCell className="text-right font-medium">{formatNumber(s.totalStockQty)}</TableCell>
                      <TableCell className="text-right">{formatNumber(s.totalSkus)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={s.highPct > 40 ? "destructive" : "success"} className="text-[11px]">
                          {s.highPct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">
                        {formatCurrency(s.highValue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 4.4 REPORT: TOP 20 STORES HIGH NON-MOVE */}
          {activeAnalysisTab === "TOP_STORES" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">อันดับ</TableHead>
                  <TableHead>รหัสสาขา</TableHead>
                  <TableHead>ชื่อสาขา (Store Name)</TableHead>
                  <TableHead className="text-center">ภูมิภาค</TableHead>
                  <TableHead className="text-right">จำนวน SKU</TableHead>
                  <TableHead className="text-right">จำนวนชิ้น (QTY)</TableHead>
                  <TableHead className="text-right">มูลค่ารวม (บาท)</TableHead>
                  <TableHead className="text-center">สัดส่วนวิกฤต</TableHead>
                  <TableHead className="text-right">มูลค่าวิตฤต</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      ไม่พบข้อมูลสาขา
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((st: any, idx: number) => (
                    <TableRow key={st.branchCode}>
                      <TableCell className="text-muted-foreground font-mono">#{idx + 1}</TableCell>
                      <TableCell className="font-mono font-medium text-foreground">
                        {st.branchCode}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {st.storeName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {st.region}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(st.totalSkus)}</TableCell>
                      <TableCell className="text-right font-medium">{formatNumber(st.stockQty)}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatCurrency(st.stockValue)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive" className="text-[10px]">
                          {st.highPct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">
                        {formatCurrency(st.highValue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 4.5 REPORT: TOP 20 MODELS HIGH NON-MOVE */}
          {activeAnalysisTab === "TOP_MODELS" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">อันดับ</TableHead>
                  <TableHead>รหัสสินค้า</TableHead>
                  <TableHead>รุ่นสินค้า (Model)</TableHead>
                  <TableHead className="text-center">ประเภท (SKU_TYPE)</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead className="text-center">ช่วงวัน</TableHead>
                  <TableHead className="text-right">จำนวนชิ้น (QTY)</TableHead>
                  <TableHead className="text-right">มูลค่ารวม (บาท)</TableHead>
                  <TableHead className="text-right">กระจายในสาขา</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      ไม่พบข้อมูลโมเดลสินค้า
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredModels.map((m: any, idx: number) => {
                    const isHigh = m.classification === "HIGH";
                    return (
                      <TableRow key={m.productCode}>
                        <TableCell className="text-muted-foreground font-mono">#{idx + 1}</TableCell>
                        <TableCell className="font-mono font-medium text-foreground">
                          {m.productCode}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {m.model}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {m.skuType || "SELLABLE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.category}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isHigh ? "destructive" : "success"} className="text-[10px]">
                            {m.nonmoveDaysBucket} วัน
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatNumber(m.stockQty)}</TableCell>
                        <TableCell className="text-right font-bold text-foreground">{formatCurrency(m.stockValue)}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{m.branchCount} สาขา</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
