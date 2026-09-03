"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  Calendar,
  User,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileSpreadsheet,
  Image as ImageIcon,
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
import { PhotoLightbox } from "./PhotoLightbox";
import { formatNumber } from "@/lib/validators";

interface SkuRequestItem {
  id: string;
  branchCode: string;
  productCode: string;
  requestType: "EXPLAIN" | "EXCLUDE";
  reason: string;
  comments?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISE" | "EXPLAINED";
  reviewComment?: string | null;
  reviewedByName?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  store?: {
    branchCode: string;
    storeNameCust?: string;
    storeName?: string;
    region?: string;
    province?: string | null;
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

function formatSafeDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("th-TH", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

export function RequestHistoryTable({ requests = [] }: { requests?: SkuRequestItem[] }) {
  const safeRequests = Array.isArray(requests) ? requests : [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const regions = useMemo(() => {
    return Array.from(new Set(safeRequests.map((r) => r?.store?.region))).filter(Boolean) as string[];
  }, [safeRequests]);

  const filteredRequests = useMemo(() => {
    return safeRequests.filter((r) => {
      if (!r) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (regionFilter !== "ALL" && r.store?.region !== regionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const pCode = (r.productCode || "").toLowerCase();
        const pName = (r.product?.productName || "").toLowerCase();
        const mName = (r.product?.model || "").toLowerCase();
        const bCode = (r.branchCode || "").toLowerCase();
        const sName = (r.store?.storeNameCust || r.store?.storeName || "").toLowerCase();
        const uName = (r.requestedBy?.name || "").toLowerCase();
        const rName = (r.reviewedByName || "").toLowerCase();
        return (
          pCode.includes(q) ||
          pName.includes(q) ||
          mName.includes(q) ||
          bCode.includes(q) ||
          sName.includes(q) ||
          uName.includes(q) ||
          rName.includes(q)
        );
      }
      return true;
    });
  }, [safeRequests, statusFilter, regionFilter, search]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-lg shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-medium">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-sm transition-all ${
                statusFilter === "ALL"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ทั้งหมด ({safeRequests.length})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-2.5 py-1 rounded-sm transition-all ${
                statusFilter === "APPROVED"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              อนุมัติ ({safeRequests.filter((r) => r?.status === "APPROVED").length})
            </button>
            <button
              onClick={() => setStatusFilter("REJECTED")}
              className={`px-2.5 py-1 rounded-sm transition-all ${
                statusFilter === "REJECTED"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ไม่อนุมัติ ({safeRequests.filter((r) => r?.status === "REJECTED").length})
            </button>
            <button
              onClick={() => setStatusFilter("REVISE")}
              className={`px-2.5 py-1 rounded-sm transition-all ${
                statusFilter === "REVISE"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ขอข้อมูลเพิ่ม ({safeRequests.filter((r) => r?.status === "REVISE").length})
            </button>
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-transparent font-medium text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">ทุกภูมิภาค</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  ภาค {reg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาสาขา, โมเดล, ผู้ยื่น..."
            className="h-8 w-full sm:w-60 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">วันที่ยื่น</TableHead>
              <TableHead>สาขา</TableHead>
              <TableHead>สินค้า / โมเดล</TableHead>
              <TableHead>ประเภท / เหตุผล</TableHead>
              <TableHead>ผู้ยื่นคำขอ</TableHead>
              <TableHead className="text-center">รูปถ่าย</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
              <TableHead>ผลการพิจารณา / ความเห็น</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  ไม่พบประวัติคำขอที่ตรงกับเงื่อนไข
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-muted-foreground text-[11px]">
                    {formatSafeDate(r.requestedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground text-xs">{r.store?.storeNameCust || r.store?.storeName || r.branchCode}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{r.branchCode} {r.store?.region ? `· ภาค ${r.store.region}` : ""}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-foreground text-xs">{r.product?.model || r.productCode}</div>
                    <div className="text-[11px] text-muted-foreground max-w-[180px] truncate">{r.product?.productName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.requestType === "EXCLUDE" ? "destructive" : "secondary"} className="text-[10px] mb-0.5">
                      {r.requestType === "EXCLUDE" ? "ขอยกเว้น" : "ชี้แจงสต๊อก"}
                    </Badge>
                    <div className="text-xs text-foreground font-medium">{r.reason}</div>
                    {r.comments && (
                      <div className="text-[11px] text-muted-foreground max-w-[200px] truncate mt-0.5">
                        {r.comments}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-foreground font-medium">{r.requestedBy?.name || "-"}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{r.requestedBy?.phone || "-"}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {r.photos && r.photos.length > 0 ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-muted text-[10px] py-0 px-1.5 font-mono"
                        onClick={() => setSelectedPhoto(r.photos![0].url)}
                      >
                        <ImageIcon className="h-3 w-3" />
                        <span>{r.photos.length}</span>
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <RequestStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    {r.reviewComment ? (
                      <div className="space-y-0.5">
                        <p className="text-xs text-foreground leading-snug">{r.reviewComment}</p>
                        <div className="text-[10px] text-muted-foreground">
                          โดย: {r.reviewedByName || "Admin"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Lightbox for Photos */}
      {selectedPhoto && (
        <PhotoLightbox
          photoUrl={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
