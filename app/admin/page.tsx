"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ApprovalQueueTable } from "@/components/ApprovalQueueTable";
import { RequestHistoryTable } from "@/components/RequestHistoryTable";
import { StoreDimensionManager } from "@/components/StoreDimensionManager";
import { ModelDimensionManager } from "@/components/ModelDimensionManager";
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
  X,
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
import { formatNumber, formatCurrency } from "@/lib/validators";

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"DATA" | "STORE_DIMENSION" | "MODEL_DIMENSION" | "APPROVALS" | "HISTORY" | "EXPORT">("DATA");

  // Ingestion State
  const [file, setFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Admin Stats & Requests
  const [stats, setStats] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [deleteTargetDate, setDeleteTargetDate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check saved session passcode
  useEffect(() => {
    const saved = localStorage.getItem("approver_passcode");
    if (saved === "admin1234" || saved === "admin123") {
      setPasscode(saved);
      setIsAuthenticated(true);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
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
    } catch (e) {
      console.error("Error fetching requests:", e);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchRequests();
    }
  }, [isAuthenticated, fetchStats, fetchRequests]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "admin1234" || passcode === "admin123") {
      setIsAuthenticated(true);
      setErrorMsg("");
      localStorage.setItem("approver_passcode", passcode);
    } else {
      setErrorMsg("รหัสผ่านไม่ถูกต้อง");
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) {
        setFile(droppedFile);
      } else {
        alert("กรุณาเลือกไฟล์ Excel (.xlsx, .xls) เท่านั้น");
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("กรุณาเลือกไฟล์รายงาน");
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("passcode", passcode || "admin1234");
      if (reportDate) {
        formData.append("reportDate", reportDate);
      }

      const res = await fetch("/api/admin/etl", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "นำเข้าข้อมูลไม่สำเร็จ");
      }

      setUploadStatus({
        success: true,
        message: `นำเข้าข้อมูลรายงานสำเร็จ: บันทึก ${data.insertedRows || 0} รายการ (รอบวันที่: ${data.reportDate})`,
        details: data,
      });
      setFile(null);
      setReportDate("");
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

  const handleConfirmDelete = async () => {
    if (!deleteTargetDate) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/snapshots?date=${deleteTargetDate}&passcode=${encodeURIComponent(passcode || "admin1234")}`, {
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
      <div className="min-h-screen bg-background flex flex-col justify-between text-foreground transition-colors">
        <Navbar />

        <div className="max-w-sm mx-auto w-full px-4 my-auto">
          <Card className="border-border shadow-xs p-6 text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <KeyRound className="h-6 w-6" />
            </div>

            <div>
              <CardTitle className="text-lg font-bold">
                ศูนย์จัดการระบบ (Admin Hub)
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                สำหรับผู้ดูแลระบบ กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
              </CardDescription>
            </div>

            {errorMsg && (
              <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-3.5">
              <Input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="กรอกรหัสผ่าน Admin..."
                className="text-center"
                autoFocus
              />

              <Button type="submit" className="w-full font-semibold">
                เข้าสู่ระบบผู้ดูแลระบบ
              </Button>
            </form>
          </Card>
        </div>

        <div className="text-center text-xs text-muted-foreground py-6">
          Non-Move Stock Management &copy; 2026
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 sm:p-5 rounded-lg shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Admin Management Hub
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                นำเข้าและจัดการข้อมูลรายงาน, จัดการ Master Dimension, พิจารณาคำขอ และส่งออกข้อมูล Excel
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats();
              fetchRequests();
            }}
            className="h-8 text-xs font-semibold gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>รีเฟรชข้อมูล</span>
          </Button>
        </div>

        {/* 6 Admin Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-border bg-muted/40 rounded-lg p-1 gap-1 text-xs">
          {/* Tab 1: Combined Import & Delete Data */}
          <button
            onClick={() => { setActiveTab("DATA"); fetchStats(); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
              activeTab === "DATA"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>1. รายงาน ({stats?.snapshots?.length || 0})</span>
          </button>

          {/* Tab 2: Store Dimension Manager */}
          <button
            onClick={() => setActiveTab("STORE_DIMENSION")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
              activeTab === "STORE_DIMENSION"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>2. Store Master</span>
          </button>

          {/* Tab 3: Model Dimension Manager */}
          <button
            onClick={() => setActiveTab("MODEL_DIMENSION")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
              activeTab === "MODEL_DIMENSION"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>3. Model Master</span>
          </button>

          {/* Tab 4: Approvals Queue */}
          <button
            onClick={() => { setActiveTab("APPROVALS"); fetchRequests(); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
              activeTab === "APPROVALS"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>4. พิจารณา ({pendingCount})</span>
          </button>

          {/* Tab 5: Request History & Status Logs */}
          <button
            onClick={() => { setActiveTab("HISTORY"); fetchRequests(); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
              activeTab === "HISTORY"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>5. ประวัติ ({requests.length})</span>
          </button>

          {/* Tab 6: Export Excel */}
          <button
            onClick={() => setActiveTab("EXPORT")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
              activeTab === "EXPORT"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>6. ส่งออก Excel</span>
          </button>
        </div>

        {/* Tab 1: MERGED Import & Delete Data */}
        {activeTab === "DATA" && (
          <div className="space-y-6">
            {/* Daily Upload Ingestion */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold">
                  นำเข้าไฟล์รายงาน Non-Move รายวัน (Upload Daily Snapshot)
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  อัปโหลดไฟล์ Excel เพื่อนำเข้าข้อมูลสต๊อกไม่เคลื่อนไหวประจำวันเข้าสู่ฐานข้อมูล
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5">
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className={`border border-dashed rounded-lg p-6 text-center transition-colors ${
                      file
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-slate-400 dark:hover:border-slate-600 bg-muted/30"
                    }`}
                  >
                    <input
                      type="file"
                      id="fileInput"
                      accept=".xlsx, .xls"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="fileInput"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="p-2.5 rounded-md bg-secondary text-foreground">
                        <FileUp className="h-6 w-6" />
                      </div>
                      <div className="text-xs">
                        {file ? (
                          <span className="font-semibold text-foreground">
                            เลือกไฟล์: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        ) : (
                          <>
                            <span className="font-medium text-foreground">คลิกเพื่อเลือกไฟล์ Excel</span>
                            <span className="text-muted-foreground"> หรือลากไฟล์มาวางที่นี่</span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        รองรับไฟล์ .xlsx, .xls (ระบบจะระบุวันที่จากชื่อไฟล์หรือตัวเลือกวันที่ด้านล่าง)
                      </span>
                    </label>
                  </div>

                  {/* Manual Date Override (Optional) */}
                  <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-md border border-border text-xs">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <label className="font-medium text-foreground shrink-0">
                      ระบุวันที่รายงาน (Optional):
                    </label>
                    <Input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="h-8 max-w-xs text-xs"
                    />
                  </div>

                  {uploadStatus && (
                    <div
                      className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                        uploadStatus.success
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                      }`}
                    >
                      {uploadStatus.success ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span>{uploadStatus.message}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {file && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setFile(null); setReportDate(""); }}
                        disabled={isUploading}
                        className="h-8 text-xs"
                      >
                        ล้างไฟล์
                      </Button>
                    )}

                    <Button
                      type="submit"
                      size="sm"
                      disabled={!file || isUploading}
                      className="h-8 text-xs font-semibold"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          กำลังนำเข้าข้อมูล...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          เริ่มนำเข้าข้อมูล
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Existing Snapshots & Delete Management */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold">
                  ประวัติรอบวันที่รายงานในระบบ (Active Daily Snapshots)
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  แสดงข้อมูลรอบวันที่ทั้งหมดที่มีในฐานข้อมูล พร้อมตัวเลือกลบข้อมูลที่ไม่ต้องการ
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รอบวันที่รายงาน</TableHead>
                      <TableHead className="text-right">จำนวนรายการ (แถว)</TableHead>
                      <TableHead className="text-right">จำนวนชิ้นรวม</TableHead>
                      <TableHead className="text-right">มูลค่าสต๊อกรวม (บาท)</TableHead>
                      <TableHead className="text-right">การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!stats?.snapshots || stats.snapshots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          ยังไม่มีข้อมูลรอบวันที่รายงานในระบบ
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.snapshots.map((s: any) => (
                        <TableRow key={s.date}>
                          <TableCell className="font-mono font-medium text-foreground text-xs">
                            {s.date}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatNumber(s.count)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-xs">
                            {formatNumber(s.totalQty || 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-foreground text-xs">
                            {formatCurrency(s.totalValue || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTargetDate(s.date)}
                              className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-950/40 font-medium"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              ลบข้อมูล
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Store Dimension Manager */}
        {activeTab === "STORE_DIMENSION" && (
          <StoreDimensionManager passcode={passcode} />
        )}

        {/* Tab 3: Model Dimension Manager */}
        {activeTab === "MODEL_DIMENSION" && (
          <ModelDimensionManager passcode={passcode} />
        )}

        {/* Tab 4: Approvals Queue */}
        {activeTab === "APPROVALS" && (
          <ApprovalQueueTable
            requests={requests}
            onDecision={handleDecision}
            isLoading={isLoadingRequests}
          />
        )}

        {/* Tab 5: Request History */}
        {activeTab === "HISTORY" && (
          <RequestHistoryTable requests={requests} />
        )}

        {/* Tab 6: Export Data */}
        {activeTab === "EXPORT" && (
          <Card className="border-border shadow-xs p-6 space-y-4 max-w-lg">
            <div>
              <CardTitle className="text-base font-semibold">
                ส่งออกข้อมูลคำขอ (Export Requests Excel)
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                ดาวน์โหลดข้อมูลคำขอทั้งหมดหรือเฉพาะที่รอการตรวจสอบในรูปแบบไฟล์ Excel (.xlsx)
              </CardDescription>
            </div>

            <div className="space-y-2 pt-2">
              <Button asChild className="w-full font-medium">
                <a href="/api/admin/export-requests?status=ALL" download>
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลดคำขอทั้งหมด (Excel)
                </a>
              </Button>

              <Button asChild variant="outline" className="w-full font-medium">
                <a href="/api/admin/export-requests?status=PENDING" download>
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลดเฉพาะรายการที่รอพิจารณา (Pending)
                </a>
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Delete Snapshot Confirmation Modal */}
      {deleteTargetDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md shadow-xl border-border animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-600" />
                <CardTitle className="text-base font-bold">
                  ยืนยันการลบข้อมูลรายงาน
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTargetDate(null)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล Non-Move ทั้งหมดของวันที่ <strong className="text-foreground font-mono">{deleteTargetDate}</strong> ออกจากระบบ? การกระทำนี้ไม่สามารถยกเลิกได้
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTargetDate(null)}
                  disabled={isDeleting}
                >
                  ยกเลิก
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="font-semibold"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      กำลังลบข้อมูล...
                    </>
                  ) : (
                    "ยืนยันการลบ"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
