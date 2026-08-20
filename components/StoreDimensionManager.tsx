"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Store,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  MapPin,
  RefreshCw,
  FileUp,
  AlertTriangle,
} from "lucide-react";
import { formatNumber } from "@/lib/validators";

export function StoreDimensionManager({ passcode }: { passcode: string }) {
  const [stores, setStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");

  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStores = useCallback(async () => {
    setIsLoadingStores(true);
    try {
      const res = await fetch("/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error("Error fetching stores:", err);
    } finally {
      setIsLoadingStores(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

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
      alert("กรุณาเลือกไฟล์ Store Dimension");
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("passcode", passcode || "admin123");

      const res = await fetch("/api/admin/stores/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "นำเข้าข้อมูลสาขาไม่สำเร็จ");

      setUploadStatus({
        success: true,
        message: data.message || "อัปเดต Store Dimension สำเร็จ",
      });
      setFile(null);
      fetchStores();
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: err.message || "เกิดข้อผิดพลาดในการอัปโหลด",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const regions = Array.from(new Set(stores.map((s) => s.region))).filter(Boolean);

  const filteredStores = stores.filter((s) => {
    if (selectedRegion !== "ALL" && s.region !== selectedRegion) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.branchCode.toLowerCase().includes(q) ||
        (s.storeNameCust && s.storeNameCust.toLowerCase().includes(q)) ||
        (s.storeName && s.storeName.toLowerCase().includes(q)) ||
        (s.province && s.province.toLowerCase().includes(q)) ||
        s.region.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* 1. Current Stores Export Header Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base">
            <Store className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3>ฐานข้อมูลสาขาปัจจุบัน (Current Store Dimension)</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ปัจจุบันมีสาขาในระบบทั้งหมด {formatNumber(stores.length)} สาขา สามารถส่งออกเพื่อสำรองหรือนำไปแก้ไขได้
          </p>
        </div>
        <a
          href="/api/admin/stores/export"
          download
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
        >
          <Download className="h-4 w-4" />
          ส่งออกข้อมูลสาขาปัจจุบัน ({formatNumber(stores.length)} สาขา)
        </a>
      </div>

      {/* 2. Upload & Replace Store Dimension Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              อัปโหลดไฟล์ Store Dimension (Upload & Replace Stores)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              แทนที่ข้อมูลเดิม
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            เมื่ออัปโหลดไฟล์ใหม่ ระบบจะทำการอัปเดตและแทนที่รายชื่อสาขาทั้งหมดในฐานข้อมูลด้วยชุดข้อมูลใหม่จากไฟล์
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
            className="flex justify-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-6 py-8 hover:border-purple-400 bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
          >
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shadow-sm">
                <FileUp className="h-6 w-6" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <label className="cursor-pointer rounded-md font-bold text-purple-600 dark:text-purple-400 hover:text-purple-500">
                  <span>คลิกเพื่อเลือกไฟล์ Store Dimension</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    className="sr-only"
                  />
                </label>
                <span className="pl-1">หรือลากไฟล์มาวางที่นี่</span>
              </div>
              <p className="text-[11px] text-slate-400">รองรับไฟล์ .xlsx, .xls, .csv</p>
              {file && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-3.5 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังอัปเดต Store Dimension...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                อัปโหลดและแทนที่ Store Dimension
              </>
            )}
          </button>
        </form>
      </div>

      {/* 3. Live Store Dimension Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              รายชื่อสาขาทั้งหมดในระบบ (Store Master List)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              พบทั้งหมด {formatNumber(filteredStores.length)} สาขา
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
                placeholder="ค้นหารหัสสาขา, ชื่อสาขา, จังหวัด..."
                className="w-60 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm"
            >
              <option value="ALL">ทุกภูมิภาค</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>ภาค {reg}</option>
              ))}
            </select>

            <button
              onClick={fetchStores}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              title="รีเฟรชรายชื่อสาขา"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-5 font-bold">รหัสสาขา (BranchCode)</th>
                <th className="py-3.5 px-4 font-bold">ชื่อสาขา (STORE_NAME_CUST)</th>
                <th className="py-3.5 px-4 font-bold">รหัสร้าน (STORE_ID)</th>
                <th className="py-3.5 px-4 font-bold">จังหวัด (PROVINCE)</th>
                <th className="py-3.5 px-4 font-bold">ประเภท (STORE_TYPE)</th>
                <th className="py-3.5 px-4 font-bold text-center">ภูมิภาค (REGION)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isLoadingStores ? "กำลังโหลดรายชื่อสาขา..." : "ไม่พบรายชื่อสาขาที่ตรงกับเงื่อนไข"}
                  </td>
                </tr>
              ) : (
                filteredStores.map((s) => (
                  <tr key={s.branchCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-purple-700 dark:text-purple-400 whitespace-nowrap">
                      {s.branchCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {s.storeNameCust}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {s.storeId || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {s.province ? `จ.${s.province}` : "-"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {s.storeType || "STORE"}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {s.region}
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
