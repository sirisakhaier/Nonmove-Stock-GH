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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    if (passcode === "admin1234" || passcode === "admin123" || passcode === process.env.NEXT_PUBLIC_APPROVER_PASSCODE) {
      setIsAuthenticated(true);
      setErrorMsg("");
      fetchRequests();
    } else {
      setErrorMsg("รหัสผ่านไม่ถูกต้อง");
    }
  };

  const handleDecision = async (id: string, decision: "APPROVED" | "REJECTED" | "REVISE", comment?: string) => {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: decision,
        reviewComment: comment,
        reviewedByName: "Regional Approver",
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
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between transition-colors">
        <Navbar />

        <div className="max-w-sm mx-auto w-full px-4 my-auto">
          <Card className="border-border shadow-xs p-6 text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <KeyRound className="h-6 w-6" />
            </div>

            <div>
              <CardTitle className="text-lg font-bold">
                ศูนย์พิจารณาคำขอ (Approver Portal)
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                สำหรับผู้อนุมัติ กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
              </CardDescription>
            </div>

            {errorMsg && (
              <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-3.5">
              <Input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="กรอกรหัสผ่าน..."
                className="text-center"
                autoFocus
              />

              <Button type="submit" className="w-full font-semibold">
                เข้าสู่ระบบพิจารณาคำขอ
              </Button>
            </form>
          </Card>
        </div>

        <div className="text-center text-xs text-muted-foreground py-6">
          Non-Move Stock Management &copy; 2026
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 sm:p-5 rounded-lg shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                ระบบพิจารณาคำขอ (Request Approvals)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                ตรวจสอบหลักฐานและพิจารณาอนุมัติคำขอยกเว้นการคิดสต๊อกสินค้าไม่เคลื่อนไหว
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            className="h-8 text-xs font-semibold gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>รีเฟรชข้อมูล</span>
          </Button>
        </div>

        <ApprovalQueueTable
          requests={requests}
          onDecision={handleDecision}
          isLoading={isLoading}
        />
      </main>

      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        Non-Move Stock Management &copy; 2026
      </footer>
    </div>
  );
}
