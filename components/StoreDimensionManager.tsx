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
  ChevronDown,
  ChevronUp,
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

export function StoreDimensionManager({ passcode }: { passcode: string }) {
  const [stores, setStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");

  // Join Check State
  const [joinCheck, setJoinCheck] = useState<any>(null);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);
  const [showUnmatchedDetails, setShowUnmatchedDetails] = useState(false);

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

  const fetchJoinCheck = useCallback(async () => {
    setIsLoadingJoin(true);
    try {
      const res = await fetch("/api/admin/stores/join-check");
      if (res.ok) {
        const data = await res.json();
        setJoinCheck(data);
      }
    } catch (err) {
      console.error("Error checking store join:", err);
    } finally {
      setIsLoadingJoin(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    fetchJoinCheck();
  }, [fetchStores, fetchJoinCheck]);

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
      formData.append("passcode", passcode || "admin1234");

      const res = await fetch("/api/admin/stores/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "อัปโหลดไฟล์ไม่สำเร็จ");
      }

      setUploadStatus({
        success: true,
        message: `นำเข้า Store Dimension สำเร็จ: บันทึก/อัปเดต ${data.recordsCount || 0} สาขา`,
      });
      setFile(null);
      fetchStores();
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

  const regions = Array.from(new Set(stores.map((s) => s.region))).filter((r) => r && r !== "OTHER");

  const filteredStores = stores.filter((s) => {
    if (selectedRegion !== "ALL" && s.region !== selectedRegion) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.branchCode.toLowerCase().includes(q) ||
        (s.storeNameCust && s.storeNameCust.toLowerCase().includes(q)) ||
        (s.storeName && s.storeName.toLowerCase().includes(q)) ||
        (s.province && s.province.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Join Validation Error Alert Banner */}
      {joinCheck && (
        <Card className={`shadow-xs border ${
          joinCheck.unmatchedCount > 0
            ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20"
            : "border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20"
        }`}>
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {joinCheck.unmatchedCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {joinCheck.unmatchedCount > 0
                      ? `ตรวจพบ ${joinCheck.unmatchedCount} สาขาในรายงานสต๊อกที่ไม่พบใน Store Master (Join Error)`
                      : "การเชื่อมโยง Store Master สมบูรณ์ 100% (ทุกสาขาในรายงานตรงกับ Master)"}
                  </span>
                  <Badge variant={joinCheck.unmatchedCount > 0 ? "destructive" : "success"} className="text-[10px]">
                    Join Rate: {joinCheck.matchRatePct}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  สาขาในรายงานสต๊อก: {joinCheck.totalStockBranches} สาขา · สาขาใน Store Master: {joinCheck.totalMasterStores} สาขา
                  {joinCheck.unmatchedCount > 0 && ` (มูลค่าสต๊อกที่ไม่สามารถ Join ได้: ${formatCurrency(joinCheck.unmatchedValue)})`}
                </p>
              </div>
            </div>

            {joinCheck.unmatchedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnmatchedDetails(!showUnmatchedDetails)}
                className="h-8 text-xs gap-1 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100/50 self-start sm:self-auto shrink-0"
              >
                <span>{showUnmatchedDetails ? "ซ่อนรายละเอียด" : "ดูรายการที่ Join ไม่ได้"}</span>
                {showUnmatchedDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>

          {/* Expandable Unmatched Stores Table */}
          {showUnmatchedDetails && joinCheck.unmatchedList && joinCheck.unmatchedList.length > 0 && (
            <div className="border-t border-rose-200 dark:border-rose-900/50 bg-background">
              <div className="p-3 bg-rose-100/50 dark:bg-rose-950/40 text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                รายชื่อสาขาที่พบในไฟล์รายงาน Non-Move แต่ไม่มีรหัสใน Store Master:
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>รหัสสาขา (BranchCode)</TableHead>
                    <TableHead>ชื่อสาขาที่พบในรายงาน</TableHead>
                    <TableHead className="text-right">จำนวน SKU</TableHead>
                    <TableHead className="text-right">จำนวนชิ้น</TableHead>
                    <TableHead className="text-right">มูลค่ารวม (บาท)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {joinCheck.unmatchedList.map((item: any, idx: number) => (
                    <TableRow key={item.branchCode} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-muted-foreground text-[11px]">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                        {item.branchCode}
                      </TableCell>
                      <TableCell className="text-foreground font-medium text-xs">
                        {item.storeNameCust}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNumber(item.skuCount)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNumber(item.stockQty)}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                        {formatCurrency(item.stockValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* 1. Upload Store Dimension Section */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                นำเข้ามิติข้อมูลสาขา (Upload Store Master Dimension)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                อัปโหลดไฟล์ Excel หรือ CSV เพื่ออัปเดตข้อมูลสาขา (Store Code, Customer Name, Province, Region, Type)
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-xs gap-1.5"
              >
                <a href="/api/admin/stores/template" download>
                  <Download className="h-3.5 w-3.5" />
                  <span>ดาวน์โหลด Template</span>
                </a>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-xs gap-1.5"
              >
                <a href="/api/admin/stores/export" download>
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Export ปัจจุบัน</span>
                </a>
              </Button>
            </div>
          </div>
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
                id="storeFileInput"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="storeFileInput"
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
                      <span className="font-medium text-foreground">คลิกเพื่อเลือกไฟล์</span>
                      <span className="text-muted-foreground"> หรือลากไฟล์มาวางที่นี่</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  รองรับไฟล์ Excel (.xlsx, .xls) หรือ CSV (.csv)
                </span>
              </label>
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
                  onClick={() => setFile(null)}
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
                    นำเข้า Store Dimension
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Store Master Table List */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                รายชื่อสาขาในระบบ (Store Master List)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                สาขาทั้งหมด {formatNumber(stores.length)} สาขา
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Region Filter */}
              <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-transparent font-medium text-foreground focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">ทุกภูมิภาค</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      ภาค {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหารหัส, ชื่อสาขา, จังหวัด..."
                  className="h-8 w-44 sm:w-56 pl-8 text-xs"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => { fetchStores(); fetchJoinCheck(); }}
                title="รีเฟรช"
                className="h-8 w-8"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>STORE_ID</TableHead>
                <TableHead>รหัสสาขา (BranchCode)</TableHead>
                <TableHead>ชื่อสาขา (Customer Store Name)</TableHead>
                <TableHead>ชื่อสาขา (Internal)</TableHead>
                <TableHead>จังหวัด (Province)</TableHead>
                <TableHead className="text-center">ภูมิภาค (Region)</TableHead>
                <TableHead className="text-center">ประเภท (Type)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingStores ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                    กำลังโหลดข้อมูลสาขา...
                  </TableCell>
                </TableRow>
              ) : filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    ไม่พบข้อมูลสาขาที่ค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredStores.map((s: any, idx: number) => (
                  <TableRow key={s.branchCode}>
                    <TableCell className="text-muted-foreground font-mono text-[11px]">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-[11px]">{s.storeId || "-"}</TableCell>
                    <TableCell className="font-mono font-medium text-foreground text-[11px]">
                      {s.branchCode}
                    </TableCell>
                    <TableCell className="font-medium text-foreground max-w-[200px] truncate">
                      {s.storeNameCust}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate">
                      {s.storeName || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.province || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {s.region}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px]">
                        {s.storeType || "STORE"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
