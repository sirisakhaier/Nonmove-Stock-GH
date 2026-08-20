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
} from "lucide-react";
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

  const handleExecuteDecision = async () => {
    if (!selectedRequest || !activeDecision) return;
    if ((activeDecision === "REJECTED" || activeDecision === "REVISE") && !comment.trim()) {
      alert(activeDecision === "REVISE"
        ? "กรุณาระบุสิ่งที่ต้องการให้สาขาแก้ไขหรือแนบข้อมูลเพิ่มเติม"
        : "กรุณาระบุเหตุผลการไม่อนุมัติ");
      return;
    }
    setIsSubmitting(true);
    try {
      await onDecision(selectedRequest.id, activeDecision, comment);
      setSelectedRequest(null);
      setActiveDecision(null);
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัสสาขา, ชื่อสาขา, รหัสสินค้า, ชื่อสินค้า..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm"
        >
          <option value="ALL">ทุกภูมิภาค (Region)</option>
          {regions.map((reg) => (
            <option key={reg} value={reg}>
              {reg}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm"
        >
          <option value="PENDING">รอการตรวจสอบ (Pending)</option>
          <option value="REVISE">ขอข้อมูลเพิ่มเติม (Revise)</option>
          <option value="APPROVED">อนุมัติแล้ว (Approved)</option>
          <option value="REJECTED">ไม่อนุมัติ (Rejected)</option>
          <option value="ALL">ทุกสถานะคำขอ</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">สาขา</th>
                <th className="py-3.5 px-4 font-semibold">สินค้า</th>
                <th className="py-3.5 px-4 font-semibold">ประเภทคำขอ</th>
                <th className="py-3.5 px-4 font-semibold">เหตุผลที่ระบุ</th>
                <th className="py-3.5 px-4 font-semibold text-center">รูปหลักฐาน</th>
                <th className="py-3.5 px-4 font-semibold text-center">สถานะ</th>
                <th className="py-3.5 px-4 font-semibold text-center">เปิดดูรายละเอียด / พิจารณา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    ไม่พบรายการคำขอในสถานะที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleOpenDetail(r)}
                    className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">{r.branchCode}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.store?.storeNameCust || r.branchCode}</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{r.store?.region || "OTHER"}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{r.productCode}</div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {r.product?.productName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        รุ่น: {r.product?.model || "-"}
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
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{r.reason}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        ยื่นเมื่อ: {new Date(r.requestedAt).toLocaleString("th-TH")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {r.photos && r.photos.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          {r.photos.slice(0, 2).map((p) => (
                            <div
                              key={p.id}
                              className="relative h-8 w-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                            >
                              <img src={p.url} alt="proof" className="h-full w-full object-cover" />
                            </div>
                          ))}
                          {r.photos.length > 2 && (
                            <span className="text-[10px] font-bold text-slate-500">+{r.photos.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <RequestStatusBadge status={r.status} requestType={r.requestType} />
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(r);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        ดูรายละเอียด
                      </button>
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

      {/* Full Detail & Decision Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 font-mono">
                    {selectedRequest.branchCode}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedRequest.store?.storeNameCust}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ภูมิภาค: {selectedRequest.store?.region} {selectedRequest.store?.province ? `(จ.${selectedRequest.store.province})` : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Product & Request Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Info Box */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ข้อมูลสินค้า</span>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedRequest.product?.productName}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono">
                  <div>รหัสสินค้า: <strong className="text-indigo-600 dark:text-indigo-400">{selectedRequest.productCode}</strong></div>
                  <div>รุ่น: {selectedRequest.product?.model || "-"}</div>
                  <div>หมวดหมู่: {selectedRequest.product?.category || "-"}</div>
                </div>
              </div>

              {/* Submitter Info Box */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ผู้ยื่นคำขอ</span>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <User className="h-4 w-4 text-slate-400" />
                  {selectedRequest.requestedBy?.name || "พนักงานสาขา"}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {selectedRequest.requestedBy?.phone || "-"}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {new Date(selectedRequest.requestedAt).toLocaleString("th-TH")}
                </div>
              </div>
            </div>

            {/* Request Reason & Description */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">เหตุผลและการชี้แจง</span>
                <RequestStatusBadge status={selectedRequest.status} requestType={selectedRequest.requestType} />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedRequest.reason}
              </div>
              {selectedRequest.comments && (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedRequest.comments}
                </p>
              )}
            </div>

            {/* Photo Gallery */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                รูปถ่ายหลักฐาน ({selectedRequest.photos?.length || 0} รูป) - คลิกเพื่อดูภาพขยาย
              </span>
              {selectedRequest.photos && selectedRequest.photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {selectedRequest.photos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPhoto(p.url)}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square hover:ring-2 hover:ring-indigo-500 transition-all shadow-sm"
                    >
                      <img src={p.url} alt="evidence" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye className="h-5 w-5" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  ไม่มีรูปถ่ายแนบมาในคำขอนี้
                </div>
              )}
            </div>

            {/* Approver Action Panel with 3 Choices */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                ผลการพิจารณาคำขอ (Approver Decision)
              </span>

              {/* 3 Decision Choice Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveDecision("APPROVED")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all ${
                    activeDecision === "APPROVED"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400"
                      : "border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  1. อนุมัติ (Approve)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDecision("REVISE")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all ${
                    activeDecision === "REVISE"
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400"
                      : "border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100"
                  }`}
                >
                  <RefreshCw className="h-4 w-4" />
                  2. ขอข้อมูลเพิ่ม (Revise)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDecision("REJECTED")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all ${
                    activeDecision === "REJECTED"
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400"
                      : "border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 hover:bg-rose-100"
                  }`}
                >
                  <X className="h-4 w-4" />
                  3. ไม่อนุมัติ (Reject)
                </button>
              </div>

              {/* Feedback Note Input */}
              {activeDecision && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {activeDecision === "APPROVED" && "ความคิดเห็นเพิ่มเติม (ถ้ามี)"}
                    {activeDecision === "REVISE" && "ระบุสิ่งที่ต้องการให้สาขาแก้ไขหรือแนบรูปเพิ่มเติม *" }
                    {activeDecision === "REJECTED" && "ระบุเหตุผลการไม่อนุมัติ *" }
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      activeDecision === "REVISE"
                        ? "เช่น ขอรูปถ่ายป้ายแสดงราคาสินค้าเพิ่มเติม หรือใบเสร็จมัดจำที่ชัดเจน..."
                        : activeDecision === "REJECTED"
                        ? "ระบุเหตุผลการไม่อนุมัติ..."
                        : "ระบุข้อคิดเห็น (ถ้ามี)..."
                    }
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveDecision(null)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteDecision}
                      disabled={isSubmitting}
                      className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all ${
                        activeDecision === "APPROVED"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : activeDecision === "REVISE"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {isSubmitting ? "กำลังบันทึก..." : "บันทึกผลการพิจารณา"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
