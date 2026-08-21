"use client";

import React, { useState } from "react";
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
  store: {
    branchCode: string;
    storeNameCust: string;
    region: string;
    province?: string | null;
  };
  product: {
    productCode: string;
    productName: string;
    model?: string | null;
    category?: string | null;
  };
  requestedBy?: {
    name: string;
    phone: string;
  };
  photos: {
    id: string;
    url: string;
  }[];
}

export function RequestHistoryTable({ requests = [] }: { requests: SkuRequestItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const regions = Array.from(new Set(requests.map((r) => r.store?.region))).filter(Boolean);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (regionFilter !== "ALL" && r.store?.region !== regionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.productCode.toLowerCase().includes(q) ||
        r.product?.productName?.toLowerCase().includes(q) ||
        r.product?.model?.toLowerCase().includes(q) ||
        r.branchCode.toLowerCase().includes(q) ||
        r.store?.storeNameCust?.toLowerCase().includes(q) ||
        r.requestedBy?.name?.toLowerCase().includes(q) ||
        r.reviewedByName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
              ทั้งหมด ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-2.5 py-1 rounded-sm transition-all ${
                statusFilter === "APPROVED"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              อนุมัติ ({requests.filter((r) => r.status === "APPROVED").length})
            </button>
            <button
              onClick={() => setStatusFilter("REJECTED")}
              className={`px-2.5 py-1 rounded-sm transition-all ${
                statusFilter === "REJECTED"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ไม่อนุมัติ ({requests.filter((r) => r.status === "REJECTED").length})
            </button>
            <button
              onClick={() => setStatusFilter("REVISE")}
              className={`px-2.5 py-1 rounded-sm transition-all ${
                statusFilter === "REVISE"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ขอข้อมูลเพิ่ม ({requests.filter((r) => r.status === "REVISE").length})
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
                    {new Date(r.requestedAt).toLocaleDateString("th-TH", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground text-xs">{r.store?.storeNameCust || r.branchCode}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{r.branchCode} · ภาค {r.store?.region}</div>
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
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(r.photos[0].url)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-foreground text-[11px] font-medium hover:bg-muted border border-border"
                      >
                        <ImageIcon className="h-3 w-3 text-blue-600" />
                        <span>{r.photos.length} รูป</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <RequestStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    {r.reviewComment ? (
                      <div className="text-xs text-foreground font-medium">{r.reviewComment}</div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground">-</div>
                    )}
                    {r.reviewedByName && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        โดย: {r.reviewedByName}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <PhotoLightbox
          photoUrl={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
