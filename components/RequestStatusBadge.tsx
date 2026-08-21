"use client";

import React from "react";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RequestStatusBadgeProps {
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISE" | "EXPLAINED" | string;
  className?: string;
}

export function RequestStatusBadge({ status, className = "" }: RequestStatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="warning" className={`gap-1 font-medium ${className}`}>
          <Clock className="h-3 w-3" />
          <span>รอพิจารณา</span>
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="success" className={`gap-1 font-medium ${className}`}>
          <CheckCircle2 className="h-3 w-3" />
          <span>อนุมัติแล้ว</span>
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive" className={`gap-1 font-medium ${className}`}>
          <XCircle className="h-3 w-3" />
          <span>ไม่อนุมัติ</span>
        </Badge>
      );
    case "REVISE":
      return (
        <Badge variant="warning" className={`gap-1 font-medium ${className}`}>
          <AlertCircle className="h-3 w-3" />
          <span>ขอข้อมูลเพิ่ม</span>
        </Badge>
      );
    case "EXPLAINED":
      return (
        <Badge variant="secondary" className={`gap-1 font-medium ${className}`}>
          <CheckCircle2 className="h-3 w-3" />
          <span>ชี้แจงแล้ว</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`gap-1 font-medium ${className}`}>
          <span>{status}</span>
        </Badge>
      );
  }
}
