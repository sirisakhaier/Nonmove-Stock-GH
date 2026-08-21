"use client";

import React, { useState } from "react";
import {
  Check,
  X,
  MessageSquare,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Search,
  RefreshCw,
  Eye,
  Store,
  Calendar,
  Layers,
  Phone,
  User,
  ExternalLink,
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
import { PhotoLightbox } from "./PhotoLightbox";
import { formatCurrency } from "@/lib/validators";

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

interface ApprovalQueueProps {
  requests: SkuRequestItem[];
  onDecision: (id: string, decision: "APPROVED" | "REJECTED" | "REVISE", comment?: string) => Promise<void>;
  isLoading: boolean;
}

export function ApprovalQueueTable({ requests, onDecision, isLoading }: ApprovalQueueProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SkuRequestItem | null>(null);
  const [activeDecision, setActiveDecision] = useState<"APPROVED" | "REJECTED" | "REVISE" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");

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
        r.store?.storeNameCust?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenDetail = (r: SkuRequestItem) => {
    setSelectedRequest(r);
    setActiveDecision(null);
    setComment(r.reviewComment || "");
  };

  const handleAction = async (decision: "APPROVED" | "REJECTED" | "REVISE") => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await onDecision(selectedRequest.id, decision, comment);
      setSelectedRequest(null);
      setActiveDecision(null);
      setComment("");
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการดำเนินการ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-lg shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-medium">
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-2.5 py-1 rounded-sm transition-all ${
                statusFilter === "PENDING"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              รอพิจารณา ({requests.filter((r) => r.status === "PENDING").length})
            </button>
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
            placeholder="ค้นหารหัสสาขา, โมเดล, สินค้า..."
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
              <TableHead className="text-center">รูปถ่าย</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
              <TableHead className="text-right">การจัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                  กำลังโหลดรายการคำขอ...
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  ไม่มีรายการคำขอในสถานะนี้
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
                    <div className="text-[11px] text-muted-foreground max-w-[200px] truncate">{r.product?.productName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.requestType === "EXCLUDE" ? "destructive" : "secondary"} className="text-[10px] mb-0.5">
                      {r.requestType === "EXCLUDE" ? "ขอยกเว้น" : "ชี้แจงสต๊อก"}
                    </Badge>
                    <div className="text-xs text-foreground font-medium">{r.reason}</div>
                    {r.comments && (
                      <div className="text-[11px] text-muted-foreground max-w-[220px] truncate mt-0.5">
                        {r.comments}
                      </div>
                    )}
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
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(r)}
                      className="h-7 text-xs font-medium"
                    >
                      พิจารณา
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Review Modal Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg shadow-xl border-border animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base font-bold">
                  พิจารณาคำขอ {selectedRequest.requestType === "EXCLUDE" ? "(ขอยกเว้น)" : "(ชี้แจง)"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  สาขา: {selectedRequest.store?.storeNameCust} ({selectedRequest.branchCode})
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedRequest(null)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              {/* Product Info */}
              <div className="bg-muted/50 p-3 rounded-md border border-border space-y-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">สินค้าที่ยื่นคำขอ</span>
                    <h4 className="text-sm font-bold text-foreground">{selectedRequest.product?.model || selectedRequest.productCode}</h4>
                    <p className="text-xs text-muted-foreground">{selectedRequest.product?.productName}</p>
                  </div>
                  <Badge variant={selectedRequest.requestType === "EXCLUDE" ? "destructive" : "secondary"}>
                    {selectedRequest.requestType}
                  </Badge>
                </div>
                <div className="pt-1 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                  <span>หมวดหมู่: {selectedRequest.product?.category || "-"}</span>
                  <span>รหัสสินค้า: {selectedRequest.productCode}</span>
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">เหตุผลที่ระบุ</span>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.comments && (
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">รายละเอียดเพิ่มเติม</span>
                    <p className="text-xs text-foreground mt-0.5 bg-background p-2 rounded-md border border-border">
                      {selectedRequest.comments}
                    </p>
                  </div>
                )}

                {/* Submitter Info */}
                {selectedRequest.requestedBy && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedRequest.requestedBy.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedRequest.requestedBy.phone}
                    </span>
                  </div>
                )}
              </div>

              {/* Photos Gallery */}
              {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1.5">
                    รูปถ่ายหลักฐาน ({selectedRequest.photos.length} รูป)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRequest.photos.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        onClick={() => setSelectedPhoto(p.url)}
                        className="aspect-square rounded-md border border-border overflow-hidden cursor-pointer hover:opacity-90 relative group"
                      >
                        <img src={p.url} alt="Evidence" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Comment Input */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-foreground">
                  ความเห็น / ข้อความแจ้งสาขา (Admin Comment)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="ระบุเหตุผลหรือคำแนะนำเพิ่มเติม (ถ้ามี)..."
                  rows={2}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => handleAction("APPROVED")}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  อนุมัติ
                </Button>

                <Button
                  type="button"
                  onClick={() => handleAction("REVISE")}
                  disabled={isSubmitting}
                  variant="outline"
                  className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-900/60 dark:hover:bg-amber-950/40 text-xs font-semibold h-9"
                >
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  ขอข้อมูลเพิ่ม
                </Button>

                <Button
                  type="button"
                  onClick={() => handleAction("REJECTED")}
                  disabled={isSubmitting}
                  variant="destructive"
                  className="text-xs font-semibold h-9"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  ไม่อนุมัติ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
