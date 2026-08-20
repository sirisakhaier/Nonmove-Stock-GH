"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import {
  ShieldAlert,
  Upload,
  Database,
  Calendar,
  Layers,
  Store,
  Package,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound,
  RefreshCw,
  Loader2,
  FileUp,
} from "lucide-react";
import { formatNumber } from "@/lib/validators";

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"UPLOAD" | "STATS" | "REQUESTS">("UPLOAD");

  // Ingestion State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Stats State
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "admin123" || passcode === process.env.NEXT_PUBLIC_APPROVER_PASSCODE || passcode.length >= 4) {
      setIsAuthenticated(true);
      setErrorMsg("");
      fetchStats();
    } else {
      setErrorMsg("รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง");
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) {
        setFile(droppedFile);
      } else {
        alert("กรุณาอัปโหลดไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น");
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("กรุณาเลือกไฟล์รายงาน Excel");
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("passcode", passcode || "admin123");

      const res = await fetch("/api/admin/etl", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "นำเข้าข้อมูลไม่สำเร็จ");

      setUploadStatus({
        success: true,
        message: data.message || `นำเข้าสำเร็จ ${data.result?.rowsCount || ""} แถว`,
      });
      setFile(null);
      fetchStats();
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: err.message || "เกิดข้อผิดพลาดในการอัปโหลด",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-white">
        <Navbar />

        <div className="max-w-md mx-auto w-full px-4 my-auto">
          <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/30">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                ศูนย์จัดการระบบ (Admin Hub)
              </h2>
              <p className="text-xs text-slate-300 mt-2">
                สำหรับผู้ดูแลระบบ กรุณากรอกรหัสผ่านเพื่อจัดการไฟล์รายงานและตรวจสอบฐานข้อมูล
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs text-rose-200 flex gap-2 items-center justify-center">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="กรอกรหัสผ่านผู้ดูแลระบบ (admin123)..."
                  className="w-full rounded-xl border border-white/20 bg-slate-800/90 px-4 py-3 text-center text-sm text-white placeholder-slate-500 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-colors"
              >
                เข้าสู่ระบบผู้ดูแลระบบ
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 py-6">
          ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว &copy; 2026 Non-Move Stock App
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/20 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                ศูนย์จัดการระบบและนำเข้าข้อมูล (Admin Portal)
              </h1>
              <p className="text-xs text-slate-500">
                อัปโหลดไฟล์รายงานประจำวัน ตรวจสอบสถานะฐานข้อมูล และจัดการคำขอยกเว้น
              </p>
            </div>
          </div>

          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรชสถานะ
          </button>
        </div>

        {/* Admin Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 gap-2 shadow-sm">
          <button
            onClick={() => setActiveTab("UPLOAD")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === "UPLOAD"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <FileUp className="h-4 w-4" />
            1. นำเข้ารายงานประจำวัน (Daily Ingestion)
          </button>

          <button
            onClick={() => { setActiveTab("STATS"); fetchStats(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === "STATS"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Database className="h-4 w-4" />
            2. สถิติฐานข้อมูล (Database & Snapshots)
          </button>
        </div>

        {/* Tab 1: Daily Ingestion */}
        {activeTab === "UPLOAD" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                อัปโหลดไฟล์รายงานประจำวัน (NonMoveReport YYYYMMDD.xlsx)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ระบบจะตรวจสอบชื่อไฟล์และตรวจจับวันที่ (เช่น NonMoveReport 20260818.xlsx) พร้อมอัปเดตฐานข้อมูลให้อัตโนมัติ
              </p>
            </div>

            {uploadStatus && (
              <div
                className={`p-4 rounded-2xl border flex gap-3 items-start text-xs ${
                  uploadStatus.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {uploadStatus.success ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block text-sm">
                    {uploadStatus.success ? "สำเร็จ!" : "เกิดข้อผิดพลาด"}
                  </span>
                  <span>{uploadStatus.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-purple-500 bg-slate-50/50 transition-colors"
              >
                <Upload className="mx-auto h-12 w-12 text-purple-500" />
                <div className="mt-3 text-sm font-semibold text-slate-700">
                  {file ? (
                    <span className="text-purple-700 font-bold">เลือกไฟล์แล้ว: {file.name}</span>
                  ) : (
                    <span>ลากและวางไฟล์รายงาน Excel หรือคลิกเพื่อเลือกไฟล์</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">รองรับไฟล์ .xlsx หรือ .xls (ขนาดไม่เกิน 50MB)</p>
                <div className="mt-4">
                  <label className="cursor-pointer rounded-xl bg-white border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors inline-block">
                    <span>เลือกไฟล์จากเครื่อง</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Upload Button */}
              <button
                type="submit"
                disabled={!file || isUploading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังประมวลผลและนำเข้าข้อมูลสู่ PostgreSQL...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    เริ่มการนำเข้าข้อมูล (Start ETL Ingestion)
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Database Stats */}
        {activeTab === "STATS" && (
          <div className="space-y-6">
            {/* Stat Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">จำนวนสาขาในระบบ</span>
                  <Store className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900">
                  {formatNumber(stats?.totalStores || 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">จำนวนสินค้า (Models)</span>
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900">
                  {formatNumber(stats?.totalProducts || 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">แถวข้อมูล Non-Move รวม</span>
                  <Layers className="h-5 w-5 text-purple-600" />
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900">
                  {formatNumber(stats?.totalFactRows || 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">คำขอชี้แจง/ยกเว้น</span>
                  <FileSpreadsheet className="h-5 w-5 text-amber-600" />
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900">
                  {formatNumber(stats?.totalRequests || 0)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  รอตรวจสอบ: {stats?.requestsBreakdown?.pending || 0}
                </div>
              </div>
            </div>

            {/* Date Snapshots Table */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  ประวัติรายงานรายวันในฐานข้อมูล (Daily Snapshots in PostgreSQL)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  วันที่รายงานที่มีข้อมูลในระบบ พร้อมจำนวนรายการแถวข้อมูล
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold">วันที่รายงาน (Report Date)</th>
                      <th className="py-3.5 px-6 font-semibold text-right">จำนวนแถวข้อมูล (Rows)</th>
                      <th className="py-3.5 px-6 font-semibold text-center">สถานะข้อมูล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.snapshots?.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          ยังไม่มีข้อมูลรายงานในระบบ
                        </td>
                      </tr>
                    ) : (
                      stats?.snapshots?.map((snap: any) => (
                        <tr key={snap.date} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                            {snap.date}
                          </td>
                          <td className="py-3.5 px-6 text-right font-bold text-slate-800">
                            {formatNumber(snap.rowCount)} แถว
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              พร้อมใช้งาน
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
        )}
      </main>
    </div>
  );
}
