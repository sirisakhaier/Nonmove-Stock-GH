"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
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

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const reviseCount = requests.filter((r) => r.status === "REVISE").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const handleExportHistoryCsv = () => {
    if (!filteredRequests.length) return;
    const headers = [
      "BranchCode",
      "StoreName",
      "Region",
      "ProductCode",
      "ProductName",
      "Model",
      "Category",
      "Reason",
      "Comments",
      "RequestedByName",
      "RequestedPhone",
      "RequestedAt",
      "Status",
      "ReviewedByName",
      "StatusDate",
      "ReviewComment",
      "PhotoCount",
    ];
    const rows = filteredRequests.map((r) => [
      `="${r.branchCode}"`,
      `"${(r.store?.storeNameCust || "").replace(/"/g, "")}"`,
      `"${r.store?.region || ""}"`,
      `"${r.productCode}"`,
      `"${(r.product?.productName || "").replace(/"/g, "")}"`,
      `"${(r.product?.model || "").replace(/"/g, "")}"`,
      `"${r.product?.category || ""}"`,
      `"${(r.reason || "").replace(/"/g, "")}"`,
      `"${(r.comments || "").replace(/"/g, "")}"`,
      `"${(r.requestedBy?.name || "").replace(/"/g, "")}"`,
      `"${r.requestedBy?.phone || ""}"`,
      new Date(r.requestedAt).toLocaleString("th-TH"),
      r.status,
      r.reviewedByName || "-",
      r.reviewedAt ? new Date(r.reviewedAt).toLocaleString("th-TH") : "-",
      `"${(r.reviewComment || "").replace(/"/g, "")}"`,
      r.photos?.length || 0,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NonMove_Request_History_Logs_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 1. Status Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "PENDING"
              ? "border-amber-400 bg-amber-50/80 dark:bg-amber-950/40 shadow-sm"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">
            <span>รอการตรวจสอบ</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-2">
            {formatNumber(pendingCount)}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">รายการที่รอพิจารณา</div>
        </div>

        <div
          onClick={() => setStatusFilter("REVISE")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "REVISE"
              ? "border-amber-500 bg-amber-100/80 dark:bg-amber-900/40 shadow-sm"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">
            <span>ขอข้อมูลเพิ่ม (Revise)</span>
            <RefreshCw className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-2">
            {formatNumber(reviseCount)}
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">รอสาขาแก้ไข/แนบเพิ่ม</div>
        </div>

        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "APPROVED"
              ? "border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-sm"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
            <span>อนุมัติแล้ว (Approved)</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-2">
            {formatNumber(approvedCount)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">ปลดล็อคสำเร็จ</div>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "REJECTED"
              ? "border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 shadow-sm"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300 uppercase">
            <span>ไม่อนุมัติ (Rejected)</span>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-rose-800 dark:text-rose-200 mt-2">
            {formatNumber(rejectedCount)}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">คำขอที่ไม่ผ่านเกณฑ์</div>
        </div>
      </div>

      {/* 2. Search & Filter Toolbar */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              ประวัติและสถานะคำขอทั้งหมด (All Request History & Status Logs)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ตรวจสอบ Audit Trail, วันที่เปลี่ยนสถานะ, ผู้พิจารณา และข้อคิดเห็นทั้งหมด ({formatNumber(filteredRequests.length)} รายการ)
            </p>
          </div>

          <button
            onClick={handleExportHistoryCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <Download className="h-4 w-4" />
            ส่งออกประวัติ CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาสาขา, รหัสสินค้า, ชื่อผู้ยื่น, ผู้อนุมัติ..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm"
          >
            <option value="ALL">ทุกสถานะคำขอ ({requests.length})</option>
            <option value="PENDING">รอการตรวจสอบ ({pendingCount})</option>
            <option value="REVISE">ขอข้อมูลเพิ่ม (Revise) ({reviseCount})</option>
            <option value="APPROVED">อนุมัติแล้ว ({approvedCount})</option>
            <option value="REJECTED">ไม่อนุมัติ ({rejectedCount})</option>
          </select>

          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm"
          >
            <option value="ALL">ทุกภูมิภาค</option>
            {regions.map((reg) => (
              <option key={reg} value={reg}>ภาค {reg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Detailed History Logs Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold">สาขา</th>
                <th className="py-3.5 px-4 font-bold">สินค้า / รุ่น</th>
                <th className="py-3.5 px-4 font-bold">เหตุผล & รายละเอียด</th>
                <th className="py-3.5 px-4 font-bold">ผู้ยื่น & วันที่ยื่น</th>
                <th className="py-3.5 px-4 font-bold text-center">สถานะปัจจุบัน</th>
                <th className="py-3.5 px-4 font-bold">ผู้อนุมัติ & วันที่ตัดสิน</th>
                <th className="py-3.5 px-4 font-bold">ข้อคิดเห็นผู้อนุมัติ</th>
                <th className="py-3.5 px-4 font-bold text-center">รูปหลักฐาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    ไม่พบรายการประวัติคำขอที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                    {/* Branch */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{r.branchCode}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.store?.storeNameCust || r.branchCode}</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{r.store?.region}</div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{r.productCode}</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{r.product?.productName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">รุ่น: {r.product?.model || "-"}</div>
                    </td>

                    {/* Reason & Comments */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{r.reason}</div>
                      {r.comments ? (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          {r.comments}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 mt-0.5">ไม่มีคำอธิบายเพิ่มเติม</div>
                      )}
                    </td>

                    {/* Requester & Requested Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {r.requestedBy?.name || "พนักงานสาขา"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {r.requestedBy?.phone || "-"}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(r.requestedAt).toLocaleString("th-TH")}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <RequestStatusBadge status={r.status} requestType={r.requestType} />
                    </td>

                    {/* Reviewer & Status Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.reviewedByName || "-"}
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                        {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString("th-TH") : "รอดำเนินการ"}
                      </div>
                    </td>

                    {/* Reviewer Comments */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {r.reviewComment ? (
                        <div className={`text-[11px] p-2 rounded-xl border ${
                          r.status === "REVISE"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800"
                            : r.status === "REJECTED"
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                        }`}>
                          {r.reviewComment}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Evidence Photos */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {r.photos && r.photos.length > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {r.photos.map((p, pIdx) => (
                            <button
                              key={p.id || pIdx}
                              type="button"
                              onClick={() => setSelectedPhoto(p.url)}
                              className="relative h-8 w-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:ring-2 hover:ring-indigo-500 transition-all"
                            >
                              <img src={p.url} alt="evidence" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">ไม่มีรูปภาพ</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox for Photo Fullscreen Preview */}
      <PhotoLightbox
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        photoUrl={selectedPhoto || ""}
      />
    </div>
  );
}
