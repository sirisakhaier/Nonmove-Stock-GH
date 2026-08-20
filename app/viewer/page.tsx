"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ExecutiveViewerDashboard } from "@/components/ExecutiveViewerDashboard";
import { KeyRound, AlertCircle } from "lucide-react";

export default function ViewerOverviewPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("viewer_passcode");
    if (saved === "viewer1234") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleUnlockViewer = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "viewer1234") {
      localStorage.setItem("viewer_passcode", passcode);
      setIsAuthenticated(true);
      setPasscodeError("");
    } else {
      setPasscodeError("รหัสผ่านไม่ถูกต้อง");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-white transition-colors">
        <Navbar />

        <div className="max-w-md mx-auto w-full px-4 my-auto">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <KeyRound className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ภาพรวมผู้บริหาร (Executive Viewer)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                สำหรับผู้บริหาร กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
              </p>
            </div>

            {passcodeError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockViewer} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="กรอกรหัสผ่าน..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors"
              >
                เข้าสู่ภาพรวมผู้บริหาร
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
          ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว &copy; 2026 Non-Move Stock App
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExecutiveViewerDashboard />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว &copy; 2026 Non-Move Stock App
      </footer>
    </div>
  );
}
