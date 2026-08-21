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
  Boxes,
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

export function ModelDimensionManager({ passcode }: { passcode: string }) {
  const [models, setModels] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSkuType, setSelectedSkuType] = useState("ALL");

  // Join Check State
  const [joinCheck, setJoinCheck] = useState<any>(null);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);
  const [showUnmatchedDetails, setShowUnmatchedDetails] = useState(false);

  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string; missingCategories?: string[] } | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch("/api/admin/models");
      if (res.ok) {
        const data = await res.json();
        const list = data.models || data.products || [];
        setModels(list);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error fetching models:", err);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  const fetchJoinCheck = useCallback(async () => {
    setIsLoadingJoin(true);
    try {
      const res = await fetch("/api/admin/models/join-check");
      if (res.ok) {
        const data = await res.json();
        setJoinCheck(data);
      }
    } catch (err) {
      console.error("Error checking model join:", err);
    } finally {
      setIsLoadingJoin(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    fetchJoinCheck();
  }, [fetchModels, fetchJoinCheck]);

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
      alert("กรุณาเลือกไฟล์ Model Master");
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("passcode", passcode || "admin1234");

      const res = await fetch("/api/admin/models/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "อัปโหลดไฟล์ไม่สำเร็จ");
      }

      setUploadStatus({
        success: true,
        message: `นำเข้า Model Master Dimension สำเร็จ: บันทึก/อัปเดต ${data.recordsCount || 0} โมเดล`,
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

  const filteredModels = models.filter((m) => {
    if (selectedCategory !== "ALL" && m.category !== selectedCategory) return false;
    if (selectedSkuType !== "ALL" && (m.skuType || "SELLABLE") !== selectedSkuType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.productCode.toLowerCase().includes(q) ||
        (m.model && m.model.toLowerCase().includes(q)) ||
        (m.productName && m.productName.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.subCategory && m.subCategory.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Join Validation Error Alert Banner */}
      {joinCheck && (
        <Card className={`shadow-xs border ${
          joinCheck.unmatchedSkusCount > 0
            ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20"
            : "border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20"
        }`}>
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {joinCheck.unmatchedSkusCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {joinCheck.unmatchedSkusCount > 0
                      ? `ตรวจพบ ${joinCheck.unmatchedSkusCount} SKU ในรายงานสต๊อกที่ไม่พบใน Model Master (Join Error)`
                      : "การเชื่อมโยง Model Master สมบูรณ์ 100% (ทุกสินค้าในรายงานตรงกับ Master)"}
                  </span>
                  <Badge variant={joinCheck.unmatchedSkusCount > 0 ? "destructive" : "success"} className="text-[10px]">
                    Join Rate: {joinCheck.matchRatePct}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  SKU ในรายงานสต๊อก: {joinCheck.totalStockSkus} SKU · โมเดลใน Master: {joinCheck.totalMasterModels} รายการ
                  {joinCheck.unmatchedSkusCount > 0 && ` (มูลค่าสต๊อกที่ไม่สามารถ Join ได้: ${formatCurrency(joinCheck.unmatchedValue)})`}
                </p>
              </div>
            </div>

            {joinCheck.unmatchedSkusCount > 0 && (
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

          {/* Expandable Unmatched Models Table */}
          {showUnmatchedDetails && joinCheck.unmatchedList && joinCheck.unmatchedList.length > 0 && (
            <div className="border-t border-rose-200 dark:border-rose-900/50 bg-background">
              <div className="p-3 bg-rose-100/50 dark:bg-rose-950/40 text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                รายชื่อรหัสสินค้า (SKU) ที่พบในไฟล์รายงาน Non-Move แต่ไม่มีใน Model Master:
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>รหัสสินค้า (ProductCode)</TableHead>
                    <TableHead>Category ในรายงาน</TableHead>
                    <TableHead className="text-right">จำนวนสาขา</TableHead>
                    <TableHead className="text-right">จำนวนชิ้น</TableHead>
                    <TableHead className="text-right">มูลค่ารวม (บาท)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {joinCheck.unmatchedList.map((item: any, idx: number) => (
                    <TableRow key={item.productCode} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-muted-foreground text-[11px]">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                        {item.productCode}
                      </TableCell>
                      <TableCell className="text-foreground font-medium text-xs">
                        {item.category || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{item.branchCount} สาขา</TableCell>
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

      {/* 1. Upload Model Dimension Section */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                นำเข้ามิติข้อมูลโมเดล (Upload Model Master Dimension)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                อัปโหลดไฟล์ Excel เพื่ออัปเดตโมเดลสินค้า (Product Code, Model, SKU_TYPE, Category, Sub Category, Size Group)
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-xs gap-1.5"
              >
                <a href="/api/admin/models/export" download>
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
                id="modelFileInput"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="modelFileInput"
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
                    นำเข้า Model Dimension
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Model Master Table List */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                รายชื่อโมเดลสินค้า (Model Master List)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                โมเดลสินค้าทั้งหมด {formatNumber(models.length)} รายการ
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent font-medium text-foreground focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">ทุก Category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU_TYPE Filter */}
              <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs">
                <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={selectedSkuType}
                  onChange={(e) => setSelectedSkuType(e.target.value)}
                  className="bg-transparent font-medium text-foreground focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">ทุก SKU_TYPE</option>
                  <option value="SELLABLE">SELLABLE (สินค้าขาย)</option>
                  <option value="DEMO">DEMO (ตัวโชว์)</option>
                  <option value="MOCK_UP">MOCK_UP</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหารหัส, โมเดล, ชื่อสินค้า..."
                  className="h-8 w-44 sm:w-56 pl-8 text-xs"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => { fetchModels(); fetchJoinCheck(); }}
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
                <TableHead>รหัสสินค้า (ProductCode)</TableHead>
                <TableHead>รุ่นสินค้า (Model)</TableHead>
                <TableHead>ชื่อสินค้า (ProductName)</TableHead>
                <TableHead className="text-center">ประเภท (SKU_TYPE)</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>กลุ่มสินค้า (SubCategory)</TableHead>
                <TableHead className="text-center">ขนาด (SizeGroup)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingModels ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                    กำลังโหลดข้อมูลโมเดล...
                  </TableCell>
                </TableRow>
              ) : filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    ไม่พบข้อมูลโมเดลสินค้าที่ค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((m: any, idx: number) => (
                  <TableRow key={m.productCode}>
                    <TableCell className="text-muted-foreground font-mono text-[11px]">{idx + 1}</TableCell>
                    <TableCell className="font-mono font-medium text-foreground text-[11px]">
                      {m.productCode}
                    </TableCell>
                    <TableCell className="font-medium text-foreground max-w-[160px] truncate">
                      {m.model || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {m.productName}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {m.skuType || "SELLABLE"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground font-medium">{m.category || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.subCategory || "-"}</TableCell>
                    <TableCell className="text-center text-muted-foreground font-mono text-[11px]">
                      {m.sizeGroup || "-"}
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
