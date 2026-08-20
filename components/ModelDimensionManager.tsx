"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  RefreshCw,
  FileUp,
  AlertTriangle,
  Link,
  ShieldCheck,
  Flame,
  Layers,
  Filter,
} from "lucide-react";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/validators";

export function ModelDimensionManager({ passcode }: { passcode: string }) {
  const [models, setModels] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Join Check State
  const [joinData, setJoinData] = useState<any>(null);
  const [isLoadingJoin, setIsLoadingJoin] = useState(true);

  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const url = new URL("/api/admin/models", window.location.origin);
      if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);
      if (search.trim()) url.searchParams.set("search", search.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setModels(data.products || []);
        setTotalCount(data.totalCount || 0);
        if (data.categories) setCategories(data.categories);
      }
    } catch (err) {
      console.error("Error fetching models:", err);
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedCategory, search]);

  const fetchJoinCheck = useCallback(async () => {
    setIsLoadingJoin(true);
    try {
      const res = await fetch("/api/admin/models/join-check");
      if (res.ok) {
        const data = await res.json();
        setJoinData(data);
      }
    } catch (err) {
      console.error("Error checking join:", err);
    } finally {
      setIsLoadingJoin(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    fetchJoinCheck();
  }, [fetchJoinCheck]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith(".xlsx") ||
        droppedFile.name.endsWith(".xls") ||
        droppedFile.name.endsWith(".csv")
      ) {
        setFile(droppedFile);
      } else {
        alert("กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV (.csv) เท่านั้น");
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("กรุณาเลือกไฟล์ Model Dimension");
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("passcode", passcode || "admin123");

      const res = await fetch("/api/admin/models/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "นำเข้าข้อมูลรุ่นสินค้าไม่สำเร็จ");

      setUploadStatus({
        success: true,
        message: data.message || "อัปเดต Model Dimension สำเร็จ",
      });
      setFile(null);
      fetchModels();
      fetchJoinCheck();
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: err.message || "เกิดข้อผิดพลาดในการอัปโหลด",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Export Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base">
            <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3>ฐานข้อมูลรุ่นสินค้า (Model Dimension Master)</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            จัดการ Master ข้อมูลสินค้า/รุ่น (ProductCode, Model, Category) และตรวจสอบความถูกต้องในการเชื่อมโยงกับข้อมูลสต๊อก
          </p>
        </div>
        <a
          href="/api/admin/models/export"
          download
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
        >
          <Download className="h-4 w-4" />
          ส่งออกข้อมูลรุ่นปัจจุบัน ({formatNumber(totalCount)} รุ่น)
        </a>
      </div>

      {/* 2. JOIN INTEGRITY & VALIDATION CHECK */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              joinData?.isFullyMatched
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
            }`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                ตรวจสอบการเชื่อมโยงข้อมูล (Data Join Check: ProductCode)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เปรียบเทียบรหัสสินค้าในรายงานสต๊อกจริง (NonMoveRow) กับ Master Model Dimension
              </p>
            </div>
          </div>

          <button
            onClick={fetchJoinCheck}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            ตรวจสอบซ้ำ
          </button>
        </div>

        {/* Join KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Match Rate Card */}
          <div className={`rounded-2xl border p-5 ${
            joinData?.isFullyMatched
              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              อัตราความสมบูรณ์ (Join Match Rate)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-black ${
                joinData?.isFullyMatched ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
              }`}>
                {joinData ? `${joinData.matchRatePct}%` : "-"}
              </span>
              <span className="text-xs font-bold text-slate-500">
                ({joinData?.matchedSkusCount || 0}/{joinData?.totalStockSkus || 0} SKUs)
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              {joinData?.isFullyMatched ? "✅ ทุกรหัสสินค้าในสต๊อกตรงกับ Master ครบ 100%" : "⚠️ มีรหัสสินค้าในสต๊อกที่ไม่พบใน Master"}
            </div>
          </div>

          {/* Matched Stock Value */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              มูลค่าสินค้าที่ตรงกับ Master
            </span>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(joinData?.matchedValue || 0)}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {formatNumber(joinData?.matchedQty || 0)} ชิ้น ({joinData?.matchedSkusCount || 0} SKUs)
            </div>
          </div>

          {/* Unmatched / Missing SKUs */}
          <div className={`rounded-2xl border p-5 ${
            joinData?.unmatchedSkusCount > 0
              ? "border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30"
              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              รหัสสินค้าที่ไม่พบใน Master
            </span>
            <div className={`mt-2 text-2xl font-black ${
              joinData?.unmatchedSkusCount > 0 ? "text-rose-700 dark:text-rose-300" : "text-slate-900 dark:text-white"
            }`}>
              {formatNumber(joinData?.unmatchedSkusCount || 0)} <span className="text-sm font-bold">SKUs</span>
            </div>
            <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
              มูลค่า {formatCurrency(joinData?.unmatchedValue || 0)} ({formatNumber(joinData?.unmatchedQty || 0)} ชิ้น)
            </div>
          </div>

          {/* Total Master Models Count */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              จำนวนรุ่นทั้งหมดใน Master
            </span>
            <div className="mt-2 text-2xl font-black text-indigo-700 dark:text-indigo-400">
              {formatNumber(joinData?.totalMasterModels || totalCount)} <span className="text-sm font-bold">รุ่น</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              พร้อมใช้งานสำหรับการแสดงผล
            </div>
          </div>
        </div>

        {/* Unmatched SKUs Warning Table */}
        {joinData?.unmatchedList && joinData.unmatchedList.length > 0 && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>รายการรหัสสินค้าในรายงานสต๊อกที่ยังไม่มีใน Model Master ({joinData.unmatchedList.length} รายการ):</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-rose-100/60 dark:bg-rose-950/60 text-[11px] uppercase font-bold text-rose-900 dark:text-rose-200 border-b border-rose-200 dark:border-rose-800">
                  <tr>
                    <th className="py-2.5 px-4">ProductCode</th>
                    <th className="py-2.5 px-4">หมวดหมู่ในรายงาน</th>
                    <th className="py-2.5 px-4 text-right">จำนวนชิ้นสต๊อก (QTY)</th>
                    <th className="py-2.5 px-4 text-right">มูลค่าสต๊อก (บาท)</th>
                    <th className="py-2.5 px-4 text-right">จำนวนสาขาที่มี</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40">
                  {joinData.unmatchedList.map((u: any) => (
                    <tr key={u.productCode} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-rose-700 dark:text-rose-400">
                        {u.productCode}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {u.category}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                        {formatNumber(u.stockQty)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-rose-700 dark:text-rose-300">
                        {formatCurrency(u.stockValue)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {u.branchCount} สาขา
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 แนะนำ: เพิ่มรหัสสินค้าข้างต้นลงในไฟล์ Model Dimension แล้วทำการอัปโหลดใหม่ เพื่อให้ระบบแสดงชื่อรุ่นและหมวดหมู่อย่างสมบูรณ์ 100%
            </p>
          </div>
        )}
      </div>

      {/* 3. Upload & Replace Model Dimension Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              อัปโหลดไฟล์ Model Dimension (Upload & Replace 100%)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              แทนที่ข้อมูล Master 100%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            รองรับไฟล์ `.xlsx`, `.xls` และ `.csv (UTF-8)` โดยระบบจะใช้คอลัมน์ `ProductCode` เป็นคีย์หลักในการเชื่อมโยงกับรายงานสต๊อก
          </p>
        </div>

        {uploadStatus && (
          <div
            className={`p-4 rounded-2xl border flex gap-3 items-start text-xs ${
              uploadStatus.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {uploadStatus.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">{uploadStatus.success ? "สำเร็จ" : "เกิดข้อผิดพลาด"}</div>
              <div className="mt-0.5">{uploadStatus.message}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="flex justify-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-6 py-8 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
          >
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm">
                <FileUp className="h-6 w-6" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <label className="cursor-pointer rounded-md font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                  <span>คลิกเพื่อเลือกไฟล์ Model Dimension</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    className="sr-only"
                  />
                </label>
                <span className="pl-1">หรือลากไฟล์มาวางที่นี่</span>
              </div>
              <p className="text-[11px] text-slate-400">รองรับไฟล์ .xlsx, .xls, .csv (UTF-8)</p>
              {file && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังนำเข้าและแทนที่ Model Dimension 100%...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                อัปโหลดและแทนที่ Model Dimension (100% Replace)
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. Live Model Master Explorer Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              รายชื่อรุ่นสินค้าทั้งหมดในระบบ (Model Master List)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              พบทั้งหมด {formatNumber(totalCount)} รุ่นสินค้า
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm"
              >
                <option value="ALL">ทุกหมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            <button
              onClick={fetchModels}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              title="รีเฟรชรายชื่อรุ่น"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-5 font-bold">รหัสสินค้า (ProductCode)</th>
                <th className="py-3.5 px-4 font-bold">ชื่อสินค้า (ProductName)</th>
                <th className="py-3.5 px-4 font-bold">รุ่น (MODEL)</th>
                <th className="py-3.5 px-4 font-bold">หมวดหมู่ (CATEGORY)</th>
                <th className="py-3.5 px-4 font-bold">หมวดหมู่ย่อย (SUB_CAT)</th>
                <th className="py-3.5 px-4 font-bold text-center">ประเภท (SKU_TYPE)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {models.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isLoadingModels ? "กำลังโหลดรายชื่อรุ่นสินค้า..." : "ไม่พบรายชื่อรุ่นสินค้าที่ตรงกับเงื่อนไข"}
                  </td>
                </tr>
              ) : (
                models.slice(0, 100).map((m) => (
                  <tr key={m.productCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                      {m.productCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-sm">
                      <div className="line-clamp-1">{m.productName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {m.model || "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {m.category || "Other"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {m.subCategory || "-"}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {m.skuType || "SELLABLE"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
