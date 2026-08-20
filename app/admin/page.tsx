"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ApprovalQueueTable } from "@/components/ApprovalQueueTable";
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
  Trash2,
  Download,
  CheckSquare,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/validators";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"UPLOAD" | "STATS" | "APPROVALS" | "EXPORT" | "TREND">("UPLOAD");
  const [trendData, setTrendData] = useState<any>(null);

  // Ingestion State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Stats State
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Approvals State
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Deletion State
  const [deleteTargetDate, setDeleteTargetDate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch("/api/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "admin123" || passcode === process.env.NEXT_PUBLIC_APPROVER_PASSCODE || passcode.length >= 4) {
      setIsAuthenticated(true);
      setErrorMsg("");
      fetchStats();
      fetchRequests();
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
      fetchRequests();
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: err.message || "เกิดข้อผิดพลาดในการอัปโหลด",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Snapshot Handler
  const handleConfirmDelete = async () => {
    if (!deleteTargetDate) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/snapshots?date=${deleteTargetDate}&passcode=${encodeURIComponent(passcode || "admin123")}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบข้อมูลไม่สำเร็จ");
      alert(data.message || `ลบข้อมูลรายงานวันที่ ${deleteTargetDate} เรียบร้อยแล้ว`);
      setDeleteTargetDate(null);
      fetchStats();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setIsDeleting(false);
    }
  };

  // Approver decision handler
  const handleDecision = async (id: string, decision: "APPROVED" | "REJECTED" | "REVISE", comment?: string) => {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: decision,
        reviewComment: comment,
        reviewedByName: "HQ Admin",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "บันทึกผลการพิจารณาไม่สำเร็จ");
    }

    fetchRequests();
    fetchStats();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex flex-col justify-between text-white">
        <Navbar />

        <div className="max-w-md mx-auto w-full px-4 my-auto">
          <div className="rounded-3xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl border border-white/15 dark:border-slate-800 p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/30">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                ศูนย์จัดการระบบ (Admin Hub)
              </h2>
              <p className="text-xs text-slate-300 dark:text-slate-400 mt-2">
                สำหรับผู้ดูแลระบบและผู้อนุมัติ กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
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
                  className="w-full rounded-xl border border-white/20 dark:border-slate-700 bg-slate-800/90 dark:bg-slate-900/90 px-4 py-3 text-center text-sm text-white placeholder-slate-500 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
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

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 py-6">
          ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว &copy; 2026 Non-Move Stock App
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/20 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                ศูนย์จัดการระบบและพิจารณาอนุมัติ (Admin & Approvals Hub)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                นำเข้ารายงานประจำวัน ลบข้อมูลรายงานย้อนหลัง พิจารณาคำขอยกเว้น และส่งออกรายงาน Excel พร้อมรูปภาพ
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              fetchStats();
              fetchRequests();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรชข้อมูล
          </button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-1.5 gap-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab("UPLOAD")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "UPLOAD"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <FileUp className="h-4 w-4" />
            1. นำเข้ารายงาน
          </button>

          <button
            onClick={() => { setActiveTab("STATS"); fetchStats(); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "STATS"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Database className="h-4 w-4" />
            2. จัดการรายงาน ({stats?.snapshots?.length || 0})
          </button>

          <button
            onClick={() => { setActiveTab("APPROVALS"); fetchRequests(); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "APPROVALS"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            3. พิจารณาคำขอ ({stats?.requestsBreakdown?.pending || 0})
          </button>

          <button
            onClick={() => setActiveTab("EXPORT")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "EXPORT"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Download className="h-4 w-4" />
            4. ส่งออก Excel พร้อมรูป
          </button>

          <button
            onClick={() => {
              setActiveTab("TREND");
              fetch("/api/viewer/trend?region=ALL").then(r => r.json()).then(setTrendData);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all col-span-2 md:col-span-1 ${
              activeTab === "TREND"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            5. วิเคราะห์แนวโน้มภาพรวม
          </button>
        </div>

        {/* Tab 1: Daily Ingestion */}
        {activeTab === "UPLOAD" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                อัปโหลดไฟล์รายงานประจำวัน (NonMoveReport YYYYMMDD.xlsx)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ระบบจะตรวจสอบชื่อไฟล์และตรวจจับวันที่ (เช่น NonMoveReport 20260818.xlsx) พร้อมอัปเดตฐานข้อมูลให้อัตโนมัติ
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
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
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
                className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center hover:border-purple-500 bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
              >
                <Upload className="mx-auto h-12 w-12 text-purple-500" />
                <div className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {file ? (
                    <span className="text-purple-700 dark:text-purple-400 font-bold">เลือกไฟล์แล้ว: {file.name}</span>
                  ) : (
                    <span>ลากและวางไฟล์รายงาน Excel หรือคลิกเพื่อเลือกไฟล์</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">รองรับไฟล์ .xlsx หรือ .xls (ขนาดไม่เกิน 50MB)</p>
                <div className="mt-4">
                  <label className="cursor-pointer rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-block">
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

        {/* Tab 2: Database Stats & Snapshot Deletion */}
        {activeTab === "STATS" && (
          <div className="space-y-6">
            {/* Stat Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">จำนวนสาขาในระบบ</span>
                  <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(stats?.totalStores || 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">จำนวนสินค้า (Models)</span>
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(stats?.totalProducts || 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">แถวข้อมูล Non-Move รวม</span>
                  <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(stats?.totalFactRows || 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">คำขอชี้แจง/ยกเว้น</span>
                  <FileSpreadsheet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(stats?.totalRequests || 0)}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  รอตรวจสอบ: {stats?.requestsBreakdown?.pending || 0}
                </div>
              </div>
            </div>

            {/* Date Snapshots Table with Delete Action */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    ประวัติรายงานรายวันในฐานข้อมูล (Daily Snapshots Management)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    สามารถตรวจสอบจำนวนแถวข้อมูล หรือลบข้อมูลรายงานบางวันออกจากระบบได้
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold">วันที่รายงาน (Report Date)</th>
                      <th className="py-3.5 px-6 font-semibold text-right">จำนวนแถวข้อมูล (Rows)</th>
                      <th className="py-3.5 px-6 font-semibold text-center">สถานะข้อมูล</th>
                      <th className="py-3.5 px-6 font-semibold text-center">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats?.snapshots?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          ยังไม่มีข้อมูลรายงานในระบบ
                        </td>
                      </tr>
                    ) : (
                      stats?.snapshots?.map((snap: any) => (
                        <tr key={snap.date} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                            {snap.date}
                          </td>
                          <td className="py-3.5 px-6 text-right font-bold text-slate-800 dark:text-slate-200">
                            {formatNumber(snap.rowCount)} แถว
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              พร้อมใช้งาน
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <button
                              type="button"
                              onClick={() => setDeleteTargetDate(snap.date)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white transition-colors shadow-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              ลบข้อมูลวันที่นี้
                            </button>
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

        {/* Tab 3: Integrated Approvals Queue */}
        {activeTab === "APPROVALS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  รายการคำขอปลดล็อค / ขอยกเว้น (Approval Workflow)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ตรวจสอบคำขอยกเว้นการคิด Non-Move และรูปถ่ายหลักฐาน พร้อมอนุมัติหรือปฏิเสธคำขอ
                </p>
              </div>
            </div>

            <ApprovalQueueTable
              requests={requests}
              onDecision={handleDecision}
              isLoading={isLoadingRequests}
            />
          </div>
        )}

        {/* Tab 4: Export Requests with Photos */}
        {activeTab === "EXPORT" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ส่งออกข้อมูลคำขอทั้งหมดเป็นไฟล์ Excel (.xlsx)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ดาวน์โหลดรายงานคำขอพร้อมข้อมูลสาขา, สินค้า, เหตุผล, สถานะ, บันทึกผู้อนุมัติ และลิงก์รูปภาพหลักฐานครบถ้วน
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* All Requests Export */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">คำขอทั้งหมด (All Requests)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    รวมคำขอทุกสถานะ (รอตรวจสอบ, อนุมัติแล้ว, ไม่อนุมัติ, ชี้แจงแล้ว)
                  </p>
                </div>
                <a
                  href="/api/admin/export-requests?status=ALL"
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  ดาวน์โหลด Excel คำขอทั้งหมด
                </a>
              </div>

              {/* Approved Only Export */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">เฉพาะที่อนุมัติแล้ว (Approved)</h3>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                    รายการที่ได้รับอนุมัติการยกเว้นการคิด Non-Move Stock
                  </p>
                </div>
                <a
                  href="/api/admin/export-requests?status=APPROVED"
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  ดาวน์โหลด Excel เฉพาะที่อนุมัติ
                </a>
              </div>

              {/* Pending Only Export */}
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm">เฉพาะที่รอตรวจสอบ (Pending)</h3>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                    รายการคำขอที่ยังอยู่ระหว่างรอการพิจารณา
                  </p>
                </div>
                <a
                  href="/api/admin/export-requests?status=PENDING"
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  ดาวน์โหลด Excel ที่รอการตรวจสอบ
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Trend Analysis */}
        {activeTab === "TREND" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    แนวโน้มมูลค่าสต๊อกสินค้าไม่เคลื่อนไหวภาพรวมประเทศ (Nationwide Non-Move Trend)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    พัฒนาการมูลค่าสต๊อกและสัดส่วนวิกฤต (% High) ในแต่ละรอบวันที่นำเข้ารายงาน
                  </p>
                </div>
              </div>

              {trendData?.historicalSnapshots?.length > 0 ? (
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData.historicalSnapshots} margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="colorAdminTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} stroke="#334155" />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#334155" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val)), "มูลค่าสต๊อกรวม"]}
                        labelFormatter={(l) => `วันที่รายงาน: ${l}`}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "14px",
                          color: "#f8fafc",
                          fontSize: "12px",
                        }}
                      />
                      <Area type="monotone" dataKey="totalStockValue" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorAdminTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-slate-400">
                  กำลังประมวลผลข้อมูลแนวโน้มภาพรวม...
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Delete Snapshot Confirmation Modal */}
      {deleteTargetDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ยืนยันการลบข้อมูลรายงาน
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  วันที่รายงาน: {deleteTargetDate}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล Non-Move ทั้งหมดของวันที่ <strong>{deleteTargetDate}</strong> ออกจากระบบ? การกระทำนี้ไม่สามารถยกเลิกได้
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTargetDate(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังลบข้อมูล...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    ยืนยันการลบ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
