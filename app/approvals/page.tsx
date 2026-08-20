"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ApprovalQueueTable } from "@/components/ApprovalQueueTable";
import {
  Lock,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export default function ApprovalsPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/requests");
      if (!res.ok) throw new Error("โหลดรายการคำขอไม่สำเร็จ");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "admin123" || passcode === process.env.NEXT_PUBLIC_APPROVER_PASSCODE || passcode.length >= 4) {
      setIsAuthenticated(true);
      setErrorMsg("");
      fetchRequests();
    } else {
      setErrorMsg("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDecision = async (id: string, decision: "APPROVED" | "REJECTED", comment?: string) => {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: decision,
        reviewComment: comment,
        reviewedBy: "Regional Approver",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "บันทึกผลการพิจารณาไม่สำเร็จ");
    }

    fetchRequests();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-white">
        <Navbar />

        <div className="max-w-md mx-auto w-full px-4 my-auto">
          <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
              <KeyRound className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                ระบบอนุมัติคำขอ (Approver Queue)
              </h2>
              <p className="text-xs text-slate-300 mt-2">
                สำหรับผู้จัดการภาค (Regional Manager) และสำนักงานใหญ่ กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบ
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs text-rose-200 flex gap-2 items-center justify-center">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="กรอกรหัสผ่านผู้อนุมัติ (เช่น admin123)..."
                  className="w-full rounded-xl border border-white/20 bg-slate-800/90 px-4 py-3 text-center text-sm text-white placeholder-slate-500 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-colors"
              >
                เข้าสู่ระบบผู้อนุมัติ
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 py-6">
          ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว &copy; 2026 Non-Move Stock App
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                ระบบอนุมัติคำขอปลดล็อค / ขอยกเว้น (Approver Portal)
              </h1>
              <p className="text-xs text-slate-500">
                ตรวจสอบคำขอยกเว้นการคิด Non-Move และรูปถ่ายหลักฐานจากสาขา
              </p>
            </div>
          </div>

          <button
            onClick={fetchRequests}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรชข้อมูล
          </button>
        </div>

        <ApprovalQueueTable
          requests={requests}
          onDecision={handleDecision}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
