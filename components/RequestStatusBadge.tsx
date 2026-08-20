import React from "react";
import { Clock, CheckCircle2, XCircle, FileText } from "lucide-react";

interface BadgeProps {
  status?: string | null;
  requestType?: string | null;
  className?: string;
}

export function RequestStatusBadge({ status, requestType, className = "" }: BadgeProps) {
  if (!status) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
        ยังไม่มีคำขอ
      </span>
    );
  }

  const typeLabel = requestType === "EXCLUDE" ? "ขอยกเว้น" : "ชี้แจง";

  switch (status) {
    case "PENDING":
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          <Clock className="h-3 w-3 animate-pulse" />
          รอการตรวจสอบ ({typeLabel})
        </span>
      );
    case "APPROVED":
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <CheckCircle2 className="h-3 w-3" />
          อนุมัติแล้ว ({typeLabel})
        </span>
      );
    case "REJECTED":
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          <XCircle className="h-3 w-3" />
          ไม่อนุมัติ ({typeLabel})
        </span>
      );
    case "EXPLAINED":
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          <FileText className="h-3 w-3" />
          บันทึกคำชี้แจงแล้ว
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          {status}
        </span>
      );
  }
}
