"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Layers,
  Calendar,
  Store,
  MapPin,
  Flame,
  CheckCircle2,
  DollarSign,
  Package,
  ArrowUpRight,
  Download,
  RefreshCw,
  Search,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/validators";

export default function ViewerOverviewPage() {
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [search, setSearch] = useState("");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch regions
  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => setRegions(data.regions || []));
  }, []);

  // Fetch summary
  const fetchViewerData = useCallback(async (date?: string, region?: string) => {
    setIsLoading(true);
    try {
      const url = new URL("/api/viewer/summary", window.location.origin);
      if (region && region !== "ALL") url.searchParams.set("region", region);
      if (date) url.searchParams.set("date", date);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("โหลดข้อมูลภาพรวมไม่สำเร็จ");
      const data = await res.json();

      setSummaryData(data);
      setAvailableDates(data.availableDates || []);
      if (!selectedDate && data.selectedDate) {
        setSelectedDate(data.selectedDate);
      }
    } catch (err) {
      console.error("Error fetching viewer summary:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchViewerData(selectedDate, selectedRegion);
  }, [selectedRegion, selectedDate, fetchViewerData]);

  const kpis = summaryData?.kpis || {
    totalStores: 0,
    totalSkus: 0,
    totalStockQty: 0,
    totalStockValue: 0,
    highNonmoveRatio: 0,
    highCount: 0,
    okCount: 0,
    overallOkPct: 0,
  };

  const storeRanking: any[] = summaryData?.storeRanking || [];
  const regionBreakdown: any[] = summaryData?.regionBreakdown || [];

  const filteredStores = storeRanking.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.branchCode.toLowerCase().includes(q) ||
        s.storeNameCust.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q) ||
        (s.province && s.province.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportSummary = () => {
    if (!storeRanking.length) return;
    const headers = ["BranchCode", "StoreName", "Region", "Province", "SKUs", "StockQty", "StockValueTHB", "HighCount", "OkCount", "HighPct", "OkPct"];
    const rows = storeRanking.map((s) => [
      `="${s.branchCode}"`,
      `"${(s.storeNameCust || "").replace(/"/g, "")}"`,
      `"${s.region}"`,
      `"${s.province || ""}"`,
      s.skuCount,
      s.stockQty,
      s.stockValue,
      s.highCount,
      s.okCount,
      s.highPct,
      s.okPct,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NonMove_Viewer_Summary_${selectedRegion}_${selectedDate}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Layers className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  ภาพรวมสต๊อกไม่เคลื่อนไหวทุกสาขา (Viewer Overview)
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {selectedRegion === "ALL" ? "ทุกภูมิภาคทั่วประเทศ" : `ภาค ${selectedRegion}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                สรุปสถานะ Non-Move Stock สำหรับผู้บริหาร, ผู้จัดการภาค และ Merchandiser
              </p>
            </div>
          </div>

          {/* Controls: Region Selector & Date Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Region Selector */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">ทุกภูมิภาค (Nationwide)</option>
                {regions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    วันที่: {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchViewerData(selectedDate, selectedRegion)}
              className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              title="รีเฟรช"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 1. Executive KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Stores */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                จำนวนสาขาทั้งหมด
              </span>
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Store className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {formatNumber(kpis.totalStores)}
              </span>
              <span className="text-xs text-slate-500 font-medium">สาขา</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              สาขาที่มีสต๊อก Non-move: {kpis.activeStoresWithStock || kpis.totalStores} สาขา
            </p>
          </div>

          {/* Total Value */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                มูลค่าสต๊อกรวม (บาท)
              </span>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">
                {formatCurrency(kpis.totalStockValue)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              รวม {formatNumber(kpis.totalStockQty)} ชิ้น ({formatNumber(kpis.totalSkus)} SKU)
            </p>
          </div>

          {/* High Non-Move Ratio */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                สัดส่วนสินค้าค้างนานวิกฤต
              </span>
              <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600">
                <Flame className="h-5 w-5 fill-rose-500 text-rose-500" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-700">
                {formatPercent(kpis.highNonmoveRatio)}
              </span>
              <span className="text-xs text-slate-500 font-medium">(High Non-move)</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-rose-600 font-semibold">🔥 {formatNumber(kpis.highCount)} รายการ</span>
              <span className="text-emerald-600 font-semibold">✅ {formatNumber(kpis.okCount)} รายการ</span>
            </div>
          </div>

          {/* Approved Exclusions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                รายการที่ได้รับอนุมัติยกเว้น
              </span>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-700">
                {formatNumber(kpis.excludedCount || 0)}
              </span>
              <span className="text-xs text-slate-500 font-medium">รายการ</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              ปลดล็อคจากการคิดอัตราวิกฤตแล้ว
            </p>
          </div>
        </div>

        {/* 2. Regional Summary Cards (if Nationwide) */}
        {selectedRegion === "ALL" && regionBreakdown.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                เปรียบเทียบสถานะแยกตามรายภูมิภาค (Regional Benchmark)
              </h2>
              <span className="text-xs text-slate-500">
                {regionBreakdown.length} ภูมิภาค
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {regionBreakdown.map((r) => (
                <div
                  key={r.region}
                  onClick={() => setSelectedRegion(r.region)}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/60 p-4 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                      {r.region}
                    </span>
                    <span className="text-xs text-slate-500">{r.storeCount} สาขา</span>
                  </div>
                  <div className="mt-2 font-bold text-slate-800 text-lg">
                    {formatCurrency(r.stockValue)}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-rose-600 font-semibold">🔥 วิกฤต {r.highPct}%</span>
                    <span className="text-emerald-600 font-semibold">✅ ปกติ {r.okPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Branch Performance Ranking Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                อันดับสต๊อกไม่เคลื่อนไหวรายสาขา (Branch Performance Ranking)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                คลิกที่ชื่อสาขาเพื่อเข้าสู่แดชบอร์ดตรวจสอบราย SKU ของสาขานั้นโดยตรง
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหารหัสสาขา, ชื่อสาขา, จังหวัด..."
                  className="w-64 rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleExportSummary}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors shrink-0"
              >
                <Download className="h-4 w-4" />
                ส่งออก CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">อันดับ</th>
                  <th className="py-3.5 px-4 font-semibold">รหัสสาขา</th>
                  <th className="py-3.5 px-4 font-semibold">ชื่อสาขา / ที่ตั้ง</th>
                  <th className="py-3.5 px-4 font-semibold">ภูมิภาค</th>
                  <th className="py-3.5 px-4 font-semibold text-right">จำนวน SKU</th>
                  <th className="py-3.5 px-4 font-semibold text-right">จำนวนชิ้น</th>
                  <th className="py-3.5 px-4 font-semibold text-right">มูลค่าสต๊อก (บาท)</th>
                  <th className="py-3.5 px-4 font-semibold text-center">สัดส่วนวิกฤต (High)</th>
                  <th className="py-3.5 px-4 font-semibold text-center">เข้าดูแดชบอร์ด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลสาขาที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((s, idx) => (
                    <tr key={s.branchCode} className="hover:bg-indigo-50/40 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-slate-400 whitespace-nowrap">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {s.branchCode}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {s.storeNameCust}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {s.province ? `จ.${s.province}` : "-"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {s.region}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                        {formatNumber(s.skuCount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                        {formatNumber(s.stockQty)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(s.stockValue)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100">
                          <span className="text-rose-600">🔥 {s.highPct}%</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-emerald-600">✅ {s.okPct}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Link
                          href={`/dashboard/${s.branchCode}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          เปิดดูสาขา
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
