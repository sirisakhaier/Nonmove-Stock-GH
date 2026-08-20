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
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPLAINED";
  reviewComment?: string | null;
  reviewedBy?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  store: {
    branchCode: string;
    storeNameCust: string;
    region: string;
  };
  product: {
    productCode: string;
    productName: string;
    model?: string | null;
    category?: string | null;
  };
  photos: {
    id: string;
    photoUrl: string;
  }[];
}

interface ApprovalQueueProps {
  requests: SkuRequestItem[];
  onDecision: (id: string, decision: "APPROVED" | "REJECTED", comment?: string) => Promise<void>;
  isLoading: boolean;
}

export function ApprovalQueueTable({ requests, onDecision, isLoading }: ApprovalQueueProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<{ id: string; decision: "APPROVED" | "REJECTED" } | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");

  const regions = Array.from(new Set(requests.map((r) => r.store.region))).filter(Boolean);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (regionFilter !== "ALL" && r.store.region !== regionFilter) return false;
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

  const handleConfirmDecision = async () => {
    if (!activeModal) return;
    if (activeModal.decision === "REJECTED" && !comment.trim()) {
      alert("กรุณาระบุเหตุผลการไม่อนุมัติ");
      return;
    }
    setIsSubmitting(true);
    try {
      await onDecision(activeModal.id, activeModal.decision, comment);
      setActiveModal(null);
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัสสาขา, ชื่อสาขา, รหัสสินค้า, ชื่อสินค้า..."
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm"
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
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm"
        >
          <option value="PENDING">รอการตรวจสอบ (Pending)</option>
          <option value="APPROVED">อนุมัติแล้ว (Approved)</option>
          <option value="REJECTED">ไม่อนุมัติ (Rejected)</option>
          <option value="ALL">ทุกสถานะ</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">สาขา</th>
                <th className="py-3 px-4 font-semibold">สินค้า</th>
                <th className="py-3 px-4 font-semibold">ประเภทคำขอ</th>
                <th className="py-3 px-4 font-semibold">เหตุผล / รายละเอียด</th>
                <th className="py-3 px-4 font-semibold text-center">รูปหลักฐาน</th>
                <th className="py-3 px-4 font-semibold text-center">สถานะ</th>
                <th className="py-3 px-4 font-semibold text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    ไม่พบรายการคำขอในสถานะที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{r.branchCode}</div>
                      <div className="text-[11px] text-slate-500">{r.store.storeNameCust}</div>
                      <div className="text-[10px] text-blue-600 font-semibold">{r.store.region}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-mono font-bold text-slate-900">{r.productCode}</div>
                      <div className="font-medium text-slate-800 line-clamp-1">
                        {r.product?.productName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        รุ่น: {r.product?.model || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        r.requestType === "EXCLUDE"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {r.requestType === "EXCLUDE" ? "ขอยกเว้น (Exclusion)" : "ชี้แจง (Explain)"}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900">{r.reason}</div>
                      {r.comments && (
                        <div className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                          {r.comments}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        ยื่นเมื่อ: {new Date(r.requestedAt).toLocaleString("th-TH")}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {r.photos && r.photos.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          {r.photos.map((p, idx) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPhoto(p.photoUrl)}
                              className="relative h-9 w-9 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity"
                            >
                              <img src={p.photoUrl} alt="proof" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <RequestStatusBadge status={r.status} requestType={r.requestType} />
                      {r.reviewComment && (
                        <div className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate mx-auto">
                          เหตุผล: {r.reviewComment}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {r.status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveModal({ id: r.id, decision: "APPROVED" })}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => setActiveModal({ id: r.id, decision: "REJECTED" })}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            ไม่อนุมัติ
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">ดำเนินการแล้ว</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox for Photo Preview */}
      <PhotoLightbox
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        photoUrl={selectedPhoto || ""}
      />

      {/* Decision Confirmation Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${
                activeModal.decision === "APPROVED" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              }`}>
                {activeModal.decision === "APPROVED" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {activeModal.decision === "APPROVED" ? "ยืนยันการอนุมัติคำขอ" : "ยืนยันการปฏิเสธคำขอ"}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              {activeModal.decision === "APPROVED"
                ? "เมื่ออนุมัติ สินค้านี้จะถูกยกเว้นจากการคำนวณ Non-Move Stock ของสาขา"
                : "กรุณาระบุเหตุผลการไม่อนุมัติเพื่อให้สาขาทราบและปรับปรุงข้อมูล"
              }
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ความคิดเห็นของผู้ตรวจสอบ {activeModal.decision === "REJECTED" && <span className="text-rose-500">* (จำเป็น)</span>}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="ระบุข้อความหรือคำแนะนำถึงสาขา..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setComment(""); }}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={isSubmitting}
                className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors ${
                  activeModal.decision === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmitting ? "กำลังบันทึก..." : "ยืนยันผลการพิจารณา"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
