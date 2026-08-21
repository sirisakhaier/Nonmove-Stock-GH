"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Calendar,
  Search,
  RotateCcw,
  Building2,
  Package,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  DollarSign,
  Boxes,
  MapPin,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/validators";

const TIER_COLORS = ["#2FBF8F", "#B7C948", "#E8A93C", "#DD7A3C", "#C64545"];
const TIER_LABELS = [
  "Active (≤120d)",
  "Watch (121–180d)",
  "Elevated (181–270d)",
  "Critical (271–365d)",
  "Severe (365d+)",
];

function fmtBahtShort(n: number) {
  if (Math.abs(n) >= 1e6) return "฿" + (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return "฿" + (n / 1e3).toFixed(1) + "K";
  return "฿" + Math.round(n).toLocaleString();
}

export function OneDayCommandCenter() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Filters State
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [selectedRegs, setSelectedRegs] = useState<Set<string>>(new Set());
  const [selectedTiers, setSelectedTiers] = useState<Set<number>>(new Set());
  const [metric, setMetric] = useState<"v" | "q">("v"); // 'v' = Value (฿), 'q' = Qty (units)
  const [search, setSearch] = useState("");

  // Table State
  const [sortCol, setSortCol] = useState<string>("totalValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const fetchData = useCallback(async (date?: string) => {
    setIsLoading(true);
    try {
      const url = date ? `/api/viewer/one-day?date=${encodeURIComponent(date)}` : "/api/viewer/one-day";
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        if (!selectedDate && result.reportDate) {
          setSelectedDate(result.reportDate);
        }
      }
    } catch (err) {
      console.error("Error fetching 1-day analysis:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchData(newDate);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCats(new Set());
    setSelectedRegs(new Set());
    setSelectedTiers(new Set());
    setSearch("");
    setPage(1);
  };

  const toggleCat = (cat: string) => {
    const next = new Set(selectedCats);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelectedCats(next);
    setPage(1);
  };

  const toggleReg = (reg: string) => {
    const next = new Set(selectedRegs);
    if (next.has(reg)) next.delete(reg);
    else next.add(reg);
    setSelectedRegs(next);
    setPage(1);
  };

  const toggleTier = (tier: number) => {
    const next = new Set(selectedTiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    setSelectedTiers(next);
    setPage(1);
  };

  // Filtered Store-Category Lines
  const filteredStoreCategories = useMemo(() => {
    if (!data?.storeCategories) return [];
    return data.storeCategories.filter((item: any) => {
      if (selectedCats.size > 0 && !selectedCats.has(item.category)) return false;
      if (selectedRegs.size > 0 && !selectedRegs.has(item.region)) return false;
      if (selectedTiers.size > 0) {
        // Must have positive stock in at least one of selected tiers
        const hasMatch = Array.from(selectedTiers).some((t) => item.tierVals[t] > 0 || item.tierQtys[t] > 0);
        if (!hasMatch) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const sMatch = item.store.toLowerCase().includes(q) ||
          item.branchCode.toLowerCase().includes(q) ||
          item.province.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!sMatch) return false;
      }
      return true;
    });
  }, [data, selectedCats, selectedRegs, selectedTiers, search]);

  // Dynamically recalculate KPIs across filtered scope
  const filteredKPIs = useMemo(() => {
    const items = filteredStoreCategories;
    let totV = 0;
    let totQ = 0;
    let nmV = 0;
    let nmQ = 0;
    let hrV = 0;
    let flagged = 0;

    for (const item of items) {
      totV += item.totalValue;
      totQ += item.totalQty;
      nmV += item.nonmoveValue;
      nmQ += item.nonmoveQty;
      // High risk = tiers 3 and 4
      hrV += (item.tierVals[3] || 0) + (item.tierVals[4] || 0);
      if (item.nonmoveValue > 0) flagged++;
    }

    const lines = items.length;
    const avgV = lines > 0 ? Math.round(totV / lines) : 0;
    const nmPct = totV > 0 ? Math.round((nmV / totV) * 100) : 0;
    const nmQPct = totQ > 0 ? Math.round((nmQ / totQ) * 100) : 0;

    return {
      totalStockValue: totV,
      totalStockQty: totQ,
      nonmoveValue: nmV,
      nonmoveQty: nmQ,
      nonmovePct: nmPct,
      nonmoveQPct: nmQPct,
      highRiskValue: hrV,
      linesFlagged: flagged,
      totalLines: lines,
      avgValuePerLine: avgV,
    };
  }, [filteredStoreCategories]);

  // Aging Pipeline Totals for River Bar (respects cat/reg/search but NOT tier filter)
  const riverTiers = useMemo(() => {
    if (!data?.storeCategories) return [0, 0, 0, 0, 0].map((_, i) => ({ tier: i, label: TIER_LABELS[i], val: 0, qty: 0 }));
    // Filter by cat, reg, search only
    const items = data.storeCategories.filter((item: any) => {
      if (selectedCats.size > 0 && !selectedCats.has(item.category)) return false;
      if (selectedRegs.size > 0 && !selectedRegs.has(item.region)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return item.store.toLowerCase().includes(q) ||
          item.branchCode.toLowerCase().includes(q) ||
          item.province.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
      }
      return true;
    });

    const sums = [0, 1, 2, 3, 4].map((t) => ({ tier: t, label: TIER_LABELS[t], val: 0, qty: 0 }));
    for (const item of items) {
      for (let t = 0; t < 5; t++) {
        sums[t].val += item.tierVals[t] || 0;
        sums[t].qty += item.tierQtys[t] || 0;
      }
    }
    return sums;
  }, [data, selectedCats, selectedRegs, search]);

  const totalRiverMetric = useMemo(() => {
    return riverTiers.reduce((acc, t) => acc + (metric === "v" ? t.val : t.qty), 0);
  }, [riverTiers, metric]);

  // Sorted and Paginated Table Rows
  const sortedTableRows = useMemo(() => {
    const list = [...filteredStoreCategories];
    list.sort((a, b) => {
      let av = a[sortCol];
      let bv = b[sortCol];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      av = String(av || "");
      bv = String(bv || "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [filteredStoreCategories, sortCol, sortDir]);

  const totalPages = Math.ceil(sortedTableRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTableRows.slice(start, start + pageSize);
  }, [sortedTableRows, page, pageSize]);

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(colKey);
      setSortDir("desc");
    }
    setPage(1);
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">กำลังประมวลผลข้อมูล 1-Day Command Center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Topbar with Date Selection and Reset */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-primary uppercase font-bold mb-1">
            Inventory &amp; Field Ops · Aging Risk
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Non-Move Stock Command Center
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl mt-1 leading-relaxed">
            การวิเคราะห์สต๊อกสาขารายวัน (1-Day Snapshot Analysis) จัดกลุ่มตามสาขาและ Category พร้อมติดตามมูลค่าทุนจมและสินค้าค้างเกิน 120 วัน
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Snapshot Date Selector */}
          <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 shadow-xs text-xs">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold text-muted-foreground text-[11px]">Report Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent font-mono font-bold text-foreground focus:outline-hidden cursor-pointer"
            >
              {data?.availableDates?.map((d: string) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="h-9 text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Stock Value */}
        <Card className="border-border shadow-xs relative overflow-hidden p-4 border-l-4 border-l-primary">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Total Stock Value
          </div>
          <div className="font-mono text-lg font-bold text-foreground mt-1.5 leading-none">
            {fmtBahtShort(filteredKPIs.totalStockValue)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            <span className="font-semibold text-foreground">{formatNumber(filteredKPIs.totalStockQty)}</span> units
          </div>
        </Card>

        {/* Card 2: Non-Move Value */}
        <Card className="border-border shadow-xs relative overflow-hidden p-4 border-l-4 border-l-[#DD7A3C]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Non-Move (&gt;120d)
          </div>
          <div className="font-mono text-lg font-bold text-[#DD7A3C] mt-1.5 leading-none">
            {fmtBahtShort(filteredKPIs.nonmoveValue)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            <span className="font-semibold text-foreground">{filteredKPIs.nonmovePct}%</span> of total value
          </div>
        </Card>

        {/* Card 3: Non-Move Qty */}
        <Card className="border-border shadow-xs relative overflow-hidden p-4 border-l-4 border-l-[#E8A93C]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Non-Move Qty (&gt;120d)
          </div>
          <div className="font-mono text-lg font-bold text-[#E8A93C] mt-1.5 leading-none">
            {formatNumber(filteredKPIs.nonmoveQty)} <span className="text-xs font-normal">u</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            <span className="font-semibold text-foreground">{filteredKPIs.nonmoveQPct}%</span> of units
          </div>
        </Card>

        {/* Card 4: High-Risk Value */}
        <Card className="border-border shadow-xs relative overflow-hidden p-4 border-l-4 border-l-[#C64545]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            High-Risk (&gt;270d)
          </div>
          <div className="font-mono text-lg font-bold text-[#C64545] mt-1.5 leading-none">
            {fmtBahtShort(filteredKPIs.highRiskValue)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            Critical + Severe risk
          </div>
        </Card>

        {/* Card 5: Lines Flagged */}
        <Card className="border-border shadow-xs relative overflow-hidden p-4 border-l-4 border-l-[#B7C948]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Store-Cat Flagged
          </div>
          <div className="font-mono text-lg font-bold text-foreground mt-1.5 leading-none">
            {formatNumber(filteredKPIs.linesFlagged)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            of {formatNumber(filteredKPIs.totalLines)} lines ({filteredKPIs.totalLines > 0 ? Math.round((filteredKPIs.linesFlagged / filteredKPIs.totalLines) * 100) : 0}%)
          </div>
        </Card>

        {/* Card 6: Avg Value Per Line */}
        <Card className="border-border shadow-xs relative overflow-hidden p-4 border-l-4 border-l-[#2FBF8F]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Avg. Value / Line
          </div>
          <div className="font-mono text-lg font-bold text-foreground mt-1.5 leading-none">
            {fmtBahtShort(filteredKPIs.avgValuePerLine)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            across filtered scope
          </div>
        </Card>
      </div>

      {/* 3. Stock Value Aging Pipeline (Interactive River Bar) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Stock Value Aging Pipeline</span>
            <span className="text-xs font-normal text-muted-foreground font-mono">
              Total: {metric === "v" ? formatCurrency(totalRiverMetric) : `${formatNumber(totalRiverMetric)} units`}
            </span>
          </CardTitle>
          <CardDescription className="text-[11px] mt-0.5">
            ท่อจำแนกสถานะสต๊อก 5 ระดับ (คลิกที่ช่วงวันเพื่อเลือกกรองเฉพาะกลุ่มนั้น)
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4">
          {/* Continuous Multi-Segment Bar */}
          <div className="flex w-full h-11 rounded-md overflow-hidden border border-border/80 bg-muted/40 shadow-inner">
            {riverTiers.map((t) => {
              const val = metric === "v" ? t.val : t.qty;
              const w = totalRiverMetric > 0 ? (val / totalRiverMetric) * 100 : 0;
              const isDimmed = selectedTiers.size > 0 && !selectedTiers.has(t.tier);
              const isSelected = selectedTiers.has(t.tier);

              return (
                <div
                  key={t.tier}
                  onClick={() => toggleTier(t.tier)}
                  title={`${t.label}: ${metric === "v" ? formatCurrency(t.val) : `${formatNumber(t.qty)} units`} (${w.toFixed(1)}%)`}
                  style={{ width: `${w}%`, backgroundColor: TIER_COLORS[t.tier] }}
                  className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 hover:brightness-110 select-none ${
                    isDimmed ? "opacity-25" : isSelected ? "brightness-110 ring-2 ring-foreground" : "opacity-100"
                  }`}
                >
                  {w > 6 && (
                    <span className="font-mono text-[11px] font-bold text-slate-950 px-1 truncate">
                      {metric === "v" ? fmtBahtShort(t.val) : formatNumber(t.qty)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Legend Items */}
          <div className="flex items-center justify-between gap-2 mt-3 flex-wrap text-xs">
            {riverTiers.map((t) => {
              const val = metric === "v" ? t.val : t.qty;
              const pct = totalRiverMetric > 0 ? ((val / totalRiverMetric) * 100).toFixed(1) : "0.0";
              const isDimmed = selectedTiers.size > 0 && !selectedTiers.has(t.tier);

              return (
                <button
                  key={t.tier}
                  type="button"
                  onClick={() => toggleTier(t.tier)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-muted transition-colors ${
                    isDimmed ? "opacity-35" : "opacity-100 font-medium"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: TIER_COLORS[t.tier] }}
                  />
                  <span className="text-foreground text-[11px]">{t.label}</span>
                  <span className="font-mono font-bold text-foreground text-[11px]">
                    {pct}%
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. Filter Panel with Value/Qty Toggle & Chips */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 pb-2 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-sm font-bold">Filters</CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              กรองข้อมูลทั้งแดชบอร์ดตาม Category, Region และ Aging Stage
            </CardDescription>
          </div>

          {/* Metric Toggle Button: Value (฿) vs Qty (units) */}
          <div className="flex items-center p-1 rounded-md bg-muted border border-border self-start sm:self-auto">
            <button
              onClick={() => setMetric("v")}
              className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all ${
                metric === "v"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Value (฿)
            </button>
            <button
              onClick={() => setMetric("q")}
              className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all ${
                metric === "q"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Qty (units)
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {/* Row 1: Category Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-16 shrink-0">
              Category:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {data?.categories?.map((cat: string) => {
                const isActive = selectedCats.has(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCat(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                        : "bg-muted/50 border-border text-foreground hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Region Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-16 shrink-0">
              Region:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {data?.regions?.map((reg: string) => {
                const isActive = selectedRegs.has(reg);
                return (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => toggleReg(reg)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                        : "bg-muted/50 border-border text-foreground hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    {reg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Aging Chips & Live Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-1 border-t border-border/60">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-16 shrink-0">
                Aging:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {TIER_LABELS.map((label, i) => {
                  const isActive = selectedTiers.has(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleTier(i)}
                      style={{
                        borderColor: isActive ? TIER_COLORS[i] : undefined,
                        color: isActive ? TIER_COLORS[i] : undefined,
                        backgroundColor: isActive ? `${TIER_COLORS[i]}22` : undefined,
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        isActive
                          ? "shadow-xs font-bold"
                          : "bg-muted/50 border-border text-foreground hover:border-slate-400 dark:hover:border-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="ค้นหาสาขา, Category, จังหวัด..."
                className="h-8 pl-8 text-xs w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Two-Column Distribution Charts (By Category & By Region) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Category Stacked Bar Chart */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold">By Category</CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              สัดส่วน Active vs. Aging จำแนกตาม 5 ระดับความเสี่ยง
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data?.categoryBreakdown?.map((cat: any) => {
              const maxVal = Math.max(...data.categoryBreakdown.map((c: any) => metric === "v" ? c.totalVal : c.totalQty)) || 1;

              return (
                <div key={cat.name} className="grid grid-cols-[100px_1fr_80px] items-center gap-2.5 text-xs">
                  <div className="font-medium text-foreground truncate" title={cat.name}>
                    {cat.name}
                  </div>
                  <div className="h-5 w-full bg-muted/60 rounded-xs overflow-hidden flex">
                    {cat.tierVals.map((tVal: number, ti: number) => {
                      const val = metric === "v" ? tVal : cat.tierQtys[ti];
                      const w = maxVal > 0 ? (val / maxVal) * 100 : 0;
                      if (w <= 0) return null;
                      return (
                        <div
                          key={ti}
                          style={{ width: `${w}%`, backgroundColor: TIER_COLORS[ti] }}
                          title={`${TIER_LABELS[ti]}: ${metric === "v" ? formatCurrency(tVal) : `${formatNumber(cat.tierQtys[ti])} u`}`}
                          className="h-full transition-all duration-300 hover:brightness-115"
                        />
                      );
                    })}
                  </div>
                  <div className="font-mono font-semibold text-foreground text-right text-[11px]">
                    {metric === "v" ? fmtBahtShort(cat.totalVal) : formatNumber(cat.totalQty)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* By Region Stacked Bar Chart */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold">By Region</CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              สัดส่วน Active vs. Aging จำแนกตามภูมิภาค
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data?.regionBreakdown?.map((reg: any) => {
              const maxVal = Math.max(...data.regionBreakdown.map((r: any) => metric === "v" ? r.totalVal : r.totalQty)) || 1;

              return (
                <div key={reg.name} className="grid grid-cols-[110px_1fr_80px] items-center gap-2.5 text-xs">
                  <div className="font-medium text-foreground truncate" title={reg.name}>
                    {reg.name}
                  </div>
                  <div className="h-5 w-full bg-muted/60 rounded-xs overflow-hidden flex">
                    {reg.tierVals.map((tVal: number, ti: number) => {
                      const val = metric === "v" ? tVal : reg.tierQtys[ti];
                      const w = maxVal > 0 ? (val / maxVal) * 100 : 0;
                      if (w <= 0) return null;
                      return (
                        <div
                          key={ti}
                          style={{ width: `${w}%`, backgroundColor: TIER_COLORS[ti] }}
                          title={`${TIER_LABELS[ti]}: ${metric === "v" ? formatCurrency(tVal) : `${formatNumber(reg.tierQtys[ti])} u`}`}
                          className="h-full transition-all duration-300 hover:brightness-115"
                        />
                      );
                    })}
                  </div>
                  <div className="font-mono font-semibold text-foreground text-right text-[11px]">
                    {metric === "v" ? fmtBahtShort(reg.totalVal) : formatNumber(reg.totalQty)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* 6. Heatmap Matrix (Category × Region — Non-Move Value Share %) */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold">
            Category × Region — Non-Move Value Share
          </CardTitle>
          <CardDescription className="text-[11px] mt-0.5">
            สัดส่วนมูลค่าสต๊อกค้างเกิน 120 วันในแต่ละหมวดหมู่และภูมิภาค (สีแดงเข้ม = ทุนจมสูง)
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36 font-bold text-foreground">Category</TableHead>
                {data?.matrix?.regions?.map((r: string) => (
                  <TableHead key={r} className="text-right font-bold text-foreground text-xs">
                    {r}
                  </TableHead>
                ))}
                <TableHead className="text-right font-bold text-foreground text-xs w-20">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.matrix?.rows?.map((row: any) => (
                <TableRow key={row.category} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-foreground text-xs">
                    {row.category}
                  </TableCell>
                  {row.cells.map((cell: any) => {
                    const share = cell.totalVal > 0 ? cell.nonmoveVal / cell.totalVal : 0;
                    const alpha = cell.totalVal > 0 ? Math.min(0.85, share * 0.9 + 0.08) : 0;
                    const bgStyle = cell.totalVal > 0 ? `rgba(198, 69, 69, ${alpha})` : undefined;

                    return (
                      <TableCell
                        key={cell.region}
                        style={{ backgroundColor: bgStyle }}
                        title={`${cell.region} · ${row.category}: Non-Move ${formatCurrency(cell.nonmoveVal)} / รวม ${formatCurrency(cell.totalVal)} (${cell.pct}%)`}
                        className="text-right font-mono text-xs font-medium text-foreground rounded-xs"
                      >
                        {cell.totalVal > 0 ? `${cell.pct}%` : "—"}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-mono font-bold text-foreground text-xs bg-muted/40">
                    {row.totalVal > 0 ? `${row.pct}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}

              {/* Grand Total Row */}
              <TableRow className="bg-muted/60 font-bold border-t-2 border-border">
                <TableCell className="font-bold text-foreground text-xs">All Categories</TableCell>
                {data?.matrix?.colTotals?.map((col: any) => (
                  <TableCell key={col.region} className="text-right font-mono font-bold text-foreground text-xs">
                    {col.totalVal > 0 ? `${col.pct}%` : "—"}
                  </TableCell>
                ))}
                <TableCell className="text-right font-mono font-bold text-[#C64545] text-xs">
                  {data?.matrix?.grandPct}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 7. Aggregated Store · Category Detail Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-bold">
              Store · Category Aggregated Detail
            </CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              ข้อมูลสรุปสต๊อกแยกตามสาขาและหมวดหมู่ (พบ {formatNumber(filteredStoreCategories.length)} รายการ)
            </CardDescription>
          </div>

          <div className="text-xs font-medium text-muted-foreground">
            แสดงหน้า <span className="text-foreground font-bold">{page}</span> จาก {totalPages}
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead
                  onClick={() => handleSort("store")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>สาขา (Store)</span>
                    {sortCol === "store" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("province")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>จังหวัด (Province)</span>
                    {sortCol === "province" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("region")}
                  className="cursor-pointer hover:text-primary transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>ภูมิภาค</span>
                    {sortCol === "region" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("category")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    {sortCol === "category" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("skuCount")}
                  className="cursor-pointer hover:text-primary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>จำนวน SKU</span>
                    {sortCol === "skuCount" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("dominantTier")}
                  className="cursor-pointer hover:text-primary transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>ระดับความเสี่ยง (Aging Risk)</span>
                    {sortCol === "dominantTier" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("totalQty")}
                  className="cursor-pointer hover:text-primary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>จำนวนชิ้นรวม</span>
                    {sortCol === "totalQty" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("totalValue")}
                  className="cursor-pointer hover:text-primary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>มูลค่ารวม (บาท)</span>
                    {sortCol === "totalValue" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("nonmoveValue")}
                  className="cursor-pointer hover:text-primary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Non-Move (&gt;120d ฿)</span>
                    {sortCol === "nonmoveValue" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("nonmovePct")}
                  className="cursor-pointer hover:text-primary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Non-Move</span>
                    {sortCol === "nonmovePct" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                    ไม่พบข้อมูล Store · Category ที่ตรงกับเงื่อนไขการค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((item: any, idx: number) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  const tierColor = TIER_COLORS[item.dominantTier];

                  return (
                    <TableRow key={`${item.branchCode}_${item.category}`} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-muted-foreground text-[11px]">{rowNum}</TableCell>
                      <TableCell className="font-semibold text-foreground text-xs">
                        <div>{item.store}</div>
                        <div className="font-mono text-[10px] text-muted-foreground font-normal">
                          {item.branchCode}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{item.province}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {item.region}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground text-xs">{item.category}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNumber(item.skuCount)}</TableCell>
                      <TableCell className="text-center">
                        <span
                          style={{
                            backgroundColor: `${tierColor}22`,
                            color: tierColor,
                            borderColor: tierColor,
                          }}
                          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border"
                        >
                          {item.dominantTierLabel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNumber(item.totalQty)}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground text-xs">
                        {formatCurrency(item.totalValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-[#DD7A3C] text-xs">
                        {formatCurrency(item.nonmoveValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        <span className={item.nonmovePct > 50 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}>
                          {item.nonmovePct}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between p-3 border-t border-border bg-card text-xs text-muted-foreground">
            <div>
              หน้า <span className="font-medium text-foreground">{page}</span> จาก <span className="font-medium text-foreground">{totalPages}</span> ({formatNumber(filteredStoreCategories.length)} Store-Category lines)
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>ก่อนหน้า</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 text-xs gap-1"
              >
                <span>ถัดไป</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
