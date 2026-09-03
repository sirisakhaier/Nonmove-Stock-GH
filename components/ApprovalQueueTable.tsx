"use client";

import React, { useState, useMemo } from "react";
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
  ChevronLeft,
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
  Trash2,
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
import { formatCurrency, formatNumber } from "@/lib/validators";

export interface SkuRequestItem {
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
  onRefresh?: () => void;
  isLoading: boolean;
}

export function ApprovalQueueTable({ requests, onDecision, onRefresh, isLoading }: ApprovalQueueProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SkuRequestItem | null>(null);
  const [activeDecision, setActiveDecision] = useState<"APPROVED" | "REJECTED" | "REVISE" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");

  // Pagination (10 records per page per request)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Delete Request State
  const [requestToDelete, setRequestToDelete] = useState<SkuRequestItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const regions = Array.from(new Set(requests.map((r) => r.store?.region))).filter(Boolean);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
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
          r.reason?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, statusFilter, regionFilter, search]);

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredRequests, page, pageSize]);

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

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/requests/${requestToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ลบคำขอไม่สำเร็จ");
      }
      setRequestToDelete(null);
      if (selectedRequest?.id === requestToDelete.id) {
        setSelectedRequest(null);
      }
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบคำขอ");
    } finally {
      setIsDeleting(false);
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
              onClick={() => { setStatusFilter("PENDING"); setPage(1); }}
              className={`px-2.5 py-1 rounded-sm transition-all ${
                statusFilter === "PENDING"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              รอพิจารณา ({requests.filter((r) => r.status === "PENDING").length})
            </button>
            <button
              onClick={() => { setStatusFilter("ALL"); setPage(1); }}
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
              onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
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

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-7 text-xs gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>รีเฟรช</span>
            </Button>
          )}
        </div>

        {/* Live Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหารหัสสาขา, โมเดล, สินค้า..."
            className="h-8 w-full sm:w-60 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Main Table (Paginated 10 per page) */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 text-[10px] sm:text-[11px]">
                <TableHead className="w-24 py-2.5 px-3 whitespace-nowrap">วันที่ยื่น</TableHead>
                <TableHead className="py-2.5 px-3 whitespace-nowrap w-36">สาขา</TableHead>
                <TableHead className="py-2.5 px-3">สินค้า / โมเดล</TableHead>
                <TableHead className="py-2.5 px-3">เหตุผลที่ยื่น</TableHead>
                <TableHead className="text-center py-2.5 px-2 w-16 whitespace-nowrap">รูปถ่าย</TableHead>
                <TableHead className="text-center py-2.5 px-2 w-28 whitespace-nowrap">สถานะ</TableHead>
                <TableHead className="text-right py-2.5 px-3 w-32 whitespace-nowrap">การจัดการ</TableHead>
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
              ) : paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    ไม่มีรายการคำขอในสถานะนี้
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/50 transition-colors">
                    {/* Date */}
                    <TableCell className="font-mono text-muted-foreground text-[11px] py-2 px-3 whitespace-nowrap">
                      {new Date(r.requestedAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </TableCell>

                    {/* Branch */}
                    <TableCell className="py-2 px-3">
                      <div className="font-bold text-foreground text-xs">{r.branchCode}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                        {r.store?.storeNameCust}
                      </div>
                    </TableCell>

                    {/* Product / Model */}
                    <TableCell className="py-2 px-3">
                      <div className="font-bold text-foreground text-xs">
                        {r.product?.model || r.productCode}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                        {r.productCode} · {r.product?.productName}
                      </div>
                    </TableCell>

                    {/* Reason & Sub-Details */}
                    <TableCell className="py-2 px-3">
                      <div className="font-semibold text-foreground text-[11px] line-clamp-1">
                        {r.reason}
                      </div>
                      {r.comments && (
                        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {r.comments}
                        </div>
                      )}
                    </TableCell>

                    {/* Photos Count */}
                    <TableCell className="text-center py-2 px-2 whitespace-nowrap">
                      {r.photos && r.photos.length > 0 ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 cursor-pointer hover:bg-muted text-[10px] py-0 px-1.5 font-mono"
                          onClick={() => setSelectedPhoto(r.photos[0].url)}
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span>{r.photos.length}</span>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">-</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center py-2 px-2 whitespace-nowrap">
                      <RequestStatusBadge status={r.status} />
                    </TableCell>

                    {/* Actions: Review & Delete */}
                    <TableCell className="text-right py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(r)}
                          className="h-7 text-xs font-semibold gap-1 px-2.5"
                        >
                          <span>พิจารณา</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRequestToDelete(r)}
                          title="ลบคำขอนี้"
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 10 Record Per Page Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 border-t border-border text-xs text-muted-foreground bg-muted/20">
          <div className="text-[11px]">
            แสดง {filteredRequests.length > 0 ? (page - 1) * pageSize + 1 : 0}-
            {Math.min(page * pageSize, filteredRequests.length)} จากทั้งหมด{" "}
            {formatNumber(filteredRequests.length)} รายการ (10 รายการต่อหน้า)
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

      {/* Review & Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-xl border-border animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[92vh] flex flex-col">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  พิจารณาคำขอยกเว้นสินค้า
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  สาขา: {selectedRequest.branchCode} ({selectedRequest.store?.storeNameCust})
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

            <CardContent className="p-4 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Product Info */}
              <div className="bg-muted/50 p-3 rounded-md border border-border space-y-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">สินค้าที่ยื่นคำขอ</span>
                    <h4 className="text-sm font-bold text-foreground">{selectedRequest.product?.model || selectedRequest.productCode}</h4>
                    <p className="text-xs text-muted-foreground">{selectedRequest.product?.productName}</p>
                  </div>
                  <RequestStatusBadge status={selectedRequest.status} />
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
                    <div className="text-xs text-foreground mt-0.5 bg-background p-2.5 rounded-md border border-border whitespace-pre-line leading-relaxed">
                      {selectedRequest.comments}
                    </div>
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
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                    รูปถ่ายหลักฐาน ({selectedRequest.photos.length})
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedRequest.photos.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPhoto(p.url)}
                        className="relative h-16 w-16 rounded-md border border-border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <img src={p.url} alt="Evidence" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Decision Form */}
              <div className="pt-2 border-t border-border space-y-3">
                <span className="font-semibold text-foreground block">
                  ผลการพิจารณาคำขอ
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={activeDecision === "APPROVED" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveDecision("APPROVED")}
                    className={activeDecision === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    อนุมัติ
                  </Button>

                  <Button
                    type="button"
                    variant={activeDecision === "REVISE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveDecision("REVISE")}
                    className={activeDecision === "REVISE" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                  >
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    ขอข้อมูลเพิ่ม
                  </Button>

                  <Button
                    type="button"
                    variant={activeDecision === "REJECTED" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setActiveDecision("REJECTED")}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    ไม่อนุมัติ
                  </Button>
                </div>

                {activeDecision && (
                  <div className="space-y-2 pt-1 animate-in fade-in-50">
                    <label className="text-[11px] font-medium text-foreground block">
                      {activeDecision === "APPROVED"
                        ? "ข้อคิดเห็นเพิ่มเติม (ถ้ามี)"
                        : activeDecision === "REVISE"
                        ? "ระบุรายละเอียดที่ต้องการให้สาขาแก้ไขหรือส่งข้อมูลเพิ่ม *"
                        : "ระบุเหตุผลการไม่อนุมัติ *"}
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="กรอกข้อความสำหรับแจ้งสาขา..."
                      rows={2}
                      className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-hidden"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRequestToDelete(selectedRequest);
                        }}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs h-8 gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>ลบคำขอนี้</span>
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveDecision(null)}
                          className="h-8 text-xs"
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSubmitting || (activeDecision !== "APPROVED" && !comment.trim())}
                          onClick={() => handleAction(activeDecision)}
                          className="h-8 text-xs font-semibold px-4"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              กำลังบันทึก...
                            </>
                          ) : (
                            "ยืนยันผลการพิจารณา"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {requestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md shadow-xl border-border animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="h-5 w-5" />
                <CardTitle className="text-sm sm:text-base font-bold">
                  ยืนยันการลบรายการคำขอ
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRequestToDelete(null)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                คุณต้องการลบคำขอนี้ออกจากระบบหรือไม่?
              </p>
              
              <div className="bg-muted/40 p-2.5 rounded-md border border-border space-y-1">
                <div className="font-bold text-foreground">
                  รุ่น: {requestToDelete.product?.model || requestToDelete.productCode}
                </div>
                <div className="text-muted-foreground">
                  สาขา: {requestToDelete.branchCode} ({requestToDelete.store?.storeNameCust})
                </div>
                <div className="text-muted-foreground">
                  เหตุผล: {requestToDelete.reason}
                </div>
              </div>

              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                * การลบคำขอจะลบรูปถ่ายหลักฐานและบันทึกประวัติอย่างถาวร ไม่สามารถกู้คืนได้
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRequestToDelete(null)}
                  disabled={isDeleting}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteRequest}
                  disabled={isDeleting}
                  className="gap-1.5 font-semibold"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      กำลังลบ...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ยืนยันการลบ</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
