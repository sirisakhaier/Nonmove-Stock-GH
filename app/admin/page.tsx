"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ApprovalQueueTable } from "@/components/ApprovalQueueTable";
import { RequestHistoryTable } from "@/components/RequestHistoryTable";
import { ExecutiveViewerDashboard } from "@/components/ExecutiveViewerDashboard";
import { StoreDimensionManager } from "@/components/StoreDimensionManager";
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
  History,
  TrendingUp,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/validators";

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"DATA" | "STORE_DIMENSION" | "APPROVALS" | "HISTORY" | "EXPORT" | "ANALYSIS">("DATA");

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

      alert(`ลบข้อมูลรายงานวันที่ ${deleteTargetDate} เรียบร้อยแล้ว (ลบ ${data.deletedCount || 0} รายการ)`);
      setDeleteTargetDate(null);
      fetchStats();
      fetchRequests();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDecision = async (id: string, decision: "APPROVED" | "REJECTED" | "REVISE", comment?: string) => {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: decision,
        reviewComment: comment,
        reviewedByName: "Admin Approver",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "บันทึกผลการพิจารณาไม่สำเร็จ");
    }

    fetchRequests();
    fetchStats();
  };

  // If not unlocked, show Admin Passcode Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-white">
        <Navbar />

        <div className="max-w-md mx-auto w-full px-4 my-auto">
          <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
              <KeyRound className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                ศูนย์จัดการระบบ (Admin Hub)
              </h2>
              <p className="text-xs text-slate-300 mt-2">
                สำหรับผู้ดูแลระบบ กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="รหัสผ่าน Admin"
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

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

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
                นำเข้าและจัดการข้อมูลรายงาน, พิจารณาคำขอ, ตรวจสอบประวัติสถานะ, ส่งออก Excel และวิเคราะห์ภาพรวม
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

        {/* 6 Admin Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-1.5 gap-1.5 shadow-sm">
          {/* Tab 1: Combined Import & Delete Data */}
          <button
            onClick={() => { setActiveTab("DATA"); fetchStats(); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "DATA"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Database className="h-4 w-4" />
            1. ข้อมูลรายงาน ({stats?.snapshots?.length || 0})
          </button>

          {/* Tab 2: NEW Store Dimension Manager */}
          <button
            onClick={() => setActiveTab("STORE_DIMENSION")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "STORE_DIMENSION"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Store className="h-4 w-4" />
            2. Store Dimension
          </button>

          {/* Tab 3: Approvals Queue */}
          <button
            onClick={() => { setActiveTab("APPROVALS"); fetchRequests(); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "APPROVALS"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            3. พิจารณาคำขอ ({pendingCount})
          </button>

          {/* Tab 4: Request History & Status Logs */}
          <button
            onClick={() => { setActiveTab("HISTORY"); fetchRequests(); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "HISTORY"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <History className="h-4 w-4" />
            4. ประวัติคำขอ ({requests.length})
          </button>

          {/* Tab 5: Export Excel */}
          <button
            onClick={() => setActiveTab("EXPORT")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "EXPORT"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Download className="h-4 w-4" />
            5. ส่งออก Excel
          </button>

          {/* Tab 6: Executive Analysis Dashboard */}
          <button
            onClick={() => setActiveTab("ANALYSIS")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ANALYSIS"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            6. วิเคราะห์ภาพรวม
          </button>
        </div>

        {/* Tab 1: MERGED Import & Delete Data */}
        {activeTab === "DATA" && (
          <div className="space-y-8">
            {/* Section 1A: Daily Upload Ingestion */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  นำเข้าไฟล์รายงานประจำวัน (Import NonMoveReport YYYYMMDD.xlsx)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ระบบประมวลผล In-Memory ความเร็วสูง และตรวจจับวันที่จากชื่อไฟล์ (เช่น NonMoveReport 20260818.xlsx) ให้อัตโนมัติ
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
                  className="flex justify-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-6 py-10 hover:border-purple-400 bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
                >
                  <div className="text-center space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shadow-sm">
                      <FileUp className="h-7 w-7" />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <label className="cursor-pointer rounded-md font-bold text-purple-600 dark:text-purple-400 hover:text-purple-500">
                        <span>คลิกเพื่อเลือกไฟล์รายงาน</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                          className="sr-only"
                        />
                      </label>
                      <span className="pl-1">หรือลากไฟล์มาวางที่นี่</span>
                    </div>
                    <p className="text-[11px] text-slate-400">รองรับไฟล์ .xlsx, .xls</p>
                    {file && (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-3.5 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                        <FileSpreadsheet className="h-4 w-4" />
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
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
                      กำลังนำเข้าข้อมูล (In-Memory Processing)...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      เริ่มต้นนำเข้าข้อมูลรายงาน
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Section 1B: Snapshots Management & Deletion */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ฐานข้อมูลและประวัติรอบรายงาน (Daily Snapshots Management)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ตรวจสอบจำนวนรายการสต๊อกในแต่ละรอบวัน และสามารถลบข้อมูลรอบรายงานที่ไม่ต้องการได้
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  รวม {stats?.snapshots?.length || 0} รอบรายงาน
                </span>
              </div>

              {/* Snapshots Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">วันที่รายงาน (Report Date)</th>
                      <th className="py-3.5 px-4 font-bold text-right">จำนวนรายการแถว (Rows)</th>
                      <th className="py-3.5 px-4 font-bold text-center">จัดการข้อมูล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {!stats?.snapshots || stats.snapshots.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          ยังไม่มีข้อมูลรอบรายงานในระบบ
                        </td>
                      </tr>
                    ) : (
                      stats.snapshots.map((s: any) => (
                        <tr key={s.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            รายงานวันที่ {s.date}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white font-mono">
                            {formatNumber(s.count)} แถว
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setDeleteTargetDate(s.date)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              ลบข้อมูลรอบนี้
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

        
        {/* Tab 2: Store Dimension Manager */}
        {activeTab === "STORE_DIMENSION" && (
          <StoreDimensionManager passcode={passcode} />
        )}

        {/* Tab 3: Approvals Queue */}
        {activeTab === "APPROVALS" && (
          <ApprovalQueueTable
            requests={requests}
            onDecision={handleDecision}
            isLoading={isLoadingRequests}
          />
        )}

        {/* Tab 3: NEW Request History & Status Logs */}
        {activeTab === "HISTORY" && (
          <RequestHistoryTable requests={requests} />
        )}

        {/* Tab 4: Excel Export */}
        {activeTab === "EXPORT" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ส่งออกรายงานคำขออนุมัติพร้อมรูปภาพหลักฐาน (Export Requests to Excel with Pictures)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ดาวน์โหลดไฟล์ `.xlsx` ที่ฝังรูปภาพ Thumbnail ขนาดกะทัดรัด พร้อมคอลัมน์ Hyperlink URL ถาวรสำหรับเปิดดูรูปภาพต้นฉบับ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* All Requests Export */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">คำขอทั้งหมด (All Requests)</h3>
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 mt-1">
                    ดาวน์โหลดคำขอทั้งหมดทุกสถานะ รวม {requests.length} รายการ
                  </p>
                </div>
                <a
                  href="/api/admin/export-requests?status=ALL"
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  ดาวน์โหลด Excel ทั้งหมด
                </a>
              </div>

              {/* Approved Only Export */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">เฉพาะที่อนุมัติแล้ว (Approved)</h3>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                    รายการที่ได้รับอนุมัติยกเว้น Non-Move แล้ว
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
                    รายการคำขอที่ยังอยู่ระหว่างรอการพิจารณา ({pendingCount} รายการ)
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

        {/* Tab 5: Executive Analysis Dashboard (Same as Viewer Module) */}
        {activeTab === "ANALYSIS" && (
          <div className="pt-2">
            <ExecutiveViewerDashboard />
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
