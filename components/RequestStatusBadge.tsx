import React from "react";
import { Clock, CheckCircle2, XCircle, FileText, AlertCircle, RefreshCw } from "lucide-react";

interface BadgeProps {
  status?: string | null;
  requestType?: string | null;
  className?: string;
}

export function RequestStatusBadge({ status, requestType, className = "" }: BadgeProps) {
  if (!status) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${className}`}>
        ยังไม่มีคำขอ
      </span>
    );
  }

  const typeLabel = requestType === "EXCLUDE" ? "ขอยกเว้น" : "ชี้แจง";

  switch (status) {
    case "PENDING":
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${className}`}>
          <Clock className="h-3 w-3 animate-pulse" />
          รอการตรวจสอบ ({typeLabel})
        </span>
      );
    case "APPROVED":
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${className}`}>
          <CheckCircle2 className="h-3 w-3" />
          อนุมัติแล้ว ({typeLabel})
        </span>
      );
    case "REJECTED":
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}>
          <XCircle className="h-3 w-3" />
          ไม่อนุมัติ ({typeLabel})
        </span>
      );
    case "REVISE":
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse ${className}`}>
          <RefreshCw className="h-3 w-3" />
          ขอข้อมูลเพิ่มเติม (รอสาขาแก้ไข)
        </span>
      );
    case "EXPLAINED":
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 ${className}`}>
          <FileText className="h-3 w-3" />
          บันทึกคำชี้แจงแล้ว
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}>
          {status}
        </span>
      );
  }
}
