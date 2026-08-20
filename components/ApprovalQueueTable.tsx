"use client";

import React, { useState } from "react";
import { Check, X, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { PhotoLightbox } from "./PhotoLightbox";

interface ApprovalQueueTableProps {
  requests: any[];
  onRefresh: () => void;
  passcode: string;
}

export const ApprovalQueueTable: React.FC<ApprovalQueueTableProps> = ({
  requests,
  onRefresh,
  passcode,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeActionReq, setActiveActionReq] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("Regional Approver");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAction = async () => {
    if (actionType === "REJECTED" && !comment.trim()) {
      setErrorMsg("A rejection comment is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/requests/${activeActionReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionType,
          reviewComment: comment,
          reviewedByName: reviewerName,
          passcode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update request");
      }

      setActiveActionReq(null);
      setComment("");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5 pl-5">Store & Region</th>
              <th className="p-3.5">Product & Model</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Requester & Reason</th>
              <th className="p-3.5">Photos</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 pr-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No requests found matching your filter criteria.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 pl-5">
                    <div className="font-bold text-slate-900">{r.branchCode}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.store?.storeNameCust || r.store?.region}
                    </div>
                  </td>

                  <td className="p-3.5 max-w-xs">
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
                    <div className="text-slate-800 font-semibold">{r.reason}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      By {r.requestedBy?.name || "Staff"} ({r.requestedBy?.phone || "-"}) ·{" "}
                      {new Date(r.requestedAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="p-3.5">
                    {r.photos && r.photos.length > 0 ? (
                      <div className="flex items-center space-x-1.5">
                        {r.photos.map((p: any) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPhoto(p.url)}
                            className="relative group"
                          >
                            <img
                              src={p.url}
                              alt="Proof"
                              className="w-9 h-9 object-cover rounded border border-slate-200 hover:ring-2 hover:ring-sky-500 transition"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No photos</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <RequestStatusBadge
                      status={r.status}
                      requestType={r.requestType}
                      reviewComment={r.reviewComment}
                    />
                  </td>

                  <td className="p-3.5 pr-5 text-center">
                    {r.status === "PENDING" ? (
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setActiveActionReq(r);
                            setActionType("APPROVED");
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveActionReq(r);
                            setActionType("REJECTED");
                          }}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Decided</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Decision Modal */}
      {activeActionReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {actionType === "APPROVED" ? "✅ Approve Request" : "❌ Reject Request"}
              </h3>
              <button onClick={() => setActiveActionReq(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                <strong>Store:</strong> {activeActionReq.branchCode}
              </p>
              <p>
                <strong>Product:</strong> {activeActionReq.product?.productName} ({activeActionReq.productCode})
              </p>
              <p>
                <strong>Requester Reason:</strong> {activeActionReq.reason}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reviewer Name</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Review Comment {actionType === "REJECTED" ? "(Required)" : "(Optional)"}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  actionType === "APPROVED"
                    ? "e.g. Approved exception for showroom display unit."
                    : "e.g. Stock still marketable, please reposition to main promotion display."
                }
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setActiveActionReq(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition ${
                  actionType === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmitting ? "Processing..." : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <PhotoLightbox
        isOpen={!!selectedPhoto}
        photoUrl={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
};
