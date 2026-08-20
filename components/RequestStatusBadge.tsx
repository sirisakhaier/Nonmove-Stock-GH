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
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700 ${className}`}>
        ยังไม่มีคำขอ
      </span>
    );
  }

  switch (status) {
    case "PENDING":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/70 shadow-sm ${className}`}>
          <Clock className="h-3 w-3 animate-pulse text-amber-600 dark:text-amber-400" />
          รอการตรวจสอบ
        </span>
      );
    case "APPROVED":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/70 shadow-sm ${className}`}>
          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          อนุมัติแล้ว (ยกเว้น)
        </span>
      );
    case "REJECTED":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700/70 shadow-sm ${className}`}>
          <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
          ไม่อนุมัติ
        </span>
      );
    case "REVISE":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-600/80 animate-pulse shadow-sm ${className}`}>
          <RefreshCw className="h-3 w-3 text-amber-700 dark:text-amber-300" />
          ขอข้อมูลเพิ่ม (รอสาขาแก้ไข)
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700 ${className}`}>
          {status}
        </span>
      );
  }
}
