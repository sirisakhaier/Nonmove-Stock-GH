"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { RequestStatusBadge } from "@/components/RequestStatusBadge";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { FileText, Filter, RefreshCw } from "lucide-react";

export default function StoreRequestsPage() {
  const params = useParams();
  const branchCode = params.branchCode as string;

  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/requests?branchCode=${branchCode}`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error("Error fetching requests:", e);
    } finally {
      setIsLoading(false);
    }
  }, [branchCode, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar branchCode={branchCode} />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>Store Request Tracker ({branchCode})</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track submitted non-move explanations and exclusion approvals
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onClick={fetchRequests}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Product & Model</th>
                  <th className="p-3.5">Request Type</th>
                  <th className="p-3.5">Reason & Submitter</th>
                  <th className="p-3.5">Evidence Photos</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5">Reviewer Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No requests found for this store.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 pl-5 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {r.product?.productName || r.productCode}
                        </div>
                        <div className="text-[11px] text-sky-700 font-semibold">
                          Model: {r.product?.model || "-"} ({r.productCode})
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            r.requestType === "EXCLUDE"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {r.requestType}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-sm">
                        <div className="text-slate-900 font-semibold">{r.reason}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Submitted by {r.requestedBy?.name || "Staff"} on{" "}
                          {new Date(r.requestedAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {r.photos && r.photos.length > 0 ? (
                          <div className="flex items-center space-x-1">
                            {r.photos.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPhoto(p.url)}
                              >
                                <img
                                  src={p.url}
                                  alt="Proof"
                                  className="w-8 h-8 object-cover rounded border border-slate-200 hover:ring-2 hover:ring-sky-500"
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <RequestStatusBadge
                          status={r.status}
                          requestType={r.requestType}
                          reviewComment={r.reviewComment}
                        />
                      </td>

                      <td className="p-3.5 pr-5 max-w-xs">
                        {r.reviewComment ? (
                          <div className="text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="font-bold text-slate-600 block text-[10px] uppercase">
                              {r.reviewedByName || "Approver"}:
                            </span>
                            {r.reviewComment}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No comment</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PhotoLightbox
        isOpen={!!selectedPhoto}
        photoUrl={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
}
