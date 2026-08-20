"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import {
  Download,
  Calendar,
  MapPin,
  Store,
  Package,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  KeyRound,
  AlertCircle,
  Database,
  Layers,
  Boxes,
  DollarSign,
  Loader2,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/validators";
import { TEAM_NAME } from "@/lib/version";

export default function ViewerRawDataPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [stores, setStores] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSkuType, setSelectedSkuType] = useState("ALL");
  const [search, setSearch] = useState("");

  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<"csv" | "xlsx" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("viewer_passcode");
    if (saved === "viewer1234") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleUnlockViewer = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "viewer1234") {
      localStorage.setItem("viewer_passcode", passcode);
      setIsAuthenticated(true);
      setPasscodeError("");
    } else {
      setPasscodeError("รหัสผ่านไม่ถูกต้อง");
    }
  };

  // Fetch initial filters
  useEffect(() => {
    if (!isAuthenticated) return;

    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => setRegions(data.regions || []));

    fetch("/api/stores")
      .then((res) => res.json())
      .then((data) => setStores(data.stores || []));
  }, [isAuthenticated]);

  // Fetch Preview Raw Data
  const fetchRawData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const url = new URL("/api/viewer/raw-data", window.location.origin);
      if (selectedDate) url.searchParams.set("date", selectedDate);
      if (selectedRegion !== "ALL") url.searchParams.set("region", selectedRegion);
      if (selectedBranch !== "ALL") url.searchParams.set("branchCode", selectedBranch);
      if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);
      if (selectedSkuType !== "ALL") url.searchParams.set("skuType", selectedSkuType);
      if (search.trim()) url.searchParams.set("search", search.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setAvailableDates(data.availableDates || []);
        if (!selectedDate && data.selectedDate) {
          setSelectedDate(data.selectedDate);
        }
      }
    } catch (err) {
      console.error("Error fetching raw data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedDate, selectedRegion, selectedBranch, selectedCategory, selectedSkuType, search]);

  useEffect(() => {
    fetchRawData();
  }, [fetchRawData]);

  // Trigger File Download
  const handleDownload = (format: "csv" | "xlsx") => {
    setIsExporting(format);
    const url = new URL("/api/viewer/raw-data", window.location.origin);
    if (selectedDate) url.searchParams.set("date", selectedDate);
    if (selectedRegion !== "ALL") url.searchParams.set("region", selectedRegion);
    if (selectedBranch !== "ALL") url.searchParams.set("branchCode", selectedBranch);
    if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);
    if (selectedSkuType !== "ALL") url.searchParams.set("skuType", selectedSkuType);
    if (search.trim()) url.searchParams.set("search", search.trim());
    url.searchParams.set("format", format);

    window.location.href = url.toString();
    setTimeout(() => {
      setIsExporting(null);
    }, 2000);
  };

  const filteredStoresList = selectedRegion === "ALL"
    ? stores
    : stores.filter((s) => s.region === selectedRegion);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-white transition-colors">
        <Navbar />

        <div className="max-w-md mx-auto w-full px-4 my-auto">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <KeyRound className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ภาพรวมผู้บริหาร (Executive Viewer)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                สำหรับผู้บริหาร กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
              </p>
            </div>

            {passcodeError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockViewer} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="กรอกรหัสผ่าน..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors"
              >
                เข้าสู่ระบบ Viewer
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
          ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว &copy; 2026 Non-Move Stock App
        </div>
      </div>
    );
  }

  const summary = previewData?.summary || {
    totalStockQty: 0,
    totalStockValue: 0,
    uniqueStores: 0,
    uniqueModels: 0,
  };
  const totalRows = previewData?.totalRows || 0;
  const previewRows = previewData?.previewRows || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 sm:space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Database className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                  ดาวน์โหลดข้อมูลดิบ (Download RAW Data)
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Store &amp; Model Dimension Joined
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ดาวน์โหลดข้อมูลสต๊อกไม่เคลื่อนไหวรายวัน พร้อมรายละเอียดครบทุกคอลัมน์จาก Store และ Model Dimension · {TEAM_NAME}
              </p>
            </div>
          </div>

          {/* Quick Download Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              onClick={() => handleDownload("xlsx")}
              disabled={isExporting !== null || totalRows === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {isExporting === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              <span>ดาวน์โหลด Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => handleDownload("csv")}
              disabled={isExporting !== null || totalRows === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all disabled:opacity-50"
            >
              {isExporting === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              <span>ดาวน์โหลด CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Filter className="h-4 w-4 text-indigo-600" />
              ตัวกรองข้อมูล (Filters)
            </div>
            <button
              onClick={fetchRawData}
              title="รีเฟรชข้อมูล"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              รีเฟรช
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Date Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                รอบวันที่รายงาน
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      วันที่: {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Region */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ภูมิภาค (Region)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedBranch("ALL");
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">ทุกภูมิภาค (Nationwide)</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>ภาค {r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Branch / Store */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                สาขา / ร้านค้า (Store)
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">ทุกสาขา ({filteredStoresList.length})</option>
                  {filteredStoresList.map((s) => (
                    <option key={s.branchCode} value={s.branchCode}>
                      {s.branchCode} - {s.storeNameCust || s.storeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. SKU_TYPE */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ประเภทสินค้า (SKU_TYPE)
              </label>
              <select
                value={selectedSkuType}
                onChange={(e) => setSelectedSkuType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">ทุกประเภท (All SKU_TYPE)</option>
                <option value="SELLABLE">SELLABLE (สินค้าขาย)</option>
                <option value="DEMO">DEMO (ตัวโชว์)</option>
                <option value="MOCK_UP">MOCK_UP</option>
              </select>
            </div>

            {/* 5. Live Search */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ค้นหา (รหัส, โมเดล, สาขา)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหารหัสสาขา, โมเดล..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dataset Summary Counter */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">จำนวนแถวทั้งหมด (Total Rows)</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formatNumber(totalRows)} <span className="text-xs font-semibold text-slate-400">รายการ</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">มูลค่าสต๊อกรวม (Total Value)</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(summary.totalStockValue)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">จำนวนชิ้นรวม (Total QTY)</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formatNumber(summary.totalStockQty)} <span className="text-xs font-semibold text-slate-400">ชิ้น</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">จำนวนสาขา / โมเดล</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {summary.uniqueStores} <span className="text-xs font-semibold text-slate-400">สาขา</span> / {summary.uniqueModels} <span className="text-xs font-semibold text-slate-400">โมเดล</span>
            </div>
          </div>
        </div>

        {/* Live Data Preview Table (Top 100 rows) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-4 sm:p-6 transition-colors">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ตัวอย่างข้อมูลดิบ (RAW Data Preview - แสดง 100 แถวแรก)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ข้อมูลสมบูรณ์พร้อมคอลัมน์ที่ Join กับ Master Dimension เรียบร้อยแล้ว สามารถกดดาวน์โหลดไฟล์ฉบับเต็มได้ทันที
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload("xlsx")}
                disabled={isExporting !== null || totalRows === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Excel
              </button>
              <button
                onClick={() => handleDownload("csv")}
                disabled={isExporting !== null || totalRows === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all disabled:opacity-50"
              >
                <FileText className="h-3.5 w-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 font-bold">#</th>
                  <th className="py-2.5 px-3 font-bold">STORE_ID</th>
                  <th className="py-2.5 px-3 font-bold">รหัสสาขา</th>
                  <th className="py-2.5 px-3 font-bold">ชื่อสาขา (Customer Store Name)</th>
                  <th className="py-2.5 px-3 font-bold">จังหวัด</th>
                  <th className="py-2.5 px-3 font-bold text-center">ภาค</th>
                  <th className="py-2.5 px-3 font-bold text-center">ประเภทสาขา</th>
                  <th className="py-2.5 px-3 font-bold">รหัสสินค้า</th>
                  <th className="py-2.5 px-3 font-bold">รุ่นสินค้า (Model)</th>
                  <th className="py-2.5 px-3 font-bold text-center">ประเภท (SKU_TYPE)</th>
                  <th className="py-2.5 px-3 font-bold">หมวดหมู่ (Category)</th>
                  <th className="py-2.5 px-3 font-bold text-center">ช่วงวัน (Bucket)</th>
                  <th className="py-2.5 px-3 font-bold text-right">จำนวนชิ้น</th>
                  <th className="py-2.5 px-3 font-bold text-right">มูลค่ารวม (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {isLoading ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400 font-sans">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                      กำลังโหลดตัวอย่างข้อมูลดิบ...
                    </td>
                  </tr>
                ) : previewRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400 font-sans">
                      ไม่พบข้อมูลที่ตรงกับตัวกรองที่เลือก
                    </td>
                  </tr>
                ) : (
                  previewRows.map((r: any) => (
                    <tr key={r.id} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2 px-3 font-sans text-slate-400">{r.index}</td>
                      <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">{r.storeId}</td>
                      <td className="py-2 px-3 font-bold text-indigo-700 dark:text-indigo-400">{r.branchCode}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                        {r.storeName}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">{r.province}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                          {r.region}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                          {r.storeType}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{r.productCode}</td>
                      <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white max-w-[160px] truncate">
                        {r.model}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-[10px]">
                          {r.skuType}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">{r.category}</td>
                      <td className="py-2 px-3 text-center font-sans font-bold text-[10px]">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {r.nonmoveDaysBucket} วัน
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-sans font-bold text-slate-900 dark:text-white">
                        {formatNumber(r.stockQty)}
                      </td>
                      <td className="py-2 px-3 text-right font-sans font-black text-slate-900 dark:text-white">
                        {formatCurrency(r.stockValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว &copy; 2026 Non-Move Stock App
      </footer>
    </div>
  );
}
