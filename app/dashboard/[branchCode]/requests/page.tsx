"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { RequestStatusBadge } from "@/components/RequestStatusBadge";
import { PhotoLightbox } from "@/components/PhotoLightbox";
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
} from "lucide-react";

export default function MyRequestsPage() {
  const params = useParams();
  const branchCode = params.branchCode as string;
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetch(`/api/requests?branchCode=${branchCode}`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [branchCode]);

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/${branchCode}`}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                รายการคำขอของสาขา ({branchCode})
              </h1>
              <p className="text-xs text-slate-500">
                ติดตามประวัติและสถานะการชี้แจง / ขอยกเว้นการคิด Non-Move Stock
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารหัสสินค้า, ชื่อสินค้า, เหตุผล..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="PENDING">รอการตรวจสอบ (Pending)</option>
            <option value="APPROVED">อนุมัติแล้ว (Approved)</option>
            <option value="REJECTED">ไม่อนุมัติ (Rejected)</option>
            <option value="EXPLAINED">ชี้แจงแล้ว (Explained)</option>
          </select>
        </div>

        {/* Requests List */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span>กำลังโหลดข้อมูลคำขอ...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              ไม่พบประวัติรายการคำขอของสาขานี้
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">รหัสสินค้า / ชื่อสินค้า</th>
                    <th className="py-3 px-4 font-semibold">ประเภทคำขอ</th>
                    <th className="py-3 px-4 font-semibold">เหตุผลที่ระบุ</th>
                    <th className="py-3 px-4 font-semibold">วันที่ยื่นคำขอ</th>
                    <th className="py-3 px-4 font-semibold text-center">รูปหลักฐาน</th>
                    <th className="py-3 px-4 font-semibold text-center">สถานะการพิจารณา</th>
                    <th className="py-3 px-4 font-semibold">ข้อความจากผู้อนุมัติ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-mono font-bold text-slate-900">{r.productCode}</div>
                        <div className="text-slate-800 line-clamp-1">
                          {r.product?.productName || r.productCode}
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
                          <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">
                            {r.comments}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {new Date(r.requestedAt).toLocaleString("th-TH")}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {r.photos && r.photos.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            {r.photos.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPhoto(p.photoUrl)}
                                className="relative h-8 w-8 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity"
                              >
                                <img src={p.photoUrl} alt="proof" className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <RequestStatusBadge status={r.status} requestType={r.requestType} />
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-600">
                        {r.reviewComment ? (
                          <div className="text-xs font-medium text-slate-800">
                            {r.reviewComment}
                            {r.reviewedAt && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                พิจารณาเมื่อ: {new Date(r.reviewedAt).toLocaleDateString("th-TH")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
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

      <PhotoLightbox
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        photoUrl={selectedPhoto || ""}
      />
    </div>
  );
}
