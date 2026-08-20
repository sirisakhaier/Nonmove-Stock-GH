import React from "react";
import { Clock, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface RequestStatusBadgeProps {
  status?: "PENDING" | "APPROVED" | "REJECTED" | null;
  requestType?: "EXPLAIN" | "EXCLUDE" | null;
  reviewComment?: string | null;
}

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({
  status,
  requestType,
  reviewComment,
}) => {
  if (!status) {
    return (
      <span className="inline-flex items-center space-x-1 text-xs text-slate-400 font-medium">
        <MinusCircle className="w-3.5 h-3.5" />
        <span>No request</span>
      </span>
    );
  }

  if (status === "PENDING") {
    return (
      <span
        className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
        title="Pending review by regional manager"
      >
        <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
        <span>Pending ({requestType || "Review"})</span>
      </span>
    );
  }

  if (status === "APPROVED") {
    return (
      <span
        className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
        title={reviewComment ? `Approved: ${reviewComment}` : "Approved by Approver"}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Approved ({requestType || "Exclusion"})</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
      title={reviewComment ? `Rejected: ${reviewComment}` : "Rejected"}
    >
      <XCircle className="w-3 h-3 text-rose-600" />
      <span>Rejected ({requestType || "Request"})</span>
    </span>
  );
};
