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
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
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

export default function ViewerRawDataPage() {
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

  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [summary, setSummary] = useState({
    totalStockQty: 0,
    totalStockValue: 0,
    uniqueStores: 0,
    uniqueModels: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<"csv" | "xlsx" | null>(null);

  // 1. Fetch Regions & Categories on mount
  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => setRegions(data.regions || []));

    fetch("/api/stores")
      .then((res) => res.json())
      .then((data) => setStores(data.stores || []));
  }, []);

  // 2. Fetch Raw Data Preview
  const fetchRawData = useCallback(async () => {
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
        setAvailableDates(data.availableDates || []);
        if (!selectedDate && data.selectedDate) {
          setSelectedDate(data.selectedDate);
        }
        setTotalRows(data.totalRows || 0);
        setSummary(data.summary || { totalStockQty: 0, totalStockValue: 0, uniqueStores: 0, uniqueModels: 0 });
        setPreviewRows(data.previewRows || []);
      }
    } catch (err) {
      console.error("Error fetching raw data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedRegion, selectedBranch, selectedCategory, selectedSkuType, search]);

  useEffect(() => {
    fetchRawData();
  }, [fetchRawData]);

  // 3. Handle File Downloads
  const handleDownload = async (format: "csv" | "xlsx") => {
    setIsExporting(format);
    try {
      const url = new URL("/api/viewer/raw-data", window.location.origin);
      if (selectedDate) url.searchParams.set("date", selectedDate);
      if (selectedRegion !== "ALL") url.searchParams.set("region", selectedRegion);
      if (selectedBranch !== "ALL") url.searchParams.set("branchCode", selectedBranch);
      if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);
      if (selectedSkuType !== "ALL") url.searchParams.set("skuType", selectedSkuType);
      if (search.trim()) url.searchParams.set("search", search.trim());
      url.searchParams.set("format", format);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `NonMove_RAW_Data_${selectedDate || "All"}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export error:", err);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลดข้อมูล");
    } finally {
      setIsExporting(null);
    }
  };

  const filteredStoresList = selectedRegion === "ALL"
    ? stores
    : stores.filter((s) => s.region === selectedRegion);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 sm:p-5 rounded-lg shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                ดาวน์โหลดข้อมูลดิบ (RAW Data Export)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                ดาวน์โหลดข้อมูลสต๊อกไม่เคลื่อนไหวรายโมเดลรายสาขาพร้อม Dimension ครบถ้วน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("xlsx")}
              disabled={isExporting !== null || totalRows === 0}
              className="h-9 text-xs font-semibold gap-1.5"
            >
              {isExporting === "xlsx" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              )}
              <span>ดาวน์โหลด Excel (.xlsx)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("csv")}
              disabled={isExporting !== null || totalRows === 0}
              className="h-9 text-xs font-semibold gap-1.5"
            >
              {isExporting === "csv" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-blue-600" />
              )}
              <span>ดาวน์โหลด CSV</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Card */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                ตัวกรองข้อมูล (Filter Criteria)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchRawData}
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" />
                <span>รีเฟรช</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* 1. Date Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  รอบวันที่รายงาน (Report Date)
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-hidden"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Region Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  ภูมิภาค (Region)
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedBranch("ALL");
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-hidden"
                >
                  <option value="ALL">ทุกภูมิภาค (Nationwide)</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      ภาค {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  สาขา (Store)
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-hidden"
                >
                  <option value="ALL">ทุกสาขา ({filteredStoresList.length})</option>
                  {filteredStoresList.map((s) => (
                    <option key={s.branchCode} value={s.branchCode}>
                      {s.branchCode} - {s.storeNameCust || s.storeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. SKU_TYPE */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  ประเภทสินค้า (SKU_TYPE)
                </label>
                <select
                  value={selectedSkuType}
                  onChange={(e) => setSelectedSkuType(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-hidden"
                >
                  <option value="ALL">ทุกประเภท (All SKU_TYPE)</option>
                  <option value="SELLABLE">SELLABLE (สินค้าขาย)</option>
                  <option value="DEMO">DEMO (ตัวโชว์)</option>
                  <option value="MOCK_UP">MOCK_UP</option>
                </select>
              </div>

              {/* 5. Live Search */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  ค้นหาคำค้น
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="รหัสสาขา, โมเดล..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dataset Summary Counter */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-border shadow-xs p-3.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">จำนวนแถวทั้งหมด (Total Rows)</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {formatNumber(totalRows)} <span className="text-xs font-normal text-muted-foreground">รายการ</span>
            </div>
          </Card>

          <Card className="border-border shadow-xs p-3.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">มูลค่าสต๊อกรวม (Total Value)</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {formatCurrency(summary.totalStockValue)}
            </div>
          </Card>

          <Card className="border-border shadow-xs p-3.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">จำนวนชิ้นรวม (Total QTY)</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {formatNumber(summary.totalStockQty)} <span className="text-xs font-normal text-muted-foreground">ชิ้น</span>
            </div>
          </Card>

          <Card className="border-border shadow-xs p-3.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">สาขา / โมเดล ที่เกี่ยวข้อง</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {summary.uniqueStores} <span className="text-xs font-normal text-muted-foreground">สาขา</span> · {summary.uniqueModels} <span className="text-xs font-normal text-muted-foreground">โมเดล</span>
            </div>
          </Card>
        </div>

        {/* Preview Data Table */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">
                ตัวอย่างข้อมูลดิบ (Preview Top 100 Rows)
              </CardTitle>
              <CardDescription className="text-xs">
                แสดง 100 แถวแรกจากผลลัพธ์การกรองทั้งหมด
              </CardDescription>
            </div>

            <Badge variant="secondary" className="font-mono text-xs">
              {previewRows.length} / {totalRows} Rows
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>STORE_ID</TableHead>
                  <TableHead>รหัสสาขา</TableHead>
                  <TableHead>ชื่อสาขา (Customer Store Name)</TableHead>
                  <TableHead>จังหวัด</TableHead>
                  <TableHead className="text-center">ภาค</TableHead>
                  <TableHead className="text-center">ประเภทสาขา</TableHead>
                  <TableHead>รหัสสินค้า</TableHead>
                  <TableHead>รุ่นสินค้า (Model)</TableHead>
                  <TableHead className="text-center">ประเภท (SKU_TYPE)</TableHead>
                  <TableHead>หมวดหมู่ (Category)</TableHead>
                  <TableHead className="text-center">ช่วงวัน (Bucket)</TableHead>
                  <TableHead className="text-right">จำนวนชิ้น</TableHead>
                  <TableHead className="text-right">มูลค่ารวม (บาท)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                      กำลังโหลดตัวอย่างข้อมูลดิบ...
                    </TableCell>
                  </TableRow>
                ) : previewRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="py-12 text-center text-muted-foreground">
                      ไม่พบข้อมูลที่ตรงกับตัวกรองที่เลือก
                    </TableCell>
                  </TableRow>
                ) : (
                  previewRows.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground font-mono text-[11px]">{r.index}</TableCell>
                      <TableCell className="font-mono text-[11px]">{r.storeId}</TableCell>
                      <TableCell className="font-mono font-medium text-foreground text-[11px]">{r.branchCode}</TableCell>
                      <TableCell className="font-medium text-foreground max-w-[200px] truncate">
                        {r.storeName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.province}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {r.region}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">
                          {r.storeType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{r.productCode}</TableCell>
                      <TableCell className="font-medium text-foreground max-w-[160px] truncate">
                        {r.model}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {r.skuType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.category}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">
                          {r.nonmoveDaysBucket} วัน
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(r.stockQty)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {formatCurrency(r.stockValue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        Non-Move Stock Analysis System &copy; 2026
      </footer>
    </div>
  );
}
