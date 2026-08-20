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
} from "lucide-react";

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
        r.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/${branchCode}`}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                รายการคำขอของสาขา ({branchCode})
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ติดตามประวัติและสถานะการชี้แจง / ขอยกเว้นการคิด Non-Move Stock
              </p>
            </div>
          </div>

          <button
            onClick={fetchRequests}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารหัสสินค้า, ชื่อสินค้า, เหตุผล..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="PENDING">รอการตรวจสอบ (Pending)</option>
            <option value="REVISE">ขอข้อมูลเพิ่มเติม (Revise)</option>
            <option value="APPROVED">อนุมัติแล้ว (Approved)</option>
            <option value="REJECTED">ไม่อนุมัติ (Rejected)</option>
            <option value="EXPLAINED">ชี้แจงแล้ว (Explained)</option>
          </select>
        </div>

        {/* Requests List */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span>กำลังโหลดข้อมูลคำขอ...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              ไม่พบประวัติรายการคำขอของสาขานี้
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredRequests.map((r) => {
                const isRevise = r.status === "REVISE";
                const isApproved = r.status === "APPROVED";
                const isRejected = r.status === "REJECTED";

                return (
                  <div
                    key={r.id}
                    className="p-3.5 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors space-y-3"
                  >
                    {/* Line 1: Header (ProductCode · Model | Status Badge) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2 truncate">
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm tracking-tight shrink-0">
                          {r.productCode}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {r.product?.model || "-"}
                        </span>
                        {r.product?.skuType && (
                          <span className="inline-flex items-center px-2 py-0.2 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {r.product.skuType}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0">
                        <RequestStatusBadge status={r.status} requestType={r.requestType} />
                      </div>
                    </div>

                    {/* Line 2: Reason, Comments & Photo Thumbnails */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                      {/* Reason & Comments */}
                      <div className="space-y-1 max-w-xl">
                        <div className="text-slate-800 dark:text-slate-200 flex items-start gap-1.5">
                          <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">เหตุผล:</span>
                          <span className="font-medium text-slate-900 dark:text-white">{r.reason}</span>
                        </div>
                        {r.comments && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            {r.comments}
                          </div>
                        )}
                      </div>

                      {/* Photo Thumbnails */}
                      {r.photos && r.photos.length > 0 && (
                        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                          {r.photos.map((p: any, pIdx: number) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPhoto(p.url)}
                              className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all shadow-sm shrink-0 group"
                              title={`ดูรูปที่ ${pIdx + 1}`}
                            >
                              <img src={p.url} alt="proof" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Line 3: Reviewer Comments Box (if reviewed) */}
                    {r.reviewComment && (
                      <div className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                        isApproved
                          ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200"
                          : isRejected
                          ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200"
                          : "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200"
                      }`}>
                        <div className="flex items-baseline justify-between gap-2 font-bold text-[11px]">
                          <span>ผู้อนุมัติ: {r.reviewedByName || "Admin"}</span>
                          {r.reviewedAt && (
                            <span className="font-normal opacity-80">
                              {new Date(r.reviewedAt).toLocaleDateString("th-TH")}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-medium">{r.reviewComment}</div>
                      </div>
                    )}

                    {/* Line 4: Footer (Submitted Date | Action Button) */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400 dark:text-slate-500">
                      <div>
                        ยื่นคำขอเมื่อ: <span className="font-medium text-slate-600 dark:text-slate-400">{new Date(r.requestedAt).toLocaleString("th-TH")}</span>
                      </div>

                      <div className="shrink-0">
                        {isRevise ? (
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors animate-pulse"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            แก้ไข / แนบเพิ่ม
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            ดูรายละเอียด
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox for Photo Preview */}
      <PhotoLightbox
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        photoUrl={selectedPhoto || ""}
      />

      {/* Action Drawer for Resubmission */}
      <ActionPanel
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        product={selectedProduct}
        branchCode={branchCode}
        onSuccess={() => {
          fetchRequests();
        }}
      />
    </div>
  );
}
