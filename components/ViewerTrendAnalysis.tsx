"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  Calendar,
  Search,
  RotateCcw,
  Building2,
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  DollarSign,
  Boxes,
  MapPin,
  Filter,
  CheckCircle2,
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

const TIER_COLORS_HEX = ["#2FBF8F", "#B7C948", "#E8A93C", "#C64545"];
const SERIES_PALETTE = ["#37C6C0", "#E8B84B", "#DD7A6E", "#6C9BE8", "#B78CE8", "#8FCB6B", "#E86BA8", "#9FAEC0"];
const TIER_LABELS = [
  "30-60 วัน",
  "61-90 วัน",
  "91-120 วัน",
  "121 วันขึ้นไป",
];

function fmtDateEN(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("th-TH", { month: "short", day: "numeric" });
}

function fmtBahtShort(n: number) {
  if (Math.abs(n) >= 1e6) return "฿" + (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return "฿" + (n / 1e3).toFixed(1) + "K";
  return "฿" + Math.round(n).toLocaleString();
}

function fmtDelta(n: number, isPct = false) {
  const sign = n > 0 ? "+" : "";
  return isPct ? `${sign}${n.toFixed(1)}%` : `${sign}${Math.round(n).toLocaleString()}`;
}

export function ViewerTrendAnalysis() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State (on Top)
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [selectedRegs, setSelectedRegs] = useState<Set<string>>(new Set());
  const [selectedTiers, setSelectedTiers] = useState<Set<number>>(new Set());
  const [metric, setMetric] = useState<"v" | "q">("v"); // 'v' = Value (฿), 'q' = Qty (units)

  // Delta Table State
  const [sortCol, setSortCol] = useState<string>("lastV");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const fetchTrendData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/viewer/trend");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Error loading trend analysis:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  const handleResetFilters = () => {
    setSelectedCats(new Set());
    setSelectedRegs(new Set());
    setSelectedTiers(new Set());
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

  const dates: string[] = data?.dates || [];
  const rollups: any[] = data?.rollups || [];
  const lastD = Math.max(0, dates.length - 1);
  const prevD = Math.max(0, dates.length - 2);
  const firstD = 0;

  // Filtered rollups matching Cat, Reg, Tier
  const filteredRollups = useMemo(() => {
    return rollups.filter((r) => {
      if (selectedCats.size > 0 && !selectedCats.has(r.category)) return false;
      if (selectedRegs.size > 0 && !selectedRegs.has(r.region)) return false;
      if (selectedTiers.size > 0 && !selectedTiers.has(r.tier)) return false;
      return true;
    });
  }, [rollups, selectedCats, selectedRegs, selectedTiers]);

  const baseRollupsWithoutTierFilter = useMemo(() => {
    return rollups.filter((r) => {
      if (selectedCats.size > 0 && !selectedCats.has(r.category)) return false;
      if (selectedRegs.size > 0 && !selectedRegs.has(r.region)) return false;
      return true;
    });
  }, [rollups, selectedCats, selectedRegs]);

  // Recalculate 4 Top KPIs dynamically
  const kpis = useMemo(() => {
    if (dates.length === 0) {
      return {
        totLast: 0,
        totPrev: 0,
        nmLast: 0,
        nmPrev: 0,
        dTotPrev: 0,
        dNmPrev: 0,
        dNmFirst: 0,
        dHrFirst: 0,
        nmFirst: 0,
        hrFirst: 0,
        hrLast: 0,
      };
    }

    function totalsAt(di: number, tierMin?: number) {
      return filteredRollups
        .filter((r) => r.dateIdx === di && (tierMin === undefined || r.tier >= tierMin))
        .reduce((acc, r) => acc + (metric === "v" ? r.value : r.qty), 0);
    }

    const totLast = totalsAt(lastD);
    const totPrev = totalsAt(prevD);
    const totFirst = totalsAt(firstD);

    const nmLast = totalsAt(lastD, 1);
    const nmPrev = totalsAt(prevD, 1);
    const nmFirst = totalsAt(firstD, 1);

    const hrLast = totalsAt(lastD, 3); // Tier 3 = 121 up
    const hrFirst = totalsAt(firstD, 3); // Tier 3 = 121 up

    const dTotPrev = totPrev > 0 ? ((totLast - totPrev) / totPrev) * 100 : 0;
    const dNmPrev = nmPrev > 0 ? ((nmLast - nmPrev) / nmPrev) * 100 : 0;
    const dNmFirst = nmFirst > 0 ? ((nmLast - nmFirst) / nmFirst) * 100 : 0;
    const dHrFirst = hrFirst > 0 ? ((hrLast - hrFirst) / hrFirst) * 100 : 0;

    return {
      totLast,
      totPrev,
      nmLast,
      nmPrev,
      nmFirst,
      hrFirst,
      hrLast,
      dTotPrev,
      dNmPrev,
      dNmFirst,
      dHrFirst,
    };
  }, [filteredRollups, dates, lastD, prevD, firstD, metric]);

  // Multi-day Pipeline Snapshot Rows
  const pipelineRows = useMemo(() => {
    if (dates.length === 0) return [];
    const totals = dates.map((_, di) =>
      baseRollupsWithoutTierFilter.filter((r) => r.dateIdx === di).reduce((acc, r) => acc + (metric === "v" ? r.value : r.qty), 0)
    );
    const maxTotal = Math.max(...totals, 1);

    return dates.map((dateStr, di) => {
      const dayRows = baseRollupsWithoutTierFilter.filter((r) => r.dateIdx === di);
      const total = totals[di];
      const barWidthPct = (total / maxTotal) * 100;

      const segs = [0, 1, 2, 3].map((t) => {
        const tVal = dayRows.filter((r) => r.tier === t).reduce((acc, r) => acc + (metric === "v" ? r.value : r.qty), 0);
        const w = total > 0 ? (tVal / total) * 100 : 0;
        const isDim = selectedTiers.size > 0 && !selectedTiers.has(t);
        const disp = metric === "v" ? fmtBahtShort(tVal) : formatNumber(tVal);
        return {
          tier: t,
          val: tVal,
          widthPct: w,
          isDim,
          display: disp,
          label: TIER_LABELS[t],
        };
      });

      return {
        dateStr,
        dateLabel: fmtDateEN(dateStr),
        total,
        totalDisp: metric === "v" ? fmtBahtShort(total) : `${formatNumber(total)} u`,
        barWidthPct,
        segs,
      };
    });
  }, [dates, baseRollupsWithoutTierFilter, selectedTiers, metric]);

  // Line Chart Calculation Helpers
  const generateLineChart = (dimList: string[], dimKey: "region" | "category") => {
    const W = 560;
    const H = 220;
    const L = 54;
    const R = 16;
    const T = 16;
    const B = 28;

    const series = dimList.map((name, i) => {
      const values = dates.map((_, di) =>
        filteredRollups
          .filter((r) => r[dimKey] === name && r.dateIdx === di && r.tier >= 1)
          .reduce((acc, r) => acc + (metric === "v" ? r.value : r.qty), 0)
      );
      return {
        name,
        values,
        color: SERIES_PALETTE[i % SERIES_PALETTE.length],
        lastVal: values[values.length - 1] || 0,
      };
    }).filter((s) => s.values.some((v) => v > 0));

    const allVals = series.flatMap((s) => s.values);
    const maxV = Math.max(...allVals, 1);
    const n = dates.length;
    const xAt = (i: number) => L + (n > 1 ? i * ((W - L - R) / (n - 1)) : 0);
    const yAt = (v: number) => T + (1 - v / maxV) * (H - T - B);

    return {
      W,
      H,
      L,
      R,
      T,
      B,
      maxV,
      xAt,
      yAt,
      series,
    };
  };

  const regChartData = useMemo(() => {
    return generateLineChart(data?.regions || [], "region");
  }, [data, filteredRollups, dates, metric]);

  const catChartData = useMemo(() => {
    return generateLineChart(data?.categories || [], "category");
  }, [data, filteredRollups, dates, metric]);

  // Region x Category Movement Delta Table Data
  const deltaTableRows = useMemo(() => {
    if (dates.length === 0) return [];
    const out: any[] = [];
    const activeRegs: string[] = data?.regions || [];
    const activeCats: string[] = data?.categories || [];

    activeRegs.forEach((region) => {
      if (selectedRegs.size > 0 && !selectedRegs.has(region)) return;
      activeCats.forEach((category) => {
        if (selectedCats.size > 0 && !selectedCats.has(category)) return;

        const firstV = filteredRollups
          .filter((r) => r.region === region && r.category === category && r.dateIdx === firstD && r.tier >= 1)
          .reduce((acc, r) => acc + (metric === "v" ? r.value : r.qty), 0);

        const lastV = filteredRollups
          .filter((r) => r.region === region && r.category === category && r.dateIdx === lastD && r.tier >= 1)
          .reduce((acc, r) => acc + (metric === "v" ? r.value : r.qty), 0);

        if (firstV === 0 && lastV === 0) return;

        const deltaV = lastV - firstV;
        const deltaPct = firstV > 0 ? (deltaV / firstV) * 100 : (lastV > 0 ? 100 : 0);

        out.push({
          region,
          category,
          firstV,
          lastV,
          deltaV,
          deltaPct: Math.round(deltaPct * 10) / 10,
        });
      });
    });

    out.sort((a, b) => {
      let av = a[sortCol];
      let bv = b[sortCol];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      av = String(av || "");
      bv = String(bv || "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return out;
  }, [filteredRollups, data, dates, firstD, lastD, selectedRegs, selectedCats, metric, sortCol, sortDir]);

  const totalPages = Math.ceil(deltaTableRows.length / pageSize) || 1;
  const paginatedDeltaRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return deltaTableRows.slice(start, start + pageSize);
  }, [deltaTableRows, page, pageSize]);

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(colKey);
      setSortDir("desc");
    }
    setPage(1);
  };

  const hasActiveFilters = selectedCats.size > 0 || selectedRegs.size > 0 || selectedTiers.size > 0;

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">กำลังประมวลผลข้อมูล Trend Analysis...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Topbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-primary uppercase font-bold mb-1">
            Inventory &amp; Field Ops · Trend
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Non-Move Stock — Trend Analysis
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl mt-1 leading-relaxed">
            วิเคราะห์แนวโน้มสต๊อกข้าม {dates.length} รอบรายงาน ({dates.map((d) => fmtDateEN(d)).join(" → ")}) สรุปข้อมูลตาม Region × Category × Aging Period ติดตามการเพิ่มขึ้นหรือลดลงของทุนจม
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 shadow-xs text-xs font-mono">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground text-[11px]">Snapshots:</span>
          <span className="font-bold text-foreground">
            {dates.map((d) => fmtDateEN(d)).join(" → ")}
          </span>
        </div>
      </div>

      {/* 2. MOVED TO TOP: Filters Card with Reset button */}
      <Card className="border-border shadow-xs bg-card/60 backdrop-blur-xs">
        <CardHeader className="p-4 pb-2 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold">ตัวกรองข้อมูลแนวโน้ม (Filters)</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                Active Filters
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Metric Toggle */}
            <div className="flex items-center p-0.5 rounded-md bg-muted border border-border">
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

            {/* Reset Filters */}
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="h-8 text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
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

          {/* Row 3: Aging Tier Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/60">
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
                      borderColor: isActive ? TIER_COLORS_HEX[i] : undefined,
                      color: isActive ? TIER_COLORS_HEX[i] : undefined,
                      backgroundColor: isActive ? `${TIER_COLORS_HEX[i]}22` : undefined,
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
        </CardContent>
      </Card>

      {/* 3. Top 4 Trend KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Total Stock Latest */}
        <Card className="border-border shadow-xs p-4 border-l-4 border-l-primary">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Total Stock — Latest ({fmtDateEN(dates[lastD])})
          </div>
          <div className="font-mono text-xl font-bold text-foreground mt-1.5 leading-none">
            {metric === "v" ? fmtBahtShort(kpis.totLast) : `${formatNumber(kpis.totLast)} u`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
            <span className={`font-mono font-bold ${kpis.dTotPrev > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {fmtDelta(kpis.dTotPrev, true)}
            </span>
            <span>vs prior ({fmtDateEN(dates[prevD])})</span>
          </div>
        </Card>

        {/* KPI 2: Non-Move Value Latest */}
        <Card className="border-border shadow-xs p-4 border-l-4 border-l-[#DD7A3C]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Non-Move (&ge;61 วัน) — Latest
          </div>
          <div className="font-mono text-xl font-bold text-[#DD7A3C] mt-1.5 leading-none">
            {metric === "v" ? fmtBahtShort(kpis.nmLast) : `${formatNumber(kpis.nmLast)} u`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
            <span><b>{kpis.totLast > 0 ? Math.round((kpis.nmLast / kpis.totLast) * 100) : 0}%</b> of total ·</span>
            <span className={`font-mono font-bold ${kpis.dNmPrev > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {fmtDelta(kpis.dNmPrev, true)}
            </span>
            <span>vs prior</span>
          </div>
        </Card>

        {/* KPI 3: Non-Move Trend Over Period */}
        <Card className={`border-border shadow-xs p-4 border-l-4 ${kpis.dNmFirst > 0 ? "border-l-[#C64545]" : "border-l-[#2FBF8F]"}`}>
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Non-Move Trend Since {fmtDateEN(dates[firstD])}
          </div>
          <div className={`font-mono text-xl font-bold mt-1.5 leading-none ${kpis.dNmFirst > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {fmtDelta(kpis.dNmFirst, true)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2">
            {metric === "v" ? `${fmtBahtShort(kpis.nmFirst)} → ${fmtBahtShort(kpis.nmLast)}` : `${formatNumber(kpis.nmFirst)} → ${formatNumber(kpis.nmLast)} u`}
          </div>
        </Card>

        {/* KPI 4: High-Risk Trend */}
        <Card className={`border-border shadow-xs p-4 border-l-4 ${kpis.dHrFirst > 0 ? "border-l-[#C64545]" : "border-l-[#2FBF8F]"}`}>
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            High-Risk (121 วันขึ้นไป) Trend
          </div>
          <div className={`font-mono text-xl font-bold mt-1.5 leading-none ${kpis.dHrFirst > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {fmtDelta(kpis.dHrFirst, true)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2">
            {metric === "v" ? `${fmtBahtShort(kpis.hrFirst)} → ${fmtBahtShort(kpis.hrLast)}` : `${formatNumber(kpis.hrFirst)} → ${formatNumber(kpis.hrLast)} u`}
          </div>
        </Card>
      </div>

      {/* 4. Aging Pipeline by Snapshot (Multi-Day Horizontal Stacked Bars) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold">
            Aging Pipeline by Snapshot
          </CardTitle>
          <CardDescription className="text-[11px] mt-0.5">
            การกระจายตัวของสต๊อกข้ามแต่ละรอบรายงาน (ความยาวแท่งสะท้อนยอดรวมแต่ละวัน — คลิกที่ช่วงวันเพื่อเลือกกรอง)
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-3">
            {pipelineRows.map((row) => (
              <div key={row.dateStr} className="grid grid-cols-[70px_1fr_90px] items-center gap-3 text-xs">
                <div className="font-mono font-semibold text-foreground text-xs">
                  {row.dateLabel}
                </div>
                <div className="w-full flex items-center">
                  <div
                    style={{ width: `${row.barWidthPct}%` }}
                    className="h-8 flex rounded-md overflow-hidden border border-border/80 bg-muted/40 shadow-xs transition-all duration-300"
                  >
                    {row.segs.map((seg) => (
                      <div
                        key={seg.tier}
                        onClick={() => toggleTier(seg.tier)}
                        title={`${seg.label} (${row.dateLabel}): ${metric === "v" ? formatCurrency(seg.val) : `${formatNumber(seg.val)} u`} (${seg.widthPct.toFixed(1)}%)`}
                        style={{
                          width: `${seg.widthPct}%`,
                          backgroundColor: TIER_COLORS_HEX[seg.tier],
                        }}
                        className={`flex items-center justify-center cursor-pointer transition-all duration-200 hover:brightness-110 select-none ${
                          seg.isDim ? "opacity-20" : "opacity-100"
                        }`}
                      >
                        {seg.widthPct > 8 && (
                          <span className="font-mono text-[10px] font-bold text-slate-950 px-1 truncate">
                            {seg.display}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="font-mono font-bold text-foreground text-right text-xs">
                  {row.totalDisp}
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline Legend */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 flex-wrap text-xs">
            {TIER_LABELS.map((label, i) => {
              const isDim = selectedTiers.size > 0 && !selectedTiers.has(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleTier(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-muted transition-colors ${
                    isDim ? "opacity-35" : "opacity-100 font-medium"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: TIER_COLORS_HEX[i] }}
                  />
                  <span className="text-foreground text-[11px]">{label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 5. Two-Column Multi-Line Trend Charts (By Region & By Category) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Region Trend Line Chart */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold">
              Non-Move Value Trend — by Region
            </CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              ยอดสต๊อกค้างตั้งแต่ 61 วันขึ้นไป (Non-Move)ในแต่ละภูมิภาคข้ามรอบรายงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {regChartData.series.length === 0 ? (
              <div className="text-xs text-center py-10 text-muted-foreground">ไม่พบข้อมูลแนวโน้มตามตัวกรอง</div>
            ) : (
              <>
                <div className="w-full overflow-hidden">
                  <svg viewBox={`0 0 ${regChartData.W} ${regChartData.H}`} className="w-full h-auto">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                      const y = regChartData.T + f * (regChartData.H - regChartData.T - regChartData.B);
                      const val = regChartData.maxV * (1 - f);
                      return (
                        <g key={f}>
                          <line
                            x1={regChartData.L}
                            y1={y}
                            x2={regChartData.W - regChartData.R}
                            y2={y}
                            stroke="currentColor"
                            strokeOpacity="0.1"
                            strokeWidth="1"
                          />
                          <text
                            x={regChartData.L - 6}
                            y={y + 3}
                            textAnchor="end"
                            fontSize="9.5"
                            fill="currentColor"
                            opacity="0.6"
                            className="font-mono"
                          >
                            {metric === "v" ? fmtBahtShort(val) : formatNumber(Math.round(val))}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-axis date labels */}
                    {dates.map((d, i) => (
                      <text
                        key={d}
                        x={regChartData.xAt(i)}
                        y={regChartData.H - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fill="currentColor"
                        opacity="0.7"
                        className="font-mono"
                      >
                        {fmtDateEN(d)}
                      </text>
                    ))}

                    {/* Series paths & points */}
                    {regChartData.series.map((s) => {
                      const pathD = s.values
                        .map((v, i) => `${i === 0 ? "M" : "L"}${regChartData.xAt(i).toFixed(1)},${regChartData.yAt(v).toFixed(1)}`)
                        .join(" ");

                      return (
                        <g key={s.name}>
                          <path
                            d={pathD}
                            fill="none"
                            stroke={s.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.9"
                          />
                          {s.values.map((v, i) => (
                            <circle
                              key={i}
                              cx={regChartData.xAt(i)}
                              cy={regChartData.yAt(v)}
                              r="3.5"
                              fill={s.color}
                              stroke="var(--card)"
                              strokeWidth="1.5"
                            >
                              <title>{`${s.name} · ${fmtDateEN(dates[i])}: ${metric === "v" ? formatCurrency(v) : `${formatNumber(v)} u`}`}</title>
                            </circle>
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Region Chart Legend */}
                <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-border/60 text-xs">
                  {regChartData.series.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-foreground font-medium text-[11px]">{s.name}</span>
                      <span className="font-mono font-bold text-foreground text-[11px]">
                        {metric === "v" ? fmtBahtShort(s.lastVal) : formatNumber(s.lastVal)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* By Category Trend Line Chart */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold">
              Non-Move Value Trend — by Category
            </CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              ยอดสต๊อกค้างตั้งแต่ 61 วันขึ้นไป (Non-Move)ในแต่ละหมวดหมู่ข้ามรอบรายงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {catChartData.series.length === 0 ? (
              <div className="text-xs text-center py-10 text-muted-foreground">ไม่พบข้อมูลแนวโน้มตามตัวกรอง</div>
            ) : (
              <>
                <div className="w-full overflow-hidden">
                  <svg viewBox={`0 0 ${catChartData.W} ${catChartData.H}`} className="w-full h-auto">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                      const y = catChartData.T + f * (catChartData.H - catChartData.T - catChartData.B);
                      const val = catChartData.maxV * (1 - f);
                      return (
                        <g key={f}>
                          <line
                            x1={catChartData.L}
                            y1={y}
                            x2={catChartData.W - catChartData.R}
                            y2={y}
                            stroke="currentColor"
                            strokeOpacity="0.1"
                            strokeWidth="1"
                          />
                          <text
                            x={catChartData.L - 6}
                            y={y + 3}
                            textAnchor="end"
                            fontSize="9.5"
                            fill="currentColor"
                            opacity="0.6"
                            className="font-mono"
                          >
                            {metric === "v" ? fmtBahtShort(val) : formatNumber(Math.round(val))}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-axis date labels */}
                    {dates.map((d, i) => (
                      <text
                        key={d}
                        x={catChartData.xAt(i)}
                        y={catChartData.H - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fill="currentColor"
                        opacity="0.7"
                        className="font-mono"
                      >
                        {fmtDateEN(d)}
                      </text>
                    ))}

                    {/* Series paths & points */}
                    {catChartData.series.map((s) => {
                      const pathD = s.values
                        .map((v, i) => `${i === 0 ? "M" : "L"}${catChartData.xAt(i).toFixed(1)},${catChartData.yAt(v).toFixed(1)}`)
                        .join(" ");

                      return (
                        <g key={s.name}>
                          <path
                            d={pathD}
                            fill="none"
                            stroke={s.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.9"
                          />
                          {s.values.map((v, i) => (
                            <circle
                              key={i}
                              cx={catChartData.xAt(i)}
                              cy={catChartData.yAt(v)}
                              r="3.5"
                              fill={s.color}
                              stroke="var(--card)"
                              strokeWidth="1.5"
                            >
                              <title>{`${s.name} · ${fmtDateEN(dates[i])}: ${metric === "v" ? formatCurrency(v) : `${formatNumber(v)} u`}`}</title>
                            </circle>
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Category Chart Legend */}
                <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-border/60 text-xs">
                  {catChartData.series.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-foreground font-medium text-[11px]">{s.name}</span>
                      <span className="font-mono font-bold text-foreground text-[11px]">
                        {metric === "v" ? fmtBahtShort(s.lastVal) : formatNumber(s.lastVal)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. Region × Category Movement Delta Table (First vs. Latest Snapshot) */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-bold">
              Region × Category Movement — First vs. Latest Snapshot
            </CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              การเปลี่ยนแปลงยอด Non-move (&ge;61 วัน) จาก {fmtDateEN(dates[firstD])} ถึง {fmtDateEN(dates[lastD])} (ยอดบวกสีแดง = ทุนจมเพิ่มขึ้น, ยอดลบสีเขียว = ระบายสต๊อกออกสำเร็จ)
            </CardDescription>
          </div>

          <div className="text-xs font-medium text-muted-foreground">
            แสดงหน้า <span className="text-foreground font-bold">{page}</span> จาก {totalPages} ({deltaTableRows.length} รายการ)
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead
                  onClick={() => handleSort("region")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Region (ภูมิภาค)</span>
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
                  onClick={() => handleSort("firstV")}
                  className="cursor-pointer hover:text-primary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{fmtDateEN(dates[firstD])} (เริ่มต้น)</span>
                    {sortCol === "firstV" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("lastV")}
                  className="cursor-pointer hover:text-primary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{fmtDateEN(dates[lastD])} (ล่าสุด)</span>
                    {sortCol === "lastV" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("deltaV")}
                  className="cursor-pointer hover:text-primary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Δ Value / Qty</span>
                    {sortCol === "deltaV" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("deltaPct")}
                  className="cursor-pointer hover:text-primary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Δ %</span>
                    {sortCol === "deltaPct" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDeltaRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    ไม่พบรายการตามตัวกรองที่เลือก
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDeltaRows.map((row: any, idx: number) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  const isPositive = row.deltaV > 0;
                  const isZero = row.deltaV === 0;

                  return (
                    <TableRow key={`${row.region}_${row.category}`} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-muted-foreground text-[11px]">{rowNum}</TableCell>
                      <TableCell className="font-semibold text-foreground text-xs">{row.region}</TableCell>
                      <TableCell className="font-medium text-foreground text-xs">{row.category}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {metric === "v" ? formatCurrency(row.firstV) : formatNumber(row.firstV)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground text-xs">
                        {metric === "v" ? formatCurrency(row.lastV) : formatNumber(row.lastV)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-bold text-xs ${
                          isZero ? "text-muted-foreground" : isPositive ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {fmtDelta(row.deltaV, false)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-bold text-xs ${
                          isZero ? "text-muted-foreground" : isPositive ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {fmtDelta(row.deltaPct, true)}
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
              หน้า <span className="font-medium text-foreground">{page}</span> จาก <span className="font-medium text-foreground">{totalPages}</span> ({deltaTableRows.length} region-category combinations)
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
