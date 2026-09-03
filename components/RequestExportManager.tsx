"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
import { RequestStatusBadge } from "./RequestStatusBadge";
import { formatNumber } from "@/lib/validators";

interface SkuRequestItem {
  id: string;
  branchCode: string;
  productCode: string;
  requestType: "EXPLAIN" | "EXCLUDE";
  reason: string;
  comments?: string | null;
  status: string;
  reviewComment?: string | null;
  reviewedByName?: string | null;
  requestedAt: string;
  store?: {
    branchCode: string;
    storeNameCust?: string;
    storeName?: string;
    region?: string;
  };
  product?: {
    productCode: string;
    productName: string;
    model?: string | null;
    category?: string | null;
  };
  requestedBy?: {
    name?: string;
    phone?: string;
  };
  photos?: {
    id: string;
    url: string;
  }[];
}

interface RequestExportManagerProps {
  requests: SkuRequestItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function RequestExportManager({
  requests = [],
  isLoading = false,
  onRefresh,
}: RequestExportManagerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.productCode.toLowerCase().includes(q) ||
          r.branchCode.toLowerCase().includes(q) ||
          (r.product?.model && r.product.model.toLowerCase().includes(q)) ||
          (r.product?.productName && r.product.productName.toLowerCase().includes(q)) ||
          (r.store?.storeNameCust && r.store.storeNameCust.toLowerCase().includes(q)) ||
          (r.reason && r.reason.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredRequests, page, pageSize]);

  // Handle Selection
  const isAllCurrentPageSelected =
    paginatedRequests.length > 0 &&
    paginatedRequests.every((r) => selectedIds.has(r.id));

  const toggleSelectAllCurrentPage = () => {
    const next = new Set(selectedIds);
    if (isAllCurrentPageSelected) {
      paginatedRequests.forEach((r) => next.delete(r.id));
    } else {
      paginatedRequests.forEach((r) => next.add(r.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredRequests.forEach((r) => next.add(r.id));
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleExportSelected = () => {
    if (selectedIds.size === 0) return;
    const idsList = Array.from(selectedIds).join(",");
    const url = `/api/admin/export-requests?ids=${encodeURIComponent(idsList)}`;
    window.open(url, "_blank");
  };

  const handleExportAllFiltered = () => {
    if (filteredRequests.length === 0) return;
    const idsList = filteredRequests.map((r) => r.id).join(",");
    const url = `/api/admin/export-requests?ids=${encodeURIComponent(idsList)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Summary Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              <span>ส่งออกข้อมูลคำขอ (Excel Request Export)</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              เลือกเฉพาะรายการที่ต้องการส่งออก เพื่อลดเวลาประมวลผลและดาวน์โหลดไฟล์ Excel ได้ทันที
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>รีเฟรช</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleExportSelected}
              disabled={selectedIds.size === 0}
              className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>ส่งออกเฉพาะที่เลือก ({selectedIds.size})</span>
            </Button>
          </div>
        </CardHeader>

        {/* 2. Filter Bar */}
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-medium overflow-x-auto no-scrollbar max-w-full">
              <button
                onClick={() => { setStatusFilter("ALL"); setPage(1); }}
                className={`px-2.5 py-1 rounded-sm transition-all whitespace-nowrap ${
                  statusFilter === "ALL"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ทั้งหมด ({requests.length})
              </button>
              <button
                onClick={() => { setStatusFilter("PENDING"); setPage(1); }}
                className={`px-2.5 py-1 rounded-sm transition-all whitespace-nowrap ${
                  statusFilter === "PENDING"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                รอพิจารณา ({requests.filter((r) => r.status === "PENDING").length})
              </button>
              <button
                onClick={() => { setStatusFilter("APPROVED"); setPage(1); }}
                className={`px-2.5 py-1 rounded-sm transition-all whitespace-nowrap ${
                  statusFilter === "APPROVED"
                    ? "bg-card text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                อนุมัติแล้ว ({requests.filter((r) => r.status === "APPROVED").length})
              </button>
              <button
                onClick={() => { setStatusFilter("REVISE"); setPage(1); }}
                className={`px-2.5 py-1 rounded-sm transition-all whitespace-nowrap ${
                  statusFilter === "REVISE"
                    ? "bg-card text-amber-700 dark:text-amber-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ขอข้อมูลเพิ่ม ({requests.filter((r) => r.status === "REVISE").length})
              </button>
              <button
                onClick={() => { setStatusFilter("REJECTED"); setPage(1); }}
                className={`px-2.5 py-1 rounded-sm transition-all whitespace-nowrap ${
                  statusFilter === "REJECTED"
                    ? "bg-card text-rose-700 dark:text-rose-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ไม่อนุมัติ ({requests.filter((r) => r.status === "REJECTED").length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="ค้นหารหัสสาขา, โมเดล, รหัสสินค้า..."
                className="h-8 pl-8 text-xs w-full"
              />
            </div>
          </div>

          {/* Quick Selection Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">
                เลือกอยู่ {formatNumber(selectedIds.size)} จาก {formatNumber(filteredRequests.length)} รายการ
              </span>

              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-primary hover:underline font-medium"
              >
                เลือกทั้งหมด ({filteredRequests.length})
              </button>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-rose-600 dark:text-rose-400 hover:underline font-medium"
                >
                  ล้างการเลือก
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportAllFiltered}
              className="text-muted-foreground hover:text-foreground hover:underline self-start sm:self-auto text-[11px]"
            >
              หรือส่งออกทั้งหมดในเงื่อนไขการค้นหานี้ ({filteredRequests.length} รายการ)
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Table of Selectable Requests */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 text-[10px] sm:text-[11px]">
                <TableHead className="w-10 py-2.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAllCurrentPage}
                    className="flex items-center justify-center cursor-pointer"
                    title={isAllCurrentPageSelected ? "ยกเลิกเลือกหน้านี้" : "เลือกทั้งหมดในหน้านี้"}
                  >
                    {isAllCurrentPageSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="py-2.5 px-2.5 font-bold w-24 whitespace-nowrap">วันที่ยื่น</TableHead>
                <TableHead className="py-2.5 px-2.5 font-bold w-36 whitespace-nowrap">สาขา</TableHead>
                <TableHead className="py-2.5 px-2.5 font-bold">ข้อมูลโมเดลและสินค้า</TableHead>
                <TableHead className="py-2.5 px-2.5 font-bold w-48">เหตุผลที่ยื่น</TableHead>
                <TableHead className="py-2.5 px-2 text-center w-16 whitespace-nowrap">รูปถ่าย</TableHead>
                <TableHead className="py-2.5 px-2 text-center w-28 whitespace-nowrap">สถานะ</TableHead>
                <TableHead className="py-2.5 px-2.5 font-bold w-28 whitespace-nowrap">ผู้ยื่นคำขอ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                    กำลังโหลดข้อมูลคำขอ...
                  </TableCell>
                </TableRow>
              ) : paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    ไม่พบรายการคำขอที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((r) => {
                  const isChecked = selectedIds.has(r.id);
                  return (
                    <TableRow
                      key={r.id}
                      onClick={() => toggleSelectRow(r.id)}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(r.id)}
                          className="flex items-center justify-center cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-2 px-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(r.requestedAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </TableCell>

                      {/* Store */}
                      <TableCell className="py-2 px-2.5">
                        <div className="font-bold text-foreground text-xs">{r.branchCode}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                          {r.store?.storeNameCust || r.store?.storeName || "-"}
                        </div>
                      </TableCell>

                      {/* Model & Product */}
                      <TableCell className="py-2 px-2.5">
                        <div className="font-bold text-foreground text-xs">
                          {r.product?.model || r.productCode}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {r.productCode} · {r.product?.productName}
                        </div>
                      </TableCell>

                      {/* Reason */}
                      <TableCell className="py-2 px-2.5">
                        <div className="font-medium text-foreground text-[11px] line-clamp-1">
                          {r.reason}
                        </div>
                        {r.comments && (
                          <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {r.comments}
                          </div>
                        )}
                      </TableCell>

                      {/* Photos Count */}
                      <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                        {r.photos && r.photos.length > 0 ? (
                          <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-1.5 font-mono">
                            <ImageIcon className="h-3 w-3" />
                            <span>{r.photos.length}</span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">-</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-2 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <RequestStatusBadge status={r.status} />
                      </TableCell>

                      {/* Submitter */}
                      <TableCell className="py-2 px-2.5 text-[11px]">
                        <div className="font-medium text-foreground truncate max-w-[100px]">
                          {r.requestedBy?.name || "-"}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {r.requestedBy?.phone || "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 border-t border-border text-xs text-muted-foreground bg-muted/20">
          <div className="text-[11px]">
            แสดง {filteredRequests.length > 0 ? (page - 1) * pageSize + 1 : 0}-
            {Math.min(page * pageSize, filteredRequests.length)} จากทั้งหมด{" "}
            {formatNumber(filteredRequests.length)} รายการ
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2 font-medium text-[11px]">
              หน้า {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-7 w-7"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
