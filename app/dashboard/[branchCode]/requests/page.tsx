"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { RequestStatusBadge } from "@/components/RequestStatusBadge";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { ActionPanel } from "@/components/ActionPanel";
import {
  FileSpreadsheet,
  ArrowLeft,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Edit3,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MyRequestsPage() {
  const params = useParams();
  const branchCode = params.branchCode as string;
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Re-submit Action Drawer
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchRequests = useCallback(() => {
    setIsLoading(true);
    fetch(`/api/requests?branchCode=${branchCode}`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [branchCode]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenEdit = (r: any) => {
    setSelectedProduct({
      productCode: r.productCode,
      productName: r.product?.productName || r.productCode,
      model: r.product?.model || "-",
      categoryName: r.product?.category || "-",
      subCategory: "-",
      nonmoveDaysBucket: "-",
      agingDaysBucket: "-",
      stockQty: 0,
      stockValue: 0,
      activeRequest: r,
    });
    setIsDrawerOpen(true);
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.productCode.toLowerCase().includes(q) ||
        r.product?.productName?.toLowerCase().includes(q) ||
        r.product?.model?.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 sm:p-5 rounded-lg shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-9 w-9 shrink-0"
            >
              <Link href={`/dashboard/${branchCode}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  รายการคำขอของสาขา
                </h1>
                <Badge variant="outline" className="text-xs font-mono">
                  {branchCode}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ติดตามประวัติและสถานะการขอยกเว้นสินค้าค้างนาน
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            className="h-8 text-xs font-semibold gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>รีเฟรช</span>
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-lg shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-medium overflow-x-auto max-w-full">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-sm transition-all ${
                statusFilter === "ALL"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ทั้งหมด ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1 rounded-sm transition-all ${
                statusFilter === "PENDING"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              รอพิจารณา ({requests.filter((r) => r.status === "PENDING").length})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-3 py-1 rounded-sm transition-all ${
                statusFilter === "APPROVED"
                  ? "bg-card text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              อนุมัติ ({requests.filter((r) => r.status === "APPROVED").length})
            </button>
            <button
              onClick={() => setStatusFilter("REVISE")}
              className={`px-3 py-1 rounded-sm transition-all ${
                statusFilter === "REVISE"
                  ? "bg-card text-amber-700 dark:text-amber-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ขอข้อมูลเพิ่ม ({requests.filter((r) => r.status === "REVISE").length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารุ่นสินค้า, รหัสสินค้า..."
              className="h-8 w-full sm:w-60 pl-8 text-xs"
            />
          </div>
        </div>

        {/* Requests List Cards */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
            กำลังโหลดรายการคำขอ...
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="border-border p-8 text-center text-xs text-muted-foreground">
            ไม่พบประวัติคำขอในสถานะนี้
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((r) => (
              <Card key={r.id} className="border-border shadow-xs flex flex-col justify-between">
                <CardHeader className="p-4 pb-2 border-b border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm">
                          {r.product?.model || r.productCode}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {"ขอยกเว้นสินค้า"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[260px]">
                        {r.product?.productName}
                      </p>
                    </div>

                    <RequestStatusBadge status={r.status} />
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 text-xs">
                  {/* Reason & Comments */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">เหตุผลที่ยื่น:</span>
                    <p className="font-medium text-foreground">{r.reason}</p>
                    {r.comments && (
                      <div className="text-foreground bg-muted/30 p-2.5 rounded-md border border-border mt-1 whitespace-pre-line text-xs leading-relaxed">
                        {r.comments}
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  {r.photos && r.photos.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">รูปถ่ายหลักฐาน ({r.photos.length}):</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {r.photos.map((p: any, idx: number) => (
                          <div
                            key={p.id || idx}
                            onClick={() => setSelectedPhoto(p.url)}
                            className="h-12 w-12 rounded-md border border-border overflow-hidden cursor-pointer hover:opacity-90 relative shrink-0"
                          >
                            <img src={p.url} alt="Evidence" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Review Feedback if any */}
                  {r.reviewComment && (
                    <div className="rounded-md bg-muted/50 p-2.5 border border-border space-y-0.5">
                      <span className="text-[10px] font-semibold text-foreground uppercase block">
                        ข้อความจากผู้อนุมัติ:
                      </span>
                      <p className="text-xs text-foreground font-medium">{r.reviewComment}</p>
                      {r.reviewedByName && (
                        <span className="text-[10px] text-muted-foreground block mt-1">
                          โดย: {r.reviewedByName}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer metadata & Action button */}
                  <div className="flex items-center justify-between pt-2 border-t border-border text-[11px] text-muted-foreground">
                    <span>
                      ยื่นเมื่อ: {new Date(r.requestedAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </span>

                    {r.status === "REVISE" && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenEdit(r)}
                        className="h-7 text-xs font-semibold gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>แก้ไขคำขอ</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Action Panel for Re-submitting */}
      {isDrawerOpen && (
        <ActionPanel
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          product={selectedProduct}
          branchCode={branchCode}
          onSuccess={fetchRequests}
        />
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox
          photoUrl={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        Non-Move Stock Analysis System &copy; 2026
      </footer>
    </div>
  );
}
