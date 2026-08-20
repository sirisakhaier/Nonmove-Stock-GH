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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">รหัสสินค้า / รุ่น (Model)</th>
                    <th className="py-3.5 px-4 font-semibold">ประเภทคำขอ</th>
                    <th className="py-3.5 px-4 font-semibold">เหตุผลที่ระบุ</th>
                    <th className="py-3.5 px-4 font-semibold">วันที่ยื่นคำขอ</th>
                    <th className="py-3.5 px-4 font-semibold text-center">รูปหลักฐาน</th>
                    <th className="py-3.5 px-4 font-semibold text-center">สถานะการพิจารณา</th>
                    <th className="py-3.5 px-4 font-semibold">ข้อความจากผู้อนุมัติ</th>
                    <th className="py-3.5 px-4 font-semibold text-center">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{r.productCode}</div>
                        <div className="text-slate-800 dark:text-slate-200 font-mono font-semibold text-xs">
                          {r.product?.model || "-"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          r.requestType === "EXCLUDE"
                            ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                            : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        }`}>
                          {r.requestType === "EXCLUDE" ? "ขอยกเว้น (Exclusion)" : "ชี้แจง (Explain)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 dark:text-white">{r.reason}</div>
                        {r.comments && (
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                            {r.comments}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {new Date(r.requestedAt).toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {r.photos && r.photos.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            {r.photos.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPhoto(p.url)}
                                className="relative h-8 w-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                              >
                                <img src={p.url} alt="proof" className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <RequestStatusBadge status={r.status} requestType={r.requestType} />
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-slate-600 dark:text-slate-300">
                        {r.reviewComment ? (
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-2 rounded-xl">
                            {r.reviewComment}
                            {r.reviewedAt && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                พิจารณาเมื่อ: {new Date(r.reviewedAt).toLocaleDateString("th-TH")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {r.status === "REVISE" ? (
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
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            ดูคำขอ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
