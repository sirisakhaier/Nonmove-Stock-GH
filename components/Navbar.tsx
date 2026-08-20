"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  FileSpreadsheet,
  LogOut,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { TEAM_NAME } from "@/lib/version";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [storeInfo, setStoreInfo] = useState<{ branchCode?: string; branchName?: string; userName?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nonmove_user_session");
      if (stored) {
        setStoreInfo(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, [pathname]);

  const handleExit = () => {
    localStorage.removeItem("nonmove_user_session");
    document.cookie = "user_session=; path=/; max-age=0;";
    router.push("/");
  };

  const branchCode = storeInfo?.branchCode;
  const isViewerPage = pathname.startsWith("/viewer");
  const isAdminPage = pathname.startsWith("/admin");
  const isRootPage = pathname === "/";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand with Haier Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Haier"
              className="h-9 w-auto object-contain rounded-lg shadow-sm"
            />
            <div className="hidden sm:block">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight block">
                Non-Move Stock Analysis
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                {TEAM_NAME}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 text-sm font-medium">
          {branchCode && !isViewerPage && !isAdminPage && (
            <>
              <Link
                href={`/dashboard/${branchCode}`}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  pathname.startsWith("/dashboard/") && !pathname.includes("/requests")
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Store className="h-4 w-4" />
                แดชบอร์ดสาขา
              </Link>
              <Link
                href={`/dashboard/${branchCode}/requests`}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  pathname.includes("/requests")
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                รายการคำขอของฉัน
              </Link>
            </>
          )}

          {isViewerPage && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                ภาพรวมผู้บริหาร (Viewer)
              </span>
            </div>
          )}

          {isAdminPage && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                จัดการระบบ (Admin)
              </span>
            </div>
          )}
        </nav>

        {/* Right Info / Actions, ThemeToggle & Always-visible EXIT Button */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle with text */}
          <ThemeToggle />

          {/* User Session Info if logged in */}
          {storeInfo?.branchCode && !isViewerPage && !isAdminPage && (
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {storeInfo.branchName || storeInfo.branchCode}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {storeInfo.userName ? `ผู้ใช้งาน: ${storeInfo.userName}` : storeInfo.branchCode}
              </div>
            </div>
          )}

          {/* Prominent Exit Button (Top of every page) */}
          {!isRootPage && (
            <button
              onClick={handleExit}
              title="ออกจากระบบ / กลับหน้าแรก"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 shadow-sm hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ออก (Exit)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
